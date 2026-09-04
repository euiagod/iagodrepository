import { Router } from 'express'
import { z } from 'zod'
import { pool } from '../db/pool.js'
import { validateBody } from '../lib/validate.js'
import { attachUserIfPresent, requireAuth } from '../middleware/auth.js'
import { paramStr } from '../lib/params.js'

export const carsRouter = Router()

const carSchema = z.object({
  nickname: z.string().trim().min(1).max(60),
  brand: z.string().trim().min(1).max(40),
  model: z.string().trim().min(1).max(40),
  year: z.number().int().min(1950).max(2100),
  drivetrain: z.enum(['dianteira', 'traseira', '4x4']),
  aspiration: z.enum(['aspirado', 'turbo', 'supercharger', 'turbo+supercharger', 'eletrico']),
  engine: z.string().trim().max(60).optional(),
  displacement: z.string().trim().max(30).optional(),
  gearbox: z.string().trim().max(40).optional(),
  suspension: z.enum(['original', 'coilover', 'a ar', 'rebaixamento fixo', 'competicao']),
  suspensionDetail: z.string().trim().max(60).optional(),
  wheels: z.string().trim().max(60).optional(),
  tires: z.string().trim().max(60).optional(),
  brakes: z.string().trim().max(60).optional(),
  hp: z.number().int().min(0).max(5000).optional(),
  whp: z.number().int().min(0).max(5000).optional(),
  torqueKgfm: z.number().min(0).max(500).optional(),
  boostBar: z.number().min(0).max(10).optional(),
  fuel: z.string().trim().max(30).optional(),
  ecu: z.string().trim().max(40).optional(),
  stage: z.string().trim().max(20).optional(),
  buildStatus: z.enum(['original', 'em construcao', 'pronto para pista', 'show car']).optional(),
  isPrimary: z.boolean().optional(),
  coverUrl: z.string().max(500).optional(),
  mods: z
    .array(
      z.object({
        category: z.enum(['motor', 'suspensao', 'freios', 'rodas', 'aerodinamica', 'seguranca', 'eletronica']),
        label: z.string().trim().min(1).max(40),
      }),
    )
    .max(20)
    .optional(),
})

function toPublicCar(row: Record<string, unknown>) {
  return {
    id: row.id,
    ownerId: row.owner_id,
    nickname: row.nickname,
    brand: row.brand,
    model: row.model,
    year: row.year,
    drivetrain: row.drivetrain,
    aspiration: row.aspiration,
    engine: row.engine,
    displacement: row.displacement,
    gearbox: row.gearbox,
    suspension: row.suspension,
    suspensionDetail: row.suspension_detail,
    wheels: row.wheels,
    tires: row.tires,
    brakes: row.brakes,
    hp: row.hp,
    whp: row.whp,
    torqueKgfm: row.torque_kgfm !== null ? Number(row.torque_kgfm) : null,
    boostBar: row.boost_bar !== null ? Number(row.boost_bar) : null,
    fuel: row.fuel,
    ecu: row.ecu,
    stage: row.stage,
    buildStatus: row.build_status,
    isPrimary: row.is_primary,
    coverUrl: row.cover_url,
    createdAt: row.created_at,
  }
}

async function loadCarWithMods(carId: string) {
  const carResult = await pool.query('SELECT * FROM cars WHERE id = $1', [carId])
  if (!carResult.rowCount) return null
  const modsResult = await pool.query(
    'SELECT id, category, label FROM car_mods WHERE car_id = $1 ORDER BY category',
    [carId],
  )
  return { ...toPublicCar(carResult.rows[0]), mods: modsResult.rows }
}

carsRouter.post('/', requireAuth, validateBody(carSchema), async (req, res) => {
  const body = req.body as z.infer<typeof carSchema>
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      `INSERT INTO cars (
         owner_id, nickname, brand, model, year, drivetrain, aspiration, engine,
         displacement, gearbox, suspension, suspension_detail, wheels, tires,
         brakes, hp, whp, torque_kgfm, boost_bar, fuel, ecu, stage, build_status,
         is_primary, cover_url
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
       RETURNING id`,
      [
        req.userId,
        body.nickname,
        body.brand,
        body.model,
        body.year,
        body.drivetrain,
        body.aspiration,
        body.engine ?? null,
        body.displacement ?? null,
        body.gearbox ?? null,
        body.suspension,
        body.suspensionDetail ?? null,
        body.wheels ?? null,
        body.tires ?? null,
        body.brakes ?? null,
        body.hp ?? null,
        body.whp ?? null,
        body.torqueKgfm ?? null,
        body.boostBar ?? null,
        body.fuel ?? null,
        body.ecu ?? null,
        body.stage ?? null,
        body.buildStatus ?? 'original',
        body.isPrimary ?? false,
        body.coverUrl ?? null,
      ],
    )
    const carId = result.rows[0].id as string

    for (const mod of body.mods ?? []) {
      await client.query('INSERT INTO car_mods (car_id, category, label) VALUES ($1, $2, $3)', [
        carId,
        mod.category,
        mod.label,
      ])
    }

    await client.query('COMMIT')
    res.status(201).json(await loadCarWithMods(carId))
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
})

carsRouter.get('/:id', attachUserIfPresent, async (req, res) => {
  const car = await loadCarWithMods(paramStr(req.params.id))
  if (!car) return res.status(404).json({ error: 'Carro não encontrado.' })
  res.json(car)
})

// Autorização: só o dono edita/apaga — checa owner_id direto na cláusula
// WHERE, então uma tentativa de outro usuário simplesmente não afeta linha
// nenhuma (0 rows) em vez de vazar se o carro existe.
carsRouter.patch('/:id', requireAuth, validateBody(carSchema.partial()), async (req, res) => {
  const carId = paramStr(req.params.id)
  const body = req.body as Partial<z.infer<typeof carSchema>>
  const columnByKey: Record<string, string> = {
    nickname: 'nickname',
    brand: 'brand',
    model: 'model',
    year: 'year',
    drivetrain: 'drivetrain',
    aspiration: 'aspiration',
    engine: 'engine',
    displacement: 'displacement',
    gearbox: 'gearbox',
    suspension: 'suspension',
    suspensionDetail: 'suspension_detail',
    wheels: 'wheels',
    tires: 'tires',
    brakes: 'brakes',
    hp: 'hp',
    whp: 'whp',
    torqueKgfm: 'torque_kgfm',
    boostBar: 'boost_bar',
    fuel: 'fuel',
    ecu: 'ecu',
    stage: 'stage',
    buildStatus: 'build_status',
    isPrimary: 'is_primary',
    coverUrl: 'cover_url',
  }

  const fields: string[] = []
  const values: unknown[] = []
  let i = 1
  for (const [key, column] of Object.entries(columnByKey)) {
    const value = (body as Record<string, unknown>)[key]
    if (value !== undefined) {
      fields.push(`${column} = $${i++}`)
      values.push(value)
    }
  }
  if (!fields.length) return res.status(400).json({ error: 'Nada para atualizar.' })

  values.push(carId, req.userId)
  const result = await pool.query(
    `UPDATE cars SET ${fields.join(', ')} WHERE id = $${i} AND owner_id = $${i + 1} RETURNING id`,
    values,
  )
  if (!result.rowCount) {
    return res.status(404).json({ error: 'Carro não encontrado ou você não é o dono.' })
  }
  res.json(await loadCarWithMods(carId))
})

carsRouter.delete('/:id', requireAuth, async (req, res) => {
  const result = await pool.query('DELETE FROM cars WHERE id = $1 AND owner_id = $2 RETURNING id', [
    paramStr(req.params.id),
    req.userId,
  ])
  if (!result.rowCount) {
    return res.status(404).json({ error: 'Carro não encontrado ou você não é o dono.' })
  }
  res.status(204).end()
})

const modSchema = z.object({
  category: z.enum(['motor', 'suspensao', 'freios', 'rodas', 'aerodinamica', 'seguranca', 'eletronica']),
  label: z.string().trim().min(1).max(40),
})

carsRouter.post('/:id/mods', requireAuth, validateBody(modSchema), async (req, res) => {
  const carId = paramStr(req.params.id)
  const owns = await pool.query('SELECT 1 FROM cars WHERE id = $1 AND owner_id = $2', [
    carId,
    req.userId,
  ])
  if (!owns.rowCount) return res.status(404).json({ error: 'Carro não encontrado ou você não é o dono.' })

  const body = req.body as z.infer<typeof modSchema>
  await pool.query('INSERT INTO car_mods (car_id, category, label) VALUES ($1, $2, $3)', [
    carId,
    body.category,
    body.label,
  ])
  res.status(201).json(await loadCarWithMods(carId))
})

carsRouter.delete('/:id/mods/:modId', requireAuth, async (req, res) => {
  const carId = paramStr(req.params.id)
  const owns = await pool.query('SELECT 1 FROM cars WHERE id = $1 AND owner_id = $2', [
    carId,
    req.userId,
  ])
  if (!owns.rowCount) return res.status(404).json({ error: 'Carro não encontrado ou você não é o dono.' })

  await pool.query('DELETE FROM car_mods WHERE id = $1 AND car_id = $2', [paramStr(req.params.modId), carId])
  res.status(204).end()
})

carsRouter.get('/', attachUserIfPresent, async (req, res) => {
  const ownerUsername = typeof req.query.owner === 'string' ? req.query.owner.toLowerCase() : null
  if (!ownerUsername) {
    return res.status(400).json({ error: 'Informe ?owner=username.' })
  }

  const owner = await pool.query<{ user_id: string }>('SELECT user_id FROM profiles WHERE username = $1', [
    ownerUsername,
  ])
  if (!owner.rowCount) return res.json([])

  const result = await pool.query(
    'SELECT * FROM cars WHERE owner_id = $1 ORDER BY is_primary DESC, created_at DESC',
    [owner.rows[0].user_id],
  )
  res.json(result.rows.map(toPublicCar))
})

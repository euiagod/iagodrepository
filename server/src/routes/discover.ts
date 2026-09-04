import { Router } from 'express'
import { z } from 'zod'
import { pool } from '../db/pool.js'
import { validateBody, validateQuery } from '../lib/validate.js'
import { requireAuth } from '../middleware/auth.js'

export const discoverRouter = Router()

const discoverQuerySchema = z.object({
  drivetrain: z.enum(['dianteira', 'traseira', '4x4']).optional(),
  minWhp: z.coerce.number().int().min(0).optional(),
  aspiration: z.enum(['aspirado', 'turbo', 'supercharger', 'turbo+supercharger', 'eletrico']).optional(),
  stage: z.string().max(20).optional(),
  limit: z.coerce.number().int().min(1).max(20).default(10),
})

discoverRouter.get('/', requireAuth, validateQuery(discoverQuerySchema), async (req, res) => {
  const q = req.query as unknown as z.infer<typeof discoverQuerySchema>

  const conditions = [
    'c.owner_id <> $1',
    `c.id NOT IN (SELECT car_id FROM swipes WHERE user_id = $1)`,
  ]
  const params: unknown[] = [req.userId]
  let i = 2

  if (q.drivetrain) {
    conditions.push(`c.drivetrain = $${i++}`)
    params.push(q.drivetrain)
  }
  if (q.aspiration) {
    conditions.push(`c.aspiration = $${i++}`)
    params.push(q.aspiration)
  }
  if (q.stage) {
    conditions.push(`c.stage = $${i++}`)
    params.push(q.stage)
  }
  if (q.minWhp !== undefined) {
    conditions.push(`c.whp >= $${i++}`)
    params.push(q.minWhp)
  }

  const result = await pool.query(
    `SELECT c.*, pr.username AS owner_username, pr.display_name AS owner_display_name,
            pr.city AS owner_city, pr.state AS owner_state
     FROM cars c
     JOIN profiles pr ON pr.user_id = c.owner_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY c.created_at DESC
     LIMIT ${q.limit}`,
    params,
  )

  const carIds = result.rows.map((r: Record<string, unknown>) => r.id)
  const modsResult = carIds.length
    ? await pool.query('SELECT car_id, id, category, label FROM car_mods WHERE car_id = ANY($1)', [carIds])
    : { rows: [] as { car_id: string; id: string; category: string; label: string }[] }

  const modsByCarId = new Map<string, { id: string; category: string; label: string }[]>()
  for (const m of modsResult.rows) {
    const list = modsByCarId.get(m.car_id) ?? []
    list.push({ id: m.id, category: m.category, label: m.label })
    modsByCarId.set(m.car_id, list)
  }

  res.json(
    result.rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      nickname: r.nickname,
      brand: r.brand,
      model: r.model,
      year: r.year,
      drivetrain: r.drivetrain,
      aspiration: r.aspiration,
      engine: r.engine,
      gearbox: r.gearbox,
      hp: r.hp,
      whp: r.whp,
      tires: r.tires,
      stage: r.stage,
      coverUrl: r.cover_url,
      mods: modsByCarId.get(r.id as string) ?? [],
      owner: {
        username: r.owner_username,
        displayName: r.owner_display_name,
        city: r.owner_city,
        state: r.owner_state,
      },
    })),
  )
})

const swipeSchema = z.object({
  carId: z.string().uuid(),
  direction: z.enum(['like', 'pass', 'boost']),
})

discoverRouter.post('/swipe', requireAuth, validateBody(swipeSchema), async (req, res) => {
  const body = req.body as z.infer<typeof swipeSchema>

  const car = await pool.query('SELECT owner_id FROM cars WHERE id = $1', [body.carId])
  if (!car.rowCount) return res.status(404).json({ error: 'Carro não encontrado.' })
  if (car.rows[0].owner_id === req.userId) {
    return res.status(400).json({ error: 'Você não pode dar swipe no próprio carro.' })
  }

  const existing = await pool.query('SELECT 1 FROM swipes WHERE user_id = $1 AND car_id = $2', [
    req.userId,
    body.carId,
  ])
  if (existing.rowCount) {
    return res.status(400).json({ error: 'Você já deu swipe nesse carro.' })
  }

  await pool.query('INSERT INTO swipes (user_id, car_id, direction) VALUES ($1, $2, $3)', [
    req.userId,
    body.carId,
    body.direction,
  ])

  const match = await pool.query(
    `SELECT 1 FROM matches WHERE (user_a = LEAST($1::uuid, $2::uuid) AND user_b = GREATEST($1::uuid, $2::uuid))`,
    [req.userId, car.rows[0].owner_id],
  )

  res.status(201).json({ matched: Boolean(match.rowCount) })
})

discoverRouter.get('/matches', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT m.id, m.created_at,
            CASE WHEN m.user_a = $1 THEN m.user_b ELSE m.user_a END AS other_id,
            pr.username, pr.display_name, pr.avatar_url
     FROM matches m
     JOIN profiles pr ON pr.user_id = (CASE WHEN m.user_a = $1 THEN m.user_b ELSE m.user_a END)
     WHERE m.user_a = $1 OR m.user_b = $1
     ORDER BY m.created_at DESC`,
    [req.userId],
  )
  res.json(
    result.rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      createdAt: r.created_at,
      user: { id: r.other_id, username: r.username, displayName: r.display_name, avatarUrl: r.avatar_url },
    })),
  )
})

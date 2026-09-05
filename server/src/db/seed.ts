import 'dotenv/config'
import { hashPassword } from '../lib/auth.js'
import { pool } from './pool.js'

/** Dados de demonstração — não use essas senhas fora do seu ambiente local. */
async function seed() {
  const passwordHash = await hashPassword('senha1234')

  const users = [
    { email: 'rafa@teste.com', username: 'rafa_tsi', displayName: 'Rafael Souza', type: 'piloto' as const, city: 'Curitiba', state: 'PR', bio: 'Civic EG turbo. Rodando drift nos fins de semana.' },
    { email: 'garagem@teste.com', username: 'garagem_norte', displayName: 'Garagem Norte Preparações', type: 'oficina' as const, city: 'São Paulo', state: 'SP', specialties: ['Turbo', 'Suspensão', 'Dyno'], address: 'Rua das Turbinas, 100' },
    { email: 'bia@teste.com', username: 'bia_4x4', displayName: 'Bianca Ferreira', type: 'piloto' as const, city: 'Goiânia', state: 'GO', bio: 'Troller preparado pra trilha pesada.' },
  ]

  const userIds: Record<string, string> = {}

  for (const u of users) {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [u.email])
    let userId = existing.rows[0]?.id as string | undefined
    if (!userId) {
      const inserted = await pool.query<{ id: string }>(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
        [u.email, passwordHash],
      )
      userId = inserted.rows[0].id
    }
    userIds[u.username] = userId

    const hasProfile = await pool.query('SELECT 1 FROM profiles WHERE user_id = $1', [userId])
    if (!hasProfile.rowCount) {
      await pool.query(
        `INSERT INTO profiles (user_id, username, display_name, type, city, state, bio, specialties, address)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          userId,
          u.username,
          u.displayName,
          u.type,
          u.city,
          u.state,
          'bio' in u ? u.bio : null,
          'specialties' in u ? u.specialties : [],
          'address' in u ? u.address : null,
        ],
      )
    }
  }

  const cars = [
    {
      username: 'rafa_tsi',
      nickname: 'EG Turbo Project',
      brand: 'Honda',
      model: 'Civic EG',
      year: 1995,
      drivetrain: 'dianteira',
      aspiration: 'turbo',
      suspension: 'coilover',
      suspensionDetail: 'Öhlins TTX',
      wheels: 'Work Emotion 17"',
      tires: 'Federal RS-RR 225/45',
      hp: 420,
      whp: 365,
      torqueKgfm: 45.2,
      boostBar: 1.6,
      fuel: 'E100',
      ecu: 'FuelTech FT550',
      stage: 'Stage 3',
      buildStatus: 'pronto para pista',
      mods: [
        { category: 'motor', label: 'TURBO IS38' },
        { category: 'suspensao', label: 'FWD Torsen' },
      ],
    },
    {
      username: 'bia_4x4',
      nickname: 'Troller Trilha Pesada',
      brand: 'Troller',
      model: 'T4',
      year: 2018,
      drivetrain: '4x4',
      aspiration: 'aspirado',
      suspension: 'original',
      suspensionDetail: 'Old Man Emu +2"',
      wheels: 'Aro 16 Beadlock',
      tires: 'BF Goodrich KM3 33"',
      hp: 200,
      whp: 170,
      torqueKgfm: 45,
      boostBar: null,
      fuel: 'Diesel',
      ecu: null,
      stage: 'Trail Ready',
      buildStatus: 'pronto para pista',
      mods: [
        { category: 'suspensao', label: 'Kit de elevação +2"' },
        { category: 'seguranca', label: 'Bull bar e caixa de bateria dupla' },
      ],
    },
    {
      username: 'garagem_norte',
      nickname: 'Demo Stage 2 - Golf GTI',
      brand: 'Volkswagen',
      model: 'Golf GTI Mk7',
      year: 2020,
      drivetrain: 'dianteira',
      aspiration: 'turbo',
      suspension: 'coilover',
      suspensionDetail: 'KW V3',
      wheels: 'BBS CH-R 19"',
      tires: 'Michelin PS4 235/35',
      hp: 310,
      whp: 270,
      torqueKgfm: 42,
      boostBar: 1.4,
      fuel: 'Gasolina',
      ecu: 'APR Stage 2',
      stage: 'Stage 2',
      buildStatus: 'pronto para pista',
      mods: [
        { category: 'motor', label: 'Downpipe + intercooler upgrade' },
        { category: 'freios', label: 'Kit big brake dianteiro' },
      ],
    },
  ]

  for (const c of cars) {
    const ownerId = userIds[c.username]
    const existing = await pool.query('SELECT id FROM cars WHERE owner_id = $1 AND nickname = $2', [ownerId, c.nickname])
    let carId = existing.rows[0]?.id as string | undefined
    if (!carId) {
      const inserted = await pool.query<{ id: string }>(
        `INSERT INTO cars (
           owner_id, nickname, brand, model, year, drivetrain, aspiration, suspension,
           suspension_detail, wheels, tires, hp, whp, torque_kgfm, boost_bar, fuel, ecu,
           stage, build_status, is_primary
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
         RETURNING id`,
        [
          ownerId,
          c.nickname,
          c.brand,
          c.model,
          c.year,
          c.drivetrain,
          c.aspiration,
          c.suspension,
          c.suspensionDetail,
          c.wheels,
          c.tires,
          c.hp,
          c.whp,
          c.torqueKgfm,
          c.boostBar,
          c.fuel,
          c.ecu,
          c.stage,
          c.buildStatus,
          true,
        ],
      )
      carId = inserted.rows[0].id
      for (const mod of c.mods) {
        await pool.query('INSERT INTO car_mods (car_id, category, label) VALUES ($1, $2, $3)', [carId, mod.category, mod.label])
      }
    }
  }

  console.log('Seed aplicado. Contas de teste (senha "senha1234"):')
  for (const u of users) console.log(`  - ${u.email} (@${u.username})`)

  await pool.end()
}

seed().catch((err) => {
  console.error('Falha no seed:', err)
  process.exit(1)
})

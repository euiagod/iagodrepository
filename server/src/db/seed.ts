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

  const rafaCar = await pool.query('SELECT id FROM cars WHERE owner_id = $1 LIMIT 1', [userIds.rafa_tsi])
  let carId = rafaCar.rows[0]?.id as string | undefined
  if (!carId) {
    const inserted = await pool.query<{ id: string }>(
      `INSERT INTO cars (
         owner_id, nickname, brand, model, year, drivetrain, aspiration, suspension,
         suspension_detail, wheels, tires, hp, whp, torque_kgfm, boost_bar, fuel, ecu,
         stage, build_status, is_primary
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       RETURNING id`,
      [
        userIds.rafa_tsi,
        'EG Turbo Project',
        'Honda',
        'Civic EG',
        1995,
        'dianteira',
        'turbo',
        'coilover',
        'Öhlins TTX',
        'Work Emotion 17"',
        'Federal RS-RR 225/45',
        420,
        365,
        45.2,
        1.6,
        'E100',
        'FuelTech FT550',
        'Stage 3',
        'pronto para pista',
        true,
      ],
    )
    carId = inserted.rows[0].id
    await pool.query('INSERT INTO car_mods (car_id, category, label) VALUES ($1, $2, $3), ($1, $4, $5)', [
      carId,
      'motor',
      'TURBO IS38',
      'suspensao',
      'FWD Torsen',
    ])
  }

  console.log('Seed aplicado. Contas de teste (senha "senha1234"):')
  for (const u of users) console.log(`  - ${u.email} (@${u.username})`)

  await pool.end()
}

seed().catch((err) => {
  console.error('Falha no seed:', err)
  process.exit(1)
})

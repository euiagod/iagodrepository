import { Router } from 'express'
import { z } from 'zod'
import { pool } from '../db/pool.js'
import { validateBody } from '../lib/validate.js'
import { requireAuth, attachUserIfPresent } from '../middleware/auth.js'
import { paramStr } from '../lib/params.js'

export const profilesRouter = Router()

const USERNAME_RE = /^[a-z0-9_.]{3,24}$/

const onboardingSchema = z.object({
  username: z.string().trim().toLowerCase().regex(USERNAME_RE, 'use letras minúsculas, números, "_" ou "."'),
  displayName: z.string().trim().min(1).max(60),
  type: z.enum(['piloto', 'oficina']),
  city: z.string().trim().max(80).optional(),
  state: z.string().trim().toUpperCase().length(2).optional(),
  bio: z.string().trim().max(280).optional(),
  specialties: z.array(z.string().trim().max(40)).max(10).optional(),
  address: z.string().trim().max(200).optional(),
})

export interface ProfileRow {
  user_id: string
  username: string
  display_name: string
  type: 'piloto' | 'oficina'
  avatar_url: string | null
  bio: string | null
  city: string | null
  state: string | null
  member_number: number
  is_verified: boolean
  specialties: string[]
  address: string | null
  created_at: string
}

function toPublicProfile(row: ProfileRow) {
  return {
    id: row.user_id,
    username: row.username,
    displayName: row.display_name,
    type: row.type,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    city: row.city,
    state: row.state,
    memberNumber: row.member_number,
    isVerified: row.is_verified,
    specialties: row.specialties,
    address: row.type === 'oficina' ? row.address : null,
    createdAt: row.created_at,
  }
}

export async function serializeProfile(userId: string) {
  const result = await pool.query<ProfileRow>('SELECT * FROM profiles WHERE user_id = $1', [userId])
  if (!result.rowCount) return null
  return toPublicProfile(result.rows[0])
}

// Onboarding: cria o perfil da sessão autenticada. Nunca recebe um "userId"
// no corpo — o dono é sempre req.userId, então não dá pra criar perfil em
// nome de outra pessoa.
profilesRouter.post('/onboarding', requireAuth, validateBody(onboardingSchema), async (req, res) => {
  const existing = await pool.query('SELECT 1 FROM profiles WHERE user_id = $1', [req.userId])
  if (existing.rowCount) {
    return res.status(400).json({ error: 'Perfil já criado.' })
  }

  const body = req.body as z.infer<typeof onboardingSchema>

  const usernameTaken = await pool.query('SELECT 1 FROM profiles WHERE username = $1', [body.username])
  if (usernameTaken.rowCount) {
    return res.status(400).json({ error: 'Esse @usuário já está em uso.' })
  }

  const result = await pool.query<ProfileRow>(
    `INSERT INTO profiles (user_id, username, display_name, type, city, state, bio, specialties, address)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      req.userId,
      body.username,
      body.displayName,
      body.type,
      body.city ?? null,
      body.state ?? null,
      body.bio ?? null,
      body.type === 'oficina' ? (body.specialties ?? []) : [],
      body.type === 'oficina' ? (body.address ?? null) : null,
    ],
  )

  res.status(201).json(toPublicProfile(result.rows[0]))
})

const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(60).optional(),
  bio: z.string().trim().max(280).optional(),
  city: z.string().trim().max(80).optional(),
  state: z.string().trim().toUpperCase().length(2).optional(),
  avatarUrl: z.string().url().max(500).optional(),
  specialties: z.array(z.string().trim().max(40)).max(10).optional(),
  address: z.string().trim().max(200).optional(),
})

profilesRouter.patch('/me', requireAuth, validateBody(updateProfileSchema), async (req, res) => {
  const body = req.body as z.infer<typeof updateProfileSchema>
  const fields: string[] = []
  const values: unknown[] = []
  let i = 1

  const columnByKey: Record<string, string> = {
    displayName: 'display_name',
    bio: 'bio',
    city: 'city',
    state: 'state',
    avatarUrl: 'avatar_url',
    specialties: 'specialties',
    address: 'address',
  }

  for (const [key, column] of Object.entries(columnByKey)) {
    const value = (body as Record<string, unknown>)[key]
    if (value !== undefined) {
      fields.push(`${column} = $${i++}`)
      values.push(value)
    }
  }

  if (!fields.length) return res.status(400).json({ error: 'Nada para atualizar.' })

  values.push(req.userId)
  const result = await pool.query<ProfileRow>(
    `UPDATE profiles SET ${fields.join(', ')} WHERE user_id = $${i} RETURNING *`,
    values,
  )
  if (!result.rowCount) return res.status(404).json({ error: 'Perfil não encontrado.' })
  res.json(toPublicProfile(result.rows[0]))
})

profilesRouter.get('/:username', attachUserIfPresent, async (req, res) => {
  const result = await pool.query<ProfileRow>('SELECT * FROM profiles WHERE username = $1', [
    paramStr(req.params.username).toLowerCase(),
  ])
  if (!result.rowCount) return res.status(404).json({ error: 'Perfil não encontrado.' })
  const row = result.rows[0]

  const [carsCount, followers, following, isFollowing] = await Promise.all([
    pool.query('SELECT count(*)::int AS n FROM cars WHERE owner_id = $1', [row.user_id]),
    pool.query('SELECT count(*)::int AS n FROM follows WHERE following_id = $1', [row.user_id]),
    pool.query('SELECT count(*)::int AS n FROM follows WHERE follower_id = $1', [row.user_id]),
    req.userId
      ? pool.query('SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2', [
          req.userId,
          row.user_id,
        ])
      : Promise.resolve({ rowCount: 0 }),
  ])

  res.json({
    ...toPublicProfile(row),
    carsCount: carsCount.rows[0].n,
    followersCount: followers.rows[0].n,
    followingCount: following.rows[0].n,
    isFollowing: Boolean(isFollowing.rowCount),
    isMe: req.userId === row.user_id,
  })
})

// --- follow ---

profilesRouter.post('/:username/follow', requireAuth, async (req, res) => {
  const target = await pool.query<{ user_id: string }>('SELECT user_id FROM profiles WHERE username = $1', [
    paramStr(req.params.username).toLowerCase(),
  ])
  if (!target.rowCount) return res.status(404).json({ error: 'Perfil não encontrado.' })
  const targetId = target.rows[0].user_id

  if (targetId === req.userId) {
    return res.status(400).json({ error: 'Você não pode seguir a si mesmo.' })
  }

  await pool.query(
    'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [req.userId, targetId],
  )
  await pool.query(
    `INSERT INTO notifications (user_id, actor_id, type, entity_id) VALUES ($1, $2, 'follow', $2)`,
    [targetId, req.userId],
  )

  res.status(204).end()
})

profilesRouter.delete('/:username/follow', requireAuth, async (req, res) => {
  const target = await pool.query<{ user_id: string }>('SELECT user_id FROM profiles WHERE username = $1', [
    paramStr(req.params.username).toLowerCase(),
  ])
  if (!target.rowCount) return res.status(404).json({ error: 'Perfil não encontrado.' })

  await pool.query('DELETE FROM follows WHERE follower_id = $1 AND following_id = $2', [
    req.userId,
    target.rows[0].user_id,
  ])
  res.status(204).end()
})

import { Router } from 'express'
import { z } from 'zod'
import { pool } from '../db/pool.js'
import { validateQuery } from '../lib/validate.js'

export const searchRouter = Router()

const searchSchema = z.object({
  q: z.string().trim().min(1).max(60),
  type: z.enum(['pilotos', 'oficinas', 'carros']).default('pilotos'),
})

searchRouter.get('/', validateQuery(searchSchema), async (req, res) => {
  const { q, type } = req.query as unknown as z.infer<typeof searchSchema>
  const like = `%${q.toLowerCase()}%`

  if (type === 'carros') {
    const result = await pool.query(
      `SELECT c.id, c.nickname, c.brand, c.model, c.whp, c.cover_url, pr.username AS owner_username
       FROM cars c JOIN profiles pr ON pr.user_id = c.owner_id
       WHERE lower(c.nickname) LIKE $1 OR lower(c.brand) LIKE $1 OR lower(c.model) LIKE $1
       LIMIT 30`,
      [like],
    )
    return res.json(
      result.rows.map((r: Record<string, unknown>) => ({
        id: r.id,
        nickname: r.nickname,
        brand: r.brand,
        model: r.model,
        whp: r.whp,
        coverUrl: r.cover_url,
        ownerUsername: r.owner_username,
      })),
    )
  }

  const profileType = type === 'oficinas' ? 'oficina' : 'piloto'
  const result = await pool.query(
    `SELECT username, display_name, avatar_url, city, state, type, is_verified
     FROM profiles
     WHERE type = $2 AND (lower(username) LIKE $1 OR lower(display_name) LIKE $1)
     LIMIT 30`,
    [like, profileType],
  )
  res.json(
    result.rows.map((r: Record<string, unknown>) => ({
      username: r.username,
      displayName: r.display_name,
      avatarUrl: r.avatar_url,
      city: r.city,
      state: r.state,
      type: r.type,
      isVerified: r.is_verified,
    })),
  )
})

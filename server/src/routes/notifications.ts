import { Router } from 'express'
import { pool } from '../db/pool.js'
import { requireAuth } from '../middleware/auth.js'
import { paramStr } from '../lib/params.js'

export const notificationsRouter = Router()

notificationsRouter.get('/', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT n.id, n.type, n.entity_id, n.read, n.created_at,
            pr.username AS actor_username, pr.display_name AS actor_display_name,
            pr.avatar_url AS actor_avatar_url
     FROM notifications n
     LEFT JOIN profiles pr ON pr.user_id = n.actor_id
     WHERE n.user_id = $1
     ORDER BY n.created_at DESC
     LIMIT 50`,
    [req.userId],
  )
  res.json(
    result.rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      type: r.type,
      entityId: r.entity_id,
      read: r.read,
      createdAt: r.created_at,
      actor: r.actor_username
        ? { username: r.actor_username, displayName: r.actor_display_name, avatarUrl: r.actor_avatar_url }
        : null,
    })),
  )
})

notificationsRouter.get('/unread-count', requireAuth, async (req, res) => {
  const result = await pool.query(
    'SELECT count(*)::int AS n FROM notifications WHERE user_id = $1 AND read = false',
    [req.userId],
  )
  res.json({ count: result.rows[0].n })
})

notificationsRouter.post('/:id/read', requireAuth, async (req, res) => {
  await pool.query('UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2', [
    paramStr(req.params.id),
    req.userId,
  ])
  res.status(204).end()
})

notificationsRouter.post('/read-all', requireAuth, async (req, res) => {
  await pool.query('UPDATE notifications SET read = true WHERE user_id = $1 AND read = false', [req.userId])
  res.status(204).end()
})

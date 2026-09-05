import { Router } from 'express'
import { z } from 'zod'
import { pool } from '../db/pool.js'
import { validateBody, validateQuery } from '../lib/validate.js'
import { attachUserIfPresent, requireAuth } from '../middleware/auth.js'
import { paramStr } from '../lib/params.js'

export const postsRouter = Router()

const paginationSchema = z.object({
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(30).default(10),
})

const POST_SELECT = `
  SELECT
    p.id, p.author_id, p.car_id, p.caption, p.location, p.created_at,
    pr.username AS author_username, pr.display_name AS author_display_name,
    pr.avatar_url AS author_avatar_url, pr.type AS author_type, pr.is_verified AS author_verified,
    c.nickname AS car_nickname, c.brand AS car_brand, c.model AS car_model,
    c.whp AS car_whp, c.stage AS car_stage, c.torque_kgfm AS car_torque_kgfm,
    c.boost_bar AS car_boost_bar,
    (SELECT count(*)::int FROM likes l WHERE l.post_id = p.id) AS likes_count,
    (SELECT count(*)::int FROM comments cm WHERE cm.post_id = p.id) AS comments_count
  FROM posts p
  JOIN profiles pr ON pr.user_id = p.author_id
  LEFT JOIN cars c ON c.id = p.car_id
`

async function attachMediaAndLikes(rows: Record<string, unknown>[], userId?: string) {
  if (!rows.length) return []
  const ids = rows.map((r) => r.id)
  const carIds = rows.map((r) => r.car_id).filter(Boolean)
  const authorIds = [...new Set(rows.map((r) => r.author_id))]

  const [mediaResult, likedResult, dynoResult, modsResult, followingResult] = await Promise.all([
    pool.query('SELECT post_id, url, position FROM post_media WHERE post_id = ANY($1) ORDER BY position', [
      ids,
    ]),
    userId
      ? pool.query('SELECT post_id FROM likes WHERE user_id = $1 AND post_id = ANY($2)', [userId, ids])
      : Promise.resolve({ rows: [] as { post_id: string }[] }),
    pool.query(
      `SELECT DISTINCT ON (car_id) car_id FROM dyno_certificates
       WHERE car_id = ANY($1) AND status = 'homologado'`,
      [carIds],
    ),
    pool.query('SELECT car_id, id, category, label FROM car_mods WHERE car_id = ANY($1) ORDER BY category', [
      carIds,
    ]),
    userId
      ? pool.query('SELECT following_id FROM follows WHERE follower_id = $1 AND following_id = ANY($2)', [
          userId,
          authorIds,
        ])
      : Promise.resolve({ rows: [] as { following_id: string }[] }),
  ])

  const mediaByPost = new Map<string, { url: string; position: number }[]>()
  for (const m of mediaResult.rows) {
    const list = mediaByPost.get(m.post_id) ?? []
    list.push({ url: m.url, position: m.position })
    mediaByPost.set(m.post_id, list)
  }
  const modsByCar = new Map<string, { id: string; category: string; label: string }[]>()
  for (const m of modsResult.rows) {
    const list = modsByCar.get(m.car_id) ?? []
    list.push({ id: m.id, category: m.category, label: m.label })
    modsByCar.set(m.car_id, list)
  }
  const likedSet = new Set(likedResult.rows.map((r) => r.post_id))
  const dynoCars = new Set(dynoResult.rows.map((r) => r.car_id))
  const followingSet = new Set(followingResult.rows.map((r) => r.following_id))

  return rows.map((r: Record<string, unknown>) => ({
    id: r.id,
    caption: r.caption,
    location: r.location,
    createdAt: r.created_at,
    author: {
      id: r.author_id,
      username: r.author_username,
      displayName: r.author_display_name,
      avatarUrl: r.author_avatar_url,
      type: r.author_type,
      isVerified: r.author_verified,
      isFollowedByMe: followingSet.has(r.author_id as string),
      isMe: userId === r.author_id,
    },
    car: r.car_id
      ? {
          id: r.car_id,
          nickname: r.car_nickname,
          brand: r.car_brand,
          model: r.car_model,
          whp: r.car_whp,
          stage: r.car_stage,
          torqueKgfm: r.car_torque_kgfm !== null ? Number(r.car_torque_kgfm) : null,
          boostBar: r.car_boost_bar !== null ? Number(r.car_boost_bar) : null,
          dynoCertified: dynoCars.has(r.car_id as string),
          mods: modsByCar.get(r.car_id as string) ?? [],
        }
      : null,
    media: mediaByPost.get(r.id as string) ?? [],
    likesCount: r.likes_count,
    commentsCount: r.comments_count,
    likedByMe: likedSet.has(r.id),
  }))
}

postsRouter.get('/by-car/:carId', attachUserIfPresent, async (req, res) => {
  const result = await pool.query(
    `${POST_SELECT} WHERE p.car_id = $1 ORDER BY p.created_at DESC LIMIT 60`,
    [paramStr(req.params.carId)],
  )
  res.json(await attachMediaAndLikes(result.rows, req.userId))
})

postsRouter.get('/by/:username', attachUserIfPresent, async (req, res) => {
  const username = paramStr(req.params.username).toLowerCase()
  const owner = await pool.query<{ user_id: string }>('SELECT user_id FROM profiles WHERE username = $1', [
    username,
  ])
  if (!owner.rowCount) return res.json([])

  const result = await pool.query(
    `${POST_SELECT} WHERE p.author_id = $1 ORDER BY p.created_at DESC LIMIT 60`,
    [owner.rows[0].user_id],
  )
  res.json(await attachMediaAndLikes(result.rows, req.userId))
})

postsRouter.get('/feed', requireAuth, validateQuery(paginationSchema), async (req, res) => {
  const { cursor, limit } = req.query as unknown as z.infer<typeof paginationSchema>

  const following = await pool.query('SELECT count(*)::int AS n FROM follows WHERE follower_id = $1', [
    req.userId,
  ])
  const hasFollows = following.rows[0].n > 0

  // Os placeholders SQL precisam bater exatamente com o array de params —
  // por isso montamos os dois juntos em vez de fixar números de posição.
  const params: unknown[] = []
  let scopeSql = 'TRUE' // sem quem seguir ainda: mostra os posts mais recentes da comunidade
  if (hasFollows) {
    params.push(req.userId)
    scopeSql = `p.author_id IN (SELECT following_id FROM follows WHERE follower_id = $${params.length}) OR p.author_id = $${params.length}`
  }

  let cursorSql = ''
  if (cursor) {
    params.push(cursor)
    cursorSql = `AND p.created_at < $${params.length}`
  }

  const result = await pool.query(
    `${POST_SELECT} WHERE (${scopeSql}) ${cursorSql} ORDER BY p.created_at DESC LIMIT ${limit}`,
    params,
  )

  const posts = await attachMediaAndLikes(result.rows, req.userId)
  const nextCursor = posts.length === limit ? (posts[posts.length - 1].createdAt as string) : null
  res.json({ posts, nextCursor, personalized: hasFollows })
})

const createPostSchema = z.object({
  caption: z.string().trim().max(1000).optional(),
  location: z.string().trim().max(80).optional(),
  carId: z.string().uuid().optional(),
  mediaUrls: z.array(z.string().max(500)).min(1).max(10),
})

postsRouter.post('/', requireAuth, validateBody(createPostSchema), async (req, res) => {
  const body = req.body as z.infer<typeof createPostSchema>

  if (body.carId) {
    const owns = await pool.query('SELECT 1 FROM cars WHERE id = $1 AND owner_id = $2', [
      body.carId,
      req.userId,
    ])
    if (!owns.rowCount) {
      return res.status(400).json({ error: 'Você só pode vincular um carro da sua própria garagem.' })
    }
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const postResult = await client.query(
      'INSERT INTO posts (author_id, car_id, caption, location) VALUES ($1, $2, $3, $4) RETURNING id',
      [req.userId, body.carId ?? null, body.caption ?? null, body.location ?? null],
    )
    const postId = postResult.rows[0].id as string

    let position = 0
    for (const url of body.mediaUrls) {
      await client.query('INSERT INTO post_media (post_id, url, position) VALUES ($1, $2, $3)', [
        postId,
        url,
        position++,
      ])
    }
    await client.query('COMMIT')

    const full = await pool.query(`${POST_SELECT} WHERE p.id = $1`, [postId])
    const [post] = await attachMediaAndLikes(full.rows, req.userId)
    res.status(201).json(post)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
})

postsRouter.get('/:id', attachUserIfPresent, async (req, res) => {
  const result = await pool.query(`${POST_SELECT} WHERE p.id = $1`, [paramStr(req.params.id)])
  if (!result.rowCount) return res.status(404).json({ error: 'Post não encontrado.' })
  const [post] = await attachMediaAndLikes(result.rows, req.userId)
  res.json(post)
})

postsRouter.delete('/:id', requireAuth, async (req, res) => {
  const result = await pool.query('DELETE FROM posts WHERE id = $1 AND author_id = $2 RETURNING id', [
    paramStr(req.params.id),
    req.userId,
  ])
  if (!result.rowCount) return res.status(404).json({ error: 'Post não encontrado ou não é seu.' })
  res.status(204).end()
})

postsRouter.post('/:id/like', requireAuth, async (req, res) => {
  const postId = paramStr(req.params.id)
  const post = await pool.query('SELECT author_id FROM posts WHERE id = $1', [postId])
  if (!post.rowCount) return res.status(404).json({ error: 'Post não encontrado.' })

  const inserted = await pool.query(
    'INSERT INTO likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING post_id',
    [postId, req.userId],
  )
  if (inserted.rowCount && post.rows[0].author_id !== req.userId) {
    await pool.query(
      `INSERT INTO notifications (user_id, actor_id, type, entity_id) VALUES ($1, $2, 'like', $3)`,
      [post.rows[0].author_id, req.userId, postId],
    )
  }

  const count = await pool.query('SELECT count(*)::int AS n FROM likes WHERE post_id = $1', [postId])
  res.json({ likedByMe: true, likesCount: count.rows[0].n })
})

postsRouter.delete('/:id/like', requireAuth, async (req, res) => {
  const postId = paramStr(req.params.id)
  await pool.query('DELETE FROM likes WHERE post_id = $1 AND user_id = $2', [postId, req.userId])
  const count = await pool.query('SELECT count(*)::int AS n FROM likes WHERE post_id = $1', [postId])
  res.json({ likedByMe: false, likesCount: count.rows[0].n })
})

postsRouter.get('/:id/comments', async (req, res) => {
  const result = await pool.query(
    `SELECT cm.id, cm.body, cm.parent_id, cm.created_at,
            pr.username AS author_username, pr.display_name AS author_display_name,
            pr.avatar_url AS author_avatar_url
     FROM comments cm
     JOIN profiles pr ON pr.user_id = cm.author_id
     WHERE cm.post_id = $1
     ORDER BY cm.created_at ASC`,
    [paramStr(req.params.id)],
  )
  res.json(
    result.rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      body: r.body,
      parentId: r.parent_id,
      createdAt: r.created_at,
      author: {
        username: r.author_username,
        displayName: r.author_display_name,
        avatarUrl: r.author_avatar_url,
      },
    })),
  )
})

const commentSchema = z.object({
  body: z.string().trim().min(1).max(500),
  parentId: z.string().uuid().optional(),
})

postsRouter.post('/:id/comments', requireAuth, validateBody(commentSchema), async (req, res) => {
  const postId = paramStr(req.params.id)
  const post = await pool.query('SELECT author_id FROM posts WHERE id = $1', [postId])
  if (!post.rowCount) return res.status(404).json({ error: 'Post não encontrado.' })

  const body = req.body as z.infer<typeof commentSchema>
  const result = await pool.query(
    'INSERT INTO comments (post_id, author_id, body, parent_id) VALUES ($1, $2, $3, $4) RETURNING id, created_at',
    [postId, req.userId, body.body, body.parentId ?? null],
  )

  if (post.rows[0].author_id !== req.userId) {
    await pool.query(
      `INSERT INTO notifications (user_id, actor_id, type, entity_id) VALUES ($1, $2, 'comment', $3)`,
      [post.rows[0].author_id, req.userId, postId],
    )
  }

  res.status(201).json({ id: result.rows[0].id, createdAt: result.rows[0].created_at })
})

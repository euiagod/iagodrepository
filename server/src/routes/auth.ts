import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { pool } from '../db/pool.js'
import {
  hashPassword,
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
  verifyPassword,
} from '../lib/auth.js'
import { validateBody } from '../lib/validate.js'
import { requireAuth } from '../middleware/auth.js'
import { serializeProfile } from './profiles.js'

export const authRouter = Router()

// Login/registro são os alvos mais óbvios de força bruta e enumeração de
// e-mail — limite de taxa dedicado, mais apertado que o resto da API.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Aguarde alguns minutos.' },
})

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(160),
  password: z.string().min(8).max(200),
})

authRouter.post('/register', authLimiter, validateBody(credentialsSchema), async (req, res) => {
  const { email, password } = req.body as z.infer<typeof credentialsSchema>

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
  if (existing.rowCount) {
    // Mensagem genérica: não confirma nem nega se o e-mail existe.
    return res.status(400).json({ error: 'Não foi possível criar a conta com esses dados.' })
  }

  const passwordHash = await hashPassword(password)
  const result = await pool.query<{ id: string }>(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
    [email, passwordHash],
  )
  const userId = result.rows[0].id

  const token = signSession(userId)
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions)
  res.status(201).json({ id: userId, email, onboarded: false })
})

authRouter.post('/login', authLimiter, validateBody(credentialsSchema), async (req, res) => {
  const { email, password } = req.body as z.infer<typeof credentialsSchema>

  const result = await pool.query<{ id: string; password_hash: string }>(
    'SELECT id, password_hash FROM users WHERE email = $1',
    [email],
  )
  const user = result.rows[0]
  // Mesma mensagem para "não existe" e "senha errada" — não vaza qual delas.
  const invalid = () => res.status(401).json({ error: 'E-mail ou senha inválidos.' })
  if (!user) return invalid()

  const ok = await verifyPassword(password, user.password_hash)
  if (!ok) return invalid()

  const token = signSession(user.id)
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions)

  const profile = await serializeProfile(user.id)
  res.json({ id: user.id, email, onboarded: Boolean(profile), profile })
})

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(SESSION_COOKIE, { path: '/' })
  res.status(204).end()
})

authRouter.get('/me', requireAuth, async (req, res) => {
  const result = await pool.query<{ email: string }>('SELECT email FROM users WHERE id = $1', [
    req.userId,
  ])
  if (!result.rowCount) return res.status(401).json({ error: 'Não autenticado.' })

  const profile = await serializeProfile(req.userId!)
  res.json({ id: req.userId, email: result.rows[0].email, onboarded: Boolean(profile), profile })
})

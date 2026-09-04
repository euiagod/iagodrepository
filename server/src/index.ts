import 'dotenv/config'
import path from 'node:path'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'

import { authRouter } from './routes/auth.js'
import { carsRouter } from './routes/cars.js'
import { discoverRouter } from './routes/discover.js'
import { notificationsRouter } from './routes/notifications.js'
import { postsRouter } from './routes/posts.js'
import { profilesRouter } from './routes/profiles.js'
import { searchRouter } from './routes/search.js'
import { uploadRouter } from './routes/upload.js'

const app = express()
const PORT = Number(process.env.PORT ?? 8787)
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? './uploads')

app.set('trust proxy', 1)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

// Limite de taxa geral na API — além do limite mais apertado em /auth.
app.use(
  '/api',
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
  }),
)

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }))

app.use('/api/auth', authRouter)
app.use('/api/profiles', profilesRouter)
app.use('/api/cars', carsRouter)
app.use('/api/posts', postsRouter)
app.use('/api/discover', discoverRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/search', searchRouter)
app.use('/api/upload', uploadRouter)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// Handler de erro central: nunca vaza stack trace nem detalhe interno para o
// cliente; sempre loga no servidor para investigação.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  if (res.headersSent) return
  res.status(500).json({ error: 'Erro interno. Tente novamente.' })
})

app.listen(PORT, () => {
  console.log(`Cartel Club API rodando em http://localhost:${PORT}`)
})

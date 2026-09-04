import type { NextFunction, Request, Response } from 'express'
import { SESSION_COOKIE, verifySession } from '../lib/auth.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

/** Exige sessão válida. Nunca confie em um ID enviado pelo cliente — o dono
 * de qualquer escrita é sempre req.userId, decodificado do cookie assinado. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE]
  if (!token) {
    return res.status(401).json({ error: 'Não autenticado.' })
  }
  try {
    const payload = verifySession(token)
    req.userId = payload.sub
    next()
  } catch {
    res.clearCookie(SESSION_COOKIE)
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' })
  }
}

/** Não exige sessão, mas popula req.userId quando houver — usado em rotas
 * públicas que precisam saber "curtido por mim" etc. */
export function attachUserIfPresent(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE]
  if (token) {
    try {
      req.userId = verifySession(token).sub
    } catch {
      // token inválido em rota opcional: segue como anônimo
    }
  }
  next()
}

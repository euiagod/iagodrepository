import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET: string = (() => {
  const value = process.env.JWT_SECRET
  if (!value) throw new Error('JWT_SECRET não configurado (veja server/.env.example)')
  return value
})()

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d'

export interface JwtPayload {
  sub: string
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function signSession(userId: string) {
  return jwt.sign({ sub: userId } satisfies JwtPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions)
}

export function verifySession(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}

export const SESSION_COOKIE = 'cartelclub_session'

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
}

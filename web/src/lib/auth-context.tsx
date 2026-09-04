import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from './api'
import type { Profile, SessionUser } from '../types'

interface AuthContextValue {
  user: SessionUser | null
  loading: boolean
  register: (email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  completeOnboarding: (profile: Profile) => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const me = await api.get<SessionUser>('/auth/me')
      setUser(me)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const register = useCallback(async (email: string, password: string) => {
    const result = await api.post<SessionUser>('/auth/register', { email, password })
    setUser(result)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.post<SessionUser>('/auth/login', { email, password })
    setUser(result)
  }, [])

  const logout = useCallback(async () => {
    await api.post('/auth/logout')
    setUser(null)
  }, [])

  const completeOnboarding = useCallback((profile: Profile) => {
    setUser((prev) => (prev ? { ...prev, onboarded: true, profile } : prev))
  }, [])

  const value = useMemo(
    () => ({ user, loading, register, login, logout, completeOnboarding, refresh }),
    [user, loading, register, login, logout, completeOnboarding, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}

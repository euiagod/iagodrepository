import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullScreenLoading />
  if (!user) return <Navigate to="/entrar" state={{ from: location }} replace />
  if (!user.onboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }
  return <>{children}</>
}

export function FullScreenLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-[var(--void)]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-white" />
    </div>
  )
}

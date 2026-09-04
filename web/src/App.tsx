import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth-context'
import { ProtectedRoute, FullScreenLoading } from './components/ProtectedRoute'
import { BottomNav } from './components/BottomNav'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Onboarding } from './pages/Onboarding'
import { EditProfile } from './pages/EditProfile'
import { Feed } from './pages/Feed'
import { Discover } from './pages/Discover'
import { Upload } from './pages/Upload'
import { Profile } from './pages/Profile'
import { CarDetail } from './pages/CarDetail'
import { CarForm } from './pages/CarForm'
import { PostDetail } from './pages/PostDetail'
import { Notifications } from './pages/Notifications'
import { Search } from './pages/Search'

function GaragemRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoading />
  if (!user?.profile) return <Navigate to="/onboarding" replace />
  return <Navigate to={`/perfil/${user.profile.username}`} replace />
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--void)] pb-24 text-[var(--text)]">
      {children}
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/entrar" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Shell>
                  <Feed />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/descobrir"
            element={
              <ProtectedRoute>
                <Shell>
                  <Discover />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/publicar"
            element={
              <ProtectedRoute>
                <Shell>
                  <Upload />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notificacoes"
            element={
              <ProtectedRoute>
                <Shell>
                  <Notifications />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/buscar"
            element={
              <ProtectedRoute>
                <Shell>
                  <Search />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/garagem"
            element={
              <ProtectedRoute>
                <GaragemRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/garagem/editar"
            element={
              <ProtectedRoute>
                <Shell>
                  <EditProfile />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/garagem/carro/novo"
            element={
              <ProtectedRoute>
                <Shell>
                  <CarForm />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/garagem/carro/:id/editar"
            element={
              <ProtectedRoute>
                <Shell>
                  <CarForm />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil/:username"
            element={
              <ProtectedRoute>
                <Shell>
                  <Profile />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/carro/:id"
            element={
              <ProtectedRoute>
                <Shell>
                  <CarDetail />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/post/:id"
            element={
              <ProtectedRoute>
                <PostDetail />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

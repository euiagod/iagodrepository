import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { ApiError } from '../lib/api'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await login(email, password)
      const from = (location.state as { from?: Location })?.from?.pathname ?? '/'
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-10">
      <h1 className="text-2xl font-extrabold tracking-tight">
        CARTEL <span className="text-[var(--brand)]">CLUB</span>
      </h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Entre na sua garagem.</p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase text-[var(--text-muted)]">E-mail</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2.5 text-sm outline-none focus:border-[var(--border-active)]"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase text-[var(--text-muted)]">Senha</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2.5 text-sm outline-none focus:border-[var(--border-active)]"
          />
        </label>

        {error && <p className="text-sm text-[var(--brand)]">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-2 rounded-full bg-white py-3 text-sm font-bold text-black disabled:opacity-50"
        >
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
        Não tem conta?{' '}
        <Link to="/cadastro" className="font-semibold text-[var(--text)] underline">
          Criar conta
        </Link>
      </p>
    </div>
  )
}

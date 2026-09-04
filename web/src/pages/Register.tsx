import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { ApiError } from '../lib/api'

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.')
      return
    }
    setBusy(true)
    try {
      await register(email, password)
      navigate('/onboarding', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar a conta.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-10">
      <h1 className="text-2xl font-extrabold tracking-tight">
        CARTEL <span className="text-[var(--brand)]">CLUB</span>
      </h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Crie sua conta e monte sua garagem.</p>

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
          <span className="text-xs text-[var(--text-dim)]">Mínimo de 8 caracteres.</span>
        </label>

        {error && <p className="text-sm text-[var(--brand)]">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-2 rounded-full bg-white py-3 text-sm font-bold text-black disabled:opacity-50"
        >
          {busy ? 'Criando conta…' : 'Criar conta'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
        Já tem conta?{' '}
        <Link to="/entrar" className="font-semibold text-[var(--text)] underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}

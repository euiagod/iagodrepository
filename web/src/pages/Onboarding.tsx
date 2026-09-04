import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../lib/auth-context'
import type { Profile, ProfileType } from '../types'

const SPECIALTY_OPTIONS = [
  'Turbo',
  'Suspensão',
  'Dyno',
  'Remap/ECU',
  'Solda',
  'Preparação de motor',
  'Freios',
  'Aerodinâmica',
]

export function Onboarding() {
  const { completeOnboarding } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<'tipo' | 'dados'>('tipo')
  const [type, setType] = useState<ProfileType | null>(null)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [bio, setBio] = useState('')
  const [specialties, setSpecialties] = useState<string[]>([])
  const [address, setAddress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function toggleSpecialty(s: string) {
    setSpecialties((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!type) return
    setError(null)
    setBusy(true)
    try {
      const profile = await api.post<Profile>('/profiles/onboarding', {
        username: username.trim().toLowerCase(),
        displayName: displayName.trim(),
        type,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        bio: bio.trim() || undefined,
        specialties: type === 'oficina' ? specialties : undefined,
        address: type === 'oficina' ? address.trim() || undefined : undefined,
      })
      completeOnboarding(profile)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar seu perfil.')
    } finally {
      setBusy(false)
    }
  }

  if (step === 'tipo') {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-10">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Bem-vindo</p>
        <h1 className="mt-1 text-2xl font-extrabold">Como você usa o Cartel Club?</h1>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              setType('piloto')
              setStep('dados')
            }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--glass)] p-4 text-left transition-colors hover:border-[var(--border-active)]"
          >
            <p className="text-base font-bold">🏁 Piloto</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Você tem um carro preparado e quer mostrar o projeto.
            </p>
          </button>
          <button
            type="button"
            onClick={() => {
              setType('oficina')
              setStep('dados')
            }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--glass)] p-4 text-left transition-colors hover:border-[var(--border-active)]"
          >
            <p className="text-base font-bold">🔧 Oficina</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Você presta serviço de preparação e quer divulgar seu trabalho.
            </p>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-10">
      <button type="button" onClick={() => setStep('tipo')} className="mb-4 self-start text-sm text-[var(--text-muted)]">
        ← Voltar
      </button>
      <h1 className="text-2xl font-extrabold">
        {type === 'oficina' ? 'Dados da oficina' : 'Seu perfil de piloto'}
      </h1>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase text-[var(--text-muted)]">@usuário</span>
          <input
            required
            pattern="[a-z0-9_.]{3,24}"
            title="letras minúsculas, números, _ ou . — de 3 a 24 caracteres"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2.5 text-sm outline-none focus:border-[var(--border-active)]"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase text-[var(--text-muted)]">
            {type === 'oficina' ? 'Nome da oficina' : 'Nome de exibição'}
          </span>
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2.5 text-sm outline-none focus:border-[var(--border-active)]"
          />
        </label>
        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-[var(--text-muted)]">Cidade</span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2.5 text-sm outline-none focus:border-[var(--border-active)]"
            />
          </label>
          <label className="flex w-20 flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-[var(--text-muted)]">UF</span>
            <input
              maxLength={2}
              value={state}
              onChange={(e) => setState(e.target.value.toUpperCase())}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2.5 text-sm uppercase outline-none focus:border-[var(--border-active)]"
            />
          </label>
        </div>

        {type === 'piloto' && (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-[var(--text-muted)]">Bio</span>
            <textarea
              value={bio}
              maxLength={280}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2.5 text-sm outline-none focus:border-[var(--border-active)]"
            />
          </label>
        )}

        {type === 'oficina' && (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase text-[var(--text-muted)]">Endereço</span>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2.5 text-sm outline-none focus:border-[var(--border-active)]"
              />
            </label>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase text-[var(--text-muted)]">Especialidades</span>
              <div className="flex flex-wrap gap-2">
                {SPECIALTY_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSpecialty(s)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      specialties.includes(s)
                        ? 'border-white bg-white text-black'
                        : 'border-[var(--border)] bg-[var(--glass)] text-[var(--text-muted)]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {error && <p className="text-sm text-[var(--brand)]">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-2 rounded-full bg-white py-3 text-sm font-bold text-black disabled:opacity-50"
        >
          {busy ? 'Salvando…' : 'Concluir'}
        </button>
      </form>
    </div>
  )
}

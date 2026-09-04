import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../lib/auth-context'
import type { Profile } from '../types'

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

export function EditProfile() {
  const { user, completeOnboarding } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const profile = user?.profile

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [city, setCity] = useState(profile?.city ?? '')
  const [state, setState] = useState(profile?.state ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? '')
  const [specialties, setSpecialties] = useState<string[]>(profile?.specialties ?? [])
  const [address, setAddress] = useState(profile?.address ?? '')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.displayName)
    setBio(profile.bio ?? '')
    setCity(profile.city ?? '')
    setState(profile.state ?? '')
    setAvatarUrl(profile.avatarUrl ?? '')
    setSpecialties(profile.specialties)
    setAddress(profile.address ?? '')
  }, [profile])

  function toggleSpecialty(s: string) {
    setSpecialties((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  async function onAvatarPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await api.upload<{ url: string }>('/upload', file)
      setAvatarUrl(result.url)
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const updated = await api.patch<Profile>('/profiles/me', {
        displayName: displayName.trim(),
        bio: bio.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        avatarUrl: avatarUrl || undefined,
        specialties: profile?.type === 'oficina' ? specialties : undefined,
        address: profile?.type === 'oficina' ? address.trim() || undefined : undefined,
      })
      completeOnboarding(updated)
      navigate(`/perfil/${updated.username}`, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar.')
    } finally {
      setBusy(false)
    }
  }

  if (!profile) return null

  return (
    <div className="mx-auto max-w-md pb-6">
      <TopBar title="Editar perfil" />
      <form onSubmit={onSubmit} className="flex flex-col gap-4 px-4 py-4">
        <label className="mx-auto flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-[var(--border)] bg-[var(--glass)]">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-[var(--text-muted)]">{uploading ? '…' : '📷'}</span>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarPick} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase text-[var(--text-muted)]">Nome de exibição</span>
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

        {profile.type === 'piloto' ? (
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
        ) : (
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
          {busy ? 'Salvando…' : 'Salvar'}
        </button>
      </form>
    </div>
  )
}

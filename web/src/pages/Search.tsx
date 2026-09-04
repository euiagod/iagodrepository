import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { api } from '../lib/api'

type ProfileResult = {
  username: string
  displayName: string
  avatarUrl: string | null
  city: string | null
  state: string | null
  type: 'piloto' | 'oficina'
  isVerified: boolean
}

type CarResult = {
  id: string
  nickname: string
  brand: string
  model: string
  whp: number | null
  coverUrl: string | null
  ownerUsername: string
}

const TABS = [
  { key: 'pilotos', label: 'Pilotos' },
  { key: 'oficinas', label: 'Oficinas' },
  { key: 'carros', label: 'Carros' },
] as const

export function Search() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('pilotos')
  const [q, setQ] = useState('')
  const [profiles, setProfiles] = useState<ProfileResult[]>([])
  const [cars, setCars] = useState<CarResult[]>([])
  const [busy, setBusy] = useState(false)
  const [searched, setSearched] = useState(false)

  async function runSearch(query: string, type: typeof tab) {
    if (!query.trim()) return
    setBusy(true)
    setSearched(true)
    try {
      if (type === 'carros') {
        setCars(await api.get<CarResult[]>(`/search?q=${encodeURIComponent(query)}&type=carros`))
      } else {
        setProfiles(await api.get<ProfileResult[]>(`/search?q=${encodeURIComponent(query)}&type=${type}`))
      }
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    runSearch(q, tab)
  }

  function onTabChange(next: typeof tab) {
    setTab(next)
    if (q.trim()) runSearch(q, next)
  }

  return (
    <div className="mx-auto max-w-md pb-6">
      <TopBar title="Buscar" />
      <form onSubmit={onSubmit} className="px-4 pt-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar pilotos, oficinas ou carros…"
          className="w-full rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-2.5 text-sm outline-none focus:border-[var(--border-active)]"
        />
      </form>

      <div className="flex gap-2 px-4 py-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => onTabChange(t.key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              tab === t.key ? 'border-white bg-white text-black' : 'border-[var(--border)] text-[var(--text-muted)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {busy && <p className="px-4 text-sm text-[var(--text-muted)]">Buscando…</p>}

      {!busy && searched && tab !== 'carros' && profiles.length === 0 && (
        <p className="px-4 text-sm text-[var(--text-muted)]">Nada encontrado.</p>
      )}
      {!busy && tab !== 'carros' && (
        <ul>
          {profiles.map((p) => (
            <li key={p.username}>
              <Link to={`/perfil/${p.username}`} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--glass)]">
                {p.avatarUrl ? (
                  <img src={p.avatarUrl} className="h-10 w-10 rounded-full object-cover" alt="" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-alt)] text-sm font-bold">
                    {p.displayName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold">
                    {p.displayName} {p.isVerified && <span className="text-[var(--brand)]">✓</span>}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    @{p.username} {p.city ? `· ${p.city}` : ''}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!busy && searched && tab === 'carros' && cars.length === 0 && (
        <p className="px-4 text-sm text-[var(--text-muted)]">Nada encontrado.</p>
      )}
      {!busy && tab === 'carros' && (
        <div className="grid grid-cols-2 gap-2 px-4">
          {cars.map((c) => (
            <Link key={c.id} to={`/carro/${c.id}`} className="overflow-hidden rounded-lg border border-[var(--border)]">
              {c.coverUrl ? (
                <img src={c.coverUrl} alt={c.nickname} className="aspect-square w-full object-cover" />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center bg-[var(--surface-alt)] text-2xl">🚗</div>
              )}
              <p className="truncate px-2 py-1 text-xs font-semibold">{c.nickname}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

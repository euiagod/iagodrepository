import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth-context'
import { api } from '../lib/api'

const items = [
  { to: '/', label: 'Feed', icon: '🏠' },
  { to: '/descobrir', label: 'Descobrir', icon: '🔥' },
  { to: '/publicar', label: 'Publicar', icon: '➕' },
  { to: '/notificacoes', label: 'Avisos', icon: '🔔' },
  { to: '/garagem', label: 'Garagem', icon: '🚗' },
]

export function BottomNav() {
  const { user } = useAuth()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user?.onboarded) return
    let cancelled = false
    const load = () => {
      api
        .get<{ count: number }>('/notifications/unread-count')
        .then((r) => !cancelled && setUnread(r.count))
        .catch(() => {})
    }
    load()
    const interval = setInterval(load, 20000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [user?.onboarded])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2">
      <ul className="glass-dock mx-4 flex max-w-md items-center justify-between gap-1 rounded-full border border-[var(--border-active)] px-3 py-2 shadow-[0_20px_48px_rgba(0,0,0,0.6)] md:mx-auto">
        {items.map((item) => (
          <li key={item.to} className="relative">
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 rounded-full px-3 py-1.5 text-[10px] font-semibold transition-colors ${
                  isActive ? 'bg-white text-black' : 'text-[var(--text-muted)]'
                }`
              }
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </NavLink>
            {item.to === '/notificacoes' && unread > 0 && (
              <span className="absolute right-1 top-0.5 h-2 w-2 rounded-full bg-[var(--brand)]" />
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}

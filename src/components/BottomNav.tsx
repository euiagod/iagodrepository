import { NavLink } from 'react-router-dom'
import { currentUserId } from '../data/mock'

const items = [
  { to: '/', label: 'Feed', icon: '🏠' },
  { to: '/descobrir', label: 'Descobrir', icon: '🔥' },
  { to: '/publicar', label: 'Publicar', icon: '➕' },
  { to: `/perfil/${currentUserId}`, label: 'Perfil', icon: '🚗' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md items-center justify-between px-6 py-2">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium ${
                  isActive ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'
                }`
              }
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

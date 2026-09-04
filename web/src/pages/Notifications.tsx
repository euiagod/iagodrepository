import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { api } from '../lib/api'
import type { AppNotification } from '../types'

const LABEL: Record<AppNotification['type'], (name: string) => string> = {
  like: (n) => `${n} curtiu seu post`,
  comment: (n) => `${n} comentou no seu post`,
  follow: (n) => `${n} começou a seguir você`,
  match: (n) => `Você deu match com ${n}!`,
  dyno_homologado: () => 'Seu certificado de dyno foi homologado',
  lap_record: () => 'Novo recorde de volta registrado',
}

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export function Notifications() {
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<AppNotification[]>('/notifications')
      .then(setItems)
      .finally(() => setLoading(false))
    api.post('/notifications/read-all').catch(() => {})
  }, [])

  return (
    <div className="mx-auto max-w-md pb-6">
      <TopBar title="Avisos" />
      {loading && <p className="p-4 text-sm text-[var(--text-muted)]">Carregando…</p>}
      {!loading && items.length === 0 && (
        <p className="p-6 text-center text-sm text-[var(--text-muted)]">Nenhuma notificação ainda.</p>
      )}
      <ul>
        {items.map((n) => (
          <li key={n.id} className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
            {n.actor?.avatarUrl ? (
              <img src={n.actor.avatarUrl} className="h-9 w-9 rounded-full object-cover" alt="" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-alt)] text-xs font-bold">
                {n.actor?.displayName.slice(0, 1).toUpperCase() ?? '?'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                {n.actor ? (
                  <Link to={`/perfil/${n.actor.username}`} className="font-semibold">
                    {LABEL[n.type](n.actor.displayName)}
                  </Link>
                ) : (
                  LABEL[n.type]('')
                )}
              </p>
              <p className="text-xs text-[var(--text-dim)]">{timeAgo(n.createdAt)}</p>
            </div>
            {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--brand)]" />}
          </li>
        ))}
      </ul>
    </div>
  )
}

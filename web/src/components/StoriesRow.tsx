import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { StoryProfile } from '../types'

export function StoriesRow() {
  const [profiles, setProfiles] = useState<StoryProfile[]>([])

  useEffect(() => {
    api
      .get<StoryProfile[]>('/profiles/me/following')
      .then(setProfiles)
      .catch(() => {})
  }, [])

  return (
    <div className="flex gap-4 overflow-x-auto border-b border-[var(--border)] px-4 py-3">
      <Link to="/publicar" className="flex shrink-0 flex-col items-center gap-1">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-[var(--border-active)] bg-[var(--glass)] text-xl">
          +
        </span>
        <span className="text-[10px] font-semibold text-[var(--text-muted)]">Novo post</span>
      </Link>

      {profiles.map((p) => (
        <Link key={p.username} to={`/perfil/${p.username}`} className="flex shrink-0 flex-col items-center gap-1">
          {p.avatarUrl ? (
            <img
              src={p.avatarUrl}
              alt={p.displayName}
              className="h-14 w-14 rounded-full border-2 border-[var(--brand)] object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--brand)] bg-[var(--surface-alt)] text-lg font-bold">
              {p.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="max-w-14 truncate text-[10px] font-semibold text-[var(--text-muted)]">
            @{p.username}
          </span>
        </Link>
      ))}
    </div>
  )
}

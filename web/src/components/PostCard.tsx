import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { Post } from '../types'

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days}d`
}

async function share(post: Post) {
  const url = `${window.location.origin}/post/${post.id}`
  if (navigator.share) {
    await navigator.share({ title: 'Cartel Club', text: post.caption ?? '', url }).catch(() => {})
  } else {
    await navigator.clipboard.writeText(url).catch(() => {})
  }
}

export function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.likedByMe)
  const [likes, setLikes] = useState(post.likesCount)
  const [busyLike, setBusyLike] = useState(false)
  const [following, setFollowing] = useState(post.author.isFollowedByMe)
  const [busyFollow, setBusyFollow] = useState(false)

  async function toggleLike() {
    if (busyLike) return
    setBusyLike(true)
    const next = !liked
    setLiked(next)
    setLikes((n) => n + (next ? 1 : -1))
    try {
      const result = next
        ? await api.post<{ likedByMe: boolean; likesCount: number }>(`/posts/${post.id}/like`)
        : await api.delete<{ likedByMe: boolean; likesCount: number }>(`/posts/${post.id}/like`)
      setLiked(result.likedByMe)
      setLikes(result.likesCount)
    } catch {
      setLiked(!next)
      setLikes((n) => n + (next ? -1 : 1))
    } finally {
      setBusyLike(false)
    }
  }

  async function toggleFollow() {
    if (busyFollow) return
    setBusyFollow(true)
    const next = !following
    setFollowing(next)
    try {
      if (next) await api.post(`/profiles/${post.author.username}/follow`)
      else await api.delete(`/profiles/${post.author.username}/follow`)
    } catch {
      setFollowing(!next)
    } finally {
      setBusyFollow(false)
    }
  }

  const car = post.car

  return (
    <article className="border-b border-[var(--border)] pb-4">
      <div className="flex items-center gap-3 px-4 py-3">
        <Link to={`/perfil/${post.author.username}`} className="shrink-0">
          {post.author.avatarUrl ? (
            <img src={post.author.avatarUrl} alt={post.author.displayName} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-alt)] text-sm font-bold">
              {post.author.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <Link to={`/perfil/${post.author.username}`} className="flex items-center gap-1 truncate text-sm font-bold">
            {post.author.displayName}
            {post.author.isVerified && <span className="text-[var(--brand)]">✓</span>}
          </Link>
          <p className="truncate text-xs text-[var(--text-muted)]">
            {post.author.type === 'oficina' ? 'Oficina' : 'Piloto'}
            {post.location ? ` · ${post.location}` : ''} · {timeAgo(post.createdAt)}
          </p>
        </div>
        {!post.author.isMe && (
          <button
            type="button"
            onClick={toggleFollow}
            disabled={busyFollow}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold ${
              following ? 'border border-[var(--border-active)] text-[var(--text)]' : 'bg-white text-black'
            }`}
          >
            {following ? 'Seguindo' : 'Seguir'}
          </button>
        )}
      </div>

      {post.media[0] && (
        <div className="relative">
          <button type="button" onDoubleClick={() => !liked && toggleLike()} className="block w-full" aria-label="Curtir com duplo toque">
            <img src={post.media[0].url} alt={post.caption ?? ''} className="aspect-[4/5] w-full object-cover" loading="lazy" />
          </button>

          {car && (car.dynoCertified || car.stage) && (
            <div className="pointer-events-none absolute left-3 top-3 flex gap-1.5">
              {car.dynoCertified && (
                <span className="glass-panel rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  Dyno Certified
                </span>
              )}
              {car.stage && (
                <span className="glass-panel rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  {car.stage}
                </span>
              )}
            </div>
          )}

          {car?.whp && (
            <Link
              to={`/carro/${car.id}`}
              className="glass-dock absolute bottom-3 right-3 rounded-full border border-[var(--border-active)] px-3 py-1.5"
            >
              <span className="tabular-nums text-base font-extrabold text-white">{car.whp}</span>
              <span className="ml-1 text-[10px] font-semibold uppercase text-[var(--text-muted)]">whp</span>
            </Link>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 px-4 pt-3 text-2xl">
        <button
          type="button"
          onClick={toggleLike}
          className={liked ? 'text-[var(--brand)]' : 'text-[var(--text)]'}
          aria-pressed={liked}
          aria-label="Curtir"
        >
          {liked ? '❤️' : '🤍'}
        </button>
        <Link to={`/post/${post.id}`} aria-label="Comentar">
          💬
        </Link>
        <button type="button" onClick={() => share(post)} aria-label="Compartilhar">
          ↗️
        </button>
      </div>

      <p className="tabular-nums px-4 pt-2 text-sm font-bold">{likes} curtidas</p>

      {car && (car.whp || car.torqueKgfm || car.boostBar) && (
        <div className="glass-panel mx-4 mt-3 rounded-2xl px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
              Ficha técnica do projeto
            </p>
            <Link to={`/carro/${car.id}`} className="text-[10px] font-semibold text-[var(--text-muted)] underline">
              ver tudo
            </Link>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {car.whp !== null && <Metric label="Potência" value={`${car.whp}`} unit="whp" />}
            {car.torqueKgfm !== null && <Metric label="Torque" value={`${car.torqueKgfm}`} unit="kgfm" />}
            {car.boostBar !== null && <Metric label="Pressão" value={`${car.boostBar}`} unit="bar" />}
          </div>
        </div>
      )}

      {car && car.mods.length > 0 && (
        <div className="mx-4 mt-3 flex flex-wrap gap-1.5">
          {car.mods.map((m) => (
            <span key={m.id} className="rounded-full border border-[var(--border)] bg-[var(--glass)] px-2.5 py-1 text-[11px] font-semibold">
              {m.label}
            </span>
          ))}
        </div>
      )}

      {post.caption && (
        <p className="px-4 pt-3 text-sm">
          <span className="font-bold">{post.author.username}</span>{' '}
          <span className="text-[var(--text-muted)]">{post.caption}</span>
        </p>
      )}
      {post.commentsCount > 0 && (
        <Link to={`/post/${post.id}`} className="block px-4 pt-1 text-xs text-[var(--text-muted)]">
          Ver todos os {post.commentsCount} comentários
        </Link>
      )}
    </article>
  )
}

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
      <p className="tabular-nums text-sm font-extrabold text-white">
        {value} <span className="text-[10px] font-semibold text-[var(--text-muted)]">{unit}</span>
      </p>
    </div>
  )
}

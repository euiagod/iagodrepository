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

export function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.likedByMe)
  const [likes, setLikes] = useState(post.likesCount)
  const [busy, setBusy] = useState(false)

  async function toggleLike() {
    if (busy) return
    setBusy(true)
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
      setBusy(false)
    }
  }

  return (
    <article className="border-b border-[var(--border)] pb-3">
      <div className="flex items-center gap-3 px-4 py-3">
        {post.author.avatarUrl ? (
          <img src={post.author.avatarUrl} alt={post.author.displayName} className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-alt)] text-xs font-bold">
            {post.author.displayName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <Link to={`/perfil/${post.author.username}`} className="flex items-center gap-1 truncate text-sm font-semibold">
            {post.author.displayName}
            {post.author.isVerified && <span className="text-[var(--brand)]">✓</span>}
          </Link>
          <p className="truncate text-xs text-[var(--text-muted)]">
            {post.author.type === 'oficina' ? 'Oficina' : 'Piloto'}
            {post.location ? ` · ${post.location}` : ''} · {timeAgo(post.createdAt)}
          </p>
        </div>
      </div>

      {post.car && (
        <Link
          to={`/carro/${post.car.id}`}
          className="mx-4 mb-2 flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--glass)] px-3 py-2 text-xs"
        >
          <span className="truncate">
            {post.car.brand} {post.car.model} — {post.car.nickname}
          </span>
          <span className="flex items-center gap-2 tabular-nums font-semibold text-[var(--text)]">
            {post.car.dynoCertified && <span className="text-[var(--brand)]">DYNO</span>}
            {post.car.whp ? `${post.car.whp} whp` : post.car.stage}
          </span>
        </Link>
      )}

      {post.media[0] && (
        <button type="button" onDoubleClick={() => !liked && toggleLike()} className="block w-full" aria-label="Curtir com duplo toque">
          <img src={post.media[0].url} alt={post.caption ?? ''} className="aspect-square w-full object-cover" loading="lazy" />
        </button>
      )}

      <div className="flex items-center gap-4 px-4 pt-2 text-xl">
        <button
          type="button"
          onClick={toggleLike}
          className={liked ? 'text-[var(--brand)]' : 'text-[var(--text)]'}
          aria-pressed={liked}
          aria-label="Curtir"
        >
          {liked ? '❤️' : '🤍'}
        </button>
        <Link to={`/post/${post.id}`} className="text-xl">
          💬
        </Link>
      </div>

      <p className="tabular-nums px-4 pt-1 text-sm font-semibold">{likes} curtidas</p>
      {post.caption && (
        <p className="px-4 text-sm">
          <span className="font-semibold">{post.author.username}</span>{' '}
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

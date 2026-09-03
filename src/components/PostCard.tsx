import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Post, Profile, Car } from '../types/domain'

export function PostCard({
  post,
  author,
  car,
}: {
  post: Post
  author: Profile
  car?: Car
}) {
  const [liked, setLiked] = useState(post.likedByMe ?? false)
  const [likes, setLikes] = useState(post.likesCount)

  function toggleLike() {
    setLiked((prev) => {
      setLikes((count) => (prev ? count - 1 : count + 1))
      return !prev
    })
  }

  return (
    <article className="border-b border-[var(--border)] pb-3">
      <div className="flex items-center gap-3 px-4 py-3">
        <img
          src={author.avatarUrl}
          alt={author.displayName}
          className="h-9 w-9 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <Link to={`/perfil/${author.id}`} className="block truncate text-sm font-semibold">
            {author.displayName}
            {author.verified && <span className="ml-1 text-[var(--accent)]">✓</span>}
          </Link>
          {car && (
            <Link
              to={`/carro/${car.id}`}
              className="block truncate text-xs text-[var(--text-muted)]"
            >
              {car.brand} {car.model} · {car.spec.whp} whp
            </Link>
          )}
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            author.type === 'oficina'
              ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
              : 'bg-[var(--brand)]/15 text-[var(--brand-ink)]'
          }`}
        >
          {author.type === 'oficina' ? 'Oficina' : 'Piloto'}
        </span>
      </div>

      <button
        type="button"
        onDoubleClick={() => !liked && toggleLike()}
        className="block w-full"
        aria-label="Curtir com duplo toque"
      >
        <img
          src={post.photoUrls[0]}
          alt={post.caption}
          className="aspect-square w-full object-cover"
          loading="lazy"
        />
      </button>

      <div className="flex items-center gap-4 px-4 pt-2 text-xl">
        <button
          type="button"
          onClick={toggleLike}
          className={liked ? 'text-[var(--danger)]' : 'text-[var(--text)]'}
          aria-pressed={liked}
          aria-label="Curtir"
        >
          {liked ? '❤️' : '🤍'}
        </button>
        <span className="text-xl">💬</span>
      </div>

      <p className="px-4 pt-1 text-sm font-semibold">{likes} curtidas</p>
      <p className="px-4 text-sm">
        <span className="font-semibold">{author.username}</span>{' '}
        <span className="text-[var(--text-muted)]">{post.caption}</span>
      </p>
      <p className="px-4 pt-1 text-xs text-[var(--text-muted)]">
        {post.commentsCount} comentários
      </p>
    </article>
  )
}

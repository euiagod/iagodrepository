import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { PostCard } from '../components/PostCard'
import { api } from '../lib/api'
import type { Comment, Post } from '../types'

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  return `há ${Math.floor(hours / 24)}d`
}

export function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([api.get<Post>(`/posts/${id}`), api.get<Comment[]>(`/posts/${id}/comments`)])
      .then(([p, c]) => {
        setPost(p)
        setComments(c)
      })
      .finally(() => setLoading(false))
  }, [id])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!id || !body.trim()) return
    setSending(true)
    try {
      await api.post(`/posts/${id}/comments`, { body: body.trim() })
      setBody('')
      const fresh = await api.get<Comment[]>(`/posts/${id}/comments`)
      setComments(fresh)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col pb-24">
      <TopBar title="Post" />
      {loading && <p className="p-4 text-sm text-[var(--text-muted)]">Carregando…</p>}
      {!loading && !post && <p className="p-4 text-sm text-[var(--text-muted)]">Post não encontrado.</p>}
      {post && <PostCard post={post} />}

      <div className="flex-1 px-4 py-3">
        {comments.length === 0 && (
          <p className="py-6 text-center text-sm text-[var(--text-muted)]">Seja o primeiro a comentar.</p>
        )}
        <ul className="flex flex-col gap-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-2 text-sm">
              {c.author.avatarUrl ? (
                <img src={c.author.avatarUrl} className="h-7 w-7 rounded-full object-cover" alt="" />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-alt)] text-[10px] font-bold">
                  {c.author.displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <p>
                  <span className="font-semibold">{c.author.username}</span>{' '}
                  <span className="text-[var(--text-muted)]">{c.body}</span>
                </p>
                <p className="text-[11px] text-[var(--text-dim)]">{timeAgo(c.createdAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <form
        onSubmit={onSubmit}
        className="fixed bottom-0 left-0 right-0 mx-auto flex max-w-md gap-2 border-t border-[var(--border)] bg-[var(--void)] p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]"
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={500}
          placeholder="Escreva um comentário…"
          className="flex-1 rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-2 text-sm outline-none focus:border-[var(--border-active)]"
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="rounded-full bg-white px-4 py-2 text-sm font-bold text-black disabled:opacity-40"
        >
          Enviar
        </button>
      </form>
    </div>
  )
}

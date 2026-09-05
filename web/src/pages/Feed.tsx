import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { PostCard } from '../components/PostCard'
import { StoriesRow } from '../components/StoriesRow'
import { api } from '../lib/api'
import type { Post } from '../types'

interface FeedResponse {
  posts: Post[]
  nextCursor: string | null
  personalized: boolean
}

export function Feed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [personalized, setPersonalized] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadInitial = useCallback(() => {
    setLoading(true)
    setError(false)
    api
      .get<FeedResponse>('/posts/feed?limit=8')
      .then((r) => {
        setPosts(r.posts)
        setCursor(r.nextCursor)
        setPersonalized(r.personalized)
        setHasMore(Boolean(r.nextCursor))
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  const loadMore = useCallback(() => {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    api
      .get<FeedResponse>(`/posts/feed?limit=8&cursor=${encodeURIComponent(cursor)}`)
      .then((r) => {
        setPosts((prev) => [...prev, ...r.posts])
        setCursor(r.nextCursor)
        setHasMore(Boolean(r.nextCursor))
      })
      .finally(() => setLoadingMore(false))
  }, [cursor, loadingMore])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore()
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  return (
    <div className="mx-auto max-w-md">
      <TopBar
        title="Cartel Club"
        brand
        right={
          <Link to="/notificacoes" className="text-2xl">
            🔔
          </Link>
        }
      />

      <StoriesRow />

      {loading && (
        <div className="flex flex-col gap-3 p-4">
          {[0, 1].map((i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-9 w-9 rounded-full bg-[var(--surface-alt)]" />
              <div className="aspect-square w-full rounded-xl bg-[var(--surface-alt)]" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-sm text-[var(--text-muted)]">Não deu pra carregar o feed agora.</p>
          <button onClick={loadInitial} className="rounded-full border border-[var(--border)] px-4 py-2 text-sm">
            Tentar de novo
          </button>
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-3xl">🏁</p>
          <p className="text-sm text-[var(--text-muted)]">
            Ainda não há posts por aqui. Que tal publicar o primeiro?
          </p>
          <Link to="/publicar" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-black">
            Publicar
          </Link>
        </div>
      )}

      {!loading && !error && posts.length > 0 && (
        <>
          {!personalized && (
            <p className="px-4 py-2 text-xs text-[var(--text-muted)]">
              Você ainda não segue ninguém — mostrando os posts mais recentes da comunidade.{' '}
              <Link to="/descobrir" className="underline">
                Ir para Descobrir
              </Link>
            </p>
          )}
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          <div ref={sentinelRef} className="h-10" />
          {loadingMore && <p className="pb-4 text-center text-xs text-[var(--text-muted)]">Carregando…</p>}
        </>
      )}
    </div>
  )
}

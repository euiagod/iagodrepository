import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { SpecSheet } from '../components/SpecSheet'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth-context'
import type { Car, Post } from '../types'

export function CarDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [car, setCar] = useState<Car | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api
      .get<Car>(`/cars/${id}`)
      .then((c) => {
        setCar(c)
        return api.get<Post[]>(`/posts/by-car/${id}`).catch(() => [])
      })
      .then(setPosts)
      .catch(() => setCar(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto max-w-md">
        <TopBar title="Carro" />
        <div className="aspect-video w-full animate-pulse bg-[var(--surface-alt)]" />
      </div>
    )
  }

  if (!car) {
    return (
      <div className="mx-auto max-w-md">
        <TopBar title="Carro" />
        <p className="p-4 text-[var(--text-muted)]">Projeto não encontrado.</p>
      </div>
    )
  }

  const carPosts = posts.filter((p) => p.car?.id === car.id)
  const isOwner = user?.id === car.ownerId

  return (
    <div className="mx-auto max-w-md pb-6">
      <TopBar
        title={car.nickname}
        right={
          isOwner ? (
            <Link to={`/garagem/carro/${car.id}/editar`} className="text-xs font-semibold underline">
              Editar
            </Link>
          ) : undefined
        }
      />
      {car.coverUrl ? (
        <img src={car.coverUrl} alt={car.nickname} className="aspect-video w-full object-cover" />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-[var(--surface-alt)] text-4xl">🚗</div>
      )}

      <div className="px-4 py-3">
        <p className="text-2xl font-extrabold">
          {car.brand} {car.model}
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          {car.year} · {car.buildStatus} {car.stage ? `· ${car.stage}` : ''}
        </p>
      </div>

      <div className="px-4">
        <h2 className="pb-2 text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">Ficha técnica</h2>
        <SpecSheet car={car} />
      </div>

      {car.mods.length > 0 && (
        <div className="px-4 pt-4">
          <h2 className="pb-2 text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">Preparação</h2>
          <div className="flex flex-wrap gap-1.5">
            {car.mods.map((m) => (
              <span key={m.id} className="rounded-full border border-[var(--border)] bg-[var(--glass)] px-3 py-1 text-xs font-semibold">
                {m.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <h2 className="px-4 pb-2 pt-4 text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">
        Posts desse projeto
      </h2>
      {carPosts.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-[var(--text-muted)]">Nenhum post vinculado a esse carro ainda.</p>
      ) : (
        <div className="grid grid-cols-3 gap-0.5 px-0.5">
          {carPosts.map((post) => (
            <Link key={post.id} to={`/post/${post.id}`}>
              {post.media[0] && <img src={post.media[0].url} alt={post.caption ?? ''} className="aspect-square w-full object-cover" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

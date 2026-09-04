import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../lib/auth-context'
import type { Car, Post, PublicProfile } from '../types'

export function Profile() {
  const { username } = useParams<{ username: string }>()
  const { user } = useAuth()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [cars, setCars] = useState<Car[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [followBusy, setFollowBusy] = useState(false)

  const load = useCallback(() => {
    if (!username) return
    setLoading(true)
    setNotFound(false)
    api
      .get<PublicProfile>(`/profiles/${username}`)
      .then((p) => {
        setProfile(p)
        return Promise.all([
          api.get<Car[]>(`/cars?owner=${username}`),
          api.get<Post[]>(`/posts/by/${username}`),
        ])
      })
      .then(([c, p]) => {
        setCars(c)
        setPosts(p)
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true)
      })
      .finally(() => setLoading(false))
  }, [username])

  useEffect(() => {
    load()
  }, [load])

  async function toggleFollow() {
    if (!profile || followBusy) return
    setFollowBusy(true)
    try {
      if (profile.isFollowing) {
        await api.delete(`/profiles/${profile.username}/follow`)
        setProfile({ ...profile, isFollowing: false, followersCount: profile.followersCount - 1 })
      } else {
        await api.post(`/profiles/${profile.username}/follow`)
        setProfile({ ...profile, isFollowing: true, followersCount: profile.followersCount + 1 })
      }
    } finally {
      setFollowBusy(false)
    }
  }

  if (!loading && notFound) {
    return (
      <div className="mx-auto max-w-md">
        <TopBar title="Perfil" />
        <p className="p-6 text-center text-sm text-[var(--text-muted)]">Esse perfil não existe.</p>
      </div>
    )
  }

  if (loading || !profile) {
    return (
      <div className="mx-auto max-w-md">
        <TopBar title="Perfil" />
        <div className="animate-pulse space-y-4 p-4">
          <div className="h-20 w-20 rounded-full bg-[var(--surface-alt)]" />
          <div className="h-4 w-40 rounded bg-[var(--surface-alt)]" />
        </div>
      </div>
    )
  }

  if (profile.isMe && user?.profile?.username && username !== user.profile.username) {
    return <Navigate to={`/perfil/${user.profile.username}`} replace />
  }

  return (
    <div className="mx-auto max-w-md pb-6">
      <TopBar title={`@${profile.username}`} />

      <div className="flex items-center gap-4 px-4 py-4">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt={profile.displayName} className="h-20 w-20 rounded-full border-2 border-[var(--brand)] object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[var(--brand)] bg-[var(--surface-alt)] text-2xl font-bold">
            {profile.displayName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="flex flex-1 justify-around text-center">
          <Stat label="carros" value={profile.carsCount} />
          <Stat label="seguidores" value={profile.followersCount} />
          <Stat label="seguindo" value={profile.followingCount} />
        </div>
      </div>

      <div className="px-4">
        <p className="flex items-center gap-2 font-semibold">
          {profile.displayName}
          {profile.isVerified && <span className="text-[var(--brand)]">✓</span>}
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
              profile.type === 'oficina' ? 'border-[var(--brand)] text-[var(--brand)]' : 'border-[var(--border)] text-[var(--text-muted)]'
            }`}
          >
            {profile.type === 'oficina' ? 'Oficina' : 'Piloto'}
          </span>
        </p>
        {profile.bio && <p className="text-sm text-[var(--text-muted)]">{profile.bio}</p>}
        {(profile.city || profile.state) && (
          <p className="text-xs text-[var(--text-muted)]">
            📍 {[profile.city, profile.state].filter(Boolean).join(', ')}
          </p>
        )}
        {profile.specialties.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {profile.specialties.map((s) => (
              <span key={s} className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 px-4 py-4">
        {profile.isMe ? (
          <Link to="/garagem/editar" className="flex-1 rounded-full border border-[var(--border)] py-2 text-center text-sm font-semibold">
            Editar perfil
          </Link>
        ) : (
          <>
            <button
              onClick={toggleFollow}
              disabled={followBusy}
              className={`flex-1 rounded-full py-2 text-sm font-semibold ${
                profile.isFollowing ? 'border border-[var(--border)]' : 'bg-white text-black'
              }`}
            >
              {profile.isFollowing ? 'Seguindo' : 'Seguir'}
            </button>
          </>
        )}
      </div>

      <div className="flex items-center justify-between px-4 pb-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">Projetos</h2>
        {profile.isMe && (
          <Link to="/garagem/carro/novo" className="text-xs font-semibold text-[var(--text)] underline">
            + Adicionar carro
          </Link>
        )}
      </div>
      {cars.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-[var(--text-muted)]">Nenhum carro cadastrado ainda.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 px-4">
          {cars.map((car) => (
            <Link key={car.id} to={`/carro/${car.id}`} className="overflow-hidden rounded-lg border border-[var(--border)]">
              {car.coverUrl ? (
                <img src={car.coverUrl} alt={car.nickname} className="aspect-square w-full object-cover" />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center bg-[var(--surface-alt)] text-3xl">🚗</div>
              )}
              <p className="truncate px-2 py-1 text-xs font-semibold">{car.nickname}</p>
            </Link>
          ))}
        </div>
      )}

      <h2 className="px-4 pb-2 pt-4 text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">Posts</h2>
      {posts.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-[var(--text-muted)]">Nenhum post ainda.</p>
      ) : (
        <div className="grid grid-cols-3 gap-0.5 px-0.5">
          {posts.map((post) => (
            <Link key={post.id} to={`/post/${post.id}`}>
              {post.media[0] ? (
                <img src={post.media[0].url} alt={post.caption ?? ''} className="aspect-square w-full object-cover" />
              ) : (
                <div className="aspect-square w-full bg-[var(--surface-alt)]" />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="tabular-nums text-lg font-bold">{value}</p>
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
    </div>
  )
}

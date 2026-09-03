import { Link, useParams } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { cars, posts, profiles } from '../data/mock'

export function Profile() {
  const { id } = useParams()
  const profile = profiles.find((p) => p.id === id) ?? profiles[0]
  const ownedCars = cars.filter((c) => c.ownerId === profile.id)
  const ownedPosts = posts.filter((p) => p.authorId === profile.id)

  return (
    <div className="mx-auto max-w-md pb-6">
      <TopBar title={`@${profile.username}`} />

      <div className="flex items-center gap-4 px-4 py-4">
        <img
          src={profile.avatarUrl}
          alt={profile.displayName}
          className="h-20 w-20 rounded-full border-2 border-[var(--brand)] object-cover"
        />
        <div className="flex flex-1 justify-around text-center">
          <div>
            <p className="font-display text-lg font-bold">{ownedCars.length}</p>
            <p className="text-xs text-[var(--text-muted)]">carros</p>
          </div>
          <div>
            <p className="font-display text-lg font-bold">{profile.followersCount}</p>
            <p className="text-xs text-[var(--text-muted)]">seguidores</p>
          </div>
          <div>
            <p className="font-display text-lg font-bold">{profile.followingCount}</p>
            <p className="text-xs text-[var(--text-muted)]">seguindo</p>
          </div>
        </div>
      </div>

      <div className="px-4">
        <p className="flex items-center gap-2 font-semibold">
          {profile.displayName}
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              profile.type === 'oficina'
                ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                : 'bg-[var(--brand)]/15 text-[var(--brand-ink)]'
            }`}
          >
            {profile.type === 'oficina' ? 'Oficina' : 'Piloto'}
          </span>
        </p>
        <p className="text-sm text-[var(--text-muted)]">{profile.bio}</p>
        <p className="text-xs text-[var(--text-muted)]">📍 {profile.location}</p>
        {profile.specialties && (
          <div className="mt-2 flex flex-wrap gap-1">
            {profile.specialties.map((s) => (
              <span
                key={s}
                className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--text-muted)]"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 px-4 py-4">
        <button className="flex-1 rounded-lg bg-[var(--brand)] py-2 text-sm font-semibold text-white">
          Seguir
        </button>
        <button className="flex-1 rounded-lg border border-[var(--border)] py-2 text-sm font-semibold">
          Mensagem
        </button>
      </div>

      <h2 className="px-4 pb-2 font-display text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">
        Projetos
      </h2>
      <div className="grid grid-cols-2 gap-2 px-4">
        {ownedCars.map((car) => (
          <Link
            key={car.id}
            to={`/carro/${car.id}`}
            className="overflow-hidden rounded-lg border border-[var(--border)]"
          >
            <img src={car.coverPhotoUrl} alt={car.name} className="aspect-square w-full object-cover" />
            <p className="truncate px-2 py-1 text-xs font-semibold">{car.name}</p>
          </Link>
        ))}
      </div>

      <h2 className="px-4 pb-2 pt-4 font-display text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">
        Posts
      </h2>
      <div className="grid grid-cols-3 gap-0.5 px-0.5">
        {ownedPosts.map((post) => (
          <img
            key={post.id}
            src={post.photoUrls[0]}
            alt={post.caption}
            className="aspect-square w-full object-cover"
          />
        ))}
      </div>
    </div>
  )
}

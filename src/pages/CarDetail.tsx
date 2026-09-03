import { Link, useParams } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { SpecSheet } from '../components/SpecSheet'
import { cars, posts, profiles } from '../data/mock'

export function CarDetail() {
  const { id } = useParams()
  const car = cars.find((c) => c.id === id)
  const owner = car ? profiles.find((p) => p.id === car.ownerId) : undefined
  const carPosts = posts.filter((p) => p.carId === id)

  if (!car || !owner) {
    return (
      <div className="mx-auto max-w-md">
        <TopBar title="Carro" />
        <p className="p-4 text-[var(--text-muted)]">Projeto não encontrado.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md pb-6">
      <TopBar title={car.name} />
      <img src={car.coverPhotoUrl} alt={car.name} className="aspect-video w-full object-cover" />

      <div className="px-4 py-3">
        <p className="font-display text-2xl font-bold">
          {car.brand} {car.model}
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          {car.year} · {car.buildStage}
        </p>
        <Link
          to={`/perfil/${owner.id}`}
          className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2"
        >
          <img src={owner.avatarUrl} alt={owner.displayName} className="h-8 w-8 rounded-full object-cover" />
          <span className="text-sm font-semibold">{owner.displayName}</span>
        </Link>
      </div>

      <div className="px-4">
        <h2 className="pb-2 font-display text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">
          Ficha técnica
        </h2>
        <SpecSheet spec={car.spec} />
      </div>

      <h2 className="px-4 pb-2 pt-4 font-display text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">
        Posts desse projeto
      </h2>
      <div className="grid grid-cols-3 gap-0.5 px-0.5">
        {carPosts.map((post) => (
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

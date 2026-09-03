import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { cars, currentUserId } from '../data/mock'

export function Upload() {
  const navigate = useNavigate()
  const myCars = cars.filter((c) => c.ownerId === currentUserId)
  const [preview, setPreview] = useState<string | null>(null)
  const [carId, setCarId] = useState(myCars[0]?.id ?? '')
  const [caption, setCaption] = useState('')

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Sem backend configurado, a publicação é só simulada nesta versão.
    // Com Supabase (ver src/lib/supabase.ts), aqui vai o upload pro Storage
    // e o insert na tabela `posts`.
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-md pb-6">
      <TopBar title="Nova publicação" />
      <form onSubmit={onSubmit} className="flex flex-col gap-4 px-4 py-4">
        <label className="flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface-alt)]">
          {preview ? (
            <img src={preview} alt="Prévia" className="h-full w-full object-cover" />
          ) : (
            <span className="text-center text-sm text-[var(--text-muted)]">
              📷
              <br />
              Toque para escolher uma foto
            </span>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={onFile} />
        </label>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">
            Projeto
          </label>
          <select
            value={carId}
            onChange={(e) => setCarId(e.target.value)}
            className="w-full rounded-lg border border-[var(--field-border,var(--border))] bg-[var(--surface-alt)] px-3 py-2 text-sm"
          >
            {myCars.map((car) => (
              <option key={car.id} value={car.id}>
                {car.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">
            Legenda
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            placeholder="Conte o que mudou no projeto..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={!preview}
          className="rounded-lg bg-[var(--brand)] py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          Publicar
        </button>
      </form>
    </div>
  )
}

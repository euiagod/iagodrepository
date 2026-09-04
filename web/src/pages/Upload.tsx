import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../lib/auth-context'
import type { Car } from '../types'

export function Upload() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [myCars, setMyCars] = useState<Car[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [carId, setCarId] = useState('')
  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const username = user?.profile?.username
    if (!username) return
    api.get<Car[]>(`/cars?owner=${username}`).then(setMyCars)
  }, [user?.profile?.username])

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      const { url } = await api.upload<{ url: string }>('/upload', file)
      const post = await api.post<{ id: string }>('/posts', {
        caption: caption.trim() || undefined,
        location: location.trim() || undefined,
        carId: carId || undefined,
        mediaUrls: [url],
      })
      navigate(`/post/${post.id}`, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível publicar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md pb-6">
      <TopBar title="Nova publicação" />
      <form onSubmit={onSubmit} className="flex flex-col gap-4 px-4 py-4">
        <label className="flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--glass)]">
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
          <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">Projeto</label>
          <select
            value={carId}
            onChange={(e) => setCarId(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm"
          >
            <option value="">Sem carro vinculado</option>
            {myCars.map((car) => (
              <option key={car.id} value={car.id}>
                {car.nickname}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">Localização</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="ex.: Interlagos, SP"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">Legenda</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Conte o que mudou no projeto..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-[var(--brand)]">{error}</p>}

        <button
          type="submit"
          disabled={!file || busy}
          className="rounded-full bg-white py-3 text-sm font-bold text-black disabled:opacity-40"
        >
          {busy ? 'Publicando…' : 'Publicar'}
        </button>
      </form>
    </div>
  )
}

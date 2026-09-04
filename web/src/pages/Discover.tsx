import { useCallback, useEffect, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { api } from '../lib/api'
import type { DiscoverCar } from '../types'

interface DragState {
  startX: number
  dx: number
  dragging: boolean
}

export function Discover() {
  const [deck, setDeck] = useState<DiscoverCar[]>([])
  const [loading, setLoading] = useState(true)
  const [drag, setDrag] = useState<DragState>({ startX: 0, dx: 0, dragging: false })
  const [toast, setToast] = useState<string | null>(null)

  const loadDeck = useCallback(() => {
    setLoading(true)
    api
      .get<DiscoverCar[]>('/discover?limit=15')
      .then(setDeck)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadDeck()
  }, [loadDeck])

  const car = deck[0]

  function showToast(text: string) {
    setToast(text)
    window.setTimeout(() => setToast(null), 1400)
  }

  async function decide(direction: 'like' | 'pass') {
    if (!car) return
    const current = car
    setDeck((prev) => prev.slice(1))
    setDrag({ startX: 0, dx: 0, dragging: false })
    try {
      const result = await api.post<{ matched: boolean }>('/discover/swipe', { carId: current.id, direction })
      if (result.matched) {
        showToast(`🔥 Match com ${current.owner.displayName}!`)
      } else if (direction === 'like') {
        showToast('Seguindo o projeto')
      }
    } catch {
      // swipe já registrado ou carro inválido: segue para o próximo mesmo assim
    }
  }

  function onPointerDown(e: ReactPointerEvent) {
    setDrag({ startX: e.clientX, dx: 0, dragging: true })
  }
  function onPointerMove(e: ReactPointerEvent) {
    if (!drag.dragging) return
    setDrag((d) => ({ ...d, dx: e.clientX - d.startX }))
  }
  function onPointerUp() {
    if (!drag.dragging) return
    if (drag.dx > 100) decide('like')
    else if (drag.dx < -100) decide('pass')
    else setDrag({ startX: 0, dx: 0, dragging: false })
  }

  const rotation = drag.dx / 18

  return (
    <div className="mx-auto flex h-full max-w-md flex-col">
      <TopBar title="Descobrir" />
      <div className="relative flex flex-1 items-center justify-center px-4 pb-28">
        {loading && <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-white" />}

        {!loading && !car && (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-3xl">🏁</p>
            <p className="text-sm text-[var(--text-muted)]">
              Sem mais projetos por perto agora. Volte mais tarde ou publique o seu.
            </p>
            <button onClick={loadDeck} className="rounded-full border border-[var(--border)] px-4 py-2 text-sm">
              Recarregar
            </button>
          </div>
        )}

        {car && (
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            style={{
              transform: `translateX(${drag.dx}px) rotate(${rotation}deg)`,
              transition: drag.dragging ? 'none' : 'transform 0.25s ease',
              touchAction: 'pan-y',
            }}
            className="w-full max-w-sm cursor-grab select-none overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl active:cursor-grabbing"
          >
            <div className="relative">
              {car.coverUrl ? (
                <img src={car.coverUrl} alt={car.nickname} className="aspect-[4/5] w-full object-cover" draggable={false} />
              ) : (
                <div className="flex aspect-[4/5] w-full items-center justify-center bg-[var(--surface-alt)] text-5xl">🚗</div>
              )}
              {drag.dx > 40 && (
                <span className="absolute right-4 top-4 rotate-6 rounded border-2 border-white px-3 py-1 text-lg font-extrabold text-white">
                  SEGUIR
                </span>
              )}
              {drag.dx < -40 && (
                <span className="absolute left-4 top-4 -rotate-6 rounded border-2 border-[var(--brand)] px-3 py-1 text-lg font-extrabold text-[var(--brand)]">
                  PULAR
                </span>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                <p className="text-2xl font-extrabold text-white">{car.nickname}</p>
                <p className="text-sm text-white/80">
                  {car.brand} {car.model} · {car.year} · {car.owner.displayName}
                </p>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2">
                <Spec label="Tração" value={car.drivetrain} />
                <Spec label="Aspiração" value={car.aspiration} />
                <Spec label="HP" value={car.hp ? `${car.hp} cv` : '—'} />
                <Spec label="WHP" value={car.whp ? `${car.whp} cv` : '—'} />
              </div>
              <Link to={`/carro/${car.id}`} className="mt-3 block text-center text-xs font-semibold text-[var(--text-muted)] underline">
                Ver ficha completa →
              </Link>
            </div>
          </div>
        )}
      </div>

      {car && (
        <div className="fixed bottom-24 left-0 right-0 z-30 flex justify-center gap-6">
          <button
            type="button"
            onClick={() => decide('pass')}
            className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-2xl shadow-lg"
            aria-label="Pular"
          >
            ✕
          </button>
          <button
            type="button"
            onClick={() => decide('like')}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand)] text-2xl text-white shadow-lg"
            aria-label="Seguir"
          >
            ❤️
          </button>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-40 left-1/2 z-40 -translate-x-1/2 rounded-full bg-black/90 px-4 py-2 text-sm text-white">
          {toast}
        </div>
      )}
    </div>
  )
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--glass)] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
      <p className="tabular-nums text-sm font-semibold capitalize">{value}</p>
    </div>
  )
}

import { useMemo, useRef, useState } from 'react'
import { TopBar } from '../components/TopBar'
import { SpecSheet } from '../components/SpecSheet'
import { cars, profiles } from '../data/mock'

interface DragState {
  startX: number
  dx: number
  dragging: boolean
}

export function Discover() {
  const deck = useMemo(() => cars, [])
  const [index, setIndex] = useState(0)
  const [drag, setDrag] = useState<DragState>({ startX: 0, dx: 0, dragging: false })
  const [toast, setToast] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const car = deck[index]
  const owner = car ? profiles.find((p) => p.id === car.ownerId) : undefined

  function showToast(text: string) {
    setToast(text)
    window.setTimeout(() => setToast(null), 900)
  }

  function decide(direction: 'seguir' | 'pular') {
    showToast(direction === 'seguir' ? `Seguindo ${owner?.displayName}` : 'Pulado')
    setIndex((i) => i + 1)
    setDrag({ startX: 0, dx: 0, dragging: false })
  }

  function onPointerDown(e: React.PointerEvent) {
    setDrag({ startX: e.clientX, dx: 0, dragging: true })
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.dragging) return
    setDrag((d) => ({ ...d, dx: e.clientX - d.startX }))
  }

  function onPointerUp() {
    if (!drag.dragging) return
    if (drag.dx > 100) decide('seguir')
    else if (drag.dx < -100) decide('pular')
    else setDrag({ startX: 0, dx: 0, dragging: false })
  }

  const rotation = drag.dx / 18

  return (
    <div className="mx-auto flex h-full max-w-md flex-col">
      <TopBar title="Descobrir" />
      <div className="relative flex flex-1 items-center justify-center px-4 pb-24">
        {!car && (
          <p className="text-center text-[var(--text-muted)]">
            Sem mais projetos por aqui agora. Volte mais tarde!
          </p>
        )}

        {car && owner && (
          <div
            ref={cardRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            style={{
              transform: `translateX(${drag.dx}px) rotate(${rotation}deg)`,
              transition: drag.dragging ? 'none' : 'transform 0.25s ease',
              touchAction: 'pan-y',
            }}
            className="w-full max-w-sm cursor-grab select-none overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl active:cursor-grabbing"
          >
            <div className="relative">
              <img
                src={car.coverPhotoUrl}
                alt={car.name}
                className="aspect-[4/5] w-full object-cover"
                draggable={false}
              />
              {drag.dx > 40 && (
                <span className="absolute right-4 top-4 rotate-6 rounded border-2 border-[var(--ok)] px-3 py-1 font-display text-lg font-bold text-[var(--ok)]">
                  SEGUIR
                </span>
              )}
              {drag.dx < -40 && (
                <span className="absolute left-4 top-4 -rotate-6 rounded border-2 border-[var(--danger)] px-3 py-1 font-display text-lg font-bold text-[var(--danger)]">
                  PULAR
                </span>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <p className="font-display text-2xl font-bold text-white">{car.name}</p>
                <p className="text-sm text-white/80">
                  {car.brand} {car.model} · {car.year} · {owner.displayName}
                </p>
              </div>
            </div>
            <div className="p-4">
              <SpecSheet spec={car.spec} />
            </div>
          </div>
        )}
      </div>

      {car && (
        <div className="fixed bottom-20 left-0 right-0 z-30 flex justify-center gap-6">
          <button
            type="button"
            onClick={() => decide('pular')}
            className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-2xl shadow-lg"
            aria-label="Pular"
          >
            ✕
          </button>
          <button
            type="button"
            onClick={() => decide('seguir')}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand)] text-2xl text-white shadow-lg"
            aria-label="Seguir"
          >
            ❤️
          </button>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-36 left-1/2 z-40 -translate-x-1/2 rounded-full bg-black/80 px-4 py-2 text-sm text-white">
          {toast}
        </div>
      )}
    </div>
  )
}

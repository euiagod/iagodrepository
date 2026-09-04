import type { Car } from '../types'

const drivetrainLabel: Record<string, string> = {
  dianteira: 'Dianteira',
  traseira: 'Traseira',
  '4x4': '4x4',
}

interface SpecItem {
  label: string
  value: string
}

export function SpecSheet({ car }: { car: Car }) {
  const items: SpecItem[] = [
    { label: 'Tração', value: drivetrainLabel[car.drivetrain] },
    { label: 'Aspiração', value: car.aspiration },
    { label: 'HP', value: car.hp ? `${car.hp} cv` : '—' },
    { label: 'WHP', value: car.whp ? `${car.whp} cv` : '—' },
    { label: 'Suspensão', value: car.suspensionDetail || car.suspension },
    { label: 'Rodas', value: car.wheels || '—' },
    { label: 'Pneus', value: car.tires || '—' },
    { label: 'Freios', value: car.brakes || '—' },
  ]

  if (car.torqueKgfm) items.push({ label: 'Torque', value: `${car.torqueKgfm} kgfm` })
  if (car.boostBar) items.push({ label: 'Pressão', value: `${car.boostBar} bar` })
  if (car.ecu) items.push({ label: 'ECU', value: car.ecu })

  return (
    <dl className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-[var(--border)] bg-[var(--glass)] px-3 py-2">
          <dt className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{item.label}</dt>
          <dd className="tabular-nums text-sm font-semibold capitalize text-[var(--text)]">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

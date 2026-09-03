import type { CarSpec } from '../types/domain'

const labels: Record<keyof CarSpec, string> = {
  drivetrain: 'Tração',
  aspiration: 'Aspiração',
  suspension: 'Suspensão',
  wheels: 'Rodas',
  tires: 'Pneus',
  hp: 'HP',
  whp: 'WHP',
}

const drivetrainLabels: Record<string, string> = {
  dianteira: 'Dianteira',
  traseira: 'Traseira',
  '4x4': '4x4',
}

function formatValue(key: keyof CarSpec, value: CarSpec[keyof CarSpec]) {
  if (key === 'drivetrain') return drivetrainLabels[value as string] ?? value
  if (key === 'hp' || key === 'whp') return `${value} cv`
  return value
}

export function SpecSheet({ spec }: { spec: CarSpec }) {
  const order: (keyof CarSpec)[] = [
    'drivetrain',
    'aspiration',
    'hp',
    'whp',
    'suspension',
    'wheels',
    'tires',
  ]

  return (
    <dl className="grid grid-cols-2 gap-2">
      {order.map((key) => (
        <div
          key={key}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2"
        >
          <dt className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            {labels[key]}
          </dt>
          <dd className="font-display text-sm font-semibold text-[var(--text)] capitalize">
            {formatValue(key, spec[key])}
          </dd>
        </div>
      ))}
    </dl>
  )
}

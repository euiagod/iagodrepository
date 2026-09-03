import type { ReactNode } from 'react'

export function TopBar({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg)]/95 px-4 py-3 backdrop-blur pt-[env(safe-area-inset-top)]">
      <h1 className="font-display text-xl font-bold tracking-wide text-[var(--text)]">
        {title}
      </h1>
      {right}
    </header>
  )
}

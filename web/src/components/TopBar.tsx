import type { ReactNode } from 'react'

export function TopBar({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border)] bg-[var(--void)]/95 px-4 py-3 backdrop-blur pt-[env(safe-area-inset-top)]">
      <h1 className="text-[15px] font-extrabold uppercase tracking-[0.14em] text-[var(--text)]">
        {title}
      </h1>
      {right}
    </header>
  )
}

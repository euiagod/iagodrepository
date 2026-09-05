import type { ReactNode } from 'react'

export function TopBar({ title, right, brand }: { title: string; right?: ReactNode; brand?: boolean }) {
  return (
    <header className="sticky top-0 z-30 grid grid-cols-[1fr_auto_1fr] items-center border-b border-[var(--border)] bg-[var(--void)]/95 px-4 py-3 backdrop-blur pt-[env(safe-area-inset-top)]">
      <span />
      <h1 className="justify-self-center text-[15px] font-extrabold uppercase tracking-[0.14em] text-[var(--text)]">
        {title}
        {brand && <span className="ml-1.5 text-[var(--brand)]">•</span>}
      </h1>
      <span className="justify-self-end">{right}</span>
    </header>
  )
}

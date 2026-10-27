import type { ReactNode } from 'react'
import { ThemeToggle } from './ThemeToggle'

type Props = { title: string; subtitle?: ReactNode; eyebrow?: ReactNode }

export function ScreenHeader({ title, subtitle, eyebrow }: Props) {
  return (
    <header className="flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          {eyebrow && <p className="m-0 text-sm text-muted">{eyebrow}</p>}
          <h1
            id="screen-title"
            tabIndex={-1}
            className="m-0 font-display text-[34px] leading-[1.05] font-bold tracking-[-0.02em] text-balance"
          >
            {title}
          </h1>
        </div>
        <ThemeToggle />
      </div>
      {subtitle && <p className="m-0 text-[15px] text-pretty text-muted">{subtitle}</p>}
    </header>
  )
}

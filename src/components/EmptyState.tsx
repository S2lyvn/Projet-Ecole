import type { ReactNode } from 'react'
import { Card } from './Card'

/** Carte « rien à afficher » (Rien à sortir, Rien à confirmer…). */
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Card className="items-start">
      <h2 className="m-0 font-display text-[21px] leading-[1.15] font-semibold tracking-[-0.01em]">{title}</h2>
      {children && <p className="m-0 text-sm text-muted">{children}</p>}
    </Card>
  )
}

import type { ReactNode } from 'react'
import { formatWeekdayShort } from '../app/format'
import { garmentState } from '../domain/dormancy'
import type { Garment, IsoDate } from '../domain/types'
import { formatDuration } from '../domain/wording'

export type ChipTone = 'fresh' | 'wash' | 'amber' | 'accent'

const TONES: Record<ChipTone, string> = {
  fresh: 'bg-fresh text-on-fresh',
  amber: 'bg-amber text-on-amber',
  wash: 'border border-wash px-2 py-0.5 text-wash',
  accent: 'bg-accent-tint text-accent-ink',
}

/** Puce d'état : petite, grasse, rayon 999 px. */
export function Chip({ tone, children }: { tone: ChipTone; children: ReactNode }) {
  return (
    <span
      className={[
        'inline-flex self-start rounded-full px-[9px] py-[3px] text-xs font-bold whitespace-nowrap',
        TONES[tone],
      ].join(' ')}
    >
      {children}
    </span>
  )
}

/** Puce Disponible / Lavage · ven. / Dort · 7 mois (chipFor() du prototype). */
export function GarmentStateChip({
  garment,
  today,
  dormancyDays,
}: {
  garment: Garment
  today: IsoDate
  dormancyDays: number
}) {
  const state = garmentState(garment, today, dormancyDays)
  switch (state.kind) {
    case 'laundry':
      return <Chip tone="wash">Lavage · {formatWeekdayShort(state.until)}</Chip>
    case 'dormant':
      return <Chip tone="amber">Dort · {formatDuration(state.days)}</Chip>
    case 'available':
      return <Chip tone="fresh">Disponible</Chip>
    case 'inactive':
      return null
  }
}

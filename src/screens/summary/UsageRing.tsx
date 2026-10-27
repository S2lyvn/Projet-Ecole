import { plural } from '../../domain/wording'

// Anneau du Bilan (prototype .ring) : cercle ambre = pas portées, arc accent = portées.
const SIZE = 240
const RADIUS = 100
const STROKE = 22
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

type Props = {
  worn: number
  total: number
  /** Libellé complet lu par les lecteurs d'écran. */
  label: string
}

export function UsageRing({ worn, total, label }: Props) {
  const dash = total === 0 ? 0 : (CIRCUMFERENCE * worn) / total
  const center = SIZE / 2
  return (
    <div className="relative aspect-square w-60 max-w-full">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="block size-full" role="img" aria-label={label}>
        <circle cx={center} cy={center} r={RADIUS} fill="none" strokeWidth={STROKE} className="stroke-amber" />
        <circle
          cx={center}
          cy={center}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeDasharray={`${dash.toFixed(1)} ${CIRCUMFERENCE.toFixed(1)}`}
          transform={`rotate(-90 ${center} ${center})`}
          className="stroke-accent"
        />
      </svg>
      {/* Le chiffre est déjà dans l'aria-label de l'anneau : masqué pour ne pas le lire deux fois. */}
      <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className="font-display text-[76px] leading-none font-bold tracking-[-0.03em] tabular-nums">{worn}</span>
        <span className="text-sm text-muted">{plural(worn, 'pièce', 'pièces')} sur {total}</span>
      </div>
    </div>
  )
}

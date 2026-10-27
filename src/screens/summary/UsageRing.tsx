import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useEffect, useState } from 'react'
import { plural } from '../../domain/wording'

// Anneau du Bilan (prototype .ring) : cercle ambre = pas portées, arc accent = portées.
// L'arc se remplit et le chiffre défile jusqu'à sa valeur (instantané si animations réduites).
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
  const reduced = useReducedMotion()
  const share = total === 0 ? 0 : worn / total
  const progress = useMotionValue(reduced ? share : 0)
  const dash = useTransform(progress, (p) => `${(CIRCUMFERENCE * p).toFixed(1)} ${CIRCUMFERENCE.toFixed(1)}`)
  const count = useMotionValue(reduced ? worn : 0)
  const [shown, setShown] = useState(reduced ? worn : 0)

  useEffect(() => {
    const ring = animate(progress, share, reduced ? { duration: 0 } : { type: 'spring', stiffness: 60, damping: 16 })
    const number = animate(count, worn, {
      duration: reduced ? 0 : 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setShown(Math.round(v)),
      onComplete: () => setShown(worn),
    })
    return () => {
      ring.stop()
      number.stop()
    }
  }, [share, worn, reduced, progress, count])

  const center = SIZE / 2
  return (
    <div className="relative aspect-square w-60 max-w-full">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="block size-full" role="img" aria-label={label}>
        <circle cx={center} cy={center} r={RADIUS} fill="none" strokeWidth={STROKE} className="stroke-amber" />
        <motion.circle
          cx={center}
          cy={center}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          style={{ strokeDasharray: dash }}
          transform={`rotate(-90 ${center} ${center})`}
          className="stroke-accent"
        />
      </svg>
      {/* Le chiffre est déjà dans l'aria-label de l'anneau : masqué pour ne pas le lire deux fois. */}
      <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className="font-display text-[76px] leading-none font-bold tracking-[-0.03em] tabular-nums">{shown}</span>
        <span className="text-sm text-muted">
          {plural(worn, 'pièce', 'pièces')} sur {total}
        </span>
      </div>
    </div>
  )
}

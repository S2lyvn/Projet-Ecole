// Carte illustrée des quartiers (démo) : fond dessiné aux couleurs de la charte, cercle du rayon choisi et une pastille
// par quartier où des pièces sont disponibles. Ce n'est PAS une vraie carte : aucune position précise n'existe dans
// l'appli, seulement le quartier (CLAUDE.md, règle 5).
import { motion, useReducedMotion } from 'motion/react'
import { NEIGHBORHOODS, NEIGHBORHOOD_NAMES, isWithinRadius } from '../../domain/swaps'
import type { DistanceFilter, NeighborhoodGroup } from '../../domain/swaps'
import { plural } from '../../domain/wording'

const W = 360
const H = 400
/** Pixels par kilomètre, et position de Jaude (le centre de la démo). */
const SCALE = 50
const CX = 170
const CY = 190

function point(neighborhood: string): { x: number; y: number } {
  const n = NEIGHBORHOODS[neighborhood]
  return { x: CX + n.x * SCALE, y: CY - n.y * SCALE }
}

/** Teintes de la charte pour les quartiers : rose, sauge, violet clair, soleil, bleu nuit clair, rose-violet. */
const BLOB_FILLS = ['var(--t0)', 'var(--t1)', 'var(--t3)', 'var(--t2)', 'var(--t4)', 'var(--t5)']

const ROADS: [string, string][] = [
  ['Jaude', 'Saint-Jacques'],
  ['Saint-Jacques', 'Les Cézeaux'],
  ['Jaude', 'Montferrand'],
  ['Jaude', 'La Gauthière'],
  ['Jaude', 'Chamalières'],
  ['Montferrand', 'La Gauthière'],
]

function road([a, b]: [string, string]): string {
  const p = point(a)
  const q = point(b)
  // Léger arrondi : une route qui n'est pas une règle.
  const mx = (p.x + q.x) / 2 - (q.y - p.y) * 0.1
  const my = (p.y + q.y) / 2 + (q.x - p.x) * 0.1
  return `M${p.x} ${p.y} Q${mx} ${my} ${q.x} ${q.y}`
}

export function NeighborhoodMap({
  groups,
  mine,
  maxKm,
  selected,
  onSelect,
}: {
  groups: readonly NeighborhoodGroup[]
  mine: string
  maxKm: DistanceFilter
  selected: string | null
  onSelect: (neighborhood: string) => void
}) {
  const reduced = useReducedMotion()
  const me = point(mine)

  return (
    <div
      className="relative w-full overflow-hidden rounded-[28px] border border-line bg-tile shadow-[var(--shadow-sm)]"
      style={{ aspectRatio: `${W} / ${H}` }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" aria-hidden="true" focusable="false">
        {/* Chaîne des Puys, clin d'œil local */}
        <path d="M14 96 L42 54 L56 70 L74 40 L110 96 Z" fill="var(--outline)" opacity=".16" />
        {NEIGHBORHOOD_NAMES.map((n, i) => {
          const p = point(n)
          return <circle key={n} cx={p.x} cy={p.y} r={48} fill={BLOB_FILLS[i % BLOB_FILLS.length]} opacity=".85" />
        })}
        <ellipse cx="82" cy="300" rx="48" ry="30" fill="var(--fresh)" opacity=".45" />
        <ellipse cx="300" cy="196" rx="34" ry="22" fill="var(--fresh)" opacity=".4" />
        {ROADS.map((r) => (
          <path key={r.join('-')} d={road(r)} fill="none" stroke="var(--surface)" strokeWidth="7" strokeLinecap="round" />
        ))}
        {maxKm !== null && (
          <motion.circle
            cx={me.x}
            cy={me.y}
            initial={false}
            animate={{ r: maxKm * SCALE }}
            transition={{ type: 'spring', stiffness: 140, damping: 20 }}
            fill="var(--accent)"
            fillOpacity={0.07}
            stroke="var(--accent)"
            strokeOpacity={0.55}
            strokeWidth={1.5}
            strokeDasharray="7 6"
          />
        )}
        {!reduced && (
          <motion.circle
            cx={me.x}
            cy={me.y}
            fill="var(--sun)"
            animate={{ r: [14, 30], opacity: [0.5, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
      </svg>

      {NEIGHBORHOOD_NAMES.map((name, index) => {
        const p = point(name)
        const group = groups.find((g) => g.neighborhood === name)
        const isMine = name === mine
        const isSelected = selected === name
        const inRange = isWithinRadius(mine, name, maxKm)
        const people = group?.people.map((x) => x.member.displayName).join(', ')
        return (
          <motion.div
            key={name}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22, delay: 0.05 * index }}
            style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%` }}
            className={['absolute -translate-x-1/2 -translate-y-1/2', isSelected ? 'z-10' : ''].join(' ')}
          >
            {group ? (
              <button
                type="button"
                aria-pressed={isSelected}
                aria-label={`${name}${isMine ? ' (ton quartier)' : ''} : ${group.count} ${plural(group.count, 'pièce', 'pièces')}, ${people}`}
                onClick={() => onSelect(name)}
                className={[
                  'relative grid size-11 place-items-center rounded-full font-display text-base font-extrabold shadow-[var(--shadow-md)] transition-transform active:scale-90',
                  isSelected ? 'scale-110 bg-sun text-on-sun' : 'bg-accent text-on-accent',
                ].join(' ')}
              >
                {group.count}
                {isMine && (
                  <span className="absolute -top-2 -right-3 rounded-full bg-surface px-1.5 text-[10px] leading-4 font-bold text-accent-ink shadow-[var(--shadow-sm)]">
                    Toi
                  </span>
                )}
              </button>
            ) : (
              <span
                aria-hidden="true"
                className={[
                  'block size-3 rounded-full',
                  isMine ? 'bg-sun ring-4 ring-sun/40' : 'bg-outline',
                  inRange ? '' : 'opacity-40',
                ].join(' ')}
              />
            )}
            <span
              aria-hidden="true"
              className={[
                'pointer-events-none absolute top-full left-1/2 mt-1 -translate-x-1/2 rounded-full bg-surface/90 px-2 py-0.5 text-[11px] font-bold whitespace-nowrap shadow-[var(--shadow-sm)]',
                group || isMine ? 'text-ink' : 'text-muted',
                !group && !isMine && !inRange ? 'opacity-50' : '',
              ].join(' ')}
            >
              {isMine && !group ? `Toi · ${name}` : name}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}

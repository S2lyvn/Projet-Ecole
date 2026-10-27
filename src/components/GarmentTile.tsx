import type { Garment } from '../domain/types'

type TileGarment = Pick<Garment, 'name' | 'category' | 'color'>
export type TileSize = 'big' | 'lg' | 'med' | 'sm' | 'xs' | 'grid'

// Silhouettes du prototype (viewBox 64), plus le manteau et « autre » (un sac).
const PATHS: Record<Exclude<Garment['category'], 'shoes'>, string> = {
  tee: 'M21 8 6 19l6 9 7-3v32h26V25l7 3 6-9L43 8c-2 4-6 6-11 6s-9-2-11-6z',
  long: 'M21 8 5 20l5 28 8-1 1-22v32h26V25l1 22 8 1 5-28L43 8c-2 4-6 6-11 6s-9-2-11-6z',
  pants: 'M19 6h26l4 52H35l-3-30-3 30H15z',
  dress: 'M24 6h16l2 14 10 38H12l10-38z',
  outerwear: 'M22 6 6 17l3 37 9-1 1-26v31h26V27l1 26 9 1 3-37L42 6l-10 12z',
  other: 'M14 24h36l-4 32H18zM24 24v-5a8 8 0 0 1 16 0v5h-3v-5a5 5 0 0 0-10 0v5z',
}

const PASTELS = ['bg-t0', 'bg-t1', 'bg-t2', 'bg-t3', 'bg-t4', 'bg-t5']

/** Un pastel par pièce, choisi à partir du nom (tn() du prototype). */
export function pastelClass(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i)
  return PASTELS[hash % PASTELS.length]
}

const SIZES: Record<TileSize, { box: string; glyph: number }> = {
  big: { box: 'h-[132px] w-[120px] rounded-[18px]', glyph: 92 },
  lg: { box: 'size-[72px] rounded-2xl', glyph: 50 },
  med: { box: 'size-14 rounded-2xl', glyph: 40 },
  sm: { box: 'size-[52px] rounded-[14px]', glyph: 38 },
  xs: { box: 'size-12 rounded-[14px]', glyph: 34 },
  grid: { box: 'h-[92px] w-full rounded-2xl', glyph: 64 },
}

export function GarmentGlyph({ garment, size }: { garment: TileGarment; size: number }) {
  const fill = garment.color ?? 'var(--outline)'
  if (garment.category === 'shoes') {
    return (
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false">
        <path
          d="M6 38h14l6-8 8 5h14c6 1 10 5 10 11v4H6z"
          style={{ fill, stroke: 'var(--edge)' }}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <path d="M6 50h52v4a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z" style={{ fill: 'var(--sole)' }} />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false">
      <path
        d={PATHS[garment.category]}
        fillRule="evenodd"
        style={{ fill, stroke: 'var(--edge)' }}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Vignette d'une pièce : pastel + silhouette (photo réelle à l'étape 3). Décorative : le nom porte l'information.
 * washed : pièce au lavage (contour pointillé, silhouette pâlie), comme le Dressing du prototype.
 */
export function GarmentTile({
  garment,
  size = 'med',
  washed = false,
}: {
  garment: TileGarment
  size?: TileSize
  washed?: boolean
}) {
  const { box, glyph } = SIZES[size]
  return (
    <span
      aria-hidden="true"
      className={[
        'flex flex-none items-center justify-center',
        box,
        washed ? 'border-[1.5px] border-dashed border-outline [&>svg]:opacity-55' : pastelClass(garment.name),
      ].join(' ')}
    >
      <GarmentGlyph garment={garment} size={glyph} />
    </span>
  )
}

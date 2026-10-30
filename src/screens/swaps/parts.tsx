// Éléments partagés par les écrans de la bourse d'échange.
import { Chip } from '../../components/Chip'
import { GarmentTile } from '../../components/GarmentTile'
import type { TileSize } from '../../components/GarmentTile'
import { Icon } from '../../components/Icon'
import { SWAP_STATUS_LABELS } from '../../domain/swaps'
import type { ListingItem, Member, Swap } from '../../domain/swaps'
import { plural } from '../../domain/wording'

export function tokensLabel(n: number): string {
  return `${n} ${plural(n, 'jeton', 'jetons')}`
}

/** Un jeton de réclamation : pièce dorée frappée d'un cintre. Décoratif. */
export function TokenCoin({ size = 28, muted = false }: { size?: number; muted?: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={[
        'grid flex-none place-items-center rounded-full border-2',
        muted
          ? 'border-dashed border-accent-ink/50 text-accent-ink/60'
          : 'border-accent-ink/25 bg-accent text-on-accent shadow-[var(--shadow-accent)]',
      ].join(' ')}
    >
      <Icon name="hanger" size={Math.round(size * 0.58)} strokeWidth={2.2} />
    </span>
  )
}

export function ItemTile({ item, size }: { item: ListingItem; size: TileSize }) {
  return <GarmentTile garment={item} size={size} />
}

/** « Jaude · ★ 4,9 » (le prénom est affiché juste au-dessus). */
export function MemberLine({ member }: { member: Member }) {
  const rating = member.rating === null ? 'nouveau membre' : `★ ${member.rating.toLocaleString('fr-FR')}`
  return (
    <span className="text-[13px] text-muted">
      {member.neighborhood} · {rating}
    </span>
  )
}

export function memberAvatar(member: Member) {
  return (
    <span
      aria-hidden="true"
      className="grid size-11 flex-none place-items-center rounded-full bg-accent-tint font-display text-lg font-bold text-accent-ink"
    >
      {member.displayName.charAt(0)}
    </span>
  )
}

export function SwapStatusChip({ swap }: { swap: Swap }) {
  const tone = swap.status === 'completed' ? 'fresh' : swap.status === 'cancelled' ? 'wash' : 'accent'
  return <Chip tone={tone}>{SWAP_STATUS_LABELS[swap.status]}</Chip>
}

/** Rappel que la bourse est simulée (CLAUDE.md, règle 6). */
export function SimulationNote() {
  return (
    <p className="m-0 flex items-start gap-2 rounded-2xl border border-dashed border-outline px-3.5 py-2.5 text-[13px] leading-snug text-muted">
      <Icon name="play" size={16} />
      <span>Simulation : les membres, les annonces et les échanges sont des exemples fictifs.</span>
    </p>
  )
}

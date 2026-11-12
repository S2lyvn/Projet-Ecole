// Carte d'une annonce de la bourse (vue Liste de la Carte) : la pièce, son état, la personne et la distance.
import { Link } from 'react-router'
import { Chip } from '../../components/Chip'
import { Icon } from '../../components/Icon'
import { formatDistance } from '../../domain/swaps'
import type { Member, SwapListing } from '../../domain/swaps'
import { CONDITION_LABELS } from '../../domain/wording'
import { ItemTile } from './parts'

export function ListingCard({
  listing,
  member,
  distanceKm,
}: {
  listing: SwapListing
  member: Member | undefined
  distanceKm: number | null
}) {
  return (
    <Link
      to={`/echanges/annonce/${listing.id}`}
      className="flex h-full flex-col gap-2 rounded-[20px] border border-line bg-surface p-2.5 text-ink no-underline shadow-[var(--shadow-sm)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] active:scale-[0.98]"
    >
      <ItemTile item={listing.item} size="grid" />
      <span className="line-clamp-2 text-sm leading-tight font-bold">{listing.item.name}</span>
      <span className="text-xs text-muted">
        {listing.item.size ? `Taille ${listing.item.size} · ` : ''}
        {CONDITION_LABELS[listing.condition]}
      </span>
      {member && (
        <span className="mt-auto truncate text-xs text-muted">
          {member.displayName} · {member.neighborhood}
        </span>
      )}
      <span className="inline-flex items-center gap-1 self-start rounded-full bg-tile px-2 py-0.5 text-xs font-bold text-ink">
        <Icon name="pin" size={13} strokeWidth={2.2} />
        {formatDistance(distanceKm)}
      </span>
      {listing.circle && <Chip tone="accent">{listing.circle}</Chip>}
    </Link>
  )
}

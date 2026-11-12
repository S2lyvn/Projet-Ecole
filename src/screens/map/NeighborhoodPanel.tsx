// Détail d'un quartier : les personnes qui y proposent des pièces, et ces pièces.
import { motion } from 'motion/react'
import { Link } from 'react-router'
import { formatDistance } from '../../domain/swaps'
import type { NeighborhoodGroup } from '../../domain/swaps'
import { plural } from '../../domain/wording'
import { ItemTile, memberAvatar } from '../swaps/parts'

export function NeighborhoodPanel({ group }: { group: NeighborhoodGroup }) {
  return (
    <motion.section
      key={group.neighborhood}
      aria-label={`Pièces à ${group.neighborhood}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-4 shadow-[var(--shadow-sm)]"
    >
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="m-0 font-display text-xl font-bold">{group.neighborhood}</h2>
        <span className="text-sm text-muted">
          {formatDistance(group.distanceKm)} · {group.count} {plural(group.count, 'pièce', 'pièces')}
        </span>
      </header>
      {group.people.map(({ member, listings }) => (
        <div key={member.id} className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            {memberAvatar(member)}
            <div className="flex min-w-0 flex-col">
              <span className="text-[15px] leading-tight font-bold">{member.displayName}</span>
              <span className="text-[13px] text-muted">
                {member.rating === null ? 'Nouveau membre' : `★ ${member.rating.toLocaleString('fr-FR')}`}
                {member.swapsCount > 0 && ` · ${member.swapsCount} ${plural(member.swapsCount, 'échange', 'échanges')}`}
              </span>
            </div>
          </div>
          <ul className="m-0 -mx-1 flex list-none gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
            {listings.map((l) => (
              <li key={l.id} className="w-[92px] flex-none">
                <Link
                  to={`/echanges/annonce/${l.id}`}
                  aria-label={`${l.item.name}${l.item.size ? `, taille ${l.item.size}` : ''}, ${member.displayName}`}
                  className="flex flex-col gap-1 text-ink no-underline transition-transform active:scale-95"
                >
                  <ItemTile item={l.item} size="grid" />
                  <span className="line-clamp-2 text-xs leading-tight font-medium">{l.item.name}</span>
                  {l.item.size && <span className="text-[11px] text-muted">Taille {l.item.size}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </motion.section>
  )
}

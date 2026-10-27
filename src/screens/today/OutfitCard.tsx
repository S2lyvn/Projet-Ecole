// Carte de la tenue proposée : la pièce orpheline en grand, puis les valeurs sûres (todayScreen() du prototype).
import { Card } from '../../components/Card'
import { Chip } from '../../components/Chip'
import { GarmentTile } from '../../components/GarmentTile'
import { daysSinceLastWear } from '../../domain/dormancy'
import type { Outfit } from '../../domain/outfit'
import type { Garment, IsoDate } from '../../domain/types'
import { notWornSince, participle, wornAgo } from '../../domain/wording'

/** Une pièce jamais portée (achat accepté) n'a pas de date de port : on ne parle pas de durée. */
function neverWorn(garment: Garment): string | null {
  return garment.lastWornAt === null ? `Jamais ${participle(garment.agreement)}` : null
}

export function OutfitCard({ outfit, today }: { outfit: Outfit; today: IsoDate }) {
  const { orphan, companions } = outfit
  return (
    <Card aria-label="Tenue proposée">
      <div className="flex items-stretch gap-4">
        <GarmentTile garment={orphan} size="big" />
        <div className="flex min-w-0 flex-col justify-center gap-2">
          <Chip tone="amber">Pièce oubliée</Chip>
          <h2 className="m-0 font-display text-[21px] leading-[1.15] font-semibold tracking-[-0.01em] break-words">
            {orphan.name}
          </h2>
          <p className="m-0 text-[13px] font-medium text-amber-ink">
            {neverWorn(orphan) ?? notWornSince(orphan.agreement, daysSinceLastWear(orphan, today))}
          </p>
        </div>
      </div>
      {companions.length > 0 && (
        <>
          <hr className="m-0 h-px border-0 bg-line" />
          {/* role="list" : Safari retire la sémantique d'une liste sans puces. */}
          <ul role="list" className="m-0 grid list-none grid-cols-2 gap-3 p-0" aria-label="Valeurs sûres">
            {companions.map((c) => (
              <li key={c.id} className="flex min-w-0 items-center gap-2.5">
                <GarmentTile garment={c} size="sm" />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm leading-[1.2] font-medium break-words">{c.name}</span>
                  <span className="text-xs text-muted">Valeur sûre</span>
                  <span className="text-xs text-muted">{neverWorn(c) ?? wornAgo(c.agreement, daysSinceLastWear(c, today))}</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  )
}

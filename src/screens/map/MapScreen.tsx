// Accueil : la carte de proximité. On voit autour de soi les personnes et les pièces disponibles, par quartier.
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { useWardrobe } from '../../app/WardrobeProvider'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { Icon } from '../../components/Icon'
import { Pills } from '../../components/Pills'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Segmented } from '../../components/Segmented'
import {
  ME,
  NEIGHBORHOOD_NAMES,
  filterListings,
  groupByNeighborhood,
  listingsNear,
} from '../../domain/swaps'
import type { DistanceFilter } from '../../domain/swaps'
import { balanceOf } from '../../domain/tokens'
import { ListingCard } from '../swaps/ListingCard'
import { SimulationNote, TokensPill } from '../swaps/parts'
import { DEFAULT_FILTERS, FiltersSheet, activeFilterCount } from './FiltersSheet'
import type { MapFilters } from './FiltersSheet'
import { NeighborhoodMap } from './NeighborhoodMap'
import { NeighborhoodPanel } from './NeighborhoodPanel'

type View = 'carte' | 'liste'

// Le rayon est un nombre ou null (toute la ville) : les pastilles travaillent avec des textes.
const RADIUS_OPTIONS = [
  { value: '1', label: '1 km' },
  { value: '3', label: '3 km' },
  { value: '5', label: '5 km' },
  { value: 'all', label: 'Ville' },
]
const toRadius = (v: string): DistanceFilter => (v === 'all' ? null : (Number(v) as DistanceFilter))
const fromRadius = (km: DistanceFilter): string => (km === null ? 'all' : String(km))

const list = { show: { transition: { staggerChildren: 0.04 } } }
const listItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 420, damping: 32 } },
}

export function MapScreen() {
  const { data, run } = useWardrobe()
  const community = data.swaps
  const [view, setView] = useState<View>('carte')
  // 3 km au départ : les remises en main propre restent faciles.
  const [maxKm, setMaxKm] = useState<DistanceFilter>(3)
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  const members = useMemo(() => new Map(community.members.map((m) => [m.id, m])), [community.members])
  const filtered = filterListings(community.listings, { ...filters, sizes: community.sizes, memberId: ME })
  const nearby = listingsNear(filtered, community.members, community.neighborhood, maxKm)
  const groups = groupByNeighborhood(nearby, community.members)
  // Quartier affiché : celui qu'on a touché, sinon le mien, sinon le plus proche qui a des pièces.
  const selectedGroup =
    groups.find((g) => g.neighborhood === selected) ?? groups.find((g) => g.neighborhood === community.neighborhood) ?? groups[0] ?? null
  const filterCount = activeFilterCount(filters)

  const radius = (
    <Pills label="Distance maximale" options={RADIUS_OPTIONS} value={fromRadius(maxKm)} onChange={(v) => setMaxKm(toRadius(v))} />
  )

  return (
    <>
      <ScreenHeader brand title="Autour de toi" />

      <div className="flex items-center gap-2.5">
        <label className="relative flex min-w-0 flex-1 items-center">
          <span className="sr-only">Mon quartier</span>
          <span className="pointer-events-none absolute left-3.5 text-accent-ink">
            <Icon name="pin" size={18} />
          </span>
          <select
            value={community.neighborhood}
            onChange={(e) => void run((r) => r.setMyNeighborhood(e.target.value))}
            className="min-h-11 w-full appearance-none rounded-full border border-outline bg-surface pr-4 pl-10 text-sm font-bold text-ink"
          >
            {NEIGHBORHOOD_NAMES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <TokensPill count={balanceOf(community.ledger)} />
      </div>

      <div className="flex items-center gap-2.5">
        <div className="min-w-0 flex-1">
          <Segmented
            label="Affichage"
            value={view}
            onChange={setView}
            options={[
              { value: 'carte', label: 'Carte' },
              { value: 'liste', label: 'Liste' },
            ]}
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          aria-label={filterCount > 0 ? `Filtres, ${filterCount} actif${filterCount > 1 ? 's' : ''}` : 'Filtres'}
          className="relative grid size-12 flex-none place-items-center rounded-2xl border border-outline bg-surface text-ink transition-transform active:scale-95"
        >
          <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
            <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
            <circle cx="16" cy="7" r="2" />
            <circle cx="8" cy="17" r="2" />
          </svg>
          {filterCount > 0 && (
            <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-accent text-[11px] font-bold text-on-accent">
              {filterCount}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={view}
          role="tabpanel"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="flex flex-col gap-4"
        >
          {view === 'carte' ? (
            <>
              <NeighborhoodMap
                groups={groups}
                mine={community.neighborhood}
                maxKm={maxKm}
                selected={selectedGroup?.neighborhood ?? null}
                onSelect={setSelected}
              />
              {radius}
              {selectedGroup ? <NeighborhoodPanel group={selectedGroup} /> : <Empty maxKm={maxKm} onWiden={() => setMaxKm(null)} onReset={() => setFilters(DEFAULT_FILTERS)} />}
            </>
          ) : (
            <>
              {radius}
              {nearby.length === 0 ? (
                <Empty maxKm={maxKm} onWiden={() => setMaxKm(null)} onReset={() => setFilters(DEFAULT_FILTERS)} />
              ) : (
                <motion.ul
                  key={`${filters.category}-${filters.mySizesOnly}-${maxKm}-${community.neighborhood}`}
                  variants={list}
                  initial="hidden"
                  animate="show"
                  className="m-0 grid list-none grid-cols-2 gap-3 p-0"
                  aria-label="Pièces près de chez toi"
                >
                  {nearby.map(({ listing, distanceKm }) => (
                    <motion.li key={listing.id} variants={listItem}>
                      <ListingCard listing={listing} member={members.get(listing.ownerId)} distanceKm={distanceKm} />
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <SimulationNote />

      <FiltersSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
        sizes={community.sizes}
        resultCount={nearby.length}
      />
    </>
  )
}

function Empty({ maxKm, onWiden, onReset }: { maxKm: DistanceFilter; onWiden: () => void; onReset: () => void }) {
  return (
    <EmptyState title="Rien pour l’instant">
      <span className="flex flex-col items-start gap-2.5">
        {maxKm !== null ? 'Rien dans ce rayon.' : 'Aucune pièce ne correspond à tes filtres.'}
        {maxKm !== null ? (
          <Button size="sm" fullWidth={false} onClick={onWiden}>
            Voir toute la ville
          </Button>
        ) : (
          <Button size="sm" fullWidth={false} onClick={onReset}>
            Réinitialiser les filtres
          </Button>
        )}
      </span>
    </EmptyState>
  )
}

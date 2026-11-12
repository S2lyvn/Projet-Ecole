// Filtres de la Carte (catégorie, taille) : rangés dans une feuille pour garder l'écran d'accueil léger.
import { useId } from 'react'
import { BottomSheet } from '../../components/BottomSheet'
import { Button } from '../../components/Button'
import { Switch } from '../../components/Switch'
import type { ListingCategoryFilter, MySizes } from '../../domain/swaps'
import { plural } from '../../domain/wording'

export interface MapFilters {
  category: ListingCategoryFilter
  mySizesOnly: boolean
}

export const DEFAULT_FILTERS: MapFilters = { category: 'all', mySizesOnly: true }

/** Nombre de filtres différents de leur valeur de départ (pastille du bouton « Filtres »). */
export function activeFilterCount(filters: MapFilters): number {
  return Number(filters.category !== DEFAULT_FILTERS.category) + Number(filters.mySizesOnly !== DEFAULT_FILTERS.mySizesOnly)
}

const CATEGORIES: { value: ListingCategoryFilter; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'tops', label: 'Hauts' },
  { value: 'bottoms', label: 'Bas' },
  { value: 'dress', label: 'Robes' },
  { value: 'shoes', label: 'Chaussures' },
  { value: 'outerwear', label: 'Manteaux' },
]

export function FiltersSheet({
  open,
  onClose,
  filters,
  onChange,
  sizes,
  resultCount,
}: {
  open: boolean
  onClose: () => void
  filters: MapFilters
  onChange: (filters: MapFilters) => void
  sizes: MySizes
  resultCount: number
}) {
  const titleId = useId()
  return (
    <BottomSheet open={open} onClose={onClose} labelledBy={titleId}>
      <h2 id={titleId} className="m-0 font-display text-2xl leading-tight font-bold">
        Filtres
      </h2>
      <div role="group" aria-label="Catégorie" className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            aria-pressed={filters.category === c.value}
            onClick={() => onChange({ ...filters, category: c.value })}
            className={[
              'min-h-11 rounded-full border px-4 text-sm transition-colors',
              filters.category === c.value
                ? 'border-accent bg-accent font-bold text-on-accent'
                : 'border-outline font-medium text-ink',
            ].join(' ')}
          >
            {c.label}
          </button>
        ))}
      </div>
      <Switch
        checked={filters.mySizesOnly}
        onChange={(mySizesOnly) => onChange({ ...filters, mySizesOnly })}
        label="À ma taille"
        description={`Haut ${sizes.top} · bas ${sizes.bottom} · pointure ${sizes.shoes}`}
      />
      <div className="flex flex-col gap-2.5">
        <Button variant="primary" size="lg" onClick={onClose}>
          Voir {resultCount} {plural(resultCount, 'pièce', 'pièces')}
        </Button>
        <Button onClick={() => onChange(DEFAULT_FILTERS)}>Réinitialiser</Button>
      </div>
    </BottomSheet>
  )
}

// Dressing (stockScreen() du prototype) : grille des pièces, filtres, et feuille d'actions d'une pièce.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useActiveGarments, useWardrobe } from '../../app/WardrobeProvider'
import { Banner } from '../../components/Banner'
import { GarmentStateChip } from '../../components/Chip'
import { GarmentTile } from '../../components/GarmentTile'
import { Pills } from '../../components/Pills'
import { ScreenHeader } from '../../components/ScreenHeader'
import { isInLaundry } from '../../domain/laundry'
import { plural } from '../../domain/wording'
import { GarmentSheet, statusText } from './GarmentSheet'

type Filter = 'all' | 'available' | 'laundry'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'available', label: 'Disponible' },
  { value: 'laundry', label: 'Au lavage' },
]

export function WardrobeScreen() {
  const { data } = useWardrobe()
  const garments = useActiveGarments()
  const [filter, setFilter] = useState<Filter>('all')
  const [sheetId, setSheetId] = useState<string | null>(null)
  // Pièce à refocaliser après fermeture, avec la liste visible avant (pour trouver une voisine si elle a disparu).
  const [focusAfterClose, setFocusAfterClose] = useState<{ id: string; ids: string[] } | null>(null)
  const buttons = useRef(new Map<string, HTMLButtonElement>())

  const list = useMemo(
    () =>
      garments.filter((g) => {
        if (filter === 'available') return !isInLaundry(g, data.today)
        if (filter === 'laundry') return isInLaundry(g, data.today)
        return true
      }),
    [garments, filter, data.today],
  )

  const sheetGarment = sheetId ? (garments.find((g) => g.id === sheetId) ?? null) : null

  // Retour du focus : sur la pièce, sinon sur une voisine (pièce donnée ou sortie du filtre), sinon sur le titre.
  useEffect(() => {
    if (!focusAfterClose) return
    const { id, ids } = focusAfterClose
    const index = ids.indexOf(id)
    const candidates = [id, ...ids.slice(index + 1), ...ids.slice(0, Math.max(index, 0)).reverse()]
    const target = candidates.map((c) => buttons.current.get(c)).find((b) => b?.isConnected)
    if (target) target.focus()
    else document.getElementById('screen-title')?.focus()
    setFocusAfterClose(null)
  }, [focusAfterClose, list])

  function closeSheet() {
    if (sheetId) setFocusAfterClose({ id: sheetId, ids: list.map((g) => g.id) })
    setSheetId(null)
  }

  const purchases = data.purchases.length

  return (
    <>
      <ScreenHeader title="Dressing" subtitle="Ce que tu peux vraiment porter aujourd’hui." />

      {purchases > 0 && (
        <Banner to="/achats">
          {purchases} {plural(purchases, 'achat détecté', 'achats détectés')}, à confirmer
        </Banner>
      )}

      <div className="flex flex-col gap-2">
        <Pills label="Filtrer le dressing" options={FILTERS} value={filter} onChange={setFilter} />
        <p className="m-0 text-sm text-muted">Touche une pièce pour changer son état ou décider de son sort.</p>
      </div>

      {list.length === 0 ? (
        <p className="m-0 text-[15px] text-muted">Aucune pièce dans cette vue.</p>
      ) : (
        <ul className="m-0 grid list-none grid-cols-3 gap-x-2.5 gap-y-3 p-0">
          {list.map((g) => (
            <li key={g.id} className="min-w-0">
              <button
                type="button"
                ref={(el) => {
                  if (el) buttons.current.set(g.id, el)
                  else buttons.current.delete(g.id)
                }}
                aria-label={`${g.name}, ${statusText(g, data.today, data.settings.dormancyDays)}`}
                onClick={() => setSheetId(g.id)}
                className="flex w-full min-w-0 cursor-pointer flex-col gap-1.5 rounded-2xl border-0 bg-transparent p-0 text-left text-ink"
              >
                <GarmentTile garment={g} size="grid" washed={isInLaundry(g, data.today)} />
                <span className="block w-full truncate text-[13px] font-medium">{g.name}</span>
                {/* À 360 px, « Dort · 14 mois » peut dépasser la colonne : la puce passe alors à la ligne. */}
                <span className="flex max-w-full [&>span]:max-w-full [&>span]:whitespace-normal">
                  <GarmentStateChip garment={g} today={data.today} dormancyDays={data.settings.dormancyDays} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <GarmentSheet garment={sheetGarment} onClose={closeSheet} />
    </>
  )
}

// Armoire : mes pièces, le filtre « Elles dorment » (ex-À sortir, pour les donner à la communauté), le résumé de la part
// portée (ex-Bilan) et la feuille d'actions d'une pièce.
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useActiveGarments, useWardrobe } from '../../app/WardrobeProvider'
import { Banner } from '../../components/Banner'
import { Chip, GarmentStateChip } from '../../components/Chip'
import { listedGarmentIds } from '../../domain/swaps'
import { GarmentTile } from '../../components/GarmentTile'
import { Pills } from '../../components/Pills'
import { ScreenHeader } from '../../components/ScreenHeader'
import { listDormant } from '../../domain/dormancy'
import type { DormancyThreshold } from '../../domain/dormancy'
import { isInLaundry } from '../../domain/laundry'
import { computeUsage, formatUsagePercent } from '../../domain/usage'
import type { UsagePeriod } from '../../domain/usage'
import { plural } from '../../domain/wording'
import { GarmentSheet, statusText } from './GarmentSheet'
import { UsageRing } from './UsageRing'

type Filter = 'all' | 'available' | 'laundry' | 'dort'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'available', label: 'Disponible' },
  { value: 'laundry', label: 'Au lavage' },
  { value: 'dort', label: 'Elles dorment' },
]

const DORMANCY_OPTIONS: { value: DormancyThreshold; label: string }[] = [
  { value: 90, label: '3 mois' },
  { value: 180, label: '6 mois' },
  { value: 365, label: '12 mois' },
]

const PERIOD_OPTIONS: { value: UsagePeriod; label: string }[] = [
  { value: 90, label: '3 mois' },
  { value: 365, label: '12 mois' },
]

export function WardrobeScreen() {
  const { data, run } = useWardrobe()
  const garments = useActiveGarments()
  const [params, setParams] = useSearchParams()
  // Le filtre vit dans l'adresse (?filtre=dort) : « Donner une pièce » et les anciens liens y arrivent directement.
  const filter: Filter = FILTERS.find((f) => f.value === params.get('filtre'))?.value ?? 'all'
  const setFilter = (value: Filter) => setParams(value === 'all' ? {} : { filtre: value }, { replace: true })
  const [sheetId, setSheetId] = useState<string | null>(null)
  // Pièce à refocaliser après fermeture, avec la liste visible avant (pour trouver une voisine si elle a disparu).
  const [focusAfterClose, setFocusAfterClose] = useState<{ id: string; ids: string[] } | null>(null)
  const buttons = useRef(new Map<string, HTMLButtonElement>())

  const listedIds = useMemo(() => listedGarmentIds(data.swaps.listings), [data.swaps.listings])
  const threshold = data.settings.dormancyDays
  const list = useMemo(() => {
    if (filter === 'dort') return listDormant(garments, data.today, threshold)
    return garments.filter((g) => {
      if (filter === 'available') return !isInLaundry(g, data.today)
      if (filter === 'laundry') return isInLaundry(g, data.today)
      return true
    })
  }, [garments, filter, data.today, threshold])

  const period = data.settings.usagePeriod
  const usage = computeUsage(data.garments, data.today, period)
  const ringLabel = `${usage.worn} ${plural(usage.worn, 'pièce portée', 'pièces portées')} sur ${usage.total} ces ${period === 90 ? 3 : 12} derniers mois`

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
      <ScreenHeader title="Armoire" />

      <section
        aria-label="Part de l’armoire portée"
        className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-4 shadow-[var(--shadow-sm)]"
      >
        <UsageRing compact worn={usage.worn} total={usage.total} label={ringLabel} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="m-0 text-[15px] leading-snug">
            <strong className="font-display text-2xl tabular-nums">{formatUsagePercent(usage.ratio)}</strong>
            <br />
            de ton armoire portée
          </p>
          <Pills
            label="Période"
            options={PERIOD_OPTIONS}
            value={period}
            onChange={(value) => {
              if (value !== period) void run((r) => r.updateSettings({ usagePeriod: value }))
            }}
          />
        </div>
      </section>

      {purchases > 0 && (
        <Banner to="/achats">
          {purchases} {plural(purchases, 'achat détecté', 'achats détectés')}, à confirmer
        </Banner>
      )}

      <div role="group" aria-label="Filtrer l’armoire" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={[
              'min-h-11 flex-none rounded-full border px-4 text-sm transition-colors',
              filter === f.value ? 'border-accent bg-accent font-bold text-on-accent' : 'border-outline font-medium text-ink',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filter === 'dort' && (
        <div className="flex flex-col gap-2">
          <Pills
            label="Elles dorment depuis"
            options={DORMANCY_OPTIONS}
            value={threshold}
            onChange={(value) => {
              if (value !== threshold) void run((r) => r.updateSettings({ dormancyDays: value }))
            }}
          />
          <p className="m-0 text-sm text-muted">Touche une pièce pour la donner à la communauté.</p>
        </div>
      )}

      {list.length === 0 ? (
        <p className="m-0 text-[15px] text-muted">
          {filter === 'dort' ? 'Rien ne dort : tout ton armoire circule.' : 'Aucune pièce dans cette vue.'}
        </p>
      ) : (
        <ul className="m-0 grid list-none grid-cols-3 gap-x-2.5 gap-y-3 p-0">
          <AnimatePresence initial={false} mode="popLayout">
          {list.map((g) => (
            <motion.li
              key={g.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.16 } }}
              transition={{ type: 'spring', stiffness: 460, damping: 34 }}
              className="min-w-0"
            >
              <button
                type="button"
                ref={(el) => {
                  if (el) buttons.current.set(g.id, el)
                  else buttons.current.delete(g.id)
                }}
                aria-label={`${g.name}, ${statusText(g, data.today, data.settings.dormancyDays)}`}
                onClick={() => setSheetId(g.id)}
                className="group flex w-full min-w-0 cursor-pointer flex-col gap-1.5 rounded-2xl border-0 bg-transparent p-0 text-left text-ink transition-transform active:scale-[0.96]"
              >
                <GarmentTile garment={g} size="grid" washed={isInLaundry(g, data.today)} />
                <span className="block w-full truncate text-[13px] font-medium">{g.name}</span>
                {/* À 360 px, « Dort · 14 mois » peut dépasser la colonne : la puce passe alors à la ligne. */}
                <span className="flex max-w-full [&>span]:max-w-full [&>span]:whitespace-normal">
                  {listedIds.has(g.id) ? (
                    <Chip tone="accent">À l’échange</Chip>
                  ) : (
                    <GarmentStateChip garment={g} today={data.today} dormancyDays={data.settings.dormancyDays} />
                  )}
                </span>
              </button>
            </motion.li>
          ))}
          </AnimatePresence>
        </ul>
      )}

      <GarmentSheet garment={sheetGarment} onClose={closeSheet} />
    </>
  )
}

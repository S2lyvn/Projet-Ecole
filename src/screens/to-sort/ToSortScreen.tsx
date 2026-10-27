// Onglet « À sortir » : pièces qui dorment au-delà du seuil choisi (outScreen() du prototype).
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useActiveGarments, useWardrobe } from '../../app/WardrobeProvider'
import { useGarmentActions } from '../../app/useGarmentActions'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { GarmentTile } from '../../components/GarmentTile'
import { Pills } from '../../components/Pills'
import { ScreenHeader } from '../../components/ScreenHeader'
import { daysSinceLastWear, listDormant } from '../../domain/dormancy'
import type { DormancyThreshold } from '../../domain/dormancy'
import { buildOutfit } from '../../domain/outfit'
import { listedGarmentIds } from '../../domain/swaps'
import type { Garment } from '../../domain/types'
import { agree, notWornSince } from '../../domain/wording'

const THRESHOLD_MONTHS: Record<DormancyThreshold, string> = { 90: '3', 180: '6', 365: '12' }

const THRESHOLD_OPTIONS: { value: DormancyThreshold; label: string }[] = [
  { value: 90, label: '3 mois' },
  { value: 180, label: '6 mois' },
  { value: 365, label: '12 mois' },
]

// Boutons serrés pour tenir à deux par ligne à 360 px.
const COMPACT = 'min-w-0 px-2!'

const nameId = (garment: Garment) => `to-sort-${garment.id}`
const proposeId = (garmentId: string) => `to-sort-${garmentId}-propose`

export function ToSortScreen() {
  const { data, run } = useWardrobe()
  const garments = useActiveGarments()
  const actions = useGarmentActions()
  const { today, settings, dailyOutfit } = data
  const threshold = settings.dormancyDays

  // Pièces déjà dans la bourse d'échange.
  const listedIds = useMemo(
    () => listedGarmentIds(data.swaps.listings),
    [data.swaps.listings],
  )
  const dormant = useMemo(() => listDormant(garments, today, threshold), [garments, today, threshold])

  // Pièce proposée dans la tenue du jour (sauf après « Pas aujourd'hui »).
  const proposedId = useMemo(() => {
    if (dailyOutfit.status === 'dismissed') return null
    return buildOutfit(garments, today, dailyOutfit.orphanId)?.orphan.id ?? null
  }, [garments, today, dailyOutfit])

  // Après « Donner », le focus va sur la carte voisine, ou sur le titre si la liste est vide.
  const [focusTarget, setFocusTarget] = useState<string | null>(null)
  useEffect(() => {
    if (focusTarget === null) return
    // Si la voisine a disparu entre-temps (deux dons rapides), on se rabat sur la première carte, puis le titre.
    const target =
      document.getElementById(proposeId(focusTarget)) ??
      (dormant[0] ? document.getElementById(proposeId(dormant[0].id)) : null) ??
      document.getElementById('screen-title')
    target?.focus()
    setFocusTarget(null)
  }, [focusTarget, dormant])

  // Évite qu'un double appui donne aussi la pièce suivante, qui glisse sous le doigt.
  const donating = useRef(false)
  async function donate(garment: Garment) {
    if (donating.current) return
    donating.current = true
    const index = dormant.findIndex((g) => g.id === garment.id)
    const neighbour = dormant[index + 1] ?? dormant[index - 1] ?? null
    try {
      await actions.donate(garment)
      setFocusTarget(neighbour ? neighbour.id : 'screen-title')
    } finally {
      donating.current = false
    }
  }

  function changeThreshold(dormancyDays: DormancyThreshold) {
    if (dormancyDays === threshold) return
    void run((r) => r.updateSettings({ dormancyDays }))
  }

  return (
    <>
      <ScreenHeader
        title="À sortir"
        subtitle="Des pièces que tu ne portes plus depuis longtemps. À toi de décider."
      />

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-bold tracking-[0.04em] text-muted uppercase">Dormante après</span>
        <Pills label="Seuil de dormance" options={THRESHOLD_OPTIONS} value={threshold} onChange={changeThreshold} />
      </div>

      {dormant.length === 0 ? (
        <EmptyState title="Rien à sortir">
          Aucune pièce ne dort depuis plus de {THRESHOLD_MONTHS[threshold]} mois.{' '}
          {threshold === 90 ? 'Tout ton dressing circule.' : 'Choisis un seuil plus court pour voir les suivantes.'}
        </EmptyState>
      ) : (
        <>
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0" aria-label="Pièces à sortir">
            <AnimatePresence initial={false}>
            {dormant.map((garment) => (
              <motion.li
                key={garment.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -80, transition: { duration: 0.22 } }}
                transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              >
                <Card as="article" tight aria-labelledby={nameId(garment)}>
                  <div className="flex min-w-0 items-center gap-3">
                    <GarmentTile garment={garment} size="med" />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <h2 id={nameId(garment)} className="m-0 text-base leading-[1.2] font-bold">
                        {garment.name}
                      </h2>
                      <p className="m-0 text-[13px] font-medium text-amber-ink">
                        {notWornSince(garment.agreement, daysSinceLastWear(garment, today))}
                        {proposedId === garment.id && ` · ${agree(garment.agreement, 'proposé')} aujourd’hui`}
                      </p>
                    </div>
                  </div>
                  {/* Ordre de docs/02-produit.md : Remettre en jeu, Échanger, Vendre, Donner. */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      id={proposeId(garment.id)}
                      variant="primary"
                      size="sm"
                      className={COMPACT}
                      aria-describedby={nameId(garment)}
                      onClick={() => void actions.proposeToday(garment)}
                    >
                      Remettre en jeu
                    </Button>
                    <Button
                      size="sm"
                      className={COMPACT}
                      aria-describedby={nameId(garment)}
                      onClick={() => actions.exchange(garment)}
                    >
                      {listedIds.has(garment.id) ? 'Voir l’annonce' : 'Échanger'}
                    </Button>
                    <Button
                      size="sm"
                      className={COMPACT}
                      aria-describedby={nameId(garment)}
                      onClick={() => actions.sell(garment)}
                    >
                      Vendre
                    </Button>
                    <Button
                      size="sm"
                      className={COMPACT}
                      aria-describedby={nameId(garment)}
                      onClick={() => void donate(garment)}
                    >
                      Donner
                    </Button>
                  </div>
                </Card>
              </motion.li>
            ))}
            </AnimatePresence>
          </ul>
          <p className="m-0 text-center text-[13px] leading-[1.4] text-pretty text-muted">
            Dès que tu portes une pièce, elle quitte cette liste d’elle-même.
          </p>

        </>
      )}
    </>
  )
}

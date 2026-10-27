// Feuille d'actions d'une pièce (sheetHTML() du prototype) : lavage, proposer, échanger, vendre, donner.
import { useId, useState } from 'react'
import { formatWeekday } from '../../app/format'
import { useGarmentActions } from '../../app/useGarmentActions'
import { useWardrobe } from '../../app/WardrobeProvider'
import { BottomSheet } from '../../components/BottomSheet'
import { Button, IconButton } from '../../components/Button'
import { GarmentTile } from '../../components/GarmentTile'
import { Icon } from '../../components/Icon'
import { useToast } from '../../components/Toast'
import { daysSinceLastWear, garmentState } from '../../domain/dormancy'
import { isInLaundry } from '../../domain/laundry'
import { activeListingFor } from '../../domain/swaps'
import type { Garment, IsoDate } from '../../domain/types'
import { formatDuration, objectPronoun, participle, verb, wornAgo } from '../../domain/wording'

/** État en toutes lettres (statusText() du prototype) : « au lavage jusqu’à vendredi », « dort depuis 7 mois », « disponible ». */
export function statusText(garment: Garment, today: IsoDate, dormancyDays: number): string {
  const state = garmentState(garment, today, dormancyDays)
  switch (state.kind) {
    case 'laundry':
      return `au lavage jusqu’à ${formatWeekday(state.until)}`
    case 'dormant':
      return `${verb(garment.agreement, 'dort', 'dorment')} depuis ${formatDuration(state.days)}`
    default:
      return garment.agreement.endsWith('p') ? 'disponibles' : 'disponible'
  }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function lastWornText(garment: Garment, today: IsoDate): string {
  if (garment.lastWornAt === null) return `pas encore ${participle(garment.agreement)}`
  return wornAgo(garment.agreement, daysSinceLastWear(garment, today)).toLowerCase()
}

export function GarmentSheet({
  garment,
  onClose,
}: {
  /** Pièce affichée ; null = feuille fermée. */
  garment: Garment | null
  /** Appelé à la fermeture (Fermer, Échap, fond, ou après une action restée sur l'écran). */
  onClose: () => void
}) {
  const { data } = useWardrobe()
  const actions = useGarmentActions()
  const { showToast } = useToast()
  const [busy, setBusy] = useState(false)
  const titleId = useId()

  // Pas de fermeture pendant une action : la feuille se ferme d'elle-même à la fin.
  function close() {
    if (!busy) onClose()
  }

  // Exécute l'action, puis ferme la feuille une fois les données rechargées (le focus peut alors être replacé).
  async function act(action: (g: Garment) => Promise<void> | void, closeAfter = true) {
    if (!garment || busy) return
    setBusy(true)
    try {
      await action(garment)
      if (closeAfter) onClose()
    } catch {
      // Le toast doit être visible : on ferme d'abord la feuille modale.
      onClose()
      showToast('Action impossible pour le moment. Réessaie.')
    } finally {
      setBusy(false)
    }
  }

  const inLaundry = garment ? isInLaundry(garment, data.today) : false
  const status = garment ? statusText(garment, data.today, data.settings.dormancyDays) : ''
  const listed = garment ? activeListingFor(data.swaps.listings, garment.id) !== null : false
  const dormant = garment ? garmentState(garment, data.today, data.settings.dormancyDays).kind === 'dormant' : false

  return (
    <BottomSheet open={garment !== null} onClose={close} labelledBy={titleId}>
      {garment && (
        <>
          <div className="flex items-center gap-3">
            <GarmentTile garment={garment} size="sm" washed={inLaundry} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <h2 id={titleId} className="m-0 text-base leading-[1.2] font-bold">
                {garment.name}
              </h2>
              <p className="m-0 text-sm text-muted">
                {capitalize(status)}
                {/* « Dort depuis 7 mois » dit déjà quand elle a été portée : pas de redite. */}
                {!dormant && ` · ${lastWornText(garment, data.today)}`}
              </p>
            </div>
            <IconButton label="Fermer" onClick={close}>
              <Icon name="close" size={20} />
            </IconButton>
          </div>

          <div className="flex flex-col gap-2.5">
            {inLaundry ? (
              <Button variant="primary" disabled={busy} onClick={() => act(actions.markClean)}>
                Déjà propre
              </Button>
            ) : (
              <>
                <Button disabled={busy} onClick={() => act(actions.wash)}>
                  Mettre au lavage
                </Button>
                {/* Navigue vers Aujourd'hui : l'écran se démonte, inutile de fermer la feuille. */}
                <Button variant="primary" disabled={busy} onClick={() => act(actions.proposeToday, false)}>
                  {capitalize(objectPronoun(garment.agreement))} proposer aujourd’hui
                </Button>
              </>
            )}

            <Button disabled={busy} onClick={() => act(actions.exchange, false)}>
              <Icon name="swap" size={20} />
              {listed ? 'Voir son annonce d’échange' : 'Échanger'}
            </Button>

            <div className="grid grid-cols-2 gap-2.5">
              <Button disabled={busy} onClick={() => act(actions.sell, false)}>
                Vendre
              </Button>
              <Button disabled={busy} onClick={() => act(actions.donate)}>
                Donner
              </Button>
            </div>
          </div>
        </>
      )}
    </BottomSheet>
  )
}

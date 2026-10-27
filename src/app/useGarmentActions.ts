// Actions sur une pièce partagées par le Dressing et À sortir, pour un comportement identique partout.
import { useNavigate } from 'react-router'
import { useToast } from '../components/Toast'
import { formatWeekday } from './format'
import { useWardrobe } from './WardrobeProvider'
import type { Garment } from '../domain/types'
import { agree, pronoun } from '../domain/wording'
import { activeListingFor } from '../domain/swaps'

export function useGarmentActions() {
  const { run, data } = useWardrobe()
  const { showToast } = useToast()
  const navigate = useNavigate()

  return {
    /** Mettre au lavage (durée par défaut de la catégorie, 2 jours sinon). */
    async wash(garment: Garment) {
      const updated = await run((r) => r.washGarment(garment.id))
      showToast(`${garment.name} : au lavage jusqu’à ${formatWeekday(updated.laundryUntil ?? data.today)}.`)
    },
    /** Déjà propre : de nouveau disponible. */
    async markClean(garment: Garment) {
      await run((r) => r.markGarmentClean(garment.id))
      showToast(`${garment.name} : de nouveau disponible.`)
    },
    /** La proposer aujourd'hui / Remettre en jeu : devient l'orpheline de la tenue du jour. */
    async proposeToday(garment: Garment) {
      await run(async (r) => {
        await r.markGarmentClean(garment.id)
        await r.saveDailyOutfit({ day: data.today, orphanId: garment.id, status: 'proposed' })
      })
      navigate('/')
      showToast(`${garment.name} : ${agree(garment.agreement, 'proposé')} dans la tenue du jour.`)
    },
    /** Donner : la pièce quitte le dressing, avec « Annuler » pendant quelques secondes. */
    async donate(garment: Garment) {
      await run((r) => r.setGarmentStatus(garment.id, 'donated'))
      const subject = pronoun(garment.agreement)
      const leaves = garment.agreement.endsWith('p') ? 'quittent' : 'quitte'
      showToast(`${garment.name} : ${agree(garment.agreement, 'donné')}. ${subject.charAt(0).toUpperCase()}${subject.slice(1)} ${leaves} ton dressing.`, {
        undo: () => run((r) => r.setGarmentStatus(garment.id, 'active')).then(() => undefined),
      })
    },
    /** Échanger : ouvre l'annonce si la pièce est déjà dans la bourse, sinon le formulaire prérempli. */
    exchange(garment: Garment) {
      const listing = activeListingFor(data.swaps.listings, garment.id)
      navigate(listing ? `/echanges/annonce/${listing.id}` : `/echanges/proposer/${garment.id}`)
    },
    /** Vendre : ouvre l'annonce préremplie. */
    sell(garment: Garment) {
      navigate(`/vendre/${garment.id}`)
    },
  }
}

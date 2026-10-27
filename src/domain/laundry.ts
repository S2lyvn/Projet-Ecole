// Lavage : durées par catégorie et transitions pures sur une pièce (docs/02-produit.md).
// Le lavage n'est pas un statut : une pièce est au lavage tant que laundryUntil > aujourd'hui.
import { addDays, maxDate } from './dates'
import type { Garment, GarmentCategory, IsoDate } from './types'

/** Jours de lavage par défaut après un port ; 0 = la pièce reste disponible. */
export const LAUNDRY_DAYS: Record<GarmentCategory, number> = {
  tee: 3,
  long: 4,
  dress: 3,
  pants: 0,
  shoes: 0,
  outerwear: 0,
  other: 0,
}

/** Durée utilisée quand on force « Mettre au lavage » sur une catégorie à 0 jour (prototype : LAUNDRY[p.type]||2). */
export const MANUAL_LAUNDRY_FALLBACK_DAYS = 2

/** Date de retour après un port, ou null si la catégorie ne part pas au lavage. */
export function laundryUntilAfterWear(category: GarmentCategory, wornOn: IsoDate): IsoDate | null {
  const days = LAUNDRY_DAYS[category]
  return days > 0 ? addDays(wornOn, days) : null
}

/** Date de retour quand l'utilisateur met la pièce au lavage lui-même. */
export function laundryUntilForManualWash(category: GarmentCategory, today: IsoDate): IsoDate {
  return addDays(today, LAUNDRY_DAYS[category] || MANUAL_LAUNDRY_FALLBACK_DAYS)
}

/** Au lavage tant que laundryUntil > aujourd'hui : la pièce redevient disponible le jour laundryUntil. */
export function isInLaundry(garment: Pick<Garment, 'laundryUntil'>, today: IsoDate): boolean {
  return garment.laundryUntil !== null && garment.laundryUntil > today
}

export function isAvailable(garment: Pick<Garment, 'status' | 'laundryUntil'>, today: IsoDate): boolean {
  return garment.status === 'active' && !isInLaundry(garment, today)
}

/** Enregistre un port (éventuellement dans le passé). Ne raccourcit jamais un lavage en cours. */
export function applyWear(garment: Garment, wornOn: IsoDate): Garment {
  if (garment.status !== 'active') return garment
  const until = laundryUntilAfterWear(garment.category, wornOn)
  return {
    ...garment,
    lastWornAt: maxDate(garment.lastWornAt, wornOn),
    laundryUntil: until === null ? garment.laundryUntil : maxDate(garment.laundryUntil, until),
  }
}

export function washNow(garment: Garment, today: IsoDate): Garment {
  return { ...garment, laundryUntil: laundryUntilForManualWash(garment.category, today) }
}

export function markClean(garment: Garment): Garment {
  return { ...garment, laundryUntil: null }
}

/** Efface une date de retour passée ou atteinte, pour garder la base propre. */
export function clearExpiredLaundry(garment: Garment, today: IsoDate): Garment {
  if (garment.laundryUntil === null || garment.laundryUntil > today) return garment
  return { ...garment, laundryUntil: null }
}

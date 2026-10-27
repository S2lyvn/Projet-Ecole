// Pièces qui dorment : seuils de l'écran « À sortir » (prototype : p.last >= S.threshold) et critère ADEME.
import { addMonths, daysBetween } from './dates'
import { isInLaundry } from './laundry'
import type { Garment, IsoDate, Wear } from './types'

/** Seuils proposés à l'utilisateur : 3, 6 et 12 mois. */
export const DORMANCY_THRESHOLDS = [90, 180, 365] as const
export type DormancyThreshold = (typeof DORMANCY_THRESHOLDS)[number]
export const DEFAULT_DORMANCY_DAYS = 180

/** Jours depuis le dernier port, ou depuis l'acquisition si la pièce n'a jamais été portée. Jamais négatif. */
export function daysSinceLastWear(garment: Pick<Garment, 'lastWornAt' | 'acquiredAt'>, today: IsoDate): number {
  return Math.max(0, daysBetween(garment.lastWornAt ?? garment.acquiredAt, today))
}

/** Une pièce dort si elle est active et n'a pas été portée depuis au moins thresholdDays jours. */
export function isDormant(garment: Garment, today: IsoDate, thresholdDays: number = DEFAULT_DORMANCY_DAYS): boolean {
  return garment.status === 'active' && daysSinceLastWear(garment, today) >= thresholdDays
}

/** Pièces dormantes, de celle qui dort depuis le plus longtemps à la plus récente (puis par nom, puis par id). */
export function listDormant(
  garments: Garment[],
  today: IsoDate,
  thresholdDays: number = DEFAULT_DORMANCY_DAYS,
): Garment[] {
  return garments
    .filter((g) => isDormant(g, today, thresholdDays))
    .map((g) => ({ garment: g, days: daysSinceLastWear(g, today) }))
    .sort(
      (a, b) =>
        b.days - a.days ||
        a.garment.name.localeCompare(b.garment.name, 'fr') ||
        (a.garment.id < b.garment.id ? -1 : a.garment.id > b.garment.id ? 1 : 0),
    )
    .map((entry) => entry.garment)
}

/**
 * Critère ADEME : pièce active, acquise depuis plus de 3 mois et portée au plus 2 fois
 * (un même jour ne compte qu'une fois).
 */
export function isDormantAdeme(garment: Garment, wears: Wear[], today: IsoDate): boolean {
  if (garment.status !== 'active') return false
  if (!(garment.acquiredAt < addMonths(today, -3))) return false
  const days = new Set(wears.filter((w) => w.garmentId === garment.id).map((w) => w.wornOn))
  return days.size <= 2
}

/** Puce d'une pièce dans le Dressing (docs/02-produit.md) : le lavage passe avant la dormance (chipFor() du prototype). */
export type GarmentState =
  | { kind: 'laundry'; until: IsoDate }
  | { kind: 'dormant'; days: number }
  | { kind: 'available' }
  /** Donnée, vendue, échangée ou archivée : hors du Dressing. */
  | { kind: 'inactive' }

export function garmentState(
  garment: Garment,
  today: IsoDate,
  thresholdDays: number = DEFAULT_DORMANCY_DAYS,
): GarmentState {
  if (garment.status !== 'active') return { kind: 'inactive' }
  if (garment.laundryUntil !== null && isInLaundry(garment, today)) return { kind: 'laundry', until: garment.laundryUntil }
  if (isDormant(garment, today, thresholdDays)) return { kind: 'dormant', days: daysSinceLastWear(garment, today) }
  return { kind: 'available' }
}

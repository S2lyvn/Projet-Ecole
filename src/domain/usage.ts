// Bilan d'usage : part du dressing réellement portée sur une période, et circulation par l'échange.
// Fonctions pures : « today » est toujours passé en paramètre.
import { daysBetween } from './dates'
import type { Garment, IsoDate } from './types'

export const USAGE_PERIODS = [90, 365] as const
export type UsagePeriod = (typeof USAGE_PERIODS)[number]
export const DEFAULT_USAGE_PERIOD: UsagePeriod = 90

export interface UsageSummary {
  worn: number
  total: number
  ratio: number
}

export interface SwapCirculation {
  given: number
  received: number
}

/** Pièces actives portées depuis au plus « periodDays » jours, sur l'ensemble des pièces actives. */
export function computeUsage(
  garments: readonly Garment[],
  today: IsoDate,
  periodDays: number = DEFAULT_USAGE_PERIOD,
): UsageSummary {
  const active = garments.filter((g) => g.status === 'active')
  // Une pièce jamais portée ne compte pas comme portée, même ajoutée récemment.
  const worn = active.filter((g) => g.lastWornAt !== null && daysBetween(g.lastWornAt, today) <= periodDays).length
  const total = active.length
  return { worn, total, ratio: total === 0 ? 0 : worn / total }
}

/** Pièces données par l'échange (sorties) et reçues par l'échange (quel que soit leur statut actuel). */
export function countSwapCirculation(garments: readonly Garment[]): SwapCirculation {
  const given = garments.filter((g) => g.status === 'swapped_out').length
  const received = garments.filter((g) => g.source === 'swap').length
  return { given, received }
}

/** Pourcentage entier au format français, ex. « 42 % » (espace insécable avant %). */
export function formatUsagePercent(ratio: number): string {
  // toPrecision(12) gomme l'erreur de flottant (23 / 40 * 100 = 57.4999…) avant l'arrondi.
  return `${Math.round(Number((ratio * 100).toPrecision(12)))} %`
}

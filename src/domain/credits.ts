// Crédits de la bourse d'échange (docs/03-communaute-echange.md).
// Côté client, ces fonctions servent seulement à AFFICHER et à pré-vérifier avant d'appeler le serveur.
// La vraie règle est appliquée côté serveur (fonctions RPC Supabase, étape 4) : ne jamais s'y fier pour autoriser.
import type { GarmentCategory, IsoDateTime, LedgerEntry } from './types'

/** Barème fixe du MVP (stocké aussi en base pour pouvoir l'ajuster). */
export const CREDIT_RATES: Record<GarmentCategory, number> = {
  tee: 1,
  other: 1,
  pants: 2,
  dress: 2,
  shoes: 2,
  long: 2,
  outerwear: 3,
}

export function creditsFor(category: GarmentCategory): number {
  return CREDIT_RATES[category]
}

/** On commence par proposer une pièce : pas de crédits offerts. */
export const WELCOME_CREDITS = 0
export const MAX_OPEN_RESERVATIONS = 3
export const RESERVATION_HOURS = 72

const MS_PER_HOUR = 3_600_000

/** Solde = somme du registre (hold négatif, release positif : les blocages sont déjà déduits). */
export function balanceOf(entries: LedgerEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.amount, 0)
}

/** Crédits actuellement bloqués par des réservations en cours (hold = -N, release = +N). */
export function heldCredits(entries: LedgerEntry[]): number {
  const net = entries
    .filter((entry) => entry.reason === 'hold' || entry.reason === 'release')
    .reduce((sum, entry) => sum + entry.amount, 0)
  return Math.max(0, -net)
}

export type ReserveRefusal = 'not_adult' | 'own_listing' | 'too_many_reservations' | 'insufficient_credits'

export interface ReserveCheck {
  isAdult: boolean
  isOwner: boolean
  openReservations: number
  /** Solde disponible (les crédits bloqués sont déjà déduits). */
  balance: number
  cost: number
}

/**
 * Pré-vérification d'une réservation, dans l'ordre : âge, propriétaire, nombre de réservations, solde.
 * Les comparaisons échouent par défaut : un nombre invalide (NaN) entraîne un refus.
 */
export function canReserve(input: ReserveCheck): { ok: true } | { ok: false; reason: ReserveRefusal } {
  if (!input.isAdult) return { ok: false, reason: 'not_adult' }
  if (input.isOwner) return { ok: false, reason: 'own_listing' }
  if (!(input.openReservations < MAX_OPEN_RESERVATIONS)) return { ok: false, reason: 'too_many_reservations' }
  if (!(input.balance >= input.cost)) return { ok: false, reason: 'insufficient_credits' }
  return { ok: true }
}

export const RESERVE_REFUSAL_MESSAGES: Record<ReserveRefusal, string> = {
  not_adult: 'La bourse est ouverte aux 18 ans et plus pour le moment.',
  own_listing: 'C’est ta propre annonce : elle attend quelqu’un d’autre.',
  too_many_reservations: `Tu as déjà ${MAX_OPEN_RESERVATIONS} réservations en cours. Termine ou annule l’une d’elles pour en faire une autre.`,
  insufficient_credits: 'Il te manque des crédits. Propose une pièce à l’échange pour en gagner.',
}

// Un horodatage doit porter son fuseau (Z ou ±hh:mm, comme un timestamptz Supabase) :
// sinon Date.parse le lirait à l'heure locale de l'appareil.
const WITH_TIMEZONE = /(Z|[+-]\d{2}:\d{2})$/

function toMs(value: IsoDateTime): number {
  const ms = WITH_TIMEZONE.test(value) ? Date.parse(value) : Number.NaN
  if (Number.isNaN(ms)) throw new Error(`Horodatage invalide : « ${value} »`)
  return ms
}

/** Fin de la réservation : 72 h après sa création. */
export function reservationExpiresAt(reservedAt: IsoDateTime): IsoDateTime {
  return new Date(toMs(reservedAt) + RESERVATION_HOURS * MS_PER_HOUR).toISOString()
}

/** Expirée dès que « now » atteint l'échéance (72 h pile comprises). */
export function isReservationExpired(reservedAt: IsoDateTime, now: IsoDateTime): boolean {
  return toMs(now) >= toMs(reservationExpiresAt(reservedAt))
}

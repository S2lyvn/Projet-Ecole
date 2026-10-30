// Jetons de réclamation de la bourse d'échange (docs/03-communaute-echange.md).
// Règle : tu fournis un habit, tu reçois 1 jeton ; 1 jeton permet de réclamer 1 habit chez n'importe quel membre,
// quand tu veux (pas d'expiration). Le jeton est donné à la remise confirmée, jamais à la mise en ligne.
// Côté client, ces fonctions servent seulement à AFFICHER et à pré-vérifier avant d'appeler le serveur.
// La vraie règle est appliquée côté serveur (fonctions RPC Supabase, étape 4) : ne jamais s'y fier pour autoriser.
import type { IsoDateTime, LedgerEntry } from './types'

/** 1 habit fourni = 1 jeton gagné ; 1 habit réclamé = 1 jeton dépensé, quelle que soit la pièce. */
export const TOKENS_PER_GARMENT = 1

/** On commence par donner une pièce : pas de jeton offert. */
export const WELCOME_TOKENS = 0
export const MAX_OPEN_RESERVATIONS = 3
export const RESERVATION_HOURS = 72

const MS_PER_HOUR = 3_600_000

/** Jetons disponibles = somme du registre (hold négatif, release positif : les blocages sont déjà déduits). */
export function balanceOf(entries: LedgerEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.amount, 0)
}

/** Jetons actuellement bloqués par des réclamations en cours (hold = -1, release = +1). */
export function heldTokens(entries: LedgerEntry[]): number {
  const net = entries
    .filter((entry) => entry.reason === 'hold' || entry.reason === 'release')
    .reduce((sum, entry) => sum + entry.amount, 0)
  return Math.max(0, -net)
}

export type ReserveRefusal = 'not_adult' | 'own_listing' | 'too_many_reservations' | 'insufficient_tokens'

export interface ReserveCheck {
  isAdult: boolean
  isOwner: boolean
  openReservations: number
  /** Jetons disponibles (les jetons bloqués sont déjà déduits). */
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
  if (!(input.balance >= input.cost)) return { ok: false, reason: 'insufficient_tokens' }
  return { ok: true }
}

export const RESERVE_REFUSAL_MESSAGES: Record<ReserveRefusal, string> = {
  not_adult: 'La bourse est ouverte aux 18 ans et plus pour le moment.',
  own_listing: 'C’est ta propre annonce : elle attend quelqu’un d’autre.',
  too_many_reservations: `Tu as déjà ${MAX_OPEN_RESERVATIONS} réservations en cours. Termine ou annule l’une d’elles pour en faire une autre.`,
  insufficient_tokens: 'Il te faut un jeton. Donne une pièce : tu en gagnes un à la remise.',
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

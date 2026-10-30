import { describe, expect, it } from 'vitest'
import {
  balanceOf,
  canReserve,
  heldTokens,
  isReservationExpired,
  MAX_OPEN_RESERVATIONS,
  RESERVATION_HOURS,
  RESERVE_REFUSAL_MESSAGES,
  reservationExpiresAt,
  TOKENS_PER_GARMENT,
  WELCOME_TOKENS,
} from './tokens'
import type { ReserveCheck } from './tokens'
import type { LedgerEntry, LedgerReason } from './types'

function entry(amount: number, reason: LedgerReason, swapId: string | null = 's1'): LedgerEntry {
  return { amount, reason, swapId, createdAt: '2026-10-27T08:00:00.000Z' }
}

function check(overrides: Partial<ReserveCheck> = {}): ReserveCheck {
  return { isAdult: true, isOwner: false, openReservations: 0, balance: 2, cost: 1, ...overrides }
}

describe('jetons', () => {
  describe('règle des jetons', () => {
    it('1 habit fourni = 1 jeton, 1 habit réclamé = 1 jeton', () => {
      expect(TOKENS_PER_GARMENT).toBe(1)
    })

    it('fixe les constantes du MVP', () => {
      expect(WELCOME_TOKENS).toBe(0)
      expect(MAX_OPEN_RESERVATIONS).toBe(3)
      expect(RESERVATION_HOURS).toBe(72)
    })
  })

  describe('solde et jetons bloqués', () => {
    it('a un solde nul et rien de bloqué sans écriture', () => {
      expect(balanceOf([])).toBe(0)
      expect(heldTokens([])).toBe(0)
    })

    it('suit un échange complet côté receveur et côté donneur', () => {
      // Le receveur a donné une pièce plus tôt (1 jeton), puis réclame une pièce : son jeton est bloqué.
      const receiver = [entry(1, 'earn', 's0'), entry(-1, 'hold')]
      expect(balanceOf(receiver)).toBe(0)
      expect(heldTokens(receiver)).toBe(1)

      // Remise confirmée : déblocage puis dépense du jeton.
      const receiverAfter = [...receiver, entry(1, 'release'), entry(-1, 'spend')]
      expect(balanceOf(receiverAfter)).toBe(0)
      expect(heldTokens(receiverAfter)).toBe(0)

      // Le donneur gagne 1 jeton, à réclamer quand il veut.
      const giver = [entry(1, 'earn')]
      expect(balanceOf(giver)).toBe(1)
      expect(heldTokens(giver)).toBe(0)
    })

    it('débloque le jeton en cas d’annulation', () => {
      const entries = [entry(1, 'earn', 's0'), entry(-1, 'hold'), entry(1, 'release')]
      expect(balanceOf(entries)).toBe(1)
      expect(heldTokens(entries)).toBe(0)
    })

    it('cumule plusieurs blocages et ne devient jamais négatif', () => {
      const entries = [entry(3, 'earn', 's0'), entry(-1, 'hold', 's1'), entry(-1, 'hold', 's2'), entry(1, 'release', 's1')]
      expect(heldTokens(entries)).toBe(1)
      expect(heldTokens([entry(1, 'release')])).toBe(0)
    })

    it('compte bonus et ajustements dans le solde mais pas dans les blocages', () => {
      const entries = [entry(1, 'bonus', null), entry(-1, 'adjustment', null), entry(2, 'adjustment', null)]
      expect(balanceOf(entries)).toBe(2)
      expect(heldTokens(entries)).toBe(0)
    })

    it('ne modifie pas le registre reçu', () => {
      const entries = [entry(-1, 'hold'), entry(1, 'release')]
      const copy = structuredClone(entries)
      balanceOf(entries)
      heldTokens(entries)
      expect(entries).toEqual(copy)
    })
  })

  describe('canReserve', () => {
    it('accepte une réservation valide', () => {
      expect(canReserve(check())).toEqual({ ok: true })
    })

    it('refuse chaque cas avec la bonne raison', () => {
      expect(canReserve(check({ isAdult: false }))).toEqual({ ok: false, reason: 'not_adult' })
      expect(canReserve(check({ isOwner: true }))).toEqual({ ok: false, reason: 'own_listing' })
      expect(canReserve(check({ openReservations: 4 }))).toEqual({ ok: false, reason: 'too_many_reservations' })
      expect(canReserve(check({ balance: 0 }))).toEqual({ ok: false, reason: 'insufficient_tokens' })
    })

    it('refuse à exactement 3 réservations en cours, accepte à 2', () => {
      expect(canReserve(check({ openReservations: 3 }))).toEqual({ ok: false, reason: 'too_many_reservations' })
      expect(canReserve(check({ openReservations: 2 }))).toEqual({ ok: true })
    })

    it('accepte avec exactement 1 jeton', () => {
      expect(canReserve(check({ balance: 1, cost: 1 }))).toEqual({ ok: true })
      expect(canReserve(check({ balance: 0, cost: 1 }))).toEqual({ ok: false, reason: 'insufficient_tokens' })
    })

    it('respecte l’ordre de priorité des refus', () => {
      const all = { isAdult: false, isOwner: true, openReservations: 3, balance: 0, cost: 1 }
      expect(canReserve(check(all))).toEqual({ ok: false, reason: 'not_adult' })
      expect(canReserve(check({ ...all, isAdult: true }))).toEqual({ ok: false, reason: 'own_listing' })
      expect(canReserve(check({ ...all, isAdult: true, isOwner: false }))).toEqual({
        ok: false,
        reason: 'too_many_reservations',
      })
    })

    it('refuse par défaut un nombre invalide (NaN)', () => {
      expect(canReserve(check({ balance: Number.NaN }))).toEqual({ ok: false, reason: 'insufficient_tokens' })
      expect(canReserve(check({ cost: Number.NaN }))).toEqual({ ok: false, reason: 'insufficient_tokens' })
      expect(canReserve(check({ openReservations: Number.NaN }))).toEqual({ ok: false, reason: 'too_many_reservations' })
    })

    it('a un message en français, au tutoiement, pour chaque refus', () => {
      expect(RESERVE_REFUSAL_MESSAGES).toEqual({
        not_adult: 'La bourse est ouverte aux 18 ans et plus pour le moment.',
        own_listing: 'C’est ta propre annonce : elle attend quelqu’un d’autre.',
        too_many_reservations: 'Tu as déjà 3 réservations en cours. Termine ou annule l’une d’elles pour en faire une autre.',
        insufficient_tokens: 'Il te faut un jeton. Donne une pièce : tu en gagnes un à la remise.',
      })
      for (const message of Object.values(RESERVE_REFUSAL_MESSAGES)) expect(message).not.toMatch(/\bvous\b/i)
    })
  })

  describe('expiration des réservations', () => {
    const reservedAt = '2026-10-27T08:30:00.000Z'

    it('expire 72 h après la réservation', () => {
      expect(reservationExpiresAt(reservedAt)).toBe('2026-10-30T08:30:00.000Z')
      expect(reservationExpiresAt('2026-12-30T22:00:00.000Z')).toBe('2027-01-02T22:00:00.000Z')
    })

    it('est expirée à 72 h pile, pas une milliseconde avant', () => {
      expect(isReservationExpired(reservedAt, '2026-10-30T08:29:59.999Z')).toBe(false)
      expect(isReservationExpired(reservedAt, '2026-10-30T08:30:00.000Z')).toBe(true)
      expect(isReservationExpired(reservedAt, '2026-10-31T00:00:00.000Z')).toBe(true)
      expect(isReservationExpired(reservedAt, reservedAt)).toBe(false)
    })

    it('accepte un décalage horaire explicite', () => {
      expect(reservationExpiresAt('2026-10-27T09:30:00+01:00')).toBe('2026-10-30T08:30:00.000Z')
      expect(reservationExpiresAt('2026-10-27T08:30:00+00:00')).toBe('2026-10-30T08:30:00.000Z')
    })

    it('refuse un horodatage invalide', () => {
      expect(() => reservationExpiresAt('pas une date')).toThrow('Horodatage invalide')
      expect(() => isReservationExpired(reservedAt, 'nope')).toThrow('Horodatage invalide')
      expect(() => isReservationExpired('nope', reservedAt)).toThrow('Horodatage invalide')
    })

    it('refuse un horodatage sans fuseau, qui dépendrait de l’heure locale de l’appareil', () => {
      expect(() => reservationExpiresAt('2026-10-27T08:30:00')).toThrow('Horodatage invalide')
      expect(() => reservationExpiresAt('2026-10-27')).toThrow('Horodatage invalide')
      expect(() => isReservationExpired(reservedAt, '2026-10-30T08:30:00')).toThrow('Horodatage invalide')
    })
  })
})

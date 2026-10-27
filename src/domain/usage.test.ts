import { describe, expect, it } from 'vitest'
import { addDays } from './dates'
import type { Garment, IsoDate } from './types'
import {
  computeUsage,
  countSwapCirculation,
  DEFAULT_USAGE_PERIOD,
  formatUsagePercent,
  USAGE_PERIODS,
} from './usage'

const TODAY: IsoDate = '2026-10-27'

let nextId = 1
function makeGarment(overrides: Partial<Garment> = {}): Garment {
  return {
    id: `g${nextId++}`,
    name: 'Pièce',
    category: 'tee',
    color: null,
    size: null,
    brand: null,
    photoPath: null,
    agreement: 'm',
    source: 'manual',
    originGarmentId: null,
    acquiredAt: '2025-01-01',
    lastWornAt: null,
    laundryUntil: null,
    status: 'active',
    ...overrides,
  }
}

/** Pièce portée il y a « days » jours. */
function wornAgo(days: number, overrides: Partial<Garment> = {}): Garment {
  return makeGarment({ lastWornAt: addDays(TODAY, -days), ...overrides })
}

describe('usage', () => {
  it('expose les périodes 3 et 12 mois, 90 jours par défaut', () => {
    expect(USAGE_PERIODS).toEqual([90, 365])
    expect(DEFAULT_USAGE_PERIOD).toBe(90)
  })

  describe('computeUsage', () => {
    it('compte une pièce portée il y a 90 jours, pas à 91 jours', () => {
      expect(computeUsage([wornAgo(90)], TODAY)).toEqual({ worn: 1, total: 1, ratio: 1 })
      expect(computeUsage([wornAgo(91)], TODAY)).toEqual({ worn: 0, total: 1, ratio: 0 })
      expect(computeUsage([wornAgo(0)], TODAY).worn).toBe(1)
    })

    it('exclut du total les pièces qui ne sont plus actives', () => {
      const garments = [
        wornAgo(5),
        wornAgo(200),
        wornAgo(3, { status: 'donated' }),
        wornAgo(3, { status: 'sold' }),
        wornAgo(3, { status: 'swapped_out' }),
        wornAgo(3, { status: 'archived' }),
      ]
      expect(computeUsage(garments, TODAY)).toEqual({ worn: 1, total: 2, ratio: 0.5 })
    })

    it('renvoie zéro pour un dressing vide', () => {
      expect(computeUsage([], TODAY)).toEqual({ worn: 0, total: 0, ratio: 0 })
      expect(computeUsage([makeGarment({ status: 'archived' })], TODAY)).toEqual({ worn: 0, total: 0, ratio: 0 })
    })

    it('ne compte pas comme portée une pièce jamais portée, même ajoutée hier', () => {
      const fresh = makeGarment({ acquiredAt: addDays(TODAY, -1), lastWornAt: null })
      expect(computeUsage([fresh, wornAgo(1)], TODAY)).toEqual({ worn: 1, total: 2, ratio: 0.5 })
    })

    it('élargit le compte sur 12 mois (frontière 365)', () => {
      const garments = [wornAgo(10), wornAgo(200), wornAgo(365), wornAgo(366)]
      expect(computeUsage(garments, TODAY, 365)).toEqual({ worn: 3, total: 4, ratio: 0.75 })
      expect(computeUsage(garments, TODAY).worn).toBe(1)
    })

    it('retrouve les chiffres du prototype (17 pièces)', () => {
      // Valeurs « last » (jours depuis le dernier port) de seed() dans reference/prototype-e-mirror.html.
      const lastDays = [214, 6, 9, 4, 41, 5, 28, 270, 20, 335, 150, 62, 18, 95, 11, 120, 410]
      const garments = lastDays.map((d) => wornAgo(d))
      // ≤ 90 : 6, 9, 4, 41, 5, 28, 20, 62, 18, 11 → 10 pièces sur 17.
      expect(computeUsage(garments, TODAY, 90)).toEqual({ worn: 10, total: 17, ratio: 10 / 17 })
      // ≤ 365 : toutes sauf 410 → 16 sur 17.
      expect(computeUsage(garments, TODAY, 365)).toEqual({ worn: 16, total: 17, ratio: 16 / 17 })
      expect(formatUsagePercent(10 / 17)).toBe('59 %')
    })

    it('ne modifie pas les pièces reçues', () => {
      const garments = [wornAgo(5), makeGarment()]
      const snapshot = structuredClone(garments)
      computeUsage(garments, TODAY)
      expect(garments).toEqual(snapshot)
    })
  })

  describe('countSwapCirculation', () => {
    it('compte les pièces données et reçues par l’échange', () => {
      const garments = [
        makeGarment({ status: 'swapped_out' }),
        makeGarment({ status: 'swapped_out', source: 'purchase' }),
        makeGarment({ source: 'swap' }),
        makeGarment({ source: 'swap', status: 'archived' }),
        makeGarment({ source: 'swap', status: 'swapped_out' }),
        makeGarment({ status: 'donated' }),
        makeGarment(),
      ]
      expect(countSwapCirculation(garments)).toEqual({ given: 3, received: 3 })
    })

    it('renvoie zéro sans échange', () => {
      expect(countSwapCirculation([])).toEqual({ given: 0, received: 0 })
      expect(countSwapCirculation([makeGarment(), makeGarment({ status: 'sold' })])).toEqual({ given: 0, received: 0 })
    })
  })

  describe('formatUsagePercent', () => {
    it('arrondit à l’entier avec une espace insécable avant %', () => {
      expect(formatUsagePercent(0)).toBe('0 %')
      expect(formatUsagePercent(1)).toBe('100 %')
      expect(formatUsagePercent(0.42)).toBe('42 %')
      expect(formatUsagePercent(0.425)).toBe('43 %')
      expect(formatUsagePercent(0.4249)).toBe('42 %')
      expect(formatUsagePercent(1 / 3)).toBe('33 %')
    })

    it('arrondit au-dessus les demi-pourcents malgré l’erreur de flottant', () => {
      expect(formatUsagePercent(23 / 40)).toBe('58 %')
      expect(formatUsagePercent(29 / 200)).toBe('15 %')
      expect(formatUsagePercent(57 / 200)).toBe('29 %')
      expect(formatUsagePercent(113 / 200)).toBe('57 %')
    })
  })
})

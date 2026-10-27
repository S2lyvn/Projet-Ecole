import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DORMANCY_DAYS,
  DORMANCY_THRESHOLDS,
  daysSinceLastWear,
  garmentState,
  isDormant,
  isDormantAdeme,
  listDormant,
} from './dormancy'
import { addDays } from './dates'
import type { Garment, Wear } from './types'

const TODAY = '2026-10-27'

function makeGarment(overrides: Partial<Garment> = {}): Garment {
  return {
    id: 'g1',
    name: 'Chemise',
    category: 'long',
    color: null,
    size: null,
    brand: null,
    photoPath: null,
    agreement: 'f',
    source: 'manual',
    originGarmentId: null,
    acquiredAt: '2025-01-01',
    lastWornAt: null,
    laundryUntil: null,
    status: 'active',
    ...overrides,
  }
}

function wear(garmentId: string, wornOn: string): Wear {
  return { garmentId, wornOn, source: 'manual' }
}

describe('constantes', () => {
  it('propose les seuils 3, 6 et 12 mois, 6 mois par défaut', () => {
    expect(DORMANCY_THRESHOLDS).toEqual([90, 180, 365])
    expect(DEFAULT_DORMANCY_DAYS).toBe(180)
  })
})

describe('daysSinceLastWear', () => {
  it('compte depuis le dernier port', () => {
    expect(daysSinceLastWear({ lastWornAt: '2026-10-17', acquiredAt: '2020-01-01' }, TODAY)).toBe(10)
  })

  it('compte depuis acquiredAt si la pièce n’a jamais été portée', () => {
    expect(daysSinceLastWear({ lastWornAt: null, acquiredAt: '2026-10-07' }, TODAY)).toBe(20)
  })

  it('ne renvoie jamais un nombre négatif', () => {
    expect(daysSinceLastWear({ lastWornAt: '2026-11-05', acquiredAt: '2020-01-01' }, TODAY)).toBe(0)
    expect(daysSinceLastWear({ lastWornAt: null, acquiredAt: '2026-12-01' }, TODAY)).toBe(0)
  })
})

describe('isDormant', () => {
  it.each(DORMANCY_THRESHOLDS)('seuil %i : dort exactement à la frontière, pas un jour avant', (threshold) => {
    const atLimit = makeGarment({ lastWornAt: addDays(TODAY, -threshold) })
    const justBefore = makeGarment({ lastWornAt: addDays(TODAY, -(threshold - 1)) })
    expect(isDormant(atLimit, TODAY, threshold)).toBe(true)
    expect(isDormant(justBefore, TODAY, threshold)).toBe(false)
  })

  it('utilise 180 jours par défaut (179 non, 180 oui)', () => {
    expect(isDormant(makeGarment({ lastWornAt: addDays(TODAY, -179) }), TODAY)).toBe(false)
    expect(isDormant(makeGarment({ lastWornAt: addDays(TODAY, -180) }), TODAY)).toBe(true)
  })

  it('compte une pièce jamais portée depuis son acquisition', () => {
    expect(isDormant(makeGarment({ lastWornAt: null, acquiredAt: addDays(TODAY, -200) }), TODAY)).toBe(true)
    expect(isDormant(makeGarment({ lastWornAt: null, acquiredAt: addDays(TODAY, -30) }), TODAY)).toBe(false)
  })

  it('ignore le lavage : seule la date compte', () => {
    const inLaundry = makeGarment({ lastWornAt: addDays(TODAY, -200), laundryUntil: addDays(TODAY, 2) })
    expect(isDormant(inLaundry, TODAY)).toBe(true)
    expect(listDormant([inLaundry], TODAY)).toEqual([inLaundry])
  })

  it('une pièce non active ne dort jamais', () => {
    for (const status of ['donated', 'sold', 'swapped_out', 'archived'] as const) {
      expect(isDormant(makeGarment({ status, lastWornAt: '2020-01-01' }), TODAY)).toBe(false)
    }
  })
})

describe('listDormant', () => {
  it('ne garde que les pièces dormantes, de la plus ancienne à la plus récente', () => {
    const recent = makeGarment({ id: 'a', name: 'Récente', lastWornAt: addDays(TODAY, -10) })
    const old = makeGarment({ id: 'b', name: 'Vieille', lastWornAt: addDays(TODAY, -400) })
    const mid = makeGarment({ id: 'c', name: 'Moyenne', lastWornAt: addDays(TODAY, -200) })
    const gone = makeGarment({ id: 'd', name: 'Donnée', status: 'donated', lastWornAt: '2020-01-01' })
    expect(listDormant([recent, mid, gone, old], TODAY).map((g) => g.id)).toEqual(['b', 'c'])
  })

  it('départage les égalités par nom puis par id', () => {
    const last = addDays(TODAY, -200)
    const zebre = makeGarment({ id: 'z1', name: 'Zèbre', lastWornAt: last })
    const ete2 = makeGarment({ id: 'e2', name: 'Été', lastWornAt: last })
    const ete1 = makeGarment({ id: 'e1', name: 'Été', lastWornAt: last })
    const abc = makeGarment({ id: 'x', name: 'Abricot', lastWornAt: last })
    expect(listDormant([zebre, ete2, abc, ete1], TODAY).map((g) => g.id)).toEqual(['x', 'e1', 'e2', 'z1'])
  })

  it('respecte le seuil passé et ne modifie pas le tableau reçu', () => {
    const g90 = makeGarment({ id: 'a', lastWornAt: addDays(TODAY, -100) })
    const g10 = makeGarment({ id: 'b', lastWornAt: addDays(TODAY, -10) })
    const input = [g10, g90]
    expect(listDormant(input, TODAY, 90)).toEqual([g90])
    expect(input).toEqual([g10, g90])
  })
})

describe('isDormantAdeme', () => {
  const old = makeGarment({ id: 'g1', acquiredAt: '2026-01-01' })

  it('exige une acquisition strictement antérieure à 3 mois', () => {
    // addMonths('2026-10-27', -3) = '2026-07-27'
    expect(isDormantAdeme(makeGarment({ acquiredAt: '2026-07-27' }), [], TODAY)).toBe(false)
    expect(isDormantAdeme(makeGarment({ acquiredAt: '2026-07-26' }), [], TODAY)).toBe(true)
  })

  it('2 ports : dort ; 3 ports : ne dort pas', () => {
    const two = [wear('g1', '2026-02-01'), wear('g1', '2026-03-01')]
    expect(isDormantAdeme(old, two, TODAY)).toBe(true)
    expect(isDormantAdeme(old, [...two, wear('g1', '2026-04-01')], TODAY)).toBe(false)
  })

  it('ignore les ports des autres pièces', () => {
    const wears = [
      wear('g1', '2026-02-01'),
      wear('g2', '2026-03-01'),
      wear('g2', '2026-04-01'),
      wear('g3', '2026-05-01'),
    ]
    expect(isDormantAdeme(old, wears, TODAY)).toBe(true)
  })

  it('compte une seule fois plusieurs ports le même jour', () => {
    const wears = [wear('g1', '2026-02-01'), wear('g1', '2026-02-01'), wear('g1', '2026-03-01')]
    expect(isDormantAdeme(old, wears, TODAY)).toBe(true)
  })

  it('une pièce non active ne compte jamais', () => {
    expect(isDormantAdeme(makeGarment({ acquiredAt: '2026-01-01', status: 'sold' }), [], TODAY)).toBe(false)
  })
})

describe('garmentState (puce du Dressing)', () => {
  it('au lavage : date de retour, même si la pièce dort', () => {
    const g = makeGarment({ lastWornAt: addDays(TODAY, -400), laundryUntil: addDays(TODAY, 2) })
    expect(garmentState(g, TODAY)).toEqual({ kind: 'laundry', until: addDays(TODAY, 2) })
  })

  it('le jour du retour, la pièce n’est plus au lavage', () => {
    const g = makeGarment({ lastWornAt: addDays(TODAY, -3), laundryUntil: TODAY })
    expect(garmentState(g, TODAY)).toEqual({ kind: 'available' })
  })

  it('dort selon le seuil choisi, avec la durée', () => {
    const g = makeGarment({ lastWornAt: addDays(TODAY, -120) })
    expect(garmentState(g, TODAY)).toEqual({ kind: 'available' })
    expect(garmentState(g, TODAY, 90)).toEqual({ kind: 'dormant', days: 120 })
  })

  it('pièce jamais portée : dort depuis son acquisition', () => {
    const g = makeGarment({ lastWornAt: null, acquiredAt: addDays(TODAY, -200) })
    expect(garmentState(g, TODAY)).toEqual({ kind: 'dormant', days: 200 })
  })

  it('pièce non active : hors du Dressing', () => {
    expect(garmentState(makeGarment({ status: 'donated', lastWornAt: addDays(TODAY, -400) }), TODAY)).toEqual({
      kind: 'inactive',
    })
  })
})

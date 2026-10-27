import { describe, expect, it } from 'vitest'
import {
  LAUNDRY_DAYS,
  MANUAL_LAUNDRY_FALLBACK_DAYS,
  applyWear,
  clearExpiredLaundry,
  isAvailable,
  isInLaundry,
  laundryUntilAfterWear,
  laundryUntilForManualWash,
  markClean,
  washNow,
} from './laundry'
import { GARMENT_CATEGORIES, GARMENT_STATUSES } from './types'
import type { Garment } from './types'

const TODAY = '2026-10-27'
const INACTIVE_STATUSES = GARMENT_STATUSES.filter((status) => status !== 'active')

function makeGarment(overrides: Partial<Garment> = {}): Garment {
  return {
    id: 'g1',
    name: 'Tee-shirt blanc',
    category: 'tee',
    color: '#ffffff',
    size: 'M',
    brand: null,
    photoPath: null,
    agreement: 'm',
    source: 'manual',
    originGarmentId: null,
    acquiredAt: '2026-01-01',
    lastWornAt: null,
    laundryUntil: null,
    status: 'active',
    ...overrides,
  }
}

describe('LAUNDRY_DAYS', () => {
  it('donne une durée pour chaque catégorie', () => {
    expect(LAUNDRY_DAYS).toEqual({ tee: 3, long: 4, dress: 3, pants: 0, shoes: 0, outerwear: 0, other: 0 })
    for (const category of GARMENT_CATEGORIES) expect(LAUNDRY_DAYS[category]).toBeGreaterThanOrEqual(0)
  })

  it('prévoit 2 jours pour un lavage forcé', () => {
    expect(MANUAL_LAUNDRY_FALLBACK_DAYS).toBe(2)
  })
})

describe('laundryUntilAfterWear', () => {
  it.each([
    ['tee', '2026-10-30'],
    ['long', '2026-10-31'],
    ['dress', '2026-10-30'],
  ] as const)('envoie « %s » au lavage jusqu’au %s', (category, expected) => {
    expect(laundryUntilAfterWear(category, TODAY)).toBe(expected)
  })

  it.each(['pants', 'shoes', 'outerwear', 'other'] as const)('laisse « %s » disponible (null)', (category) => {
    expect(laundryUntilAfterWear(category, TODAY)).toBeNull()
  })

  it('passe correctement les fins de mois', () => {
    expect(laundryUntilAfterWear('long', '2026-12-30')).toBe('2027-01-03')
  })
})

describe('laundryUntilForManualWash', () => {
  it('reprend la durée de la catégorie quand elle existe', () => {
    expect(laundryUntilForManualWash('tee', TODAY)).toBe('2026-10-30')
    expect(laundryUntilForManualWash('long', TODAY)).toBe('2026-10-31')
  })

  it.each(['pants', 'shoes', 'outerwear', 'other'] as const)('force 2 jours pour « %s »', (category) => {
    expect(laundryUntilForManualWash(category, TODAY)).toBe('2026-10-29')
  })
})

describe('isInLaundry / isAvailable', () => {
  const g = makeGarment({ laundryUntil: '2026-10-30' })

  it('est au lavage la veille du retour', () => {
    expect(isInLaundry(g, '2026-10-29')).toBe(true)
    expect(isAvailable(g, '2026-10-29')).toBe(false)
  })

  it('redevient disponible le jour du retour', () => {
    expect(isInLaundry(g, '2026-10-30')).toBe(false)
    expect(isAvailable(g, '2026-10-30')).toBe(true)
  })

  it('n’est pas au lavage sans date de retour', () => {
    expect(isInLaundry(makeGarment(), TODAY)).toBe(false)
    expect(isAvailable(makeGarment(), TODAY)).toBe(true)
  })

  it.each(INACTIVE_STATUSES)('n’est jamais disponible si la pièce est « %s »', (status) => {
    expect(isAvailable(makeGarment({ status }), TODAY)).toBe(false)
  })
})

describe('applyWear', () => {
  it('met à jour le dernier port et le lavage pour un tee', () => {
    const result = applyWear(makeGarment(), TODAY)
    expect(result.lastWornAt).toBe(TODAY)
    expect(result.laundryUntil).toBe('2026-10-30')
  })

  it('ne touche pas au lavage pour un pantalon', () => {
    const result = applyWear(makeGarment({ category: 'pants' }), TODAY)
    expect(result.lastWornAt).toBe(TODAY)
    expect(result.laundryUntil).toBeNull()
  })

  it('compte depuis le jour porté quand on confirme le lendemain', () => {
    const yesterday = '2026-10-26'
    const result = applyWear(makeGarment(), yesterday)
    expect(result.lastWornAt).toBe(yesterday)
    expect(result.laundryUntil).toBe('2026-10-29')
  })

  it('ne recule pas lastWornAt pour un port plus ancien', () => {
    const result = applyWear(makeGarment({ category: 'pants', lastWornAt: TODAY }), '2026-10-20')
    expect(result.lastWornAt).toBe(TODAY)
  })

  it('ne raccourcit pas un lavage en cours', () => {
    const once = applyWear(makeGarment({ category: 'long' }), TODAY)
    const twice = applyWear(once, '2026-10-25')
    expect(twice.laundryUntil).toBe('2026-10-31')
    expect(applyWear(makeGarment({ laundryUntil: '2026-11-15' }), TODAY).laundryUntil).toBe('2026-11-15')
  })

  it('allonge le lavage si le nouveau port finit plus tard', () => {
    const result = applyWear(makeGarment({ laundryUntil: '2026-10-28' }), TODAY)
    expect(result.laundryUntil).toBe('2026-10-30')
  })

  it.each(['pants', 'shoes', 'outerwear', 'other'] as const)(
    'garde un lavage forcé en cours pour « %s »',
    (category) => {
      const washed = washNow(makeGarment({ category }), TODAY)
      expect(applyWear(washed, TODAY).laundryUntil).toBe('2026-10-29')
    },
  )

  it.each(INACTIVE_STATUSES)('ignore une pièce « %s »', (status) => {
    const g = makeGarment({ status, laundryUntil: '2026-10-20' })
    expect(applyWear(g, TODAY)).toBe(g)
  })

  it('ne mute pas la pièce reçue', () => {
    const g = makeGarment()
    const snapshot = { ...g }
    const result = applyWear(g, TODAY)
    expect(g).toEqual(snapshot)
    expect(result).not.toBe(g)
  })
})

describe('washNow / markClean / clearExpiredLaundry', () => {
  it('force 2 jours de lavage sur un pantalon', () => {
    expect(washNow(makeGarment({ category: 'pants' }), TODAY).laundryUntil).toBe('2026-10-29')
  })

  it('utilise la durée de la catégorie sur un pull', () => {
    expect(washNow(makeGarment({ category: 'long' }), TODAY).laundryUntil).toBe('2026-10-31')
  })

  it('remet la pièce au propre', () => {
    const g = makeGarment({ laundryUntil: '2026-10-30' })
    expect(markClean(g).laundryUntil).toBeNull()
    expect(g.laundryUntil).toBe('2026-10-30')
  })

  it('efface une date de retour atteinte ou passée', () => {
    expect(clearExpiredLaundry(makeGarment({ laundryUntil: TODAY }), TODAY).laundryUntil).toBeNull()
    expect(clearExpiredLaundry(makeGarment({ laundryUntil: '2026-10-20' }), TODAY).laundryUntil).toBeNull()
  })

  it('garde une date de retour future', () => {
    const g = makeGarment({ laundryUntil: '2026-10-28' })
    expect(clearExpiredLaundry(g, TODAY)).toEqual(g)
  })

  it('ne mute jamais la pièce reçue', () => {
    const g = makeGarment({ laundryUntil: '2026-10-20' })
    washNow(g, TODAY)
    clearExpiredLaundry(g, TODAY)
    markClean(g)
    expect(g.laundryUntil).toBe('2026-10-20')
  })
})

import { describe, expect, it } from 'vitest'
import { GARMENT_CATEGORIES, ITEM_CONDITIONS } from './types'
import type { Agreement, Garment } from './types'
import {
  agree,
  objectPronoun,
  pronoun,
  verb,
  CATEGORY_LABELS,
  CONDITION_LABELS,
  formatDuration,
  notWornSince,
  participle,
  plural,
  wornAgo,
} from './wording'

function makeGarment(overrides: Partial<Garment> = {}): Garment {
  return {
    id: 'g1',
    name: 'Baskets blanches',
    category: 'shoes',
    color: null,
    size: null,
    brand: null,
    photoPath: null,
    agreement: 'fp',
    source: 'manual',
    originGarmentId: null,
    acquiredAt: '2026-01-01',
    lastWornAt: null,
    laundryUntil: null,
    status: 'active',
    ...overrides,
  }
}

describe('plural', () => {
  it('met 0 et 1 au singulier, au-delà au pluriel', () => {
    expect(plural(0, 'pièce', 'pièces')).toBe('pièce')
    expect(plural(1, 'pièce', 'pièces')).toBe('pièce')
    expect(plural(2, 'pièce', 'pièces')).toBe('pièces')
  })
})

describe('formatDuration', () => {
  it('affiche « 1 jour » pour 0 et 1 jour (compatible avec « depuis »)', () => {
    expect(formatDuration(0)).toBe('1 jour')
    expect(formatDuration(1)).toBe('1 jour')
  })

  it('compte en jours en dessous de 30', () => {
    expect(formatDuration(2)).toBe('2 jours')
    expect(formatDuration(29)).toBe('29 jours')
  })

  it('compte en mois arrondis à partir de 30 jours', () => {
    expect(formatDuration(30)).toBe('1 mois')
    expect(formatDuration(44)).toBe('1 mois')
    expect(formatDuration(45)).toBe('2 mois')
    expect(formatDuration(365)).toBe('12 mois')
    expect(formatDuration(410)).toBe('14 mois')
  })
})

describe('accords', () => {
  const cases: [Agreement, string, string, string][] = [
    ['m', 'porté', 'Pas porté depuis 7 mois', 'Porté il y a 3 jours'],
    ['f', 'portée', 'Pas portée depuis 7 mois', 'Portée il y a 3 jours'],
    ['mp', 'portés', 'Pas portés depuis 7 mois', 'Portés il y a 3 jours'],
    ['fp', 'portées', 'Pas portées depuis 7 mois', 'Portées il y a 3 jours'],
  ]

  it.each(cases)('accorde le participe pour « %s »', (agreement, word, since, ago) => {
    expect(participle(agreement)).toBe(word)
    expect(notWornSince(agreement, 210)).toBe(since)
    expect(wornAgo(agreement, 3)).toBe(ago)
  })

  it('accorde au féminin pluriel les chaussures du prototype', () => {
    const shoes = makeGarment()
    expect(notWornSince(shoes.agreement, 1)).toBe('Pas portées depuis 1 jour')
  })
})

describe('libellés', () => {
  it('nomme chaque catégorie avec le texte exact de la spec', () => {
    expect(CATEGORY_LABELS).toEqual({
      tee: 'T-shirt, top',
      long: 'Chemise, pull, veste',
      pants: 'Pantalon, jean, jupe',
      dress: 'Robe',
      shoes: 'Chaussures',
      outerwear: 'Manteau',
      other: 'Autre',
    })
    expect(Object.keys(CATEGORY_LABELS).sort()).toEqual([...GARMENT_CATEGORIES].sort())
  })

  it('nomme chaque état avec le texte exact de la spec', () => {
    expect(CONDITION_LABELS).toEqual({
      new_with_tag: 'Neuf avec étiquette',
      very_good: 'Très bon état',
      good: 'Bon état',
      fair: 'État satisfaisant',
    })
    expect(Object.keys(CONDITION_LABELS).sort()).toEqual([...ITEM_CONDITIONS].sort())
  })
})

describe('accords', () => {
  it('accorde un participe régulier', () => {
    expect(agree('m', 'donné')).toBe('donné')
    expect(agree('f', 'donné')).toBe('donnée')
    expect(agree('mp', 'vendu')).toBe('vendus')
    expect(agree('fp', 'proposé')).toBe('proposées')
  })

  it('donne le pronom sujet', () => {
    expect(pronoun('m')).toBe('il')
    expect(pronoun('fp')).toBe('elles')
  })
})

describe('pronoms et verbes', () => {
  it('donne le pronom complément', () => {
    expect(objectPronoun('m')).toBe('le')
    expect(objectPronoun('f')).toBe('la')
    expect(objectPronoun('fp')).toBe('les')
  })

  it('accorde le verbe au pluriel', () => {
    expect(verb('f', 'dort', 'dorment')).toBe('dort')
    expect(verb('mp', 'dort', 'dorment')).toBe('dorment')
  })
})

import { describe, expect, it } from 'vitest'
import { buildListingText, cleanPrice } from './listing'

describe('prix sans chiffre', () => {
  it('ignore une saisie faite seulement de séparateurs', () => {
    expect(cleanPrice(',')).toBe('')
    expect(cleanPrice(' . ')).toBe('')
  })
})

describe('buildListingText', () => {
  it('reprend titre, taille, état et prix', () => {
    expect(buildListingText({ title: 'Jean droit', size: 'M', condition: 'very_good', price: '15' })).toBe(
      'Jean droit\nTaille\u00a0: M · Très bon état\nPrix\u00a0: 15\u00a0€',
    )
  })

  it('prix vide : « à fixer »', () => {
    expect(buildListingText({ title: 'Jean droit', size: 'M', condition: 'good', price: '' })).toBe(
      'Jean droit\nTaille\u00a0: M · Bon état\nPrix\u00a0: à fixer',
    )
  })

  it('prix sans chiffre : « à fixer »', () => {
    expect(buildListingText({ title: 'Jean', size: 'M', condition: 'good', price: 'gratuit' })).toContain(
      'Prix\u00a0: à fixer',
    )
  })

  it('prix « 12,50 € abc » : nettoyé en « 12,50 € »', () => {
    expect(cleanPrice('12,50 € abc')).toBe('12,50')
    expect(buildListingText({ title: 'Jean', size: 'M', condition: 'fair', price: '12,50 € abc' })).toBe(
      'Jean\nTaille\u00a0: M · État satisfaisant\nPrix\u00a0: 12,50\u00a0€',
    )
  })

  it('taille vide ou en blanc : « à préciser »', () => {
    expect(buildListingText({ title: 'Robe', size: '', condition: 'new_with_tag', price: '20' })).toBe(
      'Robe\nTaille\u00a0: à préciser · Neuf avec étiquette\nPrix\u00a0: 20\u00a0€',
    )
    expect(buildListingText({ title: 'Robe', size: '   ', condition: 'very_good', price: '' })).toContain(
      'Taille\u00a0: à préciser',
    )
  })
})

import { describe, expect, it } from 'vitest'
import { AGREEMENTS, GARMENT_CATEGORIES, GARMENT_STATUSES } from './types'

describe('types du domaine', () => {
  it('reprend les 7 catégories de docs/02-produit.md', () => {
    expect(GARMENT_CATEGORIES).toEqual(['tee', 'long', 'pants', 'dress', 'shoes', 'outerwear', 'other'])
  })

  it('ne fait pas du lavage un statut', () => {
    expect(GARMENT_STATUSES).not.toContain('laundry')
  })
})

describe('accords', () => {
  it('liste les 4 accords du nom de la pièce', () => {
    expect(AGREEMENTS).toEqual(['m', 'f', 'mp', 'fp'])
  })
})

// Texte d'annonce à copier (listingText() du prototype). Pur : aucun accès à React ni aux données.
import type { ItemCondition } from '../../domain/types'
import { CONDITION_LABELS } from '../../domain/wording'

export interface ListingFields {
  title: string
  size: string
  condition: ItemCondition
  /** Saisie libre : seuls les chiffres, points et virgules sont gardés. */
  price: string
}

/** Garde uniquement chiffres, points et virgules : « 12,50 € abc » → « 12,50 ». Sans chiffre : chaîne vide. */
export function cleanPrice(price: string): string {
  const cleaned = price.replace(/[^0-9.,]/g, '')
  return /\d/.test(cleaned) ? cleaned : ''
}

/** Ex. « Jean droit\nTaille : M · Très bon état\nPrix : 15 € ». */
export function buildListingText(fields: ListingFields): string {
  const size = fields.size.trim()
  const price = cleanPrice(fields.price)
  return [
    fields.title.trim(),
    `Taille\u00a0: ${size || 'à préciser'} · ${CONDITION_LABELS[fields.condition]}`,
    `Prix\u00a0: ${price ? `${price}\u00a0€` : 'à fixer'}`,
  ].join('\n')
}

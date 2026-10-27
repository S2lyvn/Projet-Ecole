// Types métier partagés. Aucune dépendance à React ni à Supabase (voir CLAUDE.md, règle 3).
// Noms alignés sur docs/04-donnees.md (colonnes en snake_case côté base, camelCase ici).

/** Date calendaire au format « AAAA-MM-JJ » (sans heure ni fuseau). Se compare comme une chaîne. */
export type IsoDate = string

/** Horodatage ISO 8601 complet, ex. « 2026-10-27T08:30:00.000Z ». */
export type IsoDateTime = string

export const GARMENT_CATEGORIES = ['tee', 'long', 'pants', 'dress', 'shoes', 'outerwear', 'other'] as const
export type GarmentCategory = (typeof GARMENT_CATEGORIES)[number]

export const GARMENT_STATUSES = ['active', 'donated', 'sold', 'swapped_out', 'archived'] as const
export type GarmentStatus = (typeof GARMENT_STATUSES)[number]

export const GARMENT_SOURCES = ['manual', 'purchase', 'swap'] as const
export type GarmentSource = (typeof GARMENT_SOURCES)[number]

export const WEAR_SOURCES = ['outfit_confirmed', 'manual', 'mirror'] as const
export type WearSource = (typeof WEAR_SOURCES)[number]

export const ITEM_CONDITIONS = ['new_with_tag', 'very_good', 'good', 'fair'] as const
export type ItemCondition = (typeof ITEM_CONDITIONS)[number]

export const LEDGER_REASONS = ['hold', 'release', 'spend', 'earn', 'bonus', 'adjustment'] as const
export type LedgerReason = (typeof LEDGER_REASONS)[number]

/**
 * Accord grammatical du nom de la pièce, pour « Pas porté / portée / portés / portées ».
 * m = masculin singulier, f = féminin singulier, mp = masculin pluriel, fp = féminin pluriel.
 */
export const AGREEMENTS = ['m', 'f', 'mp', 'fp'] as const
export type Agreement = (typeof AGREEMENTS)[number]

export interface Garment {
  id: string
  name: string
  category: GarmentCategory
  /** Couleur d'affichage de la silhouette (hexadécimal), ou null. */
  color: string | null
  size: string | null
  brand: string | null
  /** Chemin dans le bucket privé « garments » ; null tant qu'il n'y a pas de photo. */
  photoPath: string | null
  agreement: Agreement
  source: GarmentSource
  /** Pièce d'origine quand la pièce a été reçue par échange. */
  originGarmentId: string | null
  acquiredAt: IsoDate
  lastWornAt: IsoDate | null
  /** La pièce est au lavage tant que laundryUntil > aujourd'hui. Le lavage n'est pas un statut. */
  laundryUntil: IsoDate | null
  status: GarmentStatus
}

export interface Wear {
  garmentId: string
  wornOn: IsoDate
  source: WearSource
}

export interface LedgerEntry {
  amount: number
  reason: LedgerReason
  swapId: string | null
  createdAt: IsoDateTime
}

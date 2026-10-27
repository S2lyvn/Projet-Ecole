// Types métier partagés. Aucune dépendance à React ni à Supabase (voir CLAUDE.md, règle 3).
// Les règles (lavage, dormance, tenue du jour, crédits) arrivent à l'étape 1.

export const GARMENT_CATEGORIES = ['tee', 'long', 'pants', 'dress', 'shoes', 'outerwear', 'other'] as const
export type GarmentCategory = (typeof GARMENT_CATEGORIES)[number]

export const GARMENT_STATUSES = ['active', 'donated', 'sold', 'swapped_out', 'archived'] as const
export type GarmentStatus = (typeof GARMENT_STATUSES)[number]

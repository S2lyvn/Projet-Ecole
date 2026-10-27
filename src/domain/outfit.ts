// Proposition de tenue du jour : une pièce « orpheline » (la plus oubliée) + des « valeurs sûres ».
// Reprend candidates(), best() et outfit() du prototype (reference/prototype-e-mirror.html).
import type { Garment, GarmentCategory, IsoDate } from './types'
import { isAvailable } from './laundry'
import { daysSinceLastWear } from './dormancy'

export interface Outfit {
  orphan: Garment
  companions: Garment[]
}

export const TOP_CATEGORIES: readonly GarmentCategory[] = ['tee', 'long']
export const BOTTOM_CATEGORIES: readonly GarmentCategory[] = ['pants']

/** Départage stable : nom (ordre français) puis identifiant. */
function compareByNameThenId(a: Garment, b: Garment): number {
  const byName = a.name.localeCompare(b.name, 'fr')
  if (byName !== 0) return byName
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

function availableGarments(garments: readonly Garment[], today: IsoDate): Garment[] {
  return garments.filter((g) => isAvailable(g, today))
}

/** Pièces disponibles hors chaussures, la plus oubliée d'abord. */
export function outfitCandidates(garments: readonly Garment[], today: IsoDate): Garment[] {
  return availableGarments(garments, today)
    .filter((g) => g.category !== 'shoes')
    .map((g) => ({ g, days: daysSinceLastWear(g, today) }))
    .sort((a, b) => b.days - a.days || compareByNameThenId(a.g, b.g))
    .map(({ g }) => g)
}

/** « Valeur sûre » : la pièce la plus récemment portée parmi les catégories données. */
function safeBet(pool: readonly Garment[], categories: readonly GarmentCategory[], today: IsoDate): Garment | null {
  let best: Garment | null = null
  let bestDays = Infinity
  for (const g of pool) {
    if (!categories.includes(g.category)) continue
    const days = daysSinceLastWear(g, today)
    if (best === null || days < bestDays || (days === bestDays && compareByNameThenId(g, best) < 0)) {
      best = g
      bestDays = days
    }
  }
  return best
}

/** Catégories des compléments à ajouter (hors chaussures), dans l'ordre haut puis bas. */
function companionSlots(category: GarmentCategory): (readonly GarmentCategory[])[] {
  switch (category) {
    case 'tee':
    case 'long':
      return [BOTTOM_CATEGORIES]
    case 'pants':
      return [TOP_CATEGORIES]
    // Choix d'équipe : un manteau seul n'est pas une tenue, on l'habille d'un haut et d'un bas.
    case 'outerwear':
    case 'shoes':
      return [TOP_CATEGORIES, BOTTOM_CATEGORIES]
    case 'dress':
    case 'other':
      return []
  }
}

/**
 * Tenue du jour. preferredOrphanId force l'orpheline si elle est disponible
 * (y compris des chaussures, cas « La proposer aujourd'hui » depuis la fiche).
 * Précondition pour ce cas : l'appelant sort d'abord la pièce du lavage (markClean), comme propose()
 * du prototype ; une pièce préférée encore au lavage est ignorée sans message.
 */
export function buildOutfit(
  garments: readonly Garment[],
  today: IsoDate,
  preferredOrphanId: string | null = null,
): Outfit | null {
  const available = availableGarments(garments, today)
  const preferred = preferredOrphanId === null ? undefined : available.find((g) => g.id === preferredOrphanId)
  const orphan = preferred ?? outfitCandidates(garments, today)[0]
  if (!orphan) return null

  const rest = available.filter((g) => g.id !== orphan.id)
  const companions: Garment[] = []
  for (const slot of companionSlots(orphan.category)) {
    const pick = safeBet(rest, slot, today)
    if (pick) companions.push(pick)
  }
  if (orphan.category !== 'shoes') {
    const shoes = safeBet(rest, ['shoes'], today)
    if (shoes) companions.push(shoes)
  }
  return { orphan, companions }
}

/**
 * « Autre proposition » : candidat qui suit l'orpheline affichée (en boucle), comme otherOutfit() du prototype.
 * currentOrphanId est l'orphanId enregistré (null = choix automatique) : l'orpheline affichée est recalculée
 * avec buildOutfit, donc null, un id inconnu ou une pièce au lavage désignent la plus oubliée, et le suivant est
 * le 2e candidat. Des chaussures préférées ne sont pas candidates : on repart du 1er.
 * Renvoie null s'il y a moins de 2 candidats.
 */
export function nextOrphanId(
  garments: readonly Garment[],
  today: IsoDate,
  currentOrphanId: string | null,
): string | null {
  const candidates = outfitCandidates(garments, today)
  if (candidates.length < 2) return null
  const shown = buildOutfit(garments, today, currentOrphanId)
  const index = shown === null ? -1 : candidates.findIndex((g) => g.id === shown.orphan.id)
  return candidates[(index + 1) % candidates.length].id
}

export function outfitGarmentIds(outfit: Outfit): string[] {
  return [outfit.orphan.id, ...outfit.companions.map((g) => g.id)]
}

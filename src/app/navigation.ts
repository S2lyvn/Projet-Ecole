// Repères de navigation partagés : écrans secondaires (sans barre d'onglets) et ordre des onglets.

const SECONDARY_PREFIXES = ['/confirmer', '/achats', '/vendre/', '/echanges/annonce/', '/echanges/proposer/', '/echanges/echange/']

/** Écran secondaire : il s'empile au-dessus des onglets, sans barre d'onglets. */
export function isSecondaryPath(path: string): boolean {
  return SECONDARY_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix))
}

const TAB_ORDER = ['/', '/dressing', '/echanges', '/a-sortir', '/bilan']

/** Position de l'onglet dans la barre (pour le sens du glissement), -1 pour un écran secondaire. */
export function tabPosition(path: string): number {
  return TAB_ORDER.indexOf(path)
}

/**
 * Sens de la transition entre deux écrans : 1 = vers la droite (onglet suivant, écran empilé),
 * -1 = vers la gauche (onglet précédent, retour).
 */
export function transitionDirection(from: string, to: string): 1 | -1 {
  const fromSecondary = isSecondaryPath(from)
  const toSecondary = isSecondaryPath(to)
  if (fromSecondary !== toSecondary) return toSecondary ? 1 : -1
  const a = tabPosition(from)
  const b = tabPosition(to)
  if (a !== -1 && b !== -1) return b >= a ? 1 : -1
  return 1
}

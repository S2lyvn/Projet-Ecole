// Phrase d'aide du panneau de démonstration (renderPanel() du prototype) : ce qu'il y a à faire maintenant.
import type { DailyOutfitStatus } from '../data/repository'
import { plural } from '../domain/wording'

export interface DemoHintInput {
  /** Chemin de l'écran affiché, ex. « / », « /confirmer », « /vendre/g04 ». */
  path: string
  /** Pièces portées hier, en attente de confirmation. */
  pendingCount: number
  outfitStatus: DailyOutfitStatus
  /** Une tenue peut être proposée aujourd'hui (buildOutfit non nul). */
  hasOutfit: boolean
  mirrorMode: boolean
  /** Achats détectés en attente. */
  purchasesCount: number
}

const NBSP = ' '

/** « « texte » » avec espaces insécables. */
function quote(text: string): string {
  return `«${NBSP}${text}${NBSP}»`
}

export function demoHint({ path, pendingCount, outfitStatus, hasOutfit, mirrorMode, purchasesCount }: DemoHintInput): string {
  // Écrans secondaires : la consigne de l'écran affiché.
  if (path === '/confirmer') return `Coche ce que tu as porté, puis touche ${quote('C’est bon')}.`
  if (path === '/achats') return 'Ajoute ou ignore les achats détectés.'
  if (path.startsWith('/vendre/')) return 'Remplis l’annonce, copie-la, puis marque la pièce comme vendue.'

  // La bannière et la tenue sont sur Aujourd'hui : on y renvoie depuis les autres onglets.
  const onToday = path === '/'
  if (pendingCount > 0) {
    const banner = quote(`Hier${NBSP}: ${pendingCount} ${plural(pendingCount, 'pièce', 'pièces')} à confirmer`)
    return onToday ? `Ouvre la bannière ${banner}.` : `Dans Aujourd’hui, ouvre la bannière ${banner}.`
  }
  if (outfitStatus === 'proposed' && hasOutfit) {
    const action = quote('Je porte cette tenue')
    return onToday ? `Valide la tenue du jour avec ${action}.` : `Dans Aujourd’hui, valide la tenue du jour avec ${action}.`
  }
  if (outfitStatus === 'validated') {
    return mirrorMode
      ? `Touche ${quote('Avancer d’un jour')}${NBSP}: le miroir enregistrera la tenue sans rien te demander.`
      : `Touche ${quote('Avancer d’un jour')} pour voir le stock se mettre à jour.`
  }
  // Ajout au prototype : les achats détectés attendent dans Dressing.
  if (purchasesCount > 0) {
    const banner = quote(`${purchasesCount} ${plural(purchasesCount, 'achat détecté', 'achats détectés')}, à confirmer`)
    return path === '/dressing' ? `Ouvre la bannière ${banner}.` : `Dans Dressing, ouvre la bannière ${banner}.`
  }
  return 'Explore le dressing, À sortir et le Bilan, ou avance d’un jour.'
}

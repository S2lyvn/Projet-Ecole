import { describe, expect, it } from 'vitest'
import { demoHint } from './hint'
import type { DemoHintInput } from './hint'

const base: DemoHintInput = {
  path: '/looks',
  pendingCount: 0,
  outfitStatus: 'proposed',
  hasOutfit: true,
  mirrorMode: false,
  purchasesCount: 0,
}

const hint = (patch: Partial<DemoHintInput>) => demoHint({ ...base, ...patch })

describe('demoHint', () => {
  it('écrans secondaires : consigne de l’écran, avant tout le reste', () => {
    const busy = { pendingCount: 3, outfitStatus: 'validated' as const, purchasesCount: 2 }
    expect(hint({ ...busy, path: '/confirmer' })).toBe('Coche ce que tu as porté, puis touche « C’est bon ».')
    expect(hint({ ...busy, path: '/achats' })).toBe('Ajoute ou ignore les achats détectés.')
    expect(hint({ ...busy, path: '/vendre/g04' })).toBe('Remplis l’annonce, copie-la, puis marque la pièce comme vendue.')
  })

  it('pièces à confirmer : renvoie vers la bannière, accordée au nombre', () => {
    expect(hint({ pendingCount: 3 })).toBe('Ouvre la bannière « Hier : 3 pièces à confirmer ».')
    expect(hint({ pendingCount: 1 })).toBe('Ouvre la bannière « Hier : 1 pièce à confirmer ».')
    expect(hint({ pendingCount: 2, path: '/armoire' })).toBe(
      'Dans Looks, ouvre la bannière « Hier : 2 pièces à confirmer ».',
    )
  })

  it('tenue proposée : la valider', () => {
    expect(hint({})).toBe('Valide la tenue du jour avec « Je porte cette tenue ».')
    expect(hint({ path: '/armoire' })).toBe('Dans Looks, valide la tenue du jour avec « Je porte cette tenue ».')
  })

  it('tenue validée : avancer d’un jour, selon le mode miroir', () => {
    expect(hint({ outfitStatus: 'validated' })).toBe(
      'Touche « Avancer d’un jour » pour voir le stock se mettre à jour.',
    )
    expect(hint({ outfitStatus: 'validated', mirrorMode: true })).toBe(
      'Touche « Avancer d’un jour » : le miroir enregistrera la tenue sans rien te demander.',
    )
  })

  it('achats détectés en attente : renvoie vers Armoire', () => {
    expect(hint({ outfitStatus: 'dismissed', purchasesCount: 3 })).toBe(
      'Dans Armoire, ouvre la bannière « 3 achats détectés, à confirmer ».',
    )
    expect(hint({ hasOutfit: false, purchasesCount: 1, path: '/armoire' })).toBe(
      'Ouvre la bannière « 1 achat détecté, à confirmer ».',
    )
  })

  it('sinon : explorer ou avancer', () => {
    const explore = 'Explore la carte, les échanges et ton armoire, ou avance d’un jour.'
    expect(hint({ outfitStatus: 'dismissed' })).toBe(explore)
    expect(hint({ hasOutfit: false })).toBe(explore)
  })
})

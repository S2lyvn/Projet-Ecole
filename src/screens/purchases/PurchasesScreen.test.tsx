// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../test/renderApp'

async function openScreen() {
  const app = renderApp('/achats')
  await screen.findByRole('heading', { level: 1, name: 'Achats détectés' })
  return app
}

describe('Achats détectés', () => {
  it('liste les 3 achats d’exemple avec leur source et leur ancienneté', async () => {
    await openScreen()
    expect(screen.getByRole('heading', { level: 2, name: 'À ajouter · 3' })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(3)
    expect(screen.getByText('E-mail de confirmation · il y a 2 jours')).toBeInTheDocument()
    expect(screen.getByText('Ticket de caisse · il y a 6 jours')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tout ajouter (3)' })).toBeInTheDocument()
    // Données d'exemple signalées comme telles (CLAUDE.md règle 6).
    expect(screen.getByText(/simulés pour la démo/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retour au dressing' })).toBeInTheDocument()
  })

  it('« Gérer » affiche les sources en exemple', async () => {
    const { user } = await openScreen()
    await user.click(screen.getByRole('button', { name: 'Gérer' }))
    // Le matcher normalise les espaces : on vérifie à part l’espace insécable avant « : ».
    const toast = await screen.findByText('Sources : e-mails et tickets de caisse (exemple).')
    expect(toast.textContent).toContain('\u00a0:')
  })

  it('Ajouter met la pièce au dressing (source purchase) et passe le focus à l’achat suivant', async () => {
    const { user, repository } = await openScreen()
    await user.click(screen.getByRole('button', { name: 'Ajouter Robe chemise bleu nuit' }))

    expect(await screen.findByText('Robe chemise bleu nuit : ajoutée au dressing.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'À ajouter · 2' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Robe chemise bleu nuit' })).not.toBeInTheDocument()

    const added = (await repository.listGarments()).find((g) => g.name === 'Robe chemise bleu nuit')
    expect(added).toMatchObject({ source: 'purchase', status: 'active', category: 'dress', agreement: 'f' })
    expect(added?.acquiredAt).toBe('2026-10-21')

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Ajouter Pantalon large en lin' })).toHaveFocus(),
    )
  })

  it('Ignorer retire l’achat sans l’ajouter au dressing', async () => {
    const { user, repository } = await openScreen()
    await user.click(screen.getByRole('button', { name: 'Ignorer Pull col rond en laine' }))

    expect(await screen.findByText('Pull col rond en laine : ignoré.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'À ajouter · 2' })).toBeInTheDocument()
    expect((await repository.listGarments()).some((g) => g.name === 'Pull col rond en laine')).toBe(false)
    expect(await repository.listPurchaseCandidates()).toHaveLength(2)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Ajouter Robe chemise bleu nuit' })).toHaveFocus())
  })

  it('Tout ajouter ajoute les 3 pièces et revient au dressing', async () => {
    const { user, repository } = await openScreen()
    await user.click(screen.getByRole('button', { name: 'Tout ajouter (3)' }))

    expect(await screen.findByText('3 pièces ajoutées au dressing.')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByRole('heading', { level: 1, name: 'Achats détectés' })).not.toBeInTheDocument(),
    )
    const fromPurchases = (await repository.listGarments()).filter((g) => g.source === 'purchase')
    expect(fromPurchases).toHaveLength(3)
    expect(await repository.listPurchaseCandidates()).toHaveLength(0)
  })

  it('affiche « Rien à confirmer » une fois tout traité, focus sur le titre', async () => {
    const { user } = await openScreen()
    await user.click(screen.getByRole('button', { name: 'Ignorer Pull col rond en laine' }))
    await user.click(await screen.findByRole('button', { name: 'Ignorer Robe chemise bleu nuit' }))
    await user.click(await screen.findByRole('button', { name: 'Ajouter Pantalon large en lin' }))

    expect(await screen.findByRole('heading', { level: 2, name: 'Rien à confirmer' })).toBeInTheDocument()
    expect(screen.getByText('Les prochains achats arriveront ici.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Tout ajouter/ })).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Achats détectés' })).toHaveFocus())

    // Deux boutons de retour : l'icône de l'en-tête et le bouton du bas.
    const backButtons = screen.getAllByRole('button', { name: 'Retour au dressing' })
    expect(backButtons).toHaveLength(2)
    await user.click(backButtons[1])
    await waitFor(() =>
      expect(screen.queryByRole('heading', { level: 1, name: 'Achats détectés' })).not.toBeInTheDocument(),
    )
  })
})

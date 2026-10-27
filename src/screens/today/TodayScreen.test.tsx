// @vitest-environment jsdom
import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { WardrobeRepository } from '../../data/repository'
import { renderApp } from '../../test/renderApp'

/** Pièces actives hors chaussures (les seules qui peuvent être orphelines). */
async function clothesIds(repository: WardrobeRepository) {
  const garments = await repository.listGarments()
  return garments.filter((g) => g.status === 'active' && g.category !== 'shoes').map((g) => g.id)
}

async function outfitCard() {
  return screen.findByRole('region', { name: 'Tenue proposée' })
}

describe('écran Aujourd’hui', () => {
  it('affiche la date simulée, l’orpheline la plus oubliée et sa valeur sûre', async () => {
    renderApp('/')
    expect(await screen.findByRole('heading', { level: 1, name: 'Tenue du jour' })).toBeInTheDocument()
    // La date apparaît aussi dans le panneau démo : on la cherche dans l'écran seulement.
    expect(within(screen.getByRole('main')).getByText('Mardi 27 octobre')).toBeInTheDocument()

    const card = await outfitCard()
    expect(within(card).getByRole('heading', { level: 2, name: 'Robe grise en maille' })).toBeInTheDocument()
    expect(within(card).getByText('Pas portée depuis 14 mois')).toBeInTheDocument()
    // Robe : pas de haut ni de bas, seulement les chaussures les plus récemment portées.
    const safeBets = within(card).getByRole('list', { name: 'Valeurs sûres' })
    expect(within(safeBets).getByText('Baskets blanches')).toBeInTheDocument()
    expect(within(safeBets).getByText('Portées il y a 5 jours')).toBeInTheDocument()
  })

  it('affiche la bannière des pièces portées hier', async () => {
    renderApp('/')
    const banner = await screen.findByRole('link', { name: /Hier\s: 3 pièces à confirmer/ })
    expect(banner).toHaveAttribute('href', '/confirmer')
  })

  it('compte seulement les pièces encore actives dans la bannière', async () => {
    const { user, repository } = renderApp('/')
    await screen.findByRole('link', { name: /Hier\s: 3 pièces/ })
    await repository.setGarmentStatus('g02', 'donated')
    // Une action de l'écran recharge les données.
    await user.click(screen.getByRole('button', { name: 'Pas aujourd’hui' }))
    expect(await screen.findByRole('link', { name: /Hier\s: 2 pièces à confirmer/ })).toBeInTheDocument()
  })

  it('valide la tenue, puis annule la validation', async () => {
    const { user, repository } = renderApp('/')
    await user.click(await screen.findByRole('button', { name: 'Je porte cette tenue' }))

    const change = await screen.findByRole('button', { name: 'Changer de tenue' })
    expect(screen.getByText('Tenue validée')).toBeInTheDocument()
    expect(screen.getByText('Tenue validée.')).toBeInTheDocument()
    expect(screen.getByText('Demain matin, tu confirmeras ces pièces d’un geste.')).toBeInTheDocument()
    expect(change).toHaveFocus()
    expect((await repository.getDailyOutfit()).status).toBe('validated')

    await user.click(change)
    const validate = await screen.findByRole('button', { name: 'Je porte cette tenue' })
    expect(validate).toHaveFocus()
    expect((await repository.getDailyOutfit()).status).toBe('proposed')
  })

  it('annonce le miroir quand le mode miroir est actif', async () => {
    const { user, repository } = renderApp('/')
    const validate = await screen.findByRole('button', { name: 'Je porte cette tenue' })
    // La validation recharge toutes les données, réglages compris.
    await repository.updateSettings({ mirrorMode: true })
    await user.click(validate)
    expect(await screen.findByText(/Le miroir détectera la tenue demain\s: rien à confirmer\./)).toBeInTheDocument()
  })

  it('« Autre proposition » passe à l’orpheline suivante', async () => {
    const { user, repository } = renderApp('/')
    await outfitCard()
    const other = screen.getByRole('button', { name: 'Autre proposition' })
    await user.click(other)

    const card = await outfitCard()
    expect(await within(card).findByRole('heading', { level: 2, name: 'Pull col rond gris' })).toBeInTheDocument()
    expect(within(card).queryByText('Robe grise en maille')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Autre proposition' })).toHaveFocus()
    expect((await repository.getDailyOutfit()).orphanId).toBe('g10')
    // Le changement est annoncé sans déplacer le focus.
    expect(screen.getByText(/^Nouvelle proposition\s: Pull col rond gris\.$/)).toBeInTheDocument()
  })

  it('« Autre proposition » prévient quand il n’y a qu’une seule orpheline possible', async () => {
    const { user, repository } = renderApp('/')
    await outfitCard()
    for (const id of await clothesIds(repository)) if (id !== 'g17') await repository.washGarment(id)
    // Aller-retour par « Pas aujourd’hui » pour recharger les données.
    await user.click(screen.getByRole('button', { name: 'Pas aujourd’hui' }))
    await user.click(await screen.findByRole('button', { name: 'Revoir la proposition' }))

    await user.click(await screen.findByRole('button', { name: 'Autre proposition' }))
    expect(await screen.findByText('Aucune autre proposition pour le moment.')).toBeInTheDocument()
    expect(within(await outfitCard()).getByRole('heading', { level: 2, name: 'Robe grise en maille' })).toBeInTheDocument()
    expect((await repository.getDailyOutfit()).orphanId).toBeNull()
  })

  it('« Pas aujourd’hui » met la tenue de côté, puis on peut la revoir', async () => {
    const { user, repository } = renderApp('/')
    await user.click(await screen.findByRole('button', { name: 'Pas aujourd’hui' }))

    expect(await screen.findByRole('heading', { level: 2, name: 'Pas de tenue aujourd’hui' })).toBeInTheDocument()
    const back = screen.getByRole('button', { name: 'Revoir la proposition' })
    expect(back).toHaveFocus()
    expect(screen.queryByRole('region', { name: 'Tenue proposée' })).not.toBeInTheDocument()
    expect((await repository.getDailyOutfit()).status).toBe('dismissed')

    await user.click(back)
    expect(await screen.findByRole('button', { name: 'Je porte cette tenue' })).toHaveFocus()
    expect(within(await outfitCard()).getByText('Robe grise en maille')).toBeInTheDocument()
  })

  it('affiche « Rien à proposer » quand tous les vêtements sont au lavage, même si les chaussures sont propres', async () => {
    const { user, repository } = renderApp('/')
    await outfitCard()
    for (const id of await clothesIds(repository)) await repository.washGarment(id)
    await user.click(screen.getByRole('button', { name: 'Pas aujourd’hui' }))

    expect(await screen.findByRole('heading', { level: 2, name: 'Rien à proposer' })).toBeInTheDocument()
    expect(screen.getByText('Toutes tes pièces sont au lavage. Remets-en une en jeu depuis le dressing.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ouvrir le dressing' })).toHaveAttribute('href', '/dressing')
  })

  it('invite à ajouter des vêtements quand il ne reste que des chaussures', async () => {
    const { user, repository } = renderApp('/')
    await outfitCard()
    for (const id of await clothesIds(repository)) await repository.setGarmentStatus(id, 'donated')
    await user.click(screen.getByRole('button', { name: 'Pas aujourd’hui' }))

    expect(await screen.findByRole('heading', { level: 2, name: 'Rien à proposer' })).toBeInTheDocument()
    expect(screen.getByText('Ajoute au moins un vêtement, pas seulement des chaussures, depuis le dressing.')).toBeInTheDocument()
  })

  it('accorde la bannière au singulier', async () => {
    const { user, repository } = renderApp('/')
    await screen.findByRole('link', { name: /Hier\s: 3 pièces/ })
    await repository.setGarmentStatus('g02', 'donated')
    await repository.setGarmentStatus('g06', 'donated')
    await user.click(screen.getByRole('button', { name: 'Pas aujourd’hui' }))
    expect(await screen.findByRole('link', { name: /Hier\s: 1 pièce à confirmer/ })).toBeInTheDocument()
  })
})

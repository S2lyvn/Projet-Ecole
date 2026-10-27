// @vitest-environment jsdom
import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../test/renderApp'

// Données d'exemple au 2026-10-27 : pièces non portées depuis au moins 180 jours
// g17 Robe grise en maille (410), g10 Pull col rond gris (335), g08 T-shirt sable (270), g01 Chemise en lin (214).
const DORMANT_6_MONTHS = ['Robe grise en maille', 'Pull col rond gris', 'T-shirt sable', 'Chemise en lin vert sauge']
// À 90 jours s'ajoutent : Robe portefeuille bordeaux (150), Veste en jean (120), Bottines brunes (95).
const DORMANT_3_MONTHS = 7

function card(name: string): HTMLElement {
  return screen.getByRole('article', { name })
}

function cardNames(): string[] {
  return screen.getAllByRole('article').map((a) => within(a).getByRole('heading', { level: 2 }).textContent ?? '')
}

describe('À sortir', () => {
  it('liste les pièces qui dorment depuis 6 mois, la plus ancienne d’abord', async () => {
    renderApp('/a-sortir')
    expect(await screen.findByRole('heading', { level: 1, name: 'À sortir' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '6 mois' })).toHaveAttribute('aria-pressed', 'true')
    expect(cardNames()).toEqual(DORMANT_6_MONTHS)
    expect(within(card('Robe grise en maille')).getByText(/Pas portée depuis 14 mois/)).toBeInTheDocument()
    expect(within(card('Pull col rond gris')).getByText('Pas porté depuis 11 mois')).toBeInTheDocument()
    // La plus oubliée est l'orpheline proposée par défaut.
    expect(within(card('Robe grise en maille')).getByText(/· proposée aujourd’hui/)).toBeInTheDocument()
    expect(within(card('T-shirt sable')).getByRole('button', { name: /Échanger/ })).toHaveAttribute('aria-disabled', 'true')
  })

  it('change le seuil de dormance et l’enregistre', async () => {
    const { user, repository } = renderApp('/a-sortir')
    await screen.findByRole('heading', { level: 1, name: 'À sortir' })

    await user.click(screen.getByRole('button', { name: '3 mois' }))
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(DORMANT_3_MONTHS))
    expect(screen.getByRole('button', { name: '3 mois' })).toHaveAttribute('aria-pressed', 'true')
    expect((await repository.getSettings()).dormancyDays).toBe(90)

    await user.click(screen.getByRole('button', { name: '12 mois' }))
    await waitFor(() => expect(cardNames()).toEqual(['Robe grise en maille']))
    expect((await repository.getSettings()).dormancyDays).toBe(365)
  })

  it('Donner retire la pièce de la liste, avec Annuler', async () => {
    const { user, repository } = renderApp('/a-sortir')
    await screen.findByRole('heading', { level: 1, name: 'À sortir' })

    await user.click(within(card('Pull col rond gris')).getByRole('button', { name: 'Donner' }))
    await waitFor(() => expect(cardNames()).not.toContain('Pull col rond gris'))
    expect(cardNames()).toHaveLength(3)
    expect(screen.getByText('Pull col rond gris : donné. Il quitte ton dressing.')).toBeInTheDocument()
    expect((await repository.getGarment('g10'))?.status).toBe('donated')
    // Le focus passe à la carte suivante.
    expect(within(card('T-shirt sable')).getByRole('button', { name: 'Remettre en jeu' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    await waitFor(() => expect(cardNames()).toEqual(DORMANT_6_MONTHS))
  })

  it('affiche « Rien à sortir » quand plus aucune pièce ne dort', async () => {
    const { user } = renderApp('/a-sortir')
    await screen.findByRole('heading', { level: 1, name: 'À sortir' })
    await user.click(screen.getByRole('button', { name: '12 mois' }))
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1))

    await user.click(within(card('Robe grise en maille')).getByRole('button', { name: 'Donner' }))
    expect(await screen.findByRole('heading', { level: 2, name: 'Rien à sortir' })).toBeInTheDocument()
    expect(
      screen.getByText('Aucune pièce ne dort depuis plus de 12 mois. Choisis un seuil plus court pour voir les suivantes.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'À sortir' })).toHaveFocus()
  })

  it('Remettre en jeu ramène sur Aujourd’hui avec cette pièce en orpheline', async () => {
    const { user, repository } = renderApp('/a-sortir')
    await screen.findByRole('heading', { level: 1, name: 'À sortir' })

    await user.click(within(card('T-shirt sable')).getByRole('button', { name: 'Remettre en jeu' }))
    await waitFor(() => expect(screen.queryByRole('heading', { level: 1, name: 'À sortir' })).not.toBeInTheDocument())
    expect(await screen.findByText('T-shirt sable : proposé dans la tenue du jour.')).toBeInTheDocument()
    const outfit = await repository.getDailyOutfit()
    expect(outfit.orphanId).toBe('g08')
    expect(outfit.status).toBe('proposed')
  })

  it('Vendre ouvre l’annonce de la pièce', async () => {
    const { user } = renderApp('/a-sortir')
    await screen.findByRole('heading', { level: 1, name: 'À sortir' })
    await user.click(within(card('T-shirt sable')).getByRole('button', { name: 'Vendre' }))
    await waitFor(() => expect(screen.queryByRole('heading', { level: 1, name: 'À sortir' })).not.toBeInTheDocument())
  })
})

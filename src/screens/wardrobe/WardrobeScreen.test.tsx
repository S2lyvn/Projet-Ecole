// @vitest-environment jsdom
import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../test/renderApp'

async function pieceButtons() {
  const list = await screen.findByRole('list')
  return within(list).getAllByRole('button')
}

describe('Armoire', () => {
  it('affiche les 17 pièces et la bannière des achats', async () => {
    renderApp('/armoire')
    expect(await screen.findByRole('heading', { level: 1, name: 'Armoire' })).toBeInTheDocument()
    expect(await pieceButtons()).toHaveLength(17)
    const banner = screen.getByRole('link', { name: '3 achats détectés, à confirmer' })
    expect(banner).toHaveAttribute('href', '/achats')
  })

  it('filtre les pièces au lavage', async () => {
    const { user } = renderApp('/armoire')
    await pieceButtons()
    await user.click(screen.getByRole('button', { name: 'Au lavage' }))
    expect(screen.getByRole('button', { name: 'Au lavage' })).toHaveAttribute('aria-pressed', 'true')
    const buttons = await pieceButtons()
    expect(buttons).toHaveLength(1)
    expect(buttons[0]).toHaveAccessibleName('Pull en laine brique, au lavage jusqu’à mercredi')

    await user.click(screen.getByRole('button', { name: 'Disponible' }))
    expect(await pieceButtons()).toHaveLength(16)
  })

  it('met une pièce au lavage depuis sa feuille, puis rend le focus à la pièce', async () => {
    const { user } = renderApp('/armoire')
    await pieceButtons()
    const piece = screen.getByRole('button', { name: 'T-shirt blanc, disponible' })
    await user.click(piece)
    const sheet = await screen.findByRole('dialog', { name: 'T-shirt blanc' })
    expect(within(sheet).getByText(/Disponible · porté il y a 11 jours/)).toBeInTheDocument()
    expect(within(sheet).getByRole('button', { name: 'Donner à la communauté' })).toBeEnabled()
    expect(within(sheet).getByRole('button', { name: 'Le proposer aujourd’hui' })).toBeInTheDocument()

    await user.click(within(sheet).getByRole('button', { name: 'Mettre au lavage' }))
    const washed = await screen.findByRole('button', { name: 'T-shirt blanc, au lavage jusqu’à vendredi' })
    expect(within(washed).getByText('Lavage · ven.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(washed).toHaveFocus())
  })

  it('ferme la feuille sans action et rend le focus à la pièce', async () => {
    const { user } = renderApp('/armoire')
    await pieceButtons()
    const piece = screen.getByRole('button', { name: 'Pull en laine brique, au lavage jusqu’à mercredi' })
    await user.click(piece)
    const sheet = await screen.findByRole('dialog', { name: 'Pull en laine brique' })
    expect(within(sheet).getByRole('button', { name: 'Déjà propre' })).toBeInTheDocument()
    expect(within(sheet).queryByRole('button', { name: 'Mettre au lavage' })).not.toBeInTheDocument()
    await user.click(within(sheet).getByRole('button', { name: 'Fermer' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(piece).toHaveFocus())
  })

  it('donne une pièce, puis Annuler la remet', async () => {
    const { user } = renderApp('/armoire')
    await pieceButtons()
    await user.click(screen.getByRole('button', { name: /^Robe midi noire,/ }))
    const sheet = await screen.findByRole('dialog', { name: 'Robe midi noire' })
    await user.click(within(sheet).getByRole('button', { name: 'Donner' }))

    await waitFor(() => expect(screen.queryByRole('button', { name: /^Robe midi noire,/ })).not.toBeInTheDocument())
    expect(await pieceButtons()).toHaveLength(16)
    expect(screen.getByText('Robe midi noire : donnée. Elle quitte ton dressing.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(await screen.findByRole('button', { name: /^Robe midi noire,/ })).toBeInTheDocument()
    expect(await pieceButtons()).toHaveLength(17)
  })

  it('« Elles dorment » liste les pièces dormantes, avec un seuil modifiable', async () => {
    const { user } = renderApp('/armoire?filtre=dort')
    await screen.findByRole('heading', { level: 1, name: 'Armoire' })
    expect(screen.getByRole('button', { name: 'Elles dorment' })).toHaveAttribute('aria-pressed', 'true')
    // Seuil de 6 mois : chemise, T-shirt sable, pull gris, robe grise.
    expect(await pieceButtons()).toHaveLength(4)

    const threshold = screen.getByRole('group', { name: 'Elles dorment depuis' })
    await user.click(within(threshold).getByRole('button', { name: '3 mois' }))
    await waitFor(async () => expect(await pieceButtons()).toHaveLength(7))
  })

  it('une pièce qui dort se donne à la communauté depuis sa feuille', async () => {
    const { user } = renderApp('/armoire?filtre=dort')
    await pieceButtons()
    await user.click(screen.getByRole('button', { name: /^Robe grise en maille,/ }))
    const sheet = await screen.findByRole('dialog', { name: 'Robe grise en maille' })
    await user.click(within(sheet).getByRole('button', { name: 'Donner à la communauté' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Proposer à l’échange' })).toBeInTheDocument()
  })

  it('résume la part de l’armoire portée, sur 3 ou 12 mois', async () => {
    const { user } = renderApp('/armoire')
    await pieceButtons()
    const summary = screen.getByRole('region', { name: 'Part de l’armoire portée' })
    expect(within(summary).getByRole('img', { name: '10 pièces portées sur 17 ces 3 derniers mois' })).toBeInTheDocument()
    expect(summary).toHaveTextContent('59')

    await user.click(within(within(summary).getByRole('group', { name: 'Période' })).getByRole('button', { name: '12 mois' }))
    expect(await within(summary).findByRole('img', { name: '16 pièces portées sur 17 ces 12 derniers mois' })).toBeInTheDocument()
  })
})

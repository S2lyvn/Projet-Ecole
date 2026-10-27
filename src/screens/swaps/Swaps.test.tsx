// @vitest-environment jsdom
import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { balanceOf } from '../../domain/credits'
import { renderApp } from '../../test/renderApp'

describe('bourse d’échange simulée', () => {
  it('affiche le solde et les annonces à ma taille', async () => {
    const { user } = renderApp('/echanges')
    expect(await screen.findByRole('heading', { level: 1, name: 'Échanges' })).toBeInTheDocument()
    expect(screen.getByText('Mes crédits').parentElement).toHaveTextContent('2')
    const market = screen.getByRole('list', { name: 'Annonces de la bourse' })
    expect(within(market).getByText('Pull marin rayé')).toBeInTheDocument()
    // Doudoune en L : masquée par le filtre « À ma taille » (haut M).
    expect(within(market).queryByText('Doudoune légère kaki')).not.toBeInTheDocument()

    await user.click(screen.getByRole('switch', { name: /À ma taille/ }))
    expect(await screen.findByText('Doudoune légère kaki')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Chaussures' }))
    await waitFor(() => expect(screen.queryByText('Pull marin rayé')).not.toBeInTheDocument())
    expect(screen.getByText('Baskets en toile écrue')).toBeInTheDocument()
  })

  it('réserver, fixer le rendez-vous, scanner : la pièce arrive dans le dressing', async () => {
    const { user, repository } = renderApp('/echanges/annonce/l1')
    await user.click(await screen.findByRole('button', { name: /Je le veux · 2 crédits/ }))

    expect(await screen.findByRole('heading', { name: 'Fixer le rendez-vous' })).toBeInTheDocument()
    expect(balanceOf((await repository.getSwapState()).ledger)).toBe(0)
    await user.click(screen.getByRole('button', { name: 'Proposer ce rendez-vous' }))

    await user.click(await screen.findByRole('button', { name: /Scanner le code d’Inès/ }))
    expect(await screen.findByRole('heading', { name: 'Remise faite' })).toBeInTheDocument()
    const received = (await repository.listGarments()).find((g) => g.name === 'Pull marin rayé')
    expect(received).toMatchObject({ source: 'swap', size: 'M', status: 'active' })

    await user.click(screen.getByRole('button', { name: '5 sur 5' }))
    expect(await screen.findByText('Merci pour ton avis !')).toBeInTheDocument()
  })

  it('explique pourquoi on ne peut pas réserver sans assez de crédits', async () => {
    renderApp('/echanges/annonce/l4')
    expect(await screen.findByText(/Il te manque des crédits/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Je la veux · 3 crédits/ })).toHaveAttribute('aria-disabled', 'true')
  })

  it('le membre répond dans la messagerie', async () => {
    const { user } = renderApp('/echanges/annonce/l6')
    await user.click(await screen.findByRole('button', { name: /Je le veux/ }))
    await user.type(await screen.findByLabelText('Écrire à Inès'), 'Bonjour, ça te va demain ?')
    await user.click(screen.getByRole('button', { name: 'Envoyer' }))
    expect(await screen.findByText('Bonjour, ça te va demain ?')).toBeInTheDocument()
    expect(await screen.findByText('Parfait, ça me va !')).toBeInTheDocument()
  })

  it('proposer une pièce : règles, engagements, puis annonce en ligne', async () => {
    const { user, repository } = renderApp('/echanges/proposer/g10')
    expect(await screen.findByRole('heading', { name: 'Les règles de la communauté' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'J’accepte' }))

    const publish = await screen.findByRole('button', { name: 'Mettre dans la bourse' })
    expect(publish).toBeDisabled()
    await user.click(screen.getByLabelText('La pièce est propre'))
    await user.click(screen.getByLabelText('J’ai signalé les défauts'))
    await user.click(publish)

    expect(await screen.findByRole('list', { name: 'Mes annonces' })).toHaveTextContent('Pull col rond gris')
    const listing = (await repository.getSwapState()).listings.find((l) => l.garmentId === 'g10')
    expect(listing).toMatchObject({ status: 'open', credits: 2 })
  })

  it('le bouton Échanger d’À sortir ouvre le formulaire prérempli', async () => {
    const { user } = renderApp('/a-sortir')
    const list = await screen.findByRole('list', { name: 'Pièces à sortir' })
    const card = within(list).getAllByRole('article')[0]
    await user.click(within(card).getByRole('button', { name: /Échanger/ }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Proposer à l’échange' })).toBeInTheDocument()
  })
})

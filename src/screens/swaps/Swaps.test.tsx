// @vitest-environment jsdom
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { balanceOf, heldTokens } from '../../domain/tokens'
import { AppRoutes } from '../../App'
import { WardrobeProvider } from '../../app/WardrobeProvider'
import { ToastProvider } from '../../components/Toast'
import { createLocalRepository } from '../../data/local'
import { TEST_TODAY, renderApp } from '../../test/renderApp'

describe('bourse d’échange simulée', () => {
  it('affiche les jetons, la règle et les annonces à ma taille', async () => {
    const { user } = renderApp('/echanges')
    expect(await screen.findByRole('heading', { level: 1, name: 'Échanges' })).toBeInTheDocument()
    expect(screen.getByText('Mes jetons').parentElement).toHaveTextContent('1')
    expect(screen.getByText(/1 habit donné = 1 jeton = 1 habit à réclamer/)).toBeInTheDocument()
    const market = screen.getByRole('list', { name: 'Annonces de la bourse' })
    expect(within(market).getByText('Pull marin rayé')).toBeInTheDocument()
    // Doudoune en L : masquée par le filtre « À ma taille » (haut M).
    expect(within(market).queryByText('Doudoune légère kaki')).not.toBeInTheDocument()

    await user.click(screen.getByRole('switch', { name: /À ma taille/ }))
    await user.click(screen.getByRole('button', { name: 'Toute la ville' }))
    expect(await screen.findByText('Doudoune légère kaki')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Chaussures' }))
    await waitFor(() => expect(screen.queryByText('Pull marin rayé')).not.toBeInTheDocument())
    expect(screen.getByText('Baskets en toile écrue')).toBeInTheDocument()
  })

  it('filtre par distance autour de mon quartier, les plus proches d’abord', async () => {
    const { user, repository } = renderApp('/echanges')
    await user.click(await screen.findByRole('switch', { name: /À ma taille/ }))
    const market = () => screen.getByRole('list', { name: 'Annonces de la bourse' })
    // Saint-Jacques, 3 km par défaut : Sarah (même quartier) en premier, Chloé (Chamalières, ~3,5 km) masquée.
    expect(within(market()).getAllByRole('link')[0]).toHaveTextContent('Ton quartier')
    expect(within(market()).queryByText('Baskets en toile écrue')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '1 km' }))
    await waitFor(() => expect(within(market()).queryByText('Pull marin rayé')).not.toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: '5 km' }))
    expect(await within(market()).findByText('Baskets en toile écrue')).toBeInTheDocument()

    await user.selectOptions(screen.getByRole('combobox', { name: 'Mon quartier' }), 'Chamalières')
    await waitFor(async () => expect((await repository.getSwapState()).neighborhood).toBe('Chamalières'))
    expect(await within(market()).findByText('Baskets en toile écrue')).toBeInTheDocument()
  })

  it('réclamer, fixer le rendez-vous, scanner : la pièce arrive dans le dressing', async () => {
    const { user, repository } = renderApp('/echanges/annonce/l1')
    await user.click(await screen.findByRole('button', { name: 'Réclamer cette pièce · 1 jeton' }))

    expect(await screen.findByRole('heading', { name: 'Fixer le rendez-vous' })).toBeInTheDocument()
    const { ledger } = await repository.getSwapState()
    expect(balanceOf(ledger)).toBe(0)
    expect(heldTokens(ledger)).toBe(1)
    await user.click(screen.getByRole('button', { name: 'Proposer ce rendez-vous' }))

    await user.click(await screen.findByRole('button', { name: /Scanner le code d’Inès/ }))
    expect(await screen.findByRole('heading', { name: 'Remise faite' })).toBeInTheDocument()
    const received = (await repository.listGarments()).find((g) => g.name === 'Pull marin rayé')
    expect(received).toMatchObject({ source: 'swap', size: 'M', status: 'active' })

    await user.click(screen.getByRole('button', { name: '5 sur 5' }))
    expect(await screen.findByText('Merci pour ton avis !')).toBeInTheDocument()
  })

  it('sans jeton disponible, explique comment en gagner un', async () => {
    const { user } = renderApp('/echanges/annonce/l1')
    await user.click(await screen.findByRole('button', { name: 'Réclamer cette pièce · 1 jeton' }))
    await screen.findByRole('heading', { name: 'Fixer le rendez-vous' })
    // Le seul jeton est bloqué : une deuxième réclamation est refusée.
    await user.click(screen.getByRole('button', { name: 'Retour à mes échanges' }))
    await user.click(await screen.findByRole('tab', { name: /Bourse/ }))
    await user.click(await screen.findByText('Jean mom bleu clair'))
    expect(await screen.findByText(/Il te faut un jeton/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Réclamer cette pièce · 1 jeton' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('le membre répond dans la messagerie', async () => {
    const { user } = renderApp('/echanges/annonce/l6')
    await user.click(await screen.findByRole('button', { name: /Réclamer cette pièce/ }))
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
    expect(listing).toMatchObject({ status: 'open' })
    expect(screen.getByRole('list', { name: 'Mes annonces' })).toHaveTextContent('+1 jeton à la remise')
  })

  it('le bouton Échanger d’À sortir ouvre le formulaire prérempli', async () => {
    const { user } = renderApp('/a-sortir')
    const list = await screen.findByRole('list', { name: 'Pièces à sortir' })
    const card = within(list).getAllByRole('article')[0]
    await user.click(within(card).getByRole('button', { name: /Échanger/ }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Proposer à l’échange' })).toBeInTheDocument()
  })

  it('donner une pièce rapporte 1 jeton à la remise', async () => {
    const repository = createLocalRepository({ storage: null, startDate: TEST_TODAY })
    await repository.acceptCommunityRules()
    await repository.publishListing({ garmentId: 'g10', condition: 'good', note: null, circle: null })
    const swap = await repository.simulateIncomingReservation()
    await repository.scheduleSwap(swap.id, 'Place de Jaude', 'Demain, 18 h')
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={[`/echanges/echange/${swap.id}`]}>
        <WardrobeProvider repository={repository}>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </WardrobeProvider>
      </MemoryRouter>,
    )
    await user.click(await screen.findByRole('button', { name: /a scanné mon code/ }))
    expect(await screen.findByText(/Tu as gagné 1 jeton/)).toBeInTheDocument()
    expect(balanceOf((await repository.getSwapState()).ledger)).toBe(2)
    expect(screen.getByRole('link', { name: 'Réclamer une pièce' })).toHaveAttribute('href', '/echanges')
  })
})

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

describe('Carte de proximité', () => {
  it('montre les quartiers proches avec leurs pièces, les plus proches d’abord', async () => {
    const { user } = renderApp('/')
    expect(await screen.findByRole('heading', { level: 1, name: 'Autour de toi' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /1 jeton, voir mes échanges/ })).toHaveAttribute('href', '/echanges')

    // Saint-Jacques, 3 km, à ma taille : le quartier de Sarah est sélectionné, avec ses 2 pièces.
    const home = screen.getByRole('button', { name: /^Saint-Jacques \(ton quartier\) : 2 pièces, Sarah/ })
    expect(home).toHaveAttribute('aria-pressed', 'true')
    const panel = screen.getByRole('region', { name: 'Pièces à Saint-Jacques' })
    expect(within(panel).getByText('Sarah')).toBeInTheDocument()
    expect(within(panel).getByRole('link', { name: /Robe fleurie d’été/ })).toHaveAttribute('href', '/echanges/annonce/l3')

    // Quartier hors rayon (Montferrand, ~4 km) : pas de pastille.
    expect(screen.queryByRole('button', { name: /^Montferrand/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Jaude/ }))
    const jaude = await screen.findByRole('region', { name: 'Pièces à Jaude' })
    expect(within(jaude).getByText('Inès')).toBeInTheDocument()
    expect(within(jaude).getByRole('link', { name: /Pull marin rayé/ })).toBeInTheDocument()
  })

  it('la vue Liste regroupe les mêmes pièces, avec la distance', async () => {
    const { user } = renderApp('/')
    await screen.findByRole('heading', { level: 1, name: 'Autour de toi' })
    await user.click(screen.getByRole('tab', { name: 'Liste' }))
    const list = await screen.findByRole('list', { name: 'Pièces près de chez toi' })
    // 2 pièces à Saint-Jacques, 1 à Jaude (le T-shirt en S est masqué), 2 aux Cézeaux.
    expect(within(list).getAllByRole('listitem')).toHaveLength(5)
    expect(within(list).getAllByRole('link')[0]).toHaveTextContent('Ton quartier')
  })

  it('le rayon élargit la carte, et un rayon vide propose toute la ville', async () => {
    const { user } = renderApp('/')
    await screen.findByRole('heading', { level: 1, name: 'Autour de toi' })
    await user.click(screen.getByRole('button', { name: '5 km' }))
    // ~3,5 km : Chamalières entre dans le rayon.
    expect(await screen.findByRole('button', { name: /^Chamalières : 2 pièces, Chloé/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '1 km' }))
    await waitFor(() => expect(screen.queryByRole('button', { name: /^Chamalières/ })).not.toBeInTheDocument())
    // À 1 km de Saint-Jacques, seules les pièces de Sarah restent ; en filtrant les chaussures, plus rien.
    await user.click(screen.getByRole('button', { name: 'Filtres' }))
    const sheet = await screen.findByRole('dialog', { name: 'Filtres' })
    await user.click(within(sheet).getByRole('button', { name: 'Chaussures' }))
    await user.click(within(sheet).getByRole('button', { name: /^Voir 0 pièce/ }))
    expect(await screen.findByText('Rien dans ce rayon.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Voir toute la ville' }))
    expect(await screen.findByRole('button', { name: /^Chamalières : 1 pièce, Chloé/ })).toBeInTheDocument()
  })

  it('les filtres comptent ce qui a changé, et se réinitialisent', async () => {
    const { user } = renderApp('/')
    await screen.findByRole('heading', { level: 1, name: 'Autour de toi' })
    await user.click(screen.getByRole('button', { name: 'Filtres' }))
    const sheet = await screen.findByRole('dialog', { name: 'Filtres' })
    await user.click(within(sheet).getByRole('switch', { name: /À ma taille/ }))
    await user.click(within(sheet).getByRole('button', { name: 'Manteaux' }))
    await user.click(within(sheet).getByRole('button', { name: 'Réinitialiser' }))
    expect(within(sheet).getByRole('switch', { name: /À ma taille/ })).toHaveAttribute('aria-checked', 'true')
    expect(within(sheet).getByRole('button', { name: 'Tout' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('change de quartier', async () => {
    const { user, repository } = renderApp('/')
    await user.selectOptions(await screen.findByRole('combobox', { name: 'Mon quartier' }), 'Chamalières')
    await waitFor(async () => expect((await repository.getSwapState()).neighborhood).toBe('Chamalières'))
    expect(await screen.findByRole('button', { name: /^Chamalières \(ton quartier\) : 2 pièces, Chloé/ })).toBeInTheDocument()
  })
})

describe('Échanges', () => {
  it('montre mes jetons, la règle en un appui, et mène à « Donner une pièce »', async () => {
    const { user } = renderApp('/echanges')
    expect(await screen.findByRole('heading', { level: 1, name: 'Échanges' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Mes jetons' })).toHaveTextContent('1 jeton')
    expect(screen.queryByText(/1 habit donné = 1 jeton/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Comment marchent les jetons ?' }))
    expect(await screen.findByText(/1 habit donné = 1 jeton = 1 habit à réclamer/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Donner une pièce' })).toHaveAttribute('href', '/armoire?filtre=dort')
  })

  it('liste mes échanges en cours et terminés, puis mes annonces', async () => {
    const { user } = renderApp('/echanges')
    const swaps = await screen.findByRole('list', { name: 'Mes échanges' })
    expect(within(swaps).getByText('Sweat à capuche gris')).toBeInTheDocument()
    // Je n'ai pas encore mis de pièce de mon armoire en ligne : l'échange passé ne compte pas comme une annonce.
    await user.click(screen.getByRole('tab', { name: /Mes annonces/ }))
    expect(await screen.findByRole('heading', { level: 2, name: 'Aucune annonce' })).toBeInTheDocument()
  })
})

describe('Bourse d’échange simulée', () => {
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
    // Le seul jeton est bloqué : une deuxième réclamation, trouvée sur la carte, est refusée.
    await user.click(screen.getByRole('button', { name: 'Retour à mes échanges' }))
    await user.click(await screen.findByRole('link', { name: /Carte/ }))
    await user.click(await screen.findByRole('button', { name: /^Les Cézeaux/ }))
    await user.click(await screen.findByRole('link', { name: /Jean mom bleu clair/ }))
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

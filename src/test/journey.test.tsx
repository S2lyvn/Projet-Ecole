// @vitest-environment jsdom
// Critère de fin de l'étape 2 : refaire le parcours conseillé du prototype dans la vraie appli.
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '../App'
import { WardrobeProvider } from '../app/WardrobeProvider'
import { ToastProvider } from '../components/Toast'
import { createLocalRepository } from '../data/local'
import { DemoPanel } from '../demo/DemoPanel'
import { TEST_TODAY } from './renderApp'

vi.mock('../app/config', () => ({ isDemoMode: false }))

function renderJourney(path = '/looks') {
  const repository = createLocalRepository({ storage: null, startDate: TEST_TODAY })
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={[path]}>
      <WardrobeProvider repository={repository}>
        <ToastProvider>
          <AppRoutes />
          <DemoPanel />
        </ToastProvider>
      </WardrobeProvider>
    </MemoryRouter>,
  )
  return { user, repository }
}

const title = (name: string | RegExp) => screen.findByRole('heading', { level: 1, name })
const tab = (name: RegExp) =>
  within(screen.getByRole('navigation', { name: 'Navigation principale' })).getByRole('link', { name })

describe('parcours conseillé', () => {
  it('mettre à jour, proposer, capturer, donner à la communauté, réclamer près de chez soi', async () => {
    const { user, repository } = renderJourney('/looks')

    // 1. Mettre à jour : confirmer d'un geste les pièces d'hier.
    await title('Tenue du jour')
    await user.click(screen.getByRole('link', { name: /Hier\s: 3 pièces à confirmer/ }))
    await title(/Qu’as-tu porté hier/)
    await user.click(screen.getByRole('button', { name: 'C’est bon' }))
    await title('Armoire')
    await user.click(screen.getByRole('button', { name: 'Au lavage' }))
    expect(await screen.findByRole('button', { name: /T-shirt gris chiné/ })).toBeInTheDocument()

    // 2. Proposer : valider la tenue du jour, puis passer au lendemain.
    await user.click(tab(/Looks/))
    await title('Tenue du jour')
    await user.click(screen.getByRole('button', { name: 'Je porte cette tenue' }))
    const panel = screen.getByRole('complementary', { name: 'Un dressing qui se met à jour tout seul' })
    await user.click(within(panel).getByRole('button', { name: 'Avancer d’un jour' }))
    const banner = await screen.findByRole('link', { name: /Hier\s: \d pièces? à confirmer/ })
    await user.click(banner)
    await user.click(await screen.findByRole('button', { name: 'C’est bon' }))
    await title('Armoire')
    expect((await repository.listGarments()).find((g) => g.id === 'g17')?.lastWornAt).toBe('2026-10-27')

    // 3. Capturer : ajouter les achats détectés, puis lire le résumé de l'armoire.
    await user.click(await screen.findByRole('link', { name: /3 achats détectés/ }))
    await title('Achats détectés')
    await user.click(screen.getByRole('button', { name: /Tout ajouter/ }))
    await title('Armoire')
    expect((await repository.listGarments()).filter((g) => g.source === 'purchase')).toHaveLength(3)
    expect(screen.getByRole('img', { name: /pièces portées sur 20 ces 3 derniers mois/ })).toBeInTheDocument()

    // 4. Faire sortir : donner à la communauté une pièce qui dort.
    await user.click(screen.getByRole('button', { name: 'Elles dorment' }))
    const sleeping = (await screen.findAllByRole('button', { name: /dort depuis/ }))[0]
    const pieceName = (sleeping.getAttribute('aria-label') ?? '').split(',')[0]
    await user.click(sleeping)
    await user.click(await screen.findByRole('button', { name: 'Donner à la communauté' }))
    await title('Proposer à l’échange')
    await user.click(await screen.findByRole('button', { name: 'J’accepte' }))
    await user.click(await screen.findByLabelText('La pièce est propre'))
    await user.click(screen.getByLabelText('J’ai signalé les défauts'))
    await user.click(screen.getByRole('button', { name: 'Mettre dans la bourse' }))
    await title('Échanges')
    expect(await screen.findByRole('list', { name: 'Mes annonces' })).toHaveTextContent(pieceName)

    // 5. Près de chez soi : ouvrir la carte, toucher un quartier, réclamer une pièce avec son jeton.
    await user.click(tab(/Carte/))
    await title('Autour de toi')
    await user.click(await screen.findByRole('button', { name: /^Saint-Jacques/ }))
    await user.click(await screen.findByRole('link', { name: /Robe fleurie d’été/ }))
    await user.click(await screen.findByRole('button', { name: 'Réclamer cette pièce · 1 jeton' }))
    expect(await screen.findByRole('heading', { name: 'Fixer le rendez-vous' })).toBeInTheDocument()
  }, 30_000) // Long parcours de bout en bout : délai large pour les machines chargées.
})

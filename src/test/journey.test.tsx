// @vitest-environment jsdom
// Critère de fin de l'étape 2 : refaire le parcours conseillé du prototype dans la vraie appli.
import { render, screen, waitFor, within } from '@testing-library/react'
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

function renderJourney() {
  const repository = createLocalRepository({ storage: null, startDate: TEST_TODAY })
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={['/']}>
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
  it('capturer, mettre à jour, proposer, faire sortir, mesurer', async () => {
    const { user, repository } = renderJourney()

    // 1. Mettre à jour : confirmer d'un geste les pièces d'hier.
    await title('Tenue du jour')
    await user.click(screen.getByRole('link', { name: /Hier\s: 3 pièces à confirmer/ }))
    await title(/Qu’as-tu porté hier/)
    await user.click(screen.getByRole('button', { name: 'C’est bon' }))
    await title('Dressing')
    await user.click(screen.getByRole('button', { name: 'Au lavage' }))
    expect(await screen.findByRole('button', { name: /T-shirt gris chiné/ })).toBeInTheDocument()

    // 2. Proposer : valider la tenue du jour, puis passer au lendemain.
    await user.click(tab(/Aujourd’hui/))
    await title('Tenue du jour')
    await user.click(screen.getByRole('button', { name: 'Je porte cette tenue' }))
    const panel = screen.getByRole('complementary', { name: 'Un dressing qui se met à jour tout seul' })
    await user.click(within(panel).getByRole('button', { name: 'Avancer d’un jour' }))
    const banner = await screen.findByRole('link', { name: /Hier\s: \d pièces? à confirmer/ })
    await user.click(banner)
    await user.click(await screen.findByRole('button', { name: 'C’est bon' }))
    await title('Dressing')
    expect((await repository.listGarments()).find((g) => g.id === 'g17')?.lastWornAt).toBe('2026-10-27')

    // 3. Faire sortir : donner une pièce qui dort, puis annuler.
    await user.click(tab(/À sortir/))
    await title('À sortir')
    const list = screen.getByRole('list', { name: 'Pièces à sortir' })
    const first = within(list).getAllByRole('article')[0]
    const name = within(first).getByRole('heading', { level: 2 }).textContent ?? ''
    await user.click(within(first).getByRole('button', { name: /^Donner/ }))
    await waitFor(() => expect(within(list).queryByRole('heading', { level: 2, name })).not.toBeInTheDocument())
    await user.click(await screen.findByRole('button', { name: 'Annuler' }))
    expect(await within(list).findByRole('heading', { level: 2, name })).toBeInTheDocument()

    // 4. Capturer : ajouter les achats détectés.
    await user.click(tab(/Dressing/))
    await user.click(await screen.findByRole('link', { name: /3 achats détectés/ }))
    await title('Achats détectés')
    await user.click(screen.getByRole('button', { name: /Tout ajouter/ }))
    await title('Dressing')
    expect((await repository.listGarments()).filter((g) => g.source === 'purchase')).toHaveLength(3)

    // 5. Mesurer : le Bilan.
    await user.click(tab(/Bilan/))
    await title('Bilan')
    expect(screen.getByRole('img', { name: /pièces portées sur 20 ces 3 derniers mois/ })).toBeInTheDocument()
  }, 20_000) // Long parcours de bout en bout : délai large pour les machines chargées.
})

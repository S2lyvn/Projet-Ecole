// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '../App'
import { WardrobeProvider } from '../app/WardrobeProvider'
import type { Repository } from '../app/WardrobeProvider'
import { ToastProvider } from '../components/Toast'
import { createLocalRepository } from '../data/local'
import { TEST_TODAY } from '../test/renderApp'
import { DemoPanel } from './DemoPanel'

// .env.local peut activer le mode démo : on coupe le panneau d'AppLayout pour n'avoir que celui du test.
vi.mock('../app/config', () => ({ isDemoMode: false }))

// Même montage que renderApp, avec le panneau à côté des écrans (isDemoMode vaut false en test).
function renderDemo(path = '/', options: { withoutDemo?: boolean } = {}) {
  const local = createLocalRepository({ storage: null, startDate: TEST_TODAY })
  const repository: Repository = options.withoutDemo ? { ...local, advanceDay: undefined, reset: undefined } : local
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

const panel = () => screen.findByRole('complementary', { name: 'Un dressing qui se met à jour tout seul' })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('panneau de démonstration', () => {
  it('avancer d’un jour change la date simulée', async () => {
    const { user } = renderDemo()
    const aside = await panel()
    expect(within(aside).getByText('Mardi 27 octobre')).toBeInTheDocument()
    await user.click(within(aside).getByRole('button', { name: 'Avancer d’un jour' }))
    expect(await within(aside).findByText('Mercredi 28 octobre')).toBeInTheDocument()
    expect(screen.getAllByText('Mercredi 28 octobre.').length).toBeGreaterThan(0)
  })

  it('affiche la phrase d’aide selon l’état', async () => {
    renderDemo()
    const aside = await panel()
    expect(within(aside).getByRole('status')).toHaveTextContent(/Hier\s: 3 pièces à confirmer/)
  })

  it('tenue validée puis jour suivant : bannière « Hier : … à confirmer »', async () => {
    const { user } = renderDemo()
    const aside = await panel()
    await user.click(await screen.findByRole('button', { name: 'Je porte cette tenue' }))
    await screen.findByText('Tenue validée', { selector: 'div' })
    await user.click(within(aside).getByRole('button', { name: 'Avancer d’un jour' }))
    expect(await screen.findByRole('link', { name: /Hier\s: \d+ pièces? à confirmer/ })).toBeInTheDocument()
  })

  it('mode miroir + tenue validée puis jour suivant : pièces portées, rien à confirmer', async () => {
    const { user, repository } = renderDemo()
    const aside = await panel()
    const mirror = within(aside).getByRole('switch', { name: /Mode miroir/ })
    expect(mirror).toHaveAttribute('aria-checked', 'false')
    await user.click(mirror)
    expect(await within(aside).findByRole('switch', { name: /Mode miroir/, checked: true })).toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: 'Je porte cette tenue' }))
    await screen.findByText('Tenue validée', { selector: 'div' })
    await user.click(within(aside).getByRole('button', { name: 'Avancer d’un jour' }))

    const toast = await screen.findByText(/^Miroir\s: \d+ pièces détectées\. Mercredi 28 octobre\.$/)
    const detected = Number(/(\d+)/.exec(toast.textContent ?? '')?.[1])
    const mirrored = (await repository.listWears()).filter((w) => w.source === 'mirror' && w.wornOn === TEST_TODAY)
    expect(mirrored).toHaveLength(detected)
    expect(detected).toBeGreaterThan(0)
    expect(screen.queryByRole('link', { name: /Hier\s:/ })).not.toBeInTheDocument()
  })

  it('depuis un écran secondaire, avancer d’un jour ramène à Aujourd’hui', async () => {
    const { user } = renderDemo('/achats')
    const aside = await panel()
    expect(within(aside).getByRole('status')).toHaveTextContent('Ajoute ou ignore les achats détectés.')
    await user.click(within(aside).getByRole('button', { name: 'Avancer d’un jour' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Tenue du jour' })).toBeInTheDocument()
  })

  it('réinitialiser repart des données d’exemple et revient à Aujourd’hui', async () => {
    const { user } = renderDemo('/bilan')
    const aside = await panel()
    await user.click(within(aside).getByRole('button', { name: 'Avancer d’un jour' }))
    await within(aside).findByText('Mercredi 28 octobre')
    await user.click(within(aside).getByRole('button', { name: 'Réinitialiser' }))
    expect(await within(aside).findByText('Mardi 27 octobre')).toBeInTheDocument()
    expect(await screen.findByText('Démo réinitialisée.')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 1, name: 'Tenue du jour' })).toBeInTheDocument()
  })

  it('petit écran : bouton « Démo » qui ouvre une feuille', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    const { user } = renderDemo()
    await screen.findByRole('heading', { level: 1, name: 'Tenue du jour' })
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Démo' }))
    const sheet = await screen.findByRole('dialog', { name: 'Un dressing qui se met à jour tout seul' })
    await user.click(within(sheet).getByRole('button', { name: 'Avancer d’un jour' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await screen.findByText('Mercredi 28 octobre.')).toBeInTheDocument()
  })

  it('sans commandes de démo : rien n’est affiché', async () => {
    renderDemo('/', { withoutDemo: true })
    await screen.findByRole('heading', { level: 1, name: 'Tenue du jour' })
    expect(screen.queryByRole('button', { name: 'Avancer d’un jour' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Démo' })).not.toBeInTheDocument()
  })
})

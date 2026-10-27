// Rendu de l'appli complète pour les tests d'écrans : données d'exemple en mémoire, jour fixe, routeur en mémoire.
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { AppRoutes } from '../App'
import { WardrobeProvider } from '../app/WardrobeProvider'
import { ToastProvider } from '../components/Toast'
import { createLocalRepository } from '../data/local'

export const TEST_TODAY = '2026-10-27'

export function renderApp(path = '/') {
  const repository = createLocalRepository({ storage: null, startDate: TEST_TODAY })
  const user = userEvent.setup()
  const utils = render(
    <MemoryRouter initialEntries={[path]}>
      <WardrobeProvider repository={repository}>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </WardrobeProvider>
    </MemoryRouter>,
  )
  return { ...utils, user, repository }
}

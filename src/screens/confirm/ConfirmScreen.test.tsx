// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '../../App'
import { WardrobeProvider } from '../../app/WardrobeProvider'
import { ToastProvider } from '../../components/Toast'
import { createLocalRepository } from '../../data/local'
import { renderApp, TEST_TODAY } from '../../test/renderApp'

const YESTERDAY = '2026-10-26'

async function lastWornById(repository: { listGarments(): Promise<{ id: string; lastWornAt: string | null }[]> }) {
  const garments = await repository.listGarments()
  return new Map(garments.map((g) => [g.id, g.lastWornAt]))
}

function mount(repository: ReturnType<typeof createLocalRepository>) {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={['/confirmer']}>
      <WardrobeProvider repository={repository}>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </WardrobeProvider>
    </MemoryRouter>,
  )
  return { user }
}

describe('Qu’as-tu porté hier ?', () => {
  it('précoche les 3 pièces de la veille et décrit l’effet sur le dressing', async () => {
    renderApp('/confirmer')
    expect(await screen.findByRole('heading', { level: 1, name: /^Qu’as-tu porté hier\s\?$/ })).toBeInTheDocument()
    const group = screen.getByRole('group', { name: 'Pièces portées hier' })
    const boxes = within(group).getAllByRole('checkbox')
    expect(boxes).toHaveLength(3)
    for (const box of boxes) expect(box).toBeChecked()
    expect(within(group).getByLabelText('T-shirt gris chiné')).toBeChecked()

    const effect = screen.getByRole('region', { name: 'Effet sur le dressing' })
    // T-shirt porté lundi 26 : 3 jours de lavage, retour jeudi.
    expect(effect).toHaveTextContent('T-shirt gris chiné, retour jeudi')
    expect(effect).toHaveTextContent('Disponibles : Jean droit, Baskets blanches.')
    expect(screen.getByRole('button', { name: 'Fermer' })).toBeInTheDocument()
    expect(screen.getByText('Avec un miroir connecté, cette étape se fait sans geste.')).toBeInTheDocument()
  })

  it('n’enregistre que les pièces cochées puis ouvre le dressing', async () => {
    const { user, repository } = renderApp('/confirmer')
    await user.click(await screen.findByLabelText('Baskets blanches'))
    await user.click(screen.getByRole('button', { name: 'C’est bon' }))

    expect(await screen.findByText('Dressing mis à jour : 2 pièces.')).toBeInTheDocument()
    const worn = await lastWornById(repository)
    expect(worn.get('g03')).toBe(YESTERDAY)
    expect(worn.get('g02')).toBe(YESTERDAY)
    expect(worn.get('g06')).not.toBe(YESTERDAY)
    expect(await repository.getPendingConfirmation()).toBeNull()
  })

  it('Corriger permet d’ajouter une pièce disponible', async () => {
    const { user, repository } = renderApp('/confirmer')
    await user.click(await screen.findByRole('button', { name: 'Corriger' }))
    const extra = screen.getByRole('group', { name: 'Autres pièces portées hier' })
    // Le pull au lavage n'est pas proposé, ni les pièces déjà cochées.
    expect(within(extra).queryByLabelText('Pull en laine brique')).toBeNull()
    expect(within(extra).queryByLabelText('Jean droit')).toBeNull()
    await user.click(within(extra).getByLabelText('Pantalon noir'))
    expect(screen.getByRole('region', { name: 'Effet sur le dressing' })).toHaveTextContent('Pantalon noir')
    expect(screen.getByRole('button', { name: 'Masquer la correction' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'C’est bon' }))
    expect(await screen.findByText('Dressing mis à jour : 4 pièces.')).toBeInTheDocument()
    expect((await lastWornById(repository)).get('g09')).toBe(YESTERDAY)
  })

  it('désactive « C’est bon » quand rien n’est coché', async () => {
    const { user } = renderApp('/confirmer')
    const group = await screen.findByRole('group', { name: 'Pièces portées hier' })
    for (const box of within(group).getAllByRole('checkbox')) await user.click(box)
    expect(screen.getByRole('button', { name: 'C’est bon' })).toBeDisabled()
    expect(screen.getByText('Aucune pièce sélectionnée.')).toBeInTheDocument()
  })

  it('affiche Rien à confirmer sans attente', async () => {
    const repository = createLocalRepository({ storage: null, startDate: TEST_TODAY })
    await repository.confirmWears([])
    render(
      <MemoryRouter initialEntries={['/confirmer']}>
        <WardrobeProvider repository={repository}>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </WardrobeProvider>
      </MemoryRouter>,
    )
    expect(await screen.findByRole('heading', { name: 'Rien à confirmer' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'C’est bon' })).toBeNull()
    const user = userEvent.setup()
    await user.click(screen.getByRole('link', { name: 'Retour à Aujourd’hui' }))
    expect(await screen.findByRole('navigation', { name: 'Navigation principale' })).toBeInTheDocument()
  })

  it('ne promet pas un retour plus tôt pour une pièce déjà au lavage', async () => {
    const repository = createLocalRepository({ storage: null, startDate: TEST_TODAY })
    // Jean droit (0 jour de lavage par défaut) mis au lavage à la main : retour jeudi 29.
    await repository.washGarment('g02')
    mount(repository)
    const effect = await screen.findByRole('region', { name: 'Effet sur le dressing' })
    expect(effect).toHaveTextContent('Jean droit, retour jeudi')
    expect(effect).toHaveTextContent('Disponibles : Baskets blanches.')
  })

  it('explique quand les pièces de la tenue ont quitté le dressing', async () => {
    const repository = createLocalRepository({ storage: null, startDate: TEST_TODAY })
    for (const id of ['g03', 'g02', 'g06']) await repository.setGarmentStatus(id, 'donated')
    const { user } = mount(repository)
    expect(await screen.findByText('Plus rien à confirmer')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'C’est noté' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Tenue du jour' })).toBeInTheDocument()
    expect(await repository.getPendingConfirmation()).toBeNull()
  })
})

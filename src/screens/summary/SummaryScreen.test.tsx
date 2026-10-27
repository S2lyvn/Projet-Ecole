// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '../../App'
import { WardrobeProvider } from '../../app/WardrobeProvider'
import { ToastProvider } from '../../components/Toast'
import { createLocalRepository } from '../../data/local'
import { renderApp, TEST_TODAY } from '../../test/renderApp'

// Données d'exemple (sampleData.ts) : 17 pièces actives, jours depuis le dernier port :
// 214, 6, 9, 4, 41, 5, 28, 270, 20, 335, 150, 62, 18, 95, 11, 120, 410.
// <= 90 jours : 6, 9, 4, 41, 5, 28, 20, 62, 18, 11 → 10 pièces (10/17 = 58,8 % → 59 %).
// <= 365 jours : les mêmes + 214, 270, 335, 150, 95, 120 → 16 pièces (16/17 = 94,1 % → 94 %).
// toHaveTextContent normalise les espaces : l'insécable avant % y devient une espace simple.

describe('Bilan', () => {
  it('affiche l’anneau sur 3 mois par défaut', async () => {
    renderApp('/bilan')
    expect(await screen.findByRole('heading', { level: 1, name: 'Bilan' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '10 pièces portées sur 17 ces 3 derniers mois' })).toBeInTheDocument()
    const ringbox = screen.getByRole('region', { name: 'Pièces portées sur la période' })
    expect(ringbox).toHaveTextContent('pièces sur 17')
    expect(ringbox).toHaveTextContent(/soit 59\s% de ton dressing/)
    expect(within(ringbox).getByText('Portées')).toBeInTheDocument()
    expect(within(ringbox).getByText('Pas portées')).toBeInTheDocument()
    const period = screen.getByRole('group', { name: 'Période' })
    expect(within(period).getByRole('button', { name: '3 derniers mois' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('passe à 12 mois et enregistre le réglage', async () => {
    const { user, repository } = renderApp('/bilan')
    await user.click(await screen.findByRole('button', { name: '12 derniers mois' }))
    expect(await screen.findByRole('img', { name: '16 pièces portées sur 17 ces 12 derniers mois' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Pièces portées sur la période' })).toHaveTextContent(
      /soit 94\s% de ton dressing/,
    )
    expect(screen.getByRole('button', { name: '12 derniers mois' })).toHaveAttribute('aria-pressed', 'true')
    expect((await repository.getSettings()).usagePeriod).toBe(365)

    await user.click(screen.getByRole('button', { name: '3 derniers mois' }))
    expect(await screen.findByRole('img', { name: '10 pièces portées sur 17 ces 3 derniers mois' })).toBeInTheDocument()
    expect((await repository.getSettings()).usagePeriod).toBe(90)
  })

  it('compte les échanges terminés de la bourse', async () => {
    const repository = createLocalRepository({ storage: null, startDate: TEST_TODAY })
    // Les données d'exemple ont déjà un échange terminé ; on en termine un deuxième.
    const swap = await repository.reserveListing('l6')
    await repository.scheduleSwap(swap.id, 'Place de Jaude', 'Demain, 18 h')
    await repository.completeSwap(swap.id, swap.handoverCode)
    render(
      <MemoryRouter initialEntries={['/bilan']}>
        <WardrobeProvider repository={repository}>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </WardrobeProvider>
      </MemoryRouter>,
    )
    expect(await screen.findByText('2 pièces remises en circulation par l’échange')).toBeInTheDocument()
    // La pièce reçue entre dans le dressing (18 actives) mais n'a pas encore été portée.
    expect(screen.getByRole('img', { name: '10 pièces portées sur 18 ces 3 derniers mois' })).toBeInTheDocument()
  })

  it('mène aux pièces à sortir', async () => {
    const { user } = renderApp('/bilan')
    const link = await screen.findByRole('link', { name: 'Voir les pièces à sortir' })
    expect(link).toHaveAttribute('href', '/a-sortir')
    await user.click(link)
    expect(await screen.findByRole('heading', { level: 1, name: 'À sortir' })).toBeInTheDocument()
  })
})

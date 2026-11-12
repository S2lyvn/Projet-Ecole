// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from './renderApp'

describe('appli', () => {
  it('affiche les 4 onglets et navigue', async () => {
    const { user } = renderApp('/')
    const nav = await screen.findByRole('navigation', { name: 'Navigation principale' })
    expect(nav).toBeInTheDocument()
    expect(screen.getAllByRole('link').filter((l) => nav.contains(l))).toHaveLength(4)
    expect(await screen.findByRole('heading', { level: 1, name: 'Autour de toi' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: /Armoire/ }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Armoire' })).toBeInTheDocument()
  })

  it('les anciennes adresses mènent aux nouveaux écrans', async () => {
    renderApp('/bilan')
    expect(await screen.findByRole('heading', { level: 1, name: 'Armoire' })).toBeInTheDocument()
  })

  it('« À sortir » ouvre l’armoire sur les pièces qui dorment', async () => {
    renderApp('/a-sortir')
    expect(await screen.findByRole('button', { name: 'Elles dorment' })).toHaveAttribute('aria-pressed', 'true')
  })
})

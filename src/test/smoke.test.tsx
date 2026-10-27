// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from './renderApp'

describe('appli', () => {
  it('affiche les 5 onglets et navigue', async () => {
    const { user } = renderApp('/')
    const nav = await screen.findByRole('navigation', { name: 'Navigation principale' })
    expect(nav).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: /Bilan/ }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Bilan' })).toBeInTheDocument()
  })
})

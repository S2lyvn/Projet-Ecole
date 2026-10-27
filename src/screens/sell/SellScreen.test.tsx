// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../test/renderApp'

describe('Vendre', () => {
  it('préremplit l’annonce avec la pièce', async () => {
    renderApp('/vendre/g01')
    expect(await screen.findByRole('heading', { level: 1, name: 'Vendre cette pièce' })).toBeInTheDocument()
    expect(screen.getByLabelText('Titre de l’annonce')).toHaveValue('Chemise en lin vert sauge')
    expect(screen.getByLabelText('Taille')).toHaveValue('')
    expect(screen.getByLabelText('État')).toHaveValue('very_good')
    expect(screen.getByLabelText(/^Prix/)).toHaveValue('')
    expect(screen.getByLabelText('Aperçu de l’annonce')).toHaveValue(
      'Chemise en lin vert sauge\nTaille\u00a0: à préciser · Très bon état\nPrix\u00a0: à fixer',
    )
  })

  it('met à jour l’aperçu et copie l’annonce', async () => {
    const { user } = renderApp('/vendre/g02')
    const size = await screen.findByLabelText('Taille')
    await user.type(size, 'M')
    await user.type(screen.getByLabelText(/^Prix/), '15 €')
    await user.selectOptions(screen.getByLabelText('État'), 'good')
    const expected = 'Jean droit\nTaille\u00a0: M · Bon état\nPrix\u00a0: 15\u00a0€'
    expect(screen.getByLabelText('Aperçu de l’annonce')).toHaveValue(expected)

    await user.click(screen.getByRole('button', { name: 'Copier l’annonce' }))
    expect(await screen.findByText('Annonce copiée.')).toBeInTheDocument()
    expect(await navigator.clipboard.readText()).toBe(expected)
    expect(screen.getByRole('button', { name: 'Je l’ai vendu' })).toHaveFocus()
  })

  it('Je l’ai vendue : la pièce passe à vendue, avec Annuler', async () => {
    const { user, repository } = renderApp('/vendre/g01')
    await user.click(await screen.findByRole('button', { name: 'Je l’ai vendue' }))
    // Testing Library normalise l'espace ins\u00e9cable en espace simple.
    expect(await screen.findByText(/^Chemise en lin vert sauge.: vendue\. Elle quitte ton dressing\.$/)).toBeInTheDocument()
    expect((await repository.getGarment('g01'))?.status).toBe('sold')
    // La navigation de react-router est une transition : l'écran À sortir arrive juste après le toast.
    expect(await screen.findByRole('heading', { level: 1, name: 'À sortir' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1, name: 'Vendre cette pièce' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    await waitFor(async () => expect((await repository.getGarment('g01'))?.status).toBe('active'))
  })

  it('accorde au pluriel : Je les ai vendues', async () => {
    renderApp('/vendre/g06')
    expect(await screen.findByRole('button', { name: 'Je les ai vendues' })).toBeInTheDocument()
  })

  it('pièce inconnue : message et lien vers À sortir', async () => {
    renderApp('/vendre/inconnue')
    expect(await screen.findByRole('heading', { name: 'Pièce introuvable' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voir les pièces à sortir' })).toHaveAttribute('href', '/a-sortir')
  })
})

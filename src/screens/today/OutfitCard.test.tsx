// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createLocalRepository } from '../../data/local'
import type { Garment } from '../../domain/types'
import { TEST_TODAY } from '../../test/renderApp'
import { OutfitCard } from './OutfitCard'

async function sampleGarment(id: string): Promise<Garment> {
  const repository = createLocalRepository({ storage: null, startDate: TEST_TODAY })
  const garment = await repository.getGarment(id)
  if (!garment) throw new Error(`pièce ${id} absente`)
  return garment
}

describe('carte de la tenue', () => {
  it('dit « Jamais porté » pour une pièce sans port au lieu d’une durée', async () => {
    const orphan = await sampleGarment('g07')
    const pull = await sampleGarment('g04')
    const fresh: Garment = { ...pull, name: 'Pull col rond en laine', lastWornAt: null, acquiredAt: '2026-10-25' }
    render(<OutfitCard outfit={{ orphan, companions: [fresh] }} today={TEST_TODAY} />)

    const list = screen.getByRole('list', { name: 'Valeurs sûres' })
    expect(within(list).getByText('Jamais porté')).toBeInTheDocument()
    expect(within(list).queryByText(/il y a/)).not.toBeInTheDocument()
  })

  it('accorde « Jamais » avec l’orpheline', async () => {
    const robe = await sampleGarment('g17')
    render(<OutfitCard outfit={{ orphan: { ...robe, lastWornAt: null }, companions: [] }} today={TEST_TODAY} />)
    expect(screen.getByText('Jamais portée')).toBeInTheDocument()
  })
})

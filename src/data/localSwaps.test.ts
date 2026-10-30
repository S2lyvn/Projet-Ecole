import { describe, expect, it } from 'vitest'
import { ME } from '../domain/swaps'
import { balanceOf, heldTokens } from '../domain/tokens'
import { createLocalRepository } from './local'

const TODAY = '2026-10-27'

function setup() {
  return createLocalRepository({ storage: null, startDate: TODAY })
}

async function tokens(repository: ReturnType<typeof setup>) {
  const { ledger } = await repository.getSwapState()
  return { available: balanceOf(ledger), held: heldTokens(ledger) }
}

describe('bourse simulée : réclamer une pièce', () => {
  it('démarre avec 1 jeton gagné en donnant une pièce lors d’un échange passé', async () => {
    const repository = setup()
    const state = await repository.getSwapState()
    expect(await tokens(repository)).toEqual({ available: 1, held: 0 })
    expect(state.listings.filter((l) => l.ownerId !== ME && l.status === 'open')).toHaveLength(10)
    expect(state.swaps.filter((s) => s.status === 'completed')).toHaveLength(1)
  })

  it('réclamer bloque 1 jeton, puis la remise fait entrer la pièce avec sa fiche', async () => {
    const repository = setup()
    // l4 : doudoune. Avec les jetons, un manteau coûte 1 jeton comme un t-shirt.
    const swap = await repository.reserveListing('l4')
    expect(await tokens(repository)).toEqual({ available: 0, held: 1 })
    expect((await repository.getSwapState()).listings.find((l) => l.id === 'l4')?.status).toBe('reserved')

    await repository.scheduleSwap(swap.id, 'Place de Jaude', 'Demain, 18 h')
    await expect(repository.completeSwap(swap.id, 'MAUVAIS')).rejects.toThrow('ne correspond pas')
    const { receivedGarment } = await repository.completeSwap(swap.id, swap.handoverCode)

    expect(await tokens(repository)).toEqual({ available: 0, held: 0 })
    expect(receivedGarment).toMatchObject({ name: 'Doudoune légère kaki', category: 'outerwear', source: 'swap' })
    const garments = await repository.listGarments()
    expect(garments.find((g) => g.id === receivedGarment?.id)?.status).toBe('active')
    const done = (await repository.getSwapState()).swaps.find((s) => s.id === swap.id)
    expect(done?.status).toBe('completed')
  })

  it('refuse sans jeton disponible, avec un message clair', async () => {
    const repository = setup()
    await repository.reserveListing('l1')
    await expect(repository.reserveListing('l2')).rejects.toThrow('Il te faut un jeton')
    expect(await tokens(repository)).toEqual({ available: 0, held: 1 })
  })

  it('annuler rend le jeton et remet l’annonce en ligne', async () => {
    const repository = setup()
    const swap = await repository.reserveListing('l6')
    await repository.cancelSwap(swap.id)
    expect(await tokens(repository)).toEqual({ available: 1, held: 0 })
    expect((await repository.getSwapState()).listings.find((l) => l.id === 'l6')?.status).toBe('open')
  })

  it('le membre répond aux messages', async () => {
    const repository = setup()
    const swap = await repository.reserveListing('l6')
    const updated = await repository.sendSwapMessage(swap.id, 'Bonjour !')
    expect(updated.messages.map((m) => m.senderId)).toEqual([ME, 'm1'])
    await expect(repository.sendSwapMessage(swap.id, '   ')).rejects.toThrow('Écris un message')
  })

  it('une réclamation sans rendez-vous expire après 72 h et rend le jeton', async () => {
    const repository = setup()
    await repository.reserveListing('l6')
    await repository.advanceDay()
    await repository.advanceDay()
    expect(await tokens(repository)).toEqual({ available: 0, held: 1 })
    await repository.advanceDay()
    await repository.advanceDay()
    expect(await tokens(repository)).toEqual({ available: 1, held: 0 })
  })

  it('le jeton n’expire pas', async () => {
    const repository = setup()
    for (let i = 0; i < 40; i++) await repository.advanceDay()
    expect(await tokens(repository)).toEqual({ available: 1, held: 0 })
  })
})

describe('bourse simulée : fournir une pièce', () => {
  it('demande d’accepter les règles avant la première annonce', async () => {
    const repository = setup()
    await expect(
      repository.publishListing({ garmentId: 'g10', condition: 'good', note: null, circle: null }),
    ).rejects.toThrow('règles')
  })

  it('publier ne donne rien ; la remise donne 1 jeton et la pièce sort du dressing', async () => {
    const repository = setup()
    await repository.acceptCommunityRules()
    // g10 : Pull col rond gris.
    const listing = await repository.publishListing({ garmentId: 'g10', condition: 'good', note: '  Très doux. ', circle: null })
    expect(listing).toMatchObject({ note: 'Très doux.', ownerId: ME, status: 'open' })
    // Pas de jeton à la mise en ligne : on ne gagne rien avec une annonce fictive.
    expect(await tokens(repository)).toEqual({ available: 1, held: 0 })
    await expect(
      repository.publishListing({ garmentId: 'g10', condition: 'good', note: null, circle: null }),
    ).rejects.toThrow('déjà proposée')

    const swap = await repository.simulateIncomingReservation()
    expect(swap.giverId).toBe(ME)
    expect(swap.messages).toHaveLength(1)
    // Le donneur ne bloque rien.
    expect(await tokens(repository)).toEqual({ available: 1, held: 0 })

    await repository.completeSwap(swap.id, swap.handoverCode)
    expect(await tokens(repository)).toEqual({ available: 2, held: 0 })
    expect((await repository.getGarment('g10'))?.status).toBe('swapped_out')
  })

  it('donner une pièce proposée retire son annonce', async () => {
    const repository = setup()
    await repository.acceptCommunityRules()
    const listing = await repository.publishListing({ garmentId: 'g08', condition: 'good', note: null, circle: null })
    await repository.setGarmentStatus('g08', 'donated')
    expect((await repository.getSwapState()).listings.find((l) => l.id === listing.id)?.status).toBe('cancelled')
  })

  it('sans annonce ouverte, la simulation explique quoi faire', async () => {
    const repository = setup()
    await expect(repository.simulateIncomingReservation()).rejects.toThrow('Propose d’abord une pièce')
  })
})

import { describe, expect, it } from 'vitest'
import { balanceOf, heldCredits } from '../domain/credits'
import { ME } from '../domain/swaps'
import { createLocalRepository } from './local'

const TODAY = '2026-10-27'

function setup() {
  return createLocalRepository({ storage: null, startDate: TODAY })
}

async function credits(repository: ReturnType<typeof setup>) {
  const { ledger } = await repository.getSwapState()
  return { balance: balanceOf(ledger), held: heldCredits(ledger) }
}

describe('bourse simulée : recevoir une pièce', () => {
  it('démarre avec 2 crédits gagnés lors d’un échange passé', async () => {
    const repository = setup()
    const state = await repository.getSwapState()
    expect(await credits(repository)).toEqual({ balance: 2, held: 0 })
    expect(state.listings.filter((l) => l.ownerId !== ME && l.status === 'open')).toHaveLength(10)
    expect(state.swaps.filter((s) => s.status === 'completed')).toHaveLength(1)
  })

  it('réserver bloque les crédits, puis la remise fait entrer la pièce avec sa fiche', async () => {
    const repository = setup()
    // l1 : Pull marin rayé, 2 crédits.
    const swap = await repository.reserveListing('l1')
    expect(await credits(repository)).toEqual({ balance: 0, held: 2 })
    expect((await repository.getSwapState()).listings.find((l) => l.id === 'l1')?.status).toBe('reserved')

    await repository.scheduleSwap(swap.id, 'Place de Jaude', 'Demain, 18 h')
    await expect(repository.completeSwap(swap.id, 'MAUVAIS')).rejects.toThrow('ne correspond pas')
    const { receivedGarment } = await repository.completeSwap(swap.id, swap.handoverCode)

    expect(await credits(repository)).toEqual({ balance: 0, held: 0 })
    expect(receivedGarment).toMatchObject({ name: 'Pull marin rayé', category: 'long', size: 'M', source: 'swap' })
    const garments = await repository.listGarments()
    expect(garments.find((g) => g.id === receivedGarment?.id)?.status).toBe('active')
    const done = (await repository.getSwapState()).swaps.find((s) => s.id === swap.id)
    expect(done?.status).toBe('completed')
  })

  it('refuse sans assez de crédits, avec un message clair', async () => {
    const repository = setup()
    // l4 : doudoune, 3 crédits pour un solde de 2.
    await expect(repository.reserveListing('l4')).rejects.toThrow('Il te manque des crédits')
    expect(await credits(repository)).toEqual({ balance: 2, held: 0 })
  })

  it('annuler débloque les crédits et remet l’annonce en ligne', async () => {
    const repository = setup()
    const swap = await repository.reserveListing('l6')
    await repository.cancelSwap(swap.id)
    expect(await credits(repository)).toEqual({ balance: 2, held: 0 })
    expect((await repository.getSwapState()).listings.find((l) => l.id === 'l6')?.status).toBe('open')
  })

  it('le membre répond aux messages', async () => {
    const repository = setup()
    const swap = await repository.reserveListing('l6')
    const updated = await repository.sendSwapMessage(swap.id, 'Bonjour !')
    expect(updated.messages.map((m) => m.senderId)).toEqual([ME, 'm1'])
    await expect(repository.sendSwapMessage(swap.id, '   ')).rejects.toThrow('Écris un message')
  })

  it('une réservation sans rendez-vous expire après 72 h', async () => {
    const repository = setup()
    await repository.reserveListing('l6')
    await repository.advanceDay()
    await repository.advanceDay()
    expect(await credits(repository)).toEqual({ balance: 1, held: 1 })
    await repository.advanceDay()
    await repository.advanceDay()
    expect(await credits(repository)).toEqual({ balance: 2, held: 0 })
  })
})

describe('bourse simulée : donner une pièce', () => {
  it('demande d’accepter les règles avant la première annonce', async () => {
    const repository = setup()
    await expect(
      repository.publishListing({ garmentId: 'g10', condition: 'good', note: null, circle: null }),
    ).rejects.toThrow('règles')
  })

  it('publier, se faire réserver, remettre : crédits gagnés et pièce sortie du dressing', async () => {
    const repository = setup()
    await repository.acceptCommunityRules()
    // g10 : Pull col rond gris (long, 2 crédits).
    const listing = await repository.publishListing({ garmentId: 'g10', condition: 'good', note: '  Très doux. ', circle: null })
    expect(listing).toMatchObject({ credits: 2, note: 'Très doux.', ownerId: ME, status: 'open' })
    await expect(
      repository.publishListing({ garmentId: 'g10', condition: 'good', note: null, circle: null }),
    ).rejects.toThrow('déjà proposée')

    const swap = await repository.simulateIncomingReservation()
    expect(swap.giverId).toBe(ME)
    expect(swap.messages).toHaveLength(1)
    // Le donneur ne bloque rien.
    expect(await credits(repository)).toEqual({ balance: 2, held: 0 })

    await repository.completeSwap(swap.id, swap.handoverCode)
    expect(await credits(repository)).toEqual({ balance: 4, held: 0 })
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

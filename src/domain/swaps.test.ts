import { describe, expect, it } from 'vitest'
import {
  ME,
  NEIGHBORHOOD_NAMES,
  activeListingFor,
  formatDistance,
  listingsNear,
  neighborhoodDistanceKm,
  filterListings,
  fitsMySizes,
  handoverCodeFor,
  isSwapOpen,
  listedGarmentIds,
  openReservationsOf,
  sizeFor,
  swapRole,
} from './swaps'
import type { MySizes, Swap, SwapListing } from './swaps'

const SIZES: MySizes = { top: 'M', bottom: '38', shoes: '39' }

function listing(overrides: Partial<SwapListing> & { id: string }): SwapListing {
  return {
    ownerId: 'm1',
    garmentId: null,
    item: { name: 'Pull', category: 'long', color: null, size: 'M', brand: null, agreement: 'm' },
    condition: 'good',
    note: null,
    city: 'Clermont-Ferrand',
    circle: null,
    status: 'open',
    createdAt: '2026-10-27T10:00:00.000Z',
    ...overrides,
  }
}

function swap(overrides: Partial<Swap>): Swap {
  return {
    id: 's1',
    listingId: 'l1',
    giverId: 'm1',
    receiverId: ME,
    status: 'reserved',
    meetingPlace: null,
    meetingSlot: null,
    handoverCode: 'ABC',
    reservedAt: '2026-10-27T10:00:00.000Z',
    expiresAt: '2026-10-30T10:00:00.000Z',
    completedAt: null,
    messages: [],
    myRating: null,
    ...overrides,
  }
}

describe('tailles', () => {
  it('compare la bonne taille selon la catégorie', () => {
    expect(sizeFor('tee', SIZES)).toBe('M')
    expect(sizeFor('pants', SIZES)).toBe('38')
    expect(sizeFor('shoes', SIZES)).toBe('39')
    expect(sizeFor('other', SIZES)).toBeNull()
  })

  it('ignore la casse et les espaces, et montre les pièces sans taille', () => {
    expect(fitsMySizes({ category: 'long', size: ' m ' }, SIZES)).toBe(true)
    expect(fitsMySizes({ category: 'long', size: 'L' }, SIZES)).toBe(false)
    expect(fitsMySizes({ category: 'pants', size: null }, SIZES)).toBe(true)
    expect(fitsMySizes({ category: 'other', size: 'XL' }, SIZES)).toBe(true)
  })
})

describe('Bourse', () => {
  const all = [
    listing({ id: 'a' }),
    listing({ id: 'b', item: { name: 'Jean', category: 'pants', color: null, size: '42', brand: null, agreement: 'm' } }),
    listing({ id: 'c', status: 'reserved' }),
    listing({ id: 'd', ownerId: ME }),
    listing({ id: 'e', item: { name: 'Robe', category: 'dress', color: null, size: 'M', brand: null, agreement: 'f' } }),
  ]

  it('ne montre que les annonces ouvertes des autres membres', () => {
    const ids = filterListings(all, { category: 'all', mySizesOnly: false, sizes: SIZES, memberId: ME }).map((l) => l.id)
    expect(ids).toEqual(['a', 'b', 'e'])
  })

  it('filtre par catégorie et par taille', () => {
    expect(filterListings(all, { category: 'tops', mySizesOnly: false, sizes: SIZES, memberId: ME }).map((l) => l.id)).toEqual(['a'])
    expect(filterListings(all, { category: 'all', mySizesOnly: true, sizes: SIZES, memberId: ME }).map((l) => l.id)).toEqual(['a', 'e'])
  })

  it('liste les pièces du dressing en ligne', () => {
    const mine = [listing({ id: 'x', garmentId: 'g01', status: 'cancelled' }), listing({ id: 'y', garmentId: 'g02' })]
    expect([...listedGarmentIds(mine)]).toEqual(['g02'])
  })

  it('trouve l’annonce en cours d’une pièce du dressing', () => {
    const mine = [listing({ id: 'x', garmentId: 'g01', status: 'cancelled' }), listing({ id: 'y', garmentId: 'g01', status: 'reserved' })]
    expect(activeListingFor(mine, 'g01')?.id).toBe('y')
    expect(activeListingFor(mine, 'g02')).toBeNull()
  })
})

describe('échanges', () => {
  it('compte les réservations en cours de l’utilisateur', () => {
    const swaps = [
      swap({ id: '1' }),
      swap({ id: '2', status: 'scheduled' }),
      swap({ id: '3', status: 'completed' }),
      swap({ id: '4', giverId: ME, receiverId: 'm2' }),
    ]
    expect(openReservationsOf(swaps, ME)).toBe(2)
    expect(isSwapOpen({ status: 'cancelled' })).toBe(false)
  })

  it('donne le rôle de l’utilisateur', () => {
    expect(swapRole({ giverId: ME }, ME)).toBe('giver')
    expect(swapRole({ giverId: 'm1' }, ME)).toBe('receiver')
  })

  it('fabrique un code de remise stable à 12 caractères', () => {
    expect(handoverCodeFor('s1')).toMatch(/^[0-9A-F]{12}$/)
    expect(handoverCodeFor('s1')).toBe(handoverCodeFor('s1'))
    expect(handoverCodeFor('s1')).not.toBe(handoverCodeFor('s2'))
  })
})

describe('localisation par quartier', () => {
  const members = [
    { id: 'a', displayName: 'A', neighborhood: 'Jaude', rating: null, swapsCount: 0, memberSince: '' },
    { id: 'b', displayName: 'B', neighborhood: 'Les Cézeaux', rating: null, swapsCount: 0, memberSince: '' },
    { id: 'c', displayName: 'C', neighborhood: 'Saint-Jacques', rating: null, swapsCount: 0, memberSince: '' },
    { id: 'd', displayName: 'D', neighborhood: 'Quartier inconnu', rating: null, swapsCount: 0, memberSince: '' },
  ]
  const list = [listing({ id: 'lb', ownerId: 'b' }), listing({ id: 'la', ownerId: 'a' }), listing({ id: 'lc', ownerId: 'c' }), listing({ id: 'ld', ownerId: 'd' })]

  it('donne une distance arrondie au demi-kilomètre, symétrique, nulle dans le même quartier', () => {
    expect(neighborhoodDistanceKm('Jaude', 'Jaude')).toBe(0)
    expect(neighborhoodDistanceKm('Jaude', 'Saint-Jacques')).toBe(1.5)
    expect(neighborhoodDistanceKm('Saint-Jacques', 'Jaude')).toBe(1.5)
    expect(neighborhoodDistanceKm('Jaude', 'Nulle part')).toBeNull()
  })

  it('formate sans jamais être plus précis que le quartier', () => {
    expect(formatDistance(0)).toBe('Ton quartier')
    expect(formatDistance(1.5)).toBe('~1,5 km')
    expect(formatDistance(null)).toBe('Distance inconnue')
  })

  it('filtre par rayon et trie du plus proche au plus loin', () => {
    expect(listingsNear(list, members, 'Jaude', 3).map((n) => n.listing.id)).toEqual(['la', 'lc'])
    expect(listingsNear(list, members, 'Jaude', 1).map((n) => n.listing.id)).toEqual(['la'])
    // Toute la ville : la distance inconnue passe en dernier.
    expect(listingsNear(list, members, 'Jaude', null).map((n) => n.listing.id)).toEqual(['la', 'lc', 'lb', 'ld'])
  })

  it('connaît le quartier de chaque membre de la démo', () => {
    for (const name of ['Jaude', 'Les Cézeaux', 'Saint-Jacques', 'Montferrand', 'Chamalières', 'La Gauthière']) {
      expect(NEIGHBORHOOD_NAMES).toContain(name)
    }
  })
})

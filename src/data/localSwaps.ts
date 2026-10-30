// Simulateur de la bourse d'échange : joue le rôle du serveur (fonctions RPC de docs/04-donnees.md).
// Chaque fonction prend l'état et renvoie le nouvel état, sans rien modifier en place. C'est ici, et seulement ici,
// que le registre des jetons change : les écrans passent par SwapRepository (CLAUDE.md, règle 4).
import { RESERVE_REFUSAL_MESSAGES, TOKENS_PER_GARMENT, balanceOf, canReserve, reservationExpiresAt } from '../domain/tokens'
import { ME, activeListingFor, handoverCodeFor, isSwapOpen, openReservationsOf } from '../domain/swaps'
import type { Swap, SwapListing } from '../domain/swaps'
import type { Garment, IsoDate, LedgerEntry } from '../domain/types'
import { LISTING_NOT_FOUND_MESSAGE, NOT_FOUND_MESSAGE, SWAP_NOT_FOUND_MESSAGE } from './repository'
import type { PublishListingInput } from './repository'
import { SIMULATED_REPLIES, stamp } from './sampleCommunity'
import type { CommunityState } from './sampleCommunity'

export interface SwapWorld {
  community: CommunityState
  garments: Garment[]
  today: IsoDate
}

type Change<T> = { world: SwapWorld; value: T }

/** Fait avancer l'horloge simulée de quelques minutes et renvoie l'horodatage. */
function tick(world: SwapWorld, minutes = 1): { world: SwapWorld; at: string } {
  const clock = world.community.clock + minutes
  return { world: { ...world, community: { ...world.community, clock } }, at: stamp(world.today, clock) }
}

function nextId(world: SwapWorld, prefix: string): { world: SwapWorld; id: string } {
  const n = world.community.nextNumber
  return { world: { ...world, community: { ...world.community, nextNumber: n + 1 } }, id: `${prefix}${n}` }
}

function findListing(world: SwapWorld, id: string): SwapListing {
  const listing = world.community.listings.find((l) => l.id === id)
  if (!listing) throw new Error(LISTING_NOT_FOUND_MESSAGE)
  return listing
}

function findSwap(world: SwapWorld, id: string): Swap {
  const swap = world.community.swaps.find((s) => s.id === id)
  if (!swap) throw new Error(SWAP_NOT_FOUND_MESSAGE)
  return swap
}

function withListing(world: SwapWorld, listing: SwapListing): SwapWorld {
  const listings = world.community.listings.map((l) => (l.id === listing.id ? listing : l))
  return { ...world, community: { ...world.community, listings } }
}

function withSwap(world: SwapWorld, swap: Swap): SwapWorld {
  const exists = world.community.swaps.some((s) => s.id === swap.id)
  const swaps = exists ? world.community.swaps.map((s) => (s.id === swap.id ? swap : s)) : [...world.community.swaps, swap]
  return { ...world, community: { ...world.community, swaps } }
}

/** Écriture dans le registre de l'utilisateur. Les autres membres n'ont pas de registre dans la simulation. */
function addLedger(world: SwapWorld, entries: Omit<LedgerEntry, 'createdAt'>[], at: string): SwapWorld {
  const ledger = [...world.community.ledger, ...entries.map((e) => ({ ...e, createdAt: at }))]
  return { ...world, community: { ...world.community, ledger } }
}

function assertOpen(swap: Swap): void {
  if (!isSwapOpen(swap)) throw new Error('Cet échange est déjà terminé.')
}

export function publishListing(world: SwapWorld, input: PublishListingInput): Change<SwapListing> {
  const garment = world.garments.find((g) => g.id === input.garmentId)
  if (!garment) throw new Error(NOT_FOUND_MESSAGE)
  if (garment.status !== 'active') throw new Error('Cette pièce n’est plus dans ton dressing.')
  if (activeListingFor(world.community.listings, garment.id)) throw new Error('Cette pièce est déjà proposée à l’échange.')
  if (!world.community.rulesAccepted) throw new Error('Accepte d’abord les règles de la communauté.')
  const note = input.note?.trim() || null
  let w = world
  const idResult = nextId(w, 'l-me-')
  w = idResult.world
  const time = tick(w)
  w = time.world
  const listing: SwapListing = {
    id: idResult.id,
    ownerId: ME,
    garmentId: garment.id,
    item: {
      name: garment.name,
      category: garment.category,
      color: garment.color,
      size: garment.size,
      brand: garment.brand,
      agreement: garment.agreement,
    },
    condition: input.condition,
    note,
    city: w.community.city,
    circle: input.circle,
    status: 'open',
    createdAt: time.at,
  }
  w = { ...w, community: { ...w.community, listings: [...w.community.listings, listing] } }
  return { world: w, value: listing }
}

export function withdrawListing(world: SwapWorld, listingId: string): SwapWorld {
  const listing = findListing(world, listingId)
  if (listing.ownerId !== ME) throw new Error('Ce n’est pas ton annonce.')
  if (listing.status !== 'open') throw new Error('Cette annonce est réservée : annule d’abord l’échange.')
  return withListing(world, { ...listing, status: 'cancelled' })
}

/** reserve_listing : contrôles, blocage d'1 jeton, annonce réservée. */
export function reserveListing(world: SwapWorld, listingId: string, receiverId = ME): Change<Swap> {
  const listing = findListing(world, listingId)
  if (listing.status !== 'open') throw new Error('Cette pièce vient d’être réservée par quelqu’un d’autre.')
  if (receiverId === ME) {
    const check = canReserve({
      isAdult: world.community.isAdult,
      isOwner: listing.ownerId === ME,
      openReservations: openReservationsOf(world.community.swaps, ME),
      balance: balanceOf(world.community.ledger),
      cost: TOKENS_PER_GARMENT,
    })
    if (!check.ok) throw new Error(RESERVE_REFUSAL_MESSAGES[check.reason])
  }
  let w = world
  const idResult = nextId(w, 's')
  w = idResult.world
  const time = tick(w)
  w = time.world
  const swap: Swap = {
    id: idResult.id,
    listingId: listing.id,
    giverId: listing.ownerId,
    receiverId,
    status: 'reserved',
    meetingPlace: null,
    meetingSlot: null,
    handoverCode: handoverCodeFor(`${idResult.id}:${listing.id}`),
    reservedAt: time.at,
    expiresAt: reservationExpiresAt(time.at),
    completedAt: null,
    messages: [],
    myRating: null,
  }
  w = withListing(w, { ...listing, status: 'reserved' })
  w = withSwap(w, swap)
  if (receiverId === ME) w = addLedger(w, [{ amount: -TOKENS_PER_GARMENT, reason: 'hold', swapId: swap.id }], time.at)
  return { world: w, value: swap }
}

/** schedule_swap : lieu public et créneau ; le membre fictif confirme. */
export function scheduleSwap(world: SwapWorld, swapId: string, place: string, slot: string): Change<Swap> {
  const swap = findSwap(world, swapId)
  assertOpen(swap)
  if (place.trim() === '' || slot.trim() === '') throw new Error('Choisis un lieu et un créneau.')
  let w = world
  const mine = tick(w)
  w = mine.world
  const reply = tick(w, 2)
  w = reply.world
  const other = swap.giverId === ME ? swap.receiverId : swap.giverId
  const updated: Swap = {
    ...swap,
    status: 'scheduled',
    meetingPlace: place,
    meetingSlot: slot,
    messages: [
      ...swap.messages,
      { senderId: ME, body: `Rendez-vous proposé : ${place}, ${slot.toLowerCase()}.`, createdAt: mine.at },
      { senderId: other, body: 'C’est noté, à bientôt !', createdAt: reply.at },
    ],
  }
  return { world: withSwap(w, updated), value: updated }
}

/** Messagerie liée à l'échange ; le membre fictif répond aussitôt. */
export function sendSwapMessage(world: SwapWorld, swapId: string, body: string): Change<Swap> {
  const swap = findSwap(world, swapId)
  const text = body.trim()
  if (text === '') throw new Error('Écris un message.')
  if (text.length > 1000) throw new Error('Message trop long (1 000 caractères au plus).')
  let w = world
  const mine = tick(w)
  w = mine.world
  const reply = tick(w, 2)
  w = reply.world
  const other = swap.giverId === ME ? swap.receiverId : swap.giverId
  const sentByMe = swap.messages.filter((m) => m.senderId === ME).length
  const updated: Swap = {
    ...swap,
    messages: [
      ...swap.messages,
      { senderId: ME, body: text, createdAt: mine.at },
      { senderId: other, body: SIMULATED_REPLIES[sentByMe % SIMULATED_REPLIES.length], createdAt: reply.at },
    ],
  }
  return { world: withSwap(w, updated), value: updated }
}

/**
 * complete_swap : tout en une fois, comme la transaction serveur de docs/03.
 * Receveur : release + spend, et la pièce arrive dans son dressing avec sa fiche. Donneur : earn, pièce sortie.
 */
export function completeSwap(
  world: SwapWorld,
  swapId: string,
  handoverCode: string,
  newGarmentId: string,
): Change<{ swap: Swap; receivedGarment: Garment | null }> {
  const swap = findSwap(world, swapId)
  assertOpen(swap)
  if (handoverCode.trim().toUpperCase() !== swap.handoverCode) throw new Error('Ce code ne correspond pas à cet échange.')
  const listing = findListing(world, swap.listingId)
  let w = world
  const time = tick(w)
  w = time.world
  const completed: Swap = { ...swap, status: 'completed', completedAt: time.at }
  w = withSwap(w, completed)
  w = withListing(w, { ...listing, status: 'completed' })

  let receivedGarment: Garment | null = null
  if (swap.receiverId === ME) {
    w = addLedger(
      w,
      [
        { amount: TOKENS_PER_GARMENT, reason: 'release', swapId: swap.id },
        { amount: -TOKENS_PER_GARMENT, reason: 'spend', swapId: swap.id },
      ],
      time.at,
    )
    // Zéro saisie : la fiche de l'annonce devient une pièce du dressing.
    receivedGarment = {
      id: newGarmentId,
      name: listing.item.name,
      category: listing.item.category,
      color: listing.item.color,
      size: listing.item.size,
      brand: listing.item.brand,
      photoPath: null,
      agreement: listing.item.agreement,
      source: 'swap',
      originGarmentId: listing.garmentId,
      acquiredAt: w.today,
      lastWornAt: null,
      laundryUntil: null,
      status: 'active',
    }
    w = { ...w, garments: [...w.garments, receivedGarment] }
  } else {
    w = addLedger(w, [{ amount: TOKENS_PER_GARMENT, reason: 'earn', swapId: swap.id }], time.at)
    w = { ...w, garments: w.garments.map((g) => (g.id === listing.garmentId ? { ...g, status: 'swapped_out' } : g)) }
  }
  return { world: w, value: { swap: completed, receivedGarment } }
}

/** cancel_swap : jeton débloqué, annonce remise en ligne. */
export function cancelSwap(world: SwapWorld, swapId: string): Change<Swap> {
  const swap = findSwap(world, swapId)
  assertOpen(swap)
  let w = world
  const time = tick(w)
  w = time.world
  const cancelled: Swap = { ...swap, status: 'cancelled' }
  w = withSwap(w, cancelled)
  const listing = findListing(w, swap.listingId)
  w = withListing(w, { ...listing, status: 'open' })
  if (swap.receiverId === ME) w = addLedger(w, [{ amount: TOKENS_PER_GARMENT, reason: 'release', swapId: swap.id }], time.at)
  return { world: w, value: cancelled }
}

export function rateSwap(world: SwapWorld, swapId: string, rating: number): Change<Swap> {
  const swap = findSwap(world, swapId)
  if (swap.status !== 'completed') throw new Error('Tu pourras noter l’échange après la remise.')
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('La note va de 1 à 5.')
  const rated: Swap = { ...swap, myRating: rating }
  return { world: withSwap(world, rated), value: rated }
}

/** Démo : un membre fictif réserve la première annonce ouverte de l'utilisateur et propose un rendez-vous. */
export function simulateIncomingReservation(world: SwapWorld): Change<Swap> {
  const mine = world.community.listings.find((l) => l.ownerId === ME && l.status === 'open')
  if (!mine) throw new Error('Propose d’abord une pièce à l’échange.')
  // Le membre qui a fait le moins d'échanges en cours.
  const busy = new Set(world.community.swaps.filter(isSwapOpen).map((s) => s.receiverId))
  const member = world.community.members.find((m) => !busy.has(m.id)) ?? world.community.members[0]
  const reserved = reserveListing(world, mine.id, member.id)
  let w = reserved.world
  const time = tick(w)
  w = time.world
  const swap: Swap = {
    ...reserved.value,
    messages: [
      {
        senderId: member.id,
        body: `Bonjour ! Ta pièce « ${mine.item.name} » m’intéresse beaucoup. Tu peux me la remettre cette semaine ?`,
        createdAt: time.at,
      },
    ],
  }
  return { world: withSwap(w, swap), value: swap }
}

/** expire_swaps : réservations sans rendez-vous depuis 72 h annulées, jeton débloqué (appelé chaque jour). */
export function expireReservations(world: SwapWorld): SwapWorld {
  const now = stamp(world.today, 0)
  let w = world
  for (const swap of world.community.swaps) {
    if (swap.status === 'reserved' && swap.expiresAt <= now) w = cancelSwap(w, swap.id).world
  }
  return w
}

/** Une pièce donnée, vendue ou archivée ne peut plus être proposée : son annonce ouverte est retirée. */
export function withdrawListingsOfInactive(world: SwapWorld): SwapWorld {
  const inactive = new Set(world.garments.filter((g) => g.status !== 'active').map((g) => g.id))
  const listings = world.community.listings.map((l) =>
    l.ownerId === ME && l.status === 'open' && l.garmentId !== null && inactive.has(l.garmentId)
      ? { ...l, status: 'cancelled' as const }
      : l,
  )
  return { ...world, community: { ...world.community, listings } }
}

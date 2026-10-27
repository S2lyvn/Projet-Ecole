// Bourse d'échange entre membres (docs/03-communaute-echange.md) : types et règles d'affichage.
// Les écritures (réserver, remettre, crédits) sont faites par le « serveur » : le simulateur local aujourd'hui,
// les fonctions RPC Supabase à l'étape 4. Rien ici ne modifie un solde.
import type { Agreement, GarmentCategory, IsoDateTime, ItemCondition } from './types'

/** Identifiant de l'utilisateur de l'appli dans la bourse. */
export const ME = 'me'

export interface Member {
  id: string
  displayName: string
  neighborhood: string
  /** Note moyenne sur 5, ou null sans avis. */
  rating: number | null
  swapsCount: number
  memberSince: string
}

/** Fiche de la pièce telle qu'elle voyage avec l'annonce : elle arrive remplie chez le receveur. */
export interface ListingItem {
  name: string
  category: GarmentCategory
  color: string | null
  size: string | null
  brand: string | null
  agreement: Agreement
}

export const LISTING_STATUSES = ['open', 'reserved', 'completed', 'cancelled', 'expired'] as const
export type ListingStatus = (typeof LISTING_STATUSES)[number]

export interface SwapListing {
  id: string
  ownerId: string
  /** Pièce du dressing de l'utilisateur quand c'est son annonce ; null pour les autres membres. */
  garmentId: string | null
  item: ListingItem
  credits: number
  condition: ItemCondition
  note: string | null
  city: string
  /** Cercle privé, ou null pour la ville. */
  circle: string | null
  status: ListingStatus
  createdAt: IsoDateTime
}

export const SWAP_STATUSES = ['reserved', 'scheduled', 'completed', 'cancelled', 'no_show', 'refused'] as const
export type SwapStatus = (typeof SWAP_STATUSES)[number]

export interface SwapMessage {
  senderId: string
  body: string
  createdAt: IsoDateTime
}

export interface Swap {
  id: string
  listingId: string
  giverId: string
  receiverId: string
  credits: number
  status: SwapStatus
  meetingPlace: string | null
  /** Créneau choisi (« Demain, 18 h ») ; meeting_at en base à l'étape 4. */
  meetingSlot: string | null
  /** Contenu du QR code de remise (12 caractères). */
  handoverCode: string
  reservedAt: IsoDateTime
  expiresAt: IsoDateTime
  completedAt: IsoDateTime | null
  messages: SwapMessage[]
  /** Note laissée par l'utilisateur après la remise, 1 à 5. */
  myRating: number | null
}

export interface MySizes {
  top: string
  bottom: string
  shoes: string
}

/** Lieux publics suggérés pour la remise : jamais d'adresse personnelle (docs/03). */
export const MEETING_PLACES = [
  'Campus des Cézeaux, hall de la bibliothèque',
  'Place de Jaude, devant la statue de Vercingétorix',
  'Médiathèque de Jaude, entrée principale',
  'Gare de Clermont-Ferrand, hall d’accueil',
  'Clermont School of Business, accueil',
] as const

export const MEETING_SLOTS = ['Demain, 12 h 30', 'Demain, 18 h', 'Après-demain, 12 h 30', 'Samedi, 11 h'] as const

export const SWAP_STATUS_LABELS: Record<SwapStatus, string> = {
  reserved: 'Réservée',
  scheduled: 'Rendez-vous fixé',
  completed: 'Remise faite',
  cancelled: 'Annulé',
  no_show: 'Absence signalée',
  refused: 'Refusée à la remise',
}

/** Échange encore en cours (crédits bloqués côté receveur). */
export function isSwapOpen(swap: Pick<Swap, 'status'>): boolean {
  return swap.status === 'reserved' || swap.status === 'scheduled'
}

/** Réservations en cours de l'utilisateur comme receveur (limite de 3, docs/03). */
export function openReservationsOf(swaps: readonly Swap[], memberId: string): number {
  return swaps.filter((s) => s.receiverId === memberId && isSwapOpen(s)).length
}

/** Rôle de l'utilisateur dans un échange. */
export function swapRole(swap: Pick<Swap, 'giverId'>, memberId: string): 'giver' | 'receiver' {
  return swap.giverId === memberId ? 'giver' : 'receiver'
}

/** Taille du profil à comparer selon la catégorie de la pièce. */
export function sizeFor(category: GarmentCategory, sizes: MySizes): string | null {
  switch (category) {
    case 'tee':
    case 'long':
    case 'dress':
    case 'outerwear':
      return sizes.top
    case 'pants':
      return sizes.bottom
    case 'shoes':
      return sizes.shoes
    case 'other':
      return null
  }
}

/** La pièce est-elle à ma taille ? Taille absente ou catégorie sans taille : on la montre. */
export function fitsMySizes(item: Pick<ListingItem, 'category' | 'size'>, sizes: MySizes): boolean {
  const mine = sizeFor(item.category, sizes)
  if (mine === null || item.size === null) return true
  return item.size.trim().toLowerCase() === mine.trim().toLowerCase()
}

export type ListingCategoryFilter = 'all' | 'tops' | 'bottoms' | 'dress' | 'shoes' | 'outerwear'

const FILTER_CATEGORIES: Record<Exclude<ListingCategoryFilter, 'all'>, readonly GarmentCategory[]> = {
  tops: ['tee', 'long'],
  bottoms: ['pants'],
  dress: ['dress'],
  shoes: ['shoes'],
  outerwear: ['outerwear'],
}

/** Annonces visibles dans la Bourse : ouvertes, d'autres membres, filtrées par catégorie et taille. */
export function filterListings(
  listings: readonly SwapListing[],
  filters: { category: ListingCategoryFilter; mySizesOnly: boolean; sizes: MySizes; memberId: string },
): SwapListing[] {
  return listings.filter((l) => {
    if (l.status !== 'open' || l.ownerId === filters.memberId) return false
    if (filters.category !== 'all' && !FILTER_CATEGORIES[filters.category].includes(l.item.category)) return false
    return !filters.mySizesOnly || fitsMySizes(l.item, filters.sizes)
  })
}

/** Annonce ouverte ou réservée pour une pièce du dressing (une seule à la fois, index unique de docs/04). */
export function activeListingFor(listings: readonly SwapListing[], garmentId: string): SwapListing | null {
  return listings.find((l) => l.garmentId === garmentId && (l.status === 'open' || l.status === 'reserved')) ?? null
}

/** Pièces du dressing actuellement dans la bourse (annonce ouverte ou réservée). */
export function listedGarmentIds(listings: readonly SwapListing[]): Set<string> {
  const ids = new Set<string>()
  for (const l of listings) {
    if (l.garmentId !== null && (l.status === 'open' || l.status === 'reserved')) ids.add(l.garmentId)
  }
  return ids
}

/** Code de remise à 12 caractères hexadécimaux, déterministe (le serveur le tirera au hasard, docs/04). */
export function handoverCodeFor(seed: string): string {
  let a = 0x811c9dc5
  let b = 0x01000193
  for (let i = 0; i < seed.length; i++) {
    a = Math.imul(a ^ seed.charCodeAt(i), 0x01000193) >>> 0
    b = Math.imul(b + seed.charCodeAt(i), 0x5bd1e995) >>> 0
  }
  return (a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0')).slice(0, 12).toUpperCase()
}

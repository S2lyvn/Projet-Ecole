// DONNÉES D'EXEMPLE (CLAUDE.md, règle 6) : membres, annonces et échange passé FICTIFS, pour simuler la bourse.
// Aucun de ces membres n'existe. Les lieux de rendez-vous sont des lieux publics réels de Clermont-Ferrand.
import { creditsFor } from '../domain/credits'
import { ME, handoverCodeFor } from '../domain/swaps'
import type { ListingItem, Member, MySizes, Swap, SwapListing } from '../domain/swaps'
import type { IsoDate, IsoDateTime, ItemCondition, LedgerEntry } from '../domain/types'

export const DEMO_CITY = 'Clermont-Ferrand'
export const DEMO_SIZES: MySizes = { top: 'M', bottom: '38', shoes: '39' }
/** Cercle privé d'exemple (docs/03 : premier test sur le campus). */
export const DEMO_CIRCLE = 'Promo CSB (exemple)'

/** Partie « communauté » de l'état local. */
export interface CommunityState {
  members: Member[]
  listings: SwapListing[]
  swaps: Swap[]
  ledger: LedgerEntry[]
  sizes: MySizes
  city: string
  isAdult: boolean
  rulesAccepted: boolean
  /** Horloge simulée (minutes écoulées dans la journée) et compteur d'ids, pour rester déterministe. */
  clock: number
  nextNumber: number
}

const MEMBERS: Member[] = [
  { id: 'm1', displayName: 'Inès', neighborhood: 'Jaude', rating: 4.9, swapsCount: 12, memberSince: 'mars 2026' },
  { id: 'm2', displayName: 'Léo', neighborhood: 'Les Cézeaux', rating: 4.7, swapsCount: 5, memberSince: 'juin 2026' },
  { id: 'm3', displayName: 'Sarah', neighborhood: 'Saint-Jacques', rating: 5, swapsCount: 8, memberSince: 'avril 2026' },
  { id: 'm4', displayName: 'Hugo', neighborhood: 'Montferrand', rating: 4.5, swapsCount: 3, memberSince: 'sept. 2026' },
  { id: 'm5', displayName: 'Chloé', neighborhood: 'Chamalières', rating: 4.8, swapsCount: 15, memberSince: 'janv. 2026' },
  { id: 'm6', displayName: 'Yanis', neighborhood: 'La Gauthière', rating: null, swapsCount: 0, memberSince: 'oct. 2026' },
]

interface SampleListing {
  ownerId: string
  item: ListingItem
  condition: ItemCondition
  note: string | null
  circle?: string
  /** Jours depuis la mise en ligne. */
  age: number
}

const SAMPLE_LISTINGS: SampleListing[] = [
  {
    ownerId: 'm1',
    item: { name: 'Pull marin rayé', category: 'long', color: '#2B3F8F', size: 'M', brand: null, agreement: 'm' },
    condition: 'very_good',
    note: 'Porté trois fois, trop grand pour moi.',
    age: 1,
  },
  {
    ownerId: 'm2',
    item: { name: 'Jean mom bleu clair', category: 'pants', color: '#8DB4E8', size: '38', brand: null, agreement: 'm' },
    condition: 'good',
    note: null,
    age: 2,
  },
  {
    ownerId: 'm3',
    item: { name: 'Robe fleurie d’été', category: 'dress', color: '#F28CA8', size: 'M', brand: null, agreement: 'f' },
    condition: 'new_with_tag',
    note: 'Jamais portée, étiquette encore là.',
    age: 0,
  },
  {
    ownerId: 'm4',
    item: { name: 'Doudoune légère kaki', category: 'outerwear', color: '#6B7A45', size: 'L', brand: null, agreement: 'f' },
    condition: 'very_good',
    note: null,
    age: 4,
  },
  {
    ownerId: 'm5',
    item: { name: 'Baskets en toile écrue', category: 'shoes', color: '#E8E1CF', size: '39', brand: null, agreement: 'fp' },
    condition: 'good',
    note: 'Lavées en machine.',
    age: 3,
  },
  {
    ownerId: 'm1',
    item: { name: 'T-shirt rayé rouge', category: 'tee', color: '#D9534F', size: 'S', brand: null, agreement: 'm' },
    condition: 'good',
    note: null,
    age: 5,
  },
  {
    ownerId: 'm3',
    item: { name: 'Chemise en jean', category: 'long', color: '#4A6FA5', size: 'M', brand: null, agreement: 'f' },
    condition: 'very_good',
    note: null,
    circle: DEMO_CIRCLE,
    age: 1,
  },
  {
    ownerId: 'm5',
    item: { name: 'Jupe plissée moutarde', category: 'pants', color: '#D9A520', size: '38', brand: null, agreement: 'f' },
    condition: 'fair',
    note: 'Petite tache discrète sur l’ourlet, signalée.',
    age: 6,
  },
  {
    ownerId: 'm6',
    item: { name: 'Sweat à col zippé', category: 'long', color: '#7E8C9A', size: 'M', brand: null, agreement: 'm' },
    condition: 'good',
    note: null,
    age: 0,
  },
  {
    ownerId: 'm2',
    item: { name: 'Débardeur côtelé noir', category: 'tee', color: '#2B3035', size: 'M', brand: null, agreement: 'm' },
    condition: 'very_good',
    note: null,
    circle: DEMO_CIRCLE,
    age: 2,
  },
]

/** Horodatage simulé : le jour à 9 h (UTC) + des minutes. */
export function stamp(day: IsoDate, minutes: number): IsoDateTime {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 9, 0, 0) + minutes * 60_000).toISOString()
}

function minusDays(day: IsoDate, days: number): IsoDate {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d - days)).toISOString().slice(0, 10)
}

export function createSampleCommunity(today: IsoDate): CommunityState {
  const listings: SwapListing[] = SAMPLE_LISTINGS.map((l, index) => ({
    id: `l${index + 1}`,
    ownerId: l.ownerId,
    garmentId: null,
    item: l.item,
    credits: creditsFor(l.item.category),
    condition: l.condition,
    note: l.note,
    city: DEMO_CITY,
    circle: l.circle ?? null,
    status: 'open',
    createdAt: stamp(minusDays(today, l.age), 0),
  }))

  // Échange passé d'exemple : l'utilisateur a donné un sweat à Inès et gagné 2 crédits.
  const pastDay = minusDays(today, 12)
  const pastListing: SwapListing = {
    id: 'l0',
    ownerId: ME,
    garmentId: null,
    item: { name: 'Sweat à capuche gris', category: 'long', color: '#9AA3B8', size: 'M', brand: null, agreement: 'm' },
    credits: 2,
    condition: 'good',
    note: null,
    city: DEMO_CITY,
    circle: null,
    status: 'completed',
    createdAt: stamp(minusDays(today, 15), 0),
  }
  const pastSwap: Swap = {
    id: 's0',
    listingId: 'l0',
    giverId: ME,
    receiverId: 'm1',
    credits: 2,
    status: 'completed',
    meetingPlace: 'Place de Jaude, devant la statue de Vercingétorix',
    meetingSlot: null,
    handoverCode: handoverCodeFor('s0'),
    reservedAt: stamp(minusDays(today, 14), 0),
    expiresAt: stamp(minusDays(today, 11), 0),
    completedAt: stamp(pastDay, 0),
    messages: [{ senderId: 'm1', body: 'Merci encore, il est parfait !', createdAt: stamp(pastDay, 30) }],
    myRating: 5,
  }

  return {
    members: MEMBERS.map((m) => ({ ...m })),
    listings: [pastListing, ...listings],
    swaps: [pastSwap],
    ledger: [{ amount: 2, reason: 'earn', swapId: 's0', createdAt: stamp(pastDay, 0) }],
    sizes: { ...DEMO_SIZES },
    city: DEMO_CITY,
    isAdult: true,
    rulesAccepted: false,
    clock: 0,
    nextNumber: 1,
  }
}

/** Réponses des membres fictifs dans la messagerie simulée (une par message envoyé, à tour de rôle). */
export const SIMULATED_REPLIES = [
  'Parfait, ça me va !',
  'Super, à bientôt alors.',
  'Oui, aucun souci pour moi.',
  'Je serai là, je porterai un bonnet jaune pour que tu me reconnaisses.',
  'Merci pour ton message !',
]

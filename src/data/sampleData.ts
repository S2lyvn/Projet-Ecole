// DONNÉES D'EXEMPLE (CLAUDE.md, règle 6) : dressing fictif repris de seed() du prototype, pour la démo.
// Aucune de ces pièces ni de ces dates n'est réelle. Tout est calculé relativement au jour « today ».
import { addDays } from '../domain/dates'
import { DEFAULT_DORMANCY_DAYS } from '../domain/dormancy'
import { DEFAULT_USAGE_PERIOD } from '../domain/usage'
import type { Agreement, Garment, GarmentCategory, IsoDate, Wear } from '../domain/types'
import type { DailyOutfitState, PendingConfirmation, PurchaseCandidate, UserSettings } from './repository'

// Version 2 : ajout de validatedGarmentIds (un état v1 enregistré repart des données d'exemple).
export const STATE_VERSION = 2

/** État complet de la démo locale, sérialisé tel quel en JSON. */
export interface LocalState {
  version: typeof STATE_VERSION
  today: IsoDate
  garments: Garment[]
  wears: Wear[]
  dailyOutfit: DailyOutfitState
  /** Pièces de la tenue figées au moment de « Je porte cette tenue » ; null tant qu'elle n'est pas validée. */
  validatedGarmentIds: string[] | null
  pending: PendingConfirmation | null
  purchases: PurchaseCandidate[]
  settings: UserSettings
  /** Compteur des nouvelles pièces (ids déterministes). */
  nextGarmentNumber: number
}

interface SampleGarment {
  name: string
  category: GarmentCategory
  color: string
  agreement: Agreement
  /** Jours depuis le dernier port (« last » du prototype). */
  last: number
  /** Jours avant la fin du lavage (« laundryUntil » du prototype), ou null. */
  laundryIn: number | null
}

const SAMPLE_GARMENTS: SampleGarment[] = [
  { name: 'Chemise en lin vert sauge', category: 'long', color: '#4FB596', agreement: 'f', last: 214, laundryIn: null },
  { name: 'Jean droit', category: 'pants', color: '#3F6FD1', agreement: 'm', last: 6, laundryIn: null },
  { name: 'T-shirt gris chiné', category: 'tee', color: '#9AA3B8', agreement: 'm', last: 9, laundryIn: null },
  { name: 'Pull en laine brique', category: 'long', color: '#E0583F', agreement: 'm', last: 4, laundryIn: 1 },
  { name: 'Robe midi noire', category: 'dress', color: '#2B3035', agreement: 'f', last: 41, laundryIn: null },
  { name: 'Baskets blanches', category: 'shoes', color: '#EDEBE4', agreement: 'fp', last: 5, laundryIn: null },
  { name: 'Pantalon chino beige', category: 'pants', color: '#E0BD80', agreement: 'm', last: 28, laundryIn: null },
  { name: 'T-shirt sable', category: 'tee', color: '#D2B97A', agreement: 'm', last: 270, laundryIn: null },
  { name: 'Pantalon noir', category: 'pants', color: '#2B3035', agreement: 'm', last: 20, laundryIn: null },
  { name: 'Pull col rond gris', category: 'long', color: '#8F9DB8', agreement: 'm', last: 335, laundryIn: null },
  { name: 'Robe portefeuille bordeaux', category: 'dress', color: '#B7305F', agreement: 'f', last: 150, laundryIn: null },
  { name: 'Chemise blanche', category: 'long', color: '#E9E6DD', agreement: 'f', last: 62, laundryIn: null },
  { name: 'Jean noir', category: 'pants', color: '#3A4047', agreement: 'm', last: 18, laundryIn: null },
  { name: 'Bottines brunes', category: 'shoes', color: '#A56A40', agreement: 'fp', last: 95, laundryIn: null },
  { name: 'T-shirt blanc', category: 'tee', color: '#EDEBE4', agreement: 'm', last: 11, laundryIn: null },
  { name: 'Veste en jean', category: 'long', color: '#5B8DEF', agreement: 'f', last: 120, laundryIn: null },
  { name: 'Robe grise en maille', category: 'dress', color: '#A9B2C9', agreement: 'f', last: 410, laundryIn: null },
]

interface SamplePurchase {
  name: string
  category: GarmentCategory
  color: string
  agreement: Agreement
  /** Jours depuis la détection. */
  age: number
  sourceLabel: string
}

const SAMPLE_PURCHASES: SamplePurchase[] = [
  { name: 'Pull col rond en laine', category: 'long', color: '#9B8CF2', agreement: 'm', age: 2, sourceLabel: 'E-mail de confirmation' },
  { name: 'Robe chemise bleu nuit', category: 'dress', color: '#2B3F8F', agreement: 'f', age: 6, sourceLabel: 'Ticket de caisse' },
  { name: 'Pantalon large en lin', category: 'pants', color: '#F2D27A', agreement: 'm', age: 9, sourceLabel: 'E-mail de confirmation' },
]

/** Prototype : pending:[3,2,6] = T-shirt gris chiné, Jean droit, Baskets blanches, portés hier. */
const SAMPLE_PENDING_IDS = ['g03', 'g02', 'g06']

export function sampleGarmentId(index: number): string {
  return `g${String(index + 1).padStart(2, '0')}`
}

export const DEFAULT_SETTINGS: UserSettings = {
  dormancyDays: DEFAULT_DORMANCY_DAYS,
  usagePeriod: DEFAULT_USAGE_PERIOD,
  mirrorMode: false,
}

export function createSampleState(today: IsoDate): LocalState {
  const garments: Garment[] = SAMPLE_GARMENTS.map((g, index) => ({
    id: sampleGarmentId(index),
    name: g.name,
    category: g.category,
    color: g.color,
    size: null,
    brand: null,
    photoPath: null,
    agreement: g.agreement,
    source: 'manual',
    originGarmentId: null,
    // Le prototype n'a pas de date d'achat : choix arbitraire, 30 jours avant le dernier port.
    acquiredAt: addDays(today, -(g.last + 30)),
    lastWornAt: addDays(today, -g.last),
    laundryUntil: g.laundryIn === null ? null : addDays(today, g.laundryIn),
    status: 'active',
  }))

  // Un port d'historique par pièce, à sa date de dernier port, pour rester cohérent avec lastWornAt.
  const wears: Wear[] = garments.map((g) => ({ garmentId: g.id, wornOn: g.lastWornAt ?? today, source: 'manual' }))

  const purchases: PurchaseCandidate[] = SAMPLE_PURCHASES.map((p, index) => ({
    id: `p${index + 1}`,
    name: p.name,
    category: p.category,
    color: p.color,
    agreement: p.agreement,
    sourceLabel: p.sourceLabel,
    detectedAt: addDays(today, -p.age),
  }))

  return {
    version: STATE_VERSION,
    today,
    garments,
    wears,
    // Choix assumé : le prototype fixe orphanId:1 (Chemise en lin) ; ici null, la plus oubliée (docs/02-produit.md).
    dailyOutfit: { day: today, orphanId: null, status: 'proposed' },
    validatedGarmentIds: null,
    pending: { wornOn: addDays(today, -1), garmentIds: [...SAMPLE_PENDING_IDS] },
    purchases,
    settings: { ...DEFAULT_SETTINGS },
    nextGarmentNumber: SAMPLE_GARMENTS.length + 1,
  }
}

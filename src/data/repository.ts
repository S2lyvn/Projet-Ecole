// Interface d'accès aux données : les écrans parlent à ce contrat, jamais directement à Supabase (docs/05-technique.md).
// Tout est asynchrone pour que l'implémentation Supabase (étape 3) s'y branche sans toucher aux écrans.
import type { DormancyThreshold } from '../domain/dormancy'
import type { Member, MySizes, Swap, SwapListing } from '../domain/swaps'
import type { UsagePeriod } from '../domain/usage'
import type {
  Agreement,
  Garment,
  GarmentCategory,
  GarmentSource,
  GarmentStatus,
  IsoDate,
  ItemCondition,
  LedgerEntry,
  Wear,
  WearSource,
} from '../domain/types'

/** Statuts de la tenue du jour (enum outfit_status de docs/04-donnees.md). */
export const DAILY_OUTFIT_STATUSES = ['proposed', 'validated', 'dismissed'] as const
export type DailyOutfitStatus = (typeof DAILY_OUTFIT_STATUSES)[number]

/**
 * Tenue du jour : orphanId null = laisser outfit.buildOutfit choisir la pièce la plus oubliée.
 * « Autre proposition » : orphanId = outfit.nextOrphanId(pièces, jour, orphanId).
 */
export interface DailyOutfitState {
  day: IsoDate
  orphanId: string | null
  status: DailyOutfitStatus
}

/** Achat détecté (e-mail, ticket), en attente d'être ajouté ou ignoré. */
export interface PurchaseCandidate {
  id: string
  name: string
  category: GarmentCategory
  color: string | null
  agreement: Agreement
  sourceLabel: string
  detectedAt: IsoDate
}

export interface UserSettings {
  dormancyDays: DormancyThreshold
  usagePeriod: UsagePeriod
  mirrorMode: boolean
}

/** Pièces portées à confirmer d'un geste (« Hier : 3 pièces à confirmer »). */
export interface PendingConfirmation {
  wornOn: IsoDate
  garmentIds: string[]
}

export interface NewGarment {
  name: string
  category: GarmentCategory
  color?: string | null
  size?: string | null
  brand?: string | null
  agreement: Agreement
  /** Par défaut : aujourd'hui. */
  acquiredAt?: IsoDate
  /** Par défaut : 'manual'. */
  source?: GarmentSource
}

export interface WardrobeRepository {
  /** Date « courante » (simulée en démo). */
  today(): Promise<IsoDate>
  /** Toutes les pièces, y compris non actives ; les lavages expirés sont déjà nettoyés. */
  listGarments(): Promise<Garment[]>
  getGarment(id: string): Promise<Garment | null>
  addGarment(input: NewGarment): Promise<Garment>
  /** Donner, vendre, archiver, ou réactiver (annuler). */
  setGarmentStatus(id: string, status: GarmentStatus): Promise<Garment>
  washGarment(id: string): Promise<Garment>
  markGarmentClean(id: string): Promise<Garment>
  /**
   * Enregistre un port par pièce (un seul par pièce et par jour) et met à jour lastWornAt et le lavage.
   * Les pièces non actives (données, vendues…) sont ignorées. Une date après today() est refusée.
   */
  recordWears(ids: string[], wornOn: IsoDate, source: WearSource): Promise<Garment[]>
  listWears(): Promise<Wear[]>
  /** Tenue du jour pour today() ; créée à la volée si besoin. */
  getDailyOutfit(): Promise<DailyOutfitState>
  /**
   * Ignoré si state.day n'est pas today() (écran resté sur la veille). Au statut 'validated', les pièces de la
   * tenue (buildOutfit avec orphanId) sont figées : ce sont elles qu'advanceDay enregistre, même si le dressing change.
   */
  saveDailyOutfit(state: DailyOutfitState): Promise<void>
  getPendingConfirmation(): Promise<PendingConfirmation | null>
  /**
   * Enregistre les pièces à la date de la confirmation en attente (source 'outfit_confirmed'), puis vide l'attente.
   * Sans attente (déjà confirmée, autre onglet) : erreur NOTHING_TO_CONFIRM_MESSAGE.
   */
  confirmWears(garmentIds: string[]): Promise<Garment[]>
  listPurchaseCandidates(): Promise<PurchaseCandidate[]>
  /** Ajoute l'achat au dressing (source 'purchase', acquiredAt = detectedAt). */
  acceptPurchase(id: string): Promise<Garment>
  ignorePurchase(id: string): Promise<void>
  getSettings(): Promise<UserSettings>
  updateSettings(patch: Partial<UserSettings>): Promise<UserSettings>
}

/** Ce que la bourse montre à l'utilisateur. */
export interface SwapState {
  members: Member[]
  /** Annonces de la ville et des cercles de l'utilisateur, plus les siennes (toutes statuts). */
  listings: SwapListing[]
  /** Échanges où l'utilisateur est donneur ou receveur. */
  swaps: Swap[]
  /** Registre des jetons de l'utilisateur : le solde en est la somme (lecture seule). */
  ledger: LedgerEntry[]
  sizes: MySizes
  city: string
  isAdult: boolean
  rulesAccepted: boolean
}

export interface PublishListingInput {
  garmentId: string
  condition: ItemCondition
  note: string | null
  /** Cercle privé, ou null pour toute la ville. */
  circle: string | null
}

/**
 * Bourse d'échange (docs/03). Toutes les écritures de jetons se font derrière cette interface :
 * dans le simulateur local aujourd'hui, dans les fonctions RPC Supabase à l'étape 4 (CLAUDE.md, règle 4).
 */
export interface SwapRepository {
  getSwapState(): Promise<SwapState>
  acceptCommunityRules(): Promise<void>
  /** Met une pièce active du dressing en ligne ; elle reste dans le dressing jusqu'à la remise. */
  publishListing(input: PublishListingInput): Promise<SwapListing>
  /** Retire une annonce encore ouverte. */
  withdrawListing(listingId: string): Promise<void>
  /** « Réclamer » : bloque 1 jeton (refus : RESERVE_REFUSAL_MESSAGES de domain/tokens). */
  reserveListing(listingId: string): Promise<Swap>
  scheduleSwap(swapId: string, place: string, slot: string): Promise<Swap>
  sendSwapMessage(swapId: string, body: string): Promise<Swap>
  /** Remise confirmée par le code du QR : jeton dépensé par le receveur et gagné par le donneur, pièce sortie ou reçue avec sa fiche. */
  completeSwap(swapId: string, handoverCode: string): Promise<{ swap: Swap; receivedGarment: Garment | null }>
  /** Annulation avant la remise : jeton débloqué, annonce remise en ligne. */
  cancelSwap(swapId: string): Promise<Swap>
  rateSwap(swapId: string, rating: number): Promise<Swap>
}

/** Commandes réservées au mode démo (soutenance). */
export interface DemoControls {
  /** Passe au jour suivant, comme nextDay() du prototype ; renvoie le nouveau jour. */
  advanceDay(): Promise<IsoDate>
  /** Repart des données d'exemple. */
  reset(): Promise<void>
  /** Bourse simulée : un membre fictif réserve la première annonce ouverte de l'utilisateur. */
  simulateIncomingReservation(): Promise<Swap>
}

export const NOT_FOUND_MESSAGE = 'Pièce introuvable'
export const NOTHING_TO_CONFIRM_MESSAGE = 'Aucune pièce à confirmer'
export const FUTURE_WEAR_MESSAGE = 'Impossible d’enregistrer un port dans le futur'
export const LISTING_NOT_FOUND_MESSAGE = 'Annonce introuvable'
export const SWAP_NOT_FOUND_MESSAGE = 'Échange introuvable'

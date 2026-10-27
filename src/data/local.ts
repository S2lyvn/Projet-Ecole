// Implémentation locale du dépôt, pour la démo hors ligne (étapes 1 et 2, et mode démo de la soutenance).
// État complet en mémoire, recopié en JSON dans le storage après chaque écriture. Les règles viennent de src/domain/.
import { addDays, isIsoDate, toIsoDate } from '../domain/dates'
import { DORMANCY_THRESHOLDS } from '../domain/dormancy'
import { applyWear, clearExpiredLaundry, markClean, washNow } from '../domain/laundry'
import { buildOutfit, outfitGarmentIds } from '../domain/outfit'
import { USAGE_PERIODS } from '../domain/usage'
import { AGREEMENTS, GARMENT_CATEGORIES, GARMENT_SOURCES, GARMENT_STATUSES, WEAR_SOURCES } from '../domain/types'
import type { Garment, GarmentStatus, IsoDate, Wear, WearSource } from '../domain/types'
import { DAILY_OUTFIT_STATUSES, FUTURE_WEAR_MESSAGE, NOT_FOUND_MESSAGE, NOTHING_TO_CONFIRM_MESSAGE } from './repository'
import type {
  DailyOutfitState,
  DemoControls,
  NewGarment,
  PendingConfirmation,
  SwapRepository,
  UserSettings,
  WardrobeRepository,
} from './repository'
import * as swaps from './localSwaps'
import type { SwapWorld } from './localSwaps'
import { STATE_VERSION, createSampleState } from './sampleData'
import type { LocalState } from './sampleData'

export type LocalStorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export interface LocalRepositoryOptions {
  /** null ou absent : tout reste en mémoire (navigation privée, tests). */
  storage?: LocalStorageLike | null
  /** Jour simulé de départ ; par défaut le jour réel de l'appareil. */
  startDate?: IsoDate
  key?: string
}

export const DEFAULT_STORAGE_KEY = 'e-mirror.demo.v1'

function notFound(): never {
  throw new Error(NOT_FOUND_MESSAGE)
}

type Check = (value: unknown) => boolean

const isString: Check = (v) => typeof v === 'string'
const isDate: Check = (v) => typeof v === 'string' && isIsoDate(v)
const isNullOr =
  (check: Check): Check =>
  (v) =>
    v === null || check(v)
const isOneOf =
  (values: readonly unknown[]): Check =>
  (v) =>
    values.includes(v)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Objet dont chaque champ listé passe sa vérification. */
function hasShape(value: unknown, shape: Record<string, Check>): boolean {
  return isRecord(value) && Object.entries(shape).every(([field, check]) => check(value[field]))
}

const GARMENT_SHAPE: Record<string, Check> = {
  id: isString,
  name: isString,
  category: isOneOf(GARMENT_CATEGORIES),
  color: isNullOr(isString),
  size: isNullOr(isString),
  brand: isNullOr(isString),
  photoPath: isNullOr(isString),
  agreement: isOneOf(AGREEMENTS),
  source: isOneOf(GARMENT_SOURCES),
  originGarmentId: isNullOr(isString),
  acquiredAt: isDate,
  lastWornAt: isNullOr(isDate),
  laundryUntil: isNullOr(isDate),
  status: isOneOf(GARMENT_STATUSES),
}

const WEAR_SHAPE: Record<string, Check> = { garmentId: isString, wornOn: isDate, source: isOneOf(WEAR_SOURCES) }

const PURCHASE_SHAPE: Record<string, Check> = {
  id: isString,
  name: isString,
  category: isOneOf(GARMENT_CATEGORIES),
  color: isNullOr(isString),
  agreement: isOneOf(AGREEMENTS),
  sourceLabel: isString,
  detectedAt: isDate,
}

const OUTFIT_SHAPE: Record<string, Check> = {
  day: isDate,
  orphanId: isNullOr(isString),
  status: isOneOf(DAILY_OUTFIT_STATUSES),
}

const SETTINGS_SHAPE: Record<string, Check> = {
  dormancyDays: isOneOf(DORMANCY_THRESHOLDS),
  usagePeriod: isOneOf(USAGE_PERIODS),
  mirrorMode: (v) => typeof v === 'boolean',
}

const isIdList: Check = (v) => Array.isArray(v) && v.every(isString)

/** Contrôle de forme léger de la bourse simulée (listes et compteurs présents). */
function isCommunity(value: unknown): boolean {
  if (!isRecord(value)) return false
  const lists = ['members', 'listings', 'swaps', 'ledger'].every((k) => Array.isArray(value[k]))
  return lists && Number.isInteger(value.clock) && Number.isInteger(value.nextNumber) && isRecord(value.sizes)
}

/** Vérifie tout l'état relu : au moindre doute (champ manquant, date invalide, id orphelin), données d'exemple. */
function isLocalState(value: unknown): value is LocalState {
  if (!isRecord(value) || value.version !== STATE_VERSION || !isDate(value.today)) return false
  const { garments, wears, purchases, pending, validatedGarmentIds, nextGarmentNumber } = value
  if (!Array.isArray(garments) || !garments.every((g) => hasShape(g, GARMENT_SHAPE))) return false
  if (!Array.isArray(wears) || !wears.every((w) => hasShape(w, WEAR_SHAPE))) return false
  if (!Array.isArray(purchases) || !purchases.every((p) => hasShape(p, PURCHASE_SHAPE))) return false
  if (!hasShape(value.dailyOutfit, OUTFIT_SHAPE) || !hasShape(value.settings, SETTINGS_SHAPE)) return false
  if (!Number.isInteger(nextGarmentNumber)) return false
  if (!isCommunity(value.community)) return false
  const ids = new Set((garments as Garment[]).map((g) => g.id))
  if (ids.size !== garments.length) return false
  const known = (list: unknown): boolean => isIdList(list) && (list as string[]).every((id) => ids.has(id))
  if (pending !== null && !(hasShape(pending, { wornOn: isDate }) && known((pending as PendingConfirmation).garmentIds))) {
    return false
  }
  return validatedGarmentIds === null || known(validatedGarmentIds)
}

/** Nouvelle pièce active, jamais portée : seule construction de pièce du dépôt (ajout manuel et achat accepté). */
function newGarment(id: string, input: NewGarment & { acquiredAt: IsoDate }): Garment {
  return {
    id,
    name: input.name,
    category: input.category,
    color: input.color ?? null,
    size: input.size ?? null,
    brand: input.brand ?? null,
    photoPath: null,
    agreement: input.agreement,
    source: input.source ?? 'manual',
    originGarmentId: null,
    acquiredAt: input.acquiredAt,
    lastWornAt: null,
    laundryUntil: null,
    status: 'active',
  }
}

function cleanLaundry(state: LocalState): LocalState {
  return { ...state, garments: state.garments.map((g) => clearExpiredLaundry(g, state.today)) }
}

function freshOutfit(day: IsoDate): DailyOutfitState {
  return { day, orphanId: null, status: 'proposed' }
}

/** Ajoute un port à l'historique s'il n'existe pas déjà pour cette pièce et ce jour. */
function addWear(wears: Wear[], wear: Wear): Wear[] {
  return wears.some((w) => w.garmentId === wear.garmentId && w.wornOn === wear.wornOn) ? wears : [...wears, wear]
}

/** Enregistre des ports sur l'état (pièces actives seulement, comme applyWorn() du prototype). */
function applyWears(state: LocalState, ids: string[], wornOn: IsoDate, source: WearSource): LocalState {
  if (!isIsoDate(wornOn)) throw new Error(`Date invalide : « ${wornOn} »`)
  for (const id of ids) if (!state.garments.some((g) => g.id === id)) notFound()
  const unique = new Set(ids)
  let wears = state.wears
  const garments = state.garments.map((g) => {
    if (!unique.has(g.id) || g.status !== 'active') return g
    wears = addWear(wears, { garmentId: g.id, wornOn, source })
    return applyWear(g, wornOn)
  })
  // Un port ancien peut donner un lavage déjà terminé : on le nettoie tout de suite.
  return cleanLaundry({ ...state, garments, wears })
}

export function createLocalRepository(
  options: LocalRepositoryOptions = {},
): WardrobeRepository & SwapRepository & DemoControls {
  const storage = options.storage ?? null
  const key = options.key ?? DEFAULT_STORAGE_KEY

  // Seul appel à new Date() : à la création de l'état, jamais dans le domaine.
  const initialState = (): LocalState => createSampleState(options.startDate ?? toIsoDate(new Date()))

  function load(): LocalState {
    if (storage === null) return initialState()
    try {
      const raw = storage.getItem(key)
      if (raw !== null) {
        const parsed: unknown = JSON.parse(raw)
        if (isLocalState(parsed)) return cleanLaundry(parsed)
      }
    } catch {
      // Storage inaccessible ou JSON invalide : données d'exemple.
    }
    return initialState()
  }

  let state = load()

  function commit(next: LocalState): void {
    state = next
    if (storage === null) return
    try {
      storage.setItem(key, JSON.stringify(state))
    } catch {
      // Quota dépassé ou navigation privée : l'appli continue en mémoire.
    }
  }

  function nextGarmentId(): string {
    return `g${String(state.nextGarmentNumber).padStart(2, '0')}`
  }

  function findGarment(id: string): Garment {
    return state.garments.find((g) => g.id === id) ?? notFound()
  }

  function replaceGarment(updated: Garment): Garment {
    commit({ ...state, garments: state.garments.map((g) => (g.id === updated.id ? updated : g)) })
    return structuredClone(updated)
  }

  function pickGarments(ids: string[]): Garment[] {
    return ids.map((id) => structuredClone(clearExpiredLaundry(findGarment(id), state.today)))
  }

  function world(): SwapWorld {
    return { community: state.community, garments: state.garments, today: state.today }
  }

  function commitWorld(next: SwapWorld, extra: Partial<LocalState> = {}): void {
    commit({ ...state, community: next.community, garments: next.garments, ...extra })
  }

  function currentOutfit(): DailyOutfitState {
    return state.dailyOutfit.day === state.today ? state.dailyOutfit : freshOutfit(state.today)
  }

  return {
    async today() {
      return state.today
    },

    async listGarments() {
      return structuredClone(state.garments.map((g) => clearExpiredLaundry(g, state.today)))
    },

    async getGarment(id) {
      const garment = state.garments.find((g) => g.id === id)
      return garment ? structuredClone(clearExpiredLaundry(garment, state.today)) : null
    },

    async addGarment(input: NewGarment) {
      const name = input.name.trim()
      if (name === '') throw new Error('Le nom de la pièce est obligatoire')
      const acquiredAt = input.acquiredAt ?? state.today
      if (!isIsoDate(acquiredAt)) throw new Error(`Date invalide : « ${acquiredAt} »`)
      const garment = newGarment(nextGarmentId(), { ...input, name, acquiredAt })
      commit({ ...state, garments: [...state.garments, garment], nextGarmentNumber: state.nextGarmentNumber + 1 })
      return structuredClone(garment)
    },

    async setGarmentStatus(id: string, status: GarmentStatus) {
      const updated = replaceGarment({ ...findGarment(id), status })
      // Donnée ou vendue : son annonce d'échange encore ouverte est retirée.
      commitWorld(swaps.withdrawListingsOfInactive(world()))
      return updated
    },

    async washGarment(id) {
      return replaceGarment(washNow(findGarment(id), state.today))
    },

    async markGarmentClean(id) {
      return replaceGarment(markClean(findGarment(id)))
    },

    async recordWears(ids, wornOn, source) {
      if (isIsoDate(wornOn) && wornOn > state.today) throw new Error(FUTURE_WEAR_MESSAGE)
      commit(applyWears(state, ids, wornOn, source))
      return pickGarments(ids)
    },

    async listWears() {
      return structuredClone(state.wears)
    },

    async getDailyOutfit() {
      return structuredClone(currentOutfit())
    },

    async saveDailyOutfit(outfit) {
      // Écran resté sur un autre jour (ou second onglet) : on n'écrase pas la tenue du jour.
      if (outfit.day !== state.today) return
      const dailyOutfit = { day: outfit.day, orphanId: outfit.orphanId, status: outfit.status }
      // Pièces figées à la validation : ce que l'utilisateur a vu, même si le dressing change avant advanceDay.
      const built = outfit.status === 'validated' ? buildOutfit(state.garments, state.today, outfit.orphanId) : null
      commit({ ...state, dailyOutfit, validatedGarmentIds: built ? outfitGarmentIds(built) : null })
    },

    async getPendingConfirmation() {
      return state.pending === null ? null : structuredClone(state.pending)
    },

    async confirmWears(garmentIds) {
      for (const id of garmentIds) findGarment(id)
      const pending = state.pending
      if (pending === null) throw new Error(NOTHING_TO_CONFIRM_MESSAGE)
      commit({ ...applyWears(state, garmentIds, pending.wornOn, 'outfit_confirmed'), pending: null })
      return pickGarments(garmentIds)
    },

    async listPurchaseCandidates() {
      return structuredClone(state.purchases)
    },

    async acceptPurchase(id) {
      const purchase = state.purchases.find((p) => p.id === id) ?? notFound()
      const garment = newGarment(nextGarmentId(), {
        name: purchase.name,
        category: purchase.category,
        color: purchase.color,
        agreement: purchase.agreement,
        source: 'purchase',
        acquiredAt: purchase.detectedAt,
      })
      commit({
        ...state,
        garments: [...state.garments, garment],
        purchases: state.purchases.filter((p) => p.id !== id),
        nextGarmentNumber: state.nextGarmentNumber + 1,
      })
      return structuredClone(garment)
    },

    async ignorePurchase(id) {
      if (!state.purchases.some((p) => p.id === id)) notFound()
      commit({ ...state, purchases: state.purchases.filter((p) => p.id !== id) })
    },

    async getSettings() {
      return { ...state.settings }
    },

    async updateSettings(patch: Partial<UserSettings>) {
      // Une clé à undefined ne doit pas effacer le réglage enregistré.
      const defined = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined))
      const settings: UserSettings = { ...state.settings, ...defined }
      if (!(DORMANCY_THRESHOLDS as readonly number[]).includes(settings.dormancyDays)) {
        throw new Error(`Seuil de dormance invalide : ${settings.dormancyDays}`)
      }
      if (!(USAGE_PERIODS as readonly number[]).includes(settings.usagePeriod)) {
        throw new Error(`Période de bilan invalide : ${settings.usagePeriod}`)
      }
      if (typeof settings.mirrorMode !== 'boolean') throw new Error('Mode miroir invalide')
      commit({ ...state, settings })
      return { ...settings }
    },

    async advanceDay() {
      const today = state.today
      // Pièces de la tenue validée, figées par saveDailyOutfit (outfitIds() du prototype), pièces actives seulement.
      const validated = currentOutfit().status === 'validated' ? (state.validatedGarmentIds ?? []) : []
      const outfitIds = validated.filter((id) => findGarment(id).status === 'active')

      let next = state
      // (a) Attente non confirmée : on considère que les pièces ont bien été portées à leur date.
      if (next.pending !== null) {
        next = { ...applyWears(next, next.pending.garmentIds, next.pending.wornOn, 'outfit_confirmed'), pending: null }
      }
      // (b) Tenue validée : le miroir l'enregistre seul, sinon elle attend la confirmation de demain.
      if (outfitIds.length > 0) {
        next = next.settings.mirrorMode
          ? applyWears(next, outfitIds, today, 'mirror')
          : { ...next, pending: { wornOn: today, garmentIds: outfitIds } }
      }
      // (c), (d), (e) Jour suivant, lavages expirés nettoyés, nouvelle tenue à proposer.
      const tomorrow = addDays(today, 1)
      next = cleanLaundry({ ...next, today: tomorrow, dailyOutfit: freshOutfit(tomorrow), validatedGarmentIds: null })
      // Bourse : nouvelle journée, réservations de plus de 72 h sans rendez-vous annulées.
      const expired = swaps.expireReservations({
        community: { ...next.community, clock: 0 },
        garments: next.garments,
        today: tomorrow,
      })
      commit({ ...next, community: expired.community, garments: expired.garments })
      return tomorrow
    },

    async reset() {
      commit(initialState())
    },

    async simulateIncomingReservation() {
      const change = swaps.simulateIncomingReservation(world())
      commitWorld(change.world)
      return structuredClone(change.value)
    },

    async getSwapState() {
      const { members, listings, swaps: list, ledger, sizes, city, isAdult, rulesAccepted } = state.community
      return structuredClone({ members, listings, swaps: list, ledger, sizes, city, isAdult, rulesAccepted })
    },

    async acceptCommunityRules() {
      commit({ ...state, community: { ...state.community, rulesAccepted: true } })
    },

    async publishListing(input) {
      const change = swaps.publishListing(world(), input)
      commitWorld(change.world)
      return structuredClone(change.value)
    },

    async withdrawListing(listingId) {
      commitWorld(swaps.withdrawListing(world(), listingId))
    },

    async reserveListing(listingId) {
      const change = swaps.reserveListing(world(), listingId)
      commitWorld(change.world)
      return structuredClone(change.value)
    },

    async scheduleSwap(swapId, place, slot) {
      const change = swaps.scheduleSwap(world(), swapId, place, slot)
      commitWorld(change.world)
      return structuredClone(change.value)
    },

    async sendSwapMessage(swapId, body) {
      const change = swaps.sendSwapMessage(world(), swapId, body)
      commitWorld(change.world)
      return structuredClone(change.value)
    },

    async completeSwap(swapId, handoverCode) {
      const change = swaps.completeSwap(world(), swapId, handoverCode, nextGarmentId())
      const received = change.value.receivedGarment !== null
      commitWorld(change.world, received ? { nextGarmentNumber: state.nextGarmentNumber + 1 } : {})
      return structuredClone(change.value)
    },

    async cancelSwap(swapId) {
      const change = swaps.cancelSwap(world(), swapId)
      commitWorld(change.world)
      return structuredClone(change.value)
    },

    async rateSwap(swapId, rating) {
      const change = swaps.rateSwap(world(), swapId, rating)
      commitWorld(change.world)
      return structuredClone(change.value)
    },
  }
}

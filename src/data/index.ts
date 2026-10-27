// Point d'entrée unique des écrans vers les données.
// Étape 3 : choisir l'implémentation Supabase si import.meta.env.VITE_DEMO_MODE !== 'true', sinon garder la démo locale.
import { createLocalRepository } from './local'
import type { LocalStorageLike } from './local'

/** localStorage peut être absent (tests, serveur) ou lever une exception (navigation privée, cookies bloqués). */
function browserStorage(): LocalStorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export const repository = createLocalRepository({ storage: browserStorage() })

export type {
  DailyOutfitState,
  DemoControls,
  NewGarment,
  PendingConfirmation,
  PurchaseCandidate,
  UserSettings,
  WardrobeRepository,
} from './repository'

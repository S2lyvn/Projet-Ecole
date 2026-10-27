// Pont entre les écrans et le repository : charge un instantané des données, et le recharge après chaque action.
// Les écrans ne parlent qu'à ce contexte, jamais directement au stockage (docs/05-technique.md).
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  DailyOutfitState,
  DemoControls,
  PendingConfirmation,
  PurchaseCandidate,
  UserSettings,
  WardrobeRepository,
} from '../data/repository'
import type { Garment, IsoDate, Wear } from '../domain/types'

export interface WardrobeSnapshot {
  today: IsoDate
  /** Toutes les pièces, y compris données, vendues… : filtrer sur status === 'active' pour le dressing. */
  garments: Garment[]
  wears: Wear[]
  dailyOutfit: DailyOutfitState
  pending: PendingConfirmation | null
  purchases: PurchaseCandidate[]
  settings: UserSettings
}

export type Repository = WardrobeRepository & Partial<DemoControls>

interface WardrobeContextValue {
  data: WardrobeSnapshot
  repository: Repository
  /** Commandes de démo, ou null si le repository n'en a pas (Supabase). */
  demo: DemoControls | null
  /** Exécute une action sur le repository puis recharge les données. */
  run<T>(action: (repository: Repository) => Promise<T>): Promise<T>
}

const WardrobeContext = createContext<WardrobeContextValue | null>(null)

async function loadSnapshot(repository: Repository): Promise<WardrobeSnapshot> {
  const [today, garments, wears, dailyOutfit, pending, purchases, settings] = await Promise.all([
    repository.today(),
    repository.listGarments(),
    repository.listWears(),
    repository.getDailyOutfit(),
    repository.getPendingConfirmation(),
    repository.listPurchaseCandidates(),
    repository.getSettings(),
  ])
  return { today, garments, wears, dailyOutfit, pending, purchases, settings }
}

export function WardrobeProvider({ repository, children }: { repository: Repository; children: ReactNode }) {
  const [data, setData] = useState<WardrobeSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadSnapshot(repository).then(
      (snapshot) => !cancelled && setData(snapshot),
      (e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)),
    )
    return () => {
      cancelled = true
    }
  }, [repository])

  const run = useCallback(
    async <T,>(action: (r: Repository) => Promise<T>): Promise<T> => {
      try {
        return await action(repository)
      } finally {
        setData(await loadSnapshot(repository))
      }
    },
    [repository],
  )

  const demo = useMemo<DemoControls | null>(
    () =>
      repository.advanceDay && repository.reset
        ? { advanceDay: repository.advanceDay.bind(repository), reset: repository.reset.bind(repository) }
        : null,
    [repository],
  )

  if (error) {
    return (
      <p role="alert" className="m-0 p-5 text-[15px]">
        Impossible de charger ton dressing : {error}
      </p>
    )
  }
  if (!data) {
    return (
      <p role="status" className="m-0 p-5 text-[15px] text-muted">
        Chargement…
      </p>
    )
  }
  return <WardrobeContext.Provider value={{ data, repository, demo, run }}>{children}</WardrobeContext.Provider>
}

export function useWardrobe(): WardrobeContextValue {
  const value = useContext(WardrobeContext)
  if (!value) throw new Error('useWardrobe doit être utilisé dans <WardrobeProvider>')
  return value
}

/** Pièces actives (celles du dressing). */
export function useActiveGarments(): Garment[] {
  const { data } = useWardrobe()
  return useMemo(() => data.garments.filter((g) => g.status === 'active'), [data.garments])
}

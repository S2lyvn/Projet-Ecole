import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Garment } from '../domain/types'
import { DEFAULT_STORAGE_KEY, createLocalRepository } from './local'
import type { LocalStorageLike } from './local'
import { createSampleState } from './sampleData'
import type { LocalState } from './sampleData'

afterEach(() => {
  vi.useRealTimers()
})

const START = '2026-10-27'

/** Faux localStorage en mémoire. */
function makeStorage(initial: Record<string, string> = {}): LocalStorageLike & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial))
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value)
    },
    removeItem: (key) => {
      data.delete(key)
    },
  }
}

/** Storage qui lève une exception à chaque accès (navigation privée stricte). */
const throwingStorage: LocalStorageLike = {
  getItem: () => {
    throw new Error('bloqué')
  },
  setItem: () => {
    throw new Error('bloqué')
  },
  removeItem: () => {
    throw new Error('bloqué')
  },
}

function makeGarment(overrides: Partial<Garment> = {}): Garment {
  return {
    id: 'x1',
    name: 'Pièce de test',
    category: 'tee',
    color: '#000000',
    size: null,
    brand: null,
    photoPath: null,
    agreement: 'f',
    source: 'manual',
    originGarmentId: null,
    acquiredAt: '2026-01-01',
    lastWornAt: null,
    laundryUntil: null,
    status: 'active',
    ...overrides,
  }
}

/** État tel qu'il est enregistré dans le storage (et non relu par le dépôt). */
function storedState(storage: { data: Map<string, string> }): LocalState {
  return JSON.parse(storage.data.get(DEFAULT_STORAGE_KEY) ?? 'null') as LocalState
}

function storedGarment(storage: { data: Map<string, string> }, id: string): Garment | undefined {
  return storedState(storage).garments.find((g) => g.id === id)
}

function makeRepo(storage: LocalStorageLike | null = makeStorage()) {
  return createLocalRepository({ storage, startDate: START })
}

describe('createLocalRepository : données d’exemple', () => {
  it('charge 17 pièces, 3 achats et 3 pièces à confirmer pour hier', async () => {
    const repo = makeRepo()
    expect(await repo.today()).toBe(START)
    const garments = await repo.listGarments()
    expect(garments).toHaveLength(17)
    expect(garments.map((g) => g.id)).toEqual(Array.from({ length: 17 }, (_, i) => `g${String(i + 1).padStart(2, '0')}`))
    expect(garments.every((g) => g.status === 'active')).toBe(true)
    expect(await repo.listPurchaseCandidates()).toHaveLength(3)
    expect(await repo.getPendingConfirmation()).toEqual({ wornOn: '2026-10-26', garmentIds: ['g03', 'g02', 'g06'] })
  })

  it('calcule les dates relativement au jour de départ', async () => {
    const repo = makeRepo()
    const tee = await repo.getGarment('g03')
    expect(tee?.name).toBe('T-shirt gris chiné')
    expect(tee?.lastWornAt).toBe('2026-10-18')
    expect(tee?.acquiredAt).toBe('2026-09-18')
    expect((await repo.getGarment('g04'))?.laundryUntil).toBe('2026-10-28')
    const [p1] = await repo.listPurchaseCandidates()
    expect(p1).toMatchObject({ id: 'p1', agreement: 'm', detectedAt: '2026-10-25', sourceLabel: 'E-mail de confirmation' })
  })

  it('propose une tenue neuve pour aujourd’hui et des réglages par défaut', async () => {
    const repo = makeRepo()
    expect(await repo.getDailyOutfit()).toEqual({ day: START, orphanId: null, status: 'proposed' })
    expect(await repo.getSettings()).toEqual({ dormancyDays: 180, usagePeriod: 90, mirrorMode: false })
  })
})

describe('createLocalRepository : persistance', () => {
  it('un second dépôt sur le même storage retrouve l’état', async () => {
    const storage = makeStorage()
    const first = makeRepo(storage)
    await first.washGarment('g01')
    await first.ignorePurchase('p2')
    await first.updateSettings({ mirrorMode: true, dormancyDays: 90 })
    await first.setGarmentStatus('g05', 'sold')
    await first.saveDailyOutfit({ day: START, orphanId: 'g01', status: 'dismissed' })
    expect(storage.data.has(DEFAULT_STORAGE_KEY)).toBe(true)

    const second = createLocalRepository({ storage, startDate: '2030-01-01' })
    expect(await second.today()).toBe(START)
    expect((await second.getGarment('g01'))?.laundryUntil).toBe('2026-10-31')
    expect((await second.getGarment('g05'))?.status).toBe('sold')
    expect((await second.listPurchaseCandidates()).map((p) => p.id)).toEqual(['p1', 'p3'])
    expect(await second.getSettings()).toEqual({ dormancyDays: 90, usagePeriod: 90, mirrorMode: true })
    expect(await second.getDailyOutfit()).toEqual({ day: START, orphanId: 'g01', status: 'dismissed' })
    expect(await second.getPendingConfirmation()).toEqual({ wornOn: '2026-10-26', garmentIds: ['g03', 'g02', 'g06'] })
  })

  it('un second dépôt retrouve le jour simulé, l’attente et la tenue validée', async () => {
    const storage = makeStorage()
    const first = makeRepo(storage)
    await first.saveDailyOutfit({ day: START, orphanId: null, status: 'validated' })
    await first.advanceDay()
    await first.saveDailyOutfit({ day: '2026-10-28', orphanId: 'g01', status: 'validated' })

    const second = createLocalRepository({ storage, startDate: '2030-01-01' })
    expect(await second.today()).toBe('2026-10-28')
    expect(await second.getPendingConfirmation()).toEqual({ wornOn: START, garmentIds: ['g17', 'g06'] })
    expect(await second.getDailyOutfit()).toEqual({ day: '2026-10-28', orphanId: 'g01', status: 'validated' })
    await second.advanceDay()
    expect((await second.getPendingConfirmation())?.garmentIds[0]).toBe('g01')
  })

  it('utilise la clé fournie', async () => {
    const storage = makeStorage()
    const repo = createLocalRepository({ storage, startDate: START, key: 'autre-cle' })
    await repo.washGarment('g01')
    expect([...storage.data.keys()]).toEqual(['autre-cle'])
  })

  it('JSON corrompu : repart des données d’exemple', async () => {
    const repo = makeRepo(makeStorage({ [DEFAULT_STORAGE_KEY]: '{pas du json' }))
    expect(await repo.listGarments()).toHaveLength(17)
    expect(await repo.getPendingConfirmation()).not.toBeNull()
  })

  it('version différente : repart des données d’exemple', async () => {
    const old = { ...createSampleState('2020-01-01'), version: 0 }
    const repo = makeRepo(makeStorage({ [DEFAULT_STORAGE_KEY]: JSON.stringify(old) }))
    expect(await repo.today()).toBe(START)
  })

  it('nettoie au chargement un lavage déjà terminé', async () => {
    const state: LocalState = {
      ...createSampleState(START),
      garments: [makeGarment({ laundryUntil: START }), makeGarment({ id: 'x2' })],
      pending: null,
    }
    const storage = makeStorage({ [DEFAULT_STORAGE_KEY]: JSON.stringify(state) })
    const repo = makeRepo(storage)
    expect((await repo.getGarment('x1'))?.laundryUntil).toBeNull()
    // L'état enregistré est nettoyé lui aussi, pas seulement la lecture.
    await repo.washGarment('x2')
    expect(storedGarment(storage, 'x1')?.laundryUntil).toBeNull()
  })

  it('forme incohérente (bonne version) : repart des données d’exemple', async () => {
    const badDate = { ...createSampleState(START), pending: { wornOn: 'hier', garmentIds: ['g01'] } }
    const unknownId = { ...createSampleState(START), garments: [{ id: 'z' }] }
    const orphanPending = { ...createSampleState(START), garments: [makeGarment()] }
    const badSettings = { ...createSampleState(START), settings: { dormancyDays: 180, usagePeriod: 90 } }
    for (const state of [badDate, unknownId, orphanPending, badSettings]) {
      const repo = makeRepo(makeStorage({ [DEFAULT_STORAGE_KEY]: JSON.stringify(state) }))
      expect(await repo.listGarments()).toHaveLength(17)
      expect(await repo.getPendingConfirmation()).toEqual({ wornOn: '2026-10-26', garmentIds: ['g03', 'g02', 'g06'] })
      expect(await repo.advanceDay()).toBe('2026-10-28')
    }
  })

  it('fonctionne en mémoire sans storage', async () => {
    const repo = makeRepo(null)
    await repo.washGarment('g01')
    expect((await repo.getGarment('g01'))?.laundryUntil).toBe('2026-10-31')
  })

  it('fonctionne en mémoire quand le storage lève une exception', async () => {
    const repo = makeRepo(throwingStorage)
    expect(await repo.listGarments()).toHaveLength(17)
    await repo.washGarment('g01')
    expect((await repo.getGarment('g01'))?.laundryUntil).toBe('2026-10-31')
  })

  it('reset repart des données d’exemple au jour de départ fourni', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2031, 4, 5, 12))
    const repo = makeRepo()
    await repo.advanceDay()
    await repo.setGarmentStatus('g01', 'donated')
    await repo.reset()
    expect(await repo.today()).toBe(START)
    expect((await repo.getGarment('g01'))?.status).toBe('active')
    expect(await repo.getPendingConfirmation()).not.toBeNull()
  })

  it('sans jour de départ : le jour réel de l’appareil, à la création et au reset', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2031, 4, 5, 12))
    const repo = createLocalRepository({ storage: null })
    expect(await repo.today()).toBe('2031-05-05')
    await repo.advanceDay()
    vi.setSystemTime(new Date(2031, 4, 9, 12))
    // Le jour simulé ne suit pas l'horloge : seul reset la relit.
    expect(await repo.today()).toBe('2031-05-06')
    await repo.reset()
    expect(await repo.today()).toBe('2031-05-09')
  })
})

describe('createLocalRepository : ports et confirmation', () => {
  it('confirmWears enregistre les pièces à la date d’hier et vide l’attente', async () => {
    const repo = makeRepo()
    const updated = await repo.confirmWears(['g03', 'g02', 'g06'])
    expect(updated.map((g) => g.id)).toEqual(['g03', 'g02', 'g06'])
    const tee = await repo.getGarment('g03')
    expect(tee?.lastWornAt).toBe('2026-10-26')
    expect(tee?.laundryUntil).toBe('2026-10-29')
    const jean = await repo.getGarment('g02')
    expect(jean?.lastWornAt).toBe('2026-10-26')
    expect(jean?.laundryUntil).toBeNull()
    expect(await repo.getPendingConfirmation()).toBeNull()
    const wears = (await repo.listWears()).filter((w) => w.wornOn === '2026-10-26')
    expect(wears).toHaveLength(3)
    expect(wears.every((w) => w.source === 'outfit_confirmed')).toBe(true)
  })

  it('confirmWears sans attente : erreur explicite, rien n’est enregistré', async () => {
    const repo = makeRepo()
    await repo.confirmWears(['g03'])
    const wears = await repo.listWears()
    await expect(repo.confirmWears(['g01'])).rejects.toThrow('Aucune pièce à confirmer')
    expect(await repo.listWears()).toEqual(wears)
  })

  it('confirmWears avec un id inconnu : « Pièce introuvable », attente conservée', async () => {
    const repo = makeRepo()
    await expect(repo.confirmWears(['g03', 'zzz'])).rejects.toThrow('Pièce introuvable')
    expect(await repo.getPendingConfirmation()).not.toBeNull()
    await repo.confirmWears([])
    await expect(repo.confirmWears(['zzz'])).rejects.toThrow('Pièce introuvable')
  })

  it('recordWears dans le passé : lavage déjà terminé nettoyé partout', async () => {
    const storage = makeStorage()
    const repo = makeRepo(storage)
    const [tee] = await repo.recordWears(['g03'], '2026-10-01', 'manual')
    expect(tee.lastWornAt).toBe('2026-10-18')
    expect(tee.laundryUntil).toBeNull()
    expect(storedGarment(storage, 'g03')?.laundryUntil).toBeNull()
    expect(await repo.listWears()).toContainEqual({ garmentId: 'g03', wornOn: '2026-10-01', source: 'manual' })
  })

  it('recordWears refuse une date future', async () => {
    const repo = makeRepo()
    await expect(repo.recordWears(['g01'], '2026-10-28', 'manual')).rejects.toThrow('futur')
    expect((await repo.getGarment('g01'))?.lastWornAt).toBe('2026-03-27')
  })

  it('recordWears ignore une pièce non active', async () => {
    const repo = makeRepo()
    await repo.setGarmentStatus('g01', 'donated')
    const wears = await repo.listWears()
    const [chemise] = await repo.recordWears(['g01'], START, 'manual')
    expect(chemise.lastWornAt).toBe('2026-03-27')
    expect(await repo.listWears()).toEqual(wears)
  })

  it('confirmWears accepte une sélection corrigée', async () => {
    const repo = makeRepo()
    await repo.confirmWears(['g03'])
    expect((await repo.getGarment('g02'))?.lastWornAt).toBe('2026-10-21')
    expect(await repo.getPendingConfirmation()).toBeNull()
  })

  it('recordWears n’enregistre qu’un port par pièce et par jour', async () => {
    const repo = makeRepo()
    await repo.recordWears(['g01'], START, 'manual')
    await repo.recordWears(['g01', 'g01'], START, 'manual')
    expect((await repo.listWears()).filter((w) => w.garmentId === 'g01' && w.wornOn === START)).toHaveLength(1)
    expect((await repo.getGarment('g01'))?.lastWornAt).toBe(START)
  })

  it('markGarmentClean sort la pièce du lavage', async () => {
    const repo = makeRepo()
    expect((await repo.markGarmentClean('g04')).laundryUntil).toBeNull()
  })
})

describe('createLocalRepository : advanceDay', () => {
  it('sans tenue validée : applique l’attente, passe au lendemain et nettoie le lavage expiré', async () => {
    const storage = makeStorage()
    const repo = makeRepo(storage)
    await repo.saveDailyOutfit({ day: START, orphanId: null, status: 'dismissed' })
    expect(await repo.advanceDay()).toBe('2026-10-28')
    expect(await repo.today()).toBe('2026-10-28')
    expect(await repo.getPendingConfirmation()).toBeNull()
    expect((await repo.getGarment('g03'))?.lastWornAt).toBe('2026-10-26')
    expect((await repo.getGarment('g04'))?.laundryUntil).toBeNull()
    // Étape (d) : le nettoyage est fait dans l'état enregistré, pas seulement à la lecture.
    expect(storedGarment(storage, 'g04')?.laundryUntil).toBeNull()
    expect(await repo.getDailyOutfit()).toEqual({ day: '2026-10-28', orphanId: null, status: 'proposed' })
  })

  it('tenue seulement proposée (jamais sauvegardée) : aucune attente créée', async () => {
    const repo = makeRepo()
    await repo.advanceDay()
    expect(await repo.getPendingConfirmation()).toBeNull()
    expect((await repo.getGarment('g17'))?.lastWornAt).toBe('2025-09-12')
  })

  it('washGarment après advanceDay part du jour simulé', async () => {
    const repo = makeRepo()
    await repo.advanceDay()
    expect((await repo.washGarment('g01')).laundryUntil).toBe('2026-11-01')
  })

  it('avec tenue validée : ses pièces deviennent l’attente de confirmation du lendemain', async () => {
    const repo = makeRepo()
    await repo.saveDailyOutfit({ day: START, orphanId: null, status: 'validated' })
    await repo.advanceDay()
    // Robe grise en maille (la plus oubliée) + Baskets blanches (chaussures portées le plus récemment).
    expect(await repo.getPendingConfirmation()).toEqual({ wornOn: START, garmentIds: ['g17', 'g06'] })
    expect((await repo.getGarment('g17'))?.lastWornAt).toBe('2025-09-12')
  })

  it('respecte l’orpheline choisie', async () => {
    const repo = makeRepo()
    await repo.saveDailyOutfit({ day: START, orphanId: 'g01', status: 'validated' })
    await repo.advanceDay()
    expect((await repo.getPendingConfirmation())?.garmentIds[0]).toBe('g01')
  })

  it('l’attente non confirmée est appliquée au jour suivant', async () => {
    const repo = makeRepo()
    await repo.saveDailyOutfit({ day: START, orphanId: null, status: 'validated' })
    await repo.advanceDay()
    await repo.advanceDay()
    expect(await repo.today()).toBe('2026-10-29')
    expect(await repo.getPendingConfirmation()).toBeNull()
    const robe = await repo.getGarment('g17')
    expect(robe?.lastWornAt).toBe(START)
    expect(robe?.laundryUntil).toBe('2026-10-30')
    expect(await repo.listWears()).toContainEqual({ garmentId: 'g17', wornOn: START, source: 'outfit_confirmed' })
  })

  it('mode miroir : la tenue validée est enregistrée directement', async () => {
    const repo = makeRepo()
    await repo.updateSettings({ mirrorMode: true })
    await repo.saveDailyOutfit({ day: START, orphanId: null, status: 'validated' })
    await repo.advanceDay()
    expect(await repo.getPendingConfirmation()).toBeNull()
    expect((await repo.getGarment('g17'))?.lastWornAt).toBe(START)
    expect(await repo.listWears()).toContainEqual({ garmentId: 'g06', wornOn: START, source: 'mirror' })
  })

  it('ignore une tenue sauvegardée pour un autre jour', async () => {
    const repo = makeRepo()
    await repo.saveDailyOutfit({ day: '2026-10-20', orphanId: 'g01', status: 'validated' })
    expect(await repo.getDailyOutfit()).toEqual({ day: START, orphanId: null, status: 'proposed' })
    await repo.advanceDay()
    expect(await repo.getPendingConfirmation()).toBeNull()
  })

  it('une tenue d’un autre jour n’écrase pas la tenue validée du jour', async () => {
    const repo = makeRepo()
    await repo.saveDailyOutfit({ day: START, orphanId: 'g01', status: 'validated' })
    await repo.saveDailyOutfit({ day: '2026-10-26', orphanId: null, status: 'dismissed' })
    expect(await repo.getDailyOutfit()).toEqual({ day: START, orphanId: 'g01', status: 'validated' })
    await repo.advanceDay()
    expect(await repo.getPendingConfirmation()).toEqual({ wornOn: START, garmentIds: ['g01', 'g02', 'g06'] })
  })

  it('les pièces sont figées à la validation, même si le dressing change ensuite', async () => {
    const repo = makeRepo()
    await repo.saveDailyOutfit({ day: START, orphanId: null, status: 'validated' })
    await repo.washGarment('g17')
    await repo.advanceDay()
    expect(await repo.getPendingConfirmation()).toEqual({ wornOn: START, garmentIds: ['g17', 'g06'] })
  })

  it('une pièce donnée après la validation sort de l’attente', async () => {
    const repo = makeRepo()
    await repo.saveDailyOutfit({ day: START, orphanId: null, status: 'validated' })
    await repo.setGarmentStatus('g17', 'donated')
    await repo.advanceDay()
    expect(await repo.getPendingConfirmation()).toEqual({ wornOn: START, garmentIds: ['g06'] })
  })

  it('revenir sur la validation annule l’enregistrement', async () => {
    const repo = makeRepo()
    await repo.saveDailyOutfit({ day: START, orphanId: null, status: 'validated' })
    await repo.saveDailyOutfit({ day: START, orphanId: null, status: 'proposed' })
    await repo.advanceDay()
    expect(await repo.getPendingConfirmation()).toBeNull()
  })
})

describe('createLocalRepository : pièces et achats', () => {
  it('acceptPurchase ajoute la pièce avec la date de détection', async () => {
    const repo = makeRepo()
    const garment = await repo.acceptPurchase('p1')
    expect(garment).toMatchObject({
      id: 'g18',
      name: 'Pull col rond en laine',
      source: 'purchase',
      acquiredAt: '2026-10-25',
      lastWornAt: null,
      status: 'active',
    })
    expect(await repo.listGarments()).toHaveLength(18)
    expect((await repo.listPurchaseCandidates()).map((p) => p.id)).toEqual(['p2', 'p3'])
  })

  it('addGarment crée des ids déterministes', async () => {
    const repo = makeRepo()
    const a = await repo.addGarment({ name: ' Gilet ', category: 'long', agreement: 'm' })
    const b = await repo.addGarment({ name: 'Short', category: 'pants', agreement: 'm', acquiredAt: '2026-06-01' })
    expect(a).toMatchObject({ id: 'g18', name: 'Gilet', source: 'manual', acquiredAt: START, color: null })
    expect(b).toMatchObject({ id: 'g19', acquiredAt: '2026-06-01' })
  })

  it('setGarmentStatus : donner puis réactiver', async () => {
    const storage = makeStorage()
    const repo = makeRepo(storage)
    expect((await repo.setGarmentStatus('g01', 'donated')).status).toBe('donated')
    expect(await repo.listGarments()).toHaveLength(17)
    expect((await repo.getGarment('g01'))?.status).toBe('donated')
    expect((await makeRepo(storage).getGarment('g01'))?.status).toBe('donated')
    expect((await repo.setGarmentStatus('g01', 'active')).status).toBe('active')
    expect((await repo.getGarment('g01'))?.status).toBe('active')
    expect((await makeRepo(storage).getGarment('g01'))?.status).toBe('active')
  })

  it('updateSettings refuse une valeur hors liste', async () => {
    const repo = makeRepo()
    expect(await repo.updateSettings({ dormancyDays: 365 })).toMatchObject({ dormancyDays: 365 })
    await expect(repo.updateSettings({ usagePeriod: 30 as never })).rejects.toThrow()
  })

  it('updateSettings ignore les clés à undefined', async () => {
    const storage = makeStorage()
    const repo = makeRepo(storage)
    await repo.updateSettings({ mirrorMode: true })
    // Écrit tout de suite : un rechargement retrouve le mode miroir.
    expect((await makeRepo(storage).getSettings()).mirrorMode).toBe(true)
    expect(await repo.updateSettings({ mirrorMode: undefined, dormancyDays: 90 })).toEqual({
      dormancyDays: 90,
      usagePeriod: 90,
      mirrorMode: true,
    })
    await expect(repo.updateSettings({ mirrorMode: 'oui' as never })).rejects.toThrow()
  })

  it('id inconnu : erreur « Pièce introuvable »', async () => {
    const repo = makeRepo()
    expect(await repo.getGarment('zzz')).toBeNull()
    await expect(repo.washGarment('zzz')).rejects.toThrow('Pièce introuvable')
    await expect(repo.markGarmentClean('zzz')).rejects.toThrow('Pièce introuvable')
    await expect(repo.setGarmentStatus('zzz', 'sold')).rejects.toThrow('Pièce introuvable')
    await expect(repo.recordWears(['g01', 'zzz'], START, 'manual')).rejects.toThrow('Pièce introuvable')
    await expect(repo.acceptPurchase('zzz')).rejects.toThrow('Pièce introuvable')
    await expect(repo.ignorePurchase('zzz')).rejects.toThrow('Pièce introuvable')
    // Un appel refusé ne laisse aucune trace.
    expect((await repo.getGarment('g01'))?.lastWornAt).toBe('2026-03-27')
  })
})

describe('createLocalRepository : copies défensives', () => {
  it('muter les objets renvoyés ne modifie pas l’état', async () => {
    const repo = makeRepo()
    const garments = await repo.listGarments()
    garments[0].name = 'modifié'
    garments.pop()
    const one = await repo.getGarment('g02')
    if (one) one.status = 'sold'
    const pending = await repo.getPendingConfirmation()
    pending?.garmentIds.push('g01')
    const settings = await repo.getSettings()
    settings.mirrorMode = true
    const outfit = await repo.getDailyOutfit()
    outfit.status = 'validated'
    const purchases = await repo.listPurchaseCandidates()
    purchases[0].name = 'modifié'
    const wears = await repo.listWears()
    wears.length = 0
    const added = await repo.addGarment({ name: 'Gilet', category: 'long', agreement: 'm' })
    added.name = 'modifié'

    expect((await repo.listGarments())[0].name).toBe('Chemise en lin vert sauge')
    expect(await repo.listGarments()).toHaveLength(18)
    expect((await repo.getGarment('g02'))?.status).toBe('active')
    expect((await repo.getPendingConfirmation())?.garmentIds).toEqual(['g03', 'g02', 'g06'])
    expect((await repo.getSettings()).mirrorMode).toBe(false)
    expect((await repo.getDailyOutfit()).status).toBe('proposed')
    expect((await repo.listPurchaseCandidates())[0].name).toBe('Pull col rond en laine')
    expect(await repo.listWears()).toHaveLength(17)
    expect((await repo.getGarment('g18'))?.name).toBe('Gilet')
  })

  it('l’objet passé à saveDailyOutfit n’est pas gardé par référence', async () => {
    const repo = makeRepo()
    const outfit = { day: START, orphanId: null, status: 'proposed' as const }
    await repo.saveDailyOutfit(outfit)
    Object.assign(outfit, { status: 'validated' })
    expect((await repo.getDailyOutfit()).status).toBe('proposed')
  })
})

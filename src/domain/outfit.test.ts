import { describe, expect, it } from 'vitest'
import { addDays } from './dates'
import { buildOutfit, nextOrphanId, outfitCandidates, outfitGarmentIds } from './outfit'
import type { Garment, GarmentCategory } from './types'

const TODAY = '2026-10-27'

let counter = 0
function makeGarment(overrides: Partial<Garment> = {}): Garment {
  counter += 1
  return {
    id: `g${counter}`,
    name: `Pièce ${counter}`,
    category: 'tee',
    color: null,
    size: null,
    brand: null,
    photoPath: null,
    agreement: 'm',
    source: 'manual',
    originGarmentId: null,
    acquiredAt: '2024-01-01',
    lastWornAt: TODAY,
    laundryUntil: null,
    status: 'active',
    ...overrides,
  }
}

/** Pièce portée il y a « days » jours. */
function worn(id: string, category: GarmentCategory, days: number, overrides: Partial<Garment> = {}): Garment {
  return makeGarment({ id, name: id, category, lastWornAt: addDays(TODAY, -days), ...overrides })
}

const ids = (garments: Garment[]) => garments.map((g) => g.id)

describe('outfitCandidates', () => {
  it('exclut les chaussures, le lavage et les pièces non actives, la plus oubliée d’abord', () => {
    const garments = [
      worn('tee', 'tee', 10),
      worn('shoes', 'shoes', 300),
      worn('laundry', 'long', 200, { laundryUntil: addDays(TODAY, 1) }),
      worn('donated', 'pants', 500, { status: 'donated' }),
      worn('pants', 'pants', 50),
    ]
    expect(ids(outfitCandidates(garments, TODAY))).toEqual(['pants', 'tee'])
  })

  it('départage par nom puis par identifiant', () => {
    const garments = [
      worn('b', 'tee', 10, { name: 'Zèbre' }),
      worn('c', 'tee', 10, { name: 'Écharpe' }),
      worn('a', 'tee', 10, { name: 'Zèbre' }),
    ]
    expect(ids(outfitCandidates(garments, TODAY))).toEqual(['c', 'a', 'b'])
  })
})

describe('buildOutfit', () => {
  it('renvoie null quand tout est au lavage', () => {
    const until = addDays(TODAY, 2)
    const garments = [worn('t', 'tee', 10, { laundryUntil: until }), worn('p', 'pants', 5, { laundryUntil: until })]
    expect(buildOutfit(garments, TODAY)).toBeNull()
  })

  it('renvoie null quand seules des chaussures sont disponibles (le reste au lavage)', () => {
    const until = addDays(TODAY, 2)
    const garments = [
      worn('t', 'tee', 10, { laundryUntil: until }),
      worn('d', 'dress', 300, { laundryUntil: until }),
      worn('shoes', 'shoes', 400),
    ]
    expect(buildOutfit(garments, TODAY)).toBeNull()
    expect(nextOrphanId(garments, TODAY, null)).toBeNull()
  })

  it('renvoie null quand il n’y a aucune pièce', () => {
    expect(buildOutfit([], TODAY)).toBeNull()
  })

  it('compose une tenue sans chaussures quand il n’y en a pas', () => {
    const outfit = buildOutfit([worn('top', 'tee', 100), worn('bottom', 'pants', 3)], TODAY)
    expect(outfit && outfitGarmentIds(outfit)).toEqual(['top', 'bottom'])
  })

  it('n’ajoute que des chaussures à une robe orpheline', () => {
    const garments = [
      worn('dress', 'dress', 200),
      worn('top', 'tee', 2),
      worn('bottom', 'pants', 2),
      worn('shoes', 'shoes', 1),
    ]
    const outfit = buildOutfit(garments, TODAY)
    expect(outfit?.orphan.id).toBe('dress')
    expect(ids(outfit?.companions ?? [])).toEqual(['shoes'])
  })

  it('compte une pièce jamais portée depuis sa date d’acquisition', () => {
    const neverWorn = makeGarment({ id: 'new', category: 'tee', lastWornAt: null, acquiredAt: addDays(TODAY, -400) })
    const garments = [worn('old', 'tee', 300), neverWorn, worn('bottom', 'pants', 1)]
    expect(buildOutfit(garments, TODAY)?.orphan.id).toBe('new')

    const recent = makeGarment({ id: 'recent', category: 'tee', lastWornAt: null, acquiredAt: addDays(TODAY, -3) })
    expect(buildOutfit([worn('old', 'tee', 300), recent], TODAY)?.orphan.id).toBe('old')
  })

  it('associe à un haut orphelin le bas le plus récemment porté', () => {
    const garments = [
      worn('top', 'long', 300),
      worn('bottom-old', 'pants', 40),
      worn('bottom-recent', 'pants', 2),
      worn('bottom-mid', 'pants', 10),
    ]
    const outfit = buildOutfit(garments, TODAY)
    expect(outfit?.orphan.id).toBe('top')
    expect(ids(outfit?.companions ?? [])).toEqual(['bottom-recent'])
  })

  it('associe à un bas orphelin le haut le plus récemment porté (tee ou long)', () => {
    const garments = [
      worn('bottom', 'pants', 300),
      worn('tee', 'tee', 20),
      worn('long', 'long', 4),
      worn('shoes', 'shoes', 8),
    ]
    const outfit = buildOutfit(garments, TODAY)
    expect(outfit && outfitGarmentIds(outfit)).toEqual(['bottom', 'long', 'shoes'])
  })

  it('habille un manteau orphelin d’un haut, d’un bas et de chaussures', () => {
    const garments = [
      worn('coat', 'outerwear', 300),
      worn('shoes', 'shoes', 8),
      worn('bottom', 'pants', 3),
      worn('top', 'tee', 2),
    ]
    const outfit = buildOutfit(garments, TODAY)
    expect(outfit && outfitGarmentIds(outfit)).toEqual(['coat', 'top', 'bottom', 'shoes'])
  })

  it('n’ajoute que des chaussures à une pièce « autre »', () => {
    const garments = [worn('scarf', 'other', 300), worn('top', 'tee', 2), worn('shoes', 'shoes', 1)]
    const outfit = buildOutfit(garments, TODAY)
    expect(outfit && outfitGarmentIds(outfit)).toEqual(['scarf', 'shoes'])
  })

  it('ignore une pièce préférée au lavage', () => {
    const garments = [worn('forgotten', 'tee', 300), worn('preferred', 'tee', 5, { laundryUntil: addDays(TODAY, 1) })]
    expect(buildOutfit(garments, TODAY, 'preferred')?.orphan.id).toBe('forgotten')
  })

  it('ignore une pièce préférée inconnue ou non active', () => {
    const garments = [worn('forgotten', 'tee', 300), worn('sold', 'tee', 500, { status: 'sold' })]
    expect(buildOutfit(garments, TODAY, 'sold')?.orphan.id).toBe('forgotten')
    expect(buildOutfit(garments, TODAY, 'nope')?.orphan.id).toBe('forgotten')
  })

  it('accepte des chaussures préférées et les habille d’un haut et d’un bas, sans autres chaussures', () => {
    const garments = [
      worn('dress', 'dress', 400),
      worn('boots', 'shoes', 200),
      worn('sneakers', 'shoes', 1),
      worn('top', 'tee', 2),
      worn('bottom', 'pants', 3),
    ]
    const outfit = buildOutfit(garments, TODAY, 'boots')
    expect(outfit && outfitGarmentIds(outfit)).toEqual(['boots', 'top', 'bottom'])
  })

  it('exclut les pièces non actives des compléments', () => {
    const garments = [
      worn('top', 'tee', 300),
      worn('bottom-gone', 'pants', 1, { status: 'swapped_out' }),
      worn('bottom-archived', 'pants', 2, { status: 'archived' }),
      worn('bottom', 'pants', 30),
      worn('shoes-gone', 'shoes', 1, { status: 'donated' }),
    ]
    const outfit = buildOutfit(garments, TODAY)
    expect(outfit && outfitGarmentIds(outfit)).toEqual(['top', 'bottom'])
  })

  it('remet une pièce en jeu le jour où son lavage se termine', () => {
    const garments = [worn('top', 'tee', 300, { laundryUntil: TODAY }), worn('bottom', 'pants', 3)]
    expect(buildOutfit(garments, TODAY)?.orphan.id).toBe('top')
  })

  it('départage les valeurs sûres par nom', () => {
    const garments = [
      worn('top', 'tee', 300),
      worn('p2', 'pants', 3, { name: 'Pantalon noir' }),
      worn('p1', 'pants', 3, { name: 'Jean droit' }),
    ]
    expect(ids(buildOutfit(garments, TODAY)?.companions ?? [])).toEqual(['p1'])
  })

  it('départage les valeurs sûres par identifiant à nom et jours égaux', () => {
    const garments = [
      worn('top', 'tee', 300),
      worn('p-b', 'pants', 3, { name: 'Jean' }),
      worn('p-a', 'pants', 3, { name: 'Jean' }),
    ]
    expect(ids(buildOutfit(garments, TODAY)?.companions ?? [])).toEqual(['p-a'])
  })

  it('exclut les pièces au lavage des compléments', () => {
    const until = addDays(TODAY, 1)
    const garments = [
      worn('top', 'tee', 300),
      worn('bottom-wash', 'pants', 1, { laundryUntil: until }),
      worn('bottom', 'pants', 30),
      worn('shoes-wash', 'shoes', 1, { laundryUntil: until }),
      worn('shoes', 'shoes', 20),
    ]
    const outfit = buildOutfit(garments, TODAY)
    expect(outfit && outfitGarmentIds(outfit)).toEqual(['top', 'bottom', 'shoes'])
  })

  it('ne modifie pas les pièces reçues', () => {
    const garments = [worn('top', 'tee', 300), worn('bottom', 'pants', 3)]
    const snapshot = structuredClone(garments)
    buildOutfit(garments, TODAY)
    outfitCandidates(garments, TODAY)
    expect(garments).toEqual(snapshot)
  })
})

describe('nextOrphanId', () => {
  const garments = [worn('a', 'tee', 300), worn('b', 'pants', 200), worn('c', 'dress', 100), worn('s', 'shoes', 999)]

  it('passe au candidat suivant, en boucle', () => {
    expect(nextOrphanId(garments, TODAY, 'a')).toBe('b')
    expect(nextOrphanId(garments, TODAY, 'b')).toBe('c')
    expect(nextOrphanId(garments, TODAY, 'c')).toBe('a')
  })

  it('sans orpheline choisie (null), passe au 2e candidat : la 1re est déjà affichée', () => {
    // Prototype : otherOutfit() part de outfit().orphan, qui vaut candidates()[0] quand orphanId est vide.
    expect(buildOutfit(garments, TODAY, null)?.orphan.id).toBe('a')
    expect(nextOrphanId(garments, TODAY, null)).toBe('b')
  })

  it('id inconnu ou pièce préférée au lavage : l’orpheline affichée est la 1re, on passe à la 2e', () => {
    expect(nextOrphanId(garments, TODAY, 'nope')).toBe('b')
    const withLaundry = [...garments, worn('w', 'tee', 50, { laundryUntil: addDays(TODAY, 1) })]
    expect(nextOrphanId(withLaundry, TODAY, 'w')).toBe('b')
  })

  it('repart du premier candidat après des chaussures préférées (non candidates)', () => {
    expect(nextOrphanId(garments, TODAY, 's')).toBe('a')
  })

  it('enchaîner « Autre proposition » depuis null parcourt tous les candidats', () => {
    const seen: (string | null)[] = []
    let current: string | null = null
    for (let i = 0; i < 4; i += 1) {
      current = nextOrphanId(garments, TODAY, current)
      seen.push(current)
    }
    expect(seen).toEqual(['b', 'c', 'a', 'b'])
  })

  it('renvoie null avec un seul candidat', () => {
    expect(nextOrphanId([worn('a', 'tee', 300), worn('s', 'shoes', 10)], TODAY, 'a')).toBeNull()
    expect(nextOrphanId([], TODAY, null)).toBeNull()
  })
})

describe('outfitGarmentIds', () => {
  it('liste l’orpheline puis les compléments', () => {
    const outfit = { orphan: worn('o', 'tee', 1), companions: [worn('b', 'pants', 1), worn('s', 'shoes', 1)] }
    expect(outfitGarmentIds(outfit)).toEqual(['o', 'b', 's'])
  })
})

describe('données du prototype', () => {
  // Les 17 pièces de seed() dans reference/prototype-e-mirror.html (last = jours depuis le port).
  const PROTOTYPE: [string, GarmentCategory, number][] = [
    ['Chemise en lin vert sauge', 'long', 214],
    ['Jean droit', 'pants', 6],
    ['T-shirt gris chiné', 'tee', 9],
    ['Pull en laine brique', 'long', 4],
    ['Robe midi noire', 'dress', 41],
    ['Baskets blanches', 'shoes', 5],
    ['Pantalon chino beige', 'pants', 28],
    ['T-shirt sable', 'tee', 270],
    ['Pantalon noir', 'pants', 20],
    ['Pull col rond gris', 'long', 335],
    ['Robe portefeuille bordeaux', 'dress', 150],
    ['Chemise blanche', 'long', 62],
    ['Jean noir', 'pants', 18],
    ['Bottines brunes', 'shoes', 95],
    ['T-shirt blanc', 'tee', 11],
    ['Veste en jean', 'long', 120],
    ['Robe grise en maille', 'dress', 410],
  ]
  const garments = PROTOTYPE.map(([name, category, last], i) =>
    makeGarment({
      id: String(i + 1),
      name,
      category,
      lastWornAt: addDays(TODAY, -last),
      // Le pull en laine brique est au lavage jusqu'à demain.
      laundryUntil: name === 'Pull en laine brique' ? addDays(TODAY, 1) : null,
    }),
  )
  const names = (list: Garment[]) => list.map((g) => g.name)

  it('propose la robe grise en maille (410 jours) avec les baskets blanches seulement', () => {
    const outfit = buildOutfit(garments, TODAY)
    expect(outfit?.orphan.name).toBe('Robe grise en maille')
    expect(names(outfit?.companions ?? [])).toEqual(['Baskets blanches'])
  })

  it('exclut le pull au lavage des candidates', () => {
    expect(names(outfitCandidates(garments, TODAY))).not.toContain('Pull en laine brique')
    expect(outfitCandidates(garments, TODAY)).toHaveLength(14)
  })

  it('habille la chemise en lin (orpheline initiale du prototype) du jean droit et des baskets', () => {
    const outfit = buildOutfit(garments, TODAY, '1')
    expect(outfit && names([outfit.orphan, ...outfit.companions])).toEqual([
      'Chemise en lin vert sauge',
      'Jean droit',
      'Baskets blanches',
    ])
  })

  it('habille le jean droit du t-shirt gris chiné, pas du pull au lavage', () => {
    const outfit = buildOutfit(garments, TODAY, '2')
    expect(outfit && names([outfit.orphan, ...outfit.companions])).toEqual([
      'Jean droit',
      'T-shirt gris chiné',
      'Baskets blanches',
    ])
  })

  it('« Autre proposition » passe de la robe grise au pull col rond gris', () => {
    expect(nextOrphanId(garments, TODAY, '17')).toBe('10')
    expect(nextOrphanId(garments, TODAY, null)).toBe('10')
  })
})

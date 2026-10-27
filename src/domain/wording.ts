// Textes français dérivés des règles métier, repris du prototype (dur(), notWorn(), wornAgo(), plural()).
import type { Agreement, GarmentCategory, ItemCondition } from './types'

/** Règle française : 0 et 1 au singulier. */
export function plural(n: number, singular: string, pluralForm: string): string {
  return n > 1 ? pluralForm : singular
}

/** Durée lisible après « depuis » ou « il y a ». 0 jour donne « 1 jour », comme dans le prototype. */
export function formatDuration(days: number): string {
  if (days <= 1) return '1 jour'
  if (days < 30) return `${days} jours`
  return `${Math.round(days / 30)} mois`
}

const PARTICIPLES: Record<Agreement, string> = {
  m: 'porté',
  f: 'portée',
  mp: 'portés',
  fp: 'portées',
}

export function participle(agreement: Agreement): string {
  return PARTICIPLES[agreement]
}

/** Ex. « Pas portée depuis 7 mois ». */
export function notWornSince(agreement: Agreement, days: number): string {
  return `Pas ${participle(agreement)} depuis ${formatDuration(days)}`
}

/** Ex. « Portée il y a 3 jours ». */
export function wornAgo(agreement: Agreement, days: number): string {
  const word = participle(agreement)
  return `${word.charAt(0).toUpperCase()}${word.slice(1)} il y a ${formatDuration(days)}`
}

export const CATEGORY_LABELS: Record<GarmentCategory, string> = {
  tee: 'T-shirt, top',
  long: 'Chemise, pull, veste',
  pants: 'Pantalon, jean, jupe',
  dress: 'Robe',
  shoes: 'Chaussures',
  outerwear: 'Manteau',
  other: 'Autre',
}

export const CONDITION_LABELS: Record<ItemCondition, string> = {
  new_with_tag: 'Neuf avec étiquette',
  very_good: 'Très bon état',
  good: 'Bon état',
  fair: 'État satisfaisant',
}

const ENDINGS: Record<Agreement, string> = { m: '', f: 'e', mp: 's', fp: 'es' }
const PRONOUNS: Record<Agreement, string> = { m: 'il', f: 'elle', mp: 'ils', fp: 'elles' }

/** Accorde un participe régulier : agree('f', 'donné') → « donnée ». */
export function agree(agreement: Agreement, masculineSingular: string): string {
  return masculineSingular + ENDINGS[agreement]
}

/** Pronom sujet : « il », « elle », « ils », « elles ». */
export function pronoun(agreement: Agreement): string {
  return PRONOUNS[agreement]
}

const OBJECT_PRONOUNS: Record<Agreement, string> = { m: 'le', f: 'la', mp: 'les', fp: 'les' }

/** Pronom complément : « la » dans « La proposer aujourd’hui ». */
export function objectPronoun(agreement: Agreement): string {
  return OBJECT_PRONOUNS[agreement]
}

/** Accord d'un verbe du 1er groupe au présent (3e personne) : verb('mp', 'dort', 'dorment'). */
export function verb(agreement: Agreement, singular: string, pluralForm: string): string {
  return agreement.endsWith('p') ? pluralForm : singular
}

/** « de » élidé devant une voyelle : de('Inès') → « d’Inès », de('Léo') → « de Léo ». */
export function de(word: string): string {
  return /^[aeiouyàâäéèêëîïôöùûü]/i.test(word) ? `d’${word}` : `de ${word}`
}

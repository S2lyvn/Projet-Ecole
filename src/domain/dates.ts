// Arithmétique sur les dates calendaires « AAAA-MM-JJ ».
// Calculs en UTC pour ne pas dépendre du fuseau ni des changements d'heure.
import type { IsoDate } from './types'

const MS_PER_DAY = 86_400_000
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

function toUtcMs(date: IsoDate): number {
  const match = ISO_DATE.exec(date)
  if (!match) throw new Error(`Date invalide : « ${date} » (format attendu AAAA-MM-JJ)`)
  const [, y, m, d] = match
  const ms = Date.UTC(Number(y), Number(m) - 1, Number(d))
  if (new Date(ms).toISOString().slice(0, 10) !== date) throw new Error(`Date invalide : « ${date} »`)
  return ms
}

function fromUtcMs(ms: number): IsoDate {
  return new Date(ms).toISOString().slice(0, 10)
}

/** Date locale de l'appareil (pas UTC) : c'est « aujourd'hui » pour l'utilisateur. */
export function toIsoDate(date: Date): IsoDate {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isIsoDate(value: string): boolean {
  try {
    toUtcMs(value)
    return true
  } catch {
    return false
  }
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return fromUtcMs(toUtcMs(date) + days * MS_PER_DAY)
}

/** Ajoute des mois calendaires ; le jour est ramené au dernier jour du mois si besoin (31 janv. + 1 mois = 28 ou 29 févr.). */
export function addMonths(date: IsoDate, months: number): IsoDate {
  const d = new Date(toUtcMs(date))
  const day = d.getUTCDate()
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1))
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  target.setUTCDate(Math.min(day, lastDay))
  return fromUtcMs(target.getTime())
}

/** Nombre de jours de « from » à « to » (négatif si « to » est avant « from »). */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / MS_PER_DAY)
}

export function maxDate(a: IsoDate | null, b: IsoDate | null): IsoDate | null {
  if (a === null) return b
  if (b === null) return a
  return a > b ? a : b
}

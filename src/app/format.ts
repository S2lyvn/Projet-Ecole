// Mise en forme des dates pour l'interface (français). Les calculs restent dans src/domain/dates.ts.
import type { IsoDate } from '../domain/types'

function toLocalDate(date: IsoDate): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const LONG = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
const WEEKDAY = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' })
const WEEKDAY_SHORT = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' })

/** « Mardi 27 octobre » */
export function formatLongDate(date: IsoDate): string {
  return capitalize(LONG.format(toLocalDate(date)))
}

/** « mardi » */
export function formatWeekday(date: IsoDate): string {
  return WEEKDAY.format(toLocalDate(date))
}

/** « mar. » */
export function formatWeekdayShort(date: IsoDate): string {
  return WEEKDAY_SHORT.format(toLocalDate(date))
}

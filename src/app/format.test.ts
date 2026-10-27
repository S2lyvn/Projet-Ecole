import { describe, expect, it } from 'vitest'
import { formatLongDate, formatWeekday, formatWeekdayShort } from './format'

describe('format des dates', () => {
  it('écrit la date longue avec une majuscule', () => {
    expect(formatLongDate('2026-10-27')).toBe('Mardi 27 octobre')
  })

  it('donne le jour de la semaine', () => {
    expect(formatWeekday('2026-10-30')).toBe('vendredi')
    expect(formatWeekdayShort('2026-10-30')).toBe('ven.')
  })
})

import { describe, expect, it } from 'vitest'
import { addDays, addMonths, daysBetween, isIsoDate, maxDate, toIsoDate } from './dates'

describe('dates', () => {
  it('ajoute des jours en traversant mois, années et changement d’heure', () => {
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26') // passage à l'heure d'hiver le 25
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29')
  })

  it('compte les jours entre deux dates', () => {
    expect(daysBetween('2026-10-27', '2026-10-27')).toBe(0)
    expect(daysBetween('2026-10-20', '2026-10-27')).toBe(7)
    expect(daysBetween('2026-10-27', '2026-10-20')).toBe(-7)
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2) // passage à l'heure d'été le 29
  })

  it('ajoute des mois en gardant un jour valide', () => {
    expect(addMonths('2026-10-27', -3)).toBe('2026-07-27')
    expect(addMonths('2026-05-31', -3)).toBe('2026-02-28')
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2026-11-15', 2)).toBe('2027-01-15')
  })

  it('refuse les dates mal formées', () => {
    expect(isIsoDate('2026-02-30')).toBe(false)
    expect(isIsoDate('27/10/2026')).toBe(false)
    expect(isIsoDate('2026-10-27')).toBe(true)
    expect(() => addDays('2026-13-01', 1)).toThrow()
  })

  it('formate la date locale', () => {
    expect(toIsoDate(new Date(2026, 9, 27, 23, 30))).toBe('2026-10-27')
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('garde la date la plus récente', () => {
    expect(maxDate(null, '2026-10-01')).toBe('2026-10-01')
    expect(maxDate('2026-10-02', null)).toBe('2026-10-02')
    expect(maxDate('2026-10-02', '2026-09-30')).toBe('2026-10-02')
    expect(maxDate(null, null)).toBeNull()
  })
})

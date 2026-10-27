import { describe, expect, it } from 'vitest'
import { isSecondaryPath, transitionDirection } from './navigation'

describe('navigation', () => {
  it('reconnaît les écrans secondaires', () => {
    expect(isSecondaryPath('/confirmer')).toBe(true)
    expect(isSecondaryPath('/vendre/g01')).toBe(true)
    expect(isSecondaryPath('/echanges/annonce/l1')).toBe(true)
    expect(isSecondaryPath('/echanges')).toBe(false)
    expect(isSecondaryPath('/')).toBe(false)
  })

  it('glisse dans le sens de la navigation', () => {
    expect(transitionDirection('/', '/bilan')).toBe(1)
    expect(transitionDirection('/bilan', '/dressing')).toBe(-1)
    expect(transitionDirection('/', '/confirmer')).toBe(1)
    expect(transitionDirection('/confirmer', '/dressing')).toBe(-1)
  })
})

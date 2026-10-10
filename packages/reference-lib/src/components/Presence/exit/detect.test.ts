// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { detectExitEffects } from './detect'

/**
 * Unit proof for `exit/detect`: a bare element with no effects reports an
 * instant exit. Finite-effect verdicts pin down in `effects.test.ts`;
 * browser CT proves retention end to end.
 */

describe('detectExitEffects', () => {
  it('reports no finite effects for a bare element', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    try {
      expect(detectExitEffects(el, 'none')).toEqual({
        hasFiniteAnimation: false,
        hasFiniteTransition: false,
        hasFiniteGsap: false,
      })
    } finally {
      el.remove()
    }
  })
})

// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { computeCoordsFromPlacement } from './floating'

describe('overlay floating RTL', () => {
  it('keeps the bottom-start token and aligns to the physical end in RTL', () => {
    const reference = new DOMRect(100, 40, 50, 20)
    const floating = new DOMRect(0, 0, 80, 30)

    const ltr = computeCoordsFromPlacement(reference, floating, 'bottom-start', false)
    const rtl = computeCoordsFromPlacement(reference, floating, 'bottom-start', true)

    expect(ltr.x).toBe(100)
    expect(ltr.y).toBe(60)
    expect(rtl.x).toBe(70)
    expect(rtl.y).toBe(60)
  })

  it('does not swap physical left/right placements in RTL', () => {
    const reference = new DOMRect(100, 40, 50, 20)
    const floating = new DOMRect(0, 0, 80, 30)
    const ltr = computeCoordsFromPlacement(reference, floating, 'left', false)
    const rtl = computeCoordsFromPlacement(reference, floating, 'left', true)
    expect(ltr).toEqual(rtl)
    expect(ltr.x).toBe(20)
  })
})

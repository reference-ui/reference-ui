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

describe('overlay floating boundary and shift', () => {
  it('flips when overflowing a container boundary', async () => {
    const { computePosition } = await import('./floating')

    const boundary = {
      getBoundingClientRect: () => new DOMRect(100, 100, 500, 300),
    }

    const reference = {
      getBoundingClientRect: () => new DOMRect(500, 150, 40, 40),
    }

    const floatingEl = document.createElement('div')
    floatingEl.getBoundingClientRect = () => new DOMRect(0, 0, 100, 50)

    // Requesting 'right' when reference is at x=500 and boundary right is 600
    // 500 + 40 + 8 (offset) + 100 (width) = 648 > 600 - 10 (boundRight)
    // Fits on left: 500 - 8 - 100 = 392 >= 100 + 10 (boundLeft)
    const res = computePosition(reference, floatingEl, {
      placement: 'right',
      boundary,
      offset: 8,
      collisionPadding: 10,
      flip: true,
      strategy: 'fixed',
    })

    expect(res.placement).toBe('left')
    expect(res.x).toBe(500 - 8 - 100)
  })

  it('nudges and calculates nudgedLeft and nudgedTop against boundary', async () => {
    const { computePosition } = await import('./floating')

    const boundary = {
      getBoundingClientRect: () => new DOMRect(50, 50, 400, 300),
    }

    // Reference near the top-left corner of boundary
    const reference = {
      getBoundingClientRect: () => new DOMRect(60, 55, 40, 40),
    }

    const floatingEl = document.createElement('div')
    floatingEl.getBoundingClientRect = () => new DOMRect(0, 0, 100, 80)

    // Center aligned to top: unshifted y = 55 - 80 - 8 = -33
    // But boundary top is 50, collisionPadding is 10 -> boundTop = 60
    // Flips to bottom: y = 55 + 40 + 8 = 103
    // Unshifted x = 60 + (40 - 100)/2 = 30
    // boundLeft is 50 + 10 = 60. So x must nudge right by 30px!
    const res = computePosition(reference, floatingEl, {
      placement: 'top',
      boundary,
      offset: 8,
      collisionPadding: 10,
      flip: true,
      shift: true,
      strategy: 'fixed',
    })

    expect(res.placement).toBe('bottom')
    expect(res.x).toBe(60) // Clamped to boundLeft = 60
    expect(res.middlewareData.shift?.x).toBe(30)
  })
})

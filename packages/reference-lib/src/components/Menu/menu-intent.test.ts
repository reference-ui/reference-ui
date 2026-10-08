import { describe, it, expect } from 'vitest'
import {
  evaluateSubmenuIntent,
  asRect,
  isReverseTravel,
  SUBMENU_SAFE_PADDING,
  type RectLike,
} from './menu-intent'

describe('Menu intent polygon geometry', () => {
  it('MN-INTENT-09: Menu\'s intent polygon should return deterministic decisions for geometric and temporal edge inputs', () => {
    const triggerRect: RectLike = asRect({
      x: 100,
      y: 100,
      width: 120,
      height: 32,
      top: 100,
      bottom: 132,
      left: 100,
      right: 220,
    })

    const contentRectRight: RectLike = asRect({
      x: 260,
      y: 100,
      width: 160,
      height: 200,
      top: 100,
      bottom: 300,
      left: 260,
      right: 420,
    })

    // 1. Exactly on 5px boundary of trigger -> 'inside'
    expect(
      evaluateSubmenuIntent({
        currentPoint: [triggerRect.left - SUBMENU_SAFE_PADDING, triggerRect.top],
        triggerRect,
        contentRect: contentRectRight,
        side: 'right',
      })
    ).toBe('inside')

    expect(
      evaluateSubmenuIntent({
        currentPoint: [triggerRect.right + SUBMENU_SAFE_PADDING, triggerRect.bottom + SUBMENU_SAFE_PADDING],
        triggerRect,
        contentRect: contentRectRight,
        side: 'right',
      })
    ).toBe('inside')

    // 2. Exactly on 5px boundary of content -> 'inside'
    expect(
      evaluateSubmenuIntent({
        currentPoint: [contentRectRight.right + SUBMENU_SAFE_PADDING, contentRectRight.bottom],
        triggerRect,
        contentRect: contentRectRight,
        side: 'right',
      })
    ).toBe('inside')

    // 3. Diagonal point inside grace triangle -> 'grace'
    const leavePoint: [number, number] = [220, 116]
    const midpoint: [number, number] = [240, 150]
    expect(
      evaluateSubmenuIntent({
        currentPoint: midpoint,
        triggerRect,
        contentRect: contentRectRight,
        side: 'right',
        leavePoint,
      })
    ).toBe('grace')

    // 4. Reversed travel (moving backwards away from submenu primary axis) -> 'leave'
    expect(
      evaluateSubmenuIntent({
        currentPoint: [230, 150],
        triggerRect,
        contentRect: contentRectRight,
        side: 'right',
        leavePoint,
        prevSample: { x: 245, y: 150, timestamp: 100 },
      })
    ).toBe('leave')

    // 5. Each resolved side (right, left, bottom, top)
    expect(isReverseTravel('left', 5, 0)).toBe(true)
    expect(isReverseTravel('left', -5, 0)).toBe(false)
    expect(isReverseTravel('right', -5, 0)).toBe(true)
    expect(isReverseTravel('right', 5, 0)).toBe(false)
    expect(isReverseTravel('bottom', 0, -5)).toBe(true)
    expect(isReverseTravel('top', 0, 5)).toBe(true)

    // 6. Zero-size rectangles handled safely without NaN or crash
    const zeroRect: RectLike = asRect({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    })
    const zeroDecision = evaluateSubmenuIntent({
      currentPoint: [50, 50],
      triggerRect: zeroRect,
      contentRect: zeroRect,
      side: 'right',
    })
    expect(zeroDecision).toBe('leave')

    // 7. Slow and fast samples (velocity extremes)
    const fastDecision = evaluateSubmenuIntent({
      currentPoint: [226, 120],
      triggerRect,
      contentRect: contentRectRight,
      side: 'right',
      leavePoint,
      prevSample: { x: 220, y: 116, timestamp: Date.now() - 1 },
    })
    expect(fastDecision).toBe('grace')

    // 8. Stale / out-of-order pointer timestamps
    const staleDecision = evaluateSubmenuIntent({
      currentPoint: [226, 120],
      triggerRect,
      contentRect: contentRectRight,
      side: 'right',
      leavePoint,
      prevSample: { x: 220, y: 116, timestamp: Date.now() + 10000 },
    })
    expect(staleDecision).toBe('grace')
  })
})

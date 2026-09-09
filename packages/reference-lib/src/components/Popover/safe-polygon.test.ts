import { describe, expect, it } from 'vitest'
import {
  asRect,
  evaluatePointerSafety,
  isOppositeSideLeave,
  isReverseTravel,
  pointInCursorTriangle,
  pointInTrough,
  sideFromPlacement,
} from './safe-polygon'

function rect(left: number, top: number, width: number, height: number) {
  return asRect({
    x: left,
    y: top,
    width,
    height,
    left,
    top,
    right: left + width,
    bottom: top + height,
  })
}

function placement(side: 'top' | 'bottom' | 'left' | 'right') {
  const trigger = rect(0, 0, 100, 100)
  switch (side) {
    case 'top':
      return {
        trigger,
        content: rect(0, -120, 100, 100),
        leave: [50, 0] as const,
        trough: [50, -10] as const,
        outside: [50, 150] as const,
      }
    case 'bottom':
      return {
        trigger,
        content: rect(0, 120, 100, 100),
        leave: [50, 100] as const,
        trough: [50, 110] as const,
        outside: [50, -50] as const,
      }
    case 'left':
      return {
        trigger,
        content: rect(-120, 0, 100, 100),
        leave: [0, 50] as const,
        trough: [-10, 50] as const,
        outside: [150, 50] as const,
      }
    case 'right':
      return {
        trigger,
        content: rect(120, 0, 100, 100),
        leave: [100, 50] as const,
        trough: [110, 50] as const,
        outside: [-50, 50] as const,
      }
  }
}

describe('safe polygon', () => {
  it('reads the physical side from a placement token', () => {
    expect(sideFromPlacement('bottom-start')).toBe('bottom')
    expect(sideFromPlacement('top')).toBe('top')
    expect(sideFromPlacement(undefined)).toBe('bottom')
  })

  it.each(['top', 'bottom', 'left', 'right'] as const)(
    'keeps the %s trough as grace',
    side => {
      const scene = placement(side)
      expect(pointInTrough(scene.trough[0], scene.trough[1], side, scene.trigger, scene.content)).toBe(
        true
      )
      expect(
        evaluatePointerSafety({
          x: scene.trough[0],
          y: scene.trough[1],
          leaveX: scene.leave[0],
          leaveY: scene.leave[1],
          side,
          trigger: scene.trigger,
          content: scene.content,
          hasLanded: false,
        })
      ).toBe('grace')
    }
  )

  it.each(['top', 'bottom', 'left', 'right'] as const)(
    'leaves when travel is opposite the %s corridor',
    side => {
      const scene = placement(side)
      expect(
        isOppositeSideLeave(side, scene.outside[0], scene.outside[1], scene.trigger)
      ).toBe(true)
      expect(
        evaluatePointerSafety({
          x: scene.outside[0],
          y: scene.outside[1],
          leaveX: scene.outside[0],
          leaveY: scene.outside[1],
          side,
          trigger: scene.trigger,
          content: scene.content,
          hasLanded: false,
        })
      ).toBe('leave')
    }
  )

  it('protects diagonal travel through the cursor triangle toward wider content', () => {
    const trigger = rect(200, 80, 120, 32)
    const content = rect(160, 160, 220, 80)
    const leaveX = 312
    const leaveY = 110
    const diagonalX = 340
    const diagonalY = 136
    expect(pointInTrough(diagonalX, diagonalY, 'bottom', trigger, content)).toBe(false)
    expect(pointInCursorTriangle(diagonalX, diagonalY, leaveX, leaveY, 'bottom', trigger, content)).toBe(
      true
    )
    expect(
      evaluatePointerSafety({
        x: diagonalX,
        y: diagonalY,
        leaveX,
        leaveY,
        side: 'bottom',
        trigger,
        content,
        hasLanded: false,
      })
    ).toBe('grace')
  })

  it('treats padded trigger and content as inside, not grace', () => {
    const trigger = rect(0, 0, 100, 40)
    const content = rect(0, 88, 160, 80)
    expect(
      evaluatePointerSafety({
        x: 50,
        y: 20,
        leaveX: 50,
        leaveY: 40,
        side: 'bottom',
        trigger,
        content,
        hasLanded: false,
      })
    ).toBe('inside')
    expect(
      evaluatePointerSafety({
        x: 80,
        y: 100,
        leaveX: 50,
        leaveY: 40,
        side: 'bottom',
        trigger,
        content,
        hasLanded: true,
      })
    ).toBe('inside')
  })

  it('abandons the triangle after landing unless the pointer is in the trough', () => {
    const scene = placement('bottom')
    expect(
      evaluatePointerSafety({
        x: 180,
        y: 110,
        leaveX: scene.leave[0],
        leaveY: scene.leave[1],
        side: 'bottom',
        trigger: scene.trigger,
        content: scene.content,
        hasLanded: true,
      })
    ).toBe('leave')
    expect(
      evaluatePointerSafety({
        x: scene.trough[0],
        y: scene.trough[1],
        leaveX: scene.leave[0],
        leaveY: scene.leave[1],
        side: 'bottom',
        trigger: scene.trigger,
        content: scene.content,
        hasLanded: true,
      })
    ).toBe('grace')
  })

  it('detects reverse travel away from content', () => {
    expect(isReverseTravel('bottom', 0, -4)).toBe(true)
    expect(isReverseTravel('bottom', 2, 6)).toBe(false)
    expect(isReverseTravel('right', -5, 0)).toBe(true)
  })
})

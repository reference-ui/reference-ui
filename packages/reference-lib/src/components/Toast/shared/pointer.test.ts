/** Isolation proof for pointer release: dropped-drag detection. */
import { describe, expect, it } from 'vitest'
import { isReleasedMouseMove } from './pointer'

describe('toast pointer release', () => {
  it('spots the buttonless mouse move of a dropped drag', () => {
    expect(isReleasedMouseMove({ pointerType: 'mouse', buttons: 0 } as PointerEvent)).toBe(true)
    expect(isReleasedMouseMove({ pointerType: 'mouse', buttons: 1 } as PointerEvent)).toBe(false)
    expect(isReleasedMouseMove({ pointerType: 'touch', buttons: 0 } as PointerEvent)).toBe(false)
    expect(isReleasedMouseMove({ buttons: 0 } as MouseEvent)).toBe(true)
    expect(isReleasedMouseMove({ buttons: 1 } as MouseEvent)).toBe(false)
  })
})

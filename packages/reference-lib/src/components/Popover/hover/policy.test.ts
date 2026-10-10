/** Isolation proof for the hover-pointer policy: mouse yes, touch no, pen by pressure. */
import { describe, expect, it } from 'vitest'
import { isHoverCapablePointer } from './policy'

describe('hover pointer capability', () => {
  it('treats mouse as hover-capable and touch as not', () => {
    expect(isHoverCapablePointer({ pointerType: 'mouse' })).toBe(true)
    expect(isHoverCapablePointer({ pointerType: 'touch' })).toBe(false)
  })

  it('treats hovering pen (zero pressure) as hover-capable', () => {
    expect(isHoverCapablePointer({ pointerType: 'pen', pressure: 0 })).toBe(true)
    expect(isHoverCapablePointer({ pointerType: 'pen', pressure: 0.4 })).toBe(false)
  })
})

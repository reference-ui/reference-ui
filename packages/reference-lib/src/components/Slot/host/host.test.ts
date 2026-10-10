/**
 * Host helpers in isolation: order-free cache keys (SL-HELP-01) and
 * element cloning with host-supplied props winning (SL-HELP-02).
 */
import { describe, expect, it } from 'vitest'
import * as React from 'react'
import type { SlotRegistration } from '../types'
import { createSlotCacheKey } from './cache-key'
import { transformSlotElements } from './transform'

describe('Slot host helpers', () => {
describe('Cache key and transform helpers', () => {
  it('SL-HELP-01: createSlotCacheKey joins sorted slot ids', () => {
    const slots1: SlotRegistration[] = [
      { slotId: 'beta', element: React.createElement('div') },
      { slotId: 'alpha', element: React.createElement('div') },
    ]
    const slots2: SlotRegistration[] = [
      { slotId: 'alpha', element: React.createElement('div') },
      { slotId: 'beta', element: React.createElement('div') },
    ]

    expect(createSlotCacheKey(slots1)).toBe('alpha,beta')
    expect(createSlotCacheKey(slots1)).toBe(createSlotCacheKey(slots2))
  })

  it('SL-HELP-02: transformSlotElements clones each element with host-supplied props', () => {
    const slots: SlotRegistration[] = [
      { slotId: 's1', element: React.createElement('div', { id: 'original-1' }, 'Child 1') },
      { slotId: 's2', element: React.createElement('span', { id: 'original-2' }, 'Child 2') },
    ]

    const transformed = transformSlotElements(slots, slot => ({
      'data-slot': slot.slotId,
    }))

    expect(transformed.length).toBe(2)
    expect(transformed[0].type).toBe('div')
    expect(transformed[0].props['data-slot']).toBe('s1')
    expect((transformed[0].props as Record<string, unknown>).id).toBe('original-1')
    expect(transformed[1].type).toBe('span')
    expect(transformed[1].props['data-slot']).toBe('s2')
    expect((transformed[1].props as Record<string, unknown>).id).toBe('original-2')
  })
})
})

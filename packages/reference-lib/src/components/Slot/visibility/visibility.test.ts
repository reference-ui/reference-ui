/**
 * Visibility in isolation: flag collapsing (SL-VIS-01) and visibility
 * stored on the registration without dropping it (SL-VIS-02). The store
 * import below is test-only wiring; the module under test is pure.
 */
import { describe, expect, it } from 'vitest'
import * as React from 'react'
import { SlotRoot } from '../registry/store'
import { resolveSlotVisibility } from './visibility'

describe('Slot visibility', () => {
describe('Visibility helpers', () => {
  it('SL-VIS-01: resolveSlotVisibility collapses flags into visible, hidden, or unmounted', () => {
    expect(resolveSlotVisibility()).toBe('visible')
    expect(resolveSlotVisibility({})).toBe('visible')
    expect(resolveSlotVisibility({ visible: true })).toBe('visible')
    expect(resolveSlotVisibility({ visible: false })).toBe('unmounted')
    expect(resolveSlotVisibility({ hidden: true })).toBe('hidden')
    expect(resolveSlotVisibility({ hidden: false, visible: false })).toBe('unmounted')
    expect(resolveSlotVisibility({ hidden: true, visible: false })).toBe('hidden') // hidden wins
  })

  it('SL-VIS-02: SlotRoot stores visibility without dropping registration', () => {
    const root = new SlotRoot()
    root.register('r1', {
      slotId: 's1',
      element: React.createElement('div'),
      visibility: { visible: false },
    })
    root.register('r2', {
      slotId: 's2',
      element: React.createElement('div'),
      visibility: { hidden: true },
    })

    expect(root.getById('s1')?.visibility).toEqual({ visible: false })
    expect(root.getById('s2')?.visibility).toEqual({ hidden: true })
    expect(resolveSlotVisibility(root.getById('s1')?.visibility)).toBe('unmounted')
    expect(resolveSlotVisibility(root.getById('s2')?.visibility)).toBe('hidden')
  })
})
})

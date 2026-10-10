/**
 * Isolated proof for `createLiveRegistration`: the container reads every
 * field through the latest-options box, so swapping `current` refreshes
 * what the host sees without a new container or a store write.
 */
import { describe, expect, it } from 'vitest'
import * as React from 'react'
import { createLiveRegistration } from './live'
import type { UseSlotRegistrationOptions } from '../types'

describe('createLiveRegistration', () => {
  function box<TMeta = unknown>(overrides: Partial<UseSlotRegistrationOptions<TMeta>> = {}) {
    return {
      current: {
        slotId: 'title',
        element: React.createElement('span', null, 'v1'),
        ...overrides,
      } as UseSlotRegistrationOptions<TMeta>,
    }
  }

  it('exposes slotId, element, meta, and visibility through live getters', () => {
    const el = React.createElement('span', null, 'hello')
    const latest = box<{ label: string }>({ slotId: 'title', element: el, meta: { label: 'm' }, visibility: { hidden: true } })
    const reg = createLiveRegistration<{ label: string }>(latest)

    expect(reg.slotId).toBe('title')
    expect(reg.element).toBe(el)
    expect(reg.meta).toEqual({ label: 'm' })
    expect(reg.visibility).toEqual({ hidden: true })
  })

  it('tracks a swapped latest box without a new container', () => {
    const latest = box()
    const reg = createLiveRegistration(latest)
    const el2 = React.createElement('span', null, 'v2')

    latest.current = { slotId: 'renamed', element: el2, meta: { n: 2 } }

    expect(reg.slotId).toBe('renamed')
    expect(reg.element).toBe(el2)
    expect(reg.meta).toEqual({ n: 2 })
  })

  it('reads undefined meta and visibility until they appear', () => {
    const latest = box()
    const reg = createLiveRegistration(latest)

    expect(reg.meta).toBeUndefined()
    expect(reg.visibility).toBeUndefined()

    latest.current = { ...latest.current, visibility: { visible: false } }
    expect(reg.visibility).toEqual({ visible: false })
  })
})

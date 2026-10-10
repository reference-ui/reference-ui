// @vitest-environment happy-dom
/**
 * Multi-region read proof: full-list return and updates (SL-READ-04–07)
 * plus the filtered overload — order, emptiness, updates, match-set
 * array identity, and inline filters without resubscribing (SL-READ-08–12).
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import * as React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createSlotRootContext } from '../context'
import { SlotRoot } from '../registry/store'
import type { SlotRegistration } from '../types'

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe('useSlots', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('SL-READ-04: useSlots returns all slots', async () => {
    const Context = createSlotRootContext()
    const testRoot = new SlotRoot()
    testRoot.register('r1', { slotId: 'one', element: React.createElement('div', null, '1') })
    testRoot.register('r2', { slotId: 'two', element: React.createElement('div', null, '2') })

    let all: SlotRegistration[] = []

    function Consumer() {
      all = Context.useSlots()
      return null
    }

    await React.act(async () => {
      root.render(
        React.createElement(
          Context.Provider,
          { root: testRoot },
          React.createElement(Consumer)
        )
      )
    })

    expect(all).toHaveLength(2)
    expect(all[0].slotId).toBe('one')
    expect(all[1].slotId).toBe('two')
  })

  it('SL-READ-05: useSlots returns an empty array for an empty root', async () => {
    const Context = createSlotRootContext()
    const testRoot = new SlotRoot()
    let all: any

    function Consumer() {
      all = Context.useSlots()
      return null
    }

    await React.act(async () => {
      root.render(
        React.createElement(
          Context.Provider,
          { root: testRoot },
          React.createElement(Consumer)
        )
      )
    })

    expect(Array.isArray(all)).toBe(true)
    expect(all).toEqual([])
  })

  it('SL-READ-06: useSlots updates when slots change', async () => {
    const Context = createSlotRootContext()
    const testRoot = new SlotRoot()
    let currentLength = -1

    function Consumer() {
      const slots = Context.useSlots()
      currentLength = slots.length
      return null
    }

    await React.act(async () => {
      root.render(
        React.createElement(
          Context.Provider,
          { root: testRoot },
          React.createElement(Consumer)
        )
      )
    })
    expect(currentLength).toBe(0)

    await React.act(async () => {
      testRoot.register('r1', {
        slotId: 's1',
        element: React.createElement('div', null, 'Item'),
      })
    })
    expect(currentLength).toBe(1)

    await React.act(async () => {
      testRoot.unregister('r1')
    })
    expect(currentLength).toBe(0)
  })

  it('SL-READ-07: useSlots keeps array identity while only live content changes', async () => {
    const Context = createSlotRootContext<{ label: string }>()
    const testRoot = new SlotRoot<{ label: string }>()
    let emittedArrays: SlotRegistration[][] = []

    function Filler({ text }: { text: string }) {
      Context.useSlotRegistration({
        slotId: 'item',
        element: React.createElement('div', null, text),
      })
      return null
    }

    function Consumer() {
      const slots = Context.useSlots()
      emittedArrays.push(slots)
      return null
    }

    // Initial mount
    await React.act(async () => {
      root.render(
        React.createElement(
          Context.Provider,
          { root: testRoot },
          React.createElement(Filler, { text: 'v1' }),
          React.createElement(Consumer)
        )
      )
    })

    expect(emittedArrays.length).toBeGreaterThan(0)
    const firstArray = emittedArrays[emittedArrays.length - 1]
    emittedArrays = []

    // Rerender with new text (live getter change without structural re-registration)
    await React.act(async () => {
      root.render(
        React.createElement(
          Context.Provider,
          { root: testRoot },
          React.createElement(Filler, { text: 'v2' }),
          React.createElement(Consumer)
        )
      )
    })

    // Consumer rerendered as child of Provider, but the array returned by useSlots must retain strict identity (===)
    const secondArray = emittedArrays[emittedArrays.length - 1]
    expect(secondArray).toBe(firstArray)
  })

  describe('useSlots with filter', () => {
    it('SL-READ-08: useSlots(filter) returns matches in registration order', async () => {
      const Context = createSlotRootContext()
      const testRoot = new SlotRoot()
      testRoot.register('r1', { slotId: 'actions.primary', element: React.createElement('div', null, '1') })
      testRoot.register('r2', { slotId: 'title', element: React.createElement('div', null, 't') })
      testRoot.register('r3', { slotId: 'actions.secondary', element: React.createElement('div', null, '2') })
  
      let matches: SlotRegistration[] = []
  
      function Consumer() {
        matches = Context.useSlots(s => s.slotId.startsWith('actions'))
        return null
      }
  
      await React.act(async () => {
        root.render(
          React.createElement(
            Context.Provider,
            { root: testRoot },
            React.createElement(Consumer)
          )
        )
      })
  
      expect(matches).toHaveLength(2)
      expect(matches[0].slotId).toBe('actions.primary')
      expect(matches[1].slotId).toBe('actions.secondary')
    })
  
    it('SL-READ-09: useSlots(filter) returns an empty array when nothing matches', async () => {
      const Context = createSlotRootContext()
      const testRoot = new SlotRoot()
      testRoot.register('r1', { slotId: 'title', element: React.createElement('div', null, 't') })
  
      let matches: SlotRegistration[] | undefined
  
      function Consumer() {
        matches = Context.useSlots(s => s.slotId.startsWith('actions'))
        return null
      }
  
      await React.act(async () => {
        root.render(
          React.createElement(
            Context.Provider,
            { root: testRoot },
            React.createElement(Consumer)
          )
        )
      })
  
      expect(Array.isArray(matches)).toBe(true)
      expect(matches).toHaveLength(0)
    })
  
    it('SL-READ-10: useSlots(filter) updates when a matching slot registers and unregisters', async () => {
      const Context = createSlotRootContext()
      const testRoot = new SlotRoot()
      testRoot.register('r0', { slotId: 'title', element: React.createElement('div', null, 't') })
      let currentLength = -1
  
      function Consumer() {
        const slots = Context.useSlots(s => s.slotId.startsWith('actions'))
        currentLength = slots.length
        return null
      }
  
      await React.act(async () => {
        root.render(
          React.createElement(
            Context.Provider,
            { root: testRoot },
            React.createElement(Consumer)
          )
        )
      })
      expect(currentLength).toBe(0)
  
      await React.act(async () => {
        testRoot.register('r1', {
          slotId: 'actions.primary',
          element: React.createElement('div', null, 'Action'),
        })
      })
      expect(currentLength).toBe(1)
  
      await React.act(async () => {
        testRoot.unregister('r1')
      })
      expect(currentLength).toBe(0)
    })
  
    it('SL-READ-11: useSlots(filter) keeps array identity across unrelated registrations', async () => {
      const Context = createSlotRootContext()
      const testRoot = new SlotRoot()
      testRoot.register('r1', { slotId: 'actions.primary', element: React.createElement('div', null, '1') })
      const emittedArrays: SlotRegistration[][] = []
  
      function Consumer() {
        const slots = Context.useSlots(s => s.slotId.startsWith('actions'))
        emittedArrays.push(slots)
        return null
      }
  
      await React.act(async () => {
        root.render(
          React.createElement(
            Context.Provider,
            { root: testRoot },
            React.createElement(Consumer)
          )
        )
      })
  
      expect(emittedArrays.length).toBeGreaterThan(0)
      const firstArray = emittedArrays[emittedArrays.length - 1]
      expect(firstArray).toHaveLength(1)
  
      // Unrelated register + unregister churn: every emitted array stays identical
      await React.act(async () => {
        testRoot.register('r2', { slotId: 'title', element: React.createElement('div', null, 't') })
      })
      await React.act(async () => {
        testRoot.unregister('r2')
      })
  
      expect(testRoot.getAll()).toHaveLength(1)
      for (const emitted of emittedArrays) {
        expect(emitted).toBe(firstArray)
      }
  
      // Contrast: a matching registration MUST produce a new array
      await React.act(async () => {
        testRoot.register('r3', { slotId: 'actions.secondary', element: React.createElement('div', null, '2') })
      })
      const latestArray = emittedArrays[emittedArrays.length - 1]
      expect(latestArray).not.toBe(firstArray)
      expect(latestArray.map(s => s.slotId)).toEqual(['actions.primary', 'actions.secondary'])
    })
  
    it('SL-READ-12: useSlots accepts an inline filter without resubscribing', async () => {
      const Context = createSlotRootContext()
      const testRoot = new SlotRoot()
      testRoot.register('r1', { slotId: 'a', element: React.createElement('div', null, 'A') })
      testRoot.register('r2', { slotId: 'b', element: React.createElement('div', null, 'B') })
      const subscribeSpy = vi.spyOn(testRoot, 'subscribe')
      let latestIds: string[] = []
  
      function Consumer({ target }: { target: string }) {
        // Deliberately inline: a new closure identity every render
        const slots = Context.useSlots(s => s.slotId === target)
        latestIds = slots.map(s => s.slotId)
        return null
      }
  
      await React.act(async () => {
        root.render(
          React.createElement(
            Context.Provider,
            { root: testRoot },
            React.createElement(Consumer, { target: 'a' })
          )
        )
      })
      expect(latestIds).toEqual(['a'])
      expect(subscribeSpy).toHaveBeenCalledTimes(1)
  
      // Unrelated parent rerenders with fresh inline closures: no resubscribe
      await React.act(async () => {
        root.render(
          React.createElement(
            Context.Provider,
            { root: testRoot },
            React.createElement(Consumer, { target: 'a' })
          )
        )
      })
      await React.act(async () => {
        root.render(
          React.createElement(
            Context.Provider,
            { root: testRoot },
            React.createElement(Consumer, { target: 'a' })
          )
        )
      })
      expect(subscribeSpy).toHaveBeenCalledTimes(1)
      expect(latestIds).toEqual(['a'])
  
      // The inline closure is still live: retargeting follows with no store change
      const versionBefore = testRoot.getVersion()
      await React.act(async () => {
        root.render(
          React.createElement(
            Context.Provider,
            { root: testRoot },
            React.createElement(Consumer, { target: 'b' })
          )
        )
      })
      expect(testRoot.getVersion()).toBe(versionBefore)
      expect(latestIds).toEqual(['b'])
      expect(subscribeSpy).toHaveBeenCalledTimes(1)
    })
  })
})

// @vitest-environment happy-dom
/**
 * Filler-hook proof: mount registration, unmount cleanup, metadata,
 * live content without re-registering, in-place re-registration on
 * slot-id and dep changes, and StrictMode settle (SL-HOOK-01–06).
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import * as React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createSlotRootContext } from '../context'
import { SlotRoot } from '../registry/store'

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe('useSlotRegistration', () => {
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

describe('useSlotRegistration', () => {
  it('SL-HOOK-01: useSlotRegistration registers the slot on mount', async () => {
    const Context = createSlotRootContext()
    const testRoot = new SlotRoot()

    function Filler() {
      Context.useSlotRegistration({
        slotId: 'test',
        element: React.createElement('div', null, 'Test Content'),
      })
      return null
    }

    await React.act(async () => {
      root.render(
        React.createElement(
          Context.Provider,
          { root: testRoot },
          React.createElement(Filler)
        )
      )
    })

    const all = testRoot.getAll()
    expect(all).toHaveLength(1)
    expect(all[0].slotId).toBe('test')
  })

  it('SL-HOOK-02: useSlotRegistration unregisters the slot on unmount', async () => {
    const Context = createSlotRootContext()
    const testRoot = new SlotRoot()

    function Filler() {
      Context.useSlotRegistration({
        slotId: 'test',
        element: React.createElement('div', null, 'Test Content'),
      })
      return null
    }

    await React.act(async () => {
      root.render(
        React.createElement(
          Context.Provider,
          { root: testRoot },
          React.createElement(Filler)
        )
      )
    })
    expect(testRoot.getAll()).toHaveLength(1)

    await React.act(async () => {
      root.render(React.createElement(Context.Provider, { root: testRoot }, null))
    })
    expect(testRoot.getAll()).toHaveLength(0)
  })

  it('SL-HOOK-03: useSlotRegistration handles metadata', async () => {
    interface TestMeta {
      priority: number
    }
    const Context = createSlotRootContext<TestMeta>()
    const testRoot = new SlotRoot<TestMeta>()

    function Filler() {
      Context.useSlotRegistration({
        slotId: 'test',
        element: React.createElement('div', null, 'With Meta'),
        meta: { priority: 5 },
      })
      return null
    }

    await React.act(async () => {
      root.render(
        React.createElement(
          Context.Provider,
          { root: testRoot },
          React.createElement(Filler)
        )
      )
    })

    expect(testRoot.getById('test')?.meta).toEqual({ priority: 5 })
  })

  it('SL-HOOK-04: useSlotRegistration exposes live element, meta, and visibility without re-registering', async () => {
    const Context = createSlotRootContext<{ label: string }>()
    const testRoot = new SlotRoot<{ label: string }>()
    const subscriber = vi.fn()
    testRoot.subscribe(subscriber)

    function Filler({ text, label }: { text: string; label: string }) {
      Context.useSlotRegistration({
        slotId: 'title',
        element: React.createElement('span', null, text),
        meta: { label },
      })
      return null
    }

    function Consumer() {
      const slot = Context.useSlot('title')
      return React.createElement(
        'div',
        { id: 'readout' },
        slot?.element,
        ` (meta: ${slot?.meta?.label})`
      )
    }

    await React.act(async () => {
      root.render(
        React.createElement(
          Context.Provider,
          { root: testRoot },
          React.createElement(Filler, { text: 'Version 1', label: 'Meta 1' }),
          React.createElement(Consumer)
        )
      )
    })

    const ver1 = testRoot.getVersion()
    const all1 = testRoot.getAll()
    subscriber.mockClear()

    // Rerender filler with new element text and new meta
    await React.act(async () => {
      root.render(
        React.createElement(
          Context.Provider,
          { root: testRoot },
          React.createElement(Filler, { text: 'Version 2', label: 'Meta 2' }),
          React.createElement(Consumer)
        )
      )
    })

    // Version, getAll array identity, and subscriber calls must be unchanged
    expect(testRoot.getVersion()).toBe(ver1)
    expect(testRoot.getAll()).toBe(all1)
    expect(subscriber).not.toHaveBeenCalled()

    // But live read through getter gets latest content
    expect(testRoot.getById('title')?.meta?.label).toBe('Meta 2')
    expect(container.querySelector('#readout')?.textContent).toContain('Version 2')
    expect(container.querySelector('#readout')?.textContent).toContain('Meta 2')
  })

  it('SL-HOOK-05: useSlotRegistration re-registers in place when slotId or deps change', async () => {
    const Context = createSlotRootContext()
    const testRoot = new SlotRoot()
    const registerSpy = vi.spyOn(testRoot, 'register')
    const unregisterSpy = vi.spyOn(testRoot, 'unregister')

    function Filler({ slotId, hidden }: { slotId: string; hidden: boolean }) {
      Context.useSlotRegistration(
        {
          slotId,
          element: React.createElement('div', null, 'Content'),
          visibility: { hidden },
        },
        [hidden]
      )
      return null
    }

    // Initial mount
    await React.act(async () => {
      root.render(
        React.createElement(
          Context.Provider,
          { root: testRoot },
          React.createElement(Filler, { slotId: 'initial-id', hidden: false })
        )
      )
    })

    expect(registerSpy).toHaveBeenCalledTimes(1)
    expect(unregisterSpy).not.toHaveBeenCalled()
    const initialVer = testRoot.getVersion()

    // 1. Change slotId: should re-register in place, bump version, NOT unregister
    await React.act(async () => {
      root.render(
        React.createElement(
          Context.Provider,
          { root: testRoot },
          React.createElement(Filler, { slotId: 'changed-id', hidden: false })
        )
      )
    })

    expect(registerSpy).toHaveBeenCalledTimes(2)
    expect(unregisterSpy).not.toHaveBeenCalled()
    expect(testRoot.getVersion()).toBeGreaterThan(initialVer)

    // 2. Change dep (hidden): should re-register in place, bump version, NOT unregister
    const verAfterSlotIdChange = testRoot.getVersion()
    await React.act(async () => {
      root.render(
        React.createElement(
          Context.Provider,
          { root: testRoot },
          React.createElement(Filler, { slotId: 'changed-id', hidden: true })
        )
      )
    })

    expect(registerSpy).toHaveBeenCalledTimes(3)
    expect(unregisterSpy).not.toHaveBeenCalled()
    expect(testRoot.getVersion()).toBeGreaterThan(verAfterSlotIdChange)
    expect(testRoot.getById('changed-id')?.visibility).toEqual({ hidden: true })

    // 3. Unrelated parent re-render with NO slotId or dep changes: must NOT re-register
    const verAfterDepChange = testRoot.getVersion()
    await React.act(async () => {
      root.render(
        React.createElement(
          Context.Provider,
          { root: testRoot },
          React.createElement(Filler, { slotId: 'changed-id', hidden: true })
        )
      )
    })

    expect(registerSpy).toHaveBeenCalledTimes(3)
    expect(unregisterSpy).not.toHaveBeenCalled()
    expect(testRoot.getVersion()).toBe(verAfterDepChange)
  })

  it('SL-HOOK-06: useSlotRegistration settles one registration under StrictMode replay', async () => {
    const Context = createSlotRootContext()
    const testRoot = new SlotRoot()

    function Filler() {
      Context.useSlotRegistration({
        slotId: 'strict-slot',
        element: React.createElement('div', null, 'Strict Content'),
      })
      return null
    }

    await React.act(async () => {
      root.render(
        React.createElement(
          React.StrictMode,
          null,
          React.createElement(
            Context.Provider,
            { root: testRoot },
            React.createElement(Filler)
          )
        )
      )
    })

    // Under StrictMode replay, there should be exactly 1 registration, not 2
    expect(testRoot.getAll()).toHaveLength(1)
    expect(testRoot.getById('strict-slot')).toBeDefined()

    // Unmount: clean empty root after final unmount
    await React.act(async () => {
      root.render(
        React.createElement(
          React.StrictMode,
          null,
          React.createElement(Context.Provider, { root: testRoot }, null)
        )
      )
    })

    expect(testRoot.getAll()).toHaveLength(0)
  })
})
})

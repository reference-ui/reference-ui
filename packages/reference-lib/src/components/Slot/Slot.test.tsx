// @vitest-environment happy-dom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import * as React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import {
  SlotRoot,
  createSlotRootContext,
  resolveSlotVisibility,
  createSlotCacheKey,
  transformSlotElements,
  type SlotRegistration,
  type SlotVisibility,
} from './Slot'

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe('Slot Unit Contract', () => {
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

  describe('Public type and factory', () => {
    it('SL-TYPE-01: types the root generic, registration options, and hook results', () => {
      interface CustomMeta {
        icon: string
        open?: boolean
      }

      const { Provider, useRoot, useSlotRegistration, useScanById, useGetAll } =
        createSlotRootContext<CustomMeta>()

      expect(typeof Provider).toBe('function')
      expect(typeof useRoot).toBe('function')
      expect(typeof useSlotRegistration).toBe('function')
      expect(typeof useScanById).toBe('function')
      expect(typeof useGetAll).toBe('function')

      expect(resolveSlotVisibility()).toBe('visible')
      expect(resolveSlotVisibility(undefined)).toBe('visible')
    })
  })

  describe('SlotRoot registration', () => {
    it('SL-REG-01: registers a slot', () => {
      const root = new SlotRoot()
      const initialVer = root.getVersion()
      const el = React.createElement('div', null, 'Hello')

      root.register('r1', { slotId: 'test-slot', element: el })

      const all = root.getAll()
      expect(all.length).toBe(1)
      expect(all[0].slotId).toBe('test-slot')
      expect(all[0].element).toBe(el)
      expect(root.getVersion()).toBeGreaterThan(initialVer)
    })

    it('SL-REG-02: registers multiple slots in order', () => {
      const root = new SlotRoot()
      root.register('r1', { slotId: 'slot-1', element: React.createElement('div', null, '1') })
      const ver1 = root.getVersion()
      root.register('r2', { slotId: 'slot-2', element: React.createElement('div', null, '2') })
      const ver2 = root.getVersion()

      const all = root.getAll()
      expect(all.length).toBe(2)
      expect(all[0].slotId).toBe('slot-1')
      expect(all[1].slotId).toBe('slot-2')
      expect(ver2).toBeGreaterThan(ver1)
    })

    it('SL-REG-03: overwrites a slot with the same registration id', () => {
      const root = new SlotRoot()
      const el1 = React.createElement('div', null, 'First')
      const el2 = React.createElement('div', null, 'Second')

      root.register('r1', { slotId: 'slot-1', element: el1 })
      root.register('r1', { slotId: 'slot-1', element: el2 })

      const all = root.getAll()
      expect(all.length).toBe(1)
      expect(all[0].element).toBe(el2)
    })

    it('SL-REG-04: allows the same slot id with different registration ids', () => {
      const root = new SlotRoot()
      root.register('r1', { slotId: 'duplicate', element: React.createElement('div', null, '1') })
      root.register('r2', { slotId: 'duplicate', element: React.createElement('div', null, '2') })

      expect(root.getAll().length).toBe(2)
    })
  })

  describe('Unregistration', () => {
    it('SL-UNREG-01: unregisters a slot', () => {
      const root = new SlotRoot()
      root.register('r1', { slotId: 'test', element: React.createElement('div') })
      const verBefore = root.getVersion()

      root.unregister('r1')
      expect(root.getAll().length).toBe(0)
      expect(root.getVersion()).toBeGreaterThan(verBefore)
    })

    it('SL-UNREG-02: handles unregistering a non-existent slot without error', () => {
      const root = new SlotRoot()
      expect(() => root.unregister('missing')).not.toThrow()
    })

    it('SL-UNREG-03: leaves version and subscribers unchanged when unregistering a missing id', () => {
      const root = new SlotRoot()
      const listener = vi.fn()
      root.subscribe(listener)

      const ver1 = root.getVersion()
      root.unregister('missing')
      expect(root.getVersion()).toBe(ver1)
      expect(listener).not.toHaveBeenCalled()

      root.register('r1', { slotId: 's1', element: React.createElement('div') })
      listener.mockClear()
      const ver2 = root.getVersion()

      root.unregister('missing')
      expect(root.getVersion()).toBe(ver2)
      expect(listener).not.toHaveBeenCalled()
    })

    it('SL-UNREG-04: only unregisters the specific registration id', () => {
      const root = new SlotRoot()
      root.register('r1', { slotId: 'slot-1', element: React.createElement('div') })
      root.register('r2', { slotId: 'slot-2', element: React.createElement('div') })

      root.unregister('r1')
      const all = root.getAll()
      expect(all.length).toBe(1)
      expect(all[0].slotId).toBe('slot-2')
    })
  })

  describe('Scan by id', () => {
    it('SL-SCAN-01: finds a slot by exact id', () => {
      const root = new SlotRoot()
      const el = React.createElement('div', null, 'Target')
      root.register('r1', { slotId: 'target-slot', element: el })

      const found = root.scanById('target-slot')
      expect(found).toBeDefined()
      expect(found?.slotId).toBe('target-slot')
      expect(found?.element).toBe(el)
    })

    it('SL-SCAN-02: returns undefined for non-existent id', () => {
      const root = new SlotRoot()
      expect(root.scanById('missing')).toBeUndefined()

      root.register('r1', { slotId: 'other', element: React.createElement('div') })
      expect(root.scanById('missing')).toBeUndefined()
    })

    it('SL-SCAN-03: returns the first match when multiple slots have the same id', () => {
      const root = new SlotRoot()
      const el1 = React.createElement('div', null, 'First')
      const el2 = React.createElement('div', null, 'Second')

      root.register('r1', { slotId: 'duplicate', element: el1 })
      root.register('r2', { slotId: 'duplicate', element: el2 })

      expect(root.scanById('duplicate')?.element).toBe(el1)
    })

    it('SL-SCAN-04: does not treat a prefixed sibling as an exact id match', () => {
      const root = new SlotRoot()
      const elExact = React.createElement('div', null, 'Exact')
      const elPrefixed = React.createElement('div', null, 'Prefixed')

      root.register('r1', { slotId: 'title.extra', element: elPrefixed })
      root.register('r2', { slotId: 'title', element: elExact })
      root.register('r3', { slotId: 'body', element: React.createElement('div') })

      expect(root.scanById('title')?.element).toBe(elExact)
    })
  })

  describe('Scan all', () => {
    it('SL-SCANALL-01: finds all slots matching a predicate in order', () => {
      const root = new SlotRoot()
      root.register('r1', { slotId: 'actions.primary', element: React.createElement('div') })
      root.register('r2', { slotId: 'actions.secondary', element: React.createElement('div') })
      root.register('r3', { slotId: 'title', element: React.createElement('div') })

      const actions = root.scanAll(s => s.slotId.startsWith('actions'))
      expect(actions.length).toBe(2)
      expect(actions[0].slotId).toBe('actions.primary')
      expect(actions[1].slotId).toBe('actions.secondary')
    })

    it('SL-SCANALL-02: returns empty array when no matches', () => {
      const root = new SlotRoot()
      root.register('r1', { slotId: 'title', element: React.createElement('div') })

      const result = root.scanAll(s => s.slotId === 'none')
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(0)
    })

    it('SL-SCANALL-03: returns all slots when predicate is always true without sharing array identity', () => {
      const root = new SlotRoot()
      root.register('r1', { slotId: 's1', element: React.createElement('div') })
      root.register('r2', { slotId: 's2', element: React.createElement('div') })
      root.register('r3', { slotId: 's3', element: React.createElement('div') })

      const all = root.getAll()
      const scanAll = root.scanAll(() => true)

      expect(scanAll.length).toBe(3)
      expect(scanAll).toEqual(all)
      expect(scanAll).not.toBe(all)
    })
  })

  describe('Get all and snapshot identity', () => {
    it('SL-ALL-01: returns empty array for new root', () => {
      const root = new SlotRoot()
      expect(root.getAll()).toEqual([])
    })

    it('SL-ALL-02: returns all registered slots in registration order', () => {
      const root = new SlotRoot()
      root.register('r1', { slotId: 'first', element: React.createElement('div') })
      root.register('r2', { slotId: 'second', element: React.createElement('div') })

      const all = root.getAll()
      expect(all.map(s => s.slotId)).toEqual(['first', 'second'])
    })

    it('SL-ALL-03: returns the cached array when slots are unchanged', () => {
      const root = new SlotRoot()
      root.register('r1', { slotId: 's1', element: React.createElement('div') })

      const a1 = root.getAll()
      const a2 = root.getAll()
      expect(a1).toBe(a2)
    })

    it('SL-ALL-04: returns a new array after slots change', () => {
      const root = new SlotRoot()
      root.register('r1', { slotId: 's1', element: React.createElement('div') })

      const a1 = root.getAll()
      root.register('r2', { slotId: 's2', element: React.createElement('div') })
      const a2 = root.getAll()

      expect(a1).not.toBe(a2)
      expect(a2.length).toBe(2)
    })
  })

  describe('Metadata', () => {
    interface Meta {
      priority: number
      label?: string
    }

    it('SL-META-01: stores and retrieves metadata', () => {
      const root = new SlotRoot<Meta>()
      root.register('r1', {
        slotId: 's1',
        element: React.createElement('div'),
        meta: { priority: 1, label: 'Test Item' },
      })

      expect(root.scanById('s1')?.meta).toEqual({ priority: 1, label: 'Test Item' })
    })

    it('SL-META-02: allows undefined metadata', () => {
      const root = new SlotRoot<Meta>()
      root.register('r1', { slotId: 's1', element: React.createElement('div') })

      expect(root.scanById('s1')?.meta).toBeUndefined()
    })

    it('SL-META-03: filters slots by metadata', () => {
      const root = new SlotRoot<Meta>()
      root.register('r1', { slotId: 'low', element: React.createElement('div'), meta: { priority: 1 } })
      root.register('r2', { slotId: 'high', element: React.createElement('div'), meta: { priority: 10 } })

      const filtered = root.scanAll(s => (s.meta?.priority ?? 0) >= 5)
      expect(filtered.length).toBe(1)
      expect(filtered[0].slotId).toBe('high')
    })
  })

  describe('Subscriptions and version', () => {
    it('SL-SUB-01: notifies subscribers on register', () => {
      const root = new SlotRoot()
      const listener = vi.fn()
      root.subscribe(listener)

      root.register('r1', { slotId: 's1', element: React.createElement('div') })
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('SL-SUB-02: notifies subscribers on unregister', () => {
      const root = new SlotRoot()
      root.register('r1', { slotId: 's1', element: React.createElement('div') })
      const listener = vi.fn()
      root.subscribe(listener)

      root.unregister('r1')
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('SL-SUB-03: notifies multiple subscribers', () => {
      const root = new SlotRoot()
      const l1 = vi.fn()
      const l2 = vi.fn()
      root.subscribe(l1)
      root.subscribe(l2)

      root.register('r1', { slotId: 's1', element: React.createElement('div') })
      expect(l1).toHaveBeenCalledTimes(1)
      expect(l2).toHaveBeenCalledTimes(1)
    })

    it('SL-SUB-04: returns an unsubscribe function', () => {
      const root = new SlotRoot()
      const listener = vi.fn()
      const unsub = root.subscribe(listener)

      root.register('r1', { slotId: 's1', element: React.createElement('div') })
      expect(listener).toHaveBeenCalledTimes(1)

      unsub()
      root.register('r2', { slotId: 's2', element: React.createElement('div') })
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('SL-SUB-05: handles an unsubscribe function called multiple times', () => {
      const root = new SlotRoot()
      const unsub = root.subscribe(() => {})
      expect(() => {
        unsub()
        unsub()
      }).not.toThrow()
    })

    it('SL-SUB-06: keeps notifying remaining subscribers when one listener throws', () => {
      const root = new SlotRoot()
      const throwingListener = vi.fn(() => {
        throw new Error('Boom')
      })
      const recordingListener = vi.fn()

      root.subscribe(throwingListener)
      root.subscribe(recordingListener)

      root.register('r1', { slotId: 's1', element: React.createElement('div') })
      expect(throwingListener).toHaveBeenCalledTimes(1)
      expect(recordingListener).toHaveBeenCalledTimes(1)
    })

    it('SL-VER-01: does not bump version when only live getter content changes without structural register', () => {
      const root = new SlotRoot()
      let currentEl = React.createElement('div', null, 'v1')
      const reg: SlotRegistration = {
        slotId: 'live',
        get element() {
          return currentEl
        },
      }

      root.register('r1', reg)
      const ver = root.getVersion()
      const cached = root.getAll()

      currentEl = React.createElement('div', null, 'v2')

      expect(root.getVersion()).toBe(ver)
      expect(root.getAll()).toBe(cached)
      expect(root.scanById('live')?.element).toBe(currentEl)
    })
  })

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

      expect(root.scanById('s1')?.visibility).toEqual({ visible: false })
      expect(root.scanById('s2')?.visibility).toEqual({ hidden: true })
      expect(resolveSlotVisibility(root.scanById('s1')?.visibility)).toBe('unmounted')
      expect(resolveSlotVisibility(root.scanById('s2')?.visibility)).toBe('hidden')
    })
  })

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
      expect(transformed[0].props.id).toBe('original-1')
      expect(transformed[1].type).toBe('span')
      expect(transformed[1].props['data-slot']).toBe('s2')
      expect(transformed[1].props.id).toBe('original-2')
    })
  })

  describe('Provider and useRoot', () => {
    it('SL-PROV-01: Provider wraps children without adding extra DOM host of its own', async () => {
      const Context = createSlotRootContext()
      let capturedRoot: SlotRoot | null = null

      function Consumer() {
        capturedRoot = Context.useRoot()
        return React.createElement('span', { id: 'child' }, 'child-content')
      }

      await React.act(async () => {
        root.render(
          React.createElement(
            Context.Provider,
            null,
            React.createElement(Consumer)
          )
        )
      })

      expect(capturedRoot).toBeInstanceOf(SlotRoot)
      expect(container.firstElementChild?.id).toBe('child')
      expect(container.firstElementChild?.tagName).toBe('SPAN')
    })

    it('SL-PROV-02: Provider accepts a custom root instance', async () => {
      const Context = createSlotRootContext()
      const customRoot = new SlotRoot()
      let capturedRoot: SlotRoot | null = null

      function Consumer() {
        capturedRoot = Context.useRoot()
        return null
      }

      await React.act(async () => {
        root.render(
          React.createElement(
            Context.Provider,
            { root: customRoot },
            React.createElement(Consumer)
          )
        )
      })

      expect(capturedRoot).toBe(customRoot)
    })

    it('SL-PROV-03: Provider creates a new root if none is provided', async () => {
      const Context = createSlotRootContext()
      let root1: SlotRoot | null = null
      let root2: SlotRoot | null = null

      function Consumer1() {
        root1 = Context.useRoot()
        return null
      }
      function Consumer2() {
        root2 = Context.useRoot()
        return null
      }

      await React.act(async () => {
        root.render(
          React.createElement(
            'div',
            null,
            React.createElement(Context.Provider, null, React.createElement(Consumer1)),
            React.createElement(Context.Provider, null, React.createElement(Consumer2))
          )
        )
      })

      expect(root1).toBeInstanceOf(SlotRoot)
      expect(root2).toBeInstanceOf(SlotRoot)
      expect(root1).not.toBe(root2)
    })

    it('SL-USE-01: useRoot throws when used outside of a provider', () => {
      const Context = createSlotRootContext()
      function Consumer() {
        Context.useRoot()
        return null
      }

      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(() => {
        React.act(() => {
          root.render(React.createElement(Consumer))
        })
      }).toThrow(/useRoot must be used within/i)
      spy.mockRestore()
    })

    it('SL-USE-02: useRoot returns the root instance', async () => {
      const Context = createSlotRootContext()
      let capturedRoot: SlotRoot | null = null

      function Consumer() {
        capturedRoot = Context.useRoot()
        return null
      }

      await React.act(async () => {
        root.render(
          React.createElement(
            Context.Provider,
            null,
            React.createElement(Consumer)
          )
        )
      })

      expect(capturedRoot).toBeInstanceOf(SlotRoot)
      expect(typeof capturedRoot!.getAll).toBe('function')
      expect(typeof capturedRoot!.scanById).toBe('function')
      expect(typeof capturedRoot!.scanAll).toBe('function')
    })
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

      expect(testRoot.scanById('test')?.meta).toEqual({ priority: 5 })
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
        const slot = Context.useScanById('title')
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
      expect(testRoot.scanById('title')?.meta?.label).toBe('Meta 2')
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
      expect(testRoot.scanById('changed-id')?.visibility).toEqual({ hidden: true })

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
      expect(testRoot.scanById('strict-slot')).toBeDefined()

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

  describe('useScanById and useGetAll', () => {
    it('SL-READ-01: useScanById returns a slot by id', async () => {
      const Context = createSlotRootContext()
      const testRoot = new SlotRoot()
      testRoot.register('r1', {
        slotId: 'target',
        element: React.createElement('div', null, 'Target'),
      })

      let found: SlotRegistration | undefined

      function Consumer() {
        found = Context.useScanById('target')
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

      expect(found).toBeDefined()
      expect(found?.slotId).toBe('target')
    })

    it('SL-READ-02: useScanById returns undefined for non-existent id', async () => {
      const Context = createSlotRootContext()
      const testRoot = new SlotRoot()
      let found: SlotRegistration | undefined

      function Consumer() {
        found = Context.useScanById('non-existent')
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

      expect(found).toBeUndefined()
    })

    it('SL-READ-03: useScanById updates when a slot is registered', async () => {
      const Context = createSlotRootContext()
      const testRoot = new SlotRoot()
      let renderCount = 0
      let latestSlot: SlotRegistration | undefined

      function Consumer() {
        renderCount++
        latestSlot = Context.useScanById('dynamic')
        return React.createElement(
          'div',
          { id: 'res' },
          latestSlot?.slotId ?? 'empty'
        )
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

      expect(latestSlot).toBeUndefined()
      expect(container.querySelector('#res')?.textContent).toBe('empty')

      await React.act(async () => {
        testRoot.register('r1', {
          slotId: 'dynamic',
          element: React.createElement('div', null, 'Dynamic Content'),
        })
      })

      expect(latestSlot).toBeDefined()
      expect(latestSlot?.slotId).toBe('dynamic')
      expect(container.querySelector('#res')?.textContent).toBe('dynamic')
      expect(renderCount).toBeGreaterThan(1)
    })

    it('SL-READ-04: useGetAll returns all slots', async () => {
      const Context = createSlotRootContext()
      const testRoot = new SlotRoot()
      testRoot.register('r1', { slotId: 'one', element: React.createElement('div', null, '1') })
      testRoot.register('r2', { slotId: 'two', element: React.createElement('div', null, '2') })

      let all: SlotRegistration[] = []

      function Consumer() {
        all = Context.useGetAll()
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

    it('SL-READ-05: useGetAll returns an empty array for an empty root', async () => {
      const Context = createSlotRootContext()
      const testRoot = new SlotRoot()
      let all: any

      function Consumer() {
        all = Context.useGetAll()
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

    it('SL-READ-06: useGetAll updates when slots change', async () => {
      const Context = createSlotRootContext()
      const testRoot = new SlotRoot()
      let currentLength = -1

      function Consumer() {
        const slots = Context.useGetAll()
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

    it('SL-READ-07: useGetAll keeps array identity while only live content changes', async () => {
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
        const slots = Context.useGetAll()
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

      // Consumer rerendered as child of Provider, but the array returned by useGetAll must retain strict identity (===)
      const secondArray = emittedArrays[emittedArrays.length - 1]
      expect(secondArray).toBe(firstArray)
    })
  })
})

import { describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import {
  SlotRoot,
  createSlotRootContext,
  resolveSlotVisibility,
  createSlotCacheKey,
  transformSlotElements,
  type SlotRegistration,
  type SlotVisibility,
} from '@reference-ui/lib'

describe('Slot Unit Contract', () => {
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
})

/**
 * `SlotRoot` in isolation: registration, unregistration, exact-id lookup,
 * filtered selection, snapshot identity, metadata, and subscriber
 * delivery (SL-REG, SL-UNREG, SL-SCAN, SL-SCANALL, SL-ALL, SL-META,
 * SL-SUB, SL-VER). No DOM, no React mount — the store is pure logic.
 */
import { describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { SlotRoot } from './store'
import type { SlotRegistration } from '../types'

describe('SlotRoot store', () => {
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

describe('Get by id', () => {
  it('SL-SCAN-01: finds a slot by exact id', () => {
    const root = new SlotRoot()
    const el = React.createElement('div', null, 'Target')
    root.register('r1', { slotId: 'target-slot', element: el })

    const found = root.getById('target-slot')
    expect(found).toBeDefined()
    expect(found?.slotId).toBe('target-slot')
    expect(found?.element).toBe(el)
  })

  it('SL-SCAN-02: returns undefined for non-existent id', () => {
    const root = new SlotRoot()
    expect(root.getById('missing')).toBeUndefined()

    root.register('r1', { slotId: 'other', element: React.createElement('div') })
    expect(root.getById('missing')).toBeUndefined()
  })

  it('SL-SCAN-03: returns the first match when multiple slots have the same id', () => {
    const root = new SlotRoot()
    const el1 = React.createElement('div', null, 'First')
    const el2 = React.createElement('div', null, 'Second')

    root.register('r1', { slotId: 'duplicate', element: el1 })
    root.register('r2', { slotId: 'duplicate', element: el2 })

    expect(root.getById('duplicate')?.element).toBe(el1)
  })

  it('SL-SCAN-04: does not treat a prefixed sibling as an exact id match', () => {
    const root = new SlotRoot()
    const elExact = React.createElement('div', null, 'Exact')
    const elPrefixed = React.createElement('div', null, 'Prefixed')

    root.register('r1', { slotId: 'title.extra', element: elPrefixed })
    root.register('r2', { slotId: 'title', element: elExact })
    root.register('r3', { slotId: 'body', element: React.createElement('div') })

    expect(root.getById('title')?.element).toBe(elExact)
  })
})

describe('Select', () => {
  it('SL-SCANALL-01: finds all slots matching a filter in order', () => {
    const root = new SlotRoot()
    root.register('r1', { slotId: 'actions.primary', element: React.createElement('div') })
    root.register('r2', { slotId: 'actions.secondary', element: React.createElement('div') })
    root.register('r3', { slotId: 'title', element: React.createElement('div') })

    const actions = root.select(s => s.slotId.startsWith('actions'))
    expect(actions.length).toBe(2)
    expect(actions[0].slotId).toBe('actions.primary')
    expect(actions[1].slotId).toBe('actions.secondary')
  })

  it('SL-SCANALL-02: returns empty array when no matches', () => {
    const root = new SlotRoot()
    root.register('r1', { slotId: 'title', element: React.createElement('div') })

    const result = root.select(s => s.slotId === 'none')
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(0)
  })

  it('SL-SCANALL-03: returns all slots when filter is always true without sharing array identity', () => {
    const root = new SlotRoot()
    root.register('r1', { slotId: 's1', element: React.createElement('div') })
    root.register('r2', { slotId: 's2', element: React.createElement('div') })
    root.register('r3', { slotId: 's3', element: React.createElement('div') })

    const all = root.getAll()
    const selected = root.select(() => true)

    expect(selected.length).toBe(3)
    expect(selected).toEqual(all)
    expect(selected).not.toBe(all)
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

    expect(root.getById('s1')?.meta).toEqual({ priority: 1, label: 'Test Item' })
  })

  it('SL-META-02: allows undefined metadata', () => {
    const root = new SlotRoot<Meta>()
    root.register('r1', { slotId: 's1', element: React.createElement('div') })

    expect(root.getById('s1')?.meta).toBeUndefined()
  })

  it('SL-META-03: filters slots by metadata', () => {
    const root = new SlotRoot<Meta>()
    root.register('r1', { slotId: 'low', element: React.createElement('div'), meta: { priority: 1 } })
    root.register('r2', { slotId: 'high', element: React.createElement('div'), meta: { priority: 10 } })

    const filtered = root.select(s => (s.meta?.priority ?? 0) >= 5)
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
    expect(root.getById('live')?.element).toBe(currentEl)
  })
})
})

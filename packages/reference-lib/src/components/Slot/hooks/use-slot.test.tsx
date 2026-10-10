// @vitest-environment happy-dom
/**
 * Single-region read proof: exact-id return, undefined for missing ids,
 * and reactive updates when the region registers (SL-READ-01–03).
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import * as React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createSlotRootContext } from '../context'
import { SlotRoot } from '../registry/store'
import type { SlotRegistration } from '../types'

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe('useSlot', () => {
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

  it('SL-READ-01: useSlot returns a slot by id', async () => {
    const Context = createSlotRootContext()
    const testRoot = new SlotRoot()
    testRoot.register('r1', {
      slotId: 'target',
      element: React.createElement('div', null, 'Target'),
    })

    let found: SlotRegistration | undefined

    function Consumer() {
      found = Context.useSlot('target')
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

  it('SL-READ-02: useSlot returns undefined for non-existent id', async () => {
    const Context = createSlotRootContext()
    const testRoot = new SlotRoot()
    let found: SlotRegistration | undefined

    function Consumer() {
      found = Context.useSlot('non-existent')
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

  it('SL-READ-03: useSlot updates when a slot is registered', async () => {
    const Context = createSlotRootContext()
    const testRoot = new SlotRoot()
    let renderCount = 0
    let latestSlot: SlotRegistration | undefined

    function Consumer() {
      renderCount++
      latestSlot = Context.useSlot('dynamic')
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
})

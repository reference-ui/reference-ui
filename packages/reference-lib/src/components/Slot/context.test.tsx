// @vitest-environment happy-dom
/**
 * Factory and provider proof: generic typing across the context object
 * (SL-TYPE-01), provider host-node and custom-root behavior (SL-PROV),
 * and `useRoot` inside and outside the provider (SL-USE).
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import * as React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createSlotRootContext } from './context'
import { SlotRoot } from './registry/store'
import { resolveSlotVisibility } from './visibility/visibility'

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe('Slot context', () => {
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

    const { Provider, useRoot, useSlotRegistration, useSlot, useSlots } =
      createSlotRootContext<CustomMeta>()

    expect(typeof Provider).toBe('function')
    expect(typeof useRoot).toBe('function')
    expect(typeof useSlotRegistration).toBe('function')
    expect(typeof useSlot).toBe('function')
    expect(typeof useSlots).toBe('function')

    expect(resolveSlotVisibility()).toBe('visible')
    expect(resolveSlotVisibility(undefined)).toBe('visible')
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
    expect(typeof capturedRoot!.getById).toBe('function')
    expect(typeof capturedRoot!.select).toBe('function')
  })
})
})

/** Isolated proof for shared/events: slot handler chaining order and
 * defaultPrevented gating. Pins the DOM-faithful contract the nested
 * composites rely on — child always runs, part and kernel each skip once
 * anyone prevented, and stopPropagation never affects the manual chain. */

import { describe, expect, it, vi } from 'vitest'
import { chainSlotHandlers, eventWasPrevented, isHandlerKey } from './events'

function fakeEvent() {
  return {
    defaultPrevented: false,
    stopped: false,
    preventDefault(this: { defaultPrevented: boolean }) {
      this.defaultPrevented = true
    },
    stopPropagation(this: { stopped: boolean }) {
      this.stopped = true
    },
  }
}

describe('isHandlerKey', () => {
  it('recognizes onXxx function props only', () => {
    const fn = () => {}
    expect(isHandlerKey('onKeyDown', fn)).toBe(true)
    expect(isHandlerKey('onFocus', fn)).toBe(true)
    expect(isHandlerKey('onKeyDown', 'x')).toBe(false)
    expect(isHandlerKey('onclick', fn)).toBe(false)
    expect(isHandlerKey('on', fn)).toBe(false)
    expect(isHandlerKey('title', fn)).toBe(false)
  })
})

describe('eventWasPrevented', () => {
  it('reads defaultPrevented defensively', () => {
    expect(eventWasPrevented({ defaultPrevented: true })).toBe(true)
    expect(eventWasPrevented({ defaultPrevented: false })).toBe(false)
    expect(eventWasPrevented(null)).toBe(false)
    expect(eventWasPrevented('key')).toBe(false)
  })
})

describe('chainSlotHandlers', () => {
  it('returns undefined when no handler exists and passes a single handler through', () => {
    expect(chainSlotHandlers(undefined, undefined)).toBeUndefined()
    const only = vi.fn()
    expect(chainSlotHandlers(only, undefined)).toBe(only)
  })

  it('runs child, part, then kernel in order with shared args (RF-KEY-08 mechanics)', () => {
    const order: string[] = []
    const chained = chainSlotHandlers(
      () => void order.push('child'),
      () => void order.push('part'),
      () => void order.push('kernel')
    )
    chained?.(fakeEvent(), 'extra')
    expect(order).toEqual(['child', 'part', 'kernel'])
  })

  it('gates part and kernel once the child prevents default', () => {
    const order: string[] = []
    const chained = chainSlotHandlers(
      (e: ReturnType<typeof fakeEvent>) => {
        order.push('child')
        e.preventDefault()
      },
      () => void order.push('part'),
      () => void order.push('kernel')
    )
    chained?.(fakeEvent())
    expect(order).toEqual(['child'])
  })

  it('gates the kernel once the part prevents default (RF-NEST-01 mechanics)', () => {
    const order: string[] = []
    const chained = chainSlotHandlers(
      () => void order.push('child'),
      (e: ReturnType<typeof fakeEvent>) => {
        order.push('part')
        e.preventDefault()
      },
      () => void order.push('kernel')
    )
    chained?.(fakeEvent())
    expect(order).toEqual(['child', 'part'])
  })

  it('ignores stopPropagation: the manual chain is not the DOM chain', () => {
    const order: string[] = []
    const chained = chainSlotHandlers(
      (e: ReturnType<typeof fakeEvent>) => {
        order.push('child')
        e.stopPropagation()
      },
      () => void order.push('part'),
      () => void order.push('kernel')
    )
    const event = fakeEvent()
    chained?.(event)
    expect(event.stopped).toBe(true)
    expect(order).toEqual(['child', 'part', 'kernel'])
  })
})

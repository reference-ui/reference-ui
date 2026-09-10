// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { autoUpdate } from './auto-update'
import { MAX_IDLE_FRAMES } from '../../../core/measure'

type FrameCallback = (time: number) => void

class TrackingResizeObserver {
  static instances: TrackingResizeObserver[] = []
  observed = new Set<Element>()
  constructor(public callback: ResizeObserverCallback) {
    TrackingResizeObserver.instances.push(this)
  }
  observe(element: Element) {
    this.observed.add(element)
  }
  unobserve(element: Element) {
    this.observed.delete(element)
  }
  disconnect() {
    this.observed.clear()
  }
}

function installFrameQueue() {
  const pending = new Map<number, FrameCallback>()
  let nextId = 1
  const request = vi.fn((callback: FrameCallback) => {
    const id = nextId++
    pending.set(id, callback)
    return id
  })
  const cancel = vi.fn((id: number) => {
    pending.delete(id)
  })
  vi.stubGlobal('requestAnimationFrame', request)
  vi.stubGlobal('cancelAnimationFrame', cancel)
  return {
    request,
    cancel,
    get size() {
      return pending.size
    },
    flush() {
      const callbacks = [...pending.entries()]
      pending.clear()
      for (const [, callback] of callbacks) callback(0)
    },
    flushAll(max = 80) {
      let steps = 0
      while (pending.size > 0 && steps < max) {
        this.flush()
        steps += 1
      }
      return steps
    },
  }
}

function mountPair() {
  const reference = document.createElement('div')
  const floating = document.createElement('div')
  reference.getBoundingClientRect = () => new DOMRect(10, 20, 40, 24)
  floating.getBoundingClientRect = () => new DOMRect(10, 52, 80, 40)
  document.body.append(reference, floating)
  return { reference, floating }
}

describe('autoUpdate', () => {
  const originalResizeObserver = globalThis.ResizeObserver

  beforeEach(() => {
    TrackingResizeObserver.instances = []
    vi.stubGlobal('ResizeObserver', TrackingResizeObserver)
  })

  afterEach(() => {
    document.body.replaceChildren()
    vi.unstubAllGlobals()
    if (originalResizeObserver) vi.stubGlobal('ResizeObserver', originalResizeObserver)
    else delete (globalThis as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver
  })

  it('runs a living update on ancestor scroll without a rAF loop', () => {
    const frames = installFrameQueue()
    const scroller = document.createElement('div')
    scroller.style.overflow = 'auto'
    const { reference, floating } = mountPair()
    scroller.append(reference)
    document.body.append(scroller)

    const update = vi.fn()
    const cleanup = autoUpdate(reference, floating, update)
    update.mockClear()
    frames.request.mockClear()

    scroller.dispatchEvent(new Event('scroll'))
    expect(update).toHaveBeenCalledTimes(1)
    expect(frames.request).not.toHaveBeenCalled()

    cleanup()
  })

  it('does not attach window pointermove and cancels an animationFrame poll on teardown', () => {
    const frames = installFrameQueue()
    const { reference, floating } = mountPair()
    const added: string[] = []
    const nativeAdd = window.addEventListener.bind(window)
    vi.spyOn(window, 'addEventListener').mockImplementation((type, listener, options) => {
      added.push(String(type))
      return nativeAdd(type, listener as EventListener, options as AddEventListenerOptions)
    })

    const update = vi.fn()
    const cleanup = autoUpdate(reference, floating, update, { animationFrame: true })
    expect(added).not.toContain('pointermove')
    expect(added).not.toContain('touchmove')
    expect(frames.size).toBe(1)

    cleanup()
    expect(frames.size).toBe(0)
    update.mockClear()
    frames.flush()
    expect(update).not.toHaveBeenCalled()
  })

  it('sleeps an animationFrame poll after idle frames and wakes on a related animationstart', () => {
    const frames = installFrameQueue()
    const { reference, floating } = mountPair()
    const update = vi.fn()
    const cleanup = autoUpdate(reference, floating, update, { animationFrame: true })
    update.mockClear()

    const steps = frames.flushAll(MAX_IDLE_FRAMES + 5)
    expect(steps).toBe(MAX_IDLE_FRAMES)
    expect(frames.size).toBe(0)
    expect(update).not.toHaveBeenCalled()

    reference.dispatchEvent(new Event('animationstart', { bubbles: true }))
    expect(frames.size).toBe(1)

    cleanup()
  })

  it('does not wake an animationFrame poll on a paint-only transition', () => {
    const frames = installFrameQueue()
    const { reference, floating } = mountPair()
    const cleanup = autoUpdate(reference, floating, () => {}, { animationFrame: true })
    const steps = frames.flushAll(MAX_IDLE_FRAMES + 5)
    expect(steps).toBe(MAX_IDLE_FRAMES)
    expect(frames.size).toBe(0)

    const paint = new Event('transitionstart', { bubbles: true }) as TransitionEvent
    Object.defineProperty(paint, 'propertyName', { value: 'opacity' })
    Object.setPrototypeOf(paint, TransitionEvent.prototype)
    reference.dispatchEvent(paint)
    expect(frames.size).toBe(0)

    const layout = new Event('transitionstart', { bubbles: true }) as TransitionEvent
    Object.defineProperty(layout, 'propertyName', { value: 'transform' })
    Object.setPrototypeOf(layout, TransitionEvent.prototype)
    reference.dispatchEvent(layout)
    expect(frames.size).toBe(1)

    cleanup()
  })

  it('does not ResizeObserver the reference when animationFrame is on', () => {
    installFrameQueue()
    const { reference, floating } = mountPair()
    const cleanup = autoUpdate(reference, floating, () => {}, { animationFrame: true })
    const observer = TrackingResizeObserver.instances[0]
    expect(observer).toBeTruthy()
    expect(observer!.observed.has(reference)).toBe(false)
    expect(observer!.observed.has(floating)).toBe(true)
    cleanup()
  })

  it('unobserves floating for a frame when the reference resizes (Floating UI #1740)', () => {
    const frames = installFrameQueue()
    const { reference, floating } = mountPair()
    const update = vi.fn()
    const cleanup = autoUpdate(reference, floating, update)
    const observer = TrackingResizeObserver.instances[0]!
    expect(observer.observed.has(reference)).toBe(true)
    expect(observer.observed.has(floating)).toBe(true)

    update.mockClear()
    frames.request.mockClear()
    observer.callback(
      [{ target: reference } as unknown as ResizeObserverEntry],
      observer as unknown as ResizeObserver
    )
    expect(observer.observed.has(floating)).toBe(false)
    expect(update).toHaveBeenCalledTimes(1)
    expect(frames.size).toBe(1)

    frames.flush()
    expect(observer.observed.has(floating)).toBe(true)
    cleanup()
  })

  it('snapshots the reference, never the floating element, so position writes cannot keep it awake', () => {
    const frames = installFrameQueue()
    const { reference, floating } = mountPair()
    let floatingLeft = 10
    floating.getBoundingClientRect = () => {
      floatingLeft += 4
      return new DOMRect(floatingLeft, 52, 80, 40)
    }
    const update = vi.fn(() => {
      floating.style.left = `${floatingLeft}px`
    })
    const cleanup = autoUpdate(reference, floating, update, { animationFrame: true })
    update.mockClear()

    const steps = frames.flushAll(MAX_IDLE_FRAMES + 5)
    expect(steps).toBe(MAX_IDLE_FRAMES)
    expect(frames.size).toBe(0)
    expect(update).not.toHaveBeenCalled()

    cleanup()
  })

  it('does not arm a poll wake while document.hidden, then re-arms once when visible', () => {
    const frames = installFrameQueue()
    const { reference, floating } = mountPair()
    const hidden = { value: true }
    const previous = Object.getOwnPropertyDescriptor(document, 'hidden')
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => hidden.value,
    })

    try {
      const cleanup = autoUpdate(reference, floating, () => {}, { animationFrame: true })
      expect(frames.size).toBe(0)

      reference.dispatchEvent(new Event('animationstart', { bubbles: true }))
      expect(frames.size).toBe(0)

      document.dispatchEvent(new Event('visibilitychange'))
      expect(frames.size).toBe(0)

      hidden.value = false
      document.dispatchEvent(new Event('visibilitychange'))
      expect(frames.size).toBe(1)

      cleanup()
    } finally {
      if (previous) Object.defineProperty(document, 'hidden', previous)
      else delete (document as { hidden?: boolean }).hidden
    }
  })

  it('tracks overflow ancestors of a virtual contextElement', () => {
    installFrameQueue()
    const scroller = document.createElement('div')
    scroller.style.overflow = 'auto'
    const context = document.createElement('div')
    scroller.append(context)
    document.body.append(scroller)
    const floating = document.createElement('div')
    document.body.append(floating)

    const update = vi.fn()
    const cleanup = autoUpdate(
      {
        getBoundingClientRect: () => new DOMRect(4, 8, 0, 0),
        contextElement: context,
      },
      floating,
      update
    )
    update.mockClear()
    scroller.dispatchEvent(new Event('scroll'))
    expect(update).toHaveBeenCalledTimes(1)
    cleanup()
  })

  it('requests closeOnScroll from a composed ancestor and ignores editable targets', () => {
    installFrameQueue()
    const scroller = document.createElement('div')
    scroller.style.overflow = 'auto'
    const { reference, floating } = mountPair()
    scroller.append(reference)
    document.body.append(scroller)
    const input = document.createElement('textarea')
    floating.append(input)

    const onScrollClose = vi.fn()
    const update = vi.fn()
    const cleanup = autoUpdate(reference, floating, update, {
      closeOnScroll: true,
      onScrollClose,
    })
    update.mockClear()

    scroller.dispatchEvent(new Event('scroll'))
    expect(onScrollClose).toHaveBeenCalledTimes(1)
    expect(update).not.toHaveBeenCalled()

    const editable = new Event('scroll', { bubbles: true })
    Object.defineProperty(editable, 'target', { value: input })
    scroller.dispatchEvent(editable)
    expect(onScrollClose).toHaveBeenCalledTimes(1)

    cleanup()
  })
})

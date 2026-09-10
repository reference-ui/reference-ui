// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { observeMove } from './observe-move'

class TrackingIntersectionObserver {
  static instances: TrackingIntersectionObserver[] = []
  observed = new Set<Element>()
  disconnected = false
  constructor(
    public callback: IntersectionObserverCallback,
    public options?: IntersectionObserverInit
  ) {
    TrackingIntersectionObserver.instances.push(this)
  }
  observe(element: Element) {
    this.observed.add(element)
  }
  unobserve(element: Element) {
    this.observed.delete(element)
  }
  disconnect() {
    this.observed.clear()
    this.disconnected = true
  }
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
  fire(ratio: number) {
    this.callback(
      [{ intersectionRatio: ratio } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    )
  }
}

describe('observeMove', () => {
  const originalIO = globalThis.IntersectionObserver
  const raf = vi.fn()

  beforeEach(() => {
    TrackingIntersectionObserver.instances = []
    vi.stubGlobal('IntersectionObserver', TrackingIntersectionObserver)
    vi.stubGlobal('requestAnimationFrame', raf)
    raf.mockClear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    document.body.replaceChildren()
    vi.useRealTimers()
    vi.unstubAllGlobals()
    if (originalIO) vi.stubGlobal('IntersectionObserver', originalIO)
    else delete (globalThis as { IntersectionObserver?: typeof IntersectionObserver }).IntersectionObserver
  })

  it('registers no observer and never fires on a zero-size box', () => {
    const element = document.createElement('div')
    element.getBoundingClientRect = () => new DOMRect(0, 0, 0, 0)
    document.body.append(element)
    const onMove = vi.fn()

    const stop = observeMove(element, onMove, false)
    expect(TrackingIntersectionObserver.instances).toHaveLength(0)
    expect(onMove).not.toHaveBeenCalled()
    expect(raf).not.toHaveBeenCalled()

    stop()
    expect(onMove).not.toHaveBeenCalled()
  })

  it('fires onMove on layout shift past 0.5px and disconnects on teardown', () => {
    const element = document.createElement('div')
    let left = 10
    element.getBoundingClientRect = () => new DOMRect(left, 20, 40, 24)
    document.body.append(element)
    const onMove = vi.fn()

    const stop = observeMove(element, onMove, false)
    expect(TrackingIntersectionObserver.instances).toHaveLength(1)
    expect(TrackingIntersectionObserver.instances[0]?.observed.has(element)).toBe(true)
    expect(onMove).not.toHaveBeenCalled()
    expect(raf).not.toHaveBeenCalled()

    left = 16
    TrackingIntersectionObserver.instances[0]?.fire(1)
    expect(onMove).toHaveBeenCalledTimes(1)

    const last = TrackingIntersectionObserver.instances[TrackingIntersectionObserver.instances.length - 1]!
    stop()
    expect(last.disconnected).toBe(true)
    expect(last.observed.size).toBe(0)
    expect(raf).not.toHaveBeenCalled()
  })

  it('clears a pending offscreen timeout on teardown', () => {
    const element = document.createElement('div')
    element.getBoundingClientRect = () => new DOMRect(8, 8, 40, 24)
    document.body.append(element)
    const onMove = vi.fn()

    const stop = observeMove(element, onMove, false)
    const observer = TrackingIntersectionObserver.instances[0]!
    observer.fire(0)
    expect(onMove).not.toHaveBeenCalled()

    stop()
    vi.advanceTimersByTime(2000)
    expect(onMove).not.toHaveBeenCalled()
    expect(observer.disconnected).toBe(true)
  })
})

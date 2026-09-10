import { describe, expect, it, vi } from 'vitest'
import {
  createDirtyPoll,
  createFrameScheduler,
  createMeasureSettled,
  isLayoutProperty,
  MAX_IDLE_FRAMES,
  MEASUREMENT_SETTLE_TIMEOUT_MS,
  observeElementResize,
  RECT_JITTER_EPSILON,
  readClientRect,
  rectsDiffer,
  resizeObserverFor,
  RESIZE_OBSERVER_BOX,
  snapshotRects,
} from './index'
import type { FrameCallback, FrameClock } from './frame'
import type { RectLike } from './rects'
import type { SettleClock } from './settle'

function rect(left: number, top = 0, width = 10, height = 10): RectLike {
  return { left, top, width, height }
}

function createFakeFrameClock() {
  const pending = new Map<number, FrameCallback>()
  let nextId = 1
  const clock: FrameClock = {
    request(callback) {
      const id = nextId++
      pending.set(id, callback)
      return id
    },
    cancel(id) {
      pending.delete(id)
    },
  }
  return {
    clock,
    get size() {
      return pending.size
    },
    flush(time = 0) {
      const callbacks = [...pending.values()]
      pending.clear()
      for (const callback of callbacks) callback(time)
    },
  }
}

function createFakeSettleClock() {
  const pending = new Map<number, { callback: () => void; due: number }>()
  let nextId = 1
  let now = 0
  const clock: SettleClock = {
    setTimeout(callback, ms) {
      const id = nextId++
      pending.set(id, { callback, due: now + ms })
      return id
    },
    clearTimeout(id) {
      pending.delete(id)
    },
  }
  return {
    clock,
    advance(ms: number) {
      now += ms
      for (const [id, entry] of [...pending]) {
        if (entry.due <= now) {
          pending.delete(id)
          entry.callback()
        }
      }
    },
  }
}

describe('Measure', () => {
describe('rectsDiffer', () => {
  it('treats a missing previous rect as a change', () => {
    expect(rectsDiffer(null, rect(0))).toBe(true)
  })

  it('ignores sub-epsilon jitter and reports real movement', () => {
    const origin = rect(10, 20, 40, 30)
    expect(rectsDiffer(origin, rect(10 + RECT_JITTER_EPSILON / 2, 20, 40, 30))).toBe(false)
    expect(rectsDiffer(origin, rect(10 + 1, 20, 40, 30))).toBe(true)
    expect(rectsDiffer(origin, rect(10, 20, 41, 30))).toBe(true)
  })
})

describe('readClientRect / snapshotRects', () => {
  it('copies a plain box and skips null targets without reordering', () => {
    let left = 4
    const target = {
      getBoundingClientRect: () => ({
        left,
        top: 8,
        width: 40,
        height: 24,
        right: left + 40,
        bottom: 32,
        x: left,
        y: 8,
        toJSON() {
          return this
        },
      }),
    }
    const snapshot = readClientRect(target)
    left = 99
    expect(snapshot).toEqual({ left: 4, top: 8, width: 40, height: 24 })
    left = 4
    expect(snapshotRects([null, target, undefined, target])).toEqual([snapshot, snapshot])
  })
})

describe('isLayoutProperty', () => {
  it('accepts geometry properties and rejects paint-only names', () => {
    expect(isLayoutProperty('width')).toBe(true)
    expect(isLayoutProperty('transform')).toBe(true)
    expect(isLayoutProperty('margin-left')).toBe(true)
    expect(isLayoutProperty('scale')).toBe(true)
    expect(isLayoutProperty('flex-basis')).toBe(true)
    expect(isLayoutProperty('gap')).toBe(true)
    expect(isLayoutProperty('opacity')).toBe(false)
    expect(isLayoutProperty('color')).toBe(false)
    expect(isLayoutProperty('background-color')).toBe(false)
    expect(isLayoutProperty('')).toBe(false)
  })
})

describe('createFrameScheduler', () => {
  it('collapses N requests in one turn into a single pending frame', () => {
    const fake = createFakeFrameClock()
    const scheduler = createFrameScheduler(fake.clock)
    const calls: number[] = []
    scheduler.request(() => calls.push(1))
    scheduler.request(() => calls.push(2))
    scheduler.request(() => calls.push(3))
    expect(fake.size).toBe(1)
    fake.flush()
    expect(calls).toEqual([3])
  })

  it('cancel prevents the pending callback', () => {
    const fake = createFakeFrameClock()
    const scheduler = createFrameScheduler(fake.clock)
    let fired = false
    scheduler.request(() => {
      fired = true
    })
    scheduler.cancel()
    fake.flush()
    expect(fired).toBe(false)
    expect(fake.size).toBe(0)
  })

  it('does not throw or fire when no frame clock exists (SSR)', () => {
    const scheduler = createFrameScheduler(null)
    let fired = false
    scheduler.request(() => {
      fired = true
    })
    scheduler.cancel()
    expect(fired).toBe(false)
  })

  it('re-arms after a flush and treats a second cancel as a no-op', () => {
    const fake = createFakeFrameClock()
    const scheduler = createFrameScheduler(fake.clock)
    const calls: number[] = []
    scheduler.request(() => calls.push(1))
    fake.flush()
    scheduler.request(() => calls.push(2))
    fake.flush()
    scheduler.cancel()
    scheduler.cancel()
    expect(calls).toEqual([1, 2])
    expect(fake.size).toBe(0)
  })
})

describe('createMeasureSettled', () => {
  it(`settles only after ${MEASUREMENT_SETTLE_TIMEOUT_MS}ms of unchanged samples`, () => {
    const timers = createFakeSettleClock()
    const settledAt: number[] = []
    const handle = createMeasureSettled({
      clock: timers.clock,
      onSettled: () => settledAt.push(1),
    })

    handle.sample(rect(100))
    expect(handle.settled).toBe(false)
    timers.advance(MEASUREMENT_SETTLE_TIMEOUT_MS - 5)
    handle.sample(rect(175))
    expect(handle.settled).toBe(false)
    timers.advance(MEASUREMENT_SETTLE_TIMEOUT_MS - 5)
    expect(handle.settled).toBe(false)
    expect(settledAt).toEqual([])
    handle.sample(rect(200))
    timers.advance(MEASUREMENT_SETTLE_TIMEOUT_MS)
    expect(handle.settled).toBe(true)
    expect(settledAt).toEqual([1])
  })

  it('dispose cancels a pending settle callback', () => {
    const timers = createFakeSettleClock()
    let settled = false
    const handle = createMeasureSettled({
      clock: timers.clock,
      onSettled: () => {
        settled = true
      },
    })
    handle.sample(rect(10))
    handle.dispose()
    timers.advance(MEASUREMENT_SETTLE_TIMEOUT_MS + 10)
    expect(settled).toBe(false)
  })

  it('does not reset the quiet window when the same rect is sampled again', () => {
    const timers = createFakeSettleClock()
    const settledAt: number[] = []
    const handle = createMeasureSettled({
      clock: timers.clock,
      onSettled: () => settledAt.push(1),
    })
    handle.sample(rect(100))
    timers.advance(MEASUREMENT_SETTLE_TIMEOUT_MS - 5)
    handle.sample(rect(100))
    timers.advance(5)
    expect(handle.settled).toBe(true)
    expect(settledAt).toEqual([1])
  })

  it('does not settle when no clock exists (SSR)', () => {
    const handle = createMeasureSettled({ clock: null })
    handle.sample(rect(40))
    expect(handle.settled).toBe(false)
  })

  it('reset clears a pending settle so a later sample can settle again', () => {
    const timers = createFakeSettleClock()
    const settledAt: number[] = []
    const handle = createMeasureSettled({
      clock: timers.clock,
      onSettled: () => settledAt.push(1),
    })
    handle.sample(rect(10))
    handle.reset()
    timers.advance(MEASUREMENT_SETTLE_TIMEOUT_MS)
    expect(handle.settled).toBe(false)
    expect(settledAt).toEqual([])
    handle.sample(rect(20))
    timers.advance(MEASUREMENT_SETTLE_TIMEOUT_MS)
    expect(handle.settled).toBe(true)
    expect(settledAt).toEqual([1])
  })
})

describe('createDirtyPoll', () => {
  it('calls onChange only when a measured rect moves, then sleeps', () => {
    const fake = createFakeFrameClock()
    let left = 0
    const changes: number[] = []
    const poll = createDirtyPoll({
      measure: () => rect(left),
      onChange: () => changes.push(left),
      idleFrames: 3,
      clock: fake.clock,
    })

    poll.wake()
    expect(poll.running).toBe(true)
    fake.flush()
    expect(changes).toEqual([])

    left = 12
    fake.flush()
    expect(changes).toEqual([12])

    fake.flush()
    fake.flush()
    fake.flush()
    expect(poll.running).toBe(false)
    expect(fake.size).toBe(0)
    expect(changes).toEqual([12])
  })

  it('wake is a no-op while already running and restarts after sleep', () => {
    const fake = createFakeFrameClock()
    let left = 0
    const poll = createDirtyPoll({
      measure: () => rect(left),
      onChange: () => {},
      idleFrames: 2,
      clock: fake.clock,
    })
    poll.wake()
    poll.wake()
    expect(fake.size).toBe(1)
    fake.flush()
    fake.flush()
    expect(poll.running).toBe(false)

    left = 8
    poll.wake()
    expect(poll.running).toBe(true)
    fake.flush()
    expect(poll.running).toBe(true)
    poll.stop()
    expect(poll.running).toBe(false)
    fake.flush()
    expect(fake.size).toBe(0)
  })

  it('pauses immediately when isHidden becomes true', () => {
    const fake = createFakeFrameClock()
    let hidden = false
    const poll = createDirtyPoll({
      measure: () => rect(0),
      onChange: () => {},
      idleFrames: MAX_IDLE_FRAMES,
      isHidden: () => hidden,
      clock: fake.clock,
    })
    poll.wake()
    hidden = true
    fake.flush()
    expect(poll.running).toBe(false)
    expect(fake.size).toBe(0)
  })

  it('does not throw when no frame clock exists (SSR)', () => {
    const poll = createDirtyPoll({
      measure: () => rect(0),
      onChange: () => {},
      clock: null,
    })
    poll.wake()
    poll.stop()
    expect(poll.running).toBe(false)
  })

  it('stop from onChange does not leak a pending frame', () => {
    const fake = createFakeFrameClock()
    let left = 0
    let poll!: ReturnType<typeof createDirtyPoll>
    poll = createDirtyPoll({
      measure: () => rect(left),
      onChange: () => poll.stop(),
      idleFrames: 8,
      clock: fake.clock,
    })
    poll.wake()
    fake.flush()
    left = 20
    fake.flush()
    expect(poll.running).toBe(false)
    expect(fake.size).toBe(0)
  })

  it('releases its pending frame even if onChange throws', () => {
    const fake = createFakeFrameClock()
    let left = 0
    let shouldThrow = true
    const poll = createDirtyPoll({
      measure: () => rect(left),
      onChange: () => {
        if (shouldThrow) {
          shouldThrow = false
          throw new Error('consumer')
        }
      },
      idleFrames: 8,
      clock: fake.clock,
    })
    poll.wake()
    fake.flush()
    left = 20
    expect(() => fake.flush()).toThrow('consumer')
    expect(poll.running).toBe(false)
    expect(fake.size).toBe(0)

    poll.wake()
    expect(poll.running).toBe(true)
    expect(fake.size).toBe(1)
    fake.flush()
    expect(poll.running).toBe(true)
    poll.stop()
    expect(fake.size).toBe(0)
  })
})

describe('CPU budgets', () => {
  it('createDirtyPoll holds zero frames and zero measure calls after it sleeps', () => {
    const fake = createFakeFrameClock()
    let measures = 0
    const poll = createDirtyPoll({
      measure: () => {
        measures += 1
        return rect(0)
      },
      onChange: () => {},
      idleFrames: 3,
      clock: fake.clock,
    })

    poll.wake()
    expect(measures).toBe(1)
    fake.flush()
    fake.flush()
    fake.flush()
    expect(poll.running).toBe(false)
    expect(fake.size).toBe(0)
    const atSleep = measures
    expect(atSleep).toBe(1 + 3)

    fake.flush()
    fake.flush()
    fake.flush()
    expect(measures).toBe(atSleep)
    expect(fake.size).toBe(0)
  })

  it('createDirtyPoll keeps a single pending frame under wake spam', () => {
    const fake = createFakeFrameClock()
    const poll = createDirtyPoll({
      measure: () => rect(0),
      onChange: () => {},
      idleFrames: 8,
      clock: fake.clock,
    })
    for (let i = 0; i < 40; i++) poll.wake()
    expect(fake.size).toBe(1)
    fake.flush()
    for (let i = 0; i < 12; i++) poll.wake()
    expect(fake.size).toBe(1)
    poll.stop()
    expect(fake.size).toBe(0)
  })

  it('createDirtyPoll ignores sub-epsilon jitter and still sleeps', () => {
    const fake = createFakeFrameClock()
    let left = 10
    const changes: number[] = []
    const poll = createDirtyPoll({
      measure: () => rect(left),
      onChange: () => changes.push(left),
      idleFrames: 3,
      clock: fake.clock,
    })
    poll.wake()
    fake.flush()
    left = 22
    fake.flush()
    expect(changes).toEqual([22])

    left = 22 + RECT_JITTER_EPSILON / 2
    fake.flush()
    fake.flush()
    fake.flush()
    expect(changes).toEqual([22])
    expect(poll.running).toBe(false)
    expect(fake.size).toBe(0)
  })

  it('createMeasureSettled fires onSettled once across a slow-machine layout ramp', () => {
    const timers = createFakeSettleClock()
    const settledAt: number[] = []
    const handle = createMeasureSettled({
      clock: timers.clock,
      onSettled: () => settledAt.push(1),
    })
    for (let width = 100; width <= 290; width += 10) {
      handle.sample(rect(0, 0, width, 40))
      expect(handle.settled).toBe(false)
      timers.advance(MEASUREMENT_SETTLE_TIMEOUT_MS - 5)
    }
    expect(settledAt).toEqual([])
    timers.advance(MEASUREMENT_SETTLE_TIMEOUT_MS)
    expect(handle.settled).toBe(true)
    expect(settledAt).toEqual([1])
  })

  it('createDirtyPoll samples once on wake then once per awake frame', () => {
    const fake = createFakeFrameClock()
    let measures = 0
    const changes: number[] = []
    const poll = createDirtyPoll({
      measure: () => {
        measures += 1
        return rect(0)
      },
      onChange: () => changes.push(measures),
      idleFrames: 5,
      clock: fake.clock,
    })
    poll.wake()
    expect(measures).toBe(1)
    expect(changes).toEqual([])
    fake.flush()
    fake.flush()
    fake.flush()
    expect(measures).toBe(4)
    expect(changes).toEqual([])
  })
})

describe('resizeObserverFor', () => {
  it('prefers the element ownerDocument constructor over the global', () => {
    class ForeignResizeObserver {
      observe() {}
      disconnect() {}
      unobserve() {}
    }
    class GlobalResizeObserver {
      observe() {}
      disconnect() {}
      unobserve() {}
    }
    const previous = globalThis.ResizeObserver
    vi.stubGlobal('ResizeObserver', GlobalResizeObserver)
    try {
      const element = {
        ownerDocument: { defaultView: { ResizeObserver: ForeignResizeObserver } },
      } as unknown as Element
      expect(resizeObserverFor(element)).toBe(ForeignResizeObserver)
      const ssr = { ownerDocument: { defaultView: null } } as unknown as Element
      expect(resizeObserverFor(ssr)).toBe(GlobalResizeObserver)
    } finally {
      if (previous) vi.stubGlobal('ResizeObserver', previous)
      else vi.unstubAllGlobals()
    }
  })
})

describe('observeElementResize', () => {
  it('observes border-box and falls back when the option is rejected', () => {
    const calls: Array<{ element: Element; options?: ResizeObserverOptions }> = []
    const element = { nodeType: 1 } as Element
    const observer = {
      observe(target: Element, options?: ResizeObserverOptions) {
        calls.push({ element: target, options })
        if (options) throw new TypeError('box not supported')
      },
    } as Pick<ResizeObserver, 'observe'>

    observeElementResize(observer as ResizeObserver, element)
    expect(calls).toEqual([
      { element, options: { box: RESIZE_OBSERVER_BOX } },
      { element, options: undefined },
    ])
  })
})
})

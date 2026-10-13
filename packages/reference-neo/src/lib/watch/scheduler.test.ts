// Unit tests for the watch resync scheduler under fake timers.
// They pin the settle quiet time, the max-wait ceiling on a burst that never
// goes quiet, one follow-up pass for events that land mid-sync, settle
// draining the in-flight pass, and a rejected pass leaving the loop live.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createResyncScheduler, RESYNC_MAX_WAIT_MS, RESYNC_SETTLE_MS, type ResyncScheduler } from './scheduler.ts'

interface Gate {
  resolve: () => void
  reject: (error: Error) => void
}

// A resync whose passes stay in flight until the test settles each one.
function gatedResync() {
  const gates: Gate[] = []
  const resync = vi.fn(
    () =>
      new Promise<void>((resolve, reject) => {
        gates.push({ resolve, reject })
      }),
  )
  return { resync, gates }
}

function takeGate(gates: Gate[]): Gate {
  const gate = gates.shift()
  if (gate === undefined) throw new Error('expected a pass in flight')
  return gate
}

// Schedules every stepMs for durationMs of fake time, like a steady save stream.
async function steadyBurst(scheduler: ResyncScheduler, durationMs: number, stepMs: number): Promise<void> {
  for (let elapsed = 0; elapsed < durationMs; elapsed += stepMs) {
    scheduler.schedule()
    await vi.advanceTimersByTimeAsync(stepMs)
  }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createResyncScheduler timing', () => {
  it('fires one resync after the settle quiet time', async () => {
    const resync = vi.fn(() => Promise.resolve())
    const scheduler = createResyncScheduler(resync)

    scheduler.schedule()
    await vi.advanceTimersByTimeAsync(RESYNC_SETTLE_MS - 1)
    expect(resync).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(resync).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(RESYNC_MAX_WAIT_MS * 2)
    expect(resync).toHaveBeenCalledTimes(1)
    await scheduler.settle()
  })

  it('caps a reset at the first schedule plus max-wait', async () => {
    const resync = vi.fn(() => Promise.resolve())
    const scheduler = createResyncScheduler(resync)

    const firstSchedule = Date.now()
    // Resets every 20 ms through t=440, then one more at t=460: a plain
    // debounce would fire at 520, but the burst deadline holds it to 500.
    await steadyBurst(scheduler, 450, 20)
    scheduler.schedule()
    await vi.advanceTimersByTimeAsync(firstSchedule + RESYNC_MAX_WAIT_MS - Date.now() - 1)
    expect(resync).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(resync).toHaveBeenCalledTimes(1)
    await scheduler.settle()
  })

  it('still resyncs through a 3 s burst that never goes quiet, bounded by max-wait', async () => {
    const resync = vi.fn(() => Promise.resolve())
    const scheduler = createResyncScheduler(resync)

    await steadyBurst(scheduler, 3000, 20)
    await vi.advanceTimersByTimeAsync(RESYNC_SETTLE_MS * 2)

    const passes = resync.mock.calls.length
    expect(passes).toBeGreaterThanOrEqual(5)
    expect(passes).toBeLessThanOrEqual(Math.ceil(3000 / RESYNC_MAX_WAIT_MS) + 2)
    await scheduler.settle()
  })
})

describe('createResyncScheduler serialization', () => {
  it('costs exactly one follow-up pass for events that land mid-sync', async () => {
    const { resync, gates } = gatedResync()
    const scheduler = createResyncScheduler(resync)

    scheduler.schedule()
    await vi.advanceTimersByTimeAsync(RESYNC_SETTLE_MS)
    expect(resync).toHaveBeenCalledTimes(1)

    // 1.5 s of saves spans three max-wait fires while pass one is in flight;
    // they coalesce into a single queued follow-up, not three.
    await steadyBurst(scheduler, 1500, 20)
    await vi.advanceTimersByTimeAsync(RESYNC_SETTLE_MS * 2)
    expect(resync).toHaveBeenCalledTimes(1)

    takeGate(gates).resolve()
    await vi.advanceTimersByTimeAsync(0)
    expect(resync).toHaveBeenCalledTimes(2)

    takeGate(gates).resolve()
    await vi.advanceTimersByTimeAsync(RESYNC_MAX_WAIT_MS * 4)
    expect(resync).toHaveBeenCalledTimes(2)
    await scheduler.settle()
  })

  it('a follow-up requested behind a failing pass still runs', async () => {
    const onError = vi.fn()
    const { resync, gates } = gatedResync()
    const scheduler = createResyncScheduler(resync, { onError })

    scheduler.request()
    scheduler.request()
    takeGate(gates).reject(new Error('boom'))
    await vi.advanceTimersByTimeAsync(0)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(resync).toHaveBeenCalledTimes(2)

    takeGate(gates).resolve()
    await vi.advanceTimersByTimeAsync(0)
    expect(resync).toHaveBeenCalledTimes(2)
    await scheduler.settle()
  })
})

describe('createResyncScheduler settle and failures', () => {
  it('settle cancels a pending timer so nothing fires after it', async () => {
    const resync = vi.fn(() => Promise.resolve())
    const scheduler = createResyncScheduler(resync)

    scheduler.schedule()
    await scheduler.settle()
    await vi.advanceTimersByTimeAsync(RESYNC_MAX_WAIT_MS * 2)
    expect(resync).not.toHaveBeenCalled()
  })

  it('settle waits for the in-flight pass, and schedule or request after settle do nothing', async () => {
    const { resync, gates } = gatedResync()
    const scheduler = createResyncScheduler(resync)

    scheduler.request()
    let settled = false
    const done = scheduler.settle().then(() => {
      settled = true
    })
    await vi.advanceTimersByTimeAsync(0)
    expect(settled).toBe(false)

    takeGate(gates).resolve()
    await done
    expect(settled).toBe(true)

    scheduler.schedule()
    scheduler.request()
    await vi.advanceTimersByTimeAsync(RESYNC_MAX_WAIT_MS * 2)
    expect(resync).toHaveBeenCalledTimes(1)
  })

  it('a rejected pass goes to onError and a later schedule still runs', async () => {
    const onError = vi.fn()
    const resync = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue(undefined)
    const scheduler = createResyncScheduler(resync, { onError })

    scheduler.schedule()
    await vi.advanceTimersByTimeAsync(RESYNC_SETTLE_MS)
    expect(resync).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'boom' }))

    scheduler.schedule()
    await vi.advanceTimersByTimeAsync(RESYNC_SETTLE_MS)
    expect(resync).toHaveBeenCalledTimes(2)
    expect(onError).toHaveBeenCalledTimes(1)
    await scheduler.settle()
  })
})

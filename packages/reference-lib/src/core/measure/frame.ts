/**
 * At most one pending animation frame. Each request cancels the previous.
 * This is not a loop — the caller must re-arm if it wants another tick.
 */

export type FrameCallback = (time: number) => void

export interface FrameClock {
  request: (callback: FrameCallback) => number
  cancel: (id: number) => void
}

export interface FrameScheduler {
  request(callback: FrameCallback): void
  cancel(): void
}

function defaultClock(): FrameClock | null {
  if (typeof requestAnimationFrame !== 'function' || typeof cancelAnimationFrame !== 'function') {
    return null
  }
  return {
    request: requestAnimationFrame.bind(globalThis),
    cancel: cancelAnimationFrame.bind(globalThis),
  }
}

export function createFrameScheduler(clock: FrameClock | null = defaultClock()): FrameScheduler {
  let id: number | null = null

  return {
    request(callback) {
      if (id != null) clock?.cancel(id)
      if (!clock) return
      id = clock.request(time => {
        id = null
        callback(time)
      })
    },
    cancel() {
      if (id == null) return
      clock?.cancel(id)
      id = null
    },
  }
}

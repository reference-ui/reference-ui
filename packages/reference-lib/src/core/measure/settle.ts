import { MEASUREMENT_SETTLE_TIMEOUT_MS } from './constants'
import { rectsDiffer, type RectLike } from './rects'

export { MEASUREMENT_SETTLE_TIMEOUT_MS }

export interface SettleClock {
  setTimeout: (callback: () => void, ms: number) => number
  clearTimeout: (id: number) => void
}

export interface MeasureSettled {
  readonly settled: boolean
  sample(rect: RectLike): void
  reset(): void
  dispose(): void
}

function defaultSettleClock(): SettleClock | null {
  if (typeof setTimeout !== 'function' || typeof clearTimeout !== 'function') return null
  return {
    setTimeout: (callback, ms) => setTimeout(callback, ms) as unknown as number,
    clearTimeout: id => clearTimeout(id),
  }
}

/**
 * Marks layout authoritative only after `timeoutMs` with no differing sample.
 * Resizable's useMeasureSettled: intermediate widths on a slow machine are not a size.
 */
export function createMeasureSettled(options?: {
  timeoutMs?: number
  epsilon?: number
  onSettled?: () => void
  clock?: SettleClock | null
}): MeasureSettled {
  const timeoutMs = options?.timeoutMs ?? MEASUREMENT_SETTLE_TIMEOUT_MS
  const clock = options?.clock === undefined ? defaultSettleClock() : options.clock
  let settled = false
  let previous: RectLike | null = null
  let timer: number | undefined

  const clear = () => {
    if (timer == null) return
    clock?.clearTimeout(timer)
    timer = undefined
  }

  return {
    get settled() {
      return settled
    },
    sample(rect) {
      if (!rectsDiffer(previous, rect, options?.epsilon)) return
      previous = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }
      settled = false
      clear()
      if (!clock) return
      timer = clock.setTimeout(() => {
        timer = undefined
        settled = true
        options?.onSettled?.()
      }, timeoutMs)
    },
    reset() {
      settled = false
      previous = null
      clear()
    },
    dispose() {
      clear()
    },
  }
}

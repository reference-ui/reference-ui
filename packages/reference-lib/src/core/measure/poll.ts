import { MAX_IDLE_FRAMES } from './constants'
import { createFrameScheduler, type FrameClock } from './frame'
import { RECT_JITTER_EPSILON, rectsDiffer, type RectLike } from './rects'

export { MAX_IDLE_FRAMES }

export interface DirtyPoll {
  readonly running: boolean
  wake(): void
  stop(): void
}

/**
 * Sleeping rAF poll. Measures each frame, calls `onChange` only when a rect
 * moves, and stops after `idleFrames` unchanged ticks.
 *
 * Zero CPU when asleep. Wake from animation/transition — never from a
 * window-level pointermove listener. Splitter must not use this.
 */
export function createDirtyPoll(options: {
  measure: () => RectLike | readonly RectLike[] | null
  onChange: () => void
  idleFrames?: number
  epsilon?: number
  isHidden?: () => boolean
  clock?: FrameClock | null
}): DirtyPoll {
  const idleLimit = options.idleFrames ?? MAX_IDLE_FRAMES
  const epsilon = options.epsilon ?? RECT_JITTER_EPSILON
  const frame = createFrameScheduler(options.clock)
  let running = false
  let idle = 0
  let previous: RectLike[] | null = null

  const samples = (): RectLike[] => {
    const next = options.measure()
    if (next == null) return []
    return ([] as RectLike[]).concat(next)
  }

  const tick = () => {
    if (options.isHidden?.()) {
      running = false
      return
    }

    const list = samples()
    const changed =
      previous == null ||
      list.length !== previous.length ||
      list.some((rect, index) => rectsDiffer(previous![index], rect, epsilon))

    if (changed) {
      idle = 0
      previous = list
      try {
        options.onChange()
      } catch (error) {
        // A thrown consumer must not leave running=true with no tick —
        // wake() would no-op and the poll would sit wedged hot.
        running = false
        frame.cancel()
        throw error
      }
    } else {
      idle += 1
    }

    // onChange may call stop(). Do not re-arm a frame after that.
    if (!running || idle >= idleLimit) {
      running = false
      return
    }

    frame.request(tick)
  }

  return {
    get running() {
      return running
    },
    wake() {
      idle = 0
      if (running) return
      running = true
      if (!previous) previous = samples()
      frame.request(tick)
    },
    stop() {
      running = false
      idle = 0
      previous = null
      frame.cancel()
    },
  }
}

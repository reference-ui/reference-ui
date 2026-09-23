import { once } from './on'
import type { Events } from '../../../events'

/**
 * Run callback once when all listed events have fired at least once.
 * Events can fire in any order. Callback runs only once.
 */
export function onceAll<K extends keyof Events>(
  events: K[],
  handler: () => void | Promise<void>
): void
export function onceAll(events: string[], handler: () => void | Promise<void>): void
export function onceAll(events: string[], handler: () => void | Promise<void>) {
  if (events.length === 0) {
    handler()
    return
  }

  const received = new Set<string>()
  let fired = false

  for (const event of events) {
    once(event, () => {
      if (fired) return
      received.add(event)
      if (received.size === events.length) {
        fired = true
        handler()
      }
    })
  }
}

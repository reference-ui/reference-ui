import { once } from './on'

/**
 * Run callback once when all listed events have fired at least once.
 * Events can fire in any order.
 */
export function onceAll(
  events: string[],
  handler: () => void | Promise<void>
): void {
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

// The CORE-WATCH-15 hold shim: the real parcel backend, except that the first subscribe announces itself by writing
// a mark file and then waits for the delay before subscribing. That window is the boot gap: a save in it reaches
// the disk before the watch can see it through events.
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const real = createRequire(process.env.CORE_WATCH_REAL_PARCEL_FROM)('@parcel/watcher')
let subscribes = 0

export async function subscribe(root, onEvent, options) {
  subscribes += 1
  if (subscribes === 1) {
    writeFileSync(process.env.CORE_WATCH_SUBSCRIBE_MARK, `${Date.now()}\n`)
    await new Promise((resolve) => setTimeout(resolve, Number(process.env.CORE_WATCH_SUBSCRIBE_DELAY_MS)))
  }
  return real.subscribe(root, onEvent, options)
}

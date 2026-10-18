// The CORE-WATCH-14 drop shim: the real parcel backend, except that while the drop flag exists, each non-empty batch
// is replaced by parcel's dropped-buffer error with no events, and the drop is logged. This is the event loss an
// FSEvents client sees when its buffer overflows; the real save still happens on disk.
import { appendFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'

const real = createRequire(process.env.CORE_WATCH_REAL_PARCEL_FROM)('@parcel/watcher')
const DROPPED = 'Events were dropped by the FSEvents client. File system must be re-scanned.'

export function subscribe(root, onEvent, options) {
  return real.subscribe(root, (error, events) => {
    const flag = process.env.CORE_WATCH_DROP_FLAG
    if (!error && flag && existsSync(flag) && events.length > 0) {
      appendFileSync(process.env.CORE_WATCH_DROP_LOG, `${events.length}\n`)
      onEvent(new Error(DROPPED), [])
      return
    }
    onEvent(error, events)
  }, options)
}

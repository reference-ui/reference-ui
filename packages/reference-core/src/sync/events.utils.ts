import { emit, on } from '../lib/event-bus'
import type { Events } from '../events'

type ForWorkerOptions<KReady extends keyof Events, KOn extends keyof Events, KEmit extends keyof Events> =
  | {
      ready: KReady
      on: KOn
      emit: KEmit
    }
  | {
      ready: KReady
      on: KOn
      emit: KEmit
      payload: Events[KEmit]
    }

export function forWorker<KReady extends keyof Events, KOn extends keyof Events, KEmit extends keyof Events>(
  options: ForWorkerOptions<KReady, KOn, KEmit>
): void {
  let ready = false
  let pending = false

  on(options.ready, () => {
    ready = true
    if (pending) {
      pending = false
      if ('payload' in options) {
        emit(options.emit, options.payload)
      } else {
        emit(options.emit)
      }
    }
  })

  on(options.on, () => {
    if (ready) {
      if ('payload' in options) {
        emit(options.emit, options.payload)
      } else {
        emit(options.emit)
      }
    } else {
      pending = true
    }
  })
}

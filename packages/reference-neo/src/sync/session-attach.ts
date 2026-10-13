// Sync session attach: how a second `ref sync --watch` rides along with the
// resident watch instead of exiting. It takes the owner's pid and an
// announcement callback and resolves once that owner is gone, forwarding
// SIGINT/SIGTERM/SIGHUP to it meanwhile, so Ctrl-C from any attached client
// stops the shared session and every client then exits on its own. Only the
// owner syncs; an attached client holds no lock and does no work.

import { errorCode } from './session-claim.ts'
import { pidAlive } from './session-identity.ts'
import { STOP_SIGNALS, type StopSignal } from './session-owner.ts'

const ATTACH_POLL_MS = 100

/**
 * Attach to the resident watch session: block until the owner pid exits while
 * forwarding the stop signals to it. Resolves at once when the owner is already
 * gone. `onAttached` is the caller's covered line: it runs once the forwarders
 * are armed, never before, so a reader of that line can signal this client at
 * once without the signal dying here unforwarded.
 */
export async function attachToWatchSession(watchPid: number, onAttached: () => void = () => {}): Promise<void> {
  if (watchPid === process.pid || !pidAlive(watchPid)) {
    onAttached()
    return
  }
  await new Promise<void>((resolve) => {
    const forwarders = new Map<StopSignal, () => void>()
    let timer: ReturnType<typeof setInterval> | undefined
    const done = (): void => {
      if (timer !== undefined) {
        clearInterval(timer)
        timer = undefined
      }
      for (const [signal, forwarder] of forwarders) process.removeListener(signal, forwarder)
      resolve()
    }
    const forwardTo = (signal: StopSignal): (() => void) => () => {
      try {
        process.kill(watchPid, signal)
      } catch (error) {
        // ESRCH means the owner died under us; anything else leaves the
        // poll to decide, since the owner may still be alive.
        if (errorCode(error) === 'ESRCH') done()
      }
    }
    for (const signal of STOP_SIGNALS) {
      const forwarder = forwardTo(signal)
      forwarders.set(signal, forwarder)
      process.on(signal, forwarder)
    }
    timer = setInterval(() => {
      if (!pidAlive(watchPid)) done()
    }, ATTACH_POLL_MS)
    onAttached()
  })
}

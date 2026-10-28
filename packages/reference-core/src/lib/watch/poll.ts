// Stat-poll backstop for the watch: a second, OS-event-free path to a resync.
// It takes a function naming the paths to poll (the matched files, the directories above them, and the
// config dependency files) plus two sinks, and emits a handle whose settled() marks a resync pass
// starting and whose stop() clears the timer. Each tick stats every path against the previous tick and
// reports what drifted, a newly named path written after the latest pass included; a drift written after the latest pass started that no pass has read once it is
// a grace period old goes stale, so an edit FSEvents delays or drops still resyncs. Parcel stays the
// fast path: a drift it already delivered is settled by that pass before the grace runs out.

import { statSync } from 'node:fs'

/**
 * How often the backstop stats the scope. macOS FSEvents can lag by tens of
 * seconds or drop a batch outright when fseventsd is saturated.
 */
export const WATCH_POLL_MS = 1000
/** How long a drift waits for the OS event's own resync before the backstop schedules one. */
export const WATCH_POLL_GRACE_MS = 1000

// One path's signature: mtime plus size for a present entry, the missing token for an absent one.
// A directory's mtime moves when an entry is added, removed, or renamed in it.
export const MISSING = 'missing'

export function signatureOf(path: string): string {
  const stats = statSync(path, { throwIfNoEntry: false })
  return stats === undefined ? MISSING : `${stats.mtimeMs}:${stats.size}`
}

/**
 * A write this much older than a pass start is one that pass read. The margin
 * covers the file system's and the clock's granularity, so a write in the same
 * instant as the start is never taken as read.
 */
const READ_MARGIN_MS = 20

/** When the latest resync pass started, and whether a path was last written before it. */
export interface PassClock {
  started(): void
  wasRead(path: string): boolean
  readSignature(signature: string): boolean
}

export function createPassClock(now: () => number = Date.now): PassClock {
  let startedAt = Number.NEGATIVE_INFINITY
  // The signature leads with the mtime, so parseFloat reads it back; a missing path was never read.
  const readSignature = (signature: string): boolean =>
    signature !== MISSING && Number.parseFloat(signature) + READ_MARGIN_MS < startedAt
  return {
    started: () => {
      startedAt = now()
    },
    wasRead: (path) => readSignature(signatureOf(path)),
    readSignature,
  }
}

export interface PollBackstop {
  /** A resync pass is starting: it reads every drift seen so far, so none is pending. */
  settled(): void
  stop(): void
}

export interface PollSinks {
  /**
   * Every drifted path with its new signature, reported on the tick that sees it. Returns
   * the drifted paths that stand for a real change, so a directory that only gained an
   * unmatched entry never schedules a resync.
   */
  onDrift: (drifted: Map<string, string>) => Map<string, string>
  /** A drift no pass has read outlived its grace: schedule one. */
  onStale: () => void
}

export interface PollOptions {
  intervalMs?: number
  graceMs?: number
  now?: () => number
  /** The run's pass clock: a drift written before the latest pass started is already read. */
  clock?: PassClock
}

// One tick's stat pass: every target's signature now, and the targets that drifted since the last tick. A path the
// scope newly names has no last signature, so it drifts only when present and written after the latest pass started:
// a save into a just-widened scope that lands before this tick must not become its silent baseline.
function statPass(
  targets: Iterable<string>,
  previous: Map<string, string>,
  clock: PassClock,
): { next: Map<string, string>; drifted: Map<string, string> } {
  const next = new Map<string, string>()
  const drifted = new Map<string, string>()
  for (const path of targets) {
    const signature = signatureOf(path)
    next.set(path, signature)
    const before = previous.get(path)
    const moved = before === undefined ? signature !== MISSING && !clock.readSignature(signature) : before !== signature
    if (moved) drifted.set(path, signature)
  }
  return { next, drifted }
}

export function startPollBackstop(
  targets: () => Iterable<string>,
  sinks: PollSinks,
  options: PollOptions = {},
): PollBackstop {
  const intervalMs = options.intervalMs ?? WATCH_POLL_MS
  const graceMs = options.graceMs ?? WATCH_POLL_GRACE_MS
  const now = options.now ?? Date.now
  let previous = new Map<string, string>()
  for (const path of targets()) previous.set(path, signatureOf(path))
  // Whether a drift no pass has read yet is waiting, and when the first one was seen.
  let pending = false
  let pendingSince = 0
  const clock = options.clock ?? createPassClock(now)

  // A drift written after the latest pass started is one no pass has read: it starts the grace clock.
  const arm = (drifted: Map<string, string>): void => {
    if (pending || [...drifted.values()].every(clock.readSignature)) return
    pending = true
    pendingSince = now()
  }

  const tick = (): void => {
    const { next, drifted } = statPass(targets(), previous, clock)
    previous = next
    if (drifted.size > 0) {
      arm(sinks.onDrift(drifted))
    }
    if (!pending || now() - pendingSince < graceMs) return
    pending = false
    sinks.onStale()
  }

  const timer = setInterval(tick, intervalMs)
  timer.unref()

  return {
    settled: () => {
      pending = false
      // A shared clock is started by its run; an own clock starts here.
      if (options.clock === undefined) clock.started()
    },
    stop: () => clearInterval(timer),
  }
}

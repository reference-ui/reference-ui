// Watch event handling: the parcel callback that classifies one batch and asks
// for at most one resync per burst, and the watcher-error policy behind it. It
// takes the live classify state, the change sink, the two resync triggers
// (debounced schedule, immediate request), and the error sink, and emits the
// parcel callback. A dropped OS event buffer lost real events, so it resyncs
// through the debounce, which re-reads the whole scope; every other backend
// error reports and resyncs behind a cooldown so a flapping backend cannot
// self-perpetuate.

import type { Event as ParcelEvent } from '@parcel/watcher'
import { classifyEvent, type ClassifyState, type WatchChange } from './classify.ts'

const ERROR_RESYNC_COOLDOWN_MS = 5000

/** How a watch trigger asks for a resync: debounced into the burst (schedule) or now (request). */
export interface ResyncTriggers {
  schedule(): void
  request(): void
}

export type ParcelHandler = (error: Error | null, events: ParcelEvent[]) => void

export function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

export function isDroppedEventsError(error: Error): boolean {
  return error.message.includes('Events were dropped')
}

/**
 * The watcher-error policy. A dropped-events error stays out of the output
 * (no report) and schedules a debounced resync. Any other error reports, then
 * resyncs now unless one already ran inside the cooldown.
 */
export function createWatcherErrorHandler(
  report: (error: Error) => void,
  triggers: ResyncTriggers,
  now: () => number = Date.now,
): (error: Error) => void {
  let lastErrorResync = 0
  return (error: Error) => {
    if (isDroppedEventsError(error)) {
      triggers.schedule()
      return
    }
    report(error)
    const at = now()
    if (at - lastErrorResync < ERROR_RESYNC_COOLDOWN_MS) return
    lastErrorResync = at
    triggers.request()
  }
}

/**
 * One parcel callback over every root: each classified event reports through
 * onChange, and a batch with any match no pass has read yet schedules one
 * debounced resync. An
 * error batch goes to reportError, which owns its own resync policy.
 */
/** Where one parcel callback sends what it classifies. */
export interface ParcelSinks {
  onChange: (change: WatchChange) => void
  triggers: ResyncTriggers
  reportError: (error: Error) => void
  /** True for a path last written before the latest pass started: that pass read it. */
  wasRead?: (path: string) => boolean
}

export function createParcelHandler(state: ClassifyState, sinks: ParcelSinks): ParcelHandler {
  const { onChange, triggers, reportError, wasRead = () => false } = sinks
  return (error: Error | null, events: ParcelEvent[]) => {
    if (error) {
      reportError(toError(error))
      return
    }
    let matched = false
    for (const event of events) {
      const change = classifyEvent(event, state)
      if (!change) continue
      onChange(change)
      // A late event for a write a pass already read still reports, but resyncs nothing.
      if (!wasRead(event.path)) matched = true
    }
    if (matched) triggers.schedule()
  }
}

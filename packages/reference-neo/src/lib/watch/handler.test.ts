// Unit tests for the watch event handler: the watcher-error policy and one parcel
// batch, with no watcher running. A dropped-events error schedules a debounced
// resync and reports nothing; any other error reports and resyncs once per
// cooldown; a batch with a match schedules one resync and reports each change.

import type { Event as ParcelEvent } from '@parcel/watcher'
import { describe, expect, it, vi } from 'vitest'
import type { ClassifyState } from './classify.ts'
import { createParcelHandler, createWatcherErrorHandler, isDroppedEventsError, type ResyncTriggers } from './handler.ts'
import { createIncludeMatcher } from './match.ts'

const DROPPED = 'Events were dropped by the FSEvents client. File system must be re-scanned.'

function triggersMock() {
  return { schedule: vi.fn<() => void>(), request: vi.fn<() => void>() } satisfies ResyncTriggers
}

describe('isDroppedEventsError', () => {
  it('recognises the parcel dropped-buffer message and nothing else', () => {
    expect(isDroppedEventsError(new Error(DROPPED))).toBe(true)
    expect(isDroppedEventsError(new Error('ENOSPC: no space left'))).toBe(false)
  })
})

describe('createWatcherErrorHandler', () => {
  it('schedules a debounced resync for a dropped-events error and reports nothing', () => {
    const report = vi.fn()
    const triggers = triggersMock()
    createWatcherErrorHandler(report, triggers)(new Error(DROPPED))
    expect(triggers.schedule).toHaveBeenCalledTimes(1)
    expect(triggers.request).not.toHaveBeenCalled()
    expect(report).not.toHaveBeenCalled()
  })

  it('reports another error and resyncs now, then only once per cooldown', () => {
    const report = vi.fn()
    const triggers = triggersMock()
    let clock = 1_000_000
    const handle = createWatcherErrorHandler(report, triggers, () => clock)

    handle(new Error('backend flapped'))
    expect(report).toHaveBeenCalledTimes(1)
    expect(triggers.request).toHaveBeenCalledTimes(1)

    clock += 1000
    handle(new Error('backend flapped again'))
    expect(report).toHaveBeenCalledTimes(2)
    expect(triggers.request).toHaveBeenCalledTimes(1)

    clock += 5000
    handle(new Error('backend flapped later'))
    expect(triggers.request).toHaveBeenCalledTimes(2)
    expect(triggers.schedule).not.toHaveBeenCalled()
  })
})

describe('createParcelHandler', () => {
  const state: ClassifyState = {
    watchRoot: '/project',
    isMatch: createIncludeMatcher(['theme/**/*.ts']),
    dependencyFiles: new Set(),
    snapshot: { dirs: new Set(), links: new Map(), linkDirs: [], targetDirs: new Map() },
  }

  it('reports each matched change and schedules one resync for the batch', () => {
    const onChange = vi.fn()
    const triggers = triggersMock()
    const handler = createParcelHandler(state, onChange, triggers, vi.fn())
    const events: ParcelEvent[] = [
      { type: 'update', path: '/project/theme/a.ts' },
      { type: 'create', path: '/project/theme/b.ts' },
      { type: 'update', path: '/project/notes.md' },
    ]
    handler(null, events)
    expect(onChange).toHaveBeenCalledTimes(2)
    expect(onChange).toHaveBeenNthCalledWith(1, expect.objectContaining({ event: 'change', relativePath: 'theme/a.ts' }))
    expect(triggers.schedule).toHaveBeenCalledTimes(1)
  })

  it('schedules nothing for a batch with no match', () => {
    const triggers = triggersMock()
    createParcelHandler(state, vi.fn(), triggers, vi.fn())(null, [{ type: 'update', path: '/project/notes.md' }])
    expect(triggers.schedule).not.toHaveBeenCalled()
  })

  it('routes a watcher error to the error policy instead of classifying it', () => {
    const reportError = vi.fn()
    const onChange = vi.fn()
    createParcelHandler(state, onChange, triggersMock(), reportError)(new Error(DROPPED), [])
    expect(reportError).toHaveBeenCalledWith(expect.objectContaining({ message: DROPPED }))
    expect(onChange).not.toHaveBeenCalled()
  })
})

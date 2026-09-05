import { describe, expect, it, vi } from 'vitest'
import { createWatcherErrorHandler, isFSEventsDroppedError } from './worker'

describe('watch/worker error handler & loop guard', () => {
  it('correctly identifies macOS FSEvents dropped events errors', () => {
    expect(
      isFSEventsDroppedError(new Error('Events were dropped by the FSEvents client. File system must be re-scanned.')),
    ).toBe(true)
    expect(
      isFSEventsDroppedError(new Error('Events were dropped by the kernel. File system must be re-scanned.')),
    ).toBe(true)
    expect(isFSEventsDroppedError(new Error('ENOENT: no such file or directory'))).toBe(false)
    expect(isFSEventsDroppedError('Some other error string')).toBe(false)
  })

  it('does NOT trigger a full re-sync when FSEvents drops events under load', () => {
    const emit = vi.fn()
    const onError = createWatcherErrorHandler('/test/project', emit)

    onError(new Error('Events were dropped by the FSEvents client. File system must be re-scanned.'))

    expect(emit).not.toHaveBeenCalled()
  })

  it('triggers a full re-sync on genuine unexpected watcher errors', () => {
    const emit = vi.fn()
    const onError = createWatcherErrorHandler('/test/project', emit)

    onError(new Error('Unexpected inotify failure'))

    expect(emit).toHaveBeenCalledTimes(1)
    expect(emit).toHaveBeenCalledWith('watch:change', {
      event: 'change',
      path: '/test/project',
      requiresFullResync: true,
    })
  })

  it('suppresses rapid consecutive error re-syncs within cooldown window', () => {
    const emit = vi.fn()
    const onError = createWatcherErrorHandler('/test/project', emit, {
      minResyncIntervalMs: 1000,
    })

    onError(new Error('Error 1'))
    expect(emit).toHaveBeenCalledTimes(1)

    // Second error immediately afterwards should be suppressed
    onError(new Error('Error 2'))
    expect(emit).toHaveBeenCalledTimes(1)
  })

  it('activates circuit breaker after exceeding maximum consecutive errors', () => {
    const emit = vi.fn()
    const onError = createWatcherErrorHandler('/test/project', emit, {
      minResyncIntervalMs: 0, // no cooldown between calls for this test
      maxConsecutiveErrors: 2,
    })

    onError(new Error('Error 1'))
    expect(emit).toHaveBeenCalledTimes(1)

    onError(new Error('Error 2'))
    expect(emit).toHaveBeenCalledTimes(2)

    // 3rd consecutive error triggers circuit breaker and suppresses emit
    onError(new Error('Error 3'))
    expect(emit).toHaveBeenCalledTimes(2)
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'
import { isMemoryProfilerEnabled, MEMORY_PROFILER_ENV } from './env'
import { captureMemorySnapshot, formatMb, formatProfilerLine } from './memory'

describe('profiler/env', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('isMemoryProfilerEnabled is false when unset', () => {
    vi.stubEnv(MEMORY_PROFILER_ENV, undefined)
    expect(isMemoryProfilerEnabled()).toBe(false)
  })

  it('accepts 1, true, yes (case-insensitive)', () => {
    vi.stubEnv(MEMORY_PROFILER_ENV, '1')
    expect(isMemoryProfilerEnabled()).toBe(true)
    vi.stubEnv(MEMORY_PROFILER_ENV, 'TRUE')
    expect(isMemoryProfilerEnabled()).toBe(true)
    vi.stubEnv(MEMORY_PROFILER_ENV, 'Yes')
    expect(isMemoryProfilerEnabled()).toBe(true)
  })
})

describe('profiler/memory', () => {
  it('formatMb matches one-decimal MiB', () => {
    expect(formatMb(1024 * 1024)).toBe('1.0')
    expect(formatMb(2.5 * 1024 * 1024)).toBe('2.5')
  })

  it('formatProfilerLine includes process rss only on main thread', () => {
    const mainLine = formatProfilerLine({
      scope: 'sync-main',
      threadId: 0,
      mainThread: true,
      rssMb: '100.0',
      heapUsedMb: '40.0',
      heapTotalMb: '50.0',
      externalMb: '2.0',
      arrayBuffersMb: '0.0',
    })
    expect(mainLine).toContain('node process')
    expect(mainLine).toContain('rss=100.0MiB')

    const workerLine = formatProfilerLine({
      scope: 'worker:virtual',
      threadId: 3,
      mainThread: false,
      rssMb: '100.0',
      heapUsedMb: '20.0',
      heapTotalMb: '25.0',
      externalMb: '1.0',
      arrayBuffersMb: '0.0',
    })
    expect(workerLine).not.toContain('rss=')
    expect(workerLine).toContain('V8 isolate')
  })

  it('captureMemorySnapshot records scope', () => {
    const snap = captureMemorySnapshot('test-scope')
    expect(snap.scope).toBe('test-scope')
    expect(Number.parseFloat(snap.heapUsedMb)).toBeGreaterThan(0)
    expect(Number.parseFloat(snap.rssMb)).toBeGreaterThan(0)
  })
})

describe('profiler/main (flag off)', () => {
  it('start/stop do not throw when profiler is disabled', async () => {
    vi.stubEnv(MEMORY_PROFILER_ENV, undefined)
    vi.resetModules()
    const { startMainMemoryProfiler, stopMainMemoryProfiler } = await import('./main')
    startMainMemoryProfiler()
    stopMainMemoryProfiler()
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'
import { isMemoryProfilerEnabled, MEMORY_PROFILER_ENV } from './env'
import {
  formatHeapPieLogLines,
  getIsolateHeapPieSlices,
  seedProfilerHeapAggregateForTest,
} from './aggregate'
import {
  captureMemorySnapshot,
  formatHeapVsRssPercent,
  formatMb,
  formatProfilerLine,
  profilerScopeColorKey,
} from './memory'

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

describe('profiler/aggregate (heap pie)', () => {
  it('slices are % of sum of isolate heaps and add to ~100%', () => {
    seedProfilerHeapAggregateForTest([
      { tid: 1, label: 'panda', heapBytes: 600 * 1024 * 1024 },
      { tid: 2, label: 'virtual', heapBytes: 250 * 1024 * 1024 },
      { tid: 3, label: 'sync-main', heapBytes: 150 * 1024 * 1024 },
    ])
    const slices = getIsolateHeapPieSlices()
    expect(slices).toHaveLength(3)
    const sum = slices.reduce((a, s) => a + s.pct, 0)
    expect(sum).toBeGreaterThan(99.9)
    expect(sum).toBeLessThan(100.1)
    expect(slices[0]?.label).toBe('panda')
    expect(slices[0]?.pct).toBeCloseTo(60, 5)
  })

  it('disambiguates duplicate labels with tid', () => {
    seedProfilerHeapAggregateForTest([
      { tid: 10, label: 'packager-ts', heapBytes: 800 },
      { tid: 11, label: 'packager-ts', heapBytes: 200 },
    ])
    const slices = getIsolateHeapPieSlices()
    expect(slices.map((s) => s.displayLabel)).toEqual([
      'packager-ts (tid 10)',
      'packager-ts (tid 11)',
    ])
  })

  it('formatHeapPieLogLines is structured header + one row per isolate (no ASCII bar)', () => {
    seedProfilerHeapAggregateForTest([
      { tid: 1, label: 'a', heapBytes: 50 },
      { tid: 2, label: 'b', heapBytes: 50 },
    ])
    const lines = formatHeapPieLogLines()
    expect(lines.length).toBe(3)
    expect(lines[0]).toContain('HEAP_SPLIT')
    expect(lines[0]).toContain('Not RSS')
    expect(lines[1]).toContain('50.0%')
    expect(lines[1]).toContain('a')
    expect(lines[2]).toContain('b')
  })
})

describe('profiler/memory', () => {
  it('formatMb matches one-decimal MiB', () => {
    expect(formatMb(1024 * 1024)).toBe('1.0')
    expect(formatMb(2.5 * 1024 * 1024)).toBe('2.5')
  })

  it('formatHeapVsRssPercent uses byte ratio (two decimals when <10%)', () => {
    const mib = 1024 * 1024
    expect(
      formatHeapVsRssPercent({
        scope: 'x',
        threadId: 0,
        mainThread: true,
        rssBytes: 1886.5 * mib,
        heapUsedBytes: 126.4 * mib,
        rssMb: '1886.5',
        heapUsedMb: '126.4',
        heapTotalMb: '200.0',
        externalMb: '0.0',
        arrayBuffersMb: '0.0',
      }),
    ).toBe('6.70')

    expect(
      formatHeapVsRssPercent({
        scope: 'x',
        threadId: 0,
        mainThread: true,
        rssBytes: 100 * mib,
        heapUsedBytes: 40 * mib,
        rssMb: '100.0',
        heapUsedMb: '40.0',
        heapTotalMb: '50.0',
        externalMb: '0.0',
        arrayBuffersMb: '0.0',
      }),
    ).toBe('40.0')
  })

  it('formatProfilerLine: main full; workers full or compact', () => {
    const mib = 1024 * 1024
    const mainLine = formatProfilerLine({
      scope: 'sync-main',
      threadId: 0,
      mainThread: true,
      rssBytes: 100 * mib,
      heapUsedBytes: 40 * mib,
      rssMb: '100.0',
      heapUsedMb: '40.0',
      heapTotalMb: '50.0',
      externalMb: '2.0',
      arrayBuffersMb: '0.0',
    })
    expect(mainLine).toContain('TOTAL_USAGE=100.0MiB')
    expect(mainLine).toContain('OF_RSS≈40.0%')
    expect(mainLine).toContain('HEAP=40.0/50.0MiB')
    expect(mainLine).toContain('EXT=2.0MiB')
    expect(mainLine).toContain('AB=0.0MiB')
    expect(mainLine).not.toContain('V8 isolate')

    const workerFull = formatProfilerLine(
      {
        scope: 'worker:virtual',
        threadId: 3,
        mainThread: false,
        rssBytes: 100 * mib,
        heapUsedBytes: 20 * mib,
        rssMb: '100.0',
        heapUsedMb: '20.0',
        heapTotalMb: '25.0',
        externalMb: '1.0',
        arrayBuffersMb: '0.0',
      },
      { compactWorkerLines: false },
    )
    expect(workerFull).toContain('ISOLATE_HEAP=')
    expect(workerFull).toContain('OF_RSS≈20.0%')

    const workerCompact = formatProfilerLine(
      {
        scope: 'worker:virtual',
        threadId: 3,
        mainThread: false,
        rssBytes: 100 * mib,
        heapUsedBytes: 20 * mib,
        rssMb: '100.0',
        heapUsedMb: '20.0',
        heapTotalMb: '25.0',
        externalMb: '1.0',
        arrayBuffersMb: '0.0',
      },
      { compactWorkerLines: true },
    )
    expect(workerCompact).toContain('virtual')
    expect(workerCompact).toContain('tid=3')
    expect(workerCompact).toContain('HEAP=20.0/25.0MiB')
    expect(workerCompact).not.toContain('ISOLATE_HEAP')
    expect(workerCompact).not.toContain('TOTAL_USAGE')
    expect(workerCompact).not.toContain('worker:')
  })

  it('profilerScopeColorKey strips worker: prefix and uses first segment for phases', () => {
    expect(profilerScopeColorKey('worker:panda')).toBe('panda')
    expect(profilerScopeColorKey('packager-ts:dts:runtime:before')).toBe('packager-ts')
  })

  it('captureMemorySnapshot records scope and raw bytes for accurate OF_RSS', () => {
    const snap = captureMemorySnapshot('test-scope')
    expect(snap.scope).toBe('test-scope')
    expect(Number.parseFloat(snap.heapUsedMb)).toBeGreaterThan(0)
    expect(Number.parseFloat(snap.rssMb)).toBeGreaterThan(0)
    expect(typeof snap.rssBytes).toBe('number')
    expect(typeof snap.heapUsedBytes).toBe('number')
    expect(snap.heapUsedBytes).toBeGreaterThan(0)
    expect(snap.rssBytes).toBeGreaterThan(0)
  })
})

describe('profiler/main (flag off)', () => {
  it('start/stop do not throw when profiler is disabled', async () => {
    vi.stubEnv(MEMORY_PROFILER_ENV, undefined)
    vi.resetModules()
    const { startMainMemoryProfiler, stopMainMemoryProfiler } = await import('./main')
    expect(() => {
      startMainMemoryProfiler()
      stopMainMemoryProfiler()
    }).not.toThrow()
  })
})

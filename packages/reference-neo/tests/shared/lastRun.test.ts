// Unit tests for the last-run log group summary backing agentneo status.
// They take synthetic logs and assert per-group counts, unknown ids, and sort.
// The tally stays pure in lastRun.ts so the CLI only prints it.
import { describe, expect, it } from 'vitest'
import { summarizeByGroup, type LastRunLog } from './lastRun.ts'

describe('summarizeByGroup', () => {
  it('counts pass/fail/degraded per group folder', () => {
    const log: LastRunLog = {
      timestamp: '2026-09-17T00:00:00.000Z',
      cases: [
        { id: 'NEO-CSS-01', ok: true, ms: 10, status: 'ok' },
        { id: 'NEO-CSS-02', ok: false, ms: 20, status: 'failed' },
        { id: 'NEO-SYNC-01', ok: false, ms: 30, status: 'degraded' },
      ],
    }
    const folders = new Map([
      ['NEO-CSS-01', 'css/NEO-CSS-01'],
      ['NEO-CSS-02', 'css/NEO-CSS-02'],
      ['NEO-SYNC-01', 'sync/NEO-SYNC-01'],
    ])
    expect(summarizeByGroup(log, folders)).toEqual([
      { group: 'css', pass: 1, fail: 1, degraded: 0 },
      { group: 'sync', pass: 0, fail: 0, degraded: 1 },
    ])
  })

  it('buckets unknown ids under unknown', () => {
    const log: LastRunLog = {
      timestamp: '2026-09-17T00:00:00.000Z',
      cases: [{ id: 'NEO-GONE-01', ok: true, ms: 5, status: 'ok' }],
    }
    expect(summarizeByGroup(log, new Map())).toEqual([{ group: 'unknown', pass: 1, fail: 0, degraded: 0 }])
  })
})

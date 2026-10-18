// Unit tests for the last-run log group summary backing agentcore status.
// They take synthetic logs and assert per-group counts, unknown ids, and sort.
// The tally stays pure in lastRun.ts so the CLI only prints it.
import { describe, expect, it } from 'vitest'
import { summarizeByGroup, type LastRunLog } from './lastRun.ts'

describe('summarizeByGroup', () => {
  it('counts pass/fail/degraded per group folder', () => {
    const log: LastRunLog = {
      timestamp: '2026-09-17T00:00:00.000Z',
      cases: [
        { id: 'CORE-CSS-01', ok: true, ms: 10, status: 'ok' },
        { id: 'CORE-CSS-02', ok: false, ms: 20, status: 'failed' },
        { id: 'CORE-SYNC-01', ok: false, ms: 30, status: 'degraded' },
      ],
    }
    const folders = new Map([
      ['CORE-CSS-01', 'css/CORE-CSS-01'],
      ['CORE-CSS-02', 'css/CORE-CSS-02'],
      ['CORE-SYNC-01', 'sync/CORE-SYNC-01'],
    ])
    expect(summarizeByGroup(log, folders)).toEqual([
      { group: 'css', pass: 1, fail: 1, degraded: 0 },
      { group: 'sync', pass: 0, fail: 0, degraded: 1 },
    ])
  })

  it('buckets unknown ids under unknown', () => {
    const log: LastRunLog = {
      timestamp: '2026-09-17T00:00:00.000Z',
      cases: [{ id: 'CORE-GONE-01', ok: true, ms: 5, status: 'ok' }],
    }
    expect(summarizeByGroup(log, new Map())).toEqual([{ group: 'unknown', pass: 1, fail: 0, degraded: 0 }])
  })
})

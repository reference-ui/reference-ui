import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  formatRefSyncSetupMilestoneSummary,
  parseRefSyncSetupMilestones,
} from './setup-metrics.js'

describe('parseRefSyncSetupMilestones', () => {
  it('extracts ref sync milestone timings from colorized command output', () => {
    const output = [
      '\u001b[38;5;75mref →\u001b[39m \u001b[90msync\u001b[39m Starting CLI',
      '\u001b[38;5;75mref →\u001b[39m \u001b[90msync\u001b[39m Prepared virtual workspace in 1.20s',
      '\u001b[38;5;75mref →\u001b[39m \u001b[90msync\u001b[39m Generated system config in 2.40s',
      '\u001b[38;5;75mref →\u001b[39m \u001b[90msync\u001b[39m Generated Panda output in 3.60s',
      '\u001b[38;5;75mref →\u001b[39m \u001b[90msync\u001b[39m Built 3 package(s) in 0.05s',
      '\u001b[38;5;75mref →\u001b[39m \u001b[90msync\u001b[39m Generated runtime TypeScript declarations in 40.2s',
      '\u001b[38;5;75mref →\u001b[39m \u001b[90msync\u001b[39m Built reference in 0.10s',
      '\u001b[38;5;75mref →\u001b[39m \u001b[90msync\u001b[39m Built 1 package(s) in 0.03s',
      '\u001b[38;5;75mref →\u001b[39m \u001b[90msync\u001b[39m Generated library TypeScript declarations in 0.35s',
      '\u001b[38;5;75mref →\u001b[39m \u001b[90msync\u001b[39m Sync complete in 40.6s',
    ].join('\n')

    assert.deepEqual(parseRefSyncSetupMilestones(output), [
      {
        durationMs: 1200,
        label: 'Prepared virtual workspace',
        summaryLabel: 'virtual',
      },
      {
        durationMs: 2400,
        label: 'Generated system config',
        summaryLabel: 'system-config',
      },
      {
        durationMs: 3600,
        label: 'Generated Panda output',
        summaryLabel: 'panda',
      },
      {
        durationMs: 50,
        label: 'Built runtime package(s) (3)',
        summaryLabel: 'runtime-packages',
      },
      {
        durationMs: 40200,
        label: 'Generated runtime TypeScript declarations',
        summaryLabel: 'runtime-dts',
      },
      {
        durationMs: 100,
        label: 'Built reference',
        summaryLabel: 'reference',
      },
      {
        durationMs: 30,
        label: 'Built final package(s) (1)',
        summaryLabel: 'final-packages',
      },
      {
        durationMs: 350,
        label: 'Generated library TypeScript declarations',
        summaryLabel: 'library-dts',
      },
      {
        durationMs: 40600,
        label: 'Sync complete',
        summaryLabel: 'sync-total',
      },
    ])
  })

  it('formats a compact setup summary without duplicating the total sync line', () => {
    const summary = formatRefSyncSetupMilestoneSummary([
      {
        durationMs: 1200,
        label: 'Prepared virtual workspace',
        summaryLabel: 'virtual',
      },
      {
        durationMs: 50,
        label: 'Built runtime package(s) (3)',
        summaryLabel: 'runtime-packages',
      },
      {
        durationMs: 40200,
        label: 'Generated runtime TypeScript declarations',
        summaryLabel: 'runtime-dts',
      },
      {
        durationMs: 40600,
        label: 'Sync complete',
        summaryLabel: 'sync-total',
      },
    ])

    assert.equal(summary, 'virtual=1.2s, runtime-packages=50ms, runtime-dts=40.2s')
  })
})
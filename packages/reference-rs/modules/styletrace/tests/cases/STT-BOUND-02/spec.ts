/**
 * Station specification for STT-BOUND-02.
 * Writes `deep.ts`, one initialiser nested 300,000 parentheses deep, beside a copy of Card.tsx into a virtual workspace,
 * then traces it through the built styletrace `traceDetailed` in a child process: the child must finish inside 2 s,
 * skip the deep file with one STT-W-SKIPPED-FILE that names it, and still trace Card. Before the pre-scan, the native
 * trace dies with SIGILL on this depth, so the kill budget is what keeps the Vitest worker alive.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect } from 'vitest'

import {
  createVirtualWorkspace,
  expectBounded,
  runIsolated,
} from '../../../../../testing/index.js'
import type { StyletraceDetailedResult } from '../../../js/index.js'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const CASE_DIR = path.dirname(fileURLToPath(import.meta.url))
const SYNC_ROOT = path.resolve(CASE_DIR, '../../../fixtures/sync-root')
const DEPTH = 300_000
const KILL_BUDGET_MS = 30_000
const TIME_BUDGET_MS = 2_000

const DEEP_SOURCE = `export const deep = ${'('.repeat(DEPTH)}1${')'.repeat(DEPTH)}\n`

const spec: StyletraceCaseSpec = {
  id: 'STT-BOUND-02',
  async verify(result) {
    expect(result).toEqual(['Card'])

    const card = fs.readFileSync(path.join(CASE_DIR, 'input', 'Card.tsx'), 'utf8')
    const workspace = await createVirtualWorkspace(
      { 'Card.tsx': card, 'deep.ts': DEEP_SOURCE },
      'styletrace-bound-02'
    )
    try {
      const run = runIsolated<StyletraceDetailedResult>({
        module: 'styletrace',
        fn: 'traceDetailed',
        args: [workspace.rootDir, SYNC_ROOT],
        timeoutMs: KILL_BUDGET_MS,
      })
      const detailed = expectBounded(run, { ms: TIME_BUDGET_MS })

      const skips = detailed.diagnostics.filter(d => d.code === 'STT-W-SKIPPED-FILE')
      expect(skips, 'one STT-W-SKIPPED-FILE for the deep file').toHaveLength(1)
      expect(skips[0]!.file).toMatch(/deep\.ts$/)
      expect(skips[0]!.message).toBe(
        'StyleTrace: nesting deeper than 1024 levels at line 1'
      )
      const names = [...new Set(detailed.bindings.map(binding => binding.name))].sort()
      expect(names).toEqual(['Card'])
    } finally {
      await workspace.cleanup()
    }
  },
}

export default spec

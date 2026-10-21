/**
 * Station specification for STT-BOUND-01.
 * Writes the twelve-module export-star clique, with an unresolved `missing` import, into a
 * scratch tree and traces it through the built styletrace `traceDetailed` in a child process:
 * the child must finish inside 2 s and trace Card. Before the per-query explored set, the walk
 * enumerated every simple path of the clique and the child ran past its 30 s kill budget.
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
const CLIQUE_SIZE = 12
const KILL_BUDGET_MS = 30_000
const TIME_BUDGET_MS = 2_000

/**
 * Module `m<i>` star-exports every other `m<j>`. `m0` also star-exports Card, and index
 * imports a name that nothing declares, so every query for it walks the whole clique.
 */
function cliqueFiles(size: number): Record<string, string> {
  const files: Record<string, string> = {
    'Card.tsx': fs.readFileSync(path.join(CASE_DIR, 'input', 'Card.tsx'), 'utf8'),
    'index.ts': "import { missing } from './m0'\nexport { missing }\nexport * from './m5'\n",
  }
  for (let i = 0; i < size; i++) {
    const lines: string[] = []
    for (let j = 0; j < size; j++) {
      if (j !== i) lines.push(`export * from './m${j}'`)
    }
    if (i === 0) lines.push("export * from './Card'")
    files[`m${i}.ts`] = `${lines.join('\n')}\n`
  }
  return files
}

const spec: StyletraceCaseSpec = {
  id: 'STT-BOUND-01',
  async verify(result) {
    expect(result).toEqual(['Card'])

    const workspace = await createVirtualWorkspace(cliqueFiles(CLIQUE_SIZE), 'styletrace-bound-01')
    try {
      const run = runIsolated<StyletraceDetailedResult>({
        module: 'styletrace',
        fn: 'traceDetailed',
        args: [workspace.rootDir, SYNC_ROOT],
        timeoutMs: KILL_BUDGET_MS,
      })
      const detailed = expectBounded(run, { ms: TIME_BUDGET_MS })
      const names = [...new Set(detailed.bindings.map(binding => binding.name))].sort()
      expect(names).toEqual(['Card'])
    } finally {
      await workspace.cleanup()
    }
  },
}

export default spec

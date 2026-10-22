/**
 * Case specification for TST-BOUND-02.
 * Writes `deep.d.ts`, a type alias nesting `Array<` 5,000 levels deep, beside `index.ts` into a temp project this spec
 * owns, then builds it through the built tasty build entry in a child process. The build must finish inside 2 s,
 * refuse the deep declaration with one located TST-W-PARSE-ERROR, and still emit the sibling's `Box`. Without the
 * pre-scan the lowering of the alias is quadratic in its depth and the child runs past the kill budget.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect } from 'vitest'
import {
  expectBounded,
  runIsolated,
  withTempDir,
  type StationSpec,
} from '../../../../../testing/index.js'
import type { TastyCaseResult } from '../../harness/helpers.js'

const CASE_DIR = path.dirname(fileURLToPath(import.meta.url))
const DRIVER = path.join(CASE_DIR, 'build-deep.mjs')
const DEPTH = 5000
const KILL_BUDGET_MS = 30_000
const TIME_BUDGET_MS = 2000

const DEEP_DTS = `export type Deep = ${'Array<'.repeat(DEPTH)}string${'>'.repeat(DEPTH)}\n`
const SIBLING = 'export interface Box { v: string }\n'

interface BuildReport {
  diagnostics: { code: string; file: string | null; message: string }[]
  symbols: string[]
}

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-BOUND-02',
  async verify() {
    const report = withTempDir('tst-bound-02-', root => {
      const project = path.join(root, 'project')
      const out = path.join(root, 'out')
      fs.mkdirSync(project)
      fs.writeFileSync(path.join(project, 'deep.d.ts'), DEEP_DTS)
      fs.writeFileSync(path.join(project, 'index.ts'), SIBLING)
      const run = runIsolated<BuildReport>({
        module: DRIVER,
        fn: 'buildProject',
        args: [project, out],
        timeoutMs: KILL_BUDGET_MS,
      })
      return expectBounded(run, { ms: TIME_BUDGET_MS })
    })

    const parseErrors = report.diagnostics.filter(d => d.code === 'TST-W-PARSE-ERROR')
    expect(parseErrors, 'one TST-W-PARSE-ERROR for the deep declaration').toHaveLength(1)
    expect(parseErrors[0]!.file).toMatch(/deep\.d\.ts$/)
    expect(parseErrors[0]!.message).toBe('nesting deeper than 1024 levels at line 1; split or flatten the deeply nested expression')
    expect(report.symbols).toEqual(['Box'])
  },
}

export default spec

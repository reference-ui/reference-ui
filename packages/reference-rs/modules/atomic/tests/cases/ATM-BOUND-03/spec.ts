/**
 * Export-star clique bound (ATM-BOUND-03). The station compiles `input/`, a twelve-module clique where every
 * module `export *` from the other eleven, in process; that compile must be cheap there because nothing in it
 * imports across the clique. The bound is the consumer compile: this spec copies `input/` into a temp project it
 * owns, adds `src/app.ts`, which imports `missing` from `./m0`, and runs the compile through driver.mjs in a child
 * process that must finish inside the budget. Every walk from that import crosses the whole clique, so a walk that
 * re-expands each path fails here by name. The parent removes the temp project, so a killed child leaks nothing.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect } from 'vitest'
import { expectBounded, runIsolated, withTempDir } from '../../../../../testing/isolated.js'
import type { AtomicCaseSpec, CompileResult } from '../../harness/helpers.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const INPUT_DIR = path.join(HERE, 'input')
const DRIVER = path.join(HERE, 'driver.mjs')
const BUDGET_MS = 2000
const KILL_MS = 30_000

const CONSUMER = [
  "import { css } from '@reference-ui/react'",
  "import { missing } from './m0'",
  '',
  'export const a = css({ color: missing })',
  "export const b = css({ color: 'red' })",
  '',
].join('\n')

const spec: AtomicCaseSpec = {
  id: 'ATM-BOUND-03',
  verify() {
    const result = withTempDir('atm-bound-03-', root => {
      fs.cpSync(INPUT_DIR, root, { recursive: true })
      fs.writeFileSync(path.join(root, 'src', 'app.ts'), CONSUMER)
      const run = runIsolated<CompileResult>({
        module: DRIVER,
        fn: 'compileProject',
        args: [root],
        timeoutMs: KILL_MS,
      })
      return expectBounded(run, { ms: BUDGET_MS })
    })
    // `missing` answers no Reference export, so its call emits no class; the red control still compiles.
    expect(result.diagnostics).toEqual([])
    expect(result.css?.classes).toEqual({ 'color:red': '@reference-ui/lib__c_red' })
  },
}

export default spec

/**
 * Export-star clique bound (ATM-BOUND-03). The station compiles `input/`, a twelve-module clique where every
 * module `export *` from the other eleven, in process; that compile must be cheap there because nothing in it
 * imports across the clique. The bound is the consumer compile: driver.mjs adds `src/app.ts`, which imports
 * `missing` from `./m0`, and runs the compile in a child process that must finish inside the budget. Every
 * walk from that import crosses the whole clique, so a walk that re-expands each path fails here by name.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect } from 'vitest'
import { expectBounded, runIsolated } from '../../../../../testing/isolated.js'
import type { AtomicCaseSpec, CompileResult } from '../../harness/helpers.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const BUDGET_MS = 2000
const KILL_MS = 30_000

const spec: AtomicCaseSpec = {
  id: 'ATM-BOUND-03',
  verify() {
    const run = runIsolated<CompileResult>({
      module: path.join(HERE, 'driver.mjs'),
      fn: 'compileWithConsumer',
      timeoutMs: KILL_MS,
    })
    const result = expectBounded(run, { ms: BUDGET_MS })
    // `missing` answers no Reference export, so its call emits no class; the red control still compiles.
    expect(result.diagnostics).toEqual([])
    expect(result.css?.classes).toEqual({ 'color:red': '@reference-ui/lib__c_red' })
  },
}

export default spec

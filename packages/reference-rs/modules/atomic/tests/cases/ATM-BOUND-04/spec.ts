/**
 * Symlink-loop bound (ATM-BOUND-04). The station compiles `input/`, a plain styling tree, in process; that
 * stylesheet is the reference. This spec copies `input/` into a temp project it owns, adds the self-links
 * `src/loopA -> .` and `src/loopB -> .`, and compiles that project through driver.mjs in a child process. The child
 * must finish inside the budget and produce the plain tree's stylesheet and class map. A walk that follows each
 * self-link again multiplies its work, so an unbounded walk fails here by name. The parent removes the temp project.
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
const KILL_MS = 15_000

const spec: AtomicCaseSpec = {
  id: 'ATM-BOUND-04',
  verify(result) {
    const linked = withTempDir('atm-bound-04-', root => {
      fs.cpSync(INPUT_DIR, root, { recursive: true })
      fs.symlinkSync('.', path.join(root, 'src', 'loopA'))
      fs.symlinkSync('.', path.join(root, 'src', 'loopB'))
      const run = runIsolated<CompileResult>({
        module: DRIVER,
        fn: 'compileProject',
        args: [root],
        timeoutMs: KILL_MS,
      })
      return expectBounded(run, { ms: BUDGET_MS })
    })
    expect(linked.stylesheet).toBe(result.stylesheet)
    expect(linked.css?.classes).toEqual(result.css?.classes)
  },
}

export default spec

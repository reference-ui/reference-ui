/**
 * FIFO bound (ATM-BOUND-06). The station compiles `input/`, a plain styling tree, in process; that stylesheet is the
 * reference. This spec copies `input/` into a temp project it owns, makes a FIFO at `src/pipe.ts` with `mkfifo`
 * (git cannot hold one), and compiles that project through driver.mjs in a child process. The child must finish
 * inside the budget and produce the plain tree's stylesheet and class map. Opening a FIFO blocks until a writer
 * appears, so a walk that opens it fails here by name. The parent removes the temp project.
 */
import { execFileSync } from 'node:child_process'
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
  id: 'ATM-BOUND-06',
  verify(result) {
    const piped = withTempDir('atm-bound-06-', root => {
      fs.cpSync(INPUT_DIR, root, { recursive: true })
      if (process.platform !== 'win32') {
        execFileSync('mkfifo', [path.join(root, 'src', 'pipe.ts')])
      }
      const run = runIsolated<CompileResult>({
        module: DRIVER,
        fn: 'compileProject',
        args: [root],
        timeoutMs: KILL_MS,
      })
      return expectBounded(run, { ms: BUDGET_MS })
    })
    expect(piped.stylesheet).toBe(result.stylesheet)
    expect(piped.css?.classes).toEqual(result.css?.classes)
  },
}

export default spec

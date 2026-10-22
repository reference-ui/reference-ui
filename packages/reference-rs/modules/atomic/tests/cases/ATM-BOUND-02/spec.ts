/**
 * Nesting refusal (ATM-BOUND-02). `src/deep.ts` nests one `css()` colour value 300,000 parentheses deep beside two
 * committed siblings that style `red` and `blue`. The deep file is written into a temp project this spec owns, and
 * that project compiles in a child process (driver.mjs through runIsolated), so a native overflow or a hang ends the
 * child, not the Vitest worker. The contract: one located ATM-E-PARSE names the deep file and line 2, no class comes
 * from the deep value, and both siblings' classes are present.
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
const DEPTH = 300_000
const BUDGET_MS = 2000
const KILL_MS = 30_000

const DEEP_SOURCE = [
  "import { css } from '@reference-ui/react'",
  `export const deep = css({ color: ${'('.repeat(DEPTH)}'green'${')'.repeat(DEPTH)} })`,
  '',
].join('\n')

const spec: AtomicCaseSpec = {
  id: 'ATM-BOUND-02',
  verify() {
    const result = withTempDir('atm-bound-02-', root => {
      fs.cpSync(INPUT_DIR, root, { recursive: true })
      fs.writeFileSync(path.join(root, 'src', 'deep.ts'), DEEP_SOURCE)
      const run = runIsolated<CompileResult>({
        module: DRIVER,
        fn: 'compileProject',
        args: [root],
        timeoutMs: KILL_MS,
      })
      return expectBounded(run, { ms: BUDGET_MS })
    })

    const parseErrors = result.diagnostics.filter(d => d.code === 'ATM-E-PARSE')
    expect(parseErrors, 'one located ATM-E-PARSE for the deep file').toHaveLength(1)
    expect(parseErrors[0]!.file).toMatch(/src\/deep\.ts$/)
    expect(parseErrors[0]!.line).toBe(2)
    expect(parseErrors[0]!.message).toBe('nesting deeper than 1024 levels at line 2; split or flatten the deeply nested expression')
    expect(Object.keys(result.css?.classes ?? {}).sort()).toEqual(['color:blue', 'color:red'])
  },
}

export default spec

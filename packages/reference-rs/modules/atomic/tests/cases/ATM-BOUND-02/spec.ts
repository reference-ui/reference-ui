/**
 * Nesting refusal (ATM-BOUND-02). Four shapes are refused before Oxc parses them, each beside the committed siblings that
 * style `red` and `blue`. `src/deep.ts` nests one `css()` colour value 300,000 parentheses deep, and `src/nest.tsx` nests
 * 5,000 `<div>` elements, which the pre-scan counts as JSX nesting once they close. `src/quote.ts` puts the 300,000 behind a
 * regex literal that holds a quote, and `src/poison.tsx` behind a generic function type that TSX first reads as an element:
 * each used to hide the nesting from the pre-scan. Each shape is written into a temp project this spec owns and compiles in
 * a child process (driver.mjs through runIsolated), so a native overflow or a hang ends the child, not the Vitest worker.
 * For each shape the contract is one located ATM-E-PARSE that names the file and line 2, no class from the nested value,
 * and both siblings' classes.
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
const JSX_DEPTH = 5_000
const BUDGET_MS = 2000
const KILL_MS = 30_000
const MESSAGE = 'nesting deeper than 1024 levels at line 2; split or flatten the deeply nested expression'

const DEEP_SOURCE = [
  "import { css } from '@reference-ui/react'",
  `export const deep = css({ color: ${'('.repeat(DEPTH)}'green'${')'.repeat(DEPTH)} })`,
  '',
].join('\n')

const NEST_SOURCE = [
  "import { Div } from '@reference-ui/react'",
  `export const nest = () => (${'<div>'.repeat(JSX_DEPTH)}x${'</div>'.repeat(JSX_DEPTH)})`,
  '',
].join('\n')

// A regex literal holding a quote used to open a string that hid the rest of its line, the nested value with it.
const QUOTE_SOURCE = [
  "import { css } from '@reference-ui/react'",
  `export const quote = /"/; export const deep = css({ color: ${'('.repeat(DEPTH)}'green'${')'.repeat(DEPTH)} })`,
  '',
].join('\n')

// In TSX, `<T>(x: T) => T` was read as an element whose text hid the rest of the file from the pre-scan. The nest sits in
// front of the object, because a `{` in that text opens code again.
const POISON_SOURCE = [
  "import { css } from '@reference-ui/react'",
  `type Id = <T>(x: T) => T; export const deep = css(${'('.repeat(DEPTH)}{ color: 'green' }${')'.repeat(DEPTH)})`,
  '',
].join('\n')

// Compiles the siblings plus one extra file, in a child process, and returns the child's result.
function compileWith(file: string, source: string): CompileResult {
  return withTempDir('atm-bound-02-', root => {
    fs.cpSync(INPUT_DIR, root, { recursive: true })
    fs.writeFileSync(path.join(root, 'src', file), source)
    const run = runIsolated<CompileResult>({
      module: DRIVER,
      fn: 'compileProject',
      args: [root],
      timeoutMs: KILL_MS,
    })
    return expectBounded(run, { ms: BUDGET_MS })
  })
}

function expectRefusedBesideSiblings(result: CompileResult, file: string): void {
  const parseErrors = result.diagnostics.filter(d => d.code === 'ATM-E-PARSE')
  expect(parseErrors, `one located ATM-E-PARSE for ${file}`).toHaveLength(1)
  expect(parseErrors[0]!.file).toMatch(new RegExp(`src/${file.replace('.', '\\.')}$`))
  expect(parseErrors[0]!.line).toBe(2)
  expect(parseErrors[0]!.message).toBe(MESSAGE)
  expect(Object.keys(result.css?.classes ?? {}).sort()).toEqual(['color:blue', 'color:red'])
}

const spec: AtomicCaseSpec = {
  id: 'ATM-BOUND-02',
  verify() {
    expectRefusedBesideSiblings(compileWith('deep.ts', DEEP_SOURCE), 'deep.ts')
    expectRefusedBesideSiblings(compileWith('nest.tsx', NEST_SOURCE), 'nest.tsx')
    expectRefusedBesideSiblings(compileWith('quote.ts', QUOTE_SOURCE), 'quote.ts')
    expectRefusedBesideSiblings(compileWith('poison.tsx', POISON_SOURCE), 'poison.tsx')
  },
}

export default spec

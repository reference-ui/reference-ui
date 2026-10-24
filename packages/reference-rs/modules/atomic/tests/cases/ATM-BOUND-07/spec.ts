/**
 * Expression-depth refusal (ATM-BOUND-07). One `css()` colour value per chain shape is written past the depth limit into
 * a temp project this spec owns, beside the committed siblings that style `red` and `blue`. None of the chains holds a
 * bracket that nests, so the shared nesting gate counts them at nothing, and each one nests the AST as deep as it is long.
 * `src/under.ts` chains 8,000 empty-string concatenations ahead of `'green'`, just under the limit, and must fold to a
 * class. `src/branches.ts` holds a 2,100-branch else-if chain beside a `css()` call and must compile to its class too,
 * while `src/branchesdeep.ts` holds a 10,000-branch chain and is refused. The project compiles once in a child process (driver.mjs through runIsolated), so a native overflow or a hang ends
 * the child, not the Vitest worker. The contract is one located ATM-E-PARSE per deep file naming line 2, no class from any
 * deep value, the siblings' classes, and the under-limit file's class.
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
const BUDGET_MS = 15_000
const KILL_MS = 60_000
const MESSAGE =
  'code nested deeper than 8192 levels at line 2; split or flatten the long chain of operators, else-if branches or conditional types'

// Links per chain. The shapes the parser reads in a loop reach 100,000; the ones it recurses through stay at 20,000, which
// is well past the limit and inside every stack the parser can run on.
const LOOPED = 100_000
const RECURSIVE = 20_000

interface Shape {
  file: string
  value: string
}

const chain = (head: string, link: string, tail: string, count: number): string => `${head}${link.repeat(count)}${tail}`

const SHAPES: Shape[] = [
  { file: 'binary', value: chain("'r'", " + 'e'", '', LOOPED) },
  { file: 'logical', value: chain("'red'", " || 'x'", '', LOOPED) },
  { file: 'member', value: chain('theme', '.a', '', LOOPED) },
  { file: 'computed', value: chain('theme', "['a']", '', LOOPED) },
  { file: 'optional', value: chain('theme', '?.a', '', LOOPED) },
  { file: 'call', value: chain('pick', '()', '', LOOPED) },
  { file: 'as', value: chain("'red'", ' as string', '', LOOPED) },
  { file: 'nonnull', value: chain('flag', '!', '', LOOPED) },
  { file: 'conditional', value: chain('', 'flag ? ' + "'red'" + ' : ', "'blue'", RECURSIVE) },
  { file: 'unary', value: chain('', '!', 'flag', RECURSIVE) },
  { file: 'negation', value: chain('', '- ', '1', RECURSIVE) },
  { file: 'void', value: chain('', 'void ', '1', RECURSIVE) },
]

const UNDER_VALUE = chain('', "'' + ", "'green'", 8_000)

// Else-if branches are statements, one level each. 2,100 sits past the old limit of 2,048 and under the current one.
const BRANCHES_OK = 2_100
const BRANCHES_DEEP = 10_000

function sourceFor(value: string): string {
  return [
    "import { css } from '@reference-ui/react'",
    `const theme = { a: 'red' }; const flag = true; const pick = () => 'red'; export const deep = css({ color: ${value} })`,
    '',
  ].join('\n')
}

// A file whose line 2 holds `branches` else-if branches, with a plain `css()` call beside them.
function branchSource(branches: number, color: string): string {
  return [
    "import { css } from '@reference-ui/react'",
    `const flag = true; let n = 0; if (flag) { n = 1 }${chain('', ' else if (flag) { n = 2 }', '', branches)}`,
    `export const branched = css({ color: '${color}' })`,
    '',
  ].join('\n')
}

// Compiles the siblings plus every deep file and the under-limit file, in a child process, and returns its result.
function compileAll(): CompileResult {
  return withTempDir('atm-bound-07-', root => {
    fs.cpSync(INPUT_DIR, root, { recursive: true })
    for (const shape of SHAPES) {
      fs.writeFileSync(path.join(root, 'src', `${shape.file}.ts`), sourceFor(shape.value))
    }
    fs.writeFileSync(path.join(root, 'src', 'under.ts'), sourceFor(UNDER_VALUE))
    fs.writeFileSync(path.join(root, 'src', 'branches.ts'), branchSource(BRANCHES_OK, 'purple'))
    fs.writeFileSync(path.join(root, 'src', 'branchesdeep.ts'), branchSource(BRANCHES_DEEP, 'orange'))
    const run = runIsolated<CompileResult>({
      module: DRIVER,
      fn: 'compileProject',
      args: [root],
      timeoutMs: KILL_MS,
    })
    return expectBounded(run, { ms: BUDGET_MS })
  })
}

const spec: AtomicCaseSpec = {
  id: 'ATM-BOUND-07',
  verify() {
    const result = compileAll()
    const parseErrors = result.diagnostics.filter(d => d.code === 'ATM-E-PARSE')
    const refused = parseErrors.map(d => path.basename(d.file ?? '')).sort()
    expect(refused).toEqual([...SHAPES.map(shape => `${shape.file}.ts`), 'branchesdeep.ts'].sort())
    for (const error of parseErrors) {
      expect(error.line, error.file).toBe(2)
      expect(error.message, error.file).toBe(MESSAGE)
    }
    expect(Object.keys(result.css?.classes ?? {}).sort()).toEqual(['color:blue', 'color:green', 'color:purple', 'color:red'])
  },
}

export default spec

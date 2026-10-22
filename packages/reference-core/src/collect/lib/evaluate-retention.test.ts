// Retention tests for the fragment evaluator over a temp project with a large token file.
// They take one prepared fragment set and evaluate it thirty times in this process, asserting that post-GC heap
// growth stays bounded, that an edited fragment is read again, and that a throwing fragment's stack names the script.

import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setFlagsFromString } from 'node:v8'
import { runInNewContext } from 'node:vm'
import { afterEach, describe, expect, it } from 'vitest'
import type { ReferenceUIConfig } from '../../config/types.ts'
import { evaluatePreparedFragments, prepareFragments } from './evaluate.ts'

const RUNS = 30
const BUDGET_MB = 4
const MB = 1024 * 1024

setFlagsFromString('--expose-gc')
const gc = runInNewContext('gc') as () => void

function heapAfterGc(): number {
  gc()
  gc()
  return process.memoryUsage().heapUsed
}

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
})

async function writeProject(files: Record<string, string>): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'core-fragments-retention-'))
  tempDirs.push(dir)
  for (const [name, content] of Object.entries(files)) {
    const path = join(dir, name)
    await mkdir(join(path, '..'), { recursive: true })
    await writeFile(path, content)
  }
  return dir
}

const config: ReferenceUIConfig = { name: 'retention', include: ['theme/**/*.{ts,tsx}'] }

// Literal tokens, so the bundle itself is large (about 400 KB), not just what it builds at run time.
function bigTokensFile(first: string): string {
  const entries = Array.from({ length: 6000 }, (_, i) => `    big${i}: { value: '#${String(i).padStart(6, '0')}' },`)
  return [
    "import { tokens } from '@reference-ui/core'",
    '',
    'tokens({',
    '  colors: {',
    `    first: { value: '${first}' },`,
    ...entries,
    '  },',
    '})',
    '',
  ].join('\n')
}

function colorOf(spec: unknown, name: string): unknown {
  return (spec as { tokens?: { colors?: Record<string, { value?: unknown }> } }).tokens?.colors?.[name]?.value
}

describe('fragment evaluation retention', () => {
  it('evaluates one large fragment set thirty times without retaining each run', async () => {
    const cwd = await writeProject({ 'theme/tokens.ts': bigTokensFile('#111111') })
    const prepared = await prepareFragments(cwd, config)
    expect(prepared.localFragmentBundles[0]?.bundle.length ?? 0).toBeGreaterThan(200_000)

    await evaluatePreparedFragments(cwd, config, prepared)
    const before = heapAfterGc()
    for (let i = 0; i < RUNS; i += 1) await evaluatePreparedFragments(cwd, config, prepared)
    const growthMb = (heapAfterGc() - before) / MB

    expect(growthMb, `${RUNS} evaluations retained ${growthMb.toFixed(1)} MB`).toBeLessThan(BUDGET_MB)
  })

  it('reads an edited fragment again on the next evaluation', async () => {
    const cwd = await writeProject({ 'theme/tokens.ts': bigTokensFile('#111111') })
    const first = await evaluatePreparedFragments(cwd, config, await prepareFragments(cwd, config))
    expect(colorOf(first, 'first')).toBe('#111111')

    await writeFile(join(cwd, 'theme/tokens.ts'), bigTokensFile('#222222'))
    const edited = await evaluatePreparedFragments(cwd, config, await prepareFragments(cwd, config))
    expect(colorOf(edited, 'first')).toBe('#222222')
  })

  it('names the evaluation script in the stack of a throwing fragment', async () => {
    const cwd = await writeProject({
      'theme/tokens.ts': [
        "import { tokens } from '@reference-ui/core'",
        "tokens({ colors: { ok: { value: '#000000' } } })",
        "throw new Error('fragment exploded')",
        '',
      ].join('\n'),
    })
    const prepared = await prepareFragments(cwd, config)
    const failure = await evaluatePreparedFragments(cwd, config, prepared).catch((error: unknown) => error)

    expect(failure).toBeInstanceOf(Error)
    expect((failure as Error).message).toBe('fragment exploded')
    expect((failure as Error).stack).toContain(join(cwd, '.reference-ui', 'tmp', 'fragments-eval'))
  })
})

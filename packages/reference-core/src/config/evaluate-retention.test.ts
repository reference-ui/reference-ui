// Retention tests for the config evaluator over a large in-memory ESM bundle.
// They evaluate one unchanged bundle thirty times in this process and assert that post-GC heap growth stays bounded
// and the export is shared, that an edited bundle is evaluated again, and that a failed evaluation is retried.

import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setFlagsFromString } from 'node:v8'
import { runInNewContext } from 'node:vm'
import { afterEach, describe, expect, it } from 'vitest'
import { evaluateConfig } from './evaluate.ts'

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

async function configPathOf(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'core-config-retention-'))
  tempDirs.push(dir)
  return join(dir, 'ui.config.ts')
}

// A bundle the size of an extended system's config (about 400 KB of source), stamped so edits differ.
function bigBundle(stamp: string): string {
  const entries = Array.from({ length: 12000 }, (_, i) => `  big${i}: { value: '#${String(i).padStart(6, '0')}' },`)
  return [
    'const colors = {',
    ...entries,
    '}',
    `export default { name: 'retention', include: ['src/**/*.ts'], stamp: '${stamp}', colors }`,
  ].join('\n')
}

describe('config evaluation retention', () => {
  it('evaluates one unchanged bundle thirty times without retaining each run', async () => {
    const configPath = await configPathOf()
    const code = bigBundle('a')
    expect(code.length).toBeGreaterThan(350_000)

    const first = await evaluateConfig(code, configPath)
    const before = heapAfterGc()
    let last: unknown
    for (let i = 0; i < RUNS; i += 1) last = await evaluateConfig(code, configPath)
    const growthMb = (heapAfterGc() - before) / MB

    expect(growthMb, `${RUNS} evaluations retained ${growthMb.toFixed(1)} MB`).toBeLessThan(BUDGET_MB)
    expect(last).toBe(first)
  })

  it('evaluates an edited bundle again and keeps each version distinct', async () => {
    const configPath = await configPathOf()
    const first = (await evaluateConfig(bigBundle('a'), configPath)) as { stamp: string }
    const edited = (await evaluateConfig(bigBundle('b'), configPath)) as { stamp: string }
    const reverted = (await evaluateConfig(bigBundle('a'), configPath)) as { stamp: string }

    expect(first.stamp).toBe('a')
    expect(edited.stamp).toBe('b')
    expect(reverted.stamp).toBe('a')
  })

  it('imports a failed bundle again on the next evaluation instead of caching the failure', async () => {
    const configPath = await configPathOf()
    const counter = '__coreConfigRetentionAttempts'
    const code = [
      `globalThis.${counter} = (globalThis.${counter} ?? 0) + 1`,
      `if (globalThis.${counter} === 1) throw new Error('first attempt fails')`,
      "export default { name: 'retry', include: ['src/**/*.ts'] }",
    ].join('\n')

    await expect(evaluateConfig(code, configPath)).rejects.toThrow('first attempt fails')
    await expect(evaluateConfig(code, configPath)).resolves.toMatchObject({ name: 'retry' })
    expect((globalThis as Record<string, unknown>)[counter]).toBe(2)
  })
})

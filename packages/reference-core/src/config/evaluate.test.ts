// Unit tests for the Core config evaluator over in-memory ESM bundles.
// They take bundled code plus a source path and assert the evaluated export.
// This file is a core-owned copy of the retired reference-core evaluator tests.

import { existsSync, readFileSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { getOutDirPath, getProjectTmpDirPath } from '../lib/paths/index.ts'
import { evaluateConfig } from './evaluate.ts'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
})

describe('evaluateConfig', () => {
  it('loads an in-memory ESM config module', async () => {
    const result = await evaluateConfig(
      'export default { name: "demo", include: ["src/**/*.ts"] }',
      join(process.cwd(), 'ui.config.ts')
    )

    expect(result).toEqual({
      name: 'demo',
      include: ['src/**/*.ts'],
    })
  })

  it('falls back to the module namespace when no default export exists', async () => {
    const result = await evaluateConfig(
      'export const name = "demo"; export const include = ["src/**/*.ts"]',
      join(process.cwd(), 'ui.config.ts')
    )

    expect(result).toMatchObject({
      name: 'demo',
      include: ['src/**/*.ts'],
    })
  })

  it('resolves bare package imports from the config directory', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'reference-ui-config-evaluate-'))
    tempDirs.push(dir)

    const pkgDir = join(dir, 'node_modules', 'demo-pkg')
    await mkdir(pkgDir, { recursive: true })
    await writeFile(
      join(pkgDir, 'package.json'),
      JSON.stringify(
        {
          name: 'demo-pkg',
          type: 'module',
          exports: {
            '.': './index.mjs',
          },
        },
        null,
        2
      )
    )
    await writeFile(join(pkgDir, 'index.mjs'), 'export default { theme: "ok" }\n')

    const result = await evaluateConfig(
      'import demo from "demo-pkg"; export default demo',
      join(dir, 'ui.config.ts')
    )

    expect(result).toEqual({ theme: 'ok' })
  })

})

describe('evaluateConfig cleanup', () => {
  it('removes the project tmp root when the eval leaves it empty', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'reference-ui-config-evaluate-'))
    tempDirs.push(dir)

    await evaluateConfig('export default { name: "demo" }', join(dir, 'ui.config.ts'))

    expect(existsSync(getProjectTmpDirPath(dir))).toBe(false)
  })

  it('removes the output dir when the eval leaves it empty', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'reference-ui-config-evaluate-'))
    tempDirs.push(dir)

    await evaluateConfig('export default { name: "demo" }', join(dir, 'ui.config.ts'))

    expect(existsSync(getOutDirPath(dir))).toBe(false)
  })

  it('keeps a shared tmp root that still holds other files', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'reference-ui-config-evaluate-'))
    tempDirs.push(dir)

    const tempRoot = getProjectTmpDirPath(dir)
    await mkdir(tempRoot, { recursive: true })
    await writeFile(join(tempRoot, 'session.json'), '{}')

    await evaluateConfig('export default { name: "demo" }', join(dir, 'ui.config.ts'))

    expect(readFileSync(join(tempRoot, 'session.json'), 'utf8')).toBe('{}')
  })
})

describe('evaluateConfig bounds', () => {
  it('rejects a config whose top-level await never settles, once its bound passes', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'reference-ui-config-evaluate-'))
    tempDirs.push(dir)

    const error = await evaluateConfig(
      'await new Promise(() => {})\nexport default { name: "demo" }',
      join(dir, 'ui.config.ts'),
      { timeoutMs: 50 }
    ).then(
      () => undefined,
      (err: unknown) => err
    )

    expect(error).toMatchObject({ name: 'ConfigEvaluationTimeoutError', timeoutMs: 50 })
    expect((error as Error).message).toMatch(/did not finish within 50 ms/)
    expect(existsSync(getProjectTmpDirPath(dir))).toBe(false)
  })
})

describe('evaluateConfig concurrency', () => {
  it('lets five evaluations of one project start together and each land its own module', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'reference-ui-config-evaluate-'))
    tempDirs.push(dir)
    const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

    for (let round = 0; round < 150; round += 1) {
      const settled = await Promise.allSettled(
        Array.from({ length: 5 }, async (_, load) => {
          await sleep(Math.random() * 4)
          return evaluateConfig(`export default { name: "demo-${round}-${load}" }`, join(dir, 'ui.config.ts'))
        })
      )
      const failures = settled.flatMap((result) => (result.status === 'rejected' ? [String(result.reason)] : []))
      expect(failures, `round ${round}`).toEqual([])
    }
  }, 30_000)
})

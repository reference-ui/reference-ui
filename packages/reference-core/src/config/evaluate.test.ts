import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { describe, expect, it } from 'vitest'
import { evaluateConfig } from './evaluate'

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

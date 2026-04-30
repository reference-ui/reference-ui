import { realpathSync } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { bundleConfig, bundleConfigWithDependencies } from './bundle'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
})

describe('bundleConfig', () => {
  it('keeps bare package imports external while bundling the config', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'reference-ui-config-bundle-'))
    tempDirs.push(dir)

    const configPath = join(dir, 'ui.config.ts')
    await writeFile(
      configPath,
      [
        "import missingPkg from 'nonexistent-package'",
        "import { defineConfig } from '@reference-ui/core'",
        '',
        'export default defineConfig({',
        "  name: 'demo',",
        "  include: ['src/**/*.{ts,tsx}'],",
        '  meta: missingPkg,',
        '})',
        '',
      ].join('\n')
    )

    const bundled = await bundleConfig(configPath)

    expect(bundled).toMatch(/from ['"]nonexistent-package['"]/) 
  })

  it('returns local config dependency paths for watch invalidation', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'reference-ui-config-bundle-'))
    tempDirs.push(dir)

    const configPath = join(dir, 'ui.config.ts')
    const helperPath = join(dir, 'config-shared.ts')
    await writeFile(helperPath, "export const include = ['src/**/*.{ts,tsx}']\n")
    await writeFile(
      configPath,
      [
        "import { defineConfig } from '@reference-ui/core'",
        "import { include } from './config-shared'",
        '',
        'export default defineConfig({',
        "  name: 'demo',",
        '  include,',
        '})',
        '',
      ].join('\n')
    )

    const bundled = await bundleConfigWithDependencies(configPath)

    expect(bundled.dependencyPaths).toContain(realpathSync(configPath))
    expect(bundled.dependencyPaths).toContain(realpathSync(helperPath))
    expect(bundled.code).toContain('name: "demo"')
  })
})
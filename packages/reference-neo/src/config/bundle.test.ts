// Unit tests for the Neo config bundler over temp project trees.
// They take fixture configs and assert external handling plus dependency
// paths, including resolution of canon-base-relative metafile keys.
// This file is a Neo-owned copy of the core bundler tests.

import { realpathSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { bundleConfig, bundleConfigWithDependencies } from './bundle.ts'

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

  it('aliases Neo package ids to the local root barrel', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'reference-ui-config-bundle-'))
    tempDirs.push(dir)

    const configPath = join(dir, 'ui.config.ts')
    await writeFile(
      configPath,
      [
        "import { defineConfig } from '@reference-ui/neo'",
        '',
        'export default defineConfig({',
        "  name: 'demo',",
        "  include: ['src/**/*.{ts,tsx}'],",
        '})',
        '',
      ].join('\n')
    )

    const bundled = await bundleConfig(configPath)

    expect(bundled).toContain('name: "demo"')
  })
})

describe('bundleConfigWithDependencies', () => {
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

  it('resolves canon-base-relative metafile keys across a parent dir', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'reference-ui-config-bundle-'))
    tempDirs.push(dir)

    const nested = join(dir, 'nested')
    await mkdir(nested, { recursive: true })
    const helperPath = join(dir, 'config-shared.ts')
    const configPath = join(nested, 'ui.config.ts')
    await writeFile(helperPath, "export const include = ['src/**/*.{ts,tsx}']\n")
    await writeFile(
      configPath,
      [
        "import { defineConfig } from '@reference-ui/core'",
        "import { include } from '../config-shared'",
        '',
        'export default defineConfig({',
        "  name: 'nested-demo',",
        '  include,',
        '})',
        '',
      ].join('\n')
    )

    const bundled = await bundleConfigWithDependencies(configPath)

    // The helper lives above the config dir, so a configDir-relative resolve
    // of the canon-base key would miss it; only the canon base finds it.
    expect(bundled.dependencyPaths).toContain(realpathSync(configPath))
    expect(bundled.dependencyPaths).toContain(realpathSync(helperPath))
    expect(bundled.code).toContain('name: "nested-demo"')
  })
})

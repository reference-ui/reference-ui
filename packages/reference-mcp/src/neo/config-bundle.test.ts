// Unit tests for the mcp-side config bundler over temp project trees.
// They take a fixture config with a sibling helper and assert the vendored
// normalize resolves canon-base-relative metafile keys to real paths.

import { realpathSync } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { bundleConfigWithDependencies } from './config-bundle'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
})

describe('bundleConfigWithDependencies', () => {
  it('resolves canon-base-relative metafile keys to real dependency paths', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'reference-mcp-config-bundle-'))
    tempDirs.push(dir)

    const helperPath = join(dir, 'config-shared.ts')
    const configPath = join(dir, 'ui.config.ts')
    await writeFile(helperPath, "export const include = ['src/**/*.{ts,tsx}']\n")
    await writeFile(
      configPath,
      [
        "import { defineConfig } from '@reference-ui/neo'",
        "import { include } from './config-shared'",
        '',
        'export default defineConfig({',
        "  name: 'mcp-demo',",
        '  include,',
        '})',
        '',
      ].join('\n')
    )

    const bundled = await bundleConfigWithDependencies(configPath)

    expect(bundled.dependencyPaths).toContain(realpathSync(configPath))
    expect(bundled.dependencyPaths).toContain(realpathSync(helperPath))
    expect(bundled.code).toContain('name: "mcp-demo"')
  })
})

import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { bundleConfig } from './bundle'

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
})
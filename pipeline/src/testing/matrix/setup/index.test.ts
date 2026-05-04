import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { describe, it } from 'node:test'

import { createManagedMatrixPackageJson } from '../managed/package-json/index.js'
import {
  createManagedMatrixFixtureFiles,
  shouldManageMatrixFixturePlaywrightConfig,
} from './index.js'

describe('setupMatrixPackages package generation', () => {
  it('delegates package.json generation to the managed package-json module', () => {
    const packageJson = JSON.parse(createManagedMatrixPackageJson({
      config: {
        bundlers: ['vite7'],
        react: 'react19',
      },
      packageName: '@matrix/distro',
    })) as {
      name: string
      scripts: Record<string, string>
    }

    assert.equal(packageJson.name, '@matrix/distro')
    assert.equal(packageJson.scripts.setup, 'pnpm --dir ../../pipeline exec tsx src/cli.ts setup --packages=@matrix/distro --sync')
    assert.deepEqual(Object.keys(packageJson.scripts).sort(), ['setup', 'sync', 'test'])
  })

  it('generates shared fixture test-runner config files during setup', () => {
    const files = createManagedMatrixFixtureFiles({
      config: {
        name: 'mcp',
        refSync: { mode: 'full' },
        bundlers: ['vite7', 'webpack5'],
        react: 'react19',
        runTypecheck: false,
      },
      configPath: '/Users/ryn/Developer/reference-ui/matrix/mcp/matrix.json',
      dir: '/Users/ryn/Developer/reference-ui/matrix/mcp',
      packageName: '@matrix/mcp',
    })

    assert.match(files['vitest.config.ts'] ?? '', /globalSetup: \['\.\/tests\/unit\/global-setup\.ts'\]/)
    assert.equal(files['playwright.config.ts'], undefined)
    assert.equal(files['webpack.config.cjs'], undefined)
    assert.ok(files['vite.config.ts']?.includes('generated and managed by pipeline'))
  })

  it('preserves fixture-owned Playwright configs for the dedicated Playwright matrix package', () => {
    assert.equal(
      shouldManageMatrixFixturePlaywrightConfig({ packageName: '@matrix/playwright' }),
      false,
    )
  })
})
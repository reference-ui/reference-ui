import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createManagedMatrixPackageJson, createMatrixConsumerPackageJson, type MatrixFixturePackageJson } from './index.js'

describe('createManagedMatrixPackageJson', () => {
  it('generates only setup, test, and sync for matrix workspace packages', () => {
    const packageJson = JSON.parse(
      createManagedMatrixPackageJson({
        existingPackageJson: {
          devDependencies: {
            '@modelcontextprotocol/sdk': '^1.29.0',
            vitest: '^4.0.18',
          },
          exports: { '.': './src/index.ts' },
          scripts: {
            sync: 'pnpm exec ref sync',
            test: 'vitest run && tsc --noEmit',
          },
          version: '0.0.7',
        },
        packageName: '@matrix/mcp',
      }),
    ) as {
      devDependencies: Record<string, string>
      name: string
      scripts: Record<string, string>
      version: string
    }

    assert.equal(packageJson.name, '@matrix/mcp')
    assert.equal(packageJson.version, '0.0.7')
    assert.equal(packageJson.scripts.setup, 'pnpm --dir ../../pipeline exec tsx src/cli.ts setup --packages=@matrix/mcp')
    assert.equal(packageJson.scripts.test, 'pnpm --dir ../../pipeline exec tsx src/cli.ts test --packages=@matrix/mcp')
    assert.equal(packageJson.scripts.sync, 'pnpm exec ref sync')
    assert.deepEqual(Object.keys(packageJson.scripts).sort(), ['setup', 'sync', 'test'])
    assert.equal(packageJson.devDependencies['@modelcontextprotocol/sdk'], '^1.29.0')
  })
})

describe('createMatrixConsumerPackageJson', () => {
  it('generates only setup, test, and sync for synthetic consumers', () => {
    const fixturePackageJson: MatrixFixturePackageJson = {
      dependencies: {
        '@reference-ui/core': 'workspace:*',
        '@reference-ui/lib': 'workspace:*',
        react: '^19.2.0',
      },
      devDependencies: {
        typescript: '~5.9.3',
        vitest: '^4.0.18',
      },
      name: '@matrix/install',
      private: true,
      scripts: {
        setup: 'pnpm --dir ../../pipeline exec tsx src/cli.ts setup --packages=@matrix/install',
        test: 'pnpm --dir ../../pipeline exec tsx src/cli.ts test --packages=@matrix/install',
        sync: 'pnpm exec ref sync',
      },
      type: 'module',
    }

    const packageJson = JSON.parse(
      createMatrixConsumerPackageJson({
        coreVersion: '0.0.16',
        fixturePackageJson,
        libVersion: '0.0.19',
      }),
    ) as {
      dependencies: Record<string, string>
      devDependencies: Record<string, string>
      name: string
      private: boolean
      scripts: Record<string, string>
    }

    assert.deepEqual(packageJson.dependencies, {
      '@reference-ui/core': '0.0.16',
      '@reference-ui/lib': '0.0.19',
      react: '^19.2.0',
    })
    assert.deepEqual(packageJson.devDependencies, {
      typescript: '~5.9.3',
      vitest: '^4.0.18',
    })
    assert.equal(packageJson.name, '@matrix/install')
    assert.equal(packageJson.private, true)
    assert.equal(packageJson.scripts.setup, 'pnpm exec ref sync')
    assert.equal(packageJson.scripts.test, 'vitest run && tsc --noEmit')
    assert.equal(packageJson.scripts.sync, 'pnpm exec ref sync')
    assert.deepEqual(Object.keys(packageJson.scripts).sort(), ['setup', 'sync', 'test'])
  })

  it('falls back to raw defaults when a fixture package is already pipeline-managed', () => {
    const fixturePackageJson: MatrixFixturePackageJson = {
      name: '@matrix/typescript',
      private: true,
      scripts: {
        setup: 'pnpm --dir ../../pipeline exec tsx src/cli.ts setup --packages=@matrix/typescript',
        test: 'pnpm --dir ../../pipeline exec tsx src/cli.ts test --packages=@matrix/typescript',
        sync: 'pnpm exec ref sync',
      },
      type: 'module',
    }

    const packageJson = JSON.parse(
      createMatrixConsumerPackageJson({
        coreVersion: '0.0.16',
        fixturePackageJson,
        libVersion: '0.0.19',
      }),
    ) as {
      scripts: Record<string, string>
    }

    assert.equal(packageJson.scripts.setup, 'pnpm exec ref sync')
    assert.equal(packageJson.scripts.test, 'vitest run && tsc --noEmit')
    assert.equal(packageJson.scripts.sync, 'pnpm exec ref sync')
    assert.deepEqual(Object.keys(packageJson.scripts).sort(), ['setup', 'sync', 'test'])
  })
})

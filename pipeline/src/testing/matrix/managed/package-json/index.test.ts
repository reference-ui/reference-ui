import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createManagedMatrixPackageJson, createMatrixConsumerPackageJson, type MatrixFixturePackageJson } from './index.js'

const internalTarballSpecifiers = {
  '@reference-ui/core': 'file:.matrix-tarballs/reference-ui-core-0.0.16-corehash.tgz',
  '@reference-ui/lib': 'file:.matrix-tarballs/reference-ui-lib-0.0.19-libhash.tgz',
} as const

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
    assert.equal(packageJson.scripts.setup, 'pnpm --dir ../../pipeline exec tsx src/cli.ts setup --packages=@matrix/mcp --sync')
    assert.equal(packageJson.scripts.test, 'pnpm --dir ../../pipeline exec tsx src/cli.ts test --packages=@matrix/mcp')
    assert.equal(packageJson.scripts.sync, 'pnpm exec ref sync')
    assert.deepEqual(Object.keys(packageJson.scripts).sort(), ['setup', 'sync', 'test'])
    assert.equal(packageJson.devDependencies['@playwright/test'], undefined)
    assert.equal(packageJson.devDependencies['@modelcontextprotocol/sdk'], '^1.29.0')
  })

  it('preserves package-specific browser runners from the existing fixture package', () => {
    const packageJson = JSON.parse(
      createManagedMatrixPackageJson({
        existingPackageJson: {
          devDependencies: {
            '@playwright/test': '1.48.0',
          },
        },
        packageName: '@matrix/playwright',
      }),
    ) as {
      devDependencies: Record<string, string>
    }

    assert.equal(packageJson.devDependencies['@playwright/test'], '1.48.0')
  })
})

describe('createMatrixConsumerPackageJson', () => {
  it('drops scripts for synthetic consumers and rewrites workspace dependencies to staged tarball specs', () => {
    const fixturePackageJson: MatrixFixturePackageJson = {
      dependencies: {
        '@reference-ui/core': 'workspace:*',
        '@reference-ui/lib': 'workspace:*',
        react: '^19.2.0',
      },
      devDependencies: {
        '@playwright/test': '1.48.0',
        typescript: '~5.9.3',
        vitest: '^4.0.18',
      },
      name: '@matrix/distro',
      private: true,
      scripts: {
        setup: 'pnpm --dir ../../pipeline exec tsx src/cli.ts setup --packages=@matrix/distro --sync',
        test: 'pnpm --dir ../../pipeline exec tsx src/cli.ts test --packages=@matrix/distro',
        sync: 'pnpm exec ref sync',
      },
      type: 'module',
    }

    const packageJson = JSON.parse(
      createMatrixConsumerPackageJson({
        fixturePackageJson,
        internalTarballSpecifiers,
      }),
    ) as {
      dependencies: Record<string, string>
      devDependencies: Record<string, string>
      ignoredBuiltDependencies: string[]
      name: string
      private: boolean
      scripts?: Record<string, string>
    }

    assert.deepEqual(packageJson.dependencies, {
      '@reference-ui/core': 'file:.matrix-tarballs/reference-ui-core-0.0.16-corehash.tgz',
      '@reference-ui/lib': 'file:.matrix-tarballs/reference-ui-lib-0.0.19-libhash.tgz',
      react: '^19.2.0',
    })
    assert.deepEqual(packageJson.devDependencies, {
      '@playwright/test': '1.48.0',
      typescript: '~5.9.3',
      vitest: '^4.0.18',
    })
    assert.deepEqual(packageJson.ignoredBuiltDependencies, [
      '@parcel/watcher',
      '@swc/core',
      'esbuild',
      'nx',
    ])
    assert.equal(packageJson.name, '@matrix/distro')
    assert.equal(packageJson.private, true)
    assert.equal(packageJson.scripts, undefined)
  })

  it('drops scripts even when a fixture package is already pipeline-managed', () => {
    const fixturePackageJson: MatrixFixturePackageJson = {
      name: '@matrix/distro',
      private: true,
      scripts: {
        setup: 'pnpm --dir ../../pipeline exec tsx src/cli.ts setup --packages=@matrix/distro --sync',
        test: 'pnpm --dir ../../pipeline exec tsx src/cli.ts test --packages=@matrix/distro',
        sync: 'pnpm exec ref sync',
      },
      type: 'module',
    }

    const packageJson = JSON.parse(
      createMatrixConsumerPackageJson({
        fixturePackageJson,
        internalTarballSpecifiers,
      }),
    ) as {
      scripts?: Record<string, string>
    }

    assert.equal(packageJson.scripts, undefined)
  })

  it('rewrites any matching workspace dependency to its staged tarball spec', () => {
    const fixturePackageJson: MatrixFixturePackageJson = {
      dependencies: {
        '@fixtures/extend-library': 'workspace:*',
        react: '^19.2.0',
      },
      name: '@matrix/distro',
      private: true,
      type: 'module',
    }

    const packageJson = JSON.parse(
      createMatrixConsumerPackageJson({
        fixturePackageJson,
        internalTarballSpecifiers: {
          '@fixtures/extend-library': 'file:.matrix-tarballs/fixtures-extend-library-0.0.0-abcd1234.tgz',
        },
      }),
    ) as {
      dependencies: Record<string, string>
    }

    assert.deepEqual(packageJson.dependencies, {
      '@fixtures/extend-library': 'file:.matrix-tarballs/fixtures-extend-library-0.0.0-abcd1234.tgz',
      react: '^19.2.0',
    })
  })
})

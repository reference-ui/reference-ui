import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  MANAGED_MATRIX_DEV_DEPENDENCIES,
  MANAGED_PLAYWRIGHT_VERSION,
  MANAGED_REACT_DEPENDENCIES,
  MANAGED_REACT_DEV_DEPENDENCIES,
  MANAGED_VITE7_DEV_DEPENDENCIES,
} from '../../../../../dependencies.js'
import { createManagedMatrixPackageJson, createMatrixConsumerPackageJson, type MatrixFixturePackageJson } from './index.js'

const internalTarballSpecifiers = {
  '@reference-ui/core': 'file:.matrix-tarballs/reference-ui-core-0.0.16-corehash.tgz',
  '@reference-ui/lib': 'file:.matrix-tarballs/reference-ui-lib-0.0.19-libhash.tgz',
} as const

describe('createManagedMatrixPackageJson', () => {
  it('generates only setup, test, and sync for matrix workspace packages', () => {
    const packageJson = JSON.parse(
      createManagedMatrixPackageJson({
        config: {
          bundlers: ['vite7', 'webpack5'],
          react: 'react19',
        },
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
      '//': string
      dependencies: Record<string, string>
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
    assert.equal(packageJson.dependencies.react, MANAGED_REACT_DEPENDENCIES.react19.react)
    assert.equal(packageJson.dependencies['react-dom'], MANAGED_REACT_DEPENDENCIES.react19['react-dom'])
    assert.equal(packageJson.devDependencies['@vitejs/plugin-react'], MANAGED_VITE7_DEV_DEPENDENCIES['@vitejs/plugin-react'])
    assert.equal(packageJson.devDependencies.vite, MANAGED_VITE7_DEV_DEPENDENCIES.vite)
    assert.equal(packageJson.devDependencies.webpack, undefined)
    assert.equal(packageJson.devDependencies['webpack-dev-server'], undefined)
    assert.equal(packageJson.devDependencies['@playwright/test'], undefined)
    assert.equal(packageJson.devDependencies.postcss, MANAGED_MATRIX_DEV_DEPENDENCIES.postcss)
    assert.equal(packageJson.devDependencies['@modelcontextprotocol/sdk'], '^1.29.0')
    assert.equal(packageJson['//'], 'This file is generated and managed by pipeline.')
  })

  it('rewrites an existing Playwright pin to the managed exact version', () => {
    const packageJson = JSON.parse(
      createManagedMatrixPackageJson({
        config: {
          bundlers: ['vite7'],
          react: 'react19',
        },
        existingPackageJson: {
          devDependencies: {
            '@playwright/test': '^1.48.0',
          },
        },
        packageName: '@matrix/playwright',
      }),
    ) as {
      devDependencies: Record<string, string>
    }

    assert.equal(packageJson.devDependencies['@playwright/test'], MANAGED_PLAYWRIGHT_VERSION)
  })

  it('writes postcss into every generated matrix package.json', () => {
    const packageJson = JSON.parse(
      createManagedMatrixPackageJson({
        config: {
          bundlers: ['vite7'],
          react: 'react19',
        },
        packageName: '@matrix/playwright',
      }),
    ) as {
      devDependencies: Record<string, string>
    }

    assert.equal(packageJson.devDependencies.postcss, MANAGED_MATRIX_DEV_DEPENDENCIES.postcss)
  })

  it('routes every matrix package test script through the pipeline CLI', () => {
    const packageJson = JSON.parse(
      createManagedMatrixPackageJson({
        config: {
          bundlers: ['vite7'],
          react: 'react19',
        },
        existingPackageJson: {
          devDependencies: {
            '@playwright/test': MANAGED_PLAYWRIGHT_VERSION,
          },
        },
        packageName: '@matrix/lib',
      }),
    ) as {
      scripts: Record<string, string>
    }

    assert.equal(packageJson.scripts.test, 'pnpm --dir ../../pipeline exec tsx src/cli.ts test --packages=@matrix/lib')
    assert.equal(
      packageJson.scripts.setup,
      'pnpm --dir ../../pipeline exec tsx src/cli.ts setup --packages=@matrix/lib --sync',
    )
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
        '@playwright/test': MANAGED_PLAYWRIGHT_VERSION,
        typescript: '~7.0.2',
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
        bundlers: ['webpack5'],
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
      '@playwright/test': MANAGED_PLAYWRIGHT_VERSION,
      'css-loader': '^7.1.2',
      typescript: '~7.0.2',
      vitest: '^4.0.18',
      'html-webpack-plugin': '^5.6.3',
      'style-loader': '^4.0.0',
      'ts-loader': '^9.5.2',
      webpack: '^5.98.0',
      'webpack-cli': '^6.0.1',
      'webpack-dev-server': '^5.2.6',
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
        bundlers: ['vite7'],
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
        bundlers: ['vite7'],
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

  it('overrides React dependencies when a consumer runtime is supplied', () => {
    const packageJson = JSON.parse(
      createMatrixConsumerPackageJson({
        bundlers: ['vite7'],
        fixturePackageJson: {
          dependencies: {
            '@reference-ui/lib': 'workspace:*',
            react: '^19.2.0',
            'react-dom': '^19.2.0',
          },
          devDependencies: {
            '@types/react': '^19.2.2',
            '@types/react-dom': '^19.2.2',
          },
          name: '@matrix/lib',
          private: true,
          type: 'module',
        },
        internalTarballSpecifiers,
        reactRuntime: 'react17',
      }),
    ) as {
      dependencies: Record<string, string>
      devDependencies: Record<string, string>
    }

    assert.equal(packageJson.dependencies.react, MANAGED_REACT_DEPENDENCIES.react17.react)
    assert.equal(packageJson.dependencies['react-dom'], MANAGED_REACT_DEPENDENCIES.react17['react-dom'])
    assert.equal(packageJson.devDependencies['@types/react'], MANAGED_REACT_DEV_DEPENDENCIES.react17['@types/react'])
    assert.equal(packageJson.devDependencies['@types/react-dom'], MANAGED_REACT_DEV_DEPENDENCIES.react17['@types/react-dom'])
  })
})

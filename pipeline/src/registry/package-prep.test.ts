import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { describe, it } from 'node:test'
import type { WorkspacePackage } from '../build/types.js'
import {
  canStagePackagePath,
  collectDeclaredPackagedPaths,
  ensurePreparedPackageIncludesDeclaredOutputs,
  preparePackageJsonForLocalRegistry,
  resolveWorkspaceProtocolVersion,
} from './package-prep.js'

describe('canStagePackagePath', () => {
  const packageDir = '/repo/packages/reference-rs'

  it('prunes cargo build outputs so staging never sweeps tens of GB', () => {
    // Regression guard for the 77G `.pipeline/registry/staging`: the whole
    // package dir used to be copied, dragging `dist/cargo` (debug) along.
    for (const excluded of [
      '/repo/packages/reference-rs/target',
      '/repo/packages/reference-rs/target/debug/deps',
      '/repo/packages/reference-rs/dist/cargo',
      '/repo/packages/reference-rs/dist/cargo/debug/incremental',
    ]) {
      assert.equal(canStagePackagePath(packageDir, excluded), false, `expected to prune ${excluded}`)
    }
  })

  it('prunes tooling scratch dirs at the package root', () => {
    for (const excluded of [
      '/repo/packages/reference-rs/coverage',
      '/repo/packages/reference-rs/coverage/lcov.info',
      '/repo/packages/reference-rs/.turbo',
      '/repo/packages/reference-rs/.turbo/cache',
    ]) {
      assert.equal(canStagePackagePath(packageDir, excluded), false, `expected to prune ${excluded}`)
    }
  })

  it('prunes vcs and dependency dirs anywhere in the tree', () => {
    for (const excluded of [
      '/repo/packages/reference-rs/.git',
      '/repo/packages/reference-rs/node_modules',
      '/repo/packages/reference-rs/dist/native/node_modules',
    ]) {
      assert.equal(canStagePackagePath(packageDir, excluded), false, `expected to prune ${excluded}`)
    }
  })

  it('keeps the publishable artifact tree', () => {
    for (const kept of [
      '/repo/packages/reference-rs/package.json',
      '/repo/packages/reference-rs/README.md',
      '/repo/packages/reference-rs/dist/native/reference-native.darwin-x64.node',
      '/repo/packages/reference-rs/dist/npm/linux-x64-gnu/package.json',
      '/repo/packages/reference-rs/dist/index.mjs',
    ]) {
      assert.equal(canStagePackagePath(packageDir, kept), true, `expected to keep ${kept}`)
    }
  })
})

describe('resolveWorkspaceProtocolVersion', () => {
  it('rewrites workspace:* to the concrete workspace version', () => {
    const versions = new Map([['@reference-ui/core', '0.0.16']])

    assert.equal(resolveWorkspaceProtocolVersion('@reference-ui/core', 'workspace:*', versions), '0.0.16')
  })

  it('preserves workspace range prefixes when pnpm would publish them that way', () => {
    const versions = new Map([['@reference-ui/core', '0.0.16']])

    assert.equal(resolveWorkspaceProtocolVersion('@reference-ui/core', 'workspace:^', versions), '^0.0.16')
    assert.equal(resolveWorkspaceProtocolVersion('@reference-ui/core', 'workspace:~', versions), '~0.0.16')
  })

  it('passes through non-workspace dependency specs unchanged', () => {
    const versions = new Map([['@reference-ui/core', '0.0.16']])

    assert.equal(resolveWorkspaceProtocolVersion('@reference-ui/core', '^0.0.15', versions), '^0.0.15')
  })
})

describe('preparePackageJsonForLocalRegistry', () => {
  const fixturePackage: WorkspacePackage = {
    dependencies: {},
    dir: '/tmp/fixture',
    name: '@fixtures/extend-library',
    packageJson: {},
    private: true,
    scripts: {},
    version: '0.0.0',
  }

  it('removes private and rewrites workspace protocol specs across dependency buckets', () => {
    const workspacePackageVersions = new Map([
      ['@reference-ui/core', '0.0.16'],
      ['@reference-ui/icons', '0.0.16'],
      ['@reference-ui/lib', '0.0.19'],
    ])

    const prepared = preparePackageJsonForLocalRegistry(
      fixturePackage,
      {
        dependencies: {
          '@reference-ui/core': 'workspace:*',
        },
        devDependencies: {
          '@reference-ui/lib': 'workspace:^',
        },
        optionalDependencies: {
          '@reference-ui/icons': 'workspace:~',
        },
        peerDependencies: {
          react: '>=18',
        },
        private: true,
      },
      workspacePackageVersions,
    )

    assert.equal(prepared.private, undefined)
    assert.deepEqual(prepared.dependencies, {
      '@reference-ui/core': '0.0.16',
    })
    assert.deepEqual(prepared.devDependencies, {
      '@reference-ui/lib': '^0.0.19',
    })
    assert.deepEqual(prepared.optionalDependencies, {
      '@reference-ui/icons': '~0.0.16',
    })
    assert.deepEqual(prepared.peerDependencies, {
      react: '>=18',
    })
  })

  it('collects declared packaged paths from files, main, types, and exports', () => {
    assert.deepEqual(
      collectDeclaredPackagedPaths({
        exports: {
          '.': {
            import: './dist/index.mjs',
            types: './dist/index.d.ts',
          },
          './theme': './dist/theme/index.mjs',
        },
        files: ['dist', 'README.md'],
        main: './dist/index.mjs',
        types: './dist/index.d.ts',
      }),
      ['dist', 'dist/index.d.ts', 'dist/index.mjs', 'dist/theme/index.mjs', 'README.md'],
    )
  })

  it('copies declared packaged outputs into the prepared directory when the initial staged copy missed them', async () => {
    const root = await mkdtemp(resolve(tmpdir(), 'reference-ui-package-prep-'))
    const sourceDir = resolve(root, 'source')
    const preparedDir = resolve(root, 'prepared')

    try {
      await mkdir(resolve(sourceDir, 'dist'), { recursive: true })
      await mkdir(preparedDir, { recursive: true })
      await writeFile(resolve(sourceDir, 'dist', 'index.mjs'), 'export const value = 1\n')
      await writeFile(resolve(sourceDir, 'dist', 'index.d.ts'), 'export declare const value: number\n')

      await ensurePreparedPackageIncludesDeclaredOutputs(sourceDir, preparedDir, {
        exports: {
          '.': {
            import: './dist/index.mjs',
            types: './dist/index.d.ts',
          },
        },
        files: ['dist'],
        main: './dist/index.mjs',
        types: './dist/index.d.ts',
      })

      assert.equal(existsSync(resolve(preparedDir, 'dist')), true)
      assert.equal(existsSync(resolve(preparedDir, 'dist', 'index.mjs')), true)
      assert.equal(existsSync(resolve(preparedDir, 'dist', 'index.d.ts')), true)
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })
})
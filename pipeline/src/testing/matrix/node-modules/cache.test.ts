import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { registryManifestVersion, type RegistryManifest } from '../../../registry/types.js'
import {
  externalPnpmStoreCacheKey,
  matrixNodeModulesCacheKey,
  replaceWorkspaceProtocolVersions,
} from './cache.js'
import type { MatrixFixturePackageJson } from '../managed/package-json/index.js'

function createManifest(overrides?: Partial<RegistryManifest>): RegistryManifest {
  return {
    generatedAt: '2026-04-27T18:00:00.000Z',
    packages: [
      {
        artifactHash: 'core-artifact-a',
        hash: 'core-hash-a',
        internalDependencies: [],
        name: '@reference-ui/core',
        sourceDir: '/tmp/core',
        tarballFileName: 'reference-ui-core-0.0.41.tgz',
        tarballPath: '/tmp/core.tgz',
        version: '0.0.41',
      },
      {
        artifactHash: 'lib-artifact-a',
        hash: 'lib-hash-a',
        internalDependencies: ['@reference-ui/core'],
        name: '@reference-ui/lib',
        sourceDir: '/tmp/lib',
        tarballFileName: 'reference-ui-lib-0.0.44.tgz',
        tarballPath: '/tmp/lib.tgz',
        version: '0.0.44',
      },
    ],
    registry: {
      defaultUrl: 'http://127.0.0.1:4873',
      kind: 'npm-compatible',
    },
    version: registryManifestVersion,
    ...overrides,
  }
}

function createFixturePackageJson(overrides?: Partial<MatrixFixturePackageJson>): MatrixFixturePackageJson {
  return {
    dependencies: {
      '@reference-ui/core': 'workspace:*',
      '@reference-ui/lib': 'workspace:*',
      react: '^19.2.0',
    },
    devDependencies: {
      '@types/react': '^19.2.2',
      typescript: '~5.9.3',
      vitest: '^4.0.18',
    },
    name: '@matrix/distro',
    private: true,
    type: 'module',
    ...overrides,
  }
}

describe('matrix node_modules cache helpers', () => {
  it('rewrites workspace protocol dependencies for the install graph', () => {
    assert.deepEqual(
      replaceWorkspaceProtocolVersions({
        dependencies: {
          '@reference-ui/core': 'workspace:*',
          '@reference-ui/lib': 'workspace:^',
          react: '^19.2.0',
        },
        versionOverrides: {
          '@reference-ui/core': '0.0.41',
          '@reference-ui/lib': '0.0.44',
        },
      }),
      {
        '@reference-ui/core': '0.0.41',
        '@reference-ui/lib': '0.0.44',
        react: '^19.2.0',
      },
    )
  })

  it('keeps the external pnpm store cache stable when staged tarball hashes change', () => {
    const baseline = createManifest()
    const changed = createManifest({
      packages: baseline.packages.map(pkg =>
        pkg.name === '@reference-ui/lib'
          ? { ...pkg, artifactHash: 'lib-artifact-b', hash: 'lib-hash-a' }
          : pkg,
      ),
    })

    assert.equal(externalPnpmStoreCacheKey(), externalPnpmStoreCacheKey())
    assert.equal(
      externalPnpmStoreCacheKey('node:24-bookworm'),
      externalPnpmStoreCacheKey('node:24-bookworm'),
    )

    const baselineNodeModules = matrixNodeModulesCacheKey({
      coreVersion: '0.0.41',
      fixturePackageJson: createFixturePackageJson(),
      libVersion: '0.0.44',
      manifest: baseline,
    })

    const changedNodeModules = matrixNodeModulesCacheKey({
      coreVersion: '0.0.41',
      fixturePackageJson: createFixturePackageJson(),
      libVersion: '0.0.44',
      manifest: changed,
    })

    assert.notEqual(baselineNodeModules, changedNodeModules)
  })

  it('splits node_modules cache keys when the registry artifact changes without a source hash change', () => {
    const baseline = createManifest()
    const changed = createManifest({
      packages: baseline.packages.map(pkg =>
        pkg.name === '@reference-ui/lib'
          ? { ...pkg, artifactHash: 'lib-artifact-b' }
          : pkg,
      ),
    })

    const baselineNodeModules = matrixNodeModulesCacheKey({
      coreVersion: '0.0.41',
      fixturePackageJson: createFixturePackageJson(),
      libVersion: '0.0.44',
      manifest: baseline,
    })

    const changedNodeModules = matrixNodeModulesCacheKey({
      coreVersion: '0.0.41',
      fixturePackageJson: createFixturePackageJson(),
      libVersion: '0.0.44',
      manifest: changed,
    })

    assert.notEqual(baselineNodeModules, changedNodeModules)
  })

  it('reuses node_modules cache keys for identical install graphs', () => {
    const manifest = createManifest()
    const fixturePackageJson = createFixturePackageJson()

    const left = matrixNodeModulesCacheKey({
      coreVersion: '0.0.41',
      fixturePackageJson,
      libVersion: '0.0.44',
      manifest,
    })
    const right = matrixNodeModulesCacheKey({
      coreVersion: '0.0.41',
      fixturePackageJson: createFixturePackageJson(),
      libVersion: '0.0.44',
      manifest: createManifest(),
    })

    assert.equal(left, right)
  })

  it('splits node_modules cache keys for different fixtures with the same install graph', () => {
    const manifest = createManifest()

    const left = matrixNodeModulesCacheKey({
      coreVersion: '0.0.41',
      fixturePackageJson: createFixturePackageJson({ name: '@matrix/distro' }),
      libVersion: '0.0.44',
      manifest,
    })

    const right = matrixNodeModulesCacheKey({
      coreVersion: '0.0.41',
      fixturePackageJson: createFixturePackageJson({ name: '@matrix/playwright' }),
      libVersion: '0.0.44',
      manifest,
    })

    assert.notEqual(left, right)
  })

  it('splits node_modules cache keys when the matrix dependency graph changes', () => {
    const manifest = createManifest()
    const baseline = matrixNodeModulesCacheKey({
      coreVersion: '0.0.41',
      fixturePackageJson: createFixturePackageJson(),
      libVersion: '0.0.44',
      manifest,
    })

    const differentDevDependency = matrixNodeModulesCacheKey({
      coreVersion: '0.0.41',
      fixturePackageJson: createFixturePackageJson({
        devDependencies: {
          '@modelcontextprotocol/sdk': '^1.29.0',
          '@types/react': '^19.2.2',
          typescript: '~5.9.3',
          vitest: '^4.0.18',
        },
      }),
      libVersion: '0.0.44',
      manifest,
    })

    const differentPublishedVersion = matrixNodeModulesCacheKey({
      coreVersion: '0.0.42',
      fixturePackageJson: createFixturePackageJson(),
      libVersion: '0.0.44',
      manifest,
    })

    assert.notEqual(baseline, differentDevDependency)
    assert.notEqual(baseline, differentPublishedVersion)
  })

  it('splits node_modules cache keys when the container image changes', () => {
    const manifest = createManifest()
    const fixturePackageJson = createFixturePackageJson({
      devDependencies: {
        '@playwright/test': '1.48.0',
        '@types/react': '^19.2.2',
        typescript: '~5.9.3',
        vitest: '^4.0.18',
      },
    })

    const nodeImage = matrixNodeModulesCacheKey({
      containerImage: 'node:24-bookworm',
      coreVersion: '0.0.41',
      fixturePackageJson,
      libVersion: '0.0.44',
      manifest,
    })

    const playwrightImage = matrixNodeModulesCacheKey({
      containerImage: 'mcr.microsoft.com/playwright:v1.48.0-jammy',
      coreVersion: '0.0.41',
      fixturePackageJson,
      libVersion: '0.0.44',
      manifest,
    })

    assert.notEqual(nodeImage, playwrightImage)
  })
})
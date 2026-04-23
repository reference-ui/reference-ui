import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { RegistryManifestPackage } from '../registry/types.js'
import {
  isReleaseManifestPackage,
  publishArgsForTarball,
  shouldPublishWithProvenance,
  sortReleaseManifestPackages,
} from './publish.js'

function manifestPackage(overrides: Partial<RegistryManifestPackage> & Pick<RegistryManifestPackage, 'name' | 'sourceDir' | 'tarballFileName' | 'tarballPath' | 'version'>): RegistryManifestPackage {
  return {
    hash: 'hash',
    internalDependencies: [],
    ...overrides,
  }
}

describe('isReleaseManifestPackage', () => {
  it('includes direct release packages and generated rust target packages', () => {
    assert.equal(
      isReleaseManifestPackage(
        manifestPackage({
          name: '@reference-ui/core',
          sourceDir: 'packages/reference-core',
          tarballFileName: 'core.tgz',
          tarballPath: '.pipeline/registry/tarballs/core.tgz',
          version: '0.0.22',
        }),
      ),
      true,
    )

    assert.equal(
      isReleaseManifestPackage(
        manifestPackage({
          name: '@reference-ui/rust-darwin-arm64',
          sourceDir: 'packages/reference-rs/npm/darwin-arm64',
          tarballFileName: 'rust-darwin-arm64.tgz',
          tarballPath: '.pipeline/registry/tarballs/rust-darwin-arm64.tgz',
          version: '0.0.22',
        }),
      ),
      true,
    )
  })

  it('excludes fixture-only registry packages', () => {
    assert.equal(
      isReleaseManifestPackage(
        manifestPackage({
          name: '@fixtures/extend-library',
          sourceDir: 'fixtures/extend-library',
          tarballFileName: 'extend-library.tgz',
          tarballPath: '.pipeline/registry/tarballs/extend-library.tgz',
          version: '0.0.0',
        }),
      ),
      false,
    )
  })
})

describe('sortReleaseManifestPackages', () => {
  it('publishes generated rust target packages before the root release packages', () => {
    const sorted = sortReleaseManifestPackages([
      manifestPackage({
        internalDependencies: [],
        name: '@reference-ui/rust',
        sourceDir: 'packages/reference-rs',
        tarballFileName: 'rust.tgz',
        tarballPath: '.pipeline/registry/tarballs/rust.tgz',
        version: '0.0.22',
      }),
      manifestPackage({
        internalDependencies: ['@reference-ui/core', '@reference-ui/icons'],
        name: '@reference-ui/lib',
        sourceDir: 'packages/reference-lib',
        tarballFileName: 'lib.tgz',
        tarballPath: '.pipeline/registry/tarballs/lib.tgz',
        version: '0.0.25',
      }),
      manifestPackage({
        internalDependencies: [],
        name: '@reference-ui/rust-darwin-arm64',
        sourceDir: 'packages/reference-rs/npm/darwin-arm64',
        tarballFileName: 'rust-darwin-arm64.tgz',
        tarballPath: '.pipeline/registry/tarballs/rust-darwin-arm64.tgz',
        version: '0.0.22',
      }),
      manifestPackage({
        internalDependencies: ['@reference-ui/rust'],
        name: '@reference-ui/core',
        sourceDir: 'packages/reference-core',
        tarballFileName: 'core.tgz',
        tarballPath: '.pipeline/registry/tarballs/core.tgz',
        version: '0.0.22',
      }),
      manifestPackage({
        internalDependencies: ['@reference-ui/core'],
        name: '@reference-ui/icons',
        sourceDir: 'packages/reference-icons',
        tarballFileName: 'icons.tgz',
        tarballPath: '.pipeline/registry/tarballs/icons.tgz',
        version: '0.0.22',
      }),
    ])

    assert.deepEqual(
      sorted.map((pkg) => pkg.name),
      [
        '@reference-ui/rust-darwin-arm64',
        '@reference-ui/rust',
        '@reference-ui/core',
        '@reference-ui/icons',
        '@reference-ui/lib',
      ],
    )
  })
})

describe('shouldPublishWithProvenance', () => {
  it('defaults to false for local release environments', () => {
    assert.equal(shouldPublishWithProvenance({}), false)
  })

  it('enables provenance when explicit env flags are set', () => {
    assert.equal(shouldPublishWithProvenance({ NPM_CONFIG_PROVENANCE: 'true' }), true)
    assert.equal(shouldPublishWithProvenance({ REF_RELEASE_PROVENANCE: '1' }), true)
  })
})

describe('publishArgsForTarball', () => {
  it('omits provenance by default', () => {
    assert.deepEqual(
      publishArgsForTarball('/tmp/pkg.tgz', 'https://registry.npmjs.org', false),
      [
        'publish',
        '/tmp/pkg.tgz',
        '--registry',
        'https://registry.npmjs.org',
        '--access',
        'public',
      ],
    )
  })

  it('includes provenance when requested', () => {
    assert.deepEqual(
      publishArgsForTarball('/tmp/pkg.tgz', 'https://registry.npmjs.org', true),
      [
        'publish',
        '/tmp/pkg.tgz',
        '--registry',
        'https://registry.npmjs.org',
        '--access',
        'public',
        '--provenance',
      ],
    )
  })
})
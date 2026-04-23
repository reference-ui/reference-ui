import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  createReferenceRustPackageJsonOverride,
  getReferenceRustTargetPackageValidationErrors,
  resolveReferenceRustTargetTarballStrategy,
  shouldBuildLinuxReferenceRustTargetWithDagger,
} from './targets.js'

describe('createReferenceRustPackageJsonOverride', () => {
  it('returns undefined when there are no target packages', () => {
    assert.equal(createReferenceRustPackageJsonOverride([]), undefined)
  })

  it('maps target packages into optionalDependencies', () => {
    assert.deepEqual(
      createReferenceRustPackageJsonOverride([
        {
          name: '@reference-ui/rust-darwin-arm64',
          version: '0.0.15',
        },
        {
          name: '@reference-ui/rust-linux-x64-gnu',
          version: '0.0.15',
        },
      ]),
      {
        optionalDependencies: {
          '@reference-ui/rust-darwin-arm64': '0.0.15',
          '@reference-ui/rust-linux-x64-gnu': '0.0.15',
        },
      },
    )
  })
})

describe('resolveReferenceRustTargetTarballStrategy', () => {
  it('packs local binaries even when a cached tarball exists', () => {
    assert.equal(
      resolveReferenceRustTargetTarballStrategy({
        hasLocalBinary: true,
        publishedOnNpm: true,
        tarballExists: true,
      }),
      'pack-local-binary',
    )
  })

  it('reuses a cached tarball when there is no local binary', () => {
    assert.equal(
      resolveReferenceRustTargetTarballStrategy({
        hasLocalBinary: false,
        publishedOnNpm: true,
        tarballExists: true,
      }),
      'reuse-cached-tarball',
    )
  })

  it('fetches from npm when no cache exists and the target is published', () => {
    assert.equal(
      resolveReferenceRustTargetTarballStrategy({
        hasLocalBinary: false,
        publishedOnNpm: true,
        tarballExists: false,
      }),
      'fetch-published-tarball',
    )
  })

  it('skips the target when no binary, cache, or published package is available', () => {
    assert.equal(
      resolveReferenceRustTargetTarballStrategy({
        hasLocalBinary: false,
        publishedOnNpm: false,
        tarballExists: false,
      }),
      'skip-target',
    )
  })
})

describe('getReferenceRustTargetPackageValidationErrors', () => {
  it('accepts a complete set of target packages aligned to the root version', () => {
    assert.deepEqual(
      getReferenceRustTargetPackageValidationErrors({
        rootVersion: '0.0.21',
        targetPackages: [
          { name: '@reference-ui/rust-darwin-arm64', version: '0.0.21' },
          { name: '@reference-ui/rust-darwin-x64', version: '0.0.21' },
          { name: '@reference-ui/rust-linux-x64-gnu', version: '0.0.21' },
          { name: '@reference-ui/rust-win32-x64-msvc', version: '0.0.21' },
        ],
      }),
      [],
    )
  })

  it('reports missing and mismatched target packages against the root version', () => {
    assert.deepEqual(
      getReferenceRustTargetPackageValidationErrors({
        rootVersion: '0.0.21',
        targetPackages: [
          { name: '@reference-ui/rust-darwin-arm64', version: '0.0.21' },
          { name: '@reference-ui/rust-darwin-x64', version: '0.0.20' },
          { name: '@reference-ui/rust-win32-x64-msvc', version: '0.0.21' },
        ],
      }),
      [
        'Generated native package @reference-ui/rust-darwin-x64@0.0.20 does not match @reference-ui/rust@0.0.21.',
        'Missing generated native package @reference-ui/rust-linux-x64-gnu@0.0.21.',
      ],
    )
  })
})

describe('shouldBuildLinuxReferenceRustTargetWithDagger', () => {
  it('returns true when linux is required and no local or published linux package is available', () => {
    assert.equal(
      shouldBuildLinuxReferenceRustTargetWithDagger({
        publishedOnNpm: false,
        requiredTargets: ['linux-x64-gnu'],
        targetPackage: {
          hasLocalBinary: false,
          name: '@reference-ui/rust-linux-x64-gnu',
        },
      }),
      true,
    )
  })

  it('returns false when linux is not required', () => {
    assert.equal(
      shouldBuildLinuxReferenceRustTargetWithDagger({
        publishedOnNpm: false,
        requiredTargets: ['darwin-x64'],
        targetPackage: {
          hasLocalBinary: false,
          name: '@reference-ui/rust-linux-x64-gnu',
        },
      }),
      false,
    )
  })

  it('returns false when the linux target already has a local binary or published package', () => {
    assert.equal(
      shouldBuildLinuxReferenceRustTargetWithDagger({
        publishedOnNpm: false,
        requiredTargets: ['linux-x64-gnu'],
        targetPackage: {
          hasLocalBinary: true,
          name: '@reference-ui/rust-linux-x64-gnu',
        },
      }),
      false,
    )

    assert.equal(
      shouldBuildLinuxReferenceRustTargetWithDagger({
        publishedOnNpm: true,
        requiredTargets: ['linux-x64-gnu'],
        targetPackage: {
          hasLocalBinary: false,
          name: '@reference-ui/rust-linux-x64-gnu',
        },
      }),
      false,
    )
  })
})
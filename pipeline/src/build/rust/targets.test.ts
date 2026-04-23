import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  createReferenceRustPackageJsonOverride,
  resolveReferenceRustTargetTarballStrategy,
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
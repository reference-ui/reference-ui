import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  createReferenceRustPackageJsonOverride,
  getReferenceRustTargetPackageValidationErrors,
} from './package-metadata.js'

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

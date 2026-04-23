import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { applyPreparedRustPackageHash } from './registry-overrides.js'

describe('applyPreparedRustPackageHash', () => {
  it('returns the original hash when no augmentation exists', () => {
    assert.equal(
      applyPreparedRustPackageHash('@reference-ui/rust', 'base-hash', {
        generatedPackages: [],
        packageHashAugmentations: {},
        preparedPackageJsonOverrides: {},
      }),
      'base-hash',
    )
  })

  it('returns a stable derived hash when an augmentation exists', () => {
    const first = applyPreparedRustPackageHash('@reference-ui/rust', 'base-hash', {
      generatedPackages: [],
      packageHashAugmentations: {
        '@reference-ui/rust': 'generated-targets-hash',
      },
      preparedPackageJsonOverrides: {},
    })
    const second = applyPreparedRustPackageHash('@reference-ui/rust', 'base-hash', {
      generatedPackages: [],
      packageHashAugmentations: {
        '@reference-ui/rust': 'generated-targets-hash',
      },
      preparedPackageJsonOverrides: {},
    })

    assert.notEqual(first, 'base-hash')
    assert.equal(first, second)
  })
})
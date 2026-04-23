import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createRustBuildHashAugmentation } from './state.js'

describe('createRustBuildHashAugmentation', () => {
  it('returns null when there are no generated packages or overrides', () => {
    assert.equal(createRustBuildHashAugmentation([], undefined), null)
  })

  it('returns a stable hash when generated packages are present', () => {
    const first = createRustBuildHashAugmentation(
      [
        {
          hash: 'linux-hash',
          name: '@reference-ui/rust-linux-x64-gnu',
          version: '0.0.15',
        },
      ],
      {
        optionalDependencies: {
          '@reference-ui/rust-linux-x64-gnu': '0.0.15',
        },
      },
    )
    const second = createRustBuildHashAugmentation(
      [
        {
          hash: 'linux-hash',
          name: '@reference-ui/rust-linux-x64-gnu',
          version: '0.0.15',
        },
      ],
      {
        optionalDependencies: {
          '@reference-ui/rust-linux-x64-gnu': '0.0.15',
        },
      },
    )

    assert.ok(first)
    assert.equal(first, second)
  })
})
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { canSkipRegistryPublishFromState } from './load.js'

describe('canSkipRegistryPublishFromState', () => {
  const pkg = {
    artifactHash: 'artifact-abc123',
    hash: 'abc123',
    name: '@reference-ui/core',
    version: '0.0.41',
  }

  it('skips when the managed loaded state matches the current manifest entry', () => {
    assert.equal(
      canSkipRegistryPublishFromState(
        pkg,
        {
          artifactHash: 'artifact-abc123',
          hash: 'abc123',
          loadedAt: '2026-04-27T00:00:00.000Z',
          version: '0.0.41',
        },
        false,
      ),
      true,
    )
  })

  it('does not skip when the registry was rebuilt', () => {
    assert.equal(
      canSkipRegistryPublishFromState(
        pkg,
        {
          artifactHash: 'artifact-abc123',
          hash: 'abc123',
          loadedAt: '2026-04-27T00:00:00.000Z',
          version: '0.0.41',
        },
        true,
      ),
      false,
    )
  })

  it('does not skip when the stored version or hash differs', () => {
    assert.equal(
      canSkipRegistryPublishFromState(
        pkg,
        {
          artifactHash: 'different-artifact',
          hash: 'different',
          loadedAt: '2026-04-27T00:00:00.000Z',
          version: '0.0.41',
        },
        false,
      ),
      false,
    )

    assert.equal(
      canSkipRegistryPublishFromState(
        pkg,
        {
          artifactHash: 'artifact-abc123',
          hash: 'abc123',
          loadedAt: '2026-04-27T00:00:00.000Z',
          version: '0.0.40',
        },
        false,
      ),
      false,
    )
  })

  it('does not skip when the artifact hash differs even if the source hash matches', () => {
    assert.equal(
      canSkipRegistryPublishFromState(
        pkg,
        {
          artifactHash: 'artifact-different',
          hash: 'abc123',
          loadedAt: '2026-04-27T00:00:00.000Z',
          version: '0.0.41',
        },
        false,
      ),
      false,
    )
  })
})
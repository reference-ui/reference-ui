/**
 * Proof for library host-id minting. Pins the `ref-lib-` prefix and
 * never minting the same id twice across mounts.
 */
import { describe, expect, it } from 'vitest'
import { nextLibraryHostId } from './ids'

describe('library host ids', () => {
  it('mints ref-lib prefixed ids', () => {
    expect(nextLibraryHostId()).toMatch(/^ref-lib-\d+$/)
  })

  it('never mints the same id twice', () => {
    const ids = new Set([nextLibraryHostId(), nextLibraryHostId(), nextLibraryHostId()])
    expect(ids.size).toBe(3)
  })
})

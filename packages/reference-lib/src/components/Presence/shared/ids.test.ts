import { describe, expect, it } from 'vitest'
import { nextPresenceId } from './ids'

/** Unit proof for `shared/ids`: unique monotonic instance ids. */

describe('nextPresenceId', () => {
  it('mints unique presence ids', () => {
    const a = nextPresenceId()
    const b = nextPresenceId()
    expect(a).toMatch(/^presence-\d+$/)
    expect(b).toMatch(/^presence-\d+$/)
    expect(a).not.toBe(b)
  })
})

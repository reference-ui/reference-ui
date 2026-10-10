/** Isolation proof for nextPopoverContentId: unique popover-content-N tokens. */
import { describe, expect, it } from 'vitest'
import { nextPopoverContentId } from './ids'

describe('popover content ids', () => {
  it('hands out unique popover-content-N tokens', () => {
    const first = nextPopoverContentId()
    const second = nextPopoverContentId()
    expect(first).toMatch(/^popover-content-\d+$/)
    expect(second).toMatch(/^popover-content-\d+$/)
    expect(second).not.toBe(first)
  })
})

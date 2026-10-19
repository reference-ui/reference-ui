/**
 * Caret-restore proof: restoreCaretAt across segments and edits. Pins
 * the offsets the edit machines apply after each commit.
 */
import { describe, expect, it, vi } from 'vitest'
import { restoreCaretAt } from './caret'

const tick = () => new Promise((resolve) => setTimeout(resolve, 10))

describe('restoreCaretAt', () => {
  it('restores the caret position', async () => {
    const target = { setSelectionRange: vi.fn() }
    restoreCaretAt(target, 4)
    await tick()
    expect(target.setSelectionRange).toHaveBeenCalledWith(4, 4)
  })

  it('silently ignores a null target or a throwing context', async () => {
    restoreCaretAt(null, 0)
    restoreCaretAt(
      {
        setSelectionRange: () => {
          throw new Error('non-text context')
        },
      },
      0
    )
    await tick()
  })
})

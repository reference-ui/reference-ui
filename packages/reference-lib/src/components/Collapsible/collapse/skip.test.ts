/** Collapse-skip proof: armed skips, instant hidden shut, force-mount bypass. */
import { describe, expect, it } from 'vitest'
import { resolveCollapseSkip } from './skip'

describe('resolveCollapseSkip', () => {
  it('tweens a plain open and a plain close', () => {
    expect(
      resolveCollapseSkip({
        skipEnterArmed: false,
        skipOnceArmed: false,
        isOpen: true,
        untilFound: false,
        forceMountAlone: false,
      })
    ).toEqual({ animate: true, skip: false })
    expect(
      resolveCollapseSkip({
        skipEnterArmed: false,
        skipOnceArmed: false,
        isOpen: false,
        untilFound: false,
        forceMountAlone: false,
      })
    ).toEqual({ animate: true, skip: false })
  })

  it('skips the open reveal while an enter or beforematch skip is armed', () => {
    const open = { isOpen: true, untilFound: false, forceMountAlone: false } as const
    expect(resolveCollapseSkip({ ...open, skipEnterArmed: true, skipOnceArmed: false })).toEqual({
      animate: true,
      skip: true,
    })
    expect(resolveCollapseSkip({ ...open, skipEnterArmed: false, skipOnceArmed: true })).toEqual({
      animate: true,
      skip: true,
    })
  })

  it('shuts hidden-until-found content instantly but still tweens its open', () => {
    expect(
      resolveCollapseSkip({
        skipEnterArmed: false,
        skipOnceArmed: false,
        isOpen: false,
        untilFound: true,
        forceMountAlone: false,
      })
    ).toEqual({ animate: true, skip: true })
    expect(
      resolveCollapseSkip({
        skipEnterArmed: false,
        skipOnceArmed: false,
        isOpen: true,
        untilFound: true,
        forceMountAlone: false,
      })
    ).toEqual({ animate: true, skip: false })
  })

  it('never tweens force-mount-alone content, open or closed (CO-MOUNT)', () => {
    for (const isOpen of [true, false]) {
      expect(
        resolveCollapseSkip({
          skipEnterArmed: true,
          skipOnceArmed: true,
          isOpen,
          untilFound: false,
          forceMountAlone: true,
        })
      ).toEqual({ animate: false, skip: false })
    }
  })
})

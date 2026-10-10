/** Linkage proof: aria-controls across mount/exit, border collapse, style merge. */
import { describe, expect, it } from 'vitest'
import { resolveTriggerLinkage, resolveTriggerStyle } from './state'

describe('resolveTriggerLinkage', () => {
  it('links an open trigger to the mounted content id', () => {
    expect(
      resolveTriggerLinkage({
        isOpen: true,
        isContentPresent: true,
        isContentMounted: true,
        contentId: 'panel',
      })
    ).toEqual({ hideBottomBorder: true, ariaControls: 'panel' })
  })

  it('keeps the link through exit and drops it after unmount (CO-DOM-03)', () => {
    const exiting = resolveTriggerLinkage({
      isOpen: false,
      isContentPresent: true,
      isContentMounted: true,
      contentId: 'panel',
    })
    expect(exiting).toEqual({ hideBottomBorder: true, ariaControls: 'panel' })
    expect(
      resolveTriggerLinkage({
        isOpen: false,
        isContentPresent: false,
        isContentMounted: false,
        contentId: 'panel',
      })
    ).toEqual({ hideBottomBorder: false, ariaControls: undefined })
  })

  it('never dangles aria-controls when Content is absent (CO-DOM-09)', () => {
    expect(
      resolveTriggerLinkage({
        isOpen: true,
        isContentPresent: false,
        isContentMounted: false,
        contentId: 'panel',
      })
    ).toEqual({ hideBottomBorder: true, ariaControls: undefined })
  })
})

describe('resolveTriggerStyle', () => {
  it('kills the bottom border while content shows beneath the trigger', () => {
    expect(
      resolveTriggerStyle({
        hideBottomBorder: true,
        style: { color: 'red', borderBottomWidth: '2px' },
      })
    ).toEqual({ color: 'red', borderBottomWidth: 0, borderBottomStyle: 'none' })
  })

  it('passes author styles through untouched when closed or absent', () => {
    const style = { color: 'red' }
    expect(resolveTriggerStyle({ hideBottomBorder: false, style })).toBe(style)
    expect(resolveTriggerStyle({ hideBottomBorder: true, style: undefined })).toBeUndefined()
    expect(resolveTriggerStyle({ hideBottomBorder: false, style: undefined })).toBeUndefined()
  })
})

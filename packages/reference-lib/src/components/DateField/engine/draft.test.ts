import { describe, expect, it } from 'vitest'
import { resolveRangeDraft } from './draft'

const committed = { start: '2026-08-10', end: '2026-08-15' }

describe('resolveRangeDraft', () => {
  it('shows the committed range when clean', () => {
    expect(
      resolveRangeDraft({
        buffers: { start: '8/10/2026', end: '8/15/2026' },
        locale: 'en-US',
        value: committed,
        isDirty: false,
        failed: false,
      })
    ).toEqual({ canApply: true, calendarValue: committed })
  })

  it('shows the draft as a range when dirty, complete, and ordered', () => {
    expect(
      resolveRangeDraft({
        buffers: { start: '8/11/2026', end: '8/16/2026' },
        locale: 'en-US',
        value: committed,
        isDirty: true,
        failed: false,
      })
    ).toEqual({
      canApply: true,
      calendarValue: { start: '2026-08-11', end: '2026-08-16' },
    })
  })

  it('anchors a start-only draft and never an end-only draft', () => {
    expect(
      resolveRangeDraft({
        buffers: { start: '8/11/2026', end: '' },
        locale: 'en-US',
        value: committed,
        isDirty: true,
        failed: false,
      }).calendarValue
    ).toEqual({ start: '2026-08-11', end: null })
    expect(
      resolveRangeDraft({
        buffers: { start: '', end: '8/16/2026' },
        locale: 'en-US',
        value: committed,
        isDirty: true,
        failed: false,
      }).calendarValue
    ).toBeNull()
  })

  it('rejects inverted and out-of-constraints drafts', () => {
    const inverted = resolveRangeDraft({
      buffers: { start: '8/16/2026', end: '8/11/2026' },
      locale: 'en-US',
      value: committed,
      isDirty: true,
      failed: false,
    })
    expect(inverted).toEqual({ canApply: false, calendarValue: null })
    const constrained = resolveRangeDraft({
      buffers: { start: '8/11/2026', end: '8/16/2026' },
      locale: 'en-US',
      value: committed,
      min: '2026-08-12',
      isDirty: true,
      failed: false,
    })
    expect(constrained.canApply).toBe(false)
    expect(constrained.calendarValue).toEqual({ start: '2026-08-11', end: '2026-08-16' })
  })

  it('resolves the failed session as a draft, not the committed value', () => {
    expect(
      resolveRangeDraft({
        buffers: { start: '8/11/2026', end: '' },
        locale: 'en-US',
        value: committed,
        isDirty: false,
        failed: true,
      }).calendarValue
    ).toEqual({ start: '2026-08-11', end: null })
  })
})

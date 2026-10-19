/**
 * Proof for the tooltip warm-group config write. Pins configured skip
 * delays written into the document store, omission keeping the 300ms
 * default, zero honored as a real policy, and per-document independence.
 */
import { describe, expect, it } from 'vitest'
import { getTooltipGroupStore } from '../../Tooltip/tooltipGroup'
import { applyTooltipSkipDelay } from './tooltip-config'

describe('tooltip warm-group config', () => {
  it('writes a configured skip delay into the document group store', () => {
    const doc = {} as Document
    applyTooltipSkipDelay(doc, 600)
    expect(getTooltipGroupStore(doc).getState().skipDelay).toBe(600)
  })

  it('leaves the 300ms default alone when the delay is omitted', () => {
    const doc = {} as Document
    applyTooltipSkipDelay(doc, undefined)
    expect(getTooltipGroupStore(doc).getState().skipDelay).toBe(300)
  })

  it('honors zero as a real policy rather than an omission', () => {
    const doc = {} as Document
    applyTooltipSkipDelay(doc, 600)
    applyTooltipSkipDelay(doc, 0)
    expect(getTooltipGroupStore(doc).getState().skipDelay).toBe(0)
  })

  it('keeps each document warm-group independent', () => {
    const docA = {} as Document
    const docB = {} as Document
    applyTooltipSkipDelay(docA, 100)
    expect(getTooltipGroupStore(docA).getState().skipDelay).toBe(100)
    expect(getTooltipGroupStore(docB).getState().skipDelay).toBe(300)
  })
})

// @vitest-environment happy-dom
/** Isolated proof for typeahead/guard: plain printable keys pass while
 * modified, multi-character, IME-composing, and editable-targeted keys are
 * ignored. The guard cases moved here from the component suite so the
 * convergence seam every consumer shares is pinned in isolation. */

import { describe, expect, it } from 'vitest'
import { shouldIgnoreTypeaheadKey, type TypeaheadGuardEvent } from './guard'

describe('shouldIgnoreTypeaheadKey (FEATURES #7)', () => {
  function guardEvent(overrides: Partial<TypeaheadGuardEvent> = {}): TypeaheadGuardEvent {
    return {
      key: 'a',
      ctrlKey: false,
      altKey: false,
      metaKey: false,
      target: document.createElement('button'),
      nativeEvent: { isComposing: false },
      ...overrides,
    }
  }

  it('shouldIgnoreTypeaheadKey accepts a plain printable key', () => {
    expect(shouldIgnoreTypeaheadKey(guardEvent())).toBe(false)
  })

  it('shouldIgnoreTypeaheadKey ignores modified and multi-character keys', () => {
    expect(shouldIgnoreTypeaheadKey(guardEvent({ key: 'Enter' }))).toBe(true)
    expect(shouldIgnoreTypeaheadKey(guardEvent({ ctrlKey: true }))).toBe(true)
    expect(shouldIgnoreTypeaheadKey(guardEvent({ altKey: true }))).toBe(true)
    expect(shouldIgnoreTypeaheadKey(guardEvent({ metaKey: true }))).toBe(true)
  })

  it('shouldIgnoreTypeaheadKey ignores IME-composing keys (the Listbox live bug)', () => {
    expect(
      shouldIgnoreTypeaheadKey(guardEvent({ nativeEvent: { isComposing: true } }))
    ).toBe(true)
  })

  it('shouldIgnoreTypeaheadKey ignores keys from editable targets', () => {
    expect(shouldIgnoreTypeaheadKey(guardEvent({ target: document.createElement('input') }))).toBe(
      true
    )
    expect(
      shouldIgnoreTypeaheadKey(guardEvent({ target: document.createElement('textarea') }))
    ).toBe(true)
    const editable = document.createElement('div')
    editable.contentEditable = 'true'
    expect(shouldIgnoreTypeaheadKey(guardEvent({ target: editable }))).toBe(true)
  })
})

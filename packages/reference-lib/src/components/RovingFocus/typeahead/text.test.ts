// @vitest-environment happy-dom
/** Isolated proof for typeahead/text: searchable-label derivation prefers
 * explicit textValue, then child aria-label, then rendered text — excluding
 * aria-hidden subtrees and collapsing irregular whitespace. Proves the
 * RF-TYPE-09 priority and RF-TYPE-12 normalization against bare nodes. */

import * as React from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import type { ItemEntry } from '../types'
import { getItemSearchText } from './text'

function entry(node: HTMLElement | null, textValue?: string): ItemEntry {
  return { id: 'x', ref: { current: node } as React.RefObject<HTMLElement | null>, disabled: false, textValue }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('getItemSearchText (RF-TYPE-09)', () => {
  it('prefers explicit textValue over aria-label and rendered text', () => {
    const el = document.createElement('button')
    el.setAttribute('aria-label', 'Labeled')
    el.textContent = 'Rendered'
    expect(getItemSearchText(entry(el, '  Explicit  '))).toBe('Explicit')
  })

  it('falls back to child aria-label when no textValue wins', () => {
    const el = document.createElement('button')
    el.setAttribute('aria-label', '  Labeled  ')
    el.textContent = 'Rendered'
    expect(getItemSearchText(entry(el))).toBe('Labeled')
    expect(getItemSearchText(entry(el, ''))).toBe('Labeled')
  })

  it('falls back to rendered text when neither textValue nor aria-label wins', () => {
    const el = document.createElement('button')
    el.textContent = 'Rendered'
    expect(getItemSearchText(entry(el))).toBe('Rendered')
  })

  it('returns empty text when no source resolves', () => {
    expect(getItemSearchText(entry(null))).toBe('')
    const el = document.createElement('button')
    expect(getItemSearchText(entry(el))).toBe('')
  })
})

describe('getItemSearchText decoration handling (RF-TYPE-12)', () => {
  it('excludes aria-hidden and hidden subtrees from the match string', () => {
    const el = document.createElement('button')
    el.innerHTML = '<span aria-hidden="true">star</span>Save<span hidden>secret</span>'
    expect(getItemSearchText(entry(el))).toBe('Save')
  })

  it('collapses irregular whitespace to single spaces', () => {
    const el = document.createElement('button')
    el.innerHTML = 'Blue\n\t  Berry  <b>Pie</b>'
    expect(getItemSearchText(entry(el))).toBe('Blue Berry Pie')
  })
})

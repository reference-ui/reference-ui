import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { RovingFocus, TypeaheadModel } from './RovingFocus'

describe('RovingFocus Unit Tests', () => {
  it('RF-TYPE-02: RovingFocus should choose the next case-insensitive prefix match when typeahead receives one printable character', () => {
    const model = new TypeaheadModel()
    const items = [
      { id: 'item-1', text: 'apple' },
      { id: 'item-2', text: 'Banana' },
      { id: 'item-3', text: 'Cherry' },
      { id: 'item-4', text: 'Avocado' },
    ]

    // Seed current item as Banana (item-2)
    const match = model.handleKey('A', 'item-2', items)
    // Next matching item after Banana is Avocado (item-4)
    expect(match).toBe('item-4')

    // From Avocado (item-4), entering A wraps once to apple (item-1)
    const wrapMatch = model.handleKey('A', 'item-4', items)
    expect(wrapMatch).toBe('item-1')
  })

  it('RF-TYPE-03: RovingFocus should build a multi-character prefix when different printable keys arrive consecutively', () => {
    const model = new TypeaheadModel()
    const items = [
      { id: 'item-apple', text: 'Apple' },
      { id: 'item-banana', text: 'Banana' },
      { id: 'item-blueberry', text: 'Blueberry' },
      { id: 'item-cherry', text: 'Cherry' },
    ]

    // Enter 'b'
    const res1 = model.handleKey('b', 'item-apple', items)
    expect(model.getBuffer()).toBe('b')
    expect(res1).toBe('item-banana')

    // Enter 'l' consecutively -> buffer is 'bl'
    const res2 = model.handleKey('l', res1, items)
    expect(model.getBuffer()).toBe('bl')
    expect(res2).toBe('item-blueberry')

    // Enter 'z' -> 'blz' matches nothing, preserves prior item
    const res3 = model.handleKey('z', res2, items)
    expect(model.getBuffer()).toBe('blz')
    expect(res3).toBe('item-blueberry')
  })

  it('RF-TYPE-04: RovingFocus should cycle same-letter matches when one printable character repeats within the buffer window', () => {
    const model = new TypeaheadModel()
    const items = [
      { id: 'item-a1', text: 'Apricot' },
      { id: 'item-a2', text: 'Apple' },
      { id: 'item-a3', text: 'Avocado' },
      { id: 'item-b1', text: 'Banana' },
    ]

    const r1 = model.handleKey('a', null, items)
    expect(r1).toBe('item-a1')

    // Repeating 'a' cycles to next match in collection order
    const r2 = model.handleKey('a', r1, items)
    expect(r2).toBe('item-a2')

    // Repeating 'a' again cycles to third match
    const r3 = model.handleKey('a', r2, items)
    expect(r3).toBe('item-a3')

    // Fourth repetition wraps to first match
    const r4 = model.handleKey('a', r3, items)
    expect(r4).toBe('item-a1')
  })

  it('RF-TYPE-05: RovingFocus should start a new search when one second of typeahead inactivity has elapsed', () => {
    vi.useFakeTimers()
    try {
      const model = new TypeaheadModel({ timeoutMs: 1000 })
      const items = [
        { id: 'item-apple', text: 'Apple' },
        { id: 'item-banana', text: 'Banana' },
        { id: 'item-cherry', text: 'Cherry' },
      ]

      const r1 = model.handleKey('b', 'item-apple', items)
      expect(r1).toBe('item-banana')
      expect(model.getBuffer()).toBe('b')

      // Advance beyond 1000ms idle timeout
      vi.advanceTimersByTime(1001)
      expect(model.getBuffer()).toBe('')

      // New key starts fresh query 'a' rather than 'ba'
      const r2 = model.handleKey('a', r1, items)
      expect(model.getBuffer()).toBe('a')
      expect(r2).toBe('item-apple')
    } finally {
      vi.useRealTimers()
    }
  })

  it('RF-TYPE-07: RovingFocus should match Unicode case and canonically equivalent diacritics when typeahead compares labels', () => {
    const model = new TypeaheadModel()
    const items = [
      { id: 'item-e1', text: 'Éclair' }, // precomposed U+00C9
      { id: 'item-e2', text: 'E\u0301tude' }, // decomposed E + combining acute
      { id: 'item-e3', text: 'English' },
    ]

    // Search lowercase 'é' against precomposed 'Éclair'
    const r1 = model.handleKey('é', null, items)
    expect(r1).toBe('item-e1')

    // Canonically equivalent diacritic comparison matches
    expect(model.isMatch('Éclair', 'e\u0301')).toBe(true)
    expect(model.isMatch('E\u0301tude', 'é')).toBe(true)

    // Distinct letters remain distinct: 'e' without accent does not match 'É'
    expect(model.isMatch('Éclair', 'e')).toBe(false)
  })

  it('RF-TYPE-08: RovingFocus should skip unavailable matches when typeahead searches the collection', () => {
    const model = new TypeaheadModel()
    const items = [
      { id: 'item-1', text: 'Apple', disabled: true },
      { id: 'item-2', text: 'Apricot', hidden: true },
      { id: 'item-3', text: 'Avocado', disabled: false, hidden: false },
    ]

    // Disabled and hidden items skipped; lands on enabled Avocado
    const r1 = model.handleKey('a', null, items)
    expect(r1).toBe('item-3')

    // Search query with no enabled visible match preserves current item
    const r2 = model.handleKey('z', r1, items)
    expect(r2).toBe('item-3')
  })

  it('RF-ENV-01: RovingFocus should hydrate the same sole tab stop when server and client collections match', () => {
    const html = renderToString(
      <RovingFocus.Root orientation="horizontal" loop>
        <div role="toolbar" data-testid="ssr-toolbar">
          <RovingFocus.Item disabled>
            <button type="button" disabled data-testid="b-1">
              First Disabled
            </button>
          </RovingFocus.Item>
          <RovingFocus.Item>
            <button type="button" data-testid="b-2">
              Second Enabled
            </button>
          </RovingFocus.Item>
          <RovingFocus.Item>
            <button type="button" data-testid="b-3">
              Third Enabled
            </button>
          </RovingFocus.Item>
        </div>
      </RovingFocus.Root>
    )

    expect(html).toContain('data-testid="ssr-toolbar"')
    expect(html).toMatch(/<button[^>]*data-testid="b-2"[^>]*tabindex="0"/)
    expect(html).toMatch(/<button[^>]*data-testid="b-1"[^>]*tabindex="-1"/)
    expect(html).toMatch(/<button[^>]*data-testid="b-3"[^>]*tabindex="-1"/)
    expect(html.startsWith('<div role="toolbar"')).toBe(true)
  })
})

/**
 * Identity-collection proof: fragment traversal, id diagnostics, and
 * authority warns. Renders authored children in happy-dom; the root
 * contract pins how violations surface to applications.
 */
import * as React from 'react'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { collectItemIds } from './collect'

function Item(props: { id?: string; open?: boolean; onChange?: () => void }) {
  return React.createElement('div', props)
}

const options = (dev: boolean) => ({ itemTypes: [Item], dev })

describe('collectItemIds', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('collects authored ids in render order, through fragments, skipping non-items', () => {
    const children = [
      React.createElement(Item, { key: 'a', id: 'a' }),
      React.createElement(React.Fragment, { key: 'f' }, [
        React.createElement(Item, { key: 'b', id: 'b' }),
        React.createElement('div', { key: 'host', id: 'nope' }),
      ]),
      'text',
      null,
      React.createElement(Item, { key: 'c', id: 'c' }),
    ]
    expect(collectItemIds(children, options(false))).toEqual(['a', 'b', 'c'])
  })

  it('throws on a missing item id in dev (AC-DOM-05)', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      collectItemIds(React.createElement(Item, { open: true }), options(true))
    ).toThrow('[Reference UI Accordion] Item Collapsible is missing required "id" prop.')
    expect(error).toHaveBeenCalledTimes(1)
  })

  it('throws on an empty or duplicate item id in dev (AC-DOM-05)', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => collectItemIds(React.createElement(Item, { id: '' }), options(true))).toThrow(
      '[Reference UI Accordion] Item Collapsible has an empty "id" prop.'
    )
    expect(() =>
      collectItemIds(
        [
          React.createElement(Item, { key: 'a', id: 'dup' }),
          React.createElement(Item, { key: 'b', id: 'dup' }),
        ],
        options(true)
      )
    ).toThrow(
      '[Reference UI Accordion] Duplicate item id "dup". Each Accordion item must have a unique id.'
    )
    expect(error).toHaveBeenCalledTimes(2)
  })

  it('reports competing controlled props without throwing (AC-DOM-08)', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(
      collectItemIds(React.createElement(Item, { id: 'a', open: true }), options(true))
    ).toEqual(['a'])
    expect(
      collectItemIds(
        React.createElement(Item, { id: 'b', onChange: () => {} }),
        options(true)
      )
    ).toEqual(['b'])
    expect(error).toHaveBeenCalledTimes(2)
    expect(error.mock.calls[0]?.[0]).toMatch(/Competing authority/)
  })

  it('skips every diagnostic outside dev but still collects valid ids', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(
      collectItemIds(
        [
          React.createElement(Item, { key: 'a' }),
          React.createElement(Item, { key: 'b', id: '' }),
          React.createElement(Item, { key: 'c', id: 'ok', open: true }),
        ],
        options(false)
      )
    ).toEqual(['ok'])
    expect(error).not.toHaveBeenCalled()
  })
})

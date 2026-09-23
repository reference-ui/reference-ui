// Unit tests for the JSX roster join.
// They take extends carriers plus traced names and assert the resolved
// artifact. Upstream merges across systems, local unions configured with
// traced, and every list stays trimmed, deduped, and sorted.

import { describe, expect, it } from 'vitest'
import { resolveJsxElements } from './jsx.ts'

describe('resolveJsxElements', () => {
  it('trims, dedupes, and sorts every list', () => {
    expect(
      resolveJsxElements({
        extends: [
          { name: 'upstream', fragment: '', jsxElements: ['  Card ', 'Card', 'Badge'] },
        ],
        jsxElements: ['Panel', ' Card '],
      })
    ).toEqual({
      primitives: [],
      upstream: ['Badge', 'Card'],
      local: ['Card', 'Panel'],
      merged: ['Badge', 'Card', 'Panel'],
    })
  })

  it('merges upstream rosters across systems', () => {
    expect(
      resolveJsxElements({
        extends: [
          { name: 'one', fragment: '', jsxElements: ['Card'] },
          { name: 'two', fragment: '', jsxElements: ['Panel', 'Card'] },
        ],
      })
    ).toEqual({
      primitives: [],
      upstream: ['Card', 'Panel'],
      local: [],
      merged: ['Card', 'Panel'],
    })
  })

  it('unions traced names into local and merged only', () => {
    const resolved = resolveJsxElements(
      { jsxElements: ['Card'] },
      ['Traced', 'Card']
    )

    expect(resolved.upstream).toEqual([])
    expect(resolved.local).toEqual(['Card', 'Traced'])
    expect(resolved.merged).toEqual(['Card', 'Traced'])
  })

  it('resolves empty carriers to empty lists', () => {
    expect(resolveJsxElements({})).toEqual({
      primitives: [],
      upstream: [],
      local: [],
      merged: [],
    })
  })

  it('keeps primitives empty until the roster producer lands', () => {
    expect(resolveJsxElements({ jsxElements: ['Card'] }, ['Traced']).primitives).toEqual([])
  })
})

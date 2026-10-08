// Unit tests for the JSX roster join.
// They take extends carriers plus traced names and assert the resolved
// artifact. Upstream merges across systems, local unions configured with
// traced, and every list stays trimmed, deduped, and sorted. Primitives
// mirror the E1 vocabulary's jsx names, so downstream extends consumers
// read the roster without tracing it.

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { resolveJsxElements } from './jsx.ts'

interface ShelfElement {
  jsx: string
}

// The test reads the shelf through its own parse: it pins the join
// (shape, sortedness, carrier-independence), while PGEN-12/13 parity
// plus the RS goldens pin the shelf's own bytes.
function readExpectedRoster(): string[] {
  const shelf = JSON.parse(
    readFileSync(
      resolve(
        dirname(fileURLToPath(import.meta.url)),
        '..',
        '..',
        'native',
        'generated',
        'primitives',
        'vocabulary.json'
      ),
      'utf-8'
    )
  ) as { elements: ShelfElement[] }
  return [...new Set(shelf.elements.map(element => element.jsx))].sort()
}

const EXPECTED_ROSTER: string[] = readExpectedRoster()

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
      primitives: EXPECTED_ROSTER,
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
      primitives: EXPECTED_ROSTER,
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

    expect(resolved.primitives).toEqual(EXPECTED_ROSTER)
    expect(resolved.upstream).toEqual([])
    expect(resolved.local).toEqual(['Card', 'Traced'])
    expect(resolved.merged).toEqual(['Card', 'Traced'])
  })

  it('resolves empty carriers to empty lists', () => {
    expect(resolveJsxElements({})).toEqual({
      primitives: EXPECTED_ROSTER,
      upstream: [],
      local: [],
      merged: [],
    })
  })

  it('feeds primitives from the E1 vocabulary for every carrier', () => {
    expect(EXPECTED_ROSTER).toHaveLength(101)
    expect([...EXPECTED_ROSTER].sort()).toEqual(EXPECTED_ROSTER)
    for (const name of ['A', 'Div', 'Map', 'Obj', 'Table']) {
      expect(EXPECTED_ROSTER).toContain(name)
    }

    const empty = resolveJsxElements({})
    const configured = resolveJsxElements({ jsxElements: ['Card'] }, ['Traced'])
    expect(empty.primitives).toEqual(EXPECTED_ROSTER)
    expect(configured.primitives).toEqual(EXPECTED_ROSTER)
    expect(configured.primitives).toEqual(empty.primitives)
  })

  it('keeps the roster out of the merged request list', () => {
    const resolved = resolveJsxElements({})
    expect(resolved.primitives).toContain('Div')
    expect(resolved.merged).toEqual([])
  })
})

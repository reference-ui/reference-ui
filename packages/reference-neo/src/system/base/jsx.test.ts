// Unit tests for the JSX roster join.
// They take extends and layers carriers plus traced names and owned props and
// assert the resolved artifact. Upstream merges across systems, local unions
// configured with traced, and every list stays trimmed, deduped, and sorted.
// Owned props flow through layers while roster names stay extends-only.
// Primitives mirror the E1 vocabulary's jsx names, so downstream extends
// consumers read the roster without tracing it.

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { publishedJsxElements, resolveJsxElements } from './jsx.ts'

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
      owned: {},
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
      owned: {},
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
      owned: {},
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

describe('resolveJsxElements owned props', () => {
  it('gives an empty owned map for a string-only roster', () => {
    const resolved = resolveJsxElements({
      extends: [{ name: 'upstream', fragment: '', jsxElements: ['Card'] }],
      layers: [{ name: 'icons', fragment: '', jsxElements: ['Icon'] }],
      jsxElements: ['Panel'],
    })

    expect(resolved.owned).toEqual({})
  })

  it('joins the owned props of every extends system', () => {
    const resolved = resolveJsxElements({
      extends: [
        { name: 'one', fragment: '', jsxElements: ['Tile'], jsxOwned: { Tile: ['size'] } },
        { name: 'two', fragment: '', jsxOwned: { Tile: ['tone', 'size'], Card: ['variant'] } },
      ],
    })

    expect(resolved.owned).toEqual({ Card: ['variant'], Tile: ['size', 'tone'] })
  })

  it('joins the owned props of every layers system', () => {
    const resolved = resolveJsxElements({
      layers: [
        { name: 'icons', fragment: '', jsxOwned: { HomeIcon: ['size'] } },
        { name: 'marks', fragment: '', jsxOwned: { Mark: ['tone'] } },
      ],
    })

    expect(resolved.owned).toEqual({ HomeIcon: ['size'], Mark: ['tone'] })
  })

  it('joins extends, layers and local traced owned props by component', () => {
    const resolved = resolveJsxElements(
      {
        extends: [{ name: 'base', fragment: '', jsxOwned: { Tile: ['size'] } }],
        layers: [{ name: 'icons', fragment: '', jsxOwned: { Tile: ['tone'], HomeIcon: ['size'] } }],
      },
      ['Local'],
      { Local: ['mode'], Tile: ['size', 'density'] }
    )

    expect(resolved.owned).toEqual({
      HomeIcon: ['size'],
      Local: ['mode'],
      Tile: ['density', 'size', 'tone'],
    })
    expect(Object.keys(resolved.owned)).toEqual(['HomeIcon', 'Local', 'Tile'])
  })

  it('takes local traced owned props with no upstream at all', () => {
    const resolved = resolveJsxElements({}, ['Tile'], { Tile: ['size'] })

    expect(resolved.owned).toEqual({ Tile: ['size'] })
    expect(resolved.local).toEqual(['Tile'])
  })

  it('lets owned entries name a component the roster does not list', () => {
    const resolved = resolveJsxElements({
      extends: [{ name: 'base', fragment: '', jsxOwned: { Ghost: ['size'] } }],
    })

    expect(resolved.owned).toEqual({ Ghost: ['size'] })
    expect(resolved.merged).toEqual([])
  })

})

describe('resolveJsxElements owned props: shape and roster', () => {
  it('trims and dedupes owned names and drops components left with no prop', () => {
    const resolved = resolveJsxElements({
      extends: [
        { name: 'base', fragment: '', jsxOwned: { ' Tile ': [' size ', 'size', ''], Empty: [], '': ['x'] } },
      ],
    })

    expect(resolved.owned).toEqual({ Tile: ['size'] })
  })

  it('leaves roster names to extends and local alone: layers add none', () => {
    const resolved = resolveJsxElements(
      {
        extends: [{ name: 'base', fragment: '', jsxElements: ['Card'], jsxOwned: { Card: ['size'] } }],
        layers: [
          { name: 'icons', fragment: '', jsxElements: ['HomeIcon'], jsxOwned: { HomeIcon: ['size'] } },
        ],
        jsxElements: ['Panel'],
      },
      ['Traced']
    )

    expect(resolved.upstream).toEqual(['Card'])
    expect(resolved.local).toEqual(['Panel', 'Traced'])
    expect(resolved.merged).toEqual(['Card', 'Panel', 'Traced'])
    expect(resolved.owned).toEqual({ Card: ['size'], HomeIcon: ['size'] })
  })

  it('does not mutate the carriers or the traced map', () => {
    const base = { name: 'base', fragment: '', jsxOwned: { Tile: ['size', 'tone'] } }
    const traced = { Tile: ['density'] }
    const resolved = resolveJsxElements({ extends: [base] }, [], traced)
    resolved.owned.Tile?.push('mutated')

    expect(base.jsxOwned).toEqual({ Tile: ['size', 'tone'] })
    expect(traced).toEqual({ Tile: ['density'] })
  })
})

describe('publishedJsxElements', () => {
  it('prints the four roster keys when nothing is owned', () => {
    const published = publishedJsxElements(resolveJsxElements({ jsxElements: ['Card'] }))

    expect(Object.keys(published)).toEqual(['primitives', 'upstream', 'local', 'merged'])
  })

  it('prints owned last when a component owns a prop', () => {
    const published = publishedJsxElements(resolveJsxElements({}, ['Tile'], { Tile: ['size'] }))

    expect(Object.keys(published)).toEqual(['primitives', 'upstream', 'local', 'merged', 'owned'])
    expect(published.owned).toEqual({ Tile: ['size'] })
  })
})

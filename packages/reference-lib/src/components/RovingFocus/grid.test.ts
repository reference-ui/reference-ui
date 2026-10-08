import { describe, expect, it } from 'vitest'
import { findGridTarget, groupGridRows, type GridCell } from './grid'

function cell(
  id: string,
  top: number,
  left: number,
  domIndex: number,
  options?: { width?: number; height?: number; available?: boolean }
): GridCell {
  return {
    id,
    rect: { top, left, width: options?.width ?? 100, height: options?.height ?? 40 },
    domIndex,
    available: options?.available ?? true,
  }
}

// Regular 3x3: 100x40 cells, 10px gaps. Rows at top 0/50/100, columns at
// left 0/110/220. Centers x: 50/160/270.
function regularGrid(): GridCell[] {
  const cells: GridCell[] = []
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      cells.push(cell(`g-${row}-${col}`, row * 50, col * 110, row * 3 + col))
    }
  }
  return cells
}

describe('groupGridRows', () => {
  it('groups a regular grid into top-ordered rows', () => {
    const rows = groupGridRows(regularGrid())
    expect(rows).toHaveLength(3)
    expect(rows[0]?.map(c => c.id)).toEqual(['g-0-0', 'g-0-1', 'g-0-2'])
    expect(rows[2]?.map(c => c.id)).toEqual(['g-2-0', 'g-2-1', 'g-2-2'])
  })

  it('keeps same-row cells with uneven tops together', () => {
    const rows = groupGridRows([
      cell('a', 0, 0, 0),
      cell('b', 4, 110, 1, { height: 30 }),
      cell('c', 50, 0, 2),
    ])
    expect(rows).toHaveLength(2)
    expect(rows[0]?.map(c => c.id)).toEqual(['a', 'b'])
  })

  it('opens a new row for exactly touching rows', () => {
    const rows = groupGridRows([cell('a', 0, 0, 0, { height: 40 }), cell('b', 40, 0, 1)])
    expect(rows).toHaveLength(2)
  })
})

describe('findGridTarget horizontal (RF-GRID-01)', () => {
  it('moves within the rendered row by visual x order', () => {
    const cells = regularGrid()
    expect(findGridTarget(cells, 'g-1-1', 'left')).toBe('g-1-0')
    expect(findGridTarget(cells, 'g-1-1', 'right')).toBe('g-1-2')
    expect(findGridTarget(cells, 'g-1-1', 'up')).toBe('g-0-1')
    expect(findGridTarget(cells, 'g-1-1', 'down')).toBe('g-2-1')
  })

  it('returns null at row edges without loop (RF-GRID-04)', () => {
    const cells = regularGrid()
    expect(findGridTarget(cells, 'g-1-0', 'left')).toBeNull()
    expect(findGridTarget(cells, 'g-1-2', 'right')).toBeNull()
    expect(findGridTarget(cells, 'g-0-1', 'up')).toBeNull()
    expect(findGridTarget(cells, 'g-2-1', 'down')).toBeNull()
  })

  it('wraps within geometry with loop (RF-GRID-05)', () => {
    const cells = regularGrid()
    expect(findGridTarget(cells, 'g-1-2', 'right', { loop: true })).toBe('g-1-0')
    expect(findGridTarget(cells, 'g-1-0', 'left', { loop: true })).toBe('g-1-2')
    expect(findGridTarget(cells, 'g-2-1', 'down', { loop: true })).toBe('g-0-1')
    expect(findGridTarget(cells, 'g-0-1', 'up', { loop: true })).toBe('g-2-1')
  })
})

describe('findGridTarget ragged rows (RF-GRID-02)', () => {
  // Row 0: one wide cell centered at x=160. Row 1: two cells centered at
  // x=50 and x=270 — exactly equidistant from 160, so DOM order decides.
  it('resolves exact ties to the earliest candidate in DOM order', () => {
    const cells = [
      cell('wide', 0, 60, 0, { width: 200 }),
      cell('left', 50, 0, 1),
      cell('right', 50, 220, 2),
    ]
    expect(findGridTarget(cells, 'wide', 'down')).toBe('left')
  })

  it('chooses the geometrically nearest center on ragged rows', () => {
    const cells = [
      cell('top', 0, 200, 0),
      cell('near', 50, 180, 1, { width: 60 }),
      cell('far', 50, 0, 2),
    ]
    expect(findGridTarget(cells, 'top', 'down')).toBe('near')
  })
})

describe('findGridTarget disabled skip (RF-GRID-03)', () => {
  it('skips disabled cells within the row', () => {
    const cells = [
      cell('a', 0, 0, 0),
      cell('b', 0, 110, 1, { available: false }),
      cell('c', 0, 220, 2),
    ]
    expect(findGridTarget(cells, 'a', 'right')).toBe('c')
    expect(findGridTarget(cells, 'c', 'left')).toBe('a')
  })

  it('stays when the adjacent visual row has no available cell', () => {
    const cells = [
      cell('a', 0, 0, 0),
      cell('b', 50, 0, 1, { available: false }),
      cell('c', 100, 0, 2),
    ]
    // Disabled rows keep their geometry: no jump over row 1 to row 2.
    expect(findGridTarget(cells, 'a', 'down')).toBeNull()
    expect(findGridTarget(cells, 'a', 'down', { loop: true })).toBeNull()
  })

  it('chooses the nearest available center in the adjacent row', () => {
    const cells = [
      cell('top', 0, 0, 0),
      cell('blocked', 50, 0, 1, { available: false }),
      cell('alt', 50, 220, 2),
    ]
    expect(findGridTarget(cells, 'top', 'down')).toBe('alt')
  })
})

describe('findGridTarget edge cases', () => {
  it('returns null for unknown or unavailable current ids', () => {
    const cells = regularGrid()
    expect(findGridTarget(cells, 'missing', 'right')).toBeNull()
    expect(findGridTarget([], 'g-0-0', 'right')).toBeNull()
    const gone = regularGrid().map(c => (c.id === 'g-1-1' ? { ...c, available: false } : c))
    expect(findGridTarget(gone, 'g-1-1', 'right')).toBeNull()
  })

  it('orders stacked same-x cells deterministically', () => {
    const cells = [cell('a', 0, 0, 1), cell('b', 0, 0, 0)]
    expect(findGridTarget(cells, 'b', 'right')).toBe('a')
  })

  it('wraps vertically to the opposite edge row nearest center (RF-GRID-05)', () => {
    const cells = [
      cell('top-left', 0, 0, 0),
      cell('top-right', 0, 220, 1),
      cell('bottom-wide', 50, 60, 2, { width: 200 }),
    ]
    expect(findGridTarget(cells, 'bottom-wide', 'down', { loop: true })).toBe('top-left')
    expect(findGridTarget(cells, 'top-right', 'up', { loop: true })).toBe('bottom-wide')
  })
})

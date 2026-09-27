import { describe, expect, it } from 'vitest'
import { adjacentMenubarValue, menubarArrowDirection } from './menubar-nav'

describe('MB-NAV-01: menubar nav helpers', () => {
  it('maps horizontal arrows to directions, mirrored in RTL', () => {
    expect(menubarArrowDirection('ArrowRight', false)).toBe(1)
    expect(menubarArrowDirection('ArrowLeft', false)).toBe(-1)
    expect(menubarArrowDirection('ArrowRight', true)).toBe(-1)
    expect(menubarArrowDirection('ArrowLeft', true)).toBe(1)
  })

  it('ignores non-horizontal keys', () => {
    expect(menubarArrowDirection('ArrowDown', false)).toBeNull()
    expect(menubarArrowDirection('ArrowUp', true)).toBeNull()
    expect(menubarArrowDirection('Enter', false)).toBeNull()
    expect(menubarArrowDirection('Home', false)).toBeNull()
  })

  it('advances and retreats within the row', () => {
    const values = ['file', 'edit', 'view']
    expect(adjacentMenubarValue(values, 'file', 1, false)).toBe('edit')
    expect(adjacentMenubarValue(values, 'view', -1, false)).toBe('edit')
    expect(adjacentMenubarValue(values, 'edit', 1, true)).toBe('view')
    expect(adjacentMenubarValue(values, 'edit', -1, true)).toBe('file')
  })

  it('clamps at the edges without loop', () => {
    const values = ['file', 'edit']
    expect(adjacentMenubarValue(values, 'file', -1, false)).toBe('file')
    expect(adjacentMenubarValue(values, 'edit', 1, false)).toBe('edit')
  })

  it('wraps at the edges with loop', () => {
    const values = ['file', 'edit']
    expect(adjacentMenubarValue(values, 'file', -1, true)).toBe('edit')
    expect(adjacentMenubarValue(values, 'edit', 1, true)).toBe('file')
  })

  it('returns null when there is nowhere to move', () => {
    expect(adjacentMenubarValue([], 'file', 1, false)).toBeNull()
    expect(adjacentMenubarValue([], null, -1, true)).toBeNull()
  })

  it('lands on the headed edge for null or unknown anchors', () => {
    const values = ['file', 'edit', 'view']
    expect(adjacentMenubarValue(values, null, 1, false)).toBe('file')
    expect(adjacentMenubarValue(values, null, -1, false)).toBe('view')
    expect(adjacentMenubarValue(values, 'stale', 1, false)).toBe('file')
    expect(adjacentMenubarValue(values, 'stale', -1, true)).toBe('view')
  })

  it('holds a single menu at both edges', () => {
    expect(adjacentMenubarValue(['file'], 'file', 1, false)).toBe('file')
    expect(adjacentMenubarValue(['file'], 'file', -1, false)).toBe('file')
    expect(adjacentMenubarValue(['file'], 'file', 1, true)).toBe('file')
  })
})

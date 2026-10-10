import { describe, expect, it } from 'vitest'
import { computePreferredCell, nearestEnabledCell, type RovingCell } from './roving'

function cell(key: string, flags: Partial<RovingCell> = {}): RovingCell {
  return { key, disabled: false, selected: false, current: false, ...flags }
}

describe('collection roving', () => {
  it('prefers the enabled selection, then current, then first enabled', () => {
    const cells = [cell('a'), cell('b', { current: true }), cell('c', { selected: true })]
    expect(computePreferredCell(cells)).toBe('c')
    expect(computePreferredCell([cell('a'), cell('b', { current: true })])).toBe('b')
    expect(computePreferredCell([cell('a', { disabled: true }), cell('b')])).toBe('b')
  })

  it('returns null when the whole collection is blocked', () => {
    expect(computePreferredCell([cell('a', { disabled: true })])).toBeNull()
  })

  it('relocates a lost target forward-first', () => {
    const cells = [cell('a'), cell('b', { disabled: true }), cell('c')]
    expect(nearestEnabledCell(cells, 'b')).toBe('c')
    expect(nearestEnabledCell(cells, 'c')).toBe('a')
    expect(nearestEnabledCell(cells, 'zzz')).toBe('a')
    expect(nearestEnabledCell([cell('a', { disabled: true })], 'a')).toBeNull()
  })
})

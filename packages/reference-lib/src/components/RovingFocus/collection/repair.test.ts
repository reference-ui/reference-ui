/** Isolated proof for collection/repair: next-then-previous stale-current
 * repair against the last committed order. Detached entries (no node) read
 * as available unless disabled, so every RF-TAB-06 shape runs in plain
 * Vitest with no DOM. */

import { describe, expect, it } from 'vitest'
import type { ItemEntry } from '../types'
import { resolveRepairTarget } from './repair'

function entry(id: string, disabled = false): ItemEntry {
  return { id, ref: { current: null }, disabled }
}

describe('resolveRepairTarget (RF-TAB-06)', () => {
  it('chooses the removed current item successor', () => {
    const ordered = [entry('a'), entry('c')]
    expect(resolveRepairTarget(ordered, ['a', 'b', 'c'], 'b')).toBe('c')
  })

  it('falls back to the previous item when no successor is available', () => {
    const ordered = [entry('a'), entry('b')]
    expect(resolveRepairTarget(ordered, ['a', 'b', 'c'], 'c')).toBe('b')
  })

  it('skips unavailable items in both scan directions', () => {
    const ordered = [entry('a'), entry('b', true), entry('c')]
    expect(resolveRepairTarget(ordered, ['a', 'b', 'c'], 'a')).toBe('c')
    const blocked = [entry('a'), entry('b', true)]
    expect(resolveRepairTarget(blocked, ['a', 'b', 'c'], 'c')).toBe('a')
  })

  it('falls back to the first available item when the stale id is unknown', () => {
    const ordered = [entry('a'), entry('b')]
    expect(resolveRepairTarget(ordered, ['x'], 'b')).toBe('a')
    expect(resolveRepairTarget(ordered, [], 'b')).toBe('a')
  })

  it('returns null when no item is available', () => {
    expect(resolveRepairTarget([], [], 'b')).toBeNull()
    expect(resolveRepairTarget([entry('a', true)], ['a'], 'a')).toBeNull()
  })

  it('repairs within the live collection when the stale id survives there', () => {
    const ordered = [entry('a'), entry('b', true), entry('c')]
    expect(resolveRepairTarget(ordered, ['a', 'b', 'c'], 'b')).toBe('c')
  })
})

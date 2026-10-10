import { describe, expect, it } from 'vitest'
import type { VirtualFocusItem } from '../Listbox'
import {
  currentVirtualIndex,
  edgeWindowedIndex,
  findDuplicateValue,
  findVirtualMatch,
  stepWindowedIndex,
  validateVirtualMount,
  validateVirtualTarget,
} from './virtual-focus'

const items: VirtualFocusItem[] = [
  { value: 'a', textValue: 'Alpha' },
  { value: 'b', textValue: 'Bravo', disabled: true },
  { value: 'c', textValue: 'Charlie' },
]

describe('virtual-focus helpers', () => {
  it('detects duplicate logical values', () => {
    expect(findDuplicateValue(items)).toBeNull()
    expect(findDuplicateValue([...items, { value: 'a', textValue: 'Again' }])).toBe('a')
  })

  it('resolves the logical index of the active value', () => {
    expect(currentVirtualIndex(items, 'c')).toBe(2)
    expect(currentVirtualIndex(items, 'ghost')).toBeNull()
    expect(currentVirtualIndex(items, null)).toBeNull()
  })

  it('validates targets by range and enabled state, mounts by range', () => {
    expect(validateVirtualTarget(items, 0)).toBe('ok')
    expect(validateVirtualTarget(items, 1)).toBe('disabled')
    expect(validateVirtualTarget(items, 7)).toBe('out-of-range')
    expect(validateVirtualMount(items, 1)).toBe(true)
    expect(validateVirtualMount(items, 7)).toBe(false)
  })

  it('searches labels case-insensitively with first-enabled empty rule', () => {
    expect(findVirtualMatch(items, 'ch')).toBe(2)
    expect(findVirtualMatch(items, 'BR')).toBeNull()
    expect(findVirtualMatch(items, '')).toBe(0)
    expect(findVirtualMatch(items, 'zzz')).toBeNull()
  })
})

describe('windowed stepping', () => {
  it('steps with wraparound and skips disabled items', () => {
    const step = (currentIndex: number | null, direction: 1 | -1) =>
      stepWindowedIndex({ items, currentIndex, direction })
    expect(step(0, 1)).toBe(2)
    expect(step(2, 1)).toBe(0)
    expect(step(0, -1)).toBe(2)
    expect(step(null, 1)).toBe(0)
    expect(step(null, -1)).toBe(2)
    expect(stepWindowedIndex({ items: [], currentIndex: 0, direction: 1 })).toBeNull()
  })

  it('edges to the first and last enabled items', () => {
    expect(edgeWindowedIndex(items, 'first')).toBe(0)
    expect(edgeWindowedIndex(items, 'last')).toBe(2)
    expect(edgeWindowedIndex([{ value: 'x', textValue: 'X', disabled: true }], 'first')).toBeNull()
  })
})

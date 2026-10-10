import { describe, expect, it } from 'vitest'
import { toMountedIndexEntries, validateVirtualAdapter } from './adapter'

const items = [
  { value: 'a', textValue: 'Alpha' },
  { value: 'b', textValue: 'Bravo', disabled: true },
  { value: 'c', textValue: 'Charlie' },
]

describe('validateVirtualAdapter', () => {
  it('accepts a consistent logical and mounted mapping', () => {
    expect(() =>
      validateVirtualAdapter(
        { items, scrollToIndex: () => {} },
        [
          { value: 'a', index: 0, disabled: false },
          { value: 'c', index: 2, disabled: false },
        ]
      )
    ).not.toThrow()
  })

  it('rejects duplicate logical values', () => {
    expect(() =>
      validateVirtualAdapter(
        { items: [...items, { value: 'a', textValue: 'Again' }], scrollToIndex: () => {} },
        []
      )
    ).toThrow('Duplicate value in virtual items: "a"')
  })

  it('rejects out-of-range and duplicate mounted indices', () => {
    expect(() =>
      validateVirtualAdapter(
        { items, scrollToIndex: () => {} },
        [{ value: 'a', index: 7, disabled: false }]
      )
    ).toThrow('Option index 7 out of range (0..2)')
    expect(() =>
      validateVirtualAdapter(
        { items, scrollToIndex: () => {} },
        [
          { value: 'a', index: 0, disabled: false },
          { value: 'a', index: 0, disabled: false },
        ]
      )
    ).toThrow('Duplicate mounted option index: 0')
  })

  it('rejects value and disabled mismatches at an index', () => {
    expect(() =>
      validateVirtualAdapter(
        { items, scrollToIndex: () => {} },
        [{ value: 'c', index: 0, disabled: false }]
      )
    ).toThrow('does not match virtual item value "a" at index 0')
    expect(() =>
      validateVirtualAdapter(
        { items, scrollToIndex: () => {} },
        [{ value: 'a', index: 0, disabled: true }]
      )
    ).toThrow('disabled state does not match virtual item disabled state at index 0')
  })
})

describe('toMountedIndexEntries', () => {
  it('projects indexed records and skips unindexed ones', () => {
    expect(
      toMountedIndexEntries([
        { value: 'a', index: 0, disabled: false },
        { value: 'b', index: undefined, disabled: false },
        { value: 'c', index: 2, disabled: true },
      ])
    ).toEqual([
      { value: 'a', index: 0, disabled: false },
      { value: 'c', index: 2, disabled: true },
    ])
  })
})

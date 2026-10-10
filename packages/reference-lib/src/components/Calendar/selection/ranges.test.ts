import { describe, expect, it } from 'vitest'
import { resolveRangeSelect } from './ranges'

const open: (date: string) => boolean = () => false

describe('resolveRangeSelect', () => {
  it('starts a pending range from null or a completed value', () => {
    expect(resolveRangeSelect(null, '2024-08-15', open)).toEqual({
      start: '2024-08-15',
      end: null,
    })
    expect(
      resolveRangeSelect({ start: '2024-08-10', end: '2024-08-12' }, '2024-08-15', open)
    ).toEqual({ start: '2024-08-15', end: null })
  })

  it('completes forward and backward without normalizing', () => {
    expect(
      resolveRangeSelect({ start: '2024-08-15', end: null }, '2024-08-18', open)
    ).toEqual({ start: '2024-08-15', end: '2024-08-18' })
    expect(
      resolveRangeSelect({ start: '2024-08-15', end: null }, '2024-08-12', open)
    ).toEqual({ start: '2024-08-12', end: '2024-08-15' })
  })

  it('rejects a completion crossing an unselectable date', () => {
    expect(
      resolveRangeSelect({ start: '2024-08-15', end: null }, '2024-08-18', (d) =>
        d === '2024-08-16' ? true : false
      )
    ).toBeNull()
  })

  it('restarts pending from a completed value, degenerates on the anchor', () => {
    expect(
      resolveRangeSelect({ start: '2024-08-15', end: '2024-08-18' }, '2024-08-15', open)
    ).toEqual({ start: '2024-08-15', end: null })
    expect(resolveRangeSelect({ start: '2024-08-15', end: null }, '2024-08-15', open)).toEqual({
      start: '2024-08-15',
      end: '2024-08-15',
    })
  })
})

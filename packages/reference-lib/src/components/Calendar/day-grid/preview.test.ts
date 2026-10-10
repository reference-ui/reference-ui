import { describe, expect, it } from 'vitest'
import { resolvePreviewBand } from './preview'

const open: (date: string) => boolean = () => false

describe('resolvePreviewBand', () => {
  it('bands a selectable candidate against a pending start', () => {
    expect(
      resolvePreviewBand('range', { start: '2024-08-15', end: null }, '2024-08-18', open)
    ).toEqual({
      low: '2024-08-15',
      high: '2024-08-18',
      start: '2024-08-15',
      candidate: '2024-08-18',
    })
  })

  it('keeps the anchor orientation on a backward candidate', () => {
    const band = resolvePreviewBand(
      'range',
      { start: '2024-08-15', end: null },
      '2024-08-12',
      open
    )
    expect(band).toEqual({
      low: '2024-08-12',
      high: '2024-08-15',
      start: '2024-08-15',
      candidate: '2024-08-12',
    })
  })

  it('previews nothing outside range mode, without a pending start, or on the start', () => {
    expect(resolvePreviewBand('day', '2024-08-15', '2024-08-18', open)).toBeNull()
    expect(
      resolvePreviewBand('range', { start: '2024-08-15', end: '2024-08-18' }, '2024-08-20', open)
    ).toBeNull()
    expect(resolvePreviewBand('range', null, '2024-08-18', open)).toBeNull()
    expect(
      resolvePreviewBand('range', { start: '2024-08-15', end: null }, '2024-08-15', open)
    ).toBeNull()
    expect(resolvePreviewBand('range', { start: '2024-08-15', end: null }, null, open)).toBeNull()
  })

  it('previews nothing past an unselectable candidate or a blocked span', () => {
    expect(
      resolvePreviewBand('range', { start: '2024-08-15', end: null }, '2024-08-18', (d) =>
        d === '2024-08-18' ? true : false
      )
    ).toBeNull()
    expect(
      resolvePreviewBand('range', { start: '2024-08-15', end: null }, '2024-08-18', (d) =>
        d === '2024-08-16' ? true : false
      )
    ).toBeNull()
  })
})

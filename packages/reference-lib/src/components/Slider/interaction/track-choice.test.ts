/**
 * Proof for track-click resolution. Pins snapped values from horizontal
 * clicks with RTL and vertical mirroring, null for unmeasurable tracks,
 * and nearest-movable choice with active-then-index tie breaks.
 */
import { describe, expect, it } from 'vitest'
import { chooseTrackThumb, pointerToSnappedValue } from './track-choice'

const rect = { left: 0, right: 200, top: 0, bottom: 20, width: 200, height: 20 }

describe('track click resolution', () => {
  it('maps a horizontal click to the snapped value', () => {
    expect(
      pointerToSnappedValue({
        clientX: 160, clientY: 10, rect, orientation: 'horizontal', isRtl: false,
        min: 0, max: 100, step: 1,
      })
    ).toBe(80)
  })

  it('mirrors the mapping in RTL and on the vertical axis', () => {
    expect(
      pointerToSnappedValue({
        clientX: 160, clientY: 10, rect, orientation: 'horizontal', isRtl: true,
        min: 0, max: 100, step: 1,
      })
    ).toBe(20)
    expect(
      pointerToSnappedValue({
        clientX: 10, clientY: 5, rect, orientation: 'vertical', isRtl: false,
        min: 0, max: 100, step: 1,
      })
    ).toBe(75)
  })

  it('returns null when the track has no measurable extent', () => {
    const flat = { ...rect, width: 0 }
    expect(
      pointerToSnappedValue({
        clientX: 10, clientY: 10, rect: flat, orientation: 'horizontal', isRtl: false,
        min: 0, max: 100, step: 1,
      })
    ).toBeNull()
  })

  it('chooses the nearest movable thumb for a single thumb trivially', () => {
    expect(
      chooseTrackThumb({
        values: [50], snapped: 80, min: 0, max: 100, step: 1,
        minStepsBetweenThumbs: 0, activeThumbIndex: null,
      })
    ).toBe(0)
  })

  it('prefers the nearest thumb, then the active thumb on ties, then lower index', () => {
    const base = {
      values: [20, 80], min: 0, max: 100, step: 1, minStepsBetweenThumbs: 0,
    }
    expect(chooseTrackThumb({ ...base, snapped: 70, activeThumbIndex: null })).toBe(1)
    expect(chooseTrackThumb({ ...base, snapped: 30, activeThumbIndex: null })).toBe(0)
    // Equidistant tie: active thumb wins when it is among the closest.
    expect(chooseTrackThumb({ ...base, snapped: 50, activeThumbIndex: 1 })).toBe(1)
    // Equidistant tie with no active thumb: lower index wins.
    expect(chooseTrackThumb({ ...base, snapped: 50, activeThumbIndex: null })).toBe(0)
  })
})

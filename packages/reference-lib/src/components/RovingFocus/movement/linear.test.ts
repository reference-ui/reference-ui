/** Isolated proof for movement/linear: one-dimensional arrow resolution
 * across orientations, RTL reversal, loop wrap versus boundary clamp, and
 * whole-composite Home/End/PageUp/PageDown endpoints. Pure index math, so
 * every case runs in plain Vitest with no DOM. */

import { describe, expect, it } from 'vitest'
import { resolveLinearTarget } from './linear'
import type { RovingFocusOrientation } from '../types'

function target(
  key: string,
  orientation: RovingFocusOrientation,
  currentIndex: number,
  options?: { count?: number; loop?: boolean; isRtl?: boolean }
) {
  return resolveLinearTarget({
    key,
    orientation,
    isRtl: options?.isRtl ?? false,
    currentIndex,
    count: options?.count ?? 3,
    loop: options?.loop ?? false,
  })
}

describe('resolveLinearTarget horizontal (RF-KEY-01)', () => {
  it('advances on ArrowRight and retreats on ArrowLeft in LTR', () => {
    expect(target('ArrowRight', 'horizontal', 1)).toEqual({ targetIndex: 2, handled: true })
    expect(target('ArrowLeft', 'horizontal', 1)).toEqual({ targetIndex: 0, handled: true })
  })

  it('leaves vertical arrows unhandled', () => {
    expect(target('ArrowUp', 'horizontal', 1)).toEqual({ targetIndex: 1, handled: false })
    expect(target('ArrowDown', 'horizontal', 1)).toEqual({ targetIndex: 1, handled: false })
  })
})

describe('resolveLinearTarget RTL (RF-KEY-02)', () => {
  it('reverses horizontal arrows under RTL', () => {
    expect(target('ArrowLeft', 'horizontal', 1, { isRtl: true })).toEqual({
      targetIndex: 2,
      handled: true,
    })
    expect(target('ArrowRight', 'horizontal', 1, { isRtl: true })).toEqual({
      targetIndex: 0,
      handled: true,
    })
  })
})

describe('resolveLinearTarget vertical (RF-KEY-03)', () => {
  it('moves only on Up/Down in both directions', () => {
    for (const isRtl of [false, true]) {
      expect(target('ArrowDown', 'vertical', 1, { isRtl })).toEqual({
        targetIndex: 2,
        handled: true,
      })
      expect(target('ArrowUp', 'vertical', 1, { isRtl })).toEqual({ targetIndex: 0, handled: true })
      expect(target('ArrowLeft', 'vertical', 1, { isRtl }).handled).toBe(false)
      expect(target('ArrowRight', 'vertical', 1, { isRtl }).handled).toBe(false)
    }
  })
})

describe('resolveLinearTarget endpoints (RF-KEY-04, RF-KEY-12)', () => {
  it('sends Home/PageUp to first and End/PageDown to last in every orientation', () => {
    const orientations: RovingFocusOrientation[] = ['horizontal', 'vertical', 'both']
    for (const orientation of orientations) {
      expect(target('Home', orientation, 1)).toEqual({ targetIndex: 0, handled: true })
      expect(target('PageUp', orientation, 1)).toEqual({ targetIndex: 0, handled: true })
      expect(target('End', orientation, 1)).toEqual({ targetIndex: 2, handled: true })
      expect(target('PageDown', orientation, 1)).toEqual({ targetIndex: 2, handled: true })
    }
  })
})

describe('resolveLinearTarget boundaries (RF-KEY-05, RF-KEY-06)', () => {
  it('stays handled-but-clamped at boundaries without loop', () => {
    expect(target('ArrowLeft', 'horizontal', 0)).toEqual({ targetIndex: 0, handled: true })
    expect(target('ArrowRight', 'horizontal', 2)).toEqual({ targetIndex: 2, handled: true })
    expect(target('ArrowUp', 'vertical', 0)).toEqual({ targetIndex: 0, handled: true })
    expect(target('ArrowDown', 'vertical', 2)).toEqual({ targetIndex: 2, handled: true })
  })

  it('wraps across boundaries with loop', () => {
    expect(target('ArrowLeft', 'horizontal', 0, { loop: true })).toEqual({
      targetIndex: 2,
      handled: true,
    })
    expect(target('ArrowRight', 'horizontal', 2, { loop: true })).toEqual({
      targetIndex: 0,
      handled: true,
    })
    expect(target('ArrowUp', 'vertical', 0, { loop: true })).toEqual({
      targetIndex: 2,
      handled: true,
    })
    expect(target('ArrowDown', 'vertical', 2, { loop: true })).toEqual({
      targetIndex: 0,
      handled: true,
    })
  })
})

describe('resolveLinearTarget grid orientation', () => {
  it('leaves arrows unhandled for orientation="both" (the grid path owns them)', () => {
    for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) {
      expect(target(key, 'both', 1)).toEqual({ targetIndex: 1, handled: false })
    }
  })

  it('ignores unrelated keys', () => {
    expect(target('Enter', 'horizontal', 1)).toEqual({ targetIndex: 1, handled: false })
    expect(target('a', 'vertical', 1)).toEqual({ targetIndex: 1, handled: false })
  })
})

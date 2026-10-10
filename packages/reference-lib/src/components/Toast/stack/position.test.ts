/** Isolation proof for slot placement: edges, centers, mobile spanning. */
import { describe, expect, it } from 'vitest'
import { getPositionStyles, resolveEdgeOffset } from './position'

describe('toast position styles', () => {
  it('resolves bare and per-edge offsets with fallback', () => {
    expect(resolveEdgeOffset(undefined, 'top', '24px')).toBe('24px')
    expect(resolveEdgeOffset(10, 'top', '24px')).toBe('10px')
    expect(resolveEdgeOffset('2rem', 'top', '24px')).toBe('2rem')
    expect(resolveEdgeOffset({ top: 5 }, 'top', '24px')).toBe('5px')
    expect(resolveEdgeOffset({ top: 5 }, 'left', '24px')).toBe('24px')
  })

  it('places each slot against its edges', () => {
    expect(getPositionStyles('top-start', undefined, '24px', false)).toEqual({
      top: '24px',
      left: '24px',
      alignItems: 'flex-start',
    })
    expect(getPositionStyles('bottom-end', undefined, '24px', false)).toEqual({
      bottom: '24px',
      right: '24px',
      alignItems: 'flex-end',
    })
    expect(getPositionStyles('mystery', undefined, '24px', false)).toEqual({
      bottom: '24px',
      right: '24px',
      alignItems: 'flex-end',
    })
  })

  it('centers with translate on desktop and spans the viewport on mobile', () => {
    expect(getPositionStyles('bottom-center', undefined, '24px', false)).toMatchObject({
      left: '50%',
      transform: 'translateX(-50%)',
    })
    expect(getPositionStyles('bottom-center', undefined, '16px', true)).toMatchObject({
      left: '16px',
      right: '16px',
      transform: undefined,
    })
  })
})

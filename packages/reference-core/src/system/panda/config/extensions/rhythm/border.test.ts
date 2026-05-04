import type { TransformArgs } from '@pandacss/types'
import { describe, expect, it } from 'vitest'
import { rhythmBorderRadiusUtilities } from './border'

const token: TransformArgs['token'] = Object.assign(
  (path: string) => {
    if (path === 'radii.lg') {
      return '0.6rem'
    }

    return undefined
  },
  {
    raw: () => undefined,
  },
)

describe('rhythmBorderRadiusUtilities', () => {
  it('resolves fraction rhythm strings through the raw input', () => {
    expect(
      rhythmBorderRadiusUtilities.borderRadius.transform('ignored', {
        raw: '1/5r',
        token,
      }),
    ).toEqual({
      borderRadius: 'calc(var(--spacing-root) / 5)',
    })
  })

  it('resolves pair utilities from rhythm fractions', () => {
    expect(
      rhythmBorderRadiusUtilities.borderTopRadius.transform('ignored', {
        raw: '-2/3r',
        token,
      }),
    ).toEqual({
      borderTopLeftRadius: 'calc(-2 * var(--spacing-root) / 3)',
      borderTopRightRadius: 'calc(-2 * var(--spacing-root) / 3)',
    })
  })

  it('resolves named radii tokens when the raw value is not rhythm', () => {
    expect(
      rhythmBorderRadiusUtilities.borderRadius.transform('lg', {
        raw: 'lg',
        token,
      }),
    ).toEqual({
      borderRadius: '0.6rem',
    })
  })

  it('falls back to the original value when no radii token exists', () => {
    expect(
      rhythmBorderRadiusUtilities.borderRadius.transform('custom', {
        raw: 'custom',
        token,
      }),
    ).toEqual({
      borderRadius: 'custom',
    })
  })
})
/**
 * Unit tests for reference-core rhythm border-radius utilities: every transform
 * resolves "nr" via the spacing scale and pair shorthands set two corners.
 *
 * Imports source from reference-core (workspace sibling) so behavior is tested
 * without a browser.
 */

import { describe, it, expect } from 'vitest'
import { rhythmBorderRadiusUtilities } from '../../../reference-core/src/system/panda/config/extensions/rhythm/border'

const twoR = 'calc(2 * var(--spacing-root))'
const lgRadius = '1rem'

type MockToken = ((path: string) => string | undefined) & {
  raw: (path: string) => undefined
}

type MockTransformArgs = {
  raw: string
  token: MockToken
}

function mockArgs(raw: string): MockTransformArgs {
  const token = ((path: string) => {
    if (path === 'radii.lg') return lgRadius
    return undefined
  }) as MockToken

  token.raw = () => undefined

  return { raw, token }
}

describe('rhythmUtilities border radius transforms', () => {
  const singleKeys = [
    'borderRadius',
    'borderTopLeftRadius',
    'borderTopRightRadius',
    'borderBottomRightRadius',
    'borderBottomLeftRadius',
    'borderStartStartRadius',
    'borderStartEndRadius',
    'borderEndStartRadius',
    'borderEndEndRadius',
  ] as const

  it('single-property utilities map 2r to calc(2 * var(--spacing-root)) on that property', () => {
    for (const key of singleKeys) {
      const u = rhythmBorderRadiusUtilities[key]
      expect(u.transform('2r', mockArgs('2r')), key).toEqual({ [key]: twoR })
    }
  })

  it('pair shorthands set both corners to the same resolved rhythm value', () => {
    expect(rhythmBorderRadiusUtilities.borderTopRadius.transform('2r', mockArgs('2r'))).toEqual({
      borderTopLeftRadius: twoR,
      borderTopRightRadius: twoR,
    })
    expect(rhythmBorderRadiusUtilities.borderRightRadius.transform('2r', mockArgs('2r'))).toEqual({
      borderTopRightRadius: twoR,
      borderBottomRightRadius: twoR,
    })
    expect(rhythmBorderRadiusUtilities.borderBottomRadius.transform('2r', mockArgs('2r'))).toEqual({
      borderBottomLeftRadius: twoR,
      borderBottomRightRadius: twoR,
    })
    expect(rhythmBorderRadiusUtilities.borderLeftRadius.transform('2r', mockArgs('2r'))).toEqual({
      borderTopLeftRadius: twoR,
      borderBottomLeftRadius: twoR,
    })
    expect(rhythmBorderRadiusUtilities.borderStartRadius.transform('2r', mockArgs('2r'))).toEqual({
      borderStartStartRadius: twoR,
      borderEndStartRadius: twoR,
    })
    expect(rhythmBorderRadiusUtilities.borderEndRadius.transform('2r', mockArgs('2r'))).toEqual({
      borderStartEndRadius: twoR,
      borderEndEndRadius: twoR,
    })
  })

  it('passes through literal CSS values and resolves radii tokens', () => {
    expect(rhythmBorderRadiusUtilities.borderRadius.transform('8px', mockArgs('8px'))).toEqual({
      borderRadius: '8px',
    })
    expect(rhythmBorderRadiusUtilities.borderRadius.transform('lg', mockArgs('lg'))).toEqual({
      borderRadius: lgRadius,
    })
    expect(
      rhythmBorderRadiusUtilities.borderTopRadius.transform(
        '0.5rem',
        mockArgs('0.5rem'),
      ),
    ).toEqual({
      borderTopLeftRadius: '0.5rem',
      borderTopRightRadius: '0.5rem',
    })
  })

  it('1r resolves to var(--spacing-root)', () => {
    expect(rhythmBorderRadiusUtilities.borderRadius.transform('1r', mockArgs('1r'))).toEqual({
      borderRadius: 'var(--spacing-root)',
    })
  })
})

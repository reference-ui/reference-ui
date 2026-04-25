import { describe, expect, it } from 'vitest'
import { rhythmUtilities } from './utilities'

const pointTwoR = 'calc(0.2 * var(--spacing-r))'

describe('rhythmUtilities border width transforms', () => {
  const borderWidthKeys = [
    'borderWidth',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'borderInlineWidth',
    'borderInlineStartWidth',
    'borderInlineEndWidth',
    'borderBlockWidth',
    'borderBlockStartWidth',
    'borderBlockEndWidth',
  ] as const

  it('maps border width props from rhythm values to calc values', () => {
    for (const key of borderWidthKeys) {
      const utility = rhythmUtilities[key]
      expect(utility.transform('0.2r'), key).toEqual({ [key]: pointTwoR })
    }
  })

  it('maps related thickness props from rhythm values to calc values', () => {
    expect(rhythmUtilities.outlineWidth.transform('0.2r')).toEqual({
      outlineWidth: pointTwoR,
    })
    expect(rhythmUtilities.textDecorationThickness.transform('0.2r')).toEqual({
      textDecorationThickness: pointTwoR,
    })
    expect(rhythmUtilities.textUnderlineOffset.transform('0.2r')).toEqual({
      textUnderlineOffset: pointTwoR,
    })
  })
})

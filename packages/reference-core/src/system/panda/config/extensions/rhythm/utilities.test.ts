import { describe, expect, it } from 'vitest'
import { rhythmUtilities } from './utilities'

const pointTwoR = 'calc(0.2 * var(--spacing-root))'

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

  it('maps fraction rhythm strings without predefined slash tokens', () => {
    expect(rhythmUtilities.padding.transform('1/5r')).toEqual({
      padding: 'calc(var(--spacing-root) / 5)',
    })
    expect(rhythmUtilities.margin.transform('-2/3r')).toEqual({
      margin: 'calc(-2 * var(--spacing-root) / 3)',
    })
  })

  it('maps whitespace-separated rhythm shorthands token by token', () => {
    expect(rhythmUtilities.padding.transform('1r 2r')).toEqual({
      padding: 'var(--spacing-root) calc(2 * var(--spacing-root))',
    })
    expect(rhythmUtilities.padding.transform('0.34rem 2r')).toEqual({
      padding: '0.34rem calc(2 * var(--spacing-root))',
    })
    expect(rhythmUtilities.padding.transform('1r 2r 3r 4r')).toEqual({
      padding:
        'var(--spacing-root) calc(2 * var(--spacing-root)) calc(3 * var(--spacing-root)) calc(4 * var(--spacing-root))',
    })
    expect(rhythmUtilities.margin.transform('1r auto')).toEqual({
      margin: 'var(--spacing-root) auto',
    })
    expect(rhythmUtilities.margin.transform('1r 2r 3r 4r')).toEqual({
      margin:
        'var(--spacing-root) calc(2 * var(--spacing-root)) calc(3 * var(--spacing-root)) calc(4 * var(--spacing-root))',
    })
    expect(rhythmUtilities.gap.transform('1r 2r')).toEqual({
      gap: 'var(--spacing-root) calc(2 * var(--spacing-root))',
    })
    expect(rhythmUtilities.borderSpacing.transform('1r 2r')).toEqual({
      borderSpacing: 'var(--spacing-root) calc(2 * var(--spacing-root))',
    })
  })

  it('leaves complex grammar alone when shorthand parsing would be ambiguous', () => {
    expect(rhythmUtilities.padding.transform('calc(1r + 2px)')).toEqual({
      padding: 'calc(1r + 2px)',
    })
    expect(rhythmUtilities.padding.transform('min(1r, 2rem)')).toEqual({
      padding: 'min(1r, 2rem)',
    })
  })

  it('maps size through sizeStyles for fraction rhythm strings', () => {
    expect(rhythmUtilities.size.transform('1/5r')).toEqual({
      width: 'calc(var(--spacing-root) / 5)',
      height: 'calc(var(--spacing-root) / 5)',
    })
  })
})

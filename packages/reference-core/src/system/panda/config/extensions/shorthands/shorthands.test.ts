import type { TransformArgs } from '@pandacss/types'
import { describe, expect, it } from 'vitest'
import {
  borderShorthandUtilities,
  createBorderShorthandUtility,
} from './border'
import {
  outlineShorthandUtilities,
  createOutlineShorthandUtility,
} from './outline'
import {
  isBorderStyle,
  isGlobalCssKeyword,
  isLengthWidth,
  isOutlineStyle,
  splitShorthandTokens,
} from './parser'

const token: TransformArgs['token'] = Object.assign(
  (path: string) => {
    if (path === 'colors.gray.800' || path === 'gray.800') {
      return 'var(--colors-gray-800)'
    }
    if (path === 'colors.blue.600' || path === 'blue.600') {
      return 'var(--colors-blue-600)'
    }
    if (path === 'colors.red.500' || path === 'red.500') {
      return 'var(--colors-red-500)'
    }
    return undefined
  },
  {
    raw: () => undefined,
  },
)

describe('shorthands parser & CSS spec compliance', () => {
  it('splits shorthand tokens while respecting parentheses and nested functions', () => {
    expect(splitShorthandTokens('1px solid rgb(0, 0, 0)')).toEqual([
      '1px',
      'solid',
      'rgb(0, 0, 0)',
    ])
    expect(splitShorthandTokens('calc(1px + 2px) solid var(--color, red)')).toEqual([
      'calc(1px + 2px)',
      'solid',
      'var(--color, red)',
    ])
    expect(splitShorthandTokens('1px solid color-mix(in srgb, red 50%, blue)')).toEqual([
      '1px',
      'solid',
      'color-mix(in srgb, red 50%, blue)',
    ])
    expect(splitShorthandTokens('2px dashed oklch(0.6 0.25 150)')).toEqual([
      '2px',
      'dashed',
      'oklch(0.6 0.25 150)',
    ])
    expect(splitShorthandTokens('1px solid var(--foo, rgb(255, 255, 255))')).toEqual([
      '1px',
      'solid',
      'var(--foo, rgb(255, 255, 255))',
    ])
  })

  it('correctly identifies valid width lengths including leading decimals and CSS math functions', () => {
    expect(isLengthWidth('1px')).toBe(true)
    expect(isLengthWidth('.5px')).toBe(true)
    expect(isLengthWidth('0.5px')).toBe(true)
    expect(isLengthWidth('.25rem')).toBe(true)
    expect(isLengthWidth('2.5rem')).toBe(true)
    expect(isLengthWidth('2r')).toBe(true)
    expect(isLengthWidth('.5r')).toBe(true)
    expect(isLengthWidth('1/3r')).toBe(true)
    expect(isLengthWidth('-2/3r')).toBe(true)
    expect(isLengthWidth('calc(100% - 20px)')).toBe(true)
    expect(isLengthWidth('min(10px, 2vw)')).toBe(true)
    expect(isLengthWidth('max(1px, 0.1em)')).toBe(true)
    expect(isLengthWidth('clamp(1px, 2vw, 4px)')).toBe(true)
    expect(isLengthWidth('thin')).toBe(true)
    expect(isLengthWidth('medium')).toBe(true)
    expect(isLengthWidth('thick')).toBe(true)
    expect(isLengthWidth('2')).toBe(true)
    expect(isLengthWidth('.5')).toBe(true)
    expect(isLengthWidth('solid')).toBe(false)
    expect(isLengthWidth('red')).toBe(false)
    expect(isLengthWidth('auto')).toBe(false)
  })

  it('recognizes CSS global keywords per CSS Cascading and Inheritance Level 4', () => {
    expect(isGlobalCssKeyword('inherit')).toBe(true)
    expect(isGlobalCssKeyword('initial')).toBe(true)
    expect(isGlobalCssKeyword('unset')).toBe(true)
    expect(isGlobalCssKeyword('revert')).toBe(true)
    expect(isGlobalCssKeyword('revert-layer')).toBe(true)
    expect(isGlobalCssKeyword('solid')).toBe(false)
  })

  it('recognizes valid border styles and outline-specific auto style', () => {
    expect(isBorderStyle('solid')).toBe(true)
    expect(isBorderStyle('dashed')).toBe(true)
    expect(isBorderStyle('dotted')).toBe(true)
    expect(isBorderStyle('double')).toBe(true)
    expect(isBorderStyle('groove')).toBe(true)
    expect(isBorderStyle('ridge')).toBe(true)
    expect(isBorderStyle('inset')).toBe(true)
    expect(isBorderStyle('outset')).toBe(true)
    expect(isBorderStyle('hidden')).toBe(true)
    expect(isBorderStyle('none')).toBe(true)
    expect(isBorderStyle('auto')).toBe(false) // auto is not a valid border-style

    // CSS UI Level 4: outline-style accepts auto
    expect(isOutlineStyle('auto')).toBe(true)
    expect(isOutlineStyle('solid')).toBe(true)
  })
})

describe('borderShorthandUtilities - order independence & permutations', () => {
  // W3C CSS Backgrounds and Borders Module Level 3 § 4.4:
  // border: [ <line-width> || <line-style> || <color> ] in ANY order!

  it('handles [width, style, color] order', () => {
    expect(
      borderShorthandUtilities.border.transform('1px solid colors.gray.800', {
        raw: '1px solid colors.gray.800',
        token,
      }),
    ).toEqual({
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--colors-gray-800)',
    })
  })

  it('handles [style, width, color] order', () => {
    expect(
      borderShorthandUtilities.border.transform('solid 1px colors.gray.800', {
        raw: 'solid 1px colors.gray.800',
        token,
      }),
    ).toEqual({
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--colors-gray-800)',
    })
  })

  it('handles [color, width, style] order', () => {
    expect(
      borderShorthandUtilities.border.transform('colors.gray.800 1px solid', {
        raw: 'colors.gray.800 1px solid',
        token,
      }),
    ).toEqual({
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--colors-gray-800)',
    })
  })

  it('handles [color, style, width] order', () => {
    expect(
      borderShorthandUtilities.border.transform('colors.gray.800 solid 1px', {
        raw: 'colors.gray.800 solid 1px',
        token,
      }),
    ).toEqual({
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--colors-gray-800)',
    })
  })

  it('handles [style, color, width] order', () => {
    expect(
      borderShorthandUtilities.border.transform('solid colors.gray.800 1px', {
        raw: 'solid colors.gray.800 1px',
        token,
      }),
    ).toEqual({
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--colors-gray-800)',
    })
  })

  it('handles [width, color, style] order', () => {
    expect(
      borderShorthandUtilities.border.transform('1px colors.gray.800 solid', {
        raw: '1px colors.gray.800 solid',
        token,
      }),
    ).toEqual({
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--colors-gray-800)',
    })
  })
})

describe('borderShorthandUtilities - omitted components & partial shorthands', () => {
  it('omits color when only width and style are passed (preserves separate borderColor)', () => {
    expect(
      borderShorthandUtilities.borderBottom.transform('1px solid', {
        raw: '1px solid',
        token,
      }),
    ).toEqual({
      borderBottomWidth: '1px',
      borderBottomStyle: 'solid',
    })
  })

  it('handles style only (e.g. border="solid")', () => {
    expect(
      borderShorthandUtilities.border.transform('solid', {
        raw: 'solid',
        token,
      }),
    ).toEqual({
      borderStyle: 'solid',
    })
  })

  it('handles width only (e.g. border="2px")', () => {
    expect(
      borderShorthandUtilities.border.transform('2px', {
        raw: '2px',
        token,
      }),
    ).toEqual({
      borderWidth: '2px',
    })
  })

  it('handles color only (e.g. border="colors.blue.600")', () => {
    expect(
      borderShorthandUtilities.border.transform('colors.blue.600', {
        raw: 'colors.blue.600',
        token,
      }),
    ).toEqual({
      borderColor: 'var(--colors-blue-600)',
    })
  })

  it('handles width + color without style (e.g. border="1px red")', () => {
    expect(
      borderShorthandUtilities.border.transform('1px colors.red.500', {
        raw: '1px colors.red.500',
        token,
      }),
    ).toEqual({
      borderWidth: '1px',
      borderColor: 'var(--colors-red-500)',
    })
  })

  it('handles style + color without width (e.g. border="dashed blue")', () => {
    expect(
      borderShorthandUtilities.border.transform('dashed colors.blue.600', {
        raw: 'dashed colors.blue.600',
        token,
      }),
    ).toEqual({
      borderStyle: 'dashed',
      borderColor: 'var(--colors-blue-600)',
    })
  })
})

describe('borderShorthandUtilities - advanced units & edge cases', () => {
  it('handles hairline widths with leading decimal (e.g. ".5px solid")', () => {
    expect(
      borderShorthandUtilities.borderBottom.transform('.5px solid', {
        raw: '.5px solid',
        token,
      }),
    ).toEqual({
      borderBottomWidth: '.5px',
      borderBottomStyle: 'solid',
    })
  })

  it('handles fractional rem and em (e.g. "0.25rem dashed")', () => {
    expect(
      borderShorthandUtilities.borderTop.transform('0.25rem dashed', {
        raw: '0.25rem dashed',
        token,
      }),
    ).toEqual({
      borderTopWidth: '0.25rem',
      borderTopStyle: 'dashed',
    })
  })

  it('resolves rhythm width units and fractions', () => {
    expect(
      borderShorthandUtilities.borderBottom.transform('2r solid', {
        raw: '2r solid',
        token,
      }),
    ).toEqual({
      borderBottomWidth: 'calc(2 * var(--spacing-root))',
      borderBottomStyle: 'solid',
    })

    expect(
      borderShorthandUtilities.borderBottom.transform('r solid', {
        raw: 'r solid',
        token,
      }),
    ).toEqual({
      borderBottomWidth: 'var(--spacing-root)',
      borderBottomStyle: 'solid',
    })

    expect(
      borderShorthandUtilities.borderLeft.transform('1/3r double', {
        raw: '1/3r double',
        token,
      }),
    ).toEqual({
      borderLeftWidth: 'calc(var(--spacing-root) / 3)',
      borderLeftStyle: 'double',
    })
  })

  it('does not misassign extra width tokens to color', () => {
    expect(
      borderShorthandUtilities.border.transform('1px 2px solid', {
        raw: '1px 2px solid',
        token,
      }),
    ).toEqual({
      borderWidth: '1px',
      borderStyle: 'solid',
    })
  })

  it('handles CSS math functions (calc, min, max, clamp)', () => {
    expect(
      borderShorthandUtilities.borderBottom.transform('calc(1px + 2px) solid', {
        raw: 'calc(1px + 2px) solid',
        token,
      }),
    ).toEqual({
      borderBottomWidth: 'calc(1px + 2px)',
      borderBottomStyle: 'solid',
    })

    expect(
      borderShorthandUtilities.borderRight.transform('clamp(1px, 2vw, 4px) dotted', {
        raw: 'clamp(1px, 2vw, 4px) dotted',
        token,
      }),
    ).toEqual({
      borderRightWidth: 'clamp(1px, 2vw, 4px)',
      borderRightStyle: 'dotted',
    })
  })

  it('handles CSS line-width keywords (thin, medium, thick)', () => {
    expect(
      borderShorthandUtilities.border.transform('thin solid', {
        raw: 'thin solid',
        token,
      }),
    ).toEqual({
      borderWidth: 'thin',
      borderStyle: 'solid',
    })
    expect(
      borderShorthandUtilities.border.transform('thick dashed', {
        raw: 'thick dashed',
        token,
      }),
    ).toEqual({
      borderWidth: 'thick',
      borderStyle: 'dashed',
    })
  })

  it('handles modern CSS color functions (color-mix, oklch, light-dark)', () => {
    expect(
      borderShorthandUtilities.borderBottom.transform('1px solid color-mix(in srgb, red 50%, blue)', {
        raw: '1px solid color-mix(in srgb, red 50%, blue)',
        token,
      }),
    ).toEqual({
      borderBottomWidth: '1px',
      borderBottomStyle: 'solid',
      borderBottomColor: 'color-mix(in srgb, red 50%, blue)',
    })

    expect(
      borderShorthandUtilities.borderBottom.transform('2px solid oklch(0.6 0.25 150)', {
        raw: '2px solid oklch(0.6 0.25 150)',
        token,
      }),
    ).toEqual({
      borderBottomWidth: '2px',
      borderBottomStyle: 'solid',
      borderBottomColor: 'oklch(0.6 0.25 150)',
    })
  })

  it('handles CSS variables with fallbacks in color', () => {
    expect(
      borderShorthandUtilities.borderBottom.transform('1px solid var(--custom-color, #333)', {
        raw: '1px solid var(--custom-color, #333)',
        token,
      }),
    ).toEqual({
      borderBottomWidth: '1px',
      borderBottomStyle: 'solid',
      borderBottomColor: 'var(--custom-color, #333)',
    })
  })

  it('handles "none" correctly', () => {
    expect(
      borderShorthandUtilities.borderBottom.transform('none', {
        raw: 'none',
        token,
      }),
    ).toEqual({
      borderBottom: 'none',
    })
  })

  it('handles all variations of zero width (0, "0", "0px", "0rem")', () => {
    expect(
      borderShorthandUtilities.borderBottom.transform(0, {
        raw: 0,
        token,
      }),
    ).toEqual({
      borderBottomWidth: '0px',
    })
    expect(
      borderShorthandUtilities.borderBottom.transform('0', {
        raw: '0',
        token,
      }),
    ).toEqual({
      borderBottomWidth: '0px',
    })
    expect(
      borderShorthandUtilities.borderBottom.transform('0px', {
        raw: '0px',
        token,
      }),
    ).toEqual({
      borderBottomWidth: '0px',
    })
    expect(
      borderShorthandUtilities.borderBottom.transform('0rem', {
        raw: '0rem',
        token,
      }),
    ).toEqual({
      borderBottomWidth: '0px',
    })
  })

  it('preserves CSS global keywords (inherit, initial, unset, revert)', () => {
    for (const kw of ['inherit', 'initial', 'unset', 'revert', 'revert-layer']) {
      expect(
        borderShorthandUtilities.borderBottom.transform(kw, {
          raw: kw,
          token,
        }),
      ).toEqual({
        borderBottom: kw,
      })
    }
  })

  it('preserves whole-value CSS variables and token paths', () => {
    expect(
      borderShorthandUtilities.border.transform('var(--panel-border)', {
        raw: 'var(--panel-border)',
        token,
      }),
    ).toEqual({
      border: 'var(--panel-border)',
    })
    expect(
      borderShorthandUtilities.border.transform('borders.subtle', {
        raw: 'borders.subtle',
        token,
      }),
    ).toEqual({
      border: 'borders.subtle',
    })
  })

  it('supports custom utility creation via createBorderShorthandUtility factory', () => {
    const custom = createBorderShorthandUtility({
      className: 'custom-bd',
      values: 'borders',
      group: 'Border',
      mainProp: 'customBorder',
      widthProp: 'customBorderWidth',
      styleProp: 'customBorderStyle',
      colorProp: 'customBorderColor',
    })

    expect(
      custom.transform('1px solid colors.gray.800', {
        raw: '1px solid colors.gray.800',
        token,
      }),
    ).toEqual({
      customBorderWidth: '1px',
      customBorderStyle: 'solid',
      customBorderColor: 'var(--colors-gray-800)',
    })
  })
})

describe('outlineShorthandUtilities - CSS spec & edge cases', () => {
  it('decomposes "2px solid" into outlineWidth and outlineStyle without color', () => {
    expect(
      outlineShorthandUtilities.outline.transform('2px solid', {
        raw: '2px solid',
        token,
      }),
    ).toEqual({
      outlineWidth: '2px',
      outlineStyle: 'solid',
    })
  })

  it('supports CSS UI Level 4 outline-style: auto (platform focus ring)', () => {
    expect(
      outlineShorthandUtilities.outline.transform('auto', {
        raw: 'auto',
        token,
      }),
    ).toEqual({
      outlineStyle: 'auto',
    })
    expect(
      outlineShorthandUtilities.outline.transform('3px auto', {
        raw: '3px auto',
        token,
      }),
    ).toEqual({
      outlineWidth: '3px',
      outlineStyle: 'auto',
    })
  })

  it('handles all 6 permutations of [width, style, color] for outline', () => {
    const expected = {
      outlineWidth: '1px',
      outlineStyle: 'solid',
      outlineColor: 'var(--colors-blue-600)',
    }

    expect(
      outlineShorthandUtilities.outline.transform('1px solid colors.blue.600', {
        raw: '1px solid colors.blue.600',
        token,
      }),
    ).toEqual(expected)

    expect(
      outlineShorthandUtilities.outline.transform('solid 1px colors.blue.600', {
        raw: 'solid 1px colors.blue.600',
        token,
      }),
    ).toEqual(expected)

    expect(
      outlineShorthandUtilities.outline.transform('colors.blue.600 1px solid', {
        raw: 'colors.blue.600 1px solid',
        token,
      }),
    ).toEqual(expected)

    expect(
      outlineShorthandUtilities.outline.transform('colors.blue.600 solid 1px', {
        raw: 'colors.blue.600 solid 1px',
        token,
      }),
    ).toEqual(expected)

    expect(
      outlineShorthandUtilities.outline.transform('solid colors.blue.600 1px', {
        raw: 'solid colors.blue.600 1px',
        token,
      }),
    ).toEqual(expected)

    expect(
      outlineShorthandUtilities.outline.transform('1px colors.blue.600 solid', {
        raw: '1px colors.blue.600 solid',
        token,
      }),
    ).toEqual(expected)
  })

  it('supports accessible outline="none" convention (transparent outline for high-contrast mode)', () => {
    expect(
      outlineShorthandUtilities.outline.transform('none', {
        raw: 'none',
        token,
      }),
    ).toEqual({
      outline: '2px solid transparent',
      outlineOffset: '2px',
    })
  })

  it('handles all zero formats for outline (0, "0", "0px", "0rem")', () => {
    expect(
      outlineShorthandUtilities.outline.transform(0, {
        raw: 0,
        token,
      }),
    ).toEqual({
      outlineWidth: '0px',
    })
    expect(
      outlineShorthandUtilities.outline.transform('0px', {
        raw: '0px',
        token,
      }),
    ).toEqual({
      outlineWidth: '0px',
    })
  })

  it('handles CSS math functions and rhythm units in outline', () => {
    expect(
      outlineShorthandUtilities.outline.transform('calc(1px + 1px) dashed', {
        raw: 'calc(1px + 1px) dashed',
        token,
      }),
    ).toEqual({
      outlineWidth: 'calc(1px + 1px)',
      outlineStyle: 'dashed',
    })

    expect(
      outlineShorthandUtilities.outline.transform('1/2r solid', {
        raw: '1/2r solid',
        token,
      }),
    ).toEqual({
      outlineWidth: 'calc(var(--spacing-root) / 2)',
      outlineStyle: 'solid',
    })
  })

  it('preserves whole-value CSS variables and outlines token paths', () => {
    expect(
      outlineShorthandUtilities.outline.transform('var(--focus-outline)', {
        raw: 'var(--focus-outline)',
        token,
      }),
    ).toEqual({
      outline: 'var(--focus-outline)',
    })
    expect(
      outlineShorthandUtilities.outline.transform('outlines.focus', {
        raw: 'outlines.focus',
        token,
      }),
    ).toEqual({
      outline: 'outlines.focus',
    })
  })

  it('preserves global CSS keywords for outline', () => {
    for (const kw of ['inherit', 'initial', 'unset', 'revert', 'revert-layer']) {
      expect(
        outlineShorthandUtilities.outline.transform(kw, {
          raw: kw,
          token,
        }),
      ).toEqual({
        outline: kw,
      })
    }
  })

  it('supports custom outline utility creation via createOutlineShorthandUtility factory', () => {
    const custom = createOutlineShorthandUtility({
      className: 'custom-ring',
      mainProp: 'customOutline',
      widthProp: 'customOutlineWidth',
      styleProp: 'customOutlineStyle',
      colorProp: 'customOutlineColor',
    })

    expect(
      custom.transform('2px solid colors.blue.600', {
        raw: '2px solid colors.blue.600',
        token,
      }),
    ).toEqual({
      customOutlineWidth: '2px',
      customOutlineStyle: 'solid',
      customOutlineColor: 'var(--colors-blue-600)',
    })
  })
})

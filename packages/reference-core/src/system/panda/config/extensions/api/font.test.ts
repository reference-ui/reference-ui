import { afterEach, describe, expect, it } from 'vitest'
import type { FontDefinition } from '../../../../api/font'
import {
  buildFontFaces,
  buildFontPatternExtensions,
  buildFontRecipes,
  buildFontTokens,
} from './font'
import { extendPatterns } from './extendPatterns'
import { getPandaConfig, initPandaConfig, PANDA_CONFIG_GLOBAL_KEY } from './runtime'
import { PRIMITIVE_JSX_NAMES } from '../../../../primitives/tags'

const fonts: FontDefinition[] = [
  {
    name: 'sans',
    value: '"Inter", ui-sans-serif, sans-serif',
    fontFace: {
      src: 'url(/fonts/inter.woff2) format("woff2")',
      fontWeight: '200 900',
    },
    weights: {
      normal: '400',
      bold: '700',
    },
    css: {
      letterSpacing: '-0.01em',
    },
  },
]

const fontsWithMultipleFontFaces: FontDefinition[] = [
  {
    ...fonts[0],
    fontFace: [
      {
        src: 'url(/fonts/inter.woff2) format("woff2")',
        fontWeight: '200 900',
        fontStyle: 'normal',
      },
      {
        src: 'url(/fonts/inter-italic.woff2) format("woff2")',
        fontWeight: '200 900',
        fontStyle: 'italic',
      },
    ],
  },
]

afterEach(() => {
  delete (globalThis as Record<string, unknown>)[PANDA_CONFIG_GLOBAL_KEY]
})

describe('font config helpers', () => {
  it('builds token fragments from collected font definitions', () => {
    expect(buildFontTokens(fonts)).toEqual({
      fonts: {
        sans: { value: '"Inter", ui-sans-serif, sans-serif' },
      },
      fontWeights: {
        sans: {
          normal: { value: '400' },
          bold: { value: '700' },
        },
      },
    })
  })

  it('builds global font-face config with parsed family names', () => {
    expect(buildFontFaces(fonts)).toEqual({
      Inter: {
        src: 'url(/fonts/inter.woff2) format("woff2")',
        fontDisplay: 'swap',
        fontWeight: '200 900',
      },
    })
  })

  it('preserves every authored font-face entry for one family', () => {
    expect(buildFontFaces(fontsWithMultipleFontFaces)).toEqual({
      Inter: [
        {
          src: 'url(/fonts/inter.woff2) format("woff2")',
          fontDisplay: 'swap',
          fontWeight: '200 900',
          fontStyle: 'normal',
        },
        {
          src: 'url(/fonts/inter-italic.woff2) format("woff2")',
          fontDisplay: 'swap',
          fontWeight: '200 900',
          fontStyle: 'italic',
        },
      ],
    })
  })

  it('builds a font recipe with css overrides', () => {
    expect(buildFontRecipes(fonts)).toEqual({
      fontStyle: {
        className: 'r_font',
        variants: {
          font: {
            sans: {
              fontFamily: 'sans',
              fontWeight: '400',
              letterSpacing: '-0.01em',
            },
          },
        },
      },
    })
  })

  it('creates a self-contained pattern extension for font and weight props', () => {
    initPandaConfig({})

    extendPatterns(buildFontPatternExtensions(fonts))

    const config = getPandaConfig()
    const boxPattern = config.patterns?.extend?.box
    const transform = boxPattern?.transform as
      | ((props: Record<string, unknown>) => Record<string, unknown>)
      | undefined

    expect(boxPattern?.jsx).toEqual(PRIMITIVE_JSX_NAMES)
    expect(boxPattern?.properties).toEqual({
      font: { type: 'string' },
      weight: { type: 'string' },
    })
    expect(boxPattern?.blocklist).toEqual(['font', 'weight'])
    expect(transform).toBeTypeOf('function')
    expect(
      transform?.({
        font: 'sans',
        weight: 'bold',
        color: 'red.500',
      })
    ).toEqual({
      fontFamily: 'sans',
      fontWeight: '700',
      letterSpacing: '-0.01em',
      color: 'red.500',
    })

    expect(
      transform?.({
        font: 'sans',
        weight: 'sans.bold',
      })
    ).toEqual({
      fontFamily: 'sans',
      fontWeight: '700',
      letterSpacing: '-0.01em',
    })
  })

  it('preserves additional traced JSX names when font extensions are applied', () => {
    initPandaConfig({})

    extendPatterns(buildFontPatternExtensions(fonts), ['ToolbarIcon'])

    const config = getPandaConfig()
    const boxPattern = config.patterns?.extend?.box

    expect(boxPattern?.jsx).toEqual([...PRIMITIVE_JSX_NAMES, 'ToolbarIcon'])
  })
})

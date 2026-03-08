import type { Config } from '@pandacss/dev'
import type { FontDefinition, FontFaceRule } from '../../../../api/font'
import type { BoxPatternExtension } from '../../../../api/patterns'

type TokenFragment = Record<string, unknown>
type RecipeConfig = Record<string, unknown>
type FontPreset = Record<string, string>

function getPrimaryFontFace(fontFace: FontDefinition['fontFace']): FontFaceRule {
  return Array.isArray(fontFace) ? fontFace[0] ?? { src: '' } : fontFace
}

function getDefaultFontWeight(font: FontDefinition): string {
  return font.css?.fontWeight ?? font.weights.normal ?? '400'
}

function getFontPreset(font: FontDefinition): FontPreset {
  return {
    fontFamily: font.name,
    fontWeight: getDefaultFontWeight(font),
    ...font.css,
  }
}

function parseFontFamilyName(value: string): string {
  const match = value.match(/^["']([^"']+)["']/)
  if (match) {
    return match[1] ?? 'unknown'
  }

  return value.split(',')[0]?.trim() ?? 'unknown'
}

function createFontPatternTransform(
  presets: Record<string, FontPreset>,
  weightTokens: Record<string, string>
): BoxPatternExtension['transform'] {
  const transformSource = [
    'return function transform(props) {',
    '  const { font, weight } = props',
    `  const FONT_PRESETS = ${JSON.stringify(presets)}`,
    `  const WEIGHT_TOKENS = ${JSON.stringify(weightTokens)}`,
    '  const result = {}',
    '',
    "  if (font && typeof font === 'string' && FONT_PRESETS[font]) {",
    '    Object.assign(result, FONT_PRESETS[font])',
    '  }',
    '',
    "  if (weight && typeof weight === 'string' && WEIGHT_TOKENS[weight]) {",
    '    result.fontWeight = WEIGHT_TOKENS[weight]',
    '  }',
    '',
    '  return result',
    '}',
  ].join('\n')

  return new Function(transformSource)() as BoxPatternExtension['transform']
}

export function buildFontTokens(fonts: FontDefinition[]): TokenFragment {
  if (fonts.length === 0) {
    return {}
  }

  return {
    fonts: Object.fromEntries(
      fonts.map((font) => [font.name, { value: font.value }])
    ),
    fontWeights: Object.fromEntries(
      fonts.flatMap((font) =>
        Object.entries(font.weights).map(([weightName, weightValue]) => [
          `${font.name}.${weightName}`,
          { value: weightValue },
        ])
      )
    ),
  }
}

export function buildFontFaces(fonts: FontDefinition[]): NonNullable<Config['globalFontface']> {
  return Object.fromEntries(
    fonts.flatMap((font) => {
      const fontFace = getPrimaryFontFace(font.fontFace)

      if (!fontFace.src) {
        return []
      }

      return [
        [
          parseFontFamilyName(font.value),
          {
            src: fontFace.src,
            fontDisplay: fontFace.fontDisplay ?? 'swap',
            ...(fontFace.fontWeight ? { fontWeight: fontFace.fontWeight } : {}),
            ...(fontFace.fontStyle ? { fontStyle: fontFace.fontStyle } : {}),
            ...(fontFace.sizeAdjust ? { sizeAdjust: fontFace.sizeAdjust } : {}),
            ...(fontFace.descentOverride
              ? { descentOverride: fontFace.descentOverride }
              : {}),
          },
        ],
      ]
    })
  ) as NonNullable<Config['globalFontface']>
}

export function buildFontRecipes(fonts: FontDefinition[]): RecipeConfig {
  if (fonts.length === 0) {
    return {}
  }

  return {
    fontStyle: {
      className: 'r_font',
      variants: {
        font: Object.fromEntries(
          fonts.map((font) => [font.name, getFontPreset(font)])
        ),
      },
    },
  }
}

export function buildFontPatternExtensions(fonts: FontDefinition[]): BoxPatternExtension[] {
  if (fonts.length === 0) {
    return []
  }

  const presets = Object.fromEntries(
    fonts.map((font) => [font.name, getFontPreset(font)])
  )
  const weightTokens = Object.fromEntries(
    fonts.flatMap((font) =>
      Object.entries(font.weights).map(([weightName, weightValue]) => [
        `${font.name}.${weightName}`,
        weightValue,
      ])
    )
  )

  return [
    {
      properties: {
        font: { type: 'string' },
        weight: { type: 'string' },
      },
      transform: createFontPatternTransform(presets, weightTokens),
    },
  ]
}

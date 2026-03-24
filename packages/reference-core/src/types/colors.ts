import type { UtilityValues } from '@reference-ui/styled/types/prop-type'
import type { SystemProperties } from '@reference-ui/styled/types/style-props'
import type { StylePropValue } from './style-prop'

/**
 * Color-bearing style props exposed on primitives and public style helpers.
 * These are narrowed back to design tokens so arbitrary CSS color strings
 * do not leak through Panda's wider generated unions.
 */
export const COLOR_PROP_KEYS = [
  'accentColor',
  'backgroundColor',
  'bg',
  'bgColor',
  'borderBlockColor',
  'borderBlockEndColor',
  'borderBlockStartColor',
  'borderBottomColor',
  'borderColor',
  'borderEndColor',
  'borderInlineColor',
  'borderInlineEndColor',
  'borderInlineStartColor',
  'borderLeftColor',
  'borderRightColor',
  'borderStartColor',
  'borderTopColor',
  'borderXColor',
  'borderYColor',
  'boxShadowColor',
  'caretColor',
  'color',
  'columnRuleColor',
  'divideColor',
  'fill',
  'floodColor',
  'focusRingColor',
  'lightingColor',
  'outlineColor',
  'ringColor',
  'scrollbarColor',
  'shadowColor',
  'stopColor',
  'stroke',
  'textDecorationColor',
  'textEmphasisColor',
  'textShadowColor',
  'WebkitBorderBeforeColor',
  'WebkitTapHighlightColor',
  'WebkitTextFillColor',
  'WebkitTextStrokeColor',
] as const

export type ColorPropKeys = (typeof COLOR_PROP_KEYS)[number]

type ColorToken = UtilityValues['backgroundColor']

export type SafeColorProps = {
  [K in Extract<keyof SystemProperties, ColorPropKeys>]?: StylePropValue<ColorToken>
}

export type StrictColorProps<P> = Omit<P, ColorPropKeys> & SafeColorProps

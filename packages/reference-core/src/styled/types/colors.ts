/**
 * Color props restricted to design tokens only.
 * Single source of truth for the strict color wrap (primitives + css()).
 */

import type { ConditionalValue } from '../../system/types/conditions'
import type { ColorToken } from '../../system/tokens/index'
import type { SystemProperties } from '../../system/types/style-props'

/** Style prop names that accept a color value (restricted to ColorToken). */
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

/**
 * Color props restricted to design tokens only (ConditionalValue for responsive/conditional).
 */
export type SafeColorProps = {
  [K in Extract<keyof SystemProperties, ColorPropKeys>]?: ConditionalValue<ColorToken>
}

/**
 * Props type with color keys restricted to ColorToken only (strict color props).
 */
export type StrictColorProps<P> = Omit<P, ColorPropKeys> & SafeColorProps

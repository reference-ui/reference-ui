/**
 * Deprecated CSS system colors — excluded from primitive/style props so we don't
 * suggest or encourage values like "Background" or "ButtonFace".
 * Single source of truth for the omit-deprecated-colors wrap (primitives + css()).
 */

/** CSS deprecated system color keywords (from csstype DataType.DeprecatedSystemColor). */
export type DeprecatedSystemColors =
  | 'ActiveBorder'
  | 'ActiveCaption'
  | 'AppWorkspace'
  | 'Background'
  | 'ButtonFace'
  | 'ButtonHighlight'
  | 'ButtonShadow'
  | 'ButtonText'
  | 'CaptionText'
  | 'GrayText'
  | 'Highlight'
  | 'HighlightText'
  | 'InactiveBorder'
  | 'InactiveCaption'
  | 'InactiveCaptionText'
  | 'InfoBackground'
  | 'InfoText'
  | 'Menu'
  | 'MenuText'
  | 'Scrollbar'
  | 'ThreeDDarkShadow'
  | 'ThreeDFace'
  | 'ThreeDHighlight'
  | 'ThreeDLightShadow'
  | 'ThreeDShadow'
  | 'Window'
  | 'WindowFrame'
  | 'WindowText'

/** Style prop names that accept a color value (so we strip deprecated system colors from their type). */
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
 * Removes deprecated system color literals from color-related props of P.
 * Used so primitives and css() don't suggest/accept "Background", "ButtonFace", etc.
 */
export type OmitDeprecatedColorProps<P> = Omit<P, ColorPropKeys> & {
  [K in Extract<keyof P, ColorPropKeys>]?: P[K] extends infer V ? Exclude<V, DeprecatedSystemColors> : never
}

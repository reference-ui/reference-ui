export type ColorToken = 'brand.primary' | 'n100' | 'n300'

export type SpacingToken = '1' | '1/2r' | '1r' | '2' | '2r' | '4'

export type RadiusToken = 'full' | 'lg' | 'md' | 'none' | 'sm'

export type FontSizeToken = 'base' | 'lg' | 'sm' | 'xs'

export type FontWeightToken = 'bold' | 'medium' | 'regular'

export type LineHeightToken = 'normal' | 'tight'

export type ShadowToken = 'md' | 'overlay' | 'sm'

export type ZIndexToken = 'modal' | 'toast' | 'tooltip'

export interface Tokens {
  colors: ColorToken
  spacing: SpacingToken
  radii: RadiusToken
  fontSizes: FontSizeToken
  fontWeights: FontWeightToken
  lineHeights: LineHeightToken
  shadows: ShadowToken
  zIndex: ZIndexToken
}

export interface FontRegistry {}

export type StyleConditionKey =
  | '@2xl'
  | '@lg'
  | '@md'
  | '@sm'
  | '@xl'
  | '_active'
  | '_after'
  | '_autofill'
  | '_backdrop'
  | '_before'
  | '_checked'
  | '_closed'
  | '_current'
  | '_currentPage'
  | '_currentStep'
  | '_dark'
  | '_default'
  | '_disabled'
  | '_dragging'
  | '_empty'
  | '_enabled'
  | '_even'
  | '_expanded'
  | '_first'
  | '_firstOfType'
  | '_focus'
  | '_focusVisible'
  | '_focusWithin'
  | '_fullscreen'
  | '_grabbed'
  | '_groupActive'
  | '_groupChecked'
  | '_groupDisabled'
  | '_groupExpanded'
  | '_groupFocus'
  | '_groupFocusVisible'
  | '_groupHover'
  | '_groupInvalid'
  | '_highContrast'
  | '_hover'
  | '_indeterminate'
  | '_invalid'
  | '_landscape'
  | '_last'
  | '_lastOfType'
  | '_lessContrast'
  | '_light'
  | '_loading'
  | '_ltr'
  | '_marker'
  | '_moreContrast'
  | '_motionReduce'
  | '_motionSafe'
  | '_odd'
  | '_only'
  | '_onlyOfType'
  | '_open'
  | '_optional'
  | '_osDark'
  | '_osLight'
  | '_peerActive'
  | '_peerChecked'
  | '_peerDisabled'
  | '_peerExpanded'
  | '_peerFocus'
  | '_peerFocusVisible'
  | '_peerHover'
  | '_peerInvalid'
  | '_placeholder'
  | '_placeholderShown'
  | '_portrait'
  | '_print'
  | '_readOnly'
  | '_readWrite'
  | '_required'
  | '_rtl'
  | '_selected'
  | '_selection'
  | '_target'
  | '_userInvalid'
  | '_userValid'
  | '_valid'
  | '_visited'

export type StylePropValue<T> = T | Array<T | null> | { [K in StyleConditionKey]?: T }

type StringKey<T> = Extract<keyof T, string>

export type FontName = StringKey<FontRegistry>

export type FontWeightName<TFont extends FontName> = StringKey<FontRegistry[TFont]>

export type ScopedFontWeight<TFont extends FontName> = `${TFont}.${FontWeightName<TFont>}`

export type FontWeightValue<TFont extends FontName> =
  | FontWeightName<TFont>
  | ScopedFontWeight<TFont>

type ScopedFontProps = {
  [TFont in FontName]: {
    font?: StylePropValue<TFont>
    weight?: StylePropValue<FontWeightValue<TFont>>
  }
}[FontName]

type FallbackFontProps = {
  font?: StylePropValue<string>
  weight?: StylePropValue<string>
}

export type FontProps = [FontName] extends [never] ? FallbackFontProps : ScopedFontProps

export type StyleProps = FontProps & {
  accentColor?: StylePropValue<ColorToken | (string & {})>
  background?: StylePropValue<ColorToken | (string & {})>
  backgroundColor?: StylePropValue<ColorToken | (string & {})>
  bg?: StylePropValue<ColorToken | (string & {})>
  border?: StylePropValue<ColorToken | (string & {})>
  borderBlockColor?: StylePropValue<ColorToken | (string & {})>
  borderBlockEnd?: StylePropValue<ColorToken | (string & {})>
  borderBlockEndColor?: StylePropValue<ColorToken | (string & {})>
  borderBlockEndRadius?: StylePropValue<RadiusToken | (string & {})>
  borderBlockStart?: StylePropValue<ColorToken | (string & {})>
  borderBlockStartColor?: StylePropValue<ColorToken | (string & {})>
  borderBlockStartRadius?: StylePropValue<RadiusToken | (string & {})>
  borderBottom?: StylePropValue<ColorToken | (string & {})>
  borderBottomColor?: StylePropValue<ColorToken | (string & {})>
  borderBottomLeftRadius?: StylePropValue<RadiusToken | (string & {})>
  borderBottomRadius?: StylePropValue<RadiusToken | (string & {})>
  borderBottomRightRadius?: StylePropValue<RadiusToken | (string & {})>
  borderColor?: StylePropValue<ColorToken | (string & {})>
  borderEndEndRadius?: StylePropValue<RadiusToken | (string & {})>
  borderEndRadius?: StylePropValue<RadiusToken | (string & {})>
  borderEndStartRadius?: StylePropValue<RadiusToken | (string & {})>
  borderInlineColor?: StylePropValue<ColorToken | (string & {})>
  borderInlineEnd?: StylePropValue<ColorToken | (string & {})>
  borderInlineEndColor?: StylePropValue<ColorToken | (string & {})>
  borderInlineEndRadius?: StylePropValue<RadiusToken | (string & {})>
  borderInlineStart?: StylePropValue<ColorToken | (string & {})>
  borderInlineStartColor?: StylePropValue<ColorToken | (string & {})>
  borderInlineStartRadius?: StylePropValue<RadiusToken | (string & {})>
  borderLeft?: StylePropValue<ColorToken | (string & {})>
  borderLeftColor?: StylePropValue<ColorToken | (string & {})>
  borderLeftRadius?: StylePropValue<RadiusToken | (string & {})>
  borderRadius?: StylePropValue<RadiusToken | (string & {})>
  borderRight?: StylePropValue<ColorToken | (string & {})>
  borderRightColor?: StylePropValue<ColorToken | (string & {})>
  borderRightRadius?: StylePropValue<RadiusToken | (string & {})>
  borderStartEndRadius?: StylePropValue<RadiusToken | (string & {})>
  borderStartRadius?: StylePropValue<RadiusToken | (string & {})>
  borderStartStartRadius?: StylePropValue<RadiusToken | (string & {})>
  borderTop?: StylePropValue<ColorToken | (string & {})>
  borderTopColor?: StylePropValue<ColorToken | (string & {})>
  borderTopLeftRadius?: StylePropValue<RadiusToken | (string & {})>
  borderTopRadius?: StylePropValue<RadiusToken | (string & {})>
  borderTopRightRadius?: StylePropValue<RadiusToken | (string & {})>
  boxShadowColor?: StylePropValue<ColorToken | (string & {})>
  caretColor?: StylePropValue<ColorToken | (string & {})>
  color?: StylePropValue<ColorToken | (string & {})>
  columnRuleColor?: StylePropValue<ColorToken | (string & {})>
  container?: StylePropValue<string | boolean>
  fill?: StylePropValue<ColorToken | (string & {})>
  fillColor?: StylePropValue<ColorToken | (string & {})>
  fillImage?: StylePropValue<ColorToken | (string & {})>
  floodColor?: StylePropValue<ColorToken | (string & {})>
  gradientFrom?: StylePropValue<ColorToken | (string & {})>
  gradientTo?: StylePropValue<ColorToken | (string & {})>
  gradientVia?: StylePropValue<ColorToken | (string & {})>
  lightingColor?: StylePropValue<ColorToken | (string & {})>
  m?: StylePropValue<SpacingToken | (string & {})>
  margin?: StylePropValue<SpacingToken | (string & {})>
  marginBlock?: StylePropValue<SpacingToken | (string & {})>
  marginBottom?: StylePropValue<SpacingToken | (string & {})>
  marginInline?: StylePropValue<SpacingToken | (string & {})>
  marginLeft?: StylePropValue<SpacingToken | (string & {})>
  marginRight?: StylePropValue<SpacingToken | (string & {})>
  marginTop?: StylePropValue<SpacingToken | (string & {})>
  mb?: StylePropValue<SpacingToken | (string & {})>
  ml?: StylePropValue<SpacingToken | (string & {})>
  mr?: StylePropValue<SpacingToken | (string & {})>
  mt?: StylePropValue<SpacingToken | (string & {})>
  mx?: StylePropValue<SpacingToken | (string & {})>
  my?: StylePropValue<SpacingToken | (string & {})>
  outlineColor?: StylePropValue<ColorToken | (string & {})>
  p?: StylePropValue<SpacingToken | (string & {})>
  padding?: StylePropValue<SpacingToken | (string & {})>
  paddingBlock?: StylePropValue<SpacingToken | (string & {})>
  paddingBottom?: StylePropValue<SpacingToken | (string & {})>
  paddingInline?: StylePropValue<SpacingToken | (string & {})>
  paddingLeft?: StylePropValue<SpacingToken | (string & {})>
  paddingRight?: StylePropValue<SpacingToken | (string & {})>
  paddingTop?: StylePropValue<SpacingToken | (string & {})>
  pb?: StylePropValue<SpacingToken | (string & {})>
  pl?: StylePropValue<SpacingToken | (string & {})>
  pr?: StylePropValue<SpacingToken | (string & {})>
  pt?: StylePropValue<SpacingToken | (string & {})>
  px?: StylePropValue<SpacingToken | (string & {})>
  py?: StylePropValue<SpacingToken | (string & {})>
  r?: StylePropValue<Record<string | number, StyleProps>>
  rowRuleColor?: StylePropValue<ColorToken | (string & {})>
  ruleColor?: StylePropValue<ColorToken | (string & {})>
  scrollbarColor?: StylePropValue<ColorToken | (string & {})>
  stopColor?: StylePropValue<ColorToken | (string & {})>
  stroke?: StylePropValue<ColorToken | (string & {})>
  strokeColor?: StylePropValue<ColorToken | (string & {})>
  strokeImage?: StylePropValue<ColorToken | (string & {})>
  textDecorationColor?: StylePropValue<ColorToken | (string & {})>
  textEmphasisColor?: StylePropValue<ColorToken | (string & {})>
  textShadowColor?: StylePropValue<ColorToken | (string & {})>
  webkitTextFillColor?: StylePropValue<ColorToken | (string & {})>
  webkitTextStroke?: StylePropValue<ColorToken | (string & {})>
  webkitTextStrokeColor?: StylePropValue<ColorToken | (string & {})>
}

export type SystemStyleObject = StyleProps & {
  [K in StyleConditionKey]?: SystemStyleObject
} & {
  [K in `&${string}`]?: SystemStyleObject
}

export type ColorToken = 'brand.primary' | 'n100' | 'n300';

export type SpacingToken = '1' | '1/2r' | '1r' | '2' | '2r' | '4';

export type RadiusToken = 'full' | 'lg' | 'md' | 'none' | 'sm';

export type FontSizeToken = 'base' | 'lg' | 'sm' | 'xs';

export type FontWeightToken = 'bold' | 'medium' | 'regular';

export type LineHeightToken = 'normal' | 'tight';

export type ShadowToken = 'md' | 'overlay' | 'sm';

export type ZIndexToken = 'modal' | 'toast' | 'tooltip';

export interface Tokens {
  colors: ColorToken;
  spacing: SpacingToken;
  radii: RadiusToken;
  fontSizes: FontSizeToken;
  fontWeights: FontWeightToken;
  lineHeights: LineHeightToken;
  shadows: ShadowToken;
  zIndex: ZIndexToken;
}

export interface FontRegistry {}

export type StyleConditionKey = '@2xl' | '@lg' | '@md' | '@sm' | '@xl' | '_active' | '_after' | '_autofill' | '_backdrop' | '_before' | '_checked' | '_closed' | '_current' | '_currentPage' | '_currentStep' | '_dark' | '_default' | '_disabled' | '_dragging' | '_empty' | '_enabled' | '_even' | '_expanded' | '_file' | '_first' | '_firstOfType' | '_focus' | '_focusVisible' | '_focusWithin' | '_fullscreen' | '_grabbed' | '_groupActive' | '_groupChecked' | '_groupDisabled' | '_groupExpanded' | '_groupFocus' | '_groupFocusVisible' | '_groupHover' | '_groupInvalid' | '_highContrast' | '_hover' | '_indeterminate' | '_invalid' | '_landscape' | '_last' | '_lastOfType' | '_lessContrast' | '_light' | '_loading' | '_ltr' | '_marker' | '_moreContrast' | '_motionReduce' | '_motionSafe' | '_odd' | '_only' | '_onlyOfType' | '_open' | '_optional' | '_osDark' | '_osLight' | '_peerActive' | '_peerChecked' | '_peerDisabled' | '_peerExpanded' | '_peerFocus' | '_peerFocusVisible' | '_peerHover' | '_peerInvalid' | '_placeholder' | '_placeholderShown' | '_portrait' | '_print' | '_readOnly' | '_readWrite' | '_required' | '_rtl' | '_selected' | '_selection' | '_target' | '_userInvalid' | '_userValid' | '_valid' | '_visited';

export type StylePropValue<T> = T | Array<T | null> | { [K in StyleConditionKey]?: T };

type StringKey<T> = Extract<keyof T, string>;

export type FontName = StringKey<FontRegistry>;

export type FontWeightName<TFont extends FontName> =
  StringKey<FontRegistry[TFont]>;

export type ScopedFontWeight<TFont extends FontName> =
  `${TFont}.${FontWeightName<TFont>}`;

export type FontWeightValue<TFont extends FontName> =
  | FontWeightName<TFont>
  | ScopedFontWeight<TFont>;

type ScopedFontProps = {
  [TFont in FontName]: {
    font?: StylePropValue<TFont>;
    weight?: StylePropValue<FontWeightValue<TFont>>;
  };
}[FontName];

type FallbackFontProps = {
  font?: StylePropValue<string>;
  weight?: StylePropValue<string>;
};

export type FontProps = [FontName] extends [never]
  ? FallbackFontProps
  : ScopedFontProps;

export type StyleProps = FontProps & {
  [K in `--${string}`]?: StylePropValue<string | number>;
} & {
  MozAnimation?: StylePropValue<string | number>;
  MozAnimationDelay?: StylePropValue<string | number>;
  MozAnimationDirection?: StylePropValue<string | number>;
  MozAnimationDuration?: StylePropValue<string | number>;
  MozAnimationFillMode?: StylePropValue<string | number>;
  MozAnimationIterationCount?: StylePropValue<string | number>;
  MozAnimationName?: StylePropValue<string | number>;
  MozAnimationPlayState?: StylePropValue<string | number>;
  MozAnimationTimingFunction?: StylePropValue<string | number>;
  MozAppearance?: StylePropValue<string | number>;
  MozBackfaceVisibility?: StylePropValue<string | number>;
  MozBackgroundClip?: StylePropValue<string | number>;
  MozBackgroundOrigin?: StylePropValue<string | number>;
  MozBackgroundSize?: StylePropValue<string | number>;
  MozBinding?: StylePropValue<string | number>;
  MozBorderBottomColors?: StylePropValue<ColorToken | (string & {})>;
  MozBorderEndColor?: StylePropValue<ColorToken | (string & {})>;
  MozBorderEndStyle?: StylePropValue<string | number>;
  MozBorderEndWidth?: StylePropValue<string | number>;
  MozBorderImage?: StylePropValue<string | number>;
  MozBorderLeftColors?: StylePropValue<ColorToken | (string & {})>;
  MozBorderRadius?: StylePropValue<string | number>;
  MozBorderRadiusBottomleft?: StylePropValue<string | number>;
  MozBorderRadiusBottomright?: StylePropValue<string | number>;
  MozBorderRadiusTopleft?: StylePropValue<string | number>;
  MozBorderRadiusTopright?: StylePropValue<string | number>;
  MozBorderRightColors?: StylePropValue<ColorToken | (string & {})>;
  MozBorderStartColor?: StylePropValue<ColorToken | (string & {})>;
  MozBorderStartStyle?: StylePropValue<string | number>;
  MozBorderTopColors?: StylePropValue<ColorToken | (string & {})>;
  MozBoxAlign?: StylePropValue<string | number>;
  MozBoxDirection?: StylePropValue<string | number>;
  MozBoxFlex?: StylePropValue<string | number>;
  MozBoxOrdinalGroup?: StylePropValue<string | number>;
  MozBoxOrient?: StylePropValue<string | number>;
  MozBoxPack?: StylePropValue<string | number>;
  MozBoxShadow?: StylePropValue<string | number>;
  MozBoxSizing?: StylePropValue<string | number>;
  MozColumnCount?: StylePropValue<string | number>;
  MozColumnFill?: StylePropValue<string | number>;
  MozColumnRule?: StylePropValue<string | number>;
  MozColumnRuleColor?: StylePropValue<ColorToken | (string & {})>;
  MozColumnRuleStyle?: StylePropValue<string | number>;
  MozColumnRuleWidth?: StylePropValue<string | number>;
  MozColumnWidth?: StylePropValue<string | number>;
  MozColumns?: StylePropValue<string | number>;
  MozContextProperties?: StylePropValue<string | number>;
  MozFloatEdge?: StylePropValue<string | number>;
  MozFontFeatureSettings?: StylePropValue<string | number>;
  MozFontLanguageOverride?: StylePropValue<string | number>;
  MozForceBrokenImageIcon?: StylePropValue<string | number>;
  MozHyphens?: StylePropValue<string | number>;
  MozMarginEnd?: StylePropValue<string | number>;
  MozMarginStart?: StylePropValue<string | number>;
  MozOpacity?: StylePropValue<string | number>;
  MozOrient?: StylePropValue<string | number>;
  MozOsxFontSmoothing?: StylePropValue<string | number>;
  MozOutline?: StylePropValue<string | number>;
  MozOutlineColor?: StylePropValue<ColorToken | (string & {})>;
  MozOutlineRadius?: StylePropValue<string | number>;
  MozOutlineRadiusBottomleft?: StylePropValue<string | number>;
  MozOutlineRadiusBottomright?: StylePropValue<string | number>;
  MozOutlineRadiusTopleft?: StylePropValue<string | number>;
  MozOutlineRadiusTopright?: StylePropValue<string | number>;
  MozOutlineStyle?: StylePropValue<string | number>;
  MozOutlineWidth?: StylePropValue<string | number>;
  MozPaddingEnd?: StylePropValue<string | number>;
  MozPaddingStart?: StylePropValue<string | number>;
  MozPerspective?: StylePropValue<string | number>;
  MozPerspectiveOrigin?: StylePropValue<string | number>;
  MozStackSizing?: StylePropValue<string | number>;
  MozTabSize?: StylePropValue<string | number>;
  MozTextAlignLast?: StylePropValue<string | number>;
  MozTextBlink?: StylePropValue<string | number>;
  MozTextDecorationColor?: StylePropValue<ColorToken | (string & {})>;
  MozTextDecorationLine?: StylePropValue<string | number>;
  MozTextDecorationStyle?: StylePropValue<string | number>;
  MozTextSizeAdjust?: StylePropValue<string | number>;
  MozTransform?: StylePropValue<string | number>;
  MozTransformOrigin?: StylePropValue<string | number>;
  MozTransformStyle?: StylePropValue<string | number>;
  MozTransition?: StylePropValue<string | number>;
  MozTransitionDelay?: StylePropValue<string | number>;
  MozTransitionDuration?: StylePropValue<string | number>;
  MozTransitionProperty?: StylePropValue<string | number>;
  MozTransitionTimingFunction?: StylePropValue<string | number>;
  MozUserFocus?: StylePropValue<string | number>;
  MozUserInput?: StylePropValue<string | number>;
  MozUserModify?: StylePropValue<string | number>;
  MozUserSelect?: StylePropValue<string | number>;
  MozWindowDragging?: StylePropValue<string | number>;
  MozWindowShadow?: StylePropValue<string | number>;
  MsAccelerator?: StylePropValue<string | number>;
  MsBlockProgression?: StylePropValue<string | number>;
  MsContentZoomChaining?: StylePropValue<string | number>;
  MsContentZoomLimit?: StylePropValue<string | number>;
  MsContentZoomLimitMax?: StylePropValue<string | number>;
  MsContentZoomLimitMin?: StylePropValue<string | number>;
  MsContentZoomSnap?: StylePropValue<string | number>;
  MsContentZoomSnapPoints?: StylePropValue<string | number>;
  MsContentZoomSnapType?: StylePropValue<string | number>;
  MsContentZooming?: StylePropValue<string | number>;
  MsFilter?: StylePropValue<string | number>;
  MsFlex?: StylePropValue<string | number>;
  MsFlexDirection?: StylePropValue<string | number>;
  MsFlexPositive?: StylePropValue<string | number>;
  MsFlowFrom?: StylePropValue<string | number>;
  MsFlowInto?: StylePropValue<string | number>;
  MsGridColumns?: StylePropValue<string | number>;
  MsGridRows?: StylePropValue<string | number>;
  MsHighContrastAdjust?: StylePropValue<string | number>;
  MsHyphenateLimitChars?: StylePropValue<string | number>;
  MsHyphenateLimitLines?: StylePropValue<string | number>;
  MsHyphenateLimitZone?: StylePropValue<string | number>;
  MsHyphens?: StylePropValue<string | number>;
  MsImeAlign?: StylePropValue<string | number>;
  MsImeMode?: StylePropValue<string | number>;
  MsLineBreak?: StylePropValue<string | number>;
  MsOrder?: StylePropValue<string | number>;
  MsOverflowStyle?: StylePropValue<string | number>;
  MsOverflowX?: StylePropValue<string | number>;
  MsOverflowY?: StylePropValue<string | number>;
  MsScrollChaining?: StylePropValue<string | number>;
  MsScrollLimit?: StylePropValue<string | number>;
  MsScrollLimitXMax?: StylePropValue<string | number>;
  MsScrollLimitXMin?: StylePropValue<string | number>;
  MsScrollLimitYMax?: StylePropValue<string | number>;
  MsScrollLimitYMin?: StylePropValue<string | number>;
  MsScrollRails?: StylePropValue<string | number>;
  MsScrollSnapPointsX?: StylePropValue<string | number>;
  MsScrollSnapPointsY?: StylePropValue<string | number>;
  MsScrollSnapType?: StylePropValue<string | number>;
  MsScrollSnapX?: StylePropValue<string | number>;
  MsScrollSnapY?: StylePropValue<string | number>;
  MsScrollTranslation?: StylePropValue<string | number>;
  MsScrollbar3dlightColor?: StylePropValue<ColorToken | (string & {})>;
  MsScrollbarArrowColor?: StylePropValue<ColorToken | (string & {})>;
  MsScrollbarBaseColor?: StylePropValue<ColorToken | (string & {})>;
  MsScrollbarDarkshadowColor?: StylePropValue<ColorToken | (string & {})>;
  MsScrollbarFaceColor?: StylePropValue<ColorToken | (string & {})>;
  MsScrollbarHighlightColor?: StylePropValue<ColorToken | (string & {})>;
  MsScrollbarShadowColor?: StylePropValue<ColorToken | (string & {})>;
  MsScrollbarTrackColor?: StylePropValue<ColorToken | (string & {})>;
  MsTextAutospace?: StylePropValue<string | number>;
  MsTextCombineHorizontal?: StylePropValue<string | number>;
  MsTextOverflow?: StylePropValue<string | number>;
  MsTouchAction?: StylePropValue<string | number>;
  MsTouchSelect?: StylePropValue<string | number>;
  MsTransform?: StylePropValue<string | number>;
  MsTransformOrigin?: StylePropValue<string | number>;
  MsTransition?: StylePropValue<string | number>;
  MsTransitionDelay?: StylePropValue<string | number>;
  MsTransitionDuration?: StylePropValue<string | number>;
  MsTransitionProperty?: StylePropValue<string | number>;
  MsTransitionTimingFunction?: StylePropValue<string | number>;
  MsUserSelect?: StylePropValue<string | number>;
  MsWordBreak?: StylePropValue<string | number>;
  MsWrapFlow?: StylePropValue<string | number>;
  MsWrapMargin?: StylePropValue<string | number>;
  MsWrapThrough?: StylePropValue<string | number>;
  MsWritingMode?: StylePropValue<string | number>;
  WebkitAlignContent?: StylePropValue<string | number>;
  WebkitAlignItems?: StylePropValue<string | number>;
  WebkitAlignSelf?: StylePropValue<string | number>;
  WebkitAnimation?: StylePropValue<string | number>;
  WebkitAnimationDelay?: StylePropValue<string | number>;
  WebkitAnimationDirection?: StylePropValue<string | number>;
  WebkitAnimationDuration?: StylePropValue<string | number>;
  WebkitAnimationFillMode?: StylePropValue<string | number>;
  WebkitAnimationIterationCount?: StylePropValue<string | number>;
  WebkitAnimationName?: StylePropValue<string | number>;
  WebkitAnimationPlayState?: StylePropValue<string | number>;
  WebkitAnimationTimingFunction?: StylePropValue<string | number>;
  WebkitAppearance?: StylePropValue<string | number>;
  WebkitBackdropFilter?: StylePropValue<string | number>;
  WebkitBackfaceVisibility?: StylePropValue<string | number>;
  WebkitBackgroundClip?: StylePropValue<string | number>;
  WebkitBackgroundOrigin?: StylePropValue<string | number>;
  WebkitBackgroundSize?: StylePropValue<string | number>;
  WebkitBorderBefore?: StylePropValue<string | number>;
  WebkitBorderBeforeColor?: StylePropValue<ColorToken | (string & {})>;
  WebkitBorderBeforeStyle?: StylePropValue<string | number>;
  WebkitBorderBeforeWidth?: StylePropValue<string | number>;
  WebkitBorderBottomLeftRadius?: StylePropValue<string | number>;
  WebkitBorderBottomRightRadius?: StylePropValue<string | number>;
  WebkitBorderImage?: StylePropValue<string | number>;
  WebkitBorderImageSlice?: StylePropValue<string | number>;
  WebkitBorderRadius?: StylePropValue<string | number>;
  WebkitBorderTopLeftRadius?: StylePropValue<string | number>;
  WebkitBorderTopRightRadius?: StylePropValue<string | number>;
  WebkitBoxAlign?: StylePropValue<string | number>;
  WebkitBoxDecorationBreak?: StylePropValue<string | number>;
  WebkitBoxDirection?: StylePropValue<string | number>;
  WebkitBoxFlex?: StylePropValue<string | number>;
  WebkitBoxFlexGroup?: StylePropValue<string | number>;
  WebkitBoxLines?: StylePropValue<string | number>;
  WebkitBoxOrdinalGroup?: StylePropValue<string | number>;
  WebkitBoxOrient?: StylePropValue<string | number>;
  WebkitBoxPack?: StylePropValue<string | number>;
  WebkitBoxReflect?: StylePropValue<string | number>;
  WebkitBoxShadow?: StylePropValue<string | number>;
  WebkitBoxSizing?: StylePropValue<string | number>;
  WebkitClipPath?: StylePropValue<string | number>;
  WebkitColumnCount?: StylePropValue<string | number>;
  WebkitColumnFill?: StylePropValue<string | number>;
  WebkitColumnRule?: StylePropValue<string | number>;
  WebkitColumnRuleColor?: StylePropValue<ColorToken | (string & {})>;
  WebkitColumnRuleStyle?: StylePropValue<string | number>;
  WebkitColumnRuleWidth?: StylePropValue<string | number>;
  WebkitColumnSpan?: StylePropValue<string | number>;
  WebkitColumnWidth?: StylePropValue<string | number>;
  WebkitColumns?: StylePropValue<string | number>;
  WebkitFilter?: StylePropValue<string | number>;
  WebkitFlex?: StylePropValue<string | number>;
  WebkitFlexBasis?: StylePropValue<string | number>;
  WebkitFlexDirection?: StylePropValue<string | number>;
  WebkitFlexFlow?: StylePropValue<string | number>;
  WebkitFlexGrow?: StylePropValue<string | number>;
  WebkitFlexShrink?: StylePropValue<string | number>;
  WebkitFlexWrap?: StylePropValue<string | number>;
  WebkitFontFeatureSettings?: StylePropValue<string | number>;
  WebkitFontKerning?: StylePropValue<string | number>;
  WebkitFontSmoothing?: StylePropValue<string | number>;
  WebkitFontVariantLigatures?: StylePropValue<string | number>;
  WebkitHyphenateCharacter?: StylePropValue<string | number>;
  WebkitHyphens?: StylePropValue<string | number>;
  WebkitInitialLetter?: StylePropValue<string | number>;
  WebkitJustifyContent?: StylePropValue<string | number>;
  WebkitLineBreak?: StylePropValue<string | number>;
  WebkitLineClamp?: StylePropValue<string | number>;
  WebkitLogicalHeight?: StylePropValue<string | number>;
  WebkitLogicalWidth?: StylePropValue<string | number>;
  WebkitMarginEnd?: StylePropValue<string | number>;
  WebkitMarginStart?: StylePropValue<string | number>;
  WebkitMask?: StylePropValue<string | number>;
  WebkitMaskAttachment?: StylePropValue<string | number>;
  WebkitMaskBoxImage?: StylePropValue<string | number>;
  WebkitMaskBoxImageOutset?: StylePropValue<string | number>;
  WebkitMaskBoxImageRepeat?: StylePropValue<string | number>;
  WebkitMaskBoxImageSlice?: StylePropValue<string | number>;
  WebkitMaskBoxImageSource?: StylePropValue<string | number>;
  WebkitMaskBoxImageWidth?: StylePropValue<string | number>;
  WebkitMaskClip?: StylePropValue<string | number>;
  WebkitMaskComposite?: StylePropValue<string | number>;
  WebkitMaskImage?: StylePropValue<string | number>;
  WebkitMaskOrigin?: StylePropValue<string | number>;
  WebkitMaskPosition?: StylePropValue<string | number>;
  WebkitMaskPositionX?: StylePropValue<string | number>;
  WebkitMaskPositionY?: StylePropValue<string | number>;
  WebkitMaskRepeat?: StylePropValue<string | number>;
  WebkitMaskRepeatX?: StylePropValue<string | number>;
  WebkitMaskRepeatY?: StylePropValue<string | number>;
  WebkitMaskSize?: StylePropValue<string | number>;
  WebkitMaxInlineSize?: StylePropValue<string | number>;
  WebkitOrder?: StylePropValue<string | number>;
  WebkitOverflowScrolling?: StylePropValue<string | number>;
  WebkitPaddingEnd?: StylePropValue<string | number>;
  WebkitPaddingStart?: StylePropValue<string | number>;
  WebkitPerspective?: StylePropValue<string | number>;
  WebkitPerspectiveOrigin?: StylePropValue<string | number>;
  WebkitPrintColorAdjust?: StylePropValue<string | number>;
  WebkitRubyPosition?: StylePropValue<string | number>;
  WebkitScrollSnapType?: StylePropValue<string | number>;
  WebkitShapeMargin?: StylePropValue<string | number>;
  WebkitTapHighlightColor?: StylePropValue<ColorToken | (string & {})>;
  WebkitTextCombine?: StylePropValue<string | number>;
  WebkitTextDecorationColor?: StylePropValue<ColorToken | (string & {})>;
  WebkitTextDecorationLine?: StylePropValue<string | number>;
  WebkitTextDecorationSkip?: StylePropValue<string | number>;
  WebkitTextDecorationStyle?: StylePropValue<string | number>;
  WebkitTextEmphasis?: StylePropValue<string | number>;
  WebkitTextEmphasisColor?: StylePropValue<ColorToken | (string & {})>;
  WebkitTextEmphasisPosition?: StylePropValue<string | number>;
  WebkitTextEmphasisStyle?: StylePropValue<string | number>;
  WebkitTextFillColor?: StylePropValue<ColorToken | (string & {})>;
  WebkitTextOrientation?: StylePropValue<string | number>;
  WebkitTextSizeAdjust?: StylePropValue<string | number>;
  WebkitTextStroke?: StylePropValue<ColorToken | (string & {})>;
  WebkitTextStrokeColor?: StylePropValue<ColorToken | (string & {})>;
  WebkitTextStrokeWidth?: StylePropValue<string | number>;
  WebkitTextUnderlinePosition?: StylePropValue<string | number>;
  WebkitTouchCallout?: StylePropValue<string | number>;
  WebkitTransform?: StylePropValue<string | number>;
  WebkitTransformOrigin?: StylePropValue<string | number>;
  WebkitTransformStyle?: StylePropValue<string | number>;
  WebkitTransition?: StylePropValue<string | number>;
  WebkitTransitionDelay?: StylePropValue<string | number>;
  WebkitTransitionDuration?: StylePropValue<string | number>;
  WebkitTransitionProperty?: StylePropValue<string | number>;
  WebkitTransitionTimingFunction?: StylePropValue<string | number>;
  WebkitUserModify?: StylePropValue<string | number>;
  WebkitUserSelect?: StylePropValue<string | number>;
  WebkitWritingMode?: StylePropValue<string | number>;
  accentColor?: StylePropValue<ColorToken | (string & {})>;
  alignContent?: StylePropValue<string | number>;
  alignItems?: StylePropValue<string | number>;
  alignSelf?: StylePropValue<string | number>;
  alignmentBaseline?: StylePropValue<string | number>;
  all?: StylePropValue<string | number>;
  anchorName?: StylePropValue<string | number>;
  anchorScope?: StylePropValue<string | number>;
  animation?: StylePropValue<string | number>;
  animationComposition?: StylePropValue<string | number>;
  animationDelay?: StylePropValue<string | number>;
  animationDelayEnd?: StylePropValue<string | number>;
  animationDelayStart?: StylePropValue<string | number>;
  animationDirection?: StylePropValue<string | number>;
  animationDuration?: StylePropValue<string | number>;
  animationFillMode?: StylePropValue<string | number>;
  animationIterationCount?: StylePropValue<string | number>;
  animationName?: StylePropValue<string | number>;
  animationPlayState?: StylePropValue<string | number>;
  animationRange?: StylePropValue<string | number>;
  animationRangeCenter?: StylePropValue<string | number>;
  animationRangeEnd?: StylePropValue<string | number>;
  animationRangeStart?: StylePropValue<string | number>;
  animationState?: StylePropValue<string | number>;
  animationTimeline?: StylePropValue<string | number>;
  animationTimingFunction?: StylePropValue<string | number>;
  animationTrigger?: StylePropValue<string | number>;
  appearance?: StylePropValue<string | number>;
  aspectRatio?: StylePropValue<string | number>;
  backdropFilter?: StylePropValue<string | number>;
  backfaceVisibility?: StylePropValue<string | number>;
  background?: StylePropValue<ColorToken | (string & {})>;
  backgroundAttachment?: StylePropValue<string | number>;
  backgroundBlendMode?: StylePropValue<string | number>;
  backgroundClip?: StylePropValue<string | number>;
  backgroundColor?: StylePropValue<ColorToken | (string & {})>;
  backgroundConic?: StylePropValue<string | number>;
  backgroundGradient?: StylePropValue<string | number>;
  backgroundImage?: StylePropValue<string | number>;
  backgroundLinear?: StylePropValue<string | number>;
  backgroundOrigin?: StylePropValue<string | number>;
  backgroundPosition?: StylePropValue<string | number>;
  backgroundPositionBlock?: StylePropValue<string | number>;
  backgroundPositionInline?: StylePropValue<string | number>;
  backgroundPositionX?: StylePropValue<string | number>;
  backgroundPositionY?: StylePropValue<string | number>;
  backgroundRadial?: StylePropValue<string | number>;
  backgroundRepeat?: StylePropValue<string | number>;
  backgroundRepeatBlock?: StylePropValue<string | number>;
  backgroundRepeatInline?: StylePropValue<string | number>;
  backgroundRepeatX?: StylePropValue<string | number>;
  backgroundRepeatY?: StylePropValue<string | number>;
  backgroundSize?: StylePropValue<string | number>;
  backgroundTbd?: StylePropValue<string | number>;
  baselineShift?: StylePropValue<string | number>;
  baselineSource?: StylePropValue<string | number>;
  bg?: StylePropValue<ColorToken | (string & {})>;
  blockEllipsis?: StylePropValue<string | number>;
  blockSize?: StylePropValue<string | number>;
  blockStep?: StylePropValue<string | number>;
  blockStepAlign?: StylePropValue<string | number>;
  blockStepInsert?: StylePropValue<string | number>;
  blockStepRound?: StylePropValue<string | number>;
  blockStepSize?: StylePropValue<string | number>;
  bookmarkLabel?: StylePropValue<string | number>;
  bookmarkLevel?: StylePropValue<string | number>;
  bookmarkState?: StylePropValue<string | number>;
  border?: StylePropValue<ColorToken | (string & {})>;
  borderBlock?: StylePropValue<string | number>;
  borderBlockClip?: StylePropValue<string | number>;
  borderBlockColor?: StylePropValue<ColorToken | (string & {})>;
  borderBlockEnd?: StylePropValue<ColorToken | (string & {})>;
  borderBlockEndClip?: StylePropValue<string | number>;
  borderBlockEndColor?: StylePropValue<ColorToken | (string & {})>;
  borderBlockEndRadius?: StylePropValue<RadiusToken | (string & {})>;
  borderBlockEndStyle?: StylePropValue<string | number>;
  borderBlockEndWidth?: StylePropValue<string | number>;
  borderBlockStart?: StylePropValue<ColorToken | (string & {})>;
  borderBlockStartClip?: StylePropValue<string | number>;
  borderBlockStartColor?: StylePropValue<ColorToken | (string & {})>;
  borderBlockStartRadius?: StylePropValue<RadiusToken | (string & {})>;
  borderBlockStartStyle?: StylePropValue<string | number>;
  borderBlockStartWidth?: StylePropValue<string | number>;
  borderBlockStyle?: StylePropValue<string | number>;
  borderBlockWidth?: StylePropValue<string | number>;
  borderBottom?: StylePropValue<ColorToken | (string & {})>;
  borderBottomClip?: StylePropValue<string | number>;
  borderBottomColor?: StylePropValue<ColorToken | (string & {})>;
  borderBottomLeftRadius?: StylePropValue<RadiusToken | (string & {})>;
  borderBottomRadius?: StylePropValue<RadiusToken | (string & {})>;
  borderBottomRightRadius?: StylePropValue<RadiusToken | (string & {})>;
  borderBottomStyle?: StylePropValue<string | number>;
  borderBottomWidth?: StylePropValue<string | number>;
  borderBoundary?: StylePropValue<string | number>;
  borderClip?: StylePropValue<string | number>;
  borderCollapse?: StylePropValue<string | number>;
  borderColor?: StylePropValue<ColorToken | (string & {})>;
  borderEndEndRadius?: StylePropValue<RadiusToken | (string & {})>;
  borderEndRadius?: StylePropValue<RadiusToken | (string & {})>;
  borderEndStartRadius?: StylePropValue<RadiusToken | (string & {})>;
  borderImage?: StylePropValue<string | number>;
  borderImageOutset?: StylePropValue<string | number>;
  borderImageRepeat?: StylePropValue<string | number>;
  borderImageSlice?: StylePropValue<string | number>;
  borderImageSource?: StylePropValue<string | number>;
  borderImageWidth?: StylePropValue<string | number>;
  borderInline?: StylePropValue<string | number>;
  borderInlineClip?: StylePropValue<string | number>;
  borderInlineColor?: StylePropValue<ColorToken | (string & {})>;
  borderInlineEnd?: StylePropValue<ColorToken | (string & {})>;
  borderInlineEndClip?: StylePropValue<string | number>;
  borderInlineEndColor?: StylePropValue<ColorToken | (string & {})>;
  borderInlineEndRadius?: StylePropValue<RadiusToken | (string & {})>;
  borderInlineEndStyle?: StylePropValue<string | number>;
  borderInlineEndWidth?: StylePropValue<string | number>;
  borderInlineStart?: StylePropValue<ColorToken | (string & {})>;
  borderInlineStartClip?: StylePropValue<string | number>;
  borderInlineStartColor?: StylePropValue<ColorToken | (string & {})>;
  borderInlineStartRadius?: StylePropValue<RadiusToken | (string & {})>;
  borderInlineStartStyle?: StylePropValue<string | number>;
  borderInlineStartWidth?: StylePropValue<string | number>;
  borderInlineStyle?: StylePropValue<string | number>;
  borderInlineWidth?: StylePropValue<string | number>;
  borderLeft?: StylePropValue<ColorToken | (string & {})>;
  borderLeftClip?: StylePropValue<string | number>;
  borderLeftColor?: StylePropValue<ColorToken | (string & {})>;
  borderLeftRadius?: StylePropValue<RadiusToken | (string & {})>;
  borderLeftStyle?: StylePropValue<string | number>;
  borderLeftWidth?: StylePropValue<string | number>;
  borderLimit?: StylePropValue<string | number>;
  borderRadius?: StylePropValue<RadiusToken | (string & {})>;
  borderRight?: StylePropValue<ColorToken | (string & {})>;
  borderRightClip?: StylePropValue<string | number>;
  borderRightColor?: StylePropValue<ColorToken | (string & {})>;
  borderRightRadius?: StylePropValue<RadiusToken | (string & {})>;
  borderRightStyle?: StylePropValue<string | number>;
  borderRightWidth?: StylePropValue<string | number>;
  borderShape?: StylePropValue<string | number>;
  borderSpacing?: StylePropValue<string | number>;
  borderStartEndRadius?: StylePropValue<RadiusToken | (string & {})>;
  borderStartRadius?: StylePropValue<RadiusToken | (string & {})>;
  borderStartStartRadius?: StylePropValue<RadiusToken | (string & {})>;
  borderStyle?: StylePropValue<string | number>;
  borderTop?: StylePropValue<ColorToken | (string & {})>;
  borderTopClip?: StylePropValue<string | number>;
  borderTopColor?: StylePropValue<ColorToken | (string & {})>;
  borderTopLeftRadius?: StylePropValue<RadiusToken | (string & {})>;
  borderTopRadius?: StylePropValue<RadiusToken | (string & {})>;
  borderTopRightRadius?: StylePropValue<RadiusToken | (string & {})>;
  borderTopStyle?: StylePropValue<string | number>;
  borderTopWidth?: StylePropValue<string | number>;
  borderWidth?: StylePropValue<string | number>;
  bottom?: StylePropValue<string | number>;
  boxDecorationBreak?: StylePropValue<string | number>;
  boxShadow?: StylePropValue<string | number>;
  boxShadowBlur?: StylePropValue<string | number>;
  boxShadowColor?: StylePropValue<ColorToken | (string & {})>;
  boxShadowOffset?: StylePropValue<string | number>;
  boxShadowPosition?: StylePropValue<string | number>;
  boxShadowSpread?: StylePropValue<string | number>;
  boxSize?: StylePropValue<string | number>;
  boxSizing?: StylePropValue<string | number>;
  boxSnap?: StylePropValue<string | number>;
  breakAfter?: StylePropValue<string | number>;
  breakBefore?: StylePropValue<string | number>;
  breakInside?: StylePropValue<string | number>;
  captionSide?: StylePropValue<string | number>;
  caret?: StylePropValue<string | number>;
  caretAnimation?: StylePropValue<string | number>;
  caretColor?: StylePropValue<ColorToken | (string & {})>;
  caretShape?: StylePropValue<string | number>;
  clear?: StylePropValue<string | number>;
  clip?: StylePropValue<string | number>;
  clipPath?: StylePropValue<string | number>;
  clipRule?: StylePropValue<string | number>;
  color?: StylePropValue<ColorToken | (string & {})>;
  colorAdjust?: StylePropValue<string | number>;
  colorInterpolation?: StylePropValue<string | number>;
  colorInterpolationFilters?: StylePropValue<string | number>;
  colorScheme?: StylePropValue<string | number>;
  columnCount?: StylePropValue<string | number>;
  columnFill?: StylePropValue<string | number>;
  columnGap?: StylePropValue<string | number>;
  columnHeight?: StylePropValue<string | number>;
  columnRule?: StylePropValue<string | number>;
  columnRuleBreak?: StylePropValue<string | number>;
  columnRuleColor?: StylePropValue<ColorToken | (string & {})>;
  columnRuleInset?: StylePropValue<string | number>;
  columnRuleInsetCap?: StylePropValue<string | number>;
  columnRuleInsetCapEnd?: StylePropValue<string | number>;
  columnRuleInsetCapStart?: StylePropValue<string | number>;
  columnRuleInsetEnd?: StylePropValue<string | number>;
  columnRuleInsetJunction?: StylePropValue<string | number>;
  columnRuleInsetJunctionEnd?: StylePropValue<string | number>;
  columnRuleInsetJunctionStart?: StylePropValue<string | number>;
  columnRuleInsetStart?: StylePropValue<string | number>;
  columnRuleStyle?: StylePropValue<string | number>;
  columnRuleVisibilityItems?: StylePropValue<string | number>;
  columnRuleWidth?: StylePropValue<string | number>;
  columnSpan?: StylePropValue<string | number>;
  columnWidth?: StylePropValue<string | number>;
  columnWrap?: StylePropValue<string | number>;
  columns?: StylePropValue<string | number>;
  contain?: StylePropValue<string | number>;
  containIntrinsicBlockSize?: StylePropValue<string | number>;
  containIntrinsicHeight?: StylePropValue<string | number>;
  containIntrinsicInlineSize?: StylePropValue<string | number>;
  containIntrinsicSize?: StylePropValue<string | number>;
  containIntrinsicWidth?: StylePropValue<string | number>;
  container?: StylePropValue<string | boolean>;
  containerName?: StylePropValue<string | number>;
  containerType?: StylePropValue<string | number>;
  content?: StylePropValue<string | number>;
  contentVisibility?: StylePropValue<string | number>;
  continue?: StylePropValue<string | number>;
  copyInto?: StylePropValue<string | number>;
  corner?: StylePropValue<string | number>;
  cornerBlockEnd?: StylePropValue<string | number>;
  cornerBlockEndShape?: StylePropValue<string | number>;
  cornerBlockStart?: StylePropValue<string | number>;
  cornerBlockStartShape?: StylePropValue<string | number>;
  cornerBottom?: StylePropValue<string | number>;
  cornerBottomLeft?: StylePropValue<string | number>;
  cornerBottomLeftShape?: StylePropValue<string | number>;
  cornerBottomRight?: StylePropValue<string | number>;
  cornerBottomRightShape?: StylePropValue<string | number>;
  cornerBottomShape?: StylePropValue<string | number>;
  cornerEndEnd?: StylePropValue<string | number>;
  cornerEndEndShape?: StylePropValue<string | number>;
  cornerEndStart?: StylePropValue<string | number>;
  cornerEndStartShape?: StylePropValue<string | number>;
  cornerInlineEnd?: StylePropValue<string | number>;
  cornerInlineEndShape?: StylePropValue<string | number>;
  cornerInlineStart?: StylePropValue<string | number>;
  cornerInlineStartShape?: StylePropValue<string | number>;
  cornerLeft?: StylePropValue<string | number>;
  cornerLeftShape?: StylePropValue<string | number>;
  cornerRight?: StylePropValue<string | number>;
  cornerRightShape?: StylePropValue<string | number>;
  cornerShape?: StylePropValue<string | number>;
  cornerStartEnd?: StylePropValue<string | number>;
  cornerStartEndShape?: StylePropValue<string | number>;
  cornerStartStart?: StylePropValue<string | number>;
  cornerStartStartShape?: StylePropValue<string | number>;
  cornerTop?: StylePropValue<string | number>;
  cornerTopLeft?: StylePropValue<string | number>;
  cornerTopLeftShape?: StylePropValue<string | number>;
  cornerTopRight?: StylePropValue<string | number>;
  cornerTopRightShape?: StylePropValue<string | number>;
  cornerTopShape?: StylePropValue<string | number>;
  counterIncrement?: StylePropValue<string | number>;
  counterReset?: StylePropValue<string | number>;
  counterSet?: StylePropValue<string | number>;
  cue?: StylePropValue<string | number>;
  cueAfter?: StylePropValue<string | number>;
  cueBefore?: StylePropValue<string | number>;
  cursor?: StylePropValue<string | number>;
  cx?: StylePropValue<string | number>;
  cy?: StylePropValue<string | number>;
  d?: StylePropValue<string | number>;
  debug?: StylePropValue<string | number>;
  direction?: StylePropValue<string | number>;
  display?: StylePropValue<string | number>;
  dominantBaseline?: StylePropValue<string | number>;
  dynamicRangeLimit?: StylePropValue<string | number>;
  emptyCells?: StylePropValue<string | number>;
  eventTrigger?: StylePropValue<string | number>;
  eventTriggerName?: StylePropValue<string | number>;
  eventTriggerSource?: StylePropValue<string | number>;
  fieldSizing?: StylePropValue<string | number>;
  fill?: StylePropValue<ColorToken | (string & {})>;
  fillBreak?: StylePropValue<string | number>;
  fillColor?: StylePropValue<ColorToken | (string & {})>;
  fillImage?: StylePropValue<ColorToken | (string & {})>;
  fillOpacity?: StylePropValue<string | number>;
  fillOrigin?: StylePropValue<string | number>;
  fillPosition?: StylePropValue<string | number>;
  fillRepeat?: StylePropValue<string | number>;
  fillRule?: StylePropValue<string | number>;
  fillSize?: StylePropValue<string | number>;
  filter?: StylePropValue<string | number>;
  flex?: StylePropValue<string | number>;
  flexBasis?: StylePropValue<string | number>;
  flexDir?: StylePropValue<string | number>;
  flexDirection?: StylePropValue<string | number>;
  flexFlow?: StylePropValue<string | number>;
  flexGrow?: StylePropValue<string | number>;
  flexLineCount?: StylePropValue<string | number>;
  flexShrink?: StylePropValue<string | number>;
  flexWrap?: StylePropValue<string | number>;
  float?: StylePropValue<string | number>;
  floatDefer?: StylePropValue<string | number>;
  floatOffset?: StylePropValue<string | number>;
  floatReference?: StylePropValue<string | number>;
  floodColor?: StylePropValue<ColorToken | (string & {})>;
  floodOpacity?: StylePropValue<string | number>;
  flowFrom?: StylePropValue<string | number>;
  flowInto?: StylePropValue<string | number>;
  flowTolerance?: StylePropValue<string | number>;
  fontFamily?: StylePropValue<string | number>;
  fontFeatureSettings?: StylePropValue<string | number>;
  fontKerning?: StylePropValue<string | number>;
  fontLanguageOverride?: StylePropValue<string | number>;
  fontOpticalSizing?: StylePropValue<string | number>;
  fontPalette?: StylePropValue<string | number>;
  fontSize?: StylePropValue<string | number>;
  fontSizeAdjust?: StylePropValue<string | number>;
  fontSmoothing?: StylePropValue<string | number>;
  fontStretch?: StylePropValue<string | number>;
  fontStyle?: StylePropValue<string | number>;
  fontSynthesis?: StylePropValue<string | number>;
  fontSynthesisPosition?: StylePropValue<string | number>;
  fontSynthesisSmallCaps?: StylePropValue<string | number>;
  fontSynthesisStyle?: StylePropValue<string | number>;
  fontSynthesisWeight?: StylePropValue<string | number>;
  fontVariant?: StylePropValue<string | number>;
  fontVariantAlternates?: StylePropValue<string | number>;
  fontVariantCaps?: StylePropValue<string | number>;
  fontVariantEastAsian?: StylePropValue<string | number>;
  fontVariantEmoji?: StylePropValue<string | number>;
  fontVariantLigatures?: StylePropValue<string | number>;
  fontVariantNumeric?: StylePropValue<string | number>;
  fontVariantPosition?: StylePropValue<string | number>;
  fontVariationSettings?: StylePropValue<string | number>;
  fontWeight?: StylePropValue<string | number>;
  fontWidth?: StylePropValue<string | number>;
  footnoteDisplay?: StylePropValue<string | number>;
  footnotePolicy?: StylePropValue<string | number>;
  forcedColorAdjust?: StylePropValue<string | number>;
  frameSizing?: StylePropValue<string | number>;
  gap?: StylePropValue<string | number>;
  glyphOrientationVertical?: StylePropValue<string | number>;
  gradientFrom?: StylePropValue<ColorToken | (string & {})>;
  gradientFromPosition?: StylePropValue<string | number>;
  gradientTo?: StylePropValue<ColorToken | (string & {})>;
  gradientToPosition?: StylePropValue<string | number>;
  gradientVia?: StylePropValue<ColorToken | (string & {})>;
  gradientViaPosition?: StylePropValue<string | number>;
  grid?: StylePropValue<string | number>;
  gridArea?: StylePropValue<string | number>;
  gridAutoColumns?: StylePropValue<string | number>;
  gridAutoFlow?: StylePropValue<string | number>;
  gridAutoRows?: StylePropValue<string | number>;
  gridColumn?: StylePropValue<string | number>;
  gridColumnEnd?: StylePropValue<string | number>;
  gridColumnGap?: StylePropValue<string | number>;
  gridColumnStart?: StylePropValue<string | number>;
  gridGap?: StylePropValue<string | number>;
  gridRow?: StylePropValue<string | number>;
  gridRowEnd?: StylePropValue<string | number>;
  gridRowGap?: StylePropValue<string | number>;
  gridRowStart?: StylePropValue<string | number>;
  gridTemplate?: StylePropValue<string | number>;
  gridTemplateAreas?: StylePropValue<string | number>;
  gridTemplateColumns?: StylePropValue<string | number>;
  gridTemplateRows?: StylePropValue<string | number>;
  h?: StylePropValue<string | number>;
  hangingPunctuation?: StylePropValue<string | number>;
  height?: StylePropValue<string | number>;
  hideBelow?: StylePropValue<string | number>;
  hideFrom?: StylePropValue<string | number>;
  hyphenateCharacter?: StylePropValue<string | number>;
  hyphenateLimitChars?: StylePropValue<string | number>;
  hyphenateLimitLast?: StylePropValue<string | number>;
  hyphenateLimitLines?: StylePropValue<string | number>;
  hyphenateLimitZone?: StylePropValue<string | number>;
  hyphens?: StylePropValue<string | number>;
  imageAnimation?: StylePropValue<string | number>;
  imageOrientation?: StylePropValue<string | number>;
  imageRendering?: StylePropValue<string | number>;
  imageResolution?: StylePropValue<string | number>;
  initialLetter?: StylePropValue<string | number>;
  initialLetterAlign?: StylePropValue<string | number>;
  initialLetterWrap?: StylePropValue<string | number>;
  inlineSize?: StylePropValue<string | number>;
  inlineSizing?: StylePropValue<string | number>;
  inputSecurity?: StylePropValue<string | number>;
  inset?: StylePropValue<string | number>;
  insetBlock?: StylePropValue<string | number>;
  insetBlockEnd?: StylePropValue<string | number>;
  insetBlockStart?: StylePropValue<string | number>;
  insetInline?: StylePropValue<string | number>;
  insetInlineEnd?: StylePropValue<string | number>;
  insetInlineStart?: StylePropValue<string | number>;
  interactivity?: StylePropValue<string | number>;
  interestDelay?: StylePropValue<string | number>;
  interestDelayEnd?: StylePropValue<string | number>;
  interestDelayStart?: StylePropValue<string | number>;
  interpolateSize?: StylePropValue<string | number>;
  isolation?: StylePropValue<string | number>;
  justifyContent?: StylePropValue<string | number>;
  justifyItems?: StylePropValue<string | number>;
  justifySelf?: StylePropValue<string | number>;
  left?: StylePropValue<string | number>;
  letterSpacing?: StylePropValue<string | number>;
  lightingColor?: StylePropValue<ColorToken | (string & {})>;
  lineBreak?: StylePropValue<string | number>;
  lineClamp?: StylePropValue<string | number>;
  lineFitEdge?: StylePropValue<string | number>;
  lineGrid?: StylePropValue<string | number>;
  lineHeight?: StylePropValue<string | number>;
  lineHeightStep?: StylePropValue<string | number>;
  linePadding?: StylePropValue<string | number>;
  lineSnap?: StylePropValue<string | number>;
  linkParameters?: StylePropValue<string | number>;
  listStyle?: StylePropValue<string | number>;
  listStyleImage?: StylePropValue<string | number>;
  listStylePosition?: StylePropValue<string | number>;
  listStyleType?: StylePropValue<string | number>;
  m?: StylePropValue<SpacingToken | (string & {})>;
  margin?: StylePropValue<SpacingToken | (string & {})>;
  marginBlock?: StylePropValue<SpacingToken | (string & {})>;
  marginBlockEnd?: StylePropValue<string | number>;
  marginBlockStart?: StylePropValue<string | number>;
  marginBottom?: StylePropValue<SpacingToken | (string & {})>;
  marginBreak?: StylePropValue<string | number>;
  marginInline?: StylePropValue<SpacingToken | (string & {})>;
  marginInlineEnd?: StylePropValue<string | number>;
  marginInlineStart?: StylePropValue<string | number>;
  marginLeft?: StylePropValue<SpacingToken | (string & {})>;
  marginRight?: StylePropValue<SpacingToken | (string & {})>;
  marginTop?: StylePropValue<SpacingToken | (string & {})>;
  marginTrim?: StylePropValue<string | number>;
  marginX?: StylePropValue<SpacingToken | (string & {})>;
  marginY?: StylePropValue<SpacingToken | (string & {})>;
  marker?: StylePropValue<string | number>;
  markerEnd?: StylePropValue<string | number>;
  markerMid?: StylePropValue<string | number>;
  markerSide?: StylePropValue<string | number>;
  markerStart?: StylePropValue<string | number>;
  mask?: StylePropValue<string | number>;
  maskBorder?: StylePropValue<string | number>;
  maskBorderMode?: StylePropValue<string | number>;
  maskBorderOutset?: StylePropValue<string | number>;
  maskBorderRepeat?: StylePropValue<string | number>;
  maskBorderSlice?: StylePropValue<string | number>;
  maskBorderSource?: StylePropValue<string | number>;
  maskBorderWidth?: StylePropValue<string | number>;
  maskClip?: StylePropValue<string | number>;
  maskComposite?: StylePropValue<string | number>;
  maskImage?: StylePropValue<string | number>;
  maskMode?: StylePropValue<string | number>;
  maskOrigin?: StylePropValue<string | number>;
  maskPosition?: StylePropValue<string | number>;
  maskRepeat?: StylePropValue<string | number>;
  maskSize?: StylePropValue<string | number>;
  maskType?: StylePropValue<string | number>;
  mathDepth?: StylePropValue<string | number>;
  mathShift?: StylePropValue<string | number>;
  mathStyle?: StylePropValue<string | number>;
  maxBlockSize?: StylePropValue<string | number>;
  maxH?: StylePropValue<string | number>;
  maxHeight?: StylePropValue<string | number>;
  maxInlineSize?: StylePropValue<string | number>;
  maxLines?: StylePropValue<string | number>;
  maxSize?: StylePropValue<string | number>;
  maxW?: StylePropValue<string | number>;
  maxWidth?: StylePropValue<string | number>;
  mb?: StylePropValue<SpacingToken | (string & {})>;
  minBlockSize?: StylePropValue<string | number>;
  minH?: StylePropValue<string | number>;
  minHeight?: StylePropValue<string | number>;
  minInlineSize?: StylePropValue<string | number>;
  minIntrinsicSizing?: StylePropValue<string | number>;
  minSize?: StylePropValue<string | number>;
  minW?: StylePropValue<string | number>;
  minWidth?: StylePropValue<string | number>;
  mixBlendMode?: StylePropValue<string | number>;
  ml?: StylePropValue<SpacingToken | (string & {})>;
  mozAnimation?: StylePropValue<string | number>;
  mozAnimationDelay?: StylePropValue<string | number>;
  mozAnimationDirection?: StylePropValue<string | number>;
  mozAnimationDuration?: StylePropValue<string | number>;
  mozAnimationFillMode?: StylePropValue<string | number>;
  mozAnimationIterationCount?: StylePropValue<string | number>;
  mozAnimationName?: StylePropValue<string | number>;
  mozAnimationPlayState?: StylePropValue<string | number>;
  mozAnimationTimingFunction?: StylePropValue<string | number>;
  mozAppearance?: StylePropValue<string | number>;
  mozBackfaceVisibility?: StylePropValue<string | number>;
  mozBackgroundClip?: StylePropValue<string | number>;
  mozBackgroundOrigin?: StylePropValue<string | number>;
  mozBackgroundSize?: StylePropValue<string | number>;
  mozBinding?: StylePropValue<string | number>;
  mozBorderBottomColors?: StylePropValue<ColorToken | (string & {})>;
  mozBorderEndColor?: StylePropValue<ColorToken | (string & {})>;
  mozBorderEndStyle?: StylePropValue<string | number>;
  mozBorderEndWidth?: StylePropValue<string | number>;
  mozBorderImage?: StylePropValue<string | number>;
  mozBorderLeftColors?: StylePropValue<ColorToken | (string & {})>;
  mozBorderRadius?: StylePropValue<RadiusToken | (string & {})>;
  mozBorderRadiusBottomleft?: StylePropValue<string | number>;
  mozBorderRadiusBottomright?: StylePropValue<string | number>;
  mozBorderRadiusTopleft?: StylePropValue<string | number>;
  mozBorderRadiusTopright?: StylePropValue<string | number>;
  mozBorderRightColors?: StylePropValue<ColorToken | (string & {})>;
  mozBorderStartColor?: StylePropValue<ColorToken | (string & {})>;
  mozBorderStartStyle?: StylePropValue<string | number>;
  mozBorderTopColors?: StylePropValue<ColorToken | (string & {})>;
  mozBoxAlign?: StylePropValue<string | number>;
  mozBoxDirection?: StylePropValue<string | number>;
  mozBoxFlex?: StylePropValue<string | number>;
  mozBoxOrdinalGroup?: StylePropValue<string | number>;
  mozBoxOrient?: StylePropValue<string | number>;
  mozBoxPack?: StylePropValue<string | number>;
  mozBoxShadow?: StylePropValue<string | number>;
  mozBoxSizing?: StylePropValue<string | number>;
  mozColumnCount?: StylePropValue<string | number>;
  mozColumnFill?: StylePropValue<string | number>;
  mozColumnRule?: StylePropValue<string | number>;
  mozColumnRuleColor?: StylePropValue<ColorToken | (string & {})>;
  mozColumnRuleStyle?: StylePropValue<string | number>;
  mozColumnRuleWidth?: StylePropValue<string | number>;
  mozColumnWidth?: StylePropValue<string | number>;
  mozColumns?: StylePropValue<string | number>;
  mozContextProperties?: StylePropValue<string | number>;
  mozFloatEdge?: StylePropValue<string | number>;
  mozFontFeatureSettings?: StylePropValue<string | number>;
  mozFontLanguageOverride?: StylePropValue<string | number>;
  mozForceBrokenImageIcon?: StylePropValue<string | number>;
  mozHyphens?: StylePropValue<string | number>;
  mozMarginEnd?: StylePropValue<string | number>;
  mozMarginStart?: StylePropValue<string | number>;
  mozOpacity?: StylePropValue<string | number>;
  mozOrient?: StylePropValue<string | number>;
  mozOsxFontSmoothing?: StylePropValue<string | number>;
  mozOutline?: StylePropValue<string | number>;
  mozOutlineColor?: StylePropValue<ColorToken | (string & {})>;
  mozOutlineRadius?: StylePropValue<RadiusToken | (string & {})>;
  mozOutlineRadiusBottomleft?: StylePropValue<string | number>;
  mozOutlineRadiusBottomright?: StylePropValue<string | number>;
  mozOutlineRadiusTopleft?: StylePropValue<string | number>;
  mozOutlineRadiusTopright?: StylePropValue<string | number>;
  mozOutlineStyle?: StylePropValue<string | number>;
  mozOutlineWidth?: StylePropValue<string | number>;
  mozPaddingEnd?: StylePropValue<string | number>;
  mozPaddingStart?: StylePropValue<string | number>;
  mozPerspective?: StylePropValue<string | number>;
  mozPerspectiveOrigin?: StylePropValue<string | number>;
  mozStackSizing?: StylePropValue<string | number>;
  mozTabSize?: StylePropValue<string | number>;
  mozTextAlignLast?: StylePropValue<string | number>;
  mozTextBlink?: StylePropValue<string | number>;
  mozTextDecorationColor?: StylePropValue<ColorToken | (string & {})>;
  mozTextDecorationLine?: StylePropValue<string | number>;
  mozTextDecorationStyle?: StylePropValue<string | number>;
  mozTextSizeAdjust?: StylePropValue<string | number>;
  mozTransform?: StylePropValue<string | number>;
  mozTransformOrigin?: StylePropValue<string | number>;
  mozTransformStyle?: StylePropValue<string | number>;
  mozTransition?: StylePropValue<string | number>;
  mozTransitionDelay?: StylePropValue<string | number>;
  mozTransitionDuration?: StylePropValue<string | number>;
  mozTransitionProperty?: StylePropValue<string | number>;
  mozTransitionTimingFunction?: StylePropValue<string | number>;
  mozUserFocus?: StylePropValue<string | number>;
  mozUserInput?: StylePropValue<string | number>;
  mozUserModify?: StylePropValue<string | number>;
  mozUserSelect?: StylePropValue<string | number>;
  mozWindowDragging?: StylePropValue<string | number>;
  mozWindowShadow?: StylePropValue<string | number>;
  mr?: StylePropValue<SpacingToken | (string & {})>;
  msAccelerator?: StylePropValue<string | number>;
  msBlockProgression?: StylePropValue<string | number>;
  msContentZoomChaining?: StylePropValue<string | number>;
  msContentZoomLimit?: StylePropValue<string | number>;
  msContentZoomLimitMax?: StylePropValue<string | number>;
  msContentZoomLimitMin?: StylePropValue<string | number>;
  msContentZoomSnap?: StylePropValue<string | number>;
  msContentZoomSnapPoints?: StylePropValue<string | number>;
  msContentZoomSnapType?: StylePropValue<string | number>;
  msContentZooming?: StylePropValue<string | number>;
  msFilter?: StylePropValue<string | number>;
  msFlex?: StylePropValue<string | number>;
  msFlexDirection?: StylePropValue<string | number>;
  msFlexPositive?: StylePropValue<string | number>;
  msFlowFrom?: StylePropValue<string | number>;
  msFlowInto?: StylePropValue<string | number>;
  msGridColumns?: StylePropValue<string | number>;
  msGridRows?: StylePropValue<string | number>;
  msHighContrastAdjust?: StylePropValue<string | number>;
  msHyphenateLimitChars?: StylePropValue<string | number>;
  msHyphenateLimitLines?: StylePropValue<string | number>;
  msHyphenateLimitZone?: StylePropValue<string | number>;
  msHyphens?: StylePropValue<string | number>;
  msImeAlign?: StylePropValue<string | number>;
  msImeMode?: StylePropValue<string | number>;
  msLineBreak?: StylePropValue<string | number>;
  msOrder?: StylePropValue<string | number>;
  msOverflowStyle?: StylePropValue<string | number>;
  msOverflowX?: StylePropValue<string | number>;
  msOverflowY?: StylePropValue<string | number>;
  msScrollChaining?: StylePropValue<string | number>;
  msScrollLimit?: StylePropValue<string | number>;
  msScrollLimitXMax?: StylePropValue<string | number>;
  msScrollLimitXMin?: StylePropValue<string | number>;
  msScrollLimitYMax?: StylePropValue<string | number>;
  msScrollLimitYMin?: StylePropValue<string | number>;
  msScrollRails?: StylePropValue<string | number>;
  msScrollSnapPointsX?: StylePropValue<string | number>;
  msScrollSnapPointsY?: StylePropValue<string | number>;
  msScrollSnapType?: StylePropValue<string | number>;
  msScrollSnapX?: StylePropValue<string | number>;
  msScrollSnapY?: StylePropValue<string | number>;
  msScrollTranslation?: StylePropValue<string | number>;
  msScrollbar3dlightColor?: StylePropValue<ColorToken | (string & {})>;
  msScrollbarArrowColor?: StylePropValue<ColorToken | (string & {})>;
  msScrollbarBaseColor?: StylePropValue<ColorToken | (string & {})>;
  msScrollbarDarkshadowColor?: StylePropValue<ColorToken | (string & {})>;
  msScrollbarFaceColor?: StylePropValue<ColorToken | (string & {})>;
  msScrollbarHighlightColor?: StylePropValue<ColorToken | (string & {})>;
  msScrollbarShadowColor?: StylePropValue<ColorToken | (string & {})>;
  msScrollbarTrackColor?: StylePropValue<ColorToken | (string & {})>;
  msTextAutospace?: StylePropValue<string | number>;
  msTextCombineHorizontal?: StylePropValue<string | number>;
  msTextOverflow?: StylePropValue<string | number>;
  msTouchAction?: StylePropValue<string | number>;
  msTouchSelect?: StylePropValue<string | number>;
  msTransform?: StylePropValue<string | number>;
  msTransformOrigin?: StylePropValue<string | number>;
  msTransition?: StylePropValue<string | number>;
  msTransitionDelay?: StylePropValue<string | number>;
  msTransitionDuration?: StylePropValue<string | number>;
  msTransitionProperty?: StylePropValue<string | number>;
  msTransitionTimingFunction?: StylePropValue<string | number>;
  msUserSelect?: StylePropValue<string | number>;
  msWordBreak?: StylePropValue<string | number>;
  msWrapFlow?: StylePropValue<string | number>;
  msWrapMargin?: StylePropValue<string | number>;
  msWrapThrough?: StylePropValue<string | number>;
  msWritingMode?: StylePropValue<string | number>;
  mt?: StylePropValue<SpacingToken | (string & {})>;
  mx?: StylePropValue<SpacingToken | (string & {})>;
  my?: StylePropValue<SpacingToken | (string & {})>;
  navDown?: StylePropValue<string | number>;
  navLeft?: StylePropValue<string | number>;
  navRight?: StylePropValue<string | number>;
  navUp?: StylePropValue<string | number>;
  objectFit?: StylePropValue<string | number>;
  objectPosition?: StylePropValue<string | number>;
  objectViewBox?: StylePropValue<string | number>;
  offset?: StylePropValue<string | number>;
  offsetAnchor?: StylePropValue<string | number>;
  offsetDistance?: StylePropValue<string | number>;
  offsetPath?: StylePropValue<string | number>;
  offsetPosition?: StylePropValue<string | number>;
  offsetRotate?: StylePropValue<string | number>;
  opacity?: StylePropValue<string | number>;
  order?: StylePropValue<string | number>;
  orphans?: StylePropValue<string | number>;
  outline?: StylePropValue<string | number>;
  outlineColor?: StylePropValue<ColorToken | (string & {})>;
  outlineOffset?: StylePropValue<string | number>;
  outlineStyle?: StylePropValue<string | number>;
  outlineWidth?: StylePropValue<string | number>;
  overflow?: StylePropValue<string | number>;
  overflowAnchor?: StylePropValue<string | number>;
  overflowBlock?: StylePropValue<string | number>;
  overflowClipMargin?: StylePropValue<string | number>;
  overflowClipMarginBlock?: StylePropValue<string | number>;
  overflowClipMarginBlockEnd?: StylePropValue<string | number>;
  overflowClipMarginBlockStart?: StylePropValue<string | number>;
  overflowClipMarginBottom?: StylePropValue<string | number>;
  overflowClipMarginInline?: StylePropValue<string | number>;
  overflowClipMarginInlineEnd?: StylePropValue<string | number>;
  overflowClipMarginInlineStart?: StylePropValue<string | number>;
  overflowClipMarginLeft?: StylePropValue<string | number>;
  overflowClipMarginRight?: StylePropValue<string | number>;
  overflowClipMarginTop?: StylePropValue<string | number>;
  overflowInline?: StylePropValue<string | number>;
  overflowWrap?: StylePropValue<string | number>;
  overflowX?: StylePropValue<string | number>;
  overflowY?: StylePropValue<string | number>;
  overlay?: StylePropValue<string | number>;
  overscrollBehavior?: StylePropValue<string | number>;
  overscrollBehaviorBlock?: StylePropValue<string | number>;
  overscrollBehaviorInline?: StylePropValue<string | number>;
  overscrollBehaviorX?: StylePropValue<string | number>;
  overscrollBehaviorY?: StylePropValue<string | number>;
  p?: StylePropValue<SpacingToken | (string & {})>;
  padding?: StylePropValue<SpacingToken | (string & {})>;
  paddingBlock?: StylePropValue<SpacingToken | (string & {})>;
  paddingBlockEnd?: StylePropValue<string | number>;
  paddingBlockStart?: StylePropValue<string | number>;
  paddingBottom?: StylePropValue<SpacingToken | (string & {})>;
  paddingInline?: StylePropValue<SpacingToken | (string & {})>;
  paddingInlineEnd?: StylePropValue<string | number>;
  paddingInlineStart?: StylePropValue<string | number>;
  paddingLeft?: StylePropValue<SpacingToken | (string & {})>;
  paddingRight?: StylePropValue<SpacingToken | (string & {})>;
  paddingTop?: StylePropValue<SpacingToken | (string & {})>;
  paddingX?: StylePropValue<SpacingToken | (string & {})>;
  paddingY?: StylePropValue<SpacingToken | (string & {})>;
  page?: StylePropValue<string | number>;
  pageBreakAfter?: StylePropValue<string | number>;
  pageBreakBefore?: StylePropValue<string | number>;
  pageBreakInside?: StylePropValue<string | number>;
  paintOrder?: StylePropValue<string | number>;
  pathLength?: StylePropValue<string | number>;
  pause?: StylePropValue<string | number>;
  pauseAfter?: StylePropValue<string | number>;
  pauseBefore?: StylePropValue<string | number>;
  pb?: StylePropValue<SpacingToken | (string & {})>;
  perspective?: StylePropValue<string | number>;
  perspectiveOrigin?: StylePropValue<string | number>;
  pl?: StylePropValue<SpacingToken | (string & {})>;
  placeContent?: StylePropValue<string | number>;
  placeItems?: StylePropValue<string | number>;
  placeSelf?: StylePropValue<string | number>;
  pointerEvents?: StylePropValue<string | number>;
  pointerTimeline?: StylePropValue<string | number>;
  pointerTimelineAxis?: StylePropValue<string | number>;
  pointerTimelineName?: StylePropValue<string | number>;
  position?: StylePropValue<string | number>;
  positionAnchor?: StylePropValue<string | number>;
  positionArea?: StylePropValue<string | number>;
  positionTry?: StylePropValue<string | number>;
  positionTryFallbacks?: StylePropValue<string | number>;
  positionTryOrder?: StylePropValue<string | number>;
  positionVisibility?: StylePropValue<string | number>;
  pr?: StylePropValue<SpacingToken | (string & {})>;
  printColorAdjust?: StylePropValue<string | number>;
  pt?: StylePropValue<SpacingToken | (string & {})>;
  px?: StylePropValue<SpacingToken | (string & {})>;
  py?: StylePropValue<SpacingToken | (string & {})>;
  quotes?: StylePropValue<string | number>;
  r?: StylePropValue<Record<string | number, StyleProps>>;
  readingFlow?: StylePropValue<string | number>;
  readingOrder?: StylePropValue<string | number>;
  regionFragment?: StylePropValue<string | number>;
  resize?: StylePropValue<string | number>;
  rest?: StylePropValue<string | number>;
  restAfter?: StylePropValue<string | number>;
  restBefore?: StylePropValue<string | number>;
  right?: StylePropValue<string | number>;
  rotate?: StylePropValue<string | number>;
  rowGap?: StylePropValue<string | number>;
  rowRule?: StylePropValue<string | number>;
  rowRuleBreak?: StylePropValue<string | number>;
  rowRuleColor?: StylePropValue<ColorToken | (string & {})>;
  rowRuleInset?: StylePropValue<string | number>;
  rowRuleInsetCap?: StylePropValue<string | number>;
  rowRuleInsetCapEnd?: StylePropValue<string | number>;
  rowRuleInsetCapStart?: StylePropValue<string | number>;
  rowRuleInsetEnd?: StylePropValue<string | number>;
  rowRuleInsetJunction?: StylePropValue<string | number>;
  rowRuleInsetJunctionEnd?: StylePropValue<string | number>;
  rowRuleInsetJunctionStart?: StylePropValue<string | number>;
  rowRuleInsetStart?: StylePropValue<string | number>;
  rowRuleStyle?: StylePropValue<string | number>;
  rowRuleVisibilityItems?: StylePropValue<string | number>;
  rowRuleWidth?: StylePropValue<string | number>;
  rubyAlign?: StylePropValue<string | number>;
  rubyMerge?: StylePropValue<string | number>;
  rubyOverhang?: StylePropValue<string | number>;
  rubyPosition?: StylePropValue<string | number>;
  rule?: StylePropValue<string | number>;
  ruleBreak?: StylePropValue<string | number>;
  ruleColor?: StylePropValue<ColorToken | (string & {})>;
  ruleInset?: StylePropValue<string | number>;
  ruleInsetCap?: StylePropValue<string | number>;
  ruleInsetEnd?: StylePropValue<string | number>;
  ruleInsetJunction?: StylePropValue<string | number>;
  ruleInsetStart?: StylePropValue<string | number>;
  ruleOverlap?: StylePropValue<string | number>;
  ruleStyle?: StylePropValue<string | number>;
  ruleVisibilityItems?: StylePropValue<string | number>;
  ruleWidth?: StylePropValue<string | number>;
  rx?: StylePropValue<string | number>;
  ry?: StylePropValue<string | number>;
  scale?: StylePropValue<string | number>;
  scrollAxisLock?: StylePropValue<string | number>;
  scrollBehavior?: StylePropValue<string | number>;
  scrollInitialTarget?: StylePropValue<string | number>;
  scrollMargin?: StylePropValue<string | number>;
  scrollMarginBlock?: StylePropValue<string | number>;
  scrollMarginBlockEnd?: StylePropValue<string | number>;
  scrollMarginBlockStart?: StylePropValue<string | number>;
  scrollMarginBottom?: StylePropValue<string | number>;
  scrollMarginInline?: StylePropValue<string | number>;
  scrollMarginInlineEnd?: StylePropValue<string | number>;
  scrollMarginInlineStart?: StylePropValue<string | number>;
  scrollMarginLeft?: StylePropValue<string | number>;
  scrollMarginRight?: StylePropValue<string | number>;
  scrollMarginTop?: StylePropValue<string | number>;
  scrollMarkerGroup?: StylePropValue<string | number>;
  scrollPadding?: StylePropValue<string | number>;
  scrollPaddingBlock?: StylePropValue<string | number>;
  scrollPaddingBlockEnd?: StylePropValue<string | number>;
  scrollPaddingBlockStart?: StylePropValue<string | number>;
  scrollPaddingBottom?: StylePropValue<string | number>;
  scrollPaddingInline?: StylePropValue<string | number>;
  scrollPaddingInlineEnd?: StylePropValue<string | number>;
  scrollPaddingInlineStart?: StylePropValue<string | number>;
  scrollPaddingLeft?: StylePropValue<string | number>;
  scrollPaddingRight?: StylePropValue<string | number>;
  scrollPaddingTop?: StylePropValue<string | number>;
  scrollSnapAlign?: StylePropValue<string | number>;
  scrollSnapStop?: StylePropValue<string | number>;
  scrollSnapStrictness?: StylePropValue<string | number>;
  scrollSnapType?: StylePropValue<string | number>;
  scrollTargetGroup?: StylePropValue<string | number>;
  scrollTimeline?: StylePropValue<string | number>;
  scrollTimelineAxis?: StylePropValue<string | number>;
  scrollTimelineName?: StylePropValue<string | number>;
  scrollbarColor?: StylePropValue<ColorToken | (string & {})>;
  scrollbarGutter?: StylePropValue<string | number>;
  scrollbarWidth?: StylePropValue<string | number>;
  shapeImageThreshold?: StylePropValue<string | number>;
  shapeInside?: StylePropValue<string | number>;
  shapeMargin?: StylePropValue<string | number>;
  shapeOutside?: StylePropValue<string | number>;
  shapePadding?: StylePropValue<string | number>;
  shapeRendering?: StylePropValue<string | number>;
  size?: StylePropValue<string | number>;
  sliderOrientation?: StylePropValue<string | number>;
  spaceX?: StylePropValue<string | number>;
  spaceY?: StylePropValue<string | number>;
  spatialNavigationAction?: StylePropValue<string | number>;
  spatialNavigationContain?: StylePropValue<string | number>;
  spatialNavigationFunction?: StylePropValue<string | number>;
  speak?: StylePropValue<string | number>;
  speakAs?: StylePropValue<string | number>;
  srOnly?: StylePropValue<string | number>;
  stopColor?: StylePropValue<ColorToken | (string & {})>;
  stopOpacity?: StylePropValue<string | number>;
  stringSet?: StylePropValue<string | number>;
  stroke?: StylePropValue<ColorToken | (string & {})>;
  strokeAlign?: StylePropValue<string | number>;
  strokeAlignment?: StylePropValue<string | number>;
  strokeBreak?: StylePropValue<string | number>;
  strokeColor?: StylePropValue<ColorToken | (string & {})>;
  strokeDashCorner?: StylePropValue<string | number>;
  strokeDashJustify?: StylePropValue<string | number>;
  strokeDashadjust?: StylePropValue<string | number>;
  strokeDasharray?: StylePropValue<string | number>;
  strokeDashcorner?: StylePropValue<string | number>;
  strokeDashoffset?: StylePropValue<string | number>;
  strokeImage?: StylePropValue<ColorToken | (string & {})>;
  strokeLinecap?: StylePropValue<string | number>;
  strokeLinejoin?: StylePropValue<string | number>;
  strokeMiterlimit?: StylePropValue<string | number>;
  strokeOpacity?: StylePropValue<string | number>;
  strokeOrigin?: StylePropValue<string | number>;
  strokePosition?: StylePropValue<string | number>;
  strokeRepeat?: StylePropValue<string | number>;
  strokeSize?: StylePropValue<string | number>;
  strokeWidth?: StylePropValue<string | number>;
  tabSize?: StylePropValue<string | number>;
  tableLayout?: StylePropValue<string | number>;
  textAlign?: StylePropValue<string | number>;
  textAlignAll?: StylePropValue<string | number>;
  textAlignLast?: StylePropValue<string | number>;
  textAnchor?: StylePropValue<string | number>;
  textAutospace?: StylePropValue<string | number>;
  textBox?: StylePropValue<string | number>;
  textBoxEdge?: StylePropValue<string | number>;
  textBoxTrim?: StylePropValue<string | number>;
  textCombineUpright?: StylePropValue<string | number>;
  textDecoration?: StylePropValue<string | number>;
  textDecorationColor?: StylePropValue<ColorToken | (string & {})>;
  textDecorationInset?: StylePropValue<string | number>;
  textDecorationLine?: StylePropValue<string | number>;
  textDecorationSkip?: StylePropValue<string | number>;
  textDecorationSkipBox?: StylePropValue<string | number>;
  textDecorationSkipInk?: StylePropValue<string | number>;
  textDecorationSkipSelf?: StylePropValue<string | number>;
  textDecorationSkipSpaces?: StylePropValue<string | number>;
  textDecorationStyle?: StylePropValue<string | number>;
  textDecorationThickness?: StylePropValue<string | number>;
  textEmphasis?: StylePropValue<string | number>;
  textEmphasisColor?: StylePropValue<ColorToken | (string & {})>;
  textEmphasisPosition?: StylePropValue<string | number>;
  textEmphasisSkip?: StylePropValue<string | number>;
  textEmphasisStyle?: StylePropValue<string | number>;
  textFit?: StylePropValue<string | number>;
  textGradient?: StylePropValue<string | number>;
  textGroupAlign?: StylePropValue<string | number>;
  textIndent?: StylePropValue<string | number>;
  textJustify?: StylePropValue<string | number>;
  textOrientation?: StylePropValue<string | number>;
  textOverflow?: StylePropValue<string | number>;
  textRendering?: StylePropValue<string | number>;
  textShadow?: StylePropValue<string | number>;
  textShadowColor?: StylePropValue<ColorToken | (string & {})>;
  textSizeAdjust?: StylePropValue<string | number>;
  textSpacing?: StylePropValue<string | number>;
  textSpacingTrim?: StylePropValue<string | number>;
  textStyle?: StylePropValue<string | number>;
  textTransform?: StylePropValue<string | number>;
  textUnderlineOffset?: StylePropValue<string | number>;
  textUnderlinePosition?: StylePropValue<string | number>;
  textWrap?: StylePropValue<string | number>;
  textWrapMode?: StylePropValue<string | number>;
  textWrapStyle?: StylePropValue<string | number>;
  timelineScope?: StylePropValue<string | number>;
  timelineTrigger?: StylePropValue<string | number>;
  timelineTriggerActivationRange?: StylePropValue<string | number>;
  timelineTriggerActivationRangeEnd?: StylePropValue<string | number>;
  timelineTriggerActivationRangeStart?: StylePropValue<string | number>;
  timelineTriggerActiveRange?: StylePropValue<string | number>;
  timelineTriggerActiveRangeEnd?: StylePropValue<string | number>;
  timelineTriggerActiveRangeStart?: StylePropValue<string | number>;
  timelineTriggerName?: StylePropValue<string | number>;
  timelineTriggerSource?: StylePropValue<string | number>;
  top?: StylePropValue<string | number>;
  touchAction?: StylePropValue<string | number>;
  transform?: StylePropValue<string | number>;
  transformBox?: StylePropValue<string | number>;
  transformOrigin?: StylePropValue<string | number>;
  transformStyle?: StylePropValue<string | number>;
  transition?: StylePropValue<string | number>;
  transitionBehavior?: StylePropValue<string | number>;
  transitionDelay?: StylePropValue<string | number>;
  transitionDuration?: StylePropValue<string | number>;
  transitionProperty?: StylePropValue<string | number>;
  transitionTimingFunction?: StylePropValue<string | number>;
  translate?: StylePropValue<string | number>;
  translateX?: StylePropValue<string | number>;
  translateY?: StylePropValue<string | number>;
  translateZ?: StylePropValue<string | number>;
  triggerScope?: StylePropValue<string | number>;
  truncate?: StylePropValue<string | number>;
  unicodeBidi?: StylePropValue<string | number>;
  userSelect?: StylePropValue<string | number>;
  vectorEffect?: StylePropValue<string | number>;
  verticalAlign?: StylePropValue<string | number>;
  viewTimeline?: StylePropValue<string | number>;
  viewTimelineAxis?: StylePropValue<string | number>;
  viewTimelineInset?: StylePropValue<string | number>;
  viewTimelineName?: StylePropValue<string | number>;
  viewTransitionClass?: StylePropValue<string | number>;
  viewTransitionGroup?: StylePropValue<string | number>;
  viewTransitionName?: StylePropValue<string | number>;
  viewTransitionScope?: StylePropValue<string | number>;
  visibility?: StylePropValue<string | number>;
  voiceBalance?: StylePropValue<string | number>;
  voiceDuration?: StylePropValue<string | number>;
  voiceFamily?: StylePropValue<string | number>;
  voicePitch?: StylePropValue<string | number>;
  voiceRange?: StylePropValue<string | number>;
  voiceRate?: StylePropValue<string | number>;
  voiceStress?: StylePropValue<string | number>;
  voiceVolume?: StylePropValue<string | number>;
  w?: StylePropValue<string | number>;
  webkitAlignContent?: StylePropValue<string | number>;
  webkitAlignItems?: StylePropValue<string | number>;
  webkitAlignSelf?: StylePropValue<string | number>;
  webkitAnimation?: StylePropValue<string | number>;
  webkitAnimationDelay?: StylePropValue<string | number>;
  webkitAnimationDirection?: StylePropValue<string | number>;
  webkitAnimationDuration?: StylePropValue<string | number>;
  webkitAnimationFillMode?: StylePropValue<string | number>;
  webkitAnimationIterationCount?: StylePropValue<string | number>;
  webkitAnimationName?: StylePropValue<string | number>;
  webkitAnimationPlayState?: StylePropValue<string | number>;
  webkitAnimationTimingFunction?: StylePropValue<string | number>;
  webkitAppearance?: StylePropValue<string | number>;
  webkitBackdropFilter?: StylePropValue<string | number>;
  webkitBackfaceVisibility?: StylePropValue<string | number>;
  webkitBackgroundClip?: StylePropValue<string | number>;
  webkitBackgroundOrigin?: StylePropValue<string | number>;
  webkitBackgroundSize?: StylePropValue<string | number>;
  webkitBorderBefore?: StylePropValue<string | number>;
  webkitBorderBeforeColor?: StylePropValue<ColorToken | (string & {})>;
  webkitBorderBeforeStyle?: StylePropValue<string | number>;
  webkitBorderBeforeWidth?: StylePropValue<string | number>;
  webkitBorderBottomLeftRadius?: StylePropValue<string | number>;
  webkitBorderBottomRightRadius?: StylePropValue<string | number>;
  webkitBorderImage?: StylePropValue<string | number>;
  webkitBorderImageSlice?: StylePropValue<string | number>;
  webkitBorderRadius?: StylePropValue<string | number>;
  webkitBorderTopLeftRadius?: StylePropValue<string | number>;
  webkitBorderTopRightRadius?: StylePropValue<string | number>;
  webkitBoxAlign?: StylePropValue<string | number>;
  webkitBoxDecorationBreak?: StylePropValue<string | number>;
  webkitBoxDirection?: StylePropValue<string | number>;
  webkitBoxFlex?: StylePropValue<string | number>;
  webkitBoxFlexGroup?: StylePropValue<string | number>;
  webkitBoxLines?: StylePropValue<string | number>;
  webkitBoxOrdinalGroup?: StylePropValue<string | number>;
  webkitBoxOrient?: StylePropValue<string | number>;
  webkitBoxPack?: StylePropValue<string | number>;
  webkitBoxReflect?: StylePropValue<string | number>;
  webkitBoxShadow?: StylePropValue<string | number>;
  webkitBoxSizing?: StylePropValue<string | number>;
  webkitClipPath?: StylePropValue<string | number>;
  webkitColumnCount?: StylePropValue<string | number>;
  webkitColumnFill?: StylePropValue<string | number>;
  webkitColumnRule?: StylePropValue<string | number>;
  webkitColumnRuleColor?: StylePropValue<ColorToken | (string & {})>;
  webkitColumnRuleStyle?: StylePropValue<string | number>;
  webkitColumnRuleWidth?: StylePropValue<string | number>;
  webkitColumnSpan?: StylePropValue<string | number>;
  webkitColumnWidth?: StylePropValue<string | number>;
  webkitColumns?: StylePropValue<string | number>;
  webkitFilter?: StylePropValue<string | number>;
  webkitFlex?: StylePropValue<string | number>;
  webkitFlexBasis?: StylePropValue<string | number>;
  webkitFlexDirection?: StylePropValue<string | number>;
  webkitFlexFlow?: StylePropValue<string | number>;
  webkitFlexGrow?: StylePropValue<string | number>;
  webkitFlexShrink?: StylePropValue<string | number>;
  webkitFlexWrap?: StylePropValue<string | number>;
  webkitFontFeatureSettings?: StylePropValue<string | number>;
  webkitFontKerning?: StylePropValue<string | number>;
  webkitFontSmoothing?: StylePropValue<string | number>;
  webkitFontVariantLigatures?: StylePropValue<string | number>;
  webkitHyphenateCharacter?: StylePropValue<string | number>;
  webkitHyphens?: StylePropValue<string | number>;
  webkitInitialLetter?: StylePropValue<string | number>;
  webkitJustifyContent?: StylePropValue<string | number>;
  webkitLineBreak?: StylePropValue<string | number>;
  webkitLineClamp?: StylePropValue<string | number>;
  webkitLogicalHeight?: StylePropValue<string | number>;
  webkitLogicalWidth?: StylePropValue<string | number>;
  webkitMarginEnd?: StylePropValue<string | number>;
  webkitMarginStart?: StylePropValue<string | number>;
  webkitMask?: StylePropValue<string | number>;
  webkitMaskAttachment?: StylePropValue<string | number>;
  webkitMaskBoxImage?: StylePropValue<string | number>;
  webkitMaskBoxImageOutset?: StylePropValue<string | number>;
  webkitMaskBoxImageRepeat?: StylePropValue<string | number>;
  webkitMaskBoxImageSlice?: StylePropValue<string | number>;
  webkitMaskBoxImageSource?: StylePropValue<string | number>;
  webkitMaskBoxImageWidth?: StylePropValue<string | number>;
  webkitMaskClip?: StylePropValue<string | number>;
  webkitMaskComposite?: StylePropValue<string | number>;
  webkitMaskImage?: StylePropValue<string | number>;
  webkitMaskOrigin?: StylePropValue<string | number>;
  webkitMaskPosition?: StylePropValue<string | number>;
  webkitMaskPositionX?: StylePropValue<string | number>;
  webkitMaskPositionY?: StylePropValue<string | number>;
  webkitMaskRepeat?: StylePropValue<string | number>;
  webkitMaskRepeatX?: StylePropValue<string | number>;
  webkitMaskRepeatY?: StylePropValue<string | number>;
  webkitMaskSize?: StylePropValue<string | number>;
  webkitMaxInlineSize?: StylePropValue<string | number>;
  webkitOrder?: StylePropValue<string | number>;
  webkitOverflowScrolling?: StylePropValue<string | number>;
  webkitPaddingEnd?: StylePropValue<string | number>;
  webkitPaddingStart?: StylePropValue<string | number>;
  webkitPerspective?: StylePropValue<string | number>;
  webkitPerspectiveOrigin?: StylePropValue<string | number>;
  webkitPrintColorAdjust?: StylePropValue<string | number>;
  webkitRubyPosition?: StylePropValue<string | number>;
  webkitScrollSnapType?: StylePropValue<string | number>;
  webkitShapeMargin?: StylePropValue<string | number>;
  webkitTapHighlightColor?: StylePropValue<ColorToken | (string & {})>;
  webkitTextCombine?: StylePropValue<string | number>;
  webkitTextDecorationColor?: StylePropValue<ColorToken | (string & {})>;
  webkitTextDecorationLine?: StylePropValue<string | number>;
  webkitTextDecorationSkip?: StylePropValue<string | number>;
  webkitTextDecorationStyle?: StylePropValue<string | number>;
  webkitTextEmphasis?: StylePropValue<string | number>;
  webkitTextEmphasisColor?: StylePropValue<ColorToken | (string & {})>;
  webkitTextEmphasisPosition?: StylePropValue<string | number>;
  webkitTextEmphasisStyle?: StylePropValue<string | number>;
  webkitTextFillColor?: StylePropValue<ColorToken | (string & {})>;
  webkitTextOrientation?: StylePropValue<string | number>;
  webkitTextSizeAdjust?: StylePropValue<string | number>;
  webkitTextStroke?: StylePropValue<ColorToken | (string & {})>;
  webkitTextStrokeColor?: StylePropValue<ColorToken | (string & {})>;
  webkitTextStrokeWidth?: StylePropValue<string | number>;
  webkitTextUnderlinePosition?: StylePropValue<string | number>;
  webkitTouchCallout?: StylePropValue<string | number>;
  webkitTransform?: StylePropValue<string | number>;
  webkitTransformOrigin?: StylePropValue<string | number>;
  webkitTransformStyle?: StylePropValue<string | number>;
  webkitTransition?: StylePropValue<string | number>;
  webkitTransitionDelay?: StylePropValue<string | number>;
  webkitTransitionDuration?: StylePropValue<string | number>;
  webkitTransitionProperty?: StylePropValue<string | number>;
  webkitTransitionTimingFunction?: StylePropValue<string | number>;
  webkitUserModify?: StylePropValue<string | number>;
  webkitUserSelect?: StylePropValue<string | number>;
  webkitWritingMode?: StylePropValue<string | number>;
  whiteSpace?: StylePropValue<string | number>;
  whiteSpaceCollapse?: StylePropValue<string | number>;
  whiteSpaceTrim?: StylePropValue<string | number>;
  widows?: StylePropValue<string | number>;
  width?: StylePropValue<string | number>;
  willChange?: StylePropValue<string | number>;
  windowDrag?: StylePropValue<string | number>;
  wordBreak?: StylePropValue<string | number>;
  wordSpaceTransform?: StylePropValue<string | number>;
  wordSpacing?: StylePropValue<string | number>;
  wordWrap?: StylePropValue<string | number>;
  wrapAfter?: StylePropValue<string | number>;
  wrapBefore?: StylePropValue<string | number>;
  wrapFlow?: StylePropValue<string | number>;
  wrapInside?: StylePropValue<string | number>;
  wrapThrough?: StylePropValue<string | number>;
  writingMode?: StylePropValue<string | number>;
  x?: StylePropValue<string | number>;
  y?: StylePropValue<string | number>;
  zIndex?: StylePropValue<string | number>;
  zoom?: StylePropValue<string | number>;
};

type ColorPropKeys =
  | 'MozBorderBottomColors'
  | 'MozBorderEndColor'
  | 'MozBorderLeftColors'
  | 'MozBorderRightColors'
  | 'MozBorderStartColor'
  | 'MozBorderTopColors'
  | 'MozColumnRuleColor'
  | 'MozOutlineColor'
  | 'MozTextDecorationColor'
  | 'MsScrollbar3dlightColor'
  | 'MsScrollbarArrowColor'
  | 'MsScrollbarBaseColor'
  | 'MsScrollbarDarkshadowColor'
  | 'MsScrollbarFaceColor'
  | 'MsScrollbarHighlightColor'
  | 'MsScrollbarShadowColor'
  | 'MsScrollbarTrackColor'
  | 'WebkitBorderBeforeColor'
  | 'WebkitColumnRuleColor'
  | 'WebkitTapHighlightColor'
  | 'WebkitTextDecorationColor'
  | 'WebkitTextEmphasisColor'
  | 'WebkitTextFillColor'
  | 'WebkitTextStroke'
  | 'WebkitTextStrokeColor'
  | 'accentColor'
  | 'background'
  | 'backgroundColor'
  | 'bg'
  | 'border'
  | 'borderBlockColor'
  | 'borderBlockEnd'
  | 'borderBlockEndColor'
  | 'borderBlockStart'
  | 'borderBlockStartColor'
  | 'borderBottom'
  | 'borderBottomColor'
  | 'borderColor'
  | 'borderInlineColor'
  | 'borderInlineEnd'
  | 'borderInlineEndColor'
  | 'borderInlineStart'
  | 'borderInlineStartColor'
  | 'borderLeft'
  | 'borderLeftColor'
  | 'borderRight'
  | 'borderRightColor'
  | 'borderTop'
  | 'borderTopColor'
  | 'boxShadowColor'
  | 'caretColor'
  | 'color'
  | 'columnRuleColor'
  | 'fill'
  | 'fillColor'
  | 'fillImage'
  | 'floodColor'
  | 'gradientFrom'
  | 'gradientTo'
  | 'gradientVia'
  | 'lightingColor'
  | 'mozBorderBottomColors'
  | 'mozBorderEndColor'
  | 'mozBorderLeftColors'
  | 'mozBorderRightColors'
  | 'mozBorderStartColor'
  | 'mozBorderTopColors'
  | 'mozColumnRuleColor'
  | 'mozOutlineColor'
  | 'mozTextDecorationColor'
  | 'msScrollbar3dlightColor'
  | 'msScrollbarArrowColor'
  | 'msScrollbarBaseColor'
  | 'msScrollbarDarkshadowColor'
  | 'msScrollbarFaceColor'
  | 'msScrollbarHighlightColor'
  | 'msScrollbarShadowColor'
  | 'msScrollbarTrackColor'
  | 'outlineColor'
  | 'rowRuleColor'
  | 'ruleColor'
  | 'scrollbarColor'
  | 'stopColor'
  | 'stroke'
  | 'strokeColor'
  | 'strokeImage'
  | 'textDecorationColor'
  | 'textEmphasisColor'
  | 'textShadowColor'
  | 'webkitBorderBeforeColor'
  | 'webkitColumnRuleColor'
  | 'webkitTapHighlightColor'
  | 'webkitTextDecorationColor'
  | 'webkitTextEmphasisColor'
  | 'webkitTextFillColor'
  | 'webkitTextStroke'
  | 'webkitTextStrokeColor';

type StrictColorValue =
  | ColorToken
  | 'white'
  | 'black'
  | 'inherit'
  | 'currentColor'
  | 'transparent';

export type SafeColorProps = {
  [K in ColorPropKeys]?: StylePropValue<StrictColorValue>;
};

export type StrictColorProps<P> = Omit<P, ColorPropKeys> & SafeColorProps;

type RadiiPropKeys =
  | 'borderBlockEndRadius'
  | 'borderBlockStartRadius'
  | 'borderBottomLeftRadius'
  | 'borderBottomRadius'
  | 'borderBottomRightRadius'
  | 'borderEndEndRadius'
  | 'borderEndRadius'
  | 'borderEndStartRadius'
  | 'borderInlineEndRadius'
  | 'borderInlineStartRadius'
  | 'borderLeftRadius'
  | 'borderRadius'
  | 'borderRightRadius'
  | 'borderStartEndRadius'
  | 'borderStartRadius'
  | 'borderStartStartRadius'
  | 'borderTopLeftRadius'
  | 'borderTopRadius'
  | 'borderTopRightRadius'
  | 'mozBorderRadius'
  | 'mozOutlineRadius';

type StrictRadiusValue =
  | RadiusToken
  | 'none'
  | 'inherit'
  | 'initial'
  | 'revert';

export type SafeRadiiProps = {
  [K in RadiiPropKeys]?: StylePropValue<StrictRadiusValue>;
};

export type StrictRadiiProps<P> = Omit<P, RadiiPropKeys> & SafeRadiiProps;

type SpacingPropKeys =
  | 'm'
  | 'margin'
  | 'marginBlock'
  | 'marginBottom'
  | 'marginInline'
  | 'marginLeft'
  | 'marginRight'
  | 'marginTop'
  | 'marginX'
  | 'marginY'
  | 'mb'
  | 'ml'
  | 'mr'
  | 'mt'
  | 'mx'
  | 'my'
  | 'p'
  | 'padding'
  | 'paddingBlock'
  | 'paddingBottom'
  | 'paddingInline'
  | 'paddingLeft'
  | 'paddingRight'
  | 'paddingTop'
  | 'paddingX'
  | 'paddingY'
  | 'pb'
  | 'pl'
  | 'pr'
  | 'pt'
  | 'px'
  | 'py';

type StrictSpacingValue =
  | SpacingToken
  | 0
  | '0'
  | 'auto'
  | 'inherit';

export type SafeSpacingProps = {
  [K in SpacingPropKeys]?: StylePropValue<StrictSpacingValue>;
};

export type StrictSpacingProps<P> = Omit<P, SpacingPropKeys> & SafeSpacingProps;

export type BaseSystemStyleObject = StyleProps;

export type SystemStyleObject = StrictSpacingProps<StrictRadiiProps<StrictColorProps<BaseSystemStyleObject>>> & {
  [K in StyleConditionKey]?: SystemStyleObject;
} & {
  [K in `&${string}`]?: SystemStyleObject;
};

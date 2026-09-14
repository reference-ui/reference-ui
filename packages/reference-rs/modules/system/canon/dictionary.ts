/**
 * Static dictionary definitions for Reference UI design system dialects.
 * Authoritative, self-isolated constants for curated HTML primitives,
 * utility class mappings, StyleProps aliases, conditions, and CSS allowlists.
 * Used exclusively by dialect ingest to produce the static compiler canon.
 */

// Curated HTML tags exposed as Reference JSX primitives
export const PRIMITIVE_TAGS = [
  'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'bdi', 'bdo',
  'blockquote', 'br', 'button', 'canvas', 'caption', 'cite', 'code', 'col',
  'colgroup', 'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog',
  'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure',
  'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup',
  'hr', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li',
  'main', 'map', 'mark', 'menu', 'meter', 'nav', 'object', 'ol', 'optgroup',
  'option', 'output', 'p', 'picture', 'pre', 'progress', 'q', 'rp', 'rt',
  'ruby', 's', 'samp', 'search', 'section', 'select', 'small', 'source', 'span',
  'strong', 'sub', 'summary', 'sup', 'svg', 'table', 'tbody', 'td', 'textarea',
  'tfoot', 'th', 'thead', 'time', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr',
] as const;

// Authoritative canonical utility string
export const CANONICAL_UTILITY_STRING =
  "display:d,hideFrom:hide-from,hideBelow:hide-below,visibility:vis,boxSizing:bx-sz," +
  "width:w,height:h,inlineSize:w-i,blockSize:h-b,minWidth:min-w,minHeight:min-h," +
  "maxWidth:max-w,maxHeight:max-h,boxSize:size/boxSize,minInlineSize:min-w-i," +
  "maxInlineSize:max-w-i,minBlockSize:min-h-b,maxBlockSize:max-h-b,overflow:ov," +
  "position:pos/1,zIndex:z,top:top,right:right,bottom:bottom,left:left,inset:inset," +
  "insetInline:inset-x/insetX,insetBlock:inset-y/insetY,insetInlineStart:inset-s/insetStart," +
  "insetInlineEnd:inset-e/insetEnd,color:c/1,fontFamily:font-family,fontSize:fs," +
  "fontWeight:font-weight,lineHeight:leading/1,letterSpacing:tracking/1,textAlign:ta," +
  "textDecoration:text-decoration,textTransform:text-transform,textWrap:text-wrap," +
  "whiteSpace:white-space,wordBreak:word-break,background:bg/1,backgroundColor:bg-c," +
  "backgroundClip:bg-clip,backgroundOrigin:bg-origin,backgroundPosition:bg-pos," +
  "backgroundRepeat:bg-repeat,backgroundSize:bg-sz,backgroundAttachment:bg-att," +
  "backgroundGradient:bg-grad/1,textGradient:text-grad/1,gradientFrom:from/1," +
  "gradientTo:to/1,gradientVia:via/1,border:bd/1,borderWidth:bd-w,borderColor:bd-c," +
  "borderTop:bd-t/1,borderTopWidth:bd-t-w,borderTopColor:bd-t-c,borderRight:bd-r/1," +
  "borderRightWidth:bd-r-w,borderRightColor:bd-r-c,borderBottom:bd-b/1," +
  "borderBottomWidth:bd-b-w,borderBottomColor:bd-b-c,borderLeft:bd-l/1," +
  "borderLeftWidth:bd-l-w,borderLeftColor:bd-l-c,borderInline:bd-x/borderX," +
  "borderInlineWidth:bd-x-w,borderInlineColor:bd-x-c,borderBlock:bd-y/borderY," +
  "borderBlockWidth:bd-y-w,borderBlockColor:bd-y-c,borderRadius:rounded/1," +
  "borderTopLeftRadius:rounded-tl/roundedTopLeft,borderTopRightRadius:rounded-tr/roundedTopRight," +
  "borderBottomRightRadius:rounded-br/roundedBottomRight,borderBottomLeftRadius:rounded-bl/roundedBottomLeft," +
  "borderTopRadius:rounded-t/roundedTop,borderRightRadius:rounded-r/roundedRight," +
  "borderBottomRadius:rounded-b/roundedBottom,borderLeftRadius:rounded-l/roundedLeft," +
  "borderStartRadius:rounded-s/roundedStart,borderEndRadius:rounded-e/roundedEnd," +
  "outline:ring/1,outlineWidth:ring-w,outlineColor:ring-c,outlineOffset:ring-offset," +
  "opacity:op,boxShadow:shadow/1,transform:transform,translate:translate,translateX:x/1," +
  "translateY:y/1,translateZ:z/1,scale:scale,scaleX:scale-x,scaleY:scale-y,rotate:rotate," +
  "rotateX:rotate-x,rotateY:rotate-y,rotateZ:rotate-z,flex:flex,flexDirection:flex-dir," +
  "flexWrap:flex-wrap,flexBasis:flex-basis,flexGrow:grow/1,flexShrink:shrink/1," +
  "justifyContent:jc,justifyItems:ji,justifySelf:js,alignContent:ac,alignItems:ai," +
  "alignSelf:as,gap:gap,rowGap:row-gap,columnGap:col-gap,gridTemplateColumns:grid-cols," +
  "gridTemplateRows:grid-rows,gridTemplateAreas:grid-areas,gridAutoColumns:auto-cols," +
  "gridAutoRows:auto-rows,gridAutoFlow:grid-flow,gridColumn:col/1,gridColumnStart:col-start," +
  "gridColumnEnd:col-end,gridRow:row/1,gridRowStart:row-start,gridRowEnd:row-end," +
  "gridArea:grid-area,margin:m/1,marginTop:mt/1,marginRight:mr/1,marginBottom:mb/1," +
  "marginLeft:ml/1,marginInline:mx/1,marginBlock:my/1,marginInlineStart:ms/1," +
  "marginInlineEnd:me/1,padding:p/1,paddingTop:pt/1,paddingRight:pr/1,paddingBottom:pb/1," +
  "paddingLeft:pl/1,paddingInline:px/1,paddingBlock:py/1,paddingInlineStart:ps/1," +
  "paddingInlineEnd:pe/1,spaceX:space-x,spaceY:space-y,transition:trans,transitionProperty:trans-prop," +
  "transitionDuration:trans-dur,transitionTimingFunction:trans-tf,transitionDelay:trans-delay," +
  "animation:anim,animationName:anim-n,animationDuration:anim-dur,animationTimingFunction:anim-tf," +
  "animationDelay:anim-delay,animationIterationCount:anim-ic,animationDirection:anim-dir," +
  "animationFillMode:anim-fm,animationPlayState:anim-ps,animationState:anim-s," +
  "filter:filter,blur:blur,brightness:brightness,contrast:contrast,dropShadow:drop-shadow," +
  "grayscale:grayscale,hueRotate:hue-rotate,invert:invert,saturate:saturate,sepia:sepia," +
  "backdropFilter:bd-filter,backdropBlur:bd-blur,backdropBrightness:bd-brightness," +
  "backdropContrast:bd-contrast,backdropGrayscale:bd-grayscale,backdropHueRotate:bd-hue-rotate," +
  "backdropInvert:bd-invert,backdropOpacity:bd-op,backdropSaturate:bd-saturate," +
  "backdropSepia:bd-sepia,scrollBehavior:scrb,scrollMargin:scrm,scrollMarginTop:scrm-t," +
  "scrollMarginRight:scrm-r,scrollMarginBottom:scrm-b,scrollMarginLeft:scrm-l," +
  "scrollPadding:scrp,scrollPaddingTop:scrp-t,scrollPaddingRight:scrp-r," +
  "scrollPaddingBottom:scrp-b,scrollPaddingLeft:scrp-l,scrollSnapAlign:scra," +
  "scrollSnapStop:scrs,scrollSnapType:scrt,scrollSnapStrictness:scrs-s," +
  "scrollSnapPointsX:scrs-px,scrollSnapPointsY:scrs-py,scrollSnapTypeX:scrs-tx," +
  "scrollSnapTypeY:scrs-ty,scrollTimeline:scrtl,scrollTimelineAxis:scrtl-a," +
  "scrollTimelineName:scrtl-n,touchAction:tch-a,userSelect:us,overflowWrap:ov-wrap," +
  "overflowX:ov-x,overflowY:ov-y,overflowAnchor:ov-a,overflowBlock:ov-b,overflowInline:ov-i," +
  "overflowClipBox:ovcp-bx,overflowClipMargin:ovcp-m,overscrollBehaviorBlock:ovs-bb," +
  "overscrollBehaviorInline:ovs-bi,fill:fill,stroke:stroke,strokeWidth:stk-w," +
  "strokeDasharray:stk-dsh,strokeDashoffset:stk-do,strokeLinecap:stk-lc,strokeLinejoin:stk-lj," +
  "strokeMiterlimit:stk-ml,strokeOpacity:stk-op,srOnly:sr,debug:debug,appearance:ap," +
  "backfaceVisibility:bfv,clipPath:cp-path,hyphens:hy,mask:msk,maskImage:msk-i," +
  "maskSize:msk-s,textSizeAdjust:txt-adj,container:cq,containerName:cq-n,containerType:cq-t," +
  "cursor:cursor,textStyle:textStyle";

export const CUSTOM_PREFIXES: Record<string, string> = {
  borderStyle: 'border-style',
  borderTopStyle: 'bd-t-s',
  borderRightStyle: 'bd-r-s',
  borderBottomStyle: 'bd-b-s',
  borderLeftStyle: 'bd-l-s',
  borderInlineStyle: 'bd-x-s',
  borderBlockStyle: 'bd-y-s',
  borderInlineStartStyle: 'bd-s-s',
  borderInlineEndStyle: 'bd-e-s',
  borderBlockStartStyle: 'bd-bs-s',
  borderBlockEndStyle: 'bd-be-s',
  outlineStyle: 'ring-s',
};

export const KNOWN_ALIASES: Record<string, string> = {
  b: 'border',
  bg: 'background',
  bgAttachment: 'backgroundAttachment',
  bgBlendMode: 'backgroundBlendMode',
  bgClip: 'backgroundClip',
  bgColor: 'backgroundColor',
  bgConic: 'backgroundConic',
  bgGradient: 'backgroundGradient',
  bgImage: 'backgroundImage',
  bgLinear: 'backgroundLinear',
  bgOrigin: 'backgroundOrigin',
  bgPosition: 'backgroundPosition',
  bgPositionX: 'backgroundPositionX',
  bgPositionY: 'backgroundPositionY',
  bgRadial: 'backgroundRadial',
  bgRepeat: 'backgroundRepeat',
  bgSize: 'backgroundSize',
  borderB: 'borderBottom',
  borderBlock: 'borderBlock',
  borderC: 'borderColor',
  borderEnd: 'borderInlineEnd',
  borderEndC: 'borderInlineEndColor',
  borderEndWidth: 'borderInlineEndWidth',
  borderInline: 'borderInline',
  borderL: 'borderLeft',
  borderR: 'borderRight',
  borderStart: 'borderInlineStart',
  borderStartC: 'borderInlineStartColor',
  borderStartWidth: 'borderInlineStartWidth',
  borderT: 'borderTop',
  borderX: 'borderInline',
  borderXC: 'borderInlineColor',
  borderXWidth: 'borderInlineWidth',
  borderY: 'borderBlock',
  borderYC: 'borderBlockColor',
  borderYWidth: 'borderBlockWidth',
  c: 'color',
  end: 'insetInlineEnd',
  flexDir: 'flexDirection',
  h: 'height',
  insetEnd: 'insetInlineEnd',
  insetStart: 'insetInlineStart',
  insetX: 'insetInline',
  insetY: 'insetBlock',
  m: 'margin',
  marginEnd: 'marginInlineEnd',
  marginStart: 'marginInlineStart',
  marginX: 'marginInline',
  marginY: 'marginBlock',
  maxH: 'maxHeight',
  maxW: 'maxWidth',
  mb: 'marginBottom',
  me: 'marginInlineEnd',
  minH: 'minHeight',
  minW: 'minWidth',
  ml: 'marginLeft',
  mr: 'marginRight',
  ms: 'marginInlineStart',
  mt: 'marginTop',
  mx: 'marginInline',
  my: 'marginBlock',
  p: 'padding',
  paddingEnd: 'paddingInlineEnd',
  paddingStart: 'paddingInlineStart',
  paddingX: 'paddingInline',
  paddingY: 'paddingBlock',
  pb: 'paddingBottom',
  pe: 'paddingInlineEnd',
  pl: 'paddingLeft',
  pos: 'position',
  pr: 'paddingRight',
  ps: 'paddingInlineStart',
  pt: 'paddingTop',
  px: 'paddingInline',
  py: 'paddingBlock',
  ring: 'outline',
  ringColor: 'outlineColor',
  ringOffset: 'outlineOffset',
  ringWidth: 'outlineWidth',
  rounded: 'borderRadius',
  roundedBottom: 'borderBottomRadius',
  roundedBottomLeft: 'borderBottomLeftRadius',
  roundedBottomRight: 'borderBottomRightRadius',
  roundedEnd: 'borderEndRadius',
  roundedEndEnd: 'borderEndEndRadius',
  roundedEndStart: 'borderEndStartRadius',
  roundedLeft: 'borderLeftRadius',
  roundedRight: 'borderRightRadius',
  roundedStart: 'borderStartRadius',
  roundedStartEnd: 'borderStartEndRadius',
  roundedStartStart: 'borderStartStartRadius',
  roundedTop: 'borderTopRadius',
  roundedTopLeft: 'borderTopLeftRadius',
  roundedTopRight: 'borderTopRightRadius',
  scrollMarginX: 'scrollMarginInline',
  scrollMarginY: 'scrollMarginBlock',
  scrollPaddingX: 'scrollPaddingInline',
  scrollPaddingY: 'scrollPaddingBlock',
  shadow: 'boxShadow',
  shadowColor: 'boxShadowColor',
  start: 'insetInlineStart',
  textShadowColor: 'textShadowColor',
  w: 'width',
  x: 'translateX',
  y: 'translateY',
  z: 'translateZ',
};

export const NATIVE_SHORTHANDS: Record<string, string[]> = {
  padding: ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'],
  margin: ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'],
  border: ['borderWidth', 'borderStyle', 'borderColor'],
  inset: ['top', 'right', 'bottom', 'left'],
  outline: ['outlineWidth', 'outlineStyle', 'outlineColor'],
  borderTop: ['borderTopWidth', 'borderTopStyle', 'borderTopColor'],
  borderRight: ['borderRightWidth', 'borderRightStyle', 'borderRightColor'],
  borderBottom: ['borderBottomWidth', 'borderBottomStyle', 'borderBottomColor'],
  borderLeft: ['borderLeftWidth', 'borderLeftStyle', 'borderLeftColor'],
  borderInline: ['borderInlineWidth', 'borderInlineStyle', 'borderInlineColor'],
  borderBlock: ['borderBlockWidth', 'borderBlockStyle', 'borderBlockColor'],
};

export const ORDERED_BREAKPOINTS = ['base', 'sm', 'md', 'lg', 'xl', '2xl'] as const;

export const REFERENCE_ONLY_PROPS = [
  'colorMode',
  'container',
  'font',
  'r',
  'variant',
  'weight',
] as const;

export const CONDITION_KEYS = [
  'active', 'after', 'anyPointerCoarse', 'anyPointerFine', 'anyPointerNone', 'atValue', 'autofill',
  'backdrop', 'before', 'checked', 'closed', 'complete', 'current', 'currentPage', 'currentStep',
  'dark', 'default', 'disabled', 'dragging', 'empty', 'enabled', 'even', 'expanded', 'file', 'first',
  'firstLetter', 'firstLine', 'firstOfType', 'focus', 'focusVisible', 'focusWithin', 'fullscreen',
  'grabbed', 'groupActive', 'groupChecked', 'groupDisabled', 'groupExpanded', 'groupFocus',
  'groupFocusVisible', 'groupFocusWithin', 'groupHover', 'groupInvalid', 'hidden', 'highContrast',
  'highlighted', 'horizontal', 'hover', 'icon', 'inRange', 'incomplete', 'indeterminate', 'inert',
  'invalid', 'invertedColors', 'landscape', 'last', 'lastOfType', 'lessContrast', 'light', 'loading',
  'ltr', 'marker', 'moreContrast', 'motionReduce', 'motionSafe', 'noscript', 'now', 'odd', 'only',
  'onlyOfType', 'open', 'optional', 'osDark', 'osLight', 'outOfRange', 'overValue', 'peerActive',
  'peerChecked', 'peerDisabled', 'peerExpanded', 'peerFocus', 'peerFocusVisible', 'peerFocusWithin',
  'peerHover', 'peerInvalid', 'peerPlaceholderShown', 'placeholder', 'placeholderShown', 'pointerCoarse',
  'pointerFine', 'pointerNone', 'portrait', 'pressed', 'print', 'rangeEnd', 'rangeStart', 'readOnly',
  'readWrite', 'required', 'rtl', 'scrollbar', 'scrollbarThumb', 'scrollbarTrack', 'selected',
  'selection', 'starting', 'target', 'today', 'topmost', 'unavailable', 'underValue', 'userInvalid',
  'userValid', 'valid', 'vertical', 'visited',
] as const;

export const DIALECT_CSS_ALLOWLIST = new Set<string>([
  'animation-state',
  'backdrop-blur',
  'backdrop-brightness',
  'backdrop-contrast',
  'backdrop-grayscale',
  'backdrop-hue-rotate',
  'backdrop-invert',
  'backdrop-opacity',
  'backdrop-saturate',
  'backdrop-sepia',
  'background-conic',
  'background-gradient',
  'background-linear',
  'background-radial',
  'blur',
  'border-block-end-style',
  'border-block-start-style',
  'border-block-style',
  'border-bottom-style',
  'border-end-radius',
  'border-inline-end-style',
  'border-inline-start-style',
  'border-inline-style',
  'border-left-style',
  'border-right-style',
  'border-spacing-x',
  'border-spacing-y',
  'border-start-radius',
  'border-top-style',
  'box-size',
  'brightness',
  'contrast',
  'debug',
  'divide-color',
  'divide-style',
  'divide-x',
  'divide-y',
  'drop-shadow',
  'focus-ring',
  'focus-ring-color',
  'focus-ring-offset',
  'focus-ring-style',
  'focus-ring-width',
  'focus-visible-ring',
  'font-smoothing',
  'gradient-from',
  'gradient-from-position',
  'gradient-to',
  'gradient-to-position',
  'gradient-via',
  'gradient-via-position',
  'grayscale',
  'hide-below',
  'hide-from',
  'hue-rotate',
  'invert',
  'outline-style',
  'overflow-clip-box',
  'rotate-x',
  'rotate-y',
  'rotate-z',
  'saturate',
  'scale-x',
  'scale-y',
  'scrollbar',
  'scroll-snap-coordinate',
  'scroll-snap-destination',
  'scroll-snap-margin',
  'scroll-snap-margin-bottom',
  'scroll-snap-margin-left',
  'scroll-snap-margin-right',
  'scroll-snap-margin-top',
  'scroll-snap-points-x',
  'scroll-snap-points-y',
  'scroll-snap-strictness',
  'scroll-snap-type-x',
  'scroll-snap-type-y',
  'sepia',
  'space-x',
  'space-y',
  'sr-only',
  'text-gradient',
  'text-shadow-color',
  'text-style',
  'translate-x',
  'translate-y',
  'translate-z',
  'truncate',
  'webkit-text-fill-color',
]);

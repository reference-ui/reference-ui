/* eslint-disable */
import type { ConditionalValue } from './conditions';
import type { CssProperties } from './system-types';
import type { Tokens } from '../tokens/index';

export interface UtilityValues {
	top: Tokens["spacing"] | CssProperties["top"];
	left: Tokens["spacing"] | CssProperties["left"];
	inset: Tokens["spacing"] | CssProperties["inset"];
	insetInline: Tokens["spacing"] | CssProperties["insetInline"];
	insetBlock: Tokens["spacing"] | CssProperties["insetBlock"];
	insetBlockEnd: Tokens["spacing"] | CssProperties["insetBlockEnd"];
	insetBlockStart: Tokens["spacing"] | CssProperties["insetBlockStart"];
	insetInlineEnd: Tokens["spacing"] | CssProperties["insetInlineEnd"];
	insetInlineStart: Tokens["spacing"] | CssProperties["insetInlineStart"];
	right: Tokens["spacing"] | CssProperties["right"];
	bottom: Tokens["spacing"] | CssProperties["bottom"];
	float: "start" | "end" | CssProperties["float"];
	flexBasis: "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "1/5" | "2/5" | "3/5" | "4/5" | "1/6" | "2/6" | "3/6" | "4/6" | "5/6" | "1/12" | "2/12" | "3/12" | "4/12" | "5/12" | "6/12" | "7/12" | "8/12" | "9/12" | "10/12" | "11/12" | "full";
	flex: "1" | "auto" | "initial" | "none";
	gridAutoColumns: "min" | "max" | "fr";
	gridAutoRows: "min" | "max" | "fr";
	gap: Tokens["spacing"] | CssProperties["gap"];
	gridGap: Tokens["spacing"] | CssProperties["gridGap"];
	gridRowGap: Tokens["spacing"] | CssProperties["gridRowGap"];
	gridColumnGap: Tokens["spacing"] | CssProperties["gridColumnGap"];
	rowGap: Tokens["spacing"] | CssProperties["rowGap"];
	columnGap: Tokens["spacing"] | CssProperties["columnGap"];
	padding: Tokens["spacing"] | CssProperties["padding"];
	paddingLeft: Tokens["spacing"] | CssProperties["paddingLeft"];
	paddingRight: Tokens["spacing"] | CssProperties["paddingRight"];
	paddingTop: Tokens["spacing"] | CssProperties["paddingTop"];
	paddingBottom: Tokens["spacing"] | CssProperties["paddingBottom"];
	paddingBlock: Tokens["spacing"] | CssProperties["paddingBlock"];
	paddingBlockEnd: Tokens["spacing"] | CssProperties["paddingBlockEnd"];
	paddingBlockStart: Tokens["spacing"] | CssProperties["paddingBlockStart"];
	paddingInline: Tokens["spacing"] | CssProperties["paddingInline"];
	paddingInlineEnd: Tokens["spacing"] | CssProperties["paddingInlineEnd"];
	paddingInlineStart: Tokens["spacing"] | CssProperties["paddingInlineStart"];
	marginLeft: Tokens["spacing"] | CssProperties["marginLeft"];
	marginRight: Tokens["spacing"] | CssProperties["marginRight"];
	marginTop: Tokens["spacing"] | CssProperties["marginTop"];
	marginBottom: Tokens["spacing"] | CssProperties["marginBottom"];
	margin: Tokens["spacing"] | CssProperties["margin"];
	marginBlock: Tokens["spacing"] | CssProperties["marginBlock"];
	marginBlockEnd: Tokens["spacing"] | CssProperties["marginBlockEnd"];
	marginBlockStart: Tokens["spacing"] | CssProperties["marginBlockStart"];
	marginInline: Tokens["spacing"] | CssProperties["marginInline"];
	marginInlineEnd: Tokens["spacing"] | CssProperties["marginInlineEnd"];
	marginInlineStart: Tokens["spacing"] | CssProperties["marginInlineStart"];
	spaceX: "auto" | Tokens["spacing"] | CssProperties["marginInlineStart"];
	spaceY: "auto" | Tokens["spacing"] | CssProperties["marginBlockStart"];
	outlineColor: Tokens["colors"];
	outlineOffset: Tokens["spacing"] | CssProperties["outlineOffset"];
	focusRing: "outside" | "inside" | "mixed" | "none";
	focusVisibleRing: "outside" | "inside" | "mixed" | "none";
	focusRingColor: Tokens["colors"];
	focusRingOffset: Tokens["spacing"];
	focusRingWidth: CssProperties["outlineWidth"];
	focusRingStyle: CssProperties["outlineStyle"];
	divideColor: Tokens["colors"];
	divideStyle: CssProperties["borderStyle"];
	width: Tokens["spacing"] | CssProperties["width"];
	inlineSize: "auto" | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "1/5" | "2/5" | "3/5" | "4/5" | "1/6" | "2/6" | "3/6" | "4/6" | "5/6" | "1/12" | "2/12" | "3/12" | "4/12" | "5/12" | "6/12" | "7/12" | "8/12" | "9/12" | "10/12" | "11/12" | "screen";
	minWidth: "auto" | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "1/5" | "2/5" | "3/5" | "4/5" | "1/6" | "2/6" | "3/6" | "4/6" | "5/6" | "1/12" | "2/12" | "3/12" | "4/12" | "5/12" | "6/12" | "7/12" | "8/12" | "9/12" | "10/12" | "11/12" | "screen";
	minInlineSize: "auto" | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "1/5" | "2/5" | "3/5" | "4/5" | "1/6" | "2/6" | "3/6" | "4/6" | "5/6" | "1/12" | "2/12" | "3/12" | "4/12" | "5/12" | "6/12" | "7/12" | "8/12" | "9/12" | "10/12" | "11/12" | "screen";
	maxWidth: "auto" | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "1/5" | "2/5" | "3/5" | "4/5" | "1/6" | "2/6" | "3/6" | "4/6" | "5/6" | "1/12" | "2/12" | "3/12" | "4/12" | "5/12" | "6/12" | "7/12" | "8/12" | "9/12" | "10/12" | "11/12" | "screen";
	maxInlineSize: "auto" | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "1/5" | "2/5" | "3/5" | "4/5" | "1/6" | "2/6" | "3/6" | "4/6" | "5/6" | "1/12" | "2/12" | "3/12" | "4/12" | "5/12" | "6/12" | "7/12" | "8/12" | "9/12" | "10/12" | "11/12" | "screen";
	height: Tokens["spacing"] | CssProperties["height"];
	blockSize: "auto" | "svh" | "lvh" | "dvh" | "screen" | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "1/5" | "2/5" | "3/5" | "4/5" | "1/6" | "2/6" | "3/6" | "4/6" | "5/6";
	minHeight: "auto" | "svh" | "lvh" | "dvh" | "screen" | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "1/5" | "2/5" | "3/5" | "4/5" | "1/6" | "2/6" | "3/6" | "4/6" | "5/6";
	minBlockSize: "auto" | "svh" | "lvh" | "dvh" | "screen" | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "1/5" | "2/5" | "3/5" | "4/5" | "1/6" | "2/6" | "3/6" | "4/6" | "5/6";
	maxHeight: "auto" | "svh" | "lvh" | "dvh" | "screen" | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "1/5" | "2/5" | "3/5" | "4/5" | "1/6" | "2/6" | "3/6" | "4/6" | "5/6";
	maxBlockSize: "auto" | "svh" | "lvh" | "dvh" | "screen" | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "1/5" | "2/5" | "3/5" | "4/5" | "1/6" | "2/6" | "3/6" | "4/6" | "5/6";
	boxSize: "auto" | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "1/5" | "2/5" | "3/5" | "4/5" | "1/6" | "2/6" | "3/6" | "4/6" | "5/6" | "1/12" | "2/12" | "3/12" | "4/12" | "5/12" | "6/12" | "7/12" | "8/12" | "9/12" | "10/12" | "11/12" | "screen";
	color: Tokens["colors"];
	fontFamily: Tokens["fonts"];
	fontSize: Tokens["fontSizes"];
	fontSmoothing: "antialiased" | "subpixel-antialiased";
	textDecorationColor: Tokens["colors"];
	textEmphasisColor: Tokens["colors"];
	textIndent: Tokens["spacing"];
	textShadowColor: Tokens["colors"];
	WebkitTextFillColor: Tokens["colors"];
	textWrap: "wrap" | "balance" | "nowrap";
	truncate: boolean;
	background: Tokens["colors"];
	backgroundColor: Tokens["colors"];
	backgroundGradient: "to-t" | "to-tr" | "to-r" | "to-br" | "to-b" | "to-bl" | "to-l" | "to-tl";
	backgroundLinear: "to-t" | "to-tr" | "to-r" | "to-br" | "to-b" | "to-bl" | "to-l" | "to-tl";
	textGradient: "to-t" | "to-tr" | "to-r" | "to-br" | "to-b" | "to-bl" | "to-l" | "to-tl";
	gradientFrom: Tokens["colors"];
	gradientTo: Tokens["colors"];
	gradientVia: Tokens["colors"];
	borderRadius: Tokens["radii"];
	borderTopLeftRadius: Tokens["radii"];
	borderTopRightRadius: Tokens["radii"];
	borderBottomRightRadius: Tokens["radii"];
	borderBottomLeftRadius: Tokens["radii"];
	borderTopRadius: Tokens["radii"] | CssProperties["borderRadius"];
	borderRightRadius: Tokens["radii"] | CssProperties["borderRadius"];
	borderBottomRadius: Tokens["radii"] | CssProperties["borderRadius"];
	borderLeftRadius: Tokens["radii"] | CssProperties["borderRadius"];
	borderStartStartRadius: Tokens["radii"];
	borderStartEndRadius: Tokens["radii"];
	borderStartRadius: Tokens["radii"] | CssProperties["borderRadius"];
	borderEndStartRadius: Tokens["radii"];
	borderEndEndRadius: Tokens["radii"];
	borderEndRadius: Tokens["radii"] | CssProperties["borderRadius"];
	borderColor: Tokens["colors"];
	borderInlineColor: Tokens["colors"];
	borderBlockColor: Tokens["colors"];
	borderLeftColor: Tokens["colors"];
	borderInlineStartColor: Tokens["colors"];
	borderRightColor: Tokens["colors"];
	borderInlineEndColor: Tokens["colors"];
	borderTopColor: Tokens["colors"];
	borderBottomColor: Tokens["colors"];
	borderBlockEndColor: Tokens["colors"];
	borderBlockStartColor: Tokens["colors"];
	boxShadowColor: Tokens["colors"];
	filter: "auto";
	backdropFilter: "auto";
	borderSpacing: Tokens["spacing"] | CssProperties["borderSpacing"];
	borderSpacingX: Tokens["spacing"];
	borderSpacingY: Tokens["spacing"];
	transitionProperty: "common" | "colors" | "size" | "position" | "background";
	transition: "all" | "common" | "size" | "position" | "background" | "colors" | "opacity" | "shadow" | "transform";
	rotate: "auto" | "auto-3d" | CssProperties["rotate"];
	rotateX: CssProperties["rotate"];
	rotateY: CssProperties["rotate"];
	rotateZ: CssProperties["rotate"];
	scale: "auto" | CssProperties["scale"];
	translate: "auto" | "auto-3d" | CssProperties["translate"];
	translateX: Tokens["spacing"] | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "full" | "-1/2" | "-1/3" | "-2/3" | "-1/4" | "-2/4" | "-3/4" | "-full";
	translateY: Tokens["spacing"] | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "full" | "-1/2" | "-1/3" | "-2/3" | "-1/4" | "-2/4" | "-3/4" | "-full";
	translateZ: Tokens["spacing"] | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "full" | "-1/2" | "-1/3" | "-2/3" | "-1/4" | "-2/4" | "-3/4" | "-full";
	accentColor: Tokens["colors"];
	caretColor: Tokens["colors"];
	scrollbar: "visible" | "hidden";
	scrollbarColor: Tokens["colors"];
	scrollMargin: Tokens["spacing"] | CssProperties["scrollMargin"];
	scrollMarginLeft: Tokens["spacing"] | CssProperties["scrollMarginLeft"];
	scrollMarginRight: Tokens["spacing"] | CssProperties["scrollMarginRight"];
	scrollMarginTop: Tokens["spacing"] | CssProperties["scrollMarginTop"];
	scrollMarginBottom: Tokens["spacing"] | CssProperties["scrollMarginBottom"];
	scrollMarginBlock: Tokens["spacing"] | CssProperties["scrollMarginBlock"];
	scrollMarginBlockEnd: Tokens["spacing"] | CssProperties["scrollMarginBlockEnd"];
	scrollMarginBlockStart: Tokens["spacing"] | CssProperties["scrollMarginBlockStart"];
	scrollMarginInline: Tokens["spacing"] | CssProperties["scrollMarginInline"];
	scrollMarginInlineEnd: Tokens["spacing"] | CssProperties["scrollMarginInlineEnd"];
	scrollMarginInlineStart: Tokens["spacing"] | CssProperties["scrollMarginInlineStart"];
	scrollPadding: Tokens["spacing"] | CssProperties["scrollPadding"];
	scrollPaddingBlock: Tokens["spacing"] | CssProperties["scrollPaddingBlock"];
	scrollPaddingBlockStart: Tokens["spacing"] | CssProperties["scrollPaddingBlockStart"];
	scrollPaddingBlockEnd: Tokens["spacing"] | CssProperties["scrollPaddingBlockEnd"];
	scrollPaddingInline: Tokens["spacing"] | CssProperties["scrollPaddingInline"];
	scrollPaddingInlineEnd: Tokens["spacing"] | CssProperties["scrollPaddingInlineEnd"];
	scrollPaddingInlineStart: Tokens["spacing"] | CssProperties["scrollPaddingInlineStart"];
	scrollPaddingLeft: Tokens["spacing"] | CssProperties["scrollPaddingLeft"];
	scrollPaddingRight: Tokens["spacing"] | CssProperties["scrollPaddingRight"];
	scrollPaddingTop: Tokens["spacing"] | CssProperties["scrollPaddingTop"];
	scrollPaddingBottom: Tokens["spacing"] | CssProperties["scrollPaddingBottom"];
	scrollSnapType: "none" | "x" | "y" | "both";
	scrollSnapStrictness: "mandatory" | "proximity";
	scrollSnapMargin: Tokens["spacing"];
	scrollSnapMarginTop: Tokens["spacing"];
	scrollSnapMarginBottom: Tokens["spacing"];
	scrollSnapMarginLeft: Tokens["spacing"];
	scrollSnapMarginRight: Tokens["spacing"];
	fill: Tokens["colors"];
	stroke: Tokens["colors"];
	srOnly: boolean;
	debug: boolean;
	containerName: CssProperties["containerName"];
	colorPalette: "gray" | "red" | "orange" | "amber" | "yellow" | "lime" | "green" | "emerald" | "teal" | "cyan" | "sky" | "blue" | "indigo" | "violet" | "purple" | "magenta" | "pink" | "rose";
}



type WithColorOpacityModifier<T> = [T] extends [string] ? `${T}/${string}` & { __colorOpacityModifier?: true } : never

type ImportantMark = "!" | "!important"
type WhitespaceImportant = ` ${ImportantMark}`
type Important = ImportantMark | WhitespaceImportant
type WithImportant<T> = [T] extends [string] ? `${T}${Important}` & { __important?: true } : never

/**
 * Only relevant when using `strictTokens` or `strictPropertyValues` in your config.
 * - Allows you to use an escape hatch (e.g. `[123px]`) to use any string as a value.
 * - Allows you to use a color opacity modifier (e.g. `red/300`) with known color values.
 * - Allows you to use an important mark (e.g. `!` or `!important`) in the value.
 *
 * This is useful when you want to use a value that is not defined in the config or want to opt-out of the defaults.
 *
 * @example
 * css({
 *   fontSize: '[123px]', // ⚠️ will not throw even if you haven't defined 123px as a token
 * })
 *
 * @see https://panda-css.com/docs/concepts/writing-styles#stricttokens
 * @see https://panda-css.com/docs/concepts/writing-styles#strictpropertyvalues
 */
export type WithEscapeHatch<T> = T | `[${string}]` | WithColorOpacityModifier<T> | WithImportant<T>

/**
 * Will restrict the value of properties that have predefined values to those values only.
 *
 * @example
 * css({
 *   display: 'abc', // ❌ will throw
 * })
 *
 * @see https://panda-css.com/docs/concepts/writing-styles#strictpropertyvalues
 */
export type OnlyKnown<Key, Value> = Value extends boolean
  ? Value
  : Value extends `${infer _}` ? Value : never
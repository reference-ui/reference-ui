import type { UtilityValues } from '@reference-ui/styled/types/prop-type';
import type { SystemProperties } from '@reference-ui/styled/types/style-props';
import type { StylePropValue } from './style-prop';
/**
 * Color-bearing style props exposed on primitives and public style helpers.
 * These are prop keys like `color` and `backgroundColor`, not color values.
 * We narrow their value domains back to tokens so arbitrary CSS color strings
 * do not leak through Panda's wider generated unions.
 */
export declare const COLOR_PROP_KEYS: readonly ["accentColor", "backgroundColor", "bg", "bgColor", "borderBlockColor", "borderBlockEndColor", "borderBlockStartColor", "borderBottomColor", "borderColor", "borderEndColor", "borderInlineColor", "borderInlineEndColor", "borderInlineStartColor", "borderLeftColor", "borderRightColor", "borderStartColor", "borderTopColor", "borderXColor", "borderYColor", "boxShadowColor", "caretColor", "color", "columnRuleColor", "divideColor", "fill", "floodColor", "focusRingColor", "lightingColor", "outlineColor", "ringColor", "scrollbarColor", "shadowColor", "stopColor", "stroke", "textDecorationColor", "textEmphasisColor", "textShadowColor"];
export type ColorPropKeys = 'accentColor' | 'backgroundColor' | 'bg' | 'bgColor' | 'borderBlockColor' | 'borderBlockEndColor' | 'borderBlockStartColor' | 'borderBottomColor' | 'borderColor' | 'borderEndColor' | 'borderInlineColor' | 'borderInlineEndColor' | 'borderInlineStartColor' | 'borderLeftColor' | 'borderRightColor' | 'borderStartColor' | 'borderTopColor' | 'borderXColor' | 'borderYColor' | 'boxShadowColor' | 'caretColor' | 'color' | 'columnRuleColor' | 'divideColor' | 'fill' | 'floodColor' | 'focusRingColor' | 'lightingColor' | 'outlineColor' | 'ringColor' | 'scrollbarColor' | 'shadowColor' | 'stopColor' | 'stroke' | 'textDecorationColor' | 'textEmphasisColor' | 'textShadowColor';
type ColorToken = UtilityValues['backgroundColor'];
type StrictColorValue = ColorToken | 'white' | 'black' | 'inherit' | 'currentColor' | 'transparent';
export type SafeColorProps = {
    [K in Extract<keyof SystemProperties, ColorPropKeys>]?: StylePropValue<StrictColorValue>;
};
export type StrictColorProps<P> = Omit<P, ColorPropKeys> & SafeColorProps;
export {};

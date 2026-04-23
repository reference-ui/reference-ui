import type { FontRegistry } from './fontRegistry';
import type { StylePropValue } from './style-prop';
type StringKey<T> = Extract<keyof T, string>;
export type FontName = StringKey<FontRegistry>;
export type FontWeightName<TFont extends FontName> = StringKey<FontRegistry[TFont]>;
export type ScopedFontWeight<TFont extends FontName> = `${TFont}.${FontWeightName<TFont>}`;
export type FontWeightValue<TFont extends FontName> = FontWeightName<TFont> | ScopedFontWeight<TFont>;
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
/**
 * When `FontRegistry` is empty, `ScopedFontProps` is `never`. A plain conditional
 * `FontProps` is easy for `.d.ts` bundlers to mis-emit as `FontProps = ScopedFontProps`,
 * which makes `ReferenceProps` / `StyleProps` collapse to `never`. Intersecting
 * `FallbackFontProps` with `unknown` when there are no font keys keeps the public
 * props usable; when keys exist, the intersection still narrows `font` / `weight`.
 */
export type FontProps = FallbackFontProps & ([FontName] extends [never] ? unknown : ScopedFontProps);
export {};

import type { StyleConditionKey } from './conditions';
/**
 * Values for style-related props: plain `T`, arrays, or the subset of styled
 * conditions Reference UI keeps public. Viewport breakpoint keys are filtered
 * out via `StyleConditionKey`.
 */
export type StylePropValue<T> = T | Array<T | null> | {
    [K in StyleConditionKey]?: StylePropValue<T>;
};

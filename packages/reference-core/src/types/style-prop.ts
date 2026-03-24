import type { ConditionalValue as StyledConditionalValue } from '@reference-ui/styled/types/conditions'
import type { StyleConditionKey } from './conditions'

/**
 * Values for style-related props: plain `T`, arrays, or the filtered condition
 * keys Reference UI wants to keep public.
 */
export type StylePropValue<T> =
  | T
  | Array<T | null>
  | {
      [K in StyleConditionKey]?: StylePropValue<T>
    }

export type ToStylePropValue<T> = T extends StyledConditionalValue<infer V>
  ? StylePropValue<V>
  : T

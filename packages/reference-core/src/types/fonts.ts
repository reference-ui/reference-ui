import type { FontRegistry } from './fontRegistry'
import type { StylePropValue } from './style-prop'

type StringKey<T> = Extract<keyof T, string>

export type FontName = StringKey<FontRegistry>

export type FontWeightName<TFont extends FontName> =
  StringKey<FontRegistry[TFont]>

export type ScopedFontWeight<TFont extends FontName> =
  `${TFont}.${FontWeightName<TFont>}`

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

export type FontProps = [FontName] extends [never]
  ? FallbackFontProps
  : ScopedFontProps

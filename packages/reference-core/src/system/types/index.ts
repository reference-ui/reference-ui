import type { ConditionalValue, SystemStyleObject } from '@reference-ui/styled/types'

type StringKey<T> = Extract<keyof T, string>

/**
 * Generated systems augment this registry with concrete font names and weights.
 * The empty interface here keeps the source package generic until `ref sync`
 * writes the user-specific declaration augmentation.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ReferenceFontRegistry {}

export type ReferenceFontName = StringKey<ReferenceFontRegistry>

export type ReferenceFontWeightName<TFont extends ReferenceFontName> =
  StringKey<ReferenceFontRegistry[TFont]>

export type ReferenceScopedFontWeight<TFont extends ReferenceFontName> =
  `${TFont}.${ReferenceFontWeightName<TFont>}`

export type ReferenceFontWeightValue<TFont extends ReferenceFontName> =
  | ReferenceFontWeightName<TFont>
  | ReferenceScopedFontWeight<TFont>

type ReferenceScopedFontProps = {
  [TFont in ReferenceFontName]: {
    font?: ConditionalValue<TFont>
    weight?: ConditionalValue<ReferenceFontWeightValue<TFont>>
  }
}[ReferenceFontName]

type ReferenceFallbackFontProps = {
  font?: ConditionalValue<string>
  weight?: ConditionalValue<string>
}

export interface ReferenceContainerProps {
  container?: ConditionalValue<string | boolean>
}

export interface ReferenceResponsiveProps {
  r?: ConditionalValue<Record<string | number, SystemStyleObject>>
}

export type ReferenceFontProps = [ReferenceFontName] extends [never]
  ? ReferenceFallbackFontProps
  : ReferenceScopedFontProps

export type ReferenceBoxPatternProps =
  & ReferenceContainerProps
  & ReferenceResponsiveProps
  & ReferenceFontProps

export type ReferenceSystemStyleObject = Omit<
  SystemStyleObject,
  'font' | 'weight' | 'container' | 'r'
> &
  ReferenceBoxPatternProps

import type {
  ColorModeProps,
  ContainerProps,
  FontName,
  FontProps,
  FontWeightName,
  FontWeightValue,
  ReferenceProps,
  ResponsiveProps,
  ScopedFontWeight,
  SystemStyleObject as PublicSystemStyleObject,
} from '../../types'

/**
 * Generated systems augment this registry with concrete font names and weights.
 * The empty interface here keeps the legacy `Reference*` surface augmentable,
 * while the actual font type graph now flows through `src/types`.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ReferenceFontRegistry {}

declare module '../../types/fontRegistry' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface FontRegistry extends ReferenceFontRegistry {}
}

export type ReferenceFontName = FontName

export type ReferenceFontWeightName<TFont extends ReferenceFontName> =
  FontWeightName<TFont>

export type ReferenceScopedFontWeight<TFont extends ReferenceFontName> =
  ScopedFontWeight<TFont>

export type ReferenceFontWeightValue<TFont extends ReferenceFontName> =
  FontWeightValue<TFont>

export type ReferenceFontProps = FontProps

export type ReferenceContainerProps = ContainerProps

/**
 * Theme scope for token resolution.
 * Supported on HTML primitives only and emitted as Panda's `data-panda-theme`
 * attribute, not through the Panda `box()` pattern / `ReferenceSystemStyleObject`.
 */
export type ReferenceColorModeProps = ColorModeProps

export type ReferenceResponsiveProps = ResponsiveProps

export type ReferenceBoxPatternProps = ReferenceProps

export type ReferenceSystemStyleObject = PublicSystemStyleObject

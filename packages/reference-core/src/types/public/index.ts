/**
 * Public type surface for `@reference-ui/core`.
 *
 * Authored modules (this directory) are the source of truth for the public type
 * graph that the packager assembles into `@reference-ui/system` and
 * `@reference-ui/react`. Strict-token variants live next to their open
 * counterparts (`strict-colors.ts`, `strict-radii.ts`) and are selected at
 * package-assembly time, not by post-emit declaration patching.
 */
export type { BaseSystem } from './BaseSystem'
export type {
  CssFunction,
  CssRawFunction,
  CssStyles,
} from './css'
export type {
  ColorPropKeys,
  SafeColorProps,
  StrictColorProps,
} from './colors'
export type {
  RadiiPropKeys,
  SafeRadiiProps,
  StrictRadiiProps,
} from './radii'
export type {
  FontName,
  FontProps,
  FontWeightName,
  FontWeightValue,
  ScopedFontWeight,
} from './fonts'
export type { FontRegistry } from './fontRegistry'
export type {
  ColorModeProps,
  ContainerProps,
  ResponsiveProps,
} from './props'
export type {
  HTMLStyledProps,
  PrimitiveComponent,
  PrimitiveCssProps,
  PrimitiveElement,
  PrimitiveProps,
  PrimitiveTag,
} from './primitives'
export type {
  RecipeCreatorFn,
  RecipeDefinition,
  RecipeRuntimeFn,
  RecipeSelection,
  RecipeVariant,
  RecipeVariantProps,
} from './recipe'
export type { StylePropValue } from './style-prop'
export type { StyleProps } from './style-props'
export type { SystemStyleObject } from './system-style-object'

/**
 * @reference-ui/types entry — barrel only. Implementation lives in `reference/browser`.
 *
 * The packager bundles this into `types.mjs`; `__REFERENCE_UI_TYPES_RUNTIME__` is
 * rewritten in postprocess. Panda still scans mirrored `_reference-component` sources.
 */

export { Reference, createReferenceComponent } from '../reference/browser'
export {
  createDefaultReferenceRuntime,
  createReferenceRuntime,
  formatReferenceTypeParameter,
  ReferenceRuntimeProvider,
  useReferenceDocument,
  useReferenceDocumentFromContext,
  useReferenceRuntime,
} from '../reference/browser'
export type {
  ReferenceDocumentState,
  ReferenceRuntime,
  ReferenceRuntimeData,
} from '../reference/browser/Runtime'
export type * from '../reference/browser/types'
export type { BaseSystem } from '../types'
export type {
  CssFunction,
  CssRawFunction,
  CssStyles,
  FontName,
  FontProps,
  FontRegistry,
  FontWeightName,
  FontWeightValue,
  ScopedFontWeight,
} from '../types'
export type {
  ColorModeProps,
  ContainerProps,
  HTMLStyledProps,
  PrimitiveComponent,
  PrimitiveCssProps,
  PrimitiveElement,
  PrimitiveProps,
  PrimitiveTag,
  ResponsiveProps,
  StrictColorProps,
} from '../types'
export type {
  RecipeCreatorFn,
  RecipeDefinition,
  RecipeRuntimeFn,
  RecipeSelection,
  RecipeVariant,
  RecipeVariantProps,
} from '../types'
export type { StylePropValue } from '../types'
export type { SystemStyleObject } from '../types'

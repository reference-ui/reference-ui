/**
 * @reference-ui/types entry — barrel only. Implementation lives in `reference/browser`.
 *
 * The packager bundles this into `types.mjs`; `__REFERENCE_UI_TYPES_RUNTIME__` is
 * rewritten in postprocess. Panda still scans mirrored `_reference-component` sources.
 *
 * Theme `ReferenceProps` (`../types`) is separate from `ReferenceComponentProps` in
 * `../reference/browser/types` (the `Reference` component `name` prop).
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
export type {
  BaseSystem,
  ColorPropKeys,
  ColorModeProps,
  ContainerProps,
  CssFunction,
  CssRawFunction,
  CssStyles,
  FontName,
  FontProps,
  FontRegistry,
  FontWeightName,
  FontWeightValue,
  HTMLStyledProps,
  PrimitiveComponent,
  PrimitiveCssProps,
  PrimitiveElement,
  PrimitiveProps,
  PrimitiveTag,
  RecipeCreatorFn,
  RecipeDefinition,
  RecipeRuntimeFn,
  RecipeSelection,
  RecipeVariant,
  RecipeVariantProps,
  ResponsiveProps,
  SafeColorProps,
  ScopedFontWeight,
  StrictColorProps,
  StyleProps,
  StylePropValue,
  SystemStyleObject,
  ReferenceProps,
} from '../types'

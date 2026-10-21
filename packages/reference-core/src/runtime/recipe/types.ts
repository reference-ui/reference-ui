// Authoring and runtime types of the Core recipe runtime.
// They cover the selections an author passes, the recipe config they write, and the resolver a recipe() call
// returns. They are types only, shared by the resolver and the class derivation, and recipe.ts re-exports them
// under their public names. splitVariantProps keeps the caller's props generic so a wrapper's rest stays typed.

import type { SystemStyleObject } from '../css/css.ts'

/** One variant axis value an author may pass: strings, or booleans for true/false options. */
export type RecipePropValue = string | boolean | number

/** Responsive selection for one axis: breakpoint to wanted value (`base` paints below every query). */
export type ResponsiveRecipeValue = Record<string, RecipePropValue | undefined | null>

/** Author selection: axis to wanted value, with skips dropped at resolution. */
export type RecipeProps = Record<
  string,
  RecipePropValue | ResponsiveRecipeValue | undefined | null
>

/** Author selection with responsive objects already reduced to their base values. */
export type PlainRecipeProps = Record<string, RecipePropValue | undefined | null>

/** One compound rule: axis predicates plus the styles applied when all match. */
export interface RecipeCompoundConfig {
  css: SystemStyleObject
  [axis: string]: unknown
}

/** Authored recipe: the className extraction keys on plus base, variants, and compounds. */
export interface RecipeConfig {
  className: string
  base?: SystemStyleObject
  variants?: Record<string, Record<string, SystemStyleObject>>
  defaultVariants?: Record<string, string>
  compoundVariants?: RecipeCompoundConfig[]
}

/** Resolved recipe function: classes for a selection plus variant metadata. */
export interface RecipeRuntimeFn {
  (props?: RecipeProps): string
  raw(props?: RecipeProps): SystemStyleObject
  variantKeys: string[]
  variantMap: Record<string, string[]>
  /** Variant keys are not known here, so rest keeps the caller's props as Partial; the bake narrows it per recipe. */
  splitVariantProps<P extends object>(props: P): [RecipeProps, Partial<P>]
}

/**
 * Wraps Panda's cva() (exported as recipe()) so recipe style objects exclude deprecated CSS system colors
 * (e.g. "Background", "ButtonFace") from type suggestions / acceptance.
 */

import {
  cva as pandaCva,
  type RecipeVariantProps as PandaRecipeVariantProps,
} from '../../../system/css/index.js'
import type {
  RecipeVariantRecord,
  RecipeSelection,
  RecipeRuntimeFn,
  RecipeCompoundSelection,
} from '../../../system/types/recipe.js'
import type { SystemStyleObject } from '../../../system/types/index.js'
import type { StrictColorProps } from '../../types/index.js'

type StrictStyleObject = StrictColorProps<SystemStyleObject>

type StrictRecipeCompoundVariant<T> = T & {
  css: StrictStyleObject
}

interface StrictRecipeDefinition<T extends RecipeVariantRecord = RecipeVariantRecord> {
  /**
   * The base styles of the recipe.
   */
  base?: StrictStyleObject
  /**
   * Whether the recipe is deprecated.
   */
  deprecated?: boolean | string
  /**
   * The multi-variant styles of the recipe.
   */
  variants?: T
  /**
   * The default variants of the recipe.
   */
  defaultVariants?: RecipeSelection<T>
  /**
   * The styles to apply when a combination of variants is selected.
   */
  compoundVariants?: StrictRecipeCompoundVariant<RecipeCompoundSelection<T>>[]
}

/** Same as Panda cva() but style args omit deprecated system color literals. */
export function recipe<T extends RecipeVariantRecord>(
  config: StrictRecipeDefinition<T>
): RecipeRuntimeFn<T> {
  return pandaCva(config as any)
}

/** Extract variant props from a recipe function. Same as Panda but for our wrapped recipe. */
export type RecipeVariantProps<T extends RecipeRuntimeFn<RecipeVariantRecord>> =
  PandaRecipeVariantProps<T>

// Re-export other useful recipe types
export type { RecipeSelection, RecipeRuntimeFn } from '../../../system/types/recipe.js'

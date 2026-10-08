// Author recipe() call plus its fragment collector.
// It takes recipe configs from fragment files and emits collected definitions.
// The call shape reuses the runtime RecipeConfig, so collected recipes and
// resolved recipes agree by construction; merging keys them by className.

import type { RecipeConfig } from '../../runtime/recipe/recipe.ts'
import { createFragmentFunction } from '../lib/collector.ts'

export type { RecipeConfig } from '../../runtime/recipe/recipe.ts'

const { fn, collector } = createFragmentFunction<RecipeConfig>({
  name: 'recipe',
  targetFunction: 'recipe',
  globalKey: '__refRecipeCollector',
})

/**
 * Register a recipe definition for the system spec.
 * Called from fragment files; collected at sync time and merged into the spec.
 *
 * @example
 * ```ts
 * recipe({
 *   className: 'tone',
 *   variants: {
 *     tone: {
 *       accent: { color: 'brand' },
 *       muted: { color: 'paper' },
 *     },
 *   },
 *   defaultVariants: { tone: 'muted' },
 * })
 * ```
 */
export function recipe(recipeConfig: RecipeConfig): void {
  fn(recipeConfig)
}

/** Used by the sync runner to collect recipe fragments when running fragment files. */
export function createRecipeCollector() {
  return collector
}

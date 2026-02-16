import type { RecipeConfig, SlotRecipeConfig } from '@pandacss/dev'
import { extendPandaConfig } from '../../cli/panda/config/extendPandaConfig'

/**
 * Register custom recipes with Panda CSS.
 * 
 * This is a convenience wrapper around extendPandaConfig that focuses on recipes.
 * Use this to define or extend single-part recipes.
 * 
 * @example
 * ```ts
 * recipe({
 *   button: {
 *     className: 'btn',
 *     variants: {
 *       size: {
 *         sm: { fontSize: '12px', padding: '8px' },
 *         md: { fontSize: '14px', padding: '12px' }
 *       }
 *     }
 *   }
 * })
 * ```
 */
export function recipe<T extends Record<string, RecipeConfig>>(recipeConfig: T): void {
  extendPandaConfig({
    theme: {
      extend: {
        recipes: recipeConfig
      }
    }
  })
}

/**
 * Register custom slot recipes (multi-part component recipes) with Panda CSS.
 * 
 * This is a convenience wrapper around extendPandaConfig that focuses on slot recipes.
 * Use this to define or extend multi-part component recipes.
 * 
 * @example
 * ```ts
 * slotRecipe({
 *   card: {
 *     className: 'card',
 *     slots: ['root', 'header', 'body', 'footer'],
 *     base: {
 *       root: { borderRadius: 'md', overflow: 'hidden' },
 *       header: { padding: '4', fontWeight: 'bold' }
 *     }
 *   }
 * })
 * ```
 */
export function slotRecipe<T extends Record<string, SlotRecipeConfig>>(slotRecipeConfig: T): void {
  extendPandaConfig({
    theme: {
      extend: {
        slotRecipes: slotRecipeConfig
      }
    }
  })
}

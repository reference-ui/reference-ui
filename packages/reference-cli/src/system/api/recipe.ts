import { extendPandaConfig } from '../collectors/extendPandaConfig'
import type { RecipeConfig } from '@pandacss/types'

/**
 * Define a recipe (component variant system).
 *
 * @example
 * ```ts
 * recipe('button', {
 *   className: 'btn',
 *   variants: {
 *     size: {
 *       sm: { px: '3', py: '1' },
 *       lg: { px: '6', py: '3' }
 *     }
 *   }
 * })
 * ```
 */
export function recipe(name: string, config: RecipeConfig): void {
  extendPandaConfig({
    theme: {
      recipes: {
        [name]: config,
      },
    },
  })
}

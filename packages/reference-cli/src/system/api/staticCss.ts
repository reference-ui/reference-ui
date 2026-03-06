import type { Config } from '@pandacss/dev'
import { extendPandaConfig } from './extendPandaConfig'

type StaticCssConfig = NonNullable<Config['staticCss']>

/**
 * Register static CSS with your design system.
 * Use to force certain utilities/recipes to be generated at build time.
 *
 * @example
 * ```ts
 * staticCss({
 *   css: [{ properties: { color: ['*'] } }],
 *   recipes: { button: ['*'] },
 * })
 * ```
 */
export function staticCss(config: StaticCssConfig): void {
  extendPandaConfig({ staticCss: config })
}

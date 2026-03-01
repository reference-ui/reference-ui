import type { Config } from '@pandacss/dev'
import { extendPandaConfig } from '../../../cli/system/config/panda/extendPandaConfig'

/**
 * Register static CSS with Panda CSS.
 *
 * This is a convenience wrapper around extendPandaConfig that focuses on staticCss.
 * Use this to force certain utilities/recipes to be generated at build time.
 *
 * @example
 * ```ts
 * extendStaticCss({
 *   css: [{ properties: { color: ['*'] } }],
 *   recipes: { button: ['*'] },
 * })
 * ```
 */
export function extendStaticCss(config: NonNullable<Config['staticCss']>): void {
  extendPandaConfig({
    staticCss: config,
  })
}

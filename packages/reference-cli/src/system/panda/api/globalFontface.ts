import type { Config } from '@pandacss/dev'
import { extendPandaConfig } from '../../collectors/extendPandaConfig'

type GlobalFontfaceConfig = NonNullable<Config['globalFontface']>

/**
 * Register global @font-face rules with Panda CSS.
 *
 * @example
 * ```ts
 * globalFontface({
 *   Inter: {
 *     src: 'url(...) format("woff2")',
 *     fontWeight: '100 900',
 *     fontDisplay: 'swap',
 *   },
 * })
 * ```
 */
export function globalFontface(config: GlobalFontfaceConfig): void {
  extendPandaConfig({ globalFontface: config })
}

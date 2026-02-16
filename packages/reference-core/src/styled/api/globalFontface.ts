import type { Config } from '@pandacss/dev'
import { extendPandaConfig } from '../../cli/panda/config/extendPandaConfig'

/**
 * Register global @font-face rules with Panda CSS.
 *
 * This is a convenience wrapper around extendPandaConfig that focuses on globalFontface.
 * Use this to define font-face declarations (e.g. from Google Fonts).
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
export function globalFontface(fontface: NonNullable<Config['globalFontface']>): void {
  extendPandaConfig({
    globalFontface: fontface,
  })
}

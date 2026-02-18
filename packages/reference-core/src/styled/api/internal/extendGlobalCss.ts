import type { Config } from '@pandacss/dev'
import { extendPandaConfig } from '../../../cli/panda/config/extendPandaConfig'

/**
 * Register global CSS with Panda CSS.
 *
 * This is a convenience wrapper around extendPandaConfig that focuses on globalCss.
 * Use this for :root variables, body defaults, and other global styles.
 *
 * @example
 * ```ts
 * extendGlobalCss({
 *   ':root': {
 *     '--r-base': '16px',
 *     '--spacing-r': 'calc(var(--r-base) * var(--r-density))',
 *   },
 *   body: {
 *     fontFamily: 'sans',
 *     fontSize: 'body',
 *   },
 * })
 * ```
 */
export function extendGlobalCss(css: NonNullable<Config['globalCss']>): void {
  extendPandaConfig({
    globalCss: css,
  })
}

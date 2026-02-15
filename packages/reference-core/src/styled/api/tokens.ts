import type { Config } from '@pandacss/dev'
import { extendPandaConfig } from '../../cli/panda/config/extendPandaConfig'

/**
 * Register design tokens with Panda CSS.
 * 
 * This is a convenience wrapper around extendPandaConfig that focuses on tokens.
 * Use this to define colors, spacing, fonts, and other design tokens.
 * 
 * @example
 * ```ts
 * tokens({
 *   colors: {
 *     brand: {
 *       primary: { value: '#0066cc' },
 *       secondary: { value: '#ff6600' }
 *     }
 *   },
 *   spacing: {
 *     sm: { value: '0.5rem' },
 *     md: { value: '1rem' }
 *   }
 * })
 * ```
 */
export function tokens(tokenConfig: NonNullable<Config['theme']>['tokens']): void {
  extendPandaConfig({
    theme: {
      tokens: tokenConfig
    }
  })
}

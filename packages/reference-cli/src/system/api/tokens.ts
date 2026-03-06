import type { Config } from '@pandacss/dev'
import { extendPandaConfig } from './extendPandaConfig'

type TokenConfig = NonNullable<Config['theme']>['tokens']

/**
 * Register design tokens with Panda CSS.
 *
 * Define colors, spacing, fonts, and other design tokens that will be
 * available throughout your design system.
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
export function tokens(tokensConfig: TokenConfig): void {
  extendPandaConfig({ theme: { tokens: tokensConfig } })
}

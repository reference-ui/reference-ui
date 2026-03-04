import { createFragmentCollector } from '../../lib/fragments'
import type { Config } from '@pandacss/dev'

type TokenConfig = NonNullable<Config['theme']>['tokens']
type PandaConfig = Partial<Config>

/**
 * Fragment collector for design tokens.
 * Transforms token definitions into Panda config shape: { theme: { tokens } }
 */
export const tokensCollector = createFragmentCollector<TokenConfig, PandaConfig>({
  name: 'tokens',
  targetFunction: 'tokens',
  transform: (tokenConfig) => ({
    theme: {
      tokens: tokenConfig,
    },
  }),
})

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
export const tokens = tokensCollector.collect

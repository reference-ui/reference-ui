import type { Config } from '@pandacss/dev'
import { createFragmentFunction } from '../../lib/fragments/collector'

export type TokenConfig = NonNullable<Config['theme']>['tokens']

const { fn, collector } = createFragmentFunction<TokenConfig>({
  name: 'tokens',
  targetFunction: 'tokens',
  globalKey: '__refTokensCollector',
})

/**
 * Register design tokens with Panda CSS.
 * Called from fragment files; collected at config generation time and merged into panda.config.
 *
 * @example
 * ```ts
 * tokens({
 *   colors: {
 *     brand: { primary: { value: '#0066cc' }, secondary: { value: '#ff6600' } },
 *   },
 *   spacing: { sm: { value: '0.5rem' }, md: { value: '1rem' } },
 * })
 * ```
 */
export function tokens(tokensConfig: TokenConfig): void {
  fn(tokensConfig)
}

/** Used by runConfig and build/styled to collect token fragments when running fragment files. */
export function createTokensCollector() {
  return collector
}

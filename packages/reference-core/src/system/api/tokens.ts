import { createFragmentFunction } from '../../lib/fragments/collector'

export interface ReferenceTokenLeaf {
  value: unknown
  light?: unknown
  dark?: unknown
  description?: string
  [key: string]: unknown
}

export interface ReferenceTokenConfig {
  [key: string]: ReferenceTokenLeaf | ReferenceTokenConfig
}

export type TokenConfig = ReferenceTokenConfig

const { fn, collector } = createFragmentFunction<ReferenceTokenConfig>({
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
 *     text: { value: '#111111', dark: '#f5f5f5' },
 *     brand: { primary: { value: '#0066cc' }, secondary: { value: '#ff6600' } },
 *   },
 *   spacing: { sm: { value: '0.5rem' }, md: { value: '1rem' } },
 * })
 * ```
 */
export function tokens(tokensConfig: ReferenceTokenConfig): void {
  fn(tokensConfig)
}

/** Used by runConfig and build/styled to collect token fragments when running fragment files. */
export function createTokensCollector() {
  return collector
}

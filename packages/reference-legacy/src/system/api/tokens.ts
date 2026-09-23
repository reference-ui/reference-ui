import { createFragmentFunction } from '../../lib/fragments/collector'

export interface ReferenceTokenLeaf {
  value?: unknown
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
 * Token subtrees keyed by `_private` are scoped to the package that defines them:
 * they resolve normally inside the owning package (recipes, patterns, css() calls),
 * but are stripped from any downstream consumer that pulls in the package via
 * `extends`, and are hidden from the MCP token surface.
 *
 * @example
 * ```ts
 * tokens({
 *   colors: {
 *     text: { value: '#111111', dark: '#f5f5f5' },
 *     icon: { light: '#222222', dark: '#f5f5f5' },
 *     brand: { primary: { value: '#0066cc' }, secondary: { value: '#ff6600' } },
 *     _private: {
 *       internalAccent: { value: '#FF00FF' }, // not visible to downstream extenders
 *     },
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

import type { Config } from '@pandacss/dev'
import { createFragmentFunction } from '../../lib/fragments/collector'

export type GlobalCssConfig = NonNullable<Config['globalCss']>

const { fn, collector } = createFragmentFunction<GlobalCssConfig>({
  name: 'globalCss',
  targetFunction: 'globalCss',
  globalKey: '__refGlobalCssCollector',
})

/**
 * Register global CSS with Panda CSS.
 * Called from fragment files; collected at config generation time.
 * Downstream consumption (merge into defineConfig) is wired separately.
 *
 * @example
 * ```ts
 * globalCss({
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
export function globalCss(css: GlobalCssConfig): void {
  fn(css)
}

/** Used by runConfig and build/styled to collect globalCss fragments when running fragment files. */
export function createGlobalCssCollector() {
  return collector
}

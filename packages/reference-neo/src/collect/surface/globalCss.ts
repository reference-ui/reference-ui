// Author globalCss() call plus its fragment collector.
// It takes global rule maps from fragment files and emits collected configs.
// This module is a Neo-owned copy of the core globalCss collector with a local type.

import { createFragmentFunction } from '../lib/collector.ts'

/** One selector rule: flat declarations plus nested selectors and conditions. */
export interface GlobalCssRule {
  [property: string]: unknown
}

/** Global CSS rules keyed by selector, one map per globalCss() call. */
export type GlobalCssConfig = Record<string, GlobalCssRule>

const { fn, collector } = createFragmentFunction<GlobalCssConfig>({
  name: 'globalCss',
  targetFunction: 'globalCss',
  globalKey: '__refGlobalCssCollector',
})

/**
 * Register global CSS for the system spec.
 * Called from fragment files; collected at sync time.
 * Downstream consumption (merge into the spec) is wired separately.
 *
 * This is also the canonical spacing-feel knob: every rhythm utility
 * (`1r`, `4r`, …) lowers to a calc against `--spacing-root`, whose baked
 * default is `0.25rem`. One line rescales the whole UI, because the baked
 * default ranks below all author CSS and any author `:root` wins:
 *
 * @example
 * ```ts
 * globalCss({
 *   ':root': {
 *     // Rescale knob: doubles every Nr rhythm value over the default.
 *     '--spacing-root': '0.5rem',
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

/** Used by the sync runner to collect globalCss fragments when running fragment files. */
export function createGlobalCssCollector() {
  return collector
}

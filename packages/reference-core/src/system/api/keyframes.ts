import type { Config } from '@pandacss/dev'
import { createFragmentFunction } from '../../lib/fragments/collector'

export type KeyframesConfig = NonNullable<Config['theme']>['keyframes']

const { fn, collector } = createFragmentFunction<KeyframesConfig>({
  name: 'keyframes',
  targetFunction: 'keyframes',
  globalKey: '__refKeyframesCollector',
})

/**
 * Register animation keyframes with Panda CSS.
 * Called from fragment files; collected at config generation time and merged into panda.config.
 *
 * @example
 * ```ts
 * keyframes({
 *   fadeIn: {
 *     '0%': { opacity: '0' },
 *     '100%': { opacity: '1' },
 *   },
 * })
 * ```
 */
export function keyframes(keyframesConfig: KeyframesConfig): void {
  fn(keyframesConfig)
}

/** Used by runConfig and build/styled to collect keyframe fragments when running fragment files. */
export function createKeyframesCollector() {
  return collector
}

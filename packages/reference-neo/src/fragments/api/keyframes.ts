// Author keyframes() call plus its fragment collector.
// It takes keyframe maps from fragment files and emits collected configs.
// This module is a Neo-owned copy of the core keyframes collector with a local type.

import { createFragmentFunction } from '../lib/collector.ts'

/** Keyframe steps per animation name, each step mapping to flat declarations. */
export type KeyframesConfig = Record<string, Record<string, Record<string, string | number>>>

const { fn, collector } = createFragmentFunction<KeyframesConfig>({
  name: 'keyframes',
  targetFunction: 'keyframes',
  globalKey: '__refKeyframesCollector',
})

/**
 * Register animation keyframes for the system spec.
 * Called from fragment files; collected at sync time and merged into the spec.
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

/** Used by the sync runner to collect keyframe fragments when running fragment files. */
export function createKeyframesCollector() {
  return collector
}

import type { Config } from '@pandacss/dev'
import { extendPandaConfig } from '../../cli/panda/config/extendPandaConfig'

type UtilityExtend = NonNullable<NonNullable<Config['utilities']>['extend']>

/**
 * Register custom utilities with Panda CSS.
 *
 * This is a convenience wrapper around extendPandaConfig that focuses on utilities.
 * Use this to add or extend utility classes (e.g. rhythm-based spacing).
 *
 * @example
 * ```ts
 * utilities({
 *   myUtil: {
 *     values: 'spacing',
 *     transform(value) {
 *       return { padding: value }
 *     }
 *   }
 * })
 * ```
 */
export function utilities(extend: UtilityExtend): void {
  extendPandaConfig({
    utilities: {
      extend,
    },
  })
}

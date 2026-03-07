import type { Config } from '@pandacss/dev'
import { extendPandaConfig } from '../../api/extendPandaConfig'

type KeyframesConfig = NonNullable<Config['theme']>['keyframes']

/**
 * Register animation keyframes with Panda CSS.
 *
 * @example
 * ```ts
 * keyframes({
 *   fadeIn: {
 *     '0%': { opacity: '0' },
 *     '100%': { opacity: '1' }
 *   },
 *   slideUp: {
 *     from: { transform: 'translateY(100%)' },
 *     to: { transform: 'translateY(0)' }
 *   }
 * })
 * ```
 */
export function keyframes(keyframesConfig: KeyframesConfig): void {
  extendPandaConfig({
    theme: {
      extend: {
        keyframes: keyframesConfig,
      },
    },
  })
}

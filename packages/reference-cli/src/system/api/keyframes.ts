import { createFragmentCollector } from '../../lib/fragments/collector'
import type { Config } from '@pandacss/dev'

type KeyframesConfig = NonNullable<Config['theme']>['keyframes']
type PandaConfig = Partial<Config>

export const keyframesCollector = createFragmentCollector<
  KeyframesConfig,
  PandaConfig
>({
  name: 'keyframes',
  targetFunction: 'keyframes',
  transform: config => ({
    theme: {
      extend: {
        keyframes: config,
      },
    },
  }),
})

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
export const keyframes = keyframesCollector.collect

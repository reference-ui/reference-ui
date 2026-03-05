import { createFragmentCollector } from '../../lib/fragments/collector'
import type { Config } from '@pandacss/dev'

type UtilityExtend = NonNullable<NonNullable<Config['utilities']>['extend']>
type PandaConfig = Partial<Config>

/**
 * Fragment collector for custom utilities.
 * Transforms utility definitions into Panda config shape: { utilities: { extend } }
 */
export const utilitiesCollector = createFragmentCollector<UtilityExtend, PandaConfig>({
  name: 'utilities',
  targetFunction: 'utilities',
  transform: config => ({
    utilities: {
      extend: config,
    },
  }),
})

/**
 * Register custom utilities with your design system.
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
export const utilities = utilitiesCollector.collect

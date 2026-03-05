import { createFragmentCollector } from '../../lib/fragments/collector'
import type { FragmentCollector } from '../../lib/fragments'
import type { Config } from '@pandacss/dev'

type UtilityExtend = NonNullable<NonNullable<Config['utilities']>['extend']>
type PandaConfig = Partial<Config>

const collector = createFragmentCollector<UtilityExtend, PandaConfig>({
  name: 'utilities',
  targetFunction: 'utilities',
  transform: config => ({
    utilities: {
      extend: config,
    },
  }),
})

/**
 * Fragment collector for custom utilities.
 * Type cast to portable Record for declaration emit (pnpm + tsdown/rolldown-plugin-dts limitation).
 */
export const utilitiesCollector = collector as FragmentCollector<
  Record<string, unknown>,
  Record<string, unknown>
>

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
export const utilities = collector.collect as (config: Record<string, unknown>) => void

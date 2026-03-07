import type { Config } from '@pandacss/dev'
import { extendPandaConfig } from '../collectors/extendPandaConfig'

type UtilityExtend = NonNullable<NonNullable<Config['utilities']>['extend']>

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
export function utilities(utilitiesConfig: UtilityExtend): void {
  extendPandaConfig({
    utilities: {
      extend: utilitiesConfig,
    },
  })
}

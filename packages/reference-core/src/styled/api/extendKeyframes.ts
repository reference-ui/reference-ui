import type { Config } from '@pandacss/dev'
import { extendPandaConfig } from '../../cli/panda/config/extendPandaConfig'

/**
 * Register animation keyframes with Panda CSS.
 * 
 * Keyframes are defined at the system level and can be referenced by name
 * in animation properties throughout your application.
 * 
 * @example
 * ```ts
 * // Define keyframes
 * keyframes({
 *   fadeIn: {
 *     '0%': { opacity: '0' },
 *     '100%': { opacity: '1' }
 *   },
 *   slideUp: {
 *     from: { transform: 'translateY(100%)' },
 *     to: { transform: 'translateY(0)' }
 *   },
 *   pulse: {
 *     '0%, 100%': { opacity: '1' },
 *     '50%': { opacity: '0.5' }
 *   }
 * })
 * 
 * // Use in components
 * css({ animation: 'fadeIn 0.3s ease-out' })
 * css({ animation: 'slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)' })
 * ```
 */
export function extendKeyframes(config: NonNullable<Config['theme']>['keyframes']): void {
  extendPandaConfig({
    theme: {
      extend: {
        keyframes: config
      }
    }
  })
}

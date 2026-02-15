import type { Config } from '@pandacss/dev'
import { defineConfig } from '@pandacss/dev'
import { extendPandaConfig } from '../../cli/panda/config/extendPandaConfig'

/**
 * Extract the proper type for extendable patterns from Panda's config.
 * This type is more permissive than the strict PatternConfig type and allows
 * for advanced pattern configurations like object types, enum types, etc.
 */
type ExtendablePatterns = Parameters<typeof defineConfig>[0]['patterns'] extends { extend?: infer E }
  ? E
  : never

/**
 * Helper function to assert pattern config as ExtendablePatterns type.
 * This allows us to use Panda's actual pattern capabilities without fighting TypeScript.
 */
function asExtendablePatterns<T>(p: T): ExtendablePatterns {
  return p as ExtendablePatterns
}

/**
 * Register custom patterns with Panda CSS.
 * 
 * This is a convenience wrapper around extendPandaConfig that focuses on patterns.
 * Use this to define or extend patterns like box, container, and other layout patterns.
 * 
 * @example
 * ```ts
 * patterns({
 *   customStack: {
 *     properties: {
 *       direction: { type: 'enum', value: ['row', 'column'] },
 *       gap: { type: 'string' }
 *     },
 *     transform(props) {
 *       const { direction, gap, ...rest } = props
 *       return {
 *         display: 'flex',
 *         flexDirection: direction,
 *         gap,
 *         ...rest
 *       }
 *     }
 *   }
 * })
 * ```
 */
export function patterns<T extends Record<string, any>>(patternConfig: T): void {
  extendPandaConfig({
    patterns: {
      extend: asExtendablePatterns(patternConfig)
    }
  })
}

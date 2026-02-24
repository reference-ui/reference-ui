import type { Config } from '@pandacss/dev'

/**
 * Global key used by eval runner to pass the collector array.
 * Internal; do not rely on this from user code.
 */
export const COLLECTOR_KEY = '__refPandaConfigCollector'

/**
 * Extend the Panda config with a partial. When called during eval (CLI build),
 * the partial is collected and later merged into the base config. At runtime
 * outside eval, this is a no-op.
 *
 * Use in styled/ (or other scanned dirs) to contribute recipes, tokens, etc.:
 *
 *   import { extendPandaConfig } from '@reference-ui/core/panda-config'
 *   extendPandaConfig({ theme: { extend: { recipes: { ... } } } })
 */
export function extendPandaConfig(partial: Partial<Config>): void {
  const collector = (globalThis as Record<string, unknown>)[COLLECTOR_KEY]
  if (Array.isArray(collector)) {
    collector.push(partial)
  }
}

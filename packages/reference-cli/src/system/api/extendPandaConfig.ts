import type { Config } from '@pandacss/dev'
import type { FragmentCollector } from '../../lib/fragments'

/**
 * Global key used by the panda config collector.
 * Must match reference-core's COLLECTOR_KEY for alignment.
 */
export const COLLECTOR_KEY = '__refPandaConfigCollector'

/**
 * Extend the Panda config with a partial. When called during fragment bundle execution,
 * the partial is collected and later merged into the base config.
 */
export function extendPandaConfig(partial: Partial<Config>): void {
  const collector = (globalThis as Record<string, unknown>)[COLLECTOR_KEY]
  if (Array.isArray(collector)) {
    collector.push(partial)
  }
}

/**
 * Create the single panda config collector. All fragment APIs (tokens, staticCss, etc.)
 * call extendPandaConfig; this collector captures those partials for merge.
 */
export function createPandaConfigCollector(): FragmentCollector<
  Partial<Config>,
  Partial<Config>
> {
  function collect(partial: Partial<Config>): void {
    extendPandaConfig(partial)
  }

  function init(): void {
    ;(globalThis as Record<string, unknown>)[COLLECTOR_KEY] = []
  }

  function getFragments(): Partial<Config>[] {
    const collector = (globalThis as Record<string, unknown>)[COLLECTOR_KEY]
    if (!Array.isArray(collector)) {
      return []
    }
    return [...collector] as Partial<Config>[]
  }

  function cleanup(): void {
    delete (globalThis as Record<string, unknown>)[COLLECTOR_KEY]
  }

  function toScript(): string {
    return `globalThis['${COLLECTOR_KEY}'] = []`
  }

  function toGetter(): string {
    return `(function() { const fragments = globalThis['${COLLECTOR_KEY}'] ?? []; return fragments; })()`
  }

  const config = {
    name: 'panda-config',
    globalKey: COLLECTOR_KEY,
    logLabel: 'fragments:panda-config',
    targetFunction: 'tokens' as const,
  }

  const collectorFn = Object.assign(collect, {
    config,
    collect,
    init,
    getFragments,
    cleanup,
    toScript,
    toGetter,
  })

  return collectorFn as FragmentCollector<Partial<Config>, Partial<Config>>
}

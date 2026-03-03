import type { FragmentCollector, FragmentCollectorConfig } from './types'

/**
 * Create a fragment collector that can capture fragments from user code.
 *
 * @example
 * ```ts
 * const pandaCollector = createFragmentCollector<Partial<Config>>({
 *   name: 'panda-config',
 *   globalKey: '__refPandaConfig',
 * })
 *
 * // Export the collect function for users
 * export const extendPandaConfig = pandaCollector.collect
 * ```
 */
export function createFragmentCollector<T = unknown>(
  config: FragmentCollectorConfig
): FragmentCollector<T> {
  const { name, globalKey, logLabel = `fragments:${name}` } = config

  /**
   * Function users call to register a fragment.
   * Must be called after init() has set up the collector on globalThis.
   */
  function collect(fragment: T): void {
    const collector = (globalThis as Record<string, unknown>)[globalKey]
    if (Array.isArray(collector)) {
      collector.push(fragment)
    }
  }

  /**
   * Initialize the collector array on globalThis.
   * Must be called before bundled user code runs.
   */
  function init(): void {
    ;(globalThis as Record<string, unknown>)[globalKey] = []
  }

  /**
   * Get all collected fragments and return them.
   * Does NOT clean up globalThis (call cleanup() separately if needed).
   */
  function getFragments(): T[] {
    const collector = (globalThis as Record<string, unknown>)[globalKey]
    if (Array.isArray(collector)) {
      return [...collector] as T[]
    }
    return []
  }

  /**
   * Remove the collector from globalThis.
   */
  function cleanup(): void {
    delete (globalThis as Record<string, unknown>)[globalKey]
  }

  return {
    config: { name, globalKey, logLabel },
    collect,
    init,
    getFragments,
    cleanup,
  }
}

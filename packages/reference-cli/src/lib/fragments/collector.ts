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
 *
 * @example With transform
 * ```ts
 * const fontCollector = createFragmentCollector({
 *   name: 'fonts',
 *   transform: fontDefs => ({
 *     theme: { tokens: { fonts: fontDefs } }
 *   })
 * })
 * ```
 */
function defaultGlobalKey(name: string, targetFunction?: string): string {
  const base = targetFunction ?? name
  const cap = base.charAt(0).toUpperCase() + base.slice(1)
  return `__ref${cap}Collector`
}

export function createFragmentCollector<TInput = unknown, TOutput = TInput>(
  config: FragmentCollectorConfig<TInput, TOutput>
): FragmentCollector<TInput, TOutput> {
  const {
    name,
    targetFunction,
    globalKey = defaultGlobalKey(name, targetFunction),
    logLabel = `fragments:${name}`,
    transform,
  } = config

  /**
   * Function users call to register a fragment.
   * Must be called after init() has set up the collector on globalThis.
   */
  function collect(fragment: TInput): void {
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
   * Applies transform to each fragment if provided.
   */
  function getFragments(): TOutput[] {
    const collector = (globalThis as Record<string, unknown>)[globalKey]
    if (!Array.isArray(collector)) {
      return []
    }
    const fragments = [...collector] as TInput[]
    if (transform) {
      return fragments.map(transform)
    }
    return fragments as unknown as TOutput[]
  }

  /**
   * Remove the collector from globalThis.
   */
  function cleanup(): void {
    delete (globalThis as Record<string, unknown>)[globalKey]
  }

  /**
   * Returns the JS snippet that initialises this collector's globalThis slot.
   * Inline this into generated files (e.g. panda.config.ts) before bundles run.
   */
  function toScript(): string {
    return `globalThis['${globalKey}'] = []`
  }

  /**
   * Returns the JS function that bundled fragment files call at runtime.
   * This keeps generated files from needing to know globalThis collector details.
   */
  function toRuntimeFunction(): string {
    const functionName = targetFunction ?? name
    return `const ${functionName} = (fragment) => { const c = globalThis['${globalKey}']; if (Array.isArray(c)) c.push(fragment) }`
  }

  /**
   * Returns a JS function that retrieves and transforms fragments from globalThis.
   * Use in generated configs where collector instances aren't available.
   */
  function toGetter(): string {
    const transformCode = transform
      ? `fragments.map(${transform.toString()})`
      : 'fragments'
    return `(function() { const fragments = globalThis['${globalKey}'] ?? []; return ${transformCode}; })()`
  }

  const configObj = { name, globalKey, logLabel, targetFunction, transform }
  const collectorFn = Object.assign(collect, {
    config: configObj,
    collect,
    init,
    getFragments,
    cleanup,
    toScript,
    toRuntimeFunction,
    toGetter,
  })
  return collectorFn as FragmentCollector<TInput, TOutput>
}

/**
 * Create a fragment function + collector pair. Use when you need both:
 * - A function to export (what users call, e.g. extendPandaConfig)
 * - A collector for runConfig, createPandaConfig, etc.
 *
 * Avoids hand-rolling globalThis logic — the collector owns the abstraction.
 *
 * @example
 * ```ts
 * const { fn, collector } = createFragmentFunction<Partial<Config>>({
 *   name: 'panda-config',
 *   targetFunction: 'tokens',
 *   globalKey: '__refPandaConfigCollector',
 * })
 * export const extendPandaConfig = fn
 * export const createPandaConfigCollector = () => collector
 * ```
 */
export function createFragmentFunction<TInput = unknown, TOutput = TInput>(
  config: FragmentCollectorConfig<TInput, TOutput>
): {
  fn: (fragment: TInput) => void
  collector: FragmentCollector<TInput, TOutput>
} {
  const collector = createFragmentCollector(config)
  return { fn: collector, collector }
}

// Fragment collectors that capture author calls from user code.
// It takes collector configs and emits globalThis-backed collect and read pairs.
// This module is a Neo-owned copy of the core fragment collector.

import {
  CONFIG_FRAGMENT_SOURCE_PROPERTY,
  CURRENT_FRAGMENT_SOURCE_GLOBAL_KEY,
} from '../constants.ts'
import type { FragmentCollector, FragmentCollectorConfig } from './types.ts'

function defaultGlobalKey(name: string, targetFunction?: string): string {
  const base = targetFunction ?? name
  const cap = base.charAt(0).toUpperCase() + base.slice(1)
  return `__ref${cap}Collector`
}

// The helpers below each act on one globalThis slot, named by its key. The collector
// closures only bind a key and a transform, so every generated string has one source.

/**
 * Register a fragment in the slot. Must be called after init() has set up the collector on globalThis.
 * An object fragment also records the source file that is compiling, as a hidden property.
 */
function pushFragment<TInput>(globalKey: string, fragment: TInput): void {
  const collector = (globalThis as Record<string, unknown>)[globalKey]
  if (Array.isArray(collector)) {
    const source = (globalThis as Record<string, unknown>)[CURRENT_FRAGMENT_SOURCE_GLOBAL_KEY]
    if (typeof source === 'string' && fragment !== null && typeof fragment === 'object') {
      Object.defineProperty(fragment, CONFIG_FRAGMENT_SOURCE_PROPERTY, {
        configurable: true,
        enumerable: false,
        value: source,
      })
    }
    collector.push(fragment)
  }
}

/** Initialize the collector array in the slot. Must be called before bundled user code runs. */
function initSlot(globalKey: string): void {
  (globalThis as Record<string, unknown>)[globalKey] = []
}

/**
 * Read every collected fragment, applying transform to each when one is given.
 * Does not clean up the slot; cleanup is a separate call.
 */
function readFragments<TInput, TOutput>(globalKey: string, transform?: (input: TInput) => TOutput): TOutput[] {
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

/** Remove the collector slot from globalThis. */
function clearSlot(globalKey: string): void {
  delete (globalThis as Record<string, unknown>)[globalKey]
}

/**
 * The JS function that bundled fragment files call at runtime. It keeps generated files from needing
 * to know the globalThis collector details.
 */
function runtimeFunctionSource(functionName: string, globalKey: string): string {
  return `const ${functionName} = (fragment) => { const c = globalThis['${globalKey}']; if (Array.isArray(c)) { const s = globalThis['${CURRENT_FRAGMENT_SOURCE_GLOBAL_KEY}']; if (typeof s === 'string' && fragment !== null && typeof fragment === 'object') Object.defineProperty(fragment, ${JSON.stringify(CONFIG_FRAGMENT_SOURCE_PROPERTY)}, { configurable: true, enumerable: false, value: s }); c.push(fragment) } }`
}

/**
 * A JS function that retrieves and transforms fragments from globalThis, for generated configs
 * where collector instances are not available.
 */
function getterSource<TInput, TOutput>(globalKey: string, transform?: (input: TInput) => TOutput): string {
  const transformCode = transform ? `fragments.map(${transform.toString()})` : 'fragments'
  return `(function() { const fragments = globalThis['${globalKey}'] ?? []; return ${transformCode}; })()`
}

/**
 * Create a fragment collector that can capture fragments from user code.
 *
 * @example
 * ```ts
 * const tokensCollector = createFragmentCollector<ReferenceTokenConfig>({
 *   name: 'tokens',
 *   globalKey: '__refTokensCollector',
 * })
 *
 * // Export the collect function for users
 * export const tokens = tokensCollector.collect
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

  // The function users call to register a fragment; it is also the collector itself.
  const collect = (fragment: TInput): void => pushFragment(globalKey, fragment)
  const configObj = { name, globalKey, logLabel, targetFunction, transform }
  const collectorFn = Object.assign(collect, {
    config: configObj,
    collect,
    init: () => initSlot(globalKey),
    getFragments: () => readFragments(globalKey, transform),
    cleanup: () => clearSlot(globalKey),
    toScript: () => `globalThis['${globalKey}'] = []`,
    toRuntimeFunction: () => runtimeFunctionSource(targetFunction ?? name, globalKey),
    toGetter: () => getterSource(globalKey, transform),
  })
  return collectorFn as FragmentCollector<TInput, TOutput>
}

/**
 * Create a fragment function + collector pair. Use when you need both:
 * - A function to export (what users call, e.g. tokens)
 * - A collector for the sync runner.
 *
 * Avoids hand-rolling globalThis logic — the collector owns the abstraction.
 *
 * @example
 * ```ts
 * const { fn, collector } = createFragmentFunction<ReferenceTokenConfig>({
 *   name: 'tokens',
 *   targetFunction: 'tokens',
 *   globalKey: '__refTokensCollector',
 * })
 * export const tokens = fn
 * export const createTokensCollector = () => collector
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

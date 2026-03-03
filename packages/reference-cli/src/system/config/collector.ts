import type { Config } from '@pandacss/dev'

/**
 * Global key used by the eval runner to capture fragments.
 * When a scanned file calls extendPandaConfig(partial), the partial
 * is pushed here. Internal — do not use from user code.
 */
export const COLLECTOR_KEY = '__refPandaConfigCollector'

/**
 * Register a partial Panda config fragment.
 *
 * Called at eval time (inside scanned files). At runtime outside the CLI build,
 * this is a safe no-op — the collector is not initialised so the push never runs.
 */
export function extendPandaConfig(partial: Partial<Config>): void {
  const collector = (globalThis as Record<string, unknown>)[COLLECTOR_KEY]
  if (Array.isArray(collector)) {
    collector.push(partial)
  }
}

/**
 * Initialise the collector on globalThis.
 * Must be called (or imported) before any scanned files run.
 * The generated entry file imports this first via the Handlebars template.
 */
export function initCollector(): void {
  ;(globalThis as Record<string, unknown>)[COLLECTOR_KEY] = []
}

/**
 * Read and clear the collector. Returns all fragments pushed since initCollector().
 */
export function drainCollector(): Partial<Config>[] {
  const collector = (globalThis as Record<string, unknown>)[COLLECTOR_KEY]
  delete (globalThis as Record<string, unknown>)[COLLECTOR_KEY]
  return Array.isArray(collector) ? collector : []
}

import type { Config } from '@pandacss/dev'

export type RuntimeStore = Record<string, unknown>

export const PANDA_CONFIG_GLOBAL_KEY = '__refPandaConfigCollector'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function toRecord(value: unknown): Record<string, unknown> {
  return isPlainObject(value) ? value : {}
}

// deepMerge matches the generated Panda config semantics: arrays/functions replace,
// plain objects merge recursively, and primitives overwrite.
export function deepMerge(
  target: Record<string, unknown>,
  ...sources: unknown[]
): Record<string, unknown> {
  const result = { ...target }

  for (const source of sources) {
    if (!isPlainObject(source)) continue

    for (const key of Object.keys(source)) {
      const sourceVal = source[key]
      const targetVal = result[key]

      if (Array.isArray(sourceVal) || typeof sourceVal === 'function') {
        result[key] = sourceVal
        continue
      }

      if (isPlainObject(sourceVal) && isPlainObject(targetVal)) {
        result[key] = deepMerge({ ...targetVal }, sourceVal)
        continue
      }

      if (isPlainObject(sourceVal)) {
        result[key] = deepMerge({}, sourceVal)
        continue
      }

      result[key] = sourceVal
    }
  }

  return result
}

export function getPandaConfig(): Partial<Config> {
  const runtime = globalThis as typeof globalThis & RuntimeStore
  const existing = runtime[PANDA_CONFIG_GLOBAL_KEY]

  if (isPlainObject(existing)) {
    return existing as Partial<Config>
  }

  const nextConfig: Partial<Config> = {}
  runtime[PANDA_CONFIG_GLOBAL_KEY] = nextConfig
  return nextConfig
}

export function initPandaConfig(baseConfig: Partial<Config>): Partial<Config> {
  const runtime = globalThis as typeof globalThis & RuntimeStore
  const nextConfig = deepMerge({}, toRecord(baseConfig)) as Partial<Config>
  runtime[PANDA_CONFIG_GLOBAL_KEY] = nextConfig
  return nextConfig
}

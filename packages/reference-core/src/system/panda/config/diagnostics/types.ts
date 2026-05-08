import { CONFIG_FRAGMENT_SOURCE_PROPERTY } from '../../../../lib/fragments/types'

export const CONFIG_DIAGNOSTIC_WARN_GLOBAL_KEY = '__refConfigDiagnosticWarn'
export const CONFIG_DIAGNOSTIC_CACHE_KEY = '__refConfigDiagnosticWarnings'
export const MAX_CONFIG_COLLISIONS_TO_PRINT = 10

export interface ConfigCollision {
  path: string
  sources: string[]
}

export function getConfigFragmentSource(value: unknown): string | undefined {
  if (value === null || typeof value !== 'object') return undefined
  const source = (value as Record<string, unknown>)[CONFIG_FRAGMENT_SOURCE_PROPERTY]
  return typeof source === 'string' ? source : undefined
}

export function getConfigFragmentSourceLabel(value: unknown): string {
  return getConfigFragmentSource(value) ?? 'unknown source'
}

export function isUserspaceConfigFragment(value: unknown): boolean {
  const source = getConfigFragmentSource(value)
  return typeof source === 'string' && source !== 'upstream system fragment'
}

export function warnConfigDiagnostic(message: string): void {
  const runtime = globalThis as typeof globalThis & Record<string, unknown>
  const cache =
    runtime[CONFIG_DIAGNOSTIC_CACHE_KEY] instanceof Set
      ? (runtime[CONFIG_DIAGNOSTIC_CACHE_KEY] as Set<string>)
      : new Set<string>()
  runtime[CONFIG_DIAGNOSTIC_CACHE_KEY] = cache

  if (cache.has(message)) return
  cache.add(message)
  const warn = runtime[CONFIG_DIAGNOSTIC_WARN_GLOBAL_KEY]
  if (typeof warn === 'function') {
    warn(message)
    return
  }

  const fallbackConsole = runtime.console
  if (
    fallbackConsole &&
    typeof fallbackConsole === 'object' &&
    typeof (fallbackConsole as { warn?: unknown }).warn === 'function'
  ) {
    ;(fallbackConsole as { warn: (message: string) => void }).warn(message)
  }
}

export function withConfigFragmentSource<TValue extends object>(
  value: TValue,
  source: string
): TValue {
  Object.defineProperty(value, CONFIG_FRAGMENT_SOURCE_PROPERTY, {
    configurable: true,
    enumerable: false,
    value: source,
  })
  return value
}

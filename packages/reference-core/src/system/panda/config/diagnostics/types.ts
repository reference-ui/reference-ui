import { CONFIG_FRAGMENT_SOURCE_PROPERTY } from '../../../../lib/fragments/types'

export const CONFIG_DIAGNOSTIC_WARN_GLOBAL_KEY = '__refConfigDiagnosticWarn'

export interface ConfigCollision {
  path: string
  sources: string[]
}

export function getConfigFragmentSource(value: unknown): string | undefined {
  if (value === null || typeof value !== 'object') return undefined
  const source = (value as Record<string, unknown>)[CONFIG_FRAGMENT_SOURCE_PROPERTY]
  return typeof source === 'string' ? source : undefined
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

import type { ReferenceUIConfig } from './types'
import { ConfigValidationError } from './errors'
/**
 * Validate and normalize the evaluated config object.
 * Unwraps default export, checks for include array.
 *
 * @throws ConfigValidationError if config is invalid
 */
export function validateConfig(raw: unknown): ReferenceUIConfig {
  const config = (raw as { default?: unknown })?.default ?? raw

  if (!config || typeof config !== 'object') {
    throw new ConfigValidationError(ConfigValidationError.MUST_EXPORT_OBJECT)
  }

  const cfg = config as Record<string, unknown>

  if (!cfg.include || !Array.isArray(cfg.include)) {
    throw new ConfigValidationError(ConfigValidationError.MUST_HAVE_INCLUDE)
  }

  return config as ReferenceUIConfig
}

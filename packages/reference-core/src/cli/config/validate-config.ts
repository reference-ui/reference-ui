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
    throw ConfigValidationError.mustExportObject()
  }

  const cfg = config as Record<string, unknown>

  if (!cfg.include || !Array.isArray(cfg.include)) {
    throw ConfigValidationError.mustHaveInclude()
  }

  return config as ReferenceUIConfig
}

import type { ReferenceUIConfig, BaseSystem } from './types'
import { ConfigValidationError } from './errors'
import { log } from '../lib/log'

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

  const name = cfg.name
  if (name == null || typeof name !== 'string' || name.trim() === '') {
    throw ConfigValidationError.mustHaveName()
  }

  const layers = cfg.layers as BaseSystem[] | undefined
  if (layers?.length) {
    for (const sys of layers) {
      if (sys && !sys.css) {
        log.info(
          `[config] Warning: layers entry "${sys.name}" has no css field. Run \`ref sync\` on the upstream package first.`
        )
      }
    }
  }

  return config as ReferenceUIConfig
}

import type { ReferenceUIConfig, BaseSystem } from './types'
import { ConfigValidationError } from './errors'
import { log } from '../lib/log'

function mustBeObject(raw: unknown): Record<string, unknown> {
  const config = (raw as { default?: unknown })?.default ?? raw
  if (!config || typeof config !== 'object') {
    throw ConfigValidationError.mustExportObject()
  }
  return config as Record<string, unknown>
}

function validateInclude(cfg: Record<string, unknown>): void {
  if (!cfg.include || !Array.isArray(cfg.include)) {
    throw ConfigValidationError.mustHaveInclude()
  }
}

function validateName(cfg: Record<string, unknown>): void {
  const name = cfg.name
  if (name == null || typeof name !== 'string' || name.trim() === '') {
    throw ConfigValidationError.mustHaveName()
  }
}

function warnLayersWithoutCss(layers: BaseSystem[] | undefined): void {
  if (!layers?.length) return
  for (const sys of layers) {
    if (sys && !sys.css) {
      log.info(
        `[config] Warning: layers entry "${sys.name}" has no css field. Run \`ref sync\` on the upstream package first.`
      )
    }
  }
}

/**
 * Validate and normalize the evaluated config object.
 * Unwraps default export, checks for include array.
 *
 * @throws ConfigValidationError if config is invalid
 */
export function validateConfig(raw: unknown): ReferenceUIConfig {
  const cfg = mustBeObject(raw)
  validateInclude(cfg)
  validateName(cfg)
  warnLayersWithoutCss(cfg.layers as BaseSystem[] | undefined)
  return cfg as ReferenceUIConfig
}

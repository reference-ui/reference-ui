// Validation and normalization for the evaluated Neo config object.
// It takes the raw module export and emits a ReferenceUIConfig or throws.
// This module is a Neo-owned copy of the core validator trimmed to the surviving fields.

import type { ReferenceUIConfig } from './types.ts'
import { ConfigValidationError } from './errors.ts'
import { validateBaseSystemEntries, validateBaseSystems } from '../system/base/validate.ts'

type ConfigRecord = Record<string, unknown>

function mustBeObject(raw: unknown): ConfigRecord {
  const config = (raw as { default?: unknown })?.default ?? raw
  if (!config || typeof config !== 'object') {
    throw ConfigValidationError.mustExportObject()
  }
  return config as ConfigRecord
}

function validateInclude(cfg: ConfigRecord): void {
  if (!cfg.include || !Array.isArray(cfg.include)) {
    throw ConfigValidationError.mustHaveInclude()
  }
}

function validateName(cfg: ConfigRecord): void {
  const name = cfg.name
  if (name == null || typeof name !== 'string' || name.trim() === '') {
    throw ConfigValidationError.mustHaveName()
  }
  const trimmed = name.trim()
  if (trimmed.includes('"') || /[\r\n]/.test(trimmed)) {
    throw ConfigValidationError.invalidName(
      'name must be safe for CSS @layer and [data-layer] (no double-quotes or newlines)'
    )
  }
}

function validateConfigJsxElements(cfg: ConfigRecord): void {
  const jsxElements = cfg.jsxElements
  if (jsxElements == null) return

  if (!Array.isArray(jsxElements) || jsxElements.some((entry) => typeof entry !== 'string')) {
    throw ConfigValidationError.invalidConfig('jsxElements', "'jsxElements' must be an array of strings.")
  }
}

function validateLogs(cfg: ConfigRecord): void {
  const logs = cfg.logs
  if (logs == null) return

  if (!Array.isArray(logs) || logs.some((entry) => entry !== 'compiler')) {
    throw ConfigValidationError.invalidConfig('logs', "'logs' must be an array of log channels ('compiler').")
  }
}

function validateStaticCss(cfg: ConfigRecord): void {
  const staticCss = cfg.staticCss
  if (staticCss == null) return

  if (typeof staticCss !== 'object' || Array.isArray(staticCss)) {
    throw ConfigValidationError.invalidConfig(
      'staticCss',
      "'staticCss' must be an object mapping style properties to value lists."
    )
  }
  for (const [prop, values] of Object.entries(staticCss)) {
    if (!Array.isArray(values) || values.some(entry => typeof entry !== 'string')) {
      throw ConfigValidationError.invalidConfig(
        'staticCss',
        `'staticCss' entry '${prop}' must be an array of strings.`
      )
    }
  }
}

/**
 * Validate and normalize the evaluated config object.
 * Unwraps default export, checks for include array.
 *
 * @throws ConfigValidationError for config fields, Error for extends entries
 */
export function validateConfig(raw: unknown): ReferenceUIConfig {
  const cfg = mustBeObject(raw)
  validateInclude(cfg)
  validateName(cfg)
  validateConfigJsxElements(cfg)
  validateLogs(cfg)
  validateStaticCss(cfg)
  const extendsSystems = validateBaseSystems('extends', cfg.extends)
  validateBaseSystemEntries('extends', extendsSystems, { requireFragment: true })
  return cfg as unknown as ReferenceUIConfig
}

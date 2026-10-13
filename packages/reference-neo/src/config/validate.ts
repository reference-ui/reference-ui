// Validation and normalization for the evaluated Neo config object.
// It takes the raw module export and emits a ReferenceUIConfig or throws.
// This module is a Neo-owned copy of the core validator trimmed to the surviving fields.

import type { ReferenceUIConfig, StrictCategory } from './types.ts'
import type { BaseSystemField } from '../system/base/validate.ts'
import { ConfigValidationError } from './errors.ts'
import {
  validateBaseSystemEntries,
  validateBaseSystemLinks,
  validateBaseSystems,
} from '../system/base/validate.ts'

type ConfigRecord = Record<string, unknown>

const STRICT_CATEGORIES: readonly StrictCategory[] = ['colors', 'radii', 'spacing']

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

function validateName(cfg: ConfigRecord): string {
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
  return name
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

function validateStrict(cfg: ConfigRecord): void {
  const strict = cfg.strict
  if (strict == null) return

  if (!Array.isArray(strict) || strict.some((entry) => !STRICT_CATEGORIES.includes(entry))) {
    throw ConfigValidationError.invalidConfig(
      'strict',
      "'strict' must be an array of token categories ('colors', 'radii', 'spacing')."
    )
  }
}

const BASE_FIELDS: readonly BaseSystemField[] = ['extends', 'layers']

// One base-system field, checked in full: shape and synced payload, then the links to
// the own name. Layers also need streams, since only streams carry a layer's CSS.
function validateBaseField(cfg: ConfigRecord, field: BaseSystemField, ownName: string): void {
  const systems = validateBaseSystems(field, cfg[field])
  validateBaseSystemEntries(field, systems, {
    requireFragment: true,
    requireStreams: field === 'layers',
  })
  validateBaseSystemLinks(field, systems, ownName)
}

// Each field is checked on its own, so a bad extends cannot hide a bad layers. One
// failure keeps its own message; two are reported together, extends first.
function validateBaseFields(cfg: ConfigRecord, ownName: string): void {
  const failures: Error[] = []
  for (const field of BASE_FIELDS) {
    try {
      validateBaseField(cfg, field, ownName)
    } catch (error) {
      failures.push(error instanceof Error ? error : new Error(String(error)))
    }
  }
  // A system present in both fields is held for the owner's ruling (D6), so no
  // cross-field check runs here. Adding one is a single branch after both fields pass.
  if (failures.length === 1) throw failures[0]
  if (failures.length > 1) {
    throw new Error(failures.map((failure) => failure.message).join('\n\n'))
  }
}

/**
 * Validate and normalize the evaluated config object.
 * Unwraps default export, checks for include array.
 *
 * @throws ConfigValidationError for config fields, Error for base-system entries
 */
export function validateConfig(raw: unknown): ReferenceUIConfig {
  const cfg = mustBeObject(raw)
  validateInclude(cfg)
  const ownName = validateName(cfg)
  validateConfigJsxElements(cfg)
  validateLogs(cfg)
  validateStaticCss(cfg)
  validateStrict(cfg)
  validateBaseFields(cfg, ownName)
  return cfg as unknown as ReferenceUIConfig
}

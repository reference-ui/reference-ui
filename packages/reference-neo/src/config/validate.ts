// Validation and normalization for the evaluated Neo config object.
// It takes the raw module export and emits a ReferenceUIConfig or throws.
// This module is a Neo-owned copy of the core validator trimmed to the surviving fields.

import type { ReferenceUIConfig } from './types.ts'
import type { BaseSystem } from './types.ts'
import { ConfigValidationError } from './errors.ts'

type ConfigRecord = Record<string, unknown>
type BaseSystemField = 'extends'
type BaseSystemValidationOptions = {
  requireFragment?: boolean
}

function assertOptionalJsxElements(
  field: BaseSystemField,
  sys: BaseSystem,
  index: number
): void {
  if (sys.jsxElements == null) return

  if (!Array.isArray(sys.jsxElements) || sys.jsxElements.some((entry) => typeof entry !== 'string')) {
    throw ConfigValidationError.invalidBaseSystem(
      field,
      `Entry ${index} (${sys.name}) must have 'jsxElements' as an array of strings.`
    )
  }
}

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

function validateBaseSystems(
  field: BaseSystemField,
  value: unknown
): BaseSystem[] | undefined {
  if (value == null) {
    return undefined
  }

  if (!Array.isArray(value)) {
    throw ConfigValidationError.invalidBaseSystem(
      field,
      'Expected an array of BaseSystem objects.'
    )
  }

  return value as BaseSystem[]
}

function assertBaseSystemObject(
  field: BaseSystemField,
  sys: BaseSystem,
  index: number
): void {
  if (!sys || typeof sys !== 'object') {
    throw ConfigValidationError.invalidBaseSystem(
      field,
      `Entry ${index} must be an object.`
    )
  }
}

function assertBaseSystemName(
  field: BaseSystemField,
  sys: BaseSystem,
  index: number
): void {
  if (typeof sys.name !== 'string' || sys.name.trim() === '') {
    throw ConfigValidationError.invalidBaseSystem(
      field,
      `Entry ${index} must have a non-empty 'name'.`
    )
  }
}

function assertRequiredFragment(
  field: BaseSystemField,
  sys: BaseSystem,
  index: number,
  requireFragment: boolean
): void {
  if (!requireFragment) return

  const hasFragment = typeof sys.fragment === 'string' && sys.fragment.trim() !== ''
  const hasCss = typeof sys.css === 'string' && sys.css.trim() !== ''
  const hasJsxElements = Array.isArray(sys.jsxElements) && sys.jsxElements.length > 0

  if (!hasFragment && !hasCss && !hasJsxElements) {
    throw ConfigValidationError.invalidBaseSystem(
      field,
      `Entry ${index} (${sys.name}) must include synced system data (fragment, css, or jsxElements). Run sync on the upstream package first.`
    )
  }
}

function validateBaseSystemEntry(
  field: BaseSystemField,
  sys: BaseSystem,
  index: number,
  options: BaseSystemValidationOptions
): void {
  assertBaseSystemObject(field, sys, index)
  assertBaseSystemName(field, sys, index)
  assertRequiredFragment(field, sys, index, options.requireFragment ?? false)
  assertOptionalJsxElements(field, sys, index)
}

function validateBaseSystemEntries(
  field: BaseSystemField,
  systems: BaseSystem[] | undefined,
  options: BaseSystemValidationOptions = {}
): void {
  if (!systems?.length) return

  for (const [index, sys] of systems.entries()) {
    validateBaseSystemEntry(field, sys, index, options)
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
  validateConfigJsxElements(cfg)
  validateStaticCss(cfg)
  const extendsSystems = validateBaseSystems('extends', cfg.extends)
  validateBaseSystemEntries('extends', extendsSystems, { requireFragment: true })
  return cfg as unknown as ReferenceUIConfig
}

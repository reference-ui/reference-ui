import type { ReferenceUIConfig } from './types'
import type { BaseSystem } from '../types'
import { ConfigValidationError } from './errors'
import { log } from '../lib/log'

type ConfigRecord = Record<string, unknown>
type BaseSystemField = 'extends' | 'layers'
type BaseSystemValidationOptions = {
  requireFragment?: boolean
  warnIfCssMissing?: boolean
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

function validatePatternList(field: string, value: unknown): string[] | undefined {
  if (value == null) return undefined
  if (!Array.isArray(value) || value.some(entry => typeof entry !== 'string')) {
    throw ConfigValidationError.invalidMcp(
      `'${field}' must be an array of string patterns.`
    )
  }
  return value as string[]
}

function validateConfigJsxElements(cfg: ConfigRecord): void {
  const jsxElements = cfg.jsxElements
  if (jsxElements == null) return

  if (!Array.isArray(jsxElements) || jsxElements.some((entry) => typeof entry !== 'string')) {
    throw ConfigValidationError.invalidConfig('jsxElements', "'jsxElements' must be an array of strings.")
  }
}

function validateMcpConfig(cfg: ConfigRecord): void {
  const raw = cfg.mcp
  if (raw == null) return
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw ConfigValidationError.invalidMcp(
      'Expected an object with optional include/exclude arrays.'
    )
  }

  const mcp = raw as ConfigRecord
  validatePatternList('mcp.include', mcp.include)
  validatePatternList('mcp.exclude', mcp.exclude)
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
      `Entry ${index} (${sys.name}) must include synced system data (fragment, css, or jsxElements). Run \`ref sync\` on the upstream package first.`
    )
  }
}

function warnIfBaseSystemCssMissing(sys: BaseSystem, warnIfCssMissing: boolean): void {
  if (!warnIfCssMissing || sys.css) return

  log.info(
    `[config] Warning: layers entry "${sys.name}" has no css field. Run \`ref sync\` on the upstream package first.`
  )
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
  warnIfBaseSystemCssMissing(sys, options.warnIfCssMissing ?? false)
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
  validateMcpConfig(cfg)
  const extendsSystems = validateBaseSystems('extends', cfg.extends)
  const layers = validateBaseSystems('layers', cfg.layers)
  validateBaseSystemEntries('extends', extendsSystems, { requireFragment: true })
  validateBaseSystemEntries('layers', layers, { warnIfCssMissing: true })
  return cfg as unknown as ReferenceUIConfig
}

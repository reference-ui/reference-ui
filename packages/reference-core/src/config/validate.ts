import type { ReferenceUIConfig, BaseSystem } from './types'
import { ConfigValidationError } from './errors'
import { log } from '../lib/log'

type ConfigRecord = Record<string, unknown>
type BaseSystemField = 'extends' | 'layers'

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

function validateBaseSystems(field: BaseSystemField, value: unknown): BaseSystem[] | undefined {
  if (value == null) {
    return undefined
  }

  if (!Array.isArray(value)) {
    throw ConfigValidationError.invalidBaseSystem(field, 'Expected an array of BaseSystem objects.')
  }

  return value as BaseSystem[]
}

function validateBaseSystemEntries(
  field: BaseSystemField,
  systems: BaseSystem[] | undefined,
  options: {
    requireFragment?: boolean
    warnIfCssMissing?: boolean
  } = {}
): void {
  if (!systems?.length) return

  for (const [index, sys] of systems.entries()) {
    if (!sys || typeof sys !== 'object') {
      throw ConfigValidationError.invalidBaseSystem(field, `Entry ${index} must be an object.`)
    }

    if (typeof sys.name !== 'string' || sys.name.trim() === '') {
      throw ConfigValidationError.invalidBaseSystem(field, `Entry ${index} must have a non-empty 'name'.`)
    }

    if (options.requireFragment && (typeof sys.fragment !== 'string' || sys.fragment.trim() === '')) {
      throw ConfigValidationError.invalidBaseSystem(
        field,
        `Entry ${index} (${sys.name}) must include a non-empty 'fragment'. Run \`ref sync\` on the upstream package first.`
      )
    }

    if (options.warnIfCssMissing && !sys.css) {
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
  const extendsSystems = validateBaseSystems('extends', cfg.extends)
  const layers = validateBaseSystems('layers', cfg.layers)
  validateBaseSystemEntries('extends', extendsSystems, { requireFragment: true })
  validateBaseSystemEntries('layers', layers, { warnIfCssMissing: true })
  return cfg as unknown as ReferenceUIConfig
}

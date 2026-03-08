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

function validateBaseSystems(
  field: 'extends' | 'layers',
  value: unknown
): BaseSystem[] | undefined {
  if (value == null) {
    return undefined
  }

  if (!Array.isArray(value)) {
    throw ConfigValidationError.invalidBaseSystem(field, 'Expected an array of BaseSystem objects.')
  }

  return value as BaseSystem[]
}

function validateExtends(extendsSystems: BaseSystem[] | undefined): void {
  if (!extendsSystems?.length) return

  for (const [index, sys] of extendsSystems.entries()) {
    if (!sys || typeof sys !== 'object') {
      throw ConfigValidationError.invalidBaseSystem('extends', `Entry ${index} must be an object.`)
    }
    if (typeof sys.name !== 'string' || sys.name.trim() === '') {
      throw ConfigValidationError.invalidBaseSystem('extends', `Entry ${index} must have a non-empty 'name'.`)
    }
    if (typeof sys.fragment !== 'string' || sys.fragment.trim() === '') {
      throw ConfigValidationError.invalidBaseSystem(
        'extends',
        `Entry ${index} (${sys.name}) must include a non-empty 'fragment'. Run \`ref sync\` on the upstream package first.`
      )
    }
  }
}

function warnLayersWithoutCss(layers: BaseSystem[] | undefined): void {
  if (!layers?.length) return
  for (const [index, sys] of layers.entries()) {
    if (!sys || typeof sys !== 'object') {
      throw ConfigValidationError.invalidBaseSystem('layers', `Entry ${index} must be an object.`)
    }
    if (typeof sys.name !== 'string' || sys.name.trim() === '') {
      throw ConfigValidationError.invalidBaseSystem('layers', `Entry ${index} must have a non-empty 'name'.`)
    }
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
  const extendsSystems = validateBaseSystems('extends', cfg.extends)
  const layers = validateBaseSystems('layers', cfg.layers)
  validateExtends(extendsSystems)
  warnLayersWithoutCss(layers)
  return cfg as unknown as ReferenceUIConfig
}

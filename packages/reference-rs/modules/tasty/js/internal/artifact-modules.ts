/**
 * Validators for the modules the artifact importer returns.
 * Validates what artifact modules export: the manifest, the browser runtime module and chunk
 * symbols. Each extractor returns a typed value or throws a message that names the export it
 * expected, so a malformed artifact fails at load time rather than later.
 */
import type { RawTastyManifest, TastyRuntimeModule } from '../api-types.js'
import { isUrlLike } from './artifact-loading.js'
import type { TastySymbolModel } from './type-guards.js'

export type ModuleNamespace = Record<string, unknown>

const CURRENT_TASTY_MANIFEST_VERSION = '2'

export function normalizeModuleNamespace(value: unknown): ModuleNamespace {
  if (value == null || typeof value !== 'object') {
    throw new Error('Expected imported artifact module to be an object.')
  }
  return value as ModuleNamespace
}

export function extractManifest(value: unknown): RawTastyManifest {
  const moduleValue = normalizeModuleNamespace(value)
  const manifest = (moduleValue.default ?? moduleValue.manifest) as unknown
  if (!isRawTastyManifest(manifest)) {
    throw new Error(
      'Malformed Tasty manifest module. Expected a default or manifest export with version, warnings, symbolsByName, and symbolsById.'
    )
  }
  if (manifest.version !== CURRENT_TASTY_MANIFEST_VERSION) {
    throw new Error(
      `Unsupported Tasty manifest version "${manifest.version}". Expected "${CURRENT_TASTY_MANIFEST_VERSION}".`
    )
  }
  return manifest
}

export function extractChunkSymbol(
  moduleValue: ModuleNamespace,
  symbolId: string
): TastySymbolModel {
  const direct = moduleValue[symbolId]
  if (isTastySymbolModel(direct)) {
    return assertChunkSymbolId(direct, symbolId, 'named')
  }

  const defaultExport = moduleValue.default
  if (isTastySymbolModel(defaultExport) && defaultExport.id === symbolId) {
    return defaultExport
  }

  throw new Error(
    `Missing symbol export in Tasty chunk for id "${symbolId}". Expected a named export "${symbolId}" or a matching default export.`
  )
}

export function extractTastyRuntimeModule(value: unknown): TastyRuntimeModule {
  const moduleValue = normalizeModuleNamespace(value)
  const runtimeModule = isTastyRuntimeModule(moduleValue)
    ? moduleValue
    : moduleValue.default

  if (!isTastyRuntimeModule(runtimeModule)) {
    throw new Error(
      'Malformed Tasty browser runtime module. Expected manifest, manifestUrl, and importTastyArtifact exports.'
    )
  }

  return runtimeModule
}

function isRawTastyManifest(value: unknown): value is RawTastyManifest {
  if (value == null || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.version === 'string' &&
    Array.isArray(candidate.warnings) &&
    candidate.warnings.every(isRawTastyDiagnostic) &&
    hasSymbolIndexes(candidate)
  )
}

// Both indexes must be objects, and every name must map to a list of string symbol ids.
function hasSymbolIndexes(candidate: Record<string, unknown>): boolean {
  return (
    candidate.symbolsByName != null &&
    typeof candidate.symbolsByName === 'object' &&
    Object.values(candidate.symbolsByName).every(
      symbolIds =>
        Array.isArray(symbolIds) &&
        symbolIds.every(symbolId => typeof symbolId === 'string')
    ) &&
    candidate.symbolsById != null &&
    typeof candidate.symbolsById === 'object'
  )
}

function isRawTastyDiagnostic(value: unknown): boolean {
  if (value == null || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (
    (candidate.severity === 'warning' || candidate.severity === 'error') &&
    typeof candidate.code === 'string' &&
    candidate.code.length > 0 &&
    typeof candidate.message === 'string' &&
    candidate.message.length > 0
  )
}

function isTastyRuntimeModule(value: unknown): value is TastyRuntimeModule {
  if (value == null || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (
    isRawTastyManifest(candidate.manifest) &&
    typeof candidate.manifestUrl === 'string' &&
    isUrlLike(candidate.manifestUrl) &&
    typeof candidate.importTastyArtifact === 'function'
  )
}

function isTastySymbolModel(value: unknown): value is TastySymbolModel {
  if (value == null || typeof value !== 'object') return false
  return 'id' in value && 'name' in value && 'library' in value
}

function assertChunkSymbolId(
  symbol: TastySymbolModel,
  expectedId: string,
  exportKind: 'default' | 'named'
): TastySymbolModel {
  if (symbol.id !== expectedId) {
    throw new Error(
      `Malformed ${exportKind} chunk export for symbol id "${expectedId}". Received "${symbol.id}".`
    )
  }
  return symbol
}

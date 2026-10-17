/**
 * Typescript source file for Reference UI module.
 * Re-exports the helpers that the internal runtime modules share: type guards, runtime errors,
 * artifact loading, module extraction and user-owned reference collection. Each lives in its own
 * module, and this file keeps a single import path for the existing importers.
 */

export type { TastySymbolModel } from './type-guards.js'
export {
  isInterfaceSymbol,
  isRawStructuredTypeRef,
  isTypeAliasSymbol,
  isTypeReference,
} from './type-guards.js'
export {
  createAmbiguousSymbolNameError,
  formatSymbolCandidate,
  wrapRuntimeError,
} from './runtime-errors.js'
export {
  defaultArtifactImporter,
  resolveArtifactPath,
  resolveArtifactSpecifier,
  type ArtifactImporter,
} from './artifact-loading.js'
export {
  extractChunkSymbol,
  extractManifest,
  extractTastyRuntimeModule,
  normalizeModuleNamespace,
  type ModuleNamespace,
} from './artifact-modules.js'
export { collectUserOwnedReferencesFromSymbol } from './user-references.js'

export function uniqueById<T>(values: T[], getId: (value: T) => string): T[] {
  const seen = new Set<string>()
  return values.filter(value => {
    const id = getId(value)
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

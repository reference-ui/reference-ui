/**
 * Vendored tasty declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so core typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/tasty/js/internal/shared.d.ts
 * Regen: cd packages/reference-core && node tools/vendor-rust-tasty-dts.mjs
 */

/**
 * Single import path for the helpers the internal runtime modules share.
 * Re-exports the helpers that the internal runtime modules share: type guards, runtime errors,
 * artifact loading, module extraction and user-owned reference collection. Each lives in its own
 * module, and this file keeps a single import path for the existing importers.
 */
export type { TastySymbolModel } from './type-guards.js';
export { isInterfaceSymbol, isRawStructuredTypeRef, isTypeAliasSymbol, isTypeReference, } from './type-guards.js';
export { createAmbiguousSymbolNameError, formatSymbolCandidate, wrapRuntimeError, } from './runtime-errors.js';
export { defaultArtifactImporter, resolveArtifactPath, resolveArtifactSpecifier, type ArtifactImporter, } from './artifact-loading.js';
export { extractChunkSymbol, extractManifest, extractTastyRuntimeModule, normalizeModuleNamespace, type ModuleNamespace, } from './artifact-modules.js';
export { collectUserOwnedReferencesFromSymbol } from './user-references.js';
export declare function uniqueById<T>(values: T[], getId: (value: T) => string): T[];

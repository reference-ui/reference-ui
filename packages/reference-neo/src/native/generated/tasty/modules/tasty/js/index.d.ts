/**
 * Vendored tasty declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so neo typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/tasty/js/index.d.ts
 * Regen: cd packages/reference-neo && node tools/vendor-rust-tasty-dts.mjs
 */

/**
 * Typescript source file for Reference UI module.
 * Contains JS API logic and types.
 */
export type { CreateTastyApiOptions, CreateTastyApiFromManifestOptions, CreateTastyBrowserRuntimeOptions, RawTastyChunkModule, RawTastyFnParam, RawTastyInterfaceSymbol, RawTastyJsDoc, RawTastyDiagnostic, RawTastyJsDocTag, RawTastyManifest, RawTastyMappedModifierKind, RawTastyMember, RawTastyMemberKind, RawTastyModule, RawTastyStructuredTypeRef, RawTastySymbol, RawTastySymbolIndexEntry, RawTastySymbolKind, RawTastySymbolRef, RawTastyTemplateLiteralPart, RawTastyTupleElement, RawTastyTypeAliasSymbol, RawTastyTypeOperatorKind, RawTastyTypeParameter, RawTastyTypeRef, RawTastyTypeReference, TastyApi, TastyBrowserRuntime, TastyCallableParameter, TastyFnParam, TastyGraphApi, TastyJsDocTag, TastyMember, TastyRuntimeModule, TastySymbol, TastySymbolKind, TastySymbolRef, TastySymbolSearchResult, TastyTypeParameterMemberProjector, TastyTypeKind, TastyTypeRef, } from './api-types.js';
export { dedupeTastyMembers, getTastyMemberDefaultValue, getTastyMemberId, } from './members.js';
export { getTastyJsDocParamDescriptions, normalizeTastyInlineValue, parseTastyParamTag, } from './jsdoc.js';
export { getTastyLiteralSemanticKind, getTastyMemberSemanticKind, getTastyTypeSemanticKind, type TastySemanticKind, } from './semantic.js';
export { formatTastyCallableSignature, getTastyTypeInlineVariants } from './display.js';
export { getTastyCallableParameters } from './callables.js';
export { getTastyResolvedType } from './resolution.js';
export { createTastyApi, createTastyApiFromManifest } from './internal/api-runtime.js';
export { createTastyBrowserRuntime } from './internal/browser-runtime.js';

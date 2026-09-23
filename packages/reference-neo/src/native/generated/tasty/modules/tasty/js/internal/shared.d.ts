/**
 * Vendored tasty declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so neo typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/tasty/js/internal/shared.d.ts
 * Regen: cd packages/reference-neo && node tools/vendor-rust-tasty-dts.mjs
 */

/**
 * Typescript source file for Reference UI module.
 * Contains JS API logic and types.
 */
import type { RawTastyInterfaceSymbol, RawTastyManifest, RawTastySymbol, RawTastySymbolRef, RawTastyTypeAliasSymbol, RawTastyTypeRef, RawTastyTypeReference, TastyRuntimeModule, TastySymbolSearchResult } from '../api-types.js';
export type TastySymbolModel = RawTastySymbol;
export type ArtifactImporter = (artifactPath: string) => Promise<unknown>;
export type ModuleNamespace = Record<string, unknown>;
export declare function wrapRuntimeError(prefix: string, error: unknown): Error;
export declare function createAmbiguousSymbolNameError(name: string, matches: TastySymbolSearchResult[]): Error;
export declare function formatSymbolCandidate(result: TastySymbolSearchResult): string;
export declare function isInterfaceSymbol(symbol: TastySymbolModel): symbol is RawTastyInterfaceSymbol;
export declare function isTypeAliasSymbol(symbol: TastySymbolModel): symbol is RawTastyTypeAliasSymbol;
export declare function isTypeReference(typeRef: RawTastyTypeRef): typeRef is RawTastyTypeReference;
export declare function isRawStructuredTypeRef(typeRef: RawTastyTypeRef): typeRef is Extract<RawTastyTypeRef, {
    kind: 'raw';
}>;
export declare function uniqueById<T>(values: T[], getId: (value: T) => string): T[];
export declare function defaultArtifactImporter(artifactPath: string): Promise<unknown>;
export declare function normalizeModuleNamespace(value: unknown): ModuleNamespace;
export declare function extractManifest(value: unknown): RawTastyManifest;
export declare function extractChunkSymbol(moduleValue: ModuleNamespace, symbolId: string): TastySymbolModel;
export declare function extractTastyRuntimeModule(value: unknown): TastyRuntimeModule;
export declare function resolveArtifactPath(basePath: string, relativePath: string): Promise<string>;
export declare function resolveArtifactSpecifier(pathOrSpecifier: string): Promise<string>;
export declare function collectUserOwnedReferencesFromSymbol(symbol: TastySymbolModel): RawTastySymbolRef[];

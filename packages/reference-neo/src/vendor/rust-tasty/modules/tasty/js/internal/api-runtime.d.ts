/**
 * Vendored tasty declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so neo typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/tasty/js/internal/api-runtime.d.ts
 * Regen: cd packages/reference-neo && node tools/vendor-rust-tasty-dts.mjs
 */

/**
 * Typescript source file for Reference UI module.
 * Contains JS API logic and types.
 */
import type { CreateTastyApiOptions, CreateTastyApiFromManifestOptions, RawTastyManifest, RawTastyMember, RawTastySymbolIndexEntry, RawTastySymbolRef, RawTastyTypeRef, TastyApi, TastyMember, TastyGraphApi, TastySymbol, TastySymbolRef, TastySymbolSearchResult, TastyTypeParameterMemberProjector, TastyTypeRef } from '../api-types.js';
import { type ArtifactImporter } from './shared.js';
interface CreateTastyApiRuntimeOptions {
    manifestPath: string;
    importer: ArtifactImporter;
    preferredExternalLibraries?: string[];
    projectTypeParameterMembers?: TastyTypeParameterMemberProjector;
}
export declare class TastyApiRuntime implements TastyApi {
    private readonly manifestPath?;
    private readonly importer;
    private readonly preferredExternalLibraries;
    private readonly projectTypeParameterMembers?;
    private manifestPromise;
    private manifest;
    private readonly runtimeWarnings;
    private readonly chunkLoader;
    private readonly symbolResolver;
    readonly graph: TastyGraphApi;
    constructor(options: CreateTastyApiRuntimeOptions | CreateTastyApiFromManifestOptions);
    private graphResolveReference;
    private graphLoadImmediateDependencies;
    /** Walk `extends` for symbols that resolve into the manifest (skips utilities like `Omit`). */
    private graphLoadExtendsChain;
    private loadManifestSymbolRef;
    private graphFlattenInterfaceMembers;
    private graphGetDisplayMembers;
    private graphProjectObjectLikeMembers;
    private graphCollectUserOwnedReferences;
    ready(): Promise<void>;
    loadManifest(): Promise<RawTastyManifest>;
    getManifest(): RawTastyManifest | undefined;
    getWarnings(): string[];
    /** True when `id` is a chunk-backed symbol in the loaded manifest (not e.g. an unresolved utility name). */
    hasManifestSymbol(id: string): boolean;
    loadSymbolById(id: string): Promise<TastySymbol>;
    loadSymbolByName(name: string): Promise<TastySymbol>;
    findSymbolByName(name: string): Promise<TastySymbol | undefined>;
    findSymbolsByName(name: string): Promise<TastySymbolSearchResult[]>;
    loadSymbolByScopedName(library: string, name: string): Promise<TastySymbol>;
    findSymbolByScopedName(library: string, name: string): Promise<TastySymbol | undefined>;
    prefetchChunk(path: string): Promise<void>;
    prefetchSymbolById(id: string): Promise<void>;
    prefetchSymbolByName(name: string): Promise<void>;
    searchSymbols(query: string): Promise<TastySymbolSearchResult[]>;
    isSymbolLoaded(id: string): boolean;
    getLoadedSymbol(id: string): TastySymbol | undefined;
    getManifestEntry(id: string): RawTastySymbolIndexEntry | undefined;
    createSymbolRef(raw: RawTastySymbolRef): TastySymbolRef;
    createTypeRef(raw: RawTastyTypeRef): TastyTypeRef;
    createMember(raw: RawTastyMember): TastyMember;
}
export declare function createTastyApi(options: CreateTastyApiOptions): TastyApi;
export declare function createTastyApiFromManifest(options: CreateTastyApiFromManifestOptions): TastyApi;
export {};

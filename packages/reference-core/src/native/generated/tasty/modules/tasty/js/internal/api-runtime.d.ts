/**
 * Vendored tasty declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so core typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/tasty/js/internal/api-runtime.d.ts
 * Regen: cd packages/reference-core && node tools/vendor-rust-tasty-dts.mjs
 */

/**
 * Node implementation of the TastyApi over emitted artifacts.
 * Loads and validates the manifest, resolves symbols by id or name through the SymbolResolver, and serves members, references, display helpers, and diagnostics.
 * Entry points are createTastyApi and createTastyApiFromManifest. Each public projection call builds one ProjectionContext here, so its whole walk shares one path and one step budget, and getDisplayResult reports the walk limits that dropped members from that call.
 */
import type { CreateTastyApiOptions, CreateTastyApiFromManifestOptions, RawTastyDiagnostic, RawTastyManifest, RawTastyMember, RawTastySymbolIndexEntry, RawTastySymbolRef, RawTastyTypeRef, TastyApi, TastyMember, TastyGraphApi, TastySymbol, TastySymbolRef, TastySymbolSearchResult, TastyTypeParameterMemberProjector, TastyTypeRef } from '../api-types.js';
import { type ArtifactImporter } from './shared.js';
import { type ProjectionContext } from './object-projection-references.js';
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
    loadManifestSymbolRef(ref: TastySymbolRef): Promise<TastySymbol | undefined>;
    private graphFlattenInterfaceMembers;
    private graphGetDisplayMembers;
    /** Reads `truncated` and `notices` from this call's own record after the walk settles, so overlapping calls never share them. */
    private graphGetDisplayResult;
    private graphProjectObjectLikeMembers;
    /**
     * The context one public call starts with: an empty path, no type parameter in scope, and the walk limits for this
     * call. A limit that drops members ends the walk with a partial result, records its notice on this call, and publishes
     * it to runtimeWarnings.
     */
    private createRootContext;
    /** An interface's flattened members under a projection's own context, so that walk shares its path and budget. */
    flattenInterfaceUnder(symbol: TastySymbol, context: ProjectionContext): Promise<TastyMember[]>;
    private graphCollectUserOwnedReferences;
    ready(): Promise<void>;
    loadManifest(): Promise<RawTastyManifest>;
    getManifest(): RawTastyManifest | undefined;
    getWarnings(): RawTastyDiagnostic[];
    getRuntimeNotices(): string[];
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

/**
 * Node implementation of the TastyApi over emitted artifacts.
 * Loads and validates the manifest, resolves symbols by id or name through the SymbolResolver, and serves members, references, display helpers, and diagnostics.
 * Entry points are createTastyApi and createTastyApiFromManifest. Each public projection call builds one ProjectionContext here, so its whole walk shares one path and one step budget, and getDisplayResult reports whether that budget ran out.
 */
import type {
  CreateTastyApiOptions,
  CreateTastyApiFromManifestOptions,
  RawTastyDiagnostic,
  RawTastyManifest,
  RawTastyMember,
  RawTastySymbolIndexEntry,
  RawTastySymbolRef,
  RawTastyTypeRef,
  TastyApi,
  TastyDisplayResult,
  TastyMember,
  TastyGraphApi,
  TastySymbol,
  TastySymbolRef,
  TastySymbolSearchResult,
  TastyTypeParameterMemberProjector,
  TastyTypeRef,
} from '../api-types.js'
import { dedupeTastyMembers } from '../members.js'
import {
  collectUserOwnedReferencesFromSymbol,
  defaultArtifactImporter,
  extractManifest,
  resolveArtifactSpecifier,
  uniqueById,
  wrapRuntimeError,
  isInterfaceSymbol,
  isTypeAliasSymbol,
  type ArtifactImporter,
} from './shared.js'
import { projectObjectLikeMembers } from './object-projection.js'
import { flattenInterfaceMembers } from './interface-flatten.js'
import {
  budgetExhaustedNotice,
  createProjectionBudget,
  type ProjectionContext,
} from './object-projection-references.js'
import { TastyMemberImpl, TastySymbolRefImpl, TastyTypeRefImpl } from './wrappers.js'
import { ChunkLoader } from './chunk-loader.js'
import { SymbolResolver } from './symbol-resolver.js'

interface CreateTastyApiRuntimeOptions {
  manifestPath: string
  importer: ArtifactImporter
  preferredExternalLibraries?: string[]
  projectTypeParameterMembers?: TastyTypeParameterMemberProjector
}

export class TastyApiRuntime implements TastyApi {
  private readonly manifestPath?: string
  private readonly importer: ArtifactImporter
  private readonly preferredExternalLibraries: string[]
  private readonly projectTypeParameterMembers?: TastyTypeParameterMemberProjector
  private manifestPromise: Promise<RawTastyManifest> | undefined
  private manifest: RawTastyManifest | undefined
  private readonly runtimeWarnings = new Set<string>()
  private readonly chunkLoader: ChunkLoader
  private readonly symbolResolver: SymbolResolver

  public readonly graph: TastyGraphApi

  constructor(options: CreateTastyApiRuntimeOptions | CreateTastyApiFromManifestOptions) {
    this.importer = options.importer
    this.preferredExternalLibraries = options.preferredExternalLibraries ?? []
    this.projectTypeParameterMembers = options.projectTypeParameterMembers
    if ('manifest' in options) {
      this.manifest = options.manifest
      this.manifestPromise = Promise.resolve(options.manifest)
      this.manifestPath = options.manifestPath
    } else {
      this.manifestPath = options.manifestPath
    }
    this.chunkLoader = new ChunkLoader({
      manifestPath: this.manifestPath,
      importer: this.importer,
      wrapChunkLoadError: (relativeChunkPath, resolvedChunkPath, error) =>
        wrapRuntimeError(
          `Failed to load Tasty chunk "${relativeChunkPath}" from "${resolvedChunkPath}".`,
          error
        ),
    })
    this.symbolResolver = new SymbolResolver({
      api: this,
      chunkLoader: this.chunkLoader,
      preferredExternalLibraries: this.preferredExternalLibraries,
      runtimeWarnings: this.runtimeWarnings,
      loadManifest: () => this.loadManifest(),
    })
    this.graph = {
      resolveReference: ref => this.graphResolveReference(ref),
      loadImmediateDependencies: symbol => this.graphLoadImmediateDependencies(symbol),
      loadExtendsChain: symbol => this.graphLoadExtendsChain(symbol),
      flattenInterfaceMembers: symbol => this.graphFlattenInterfaceMembers(symbol),
      getDisplayMembers: symbol => this.graphGetDisplayMembers(symbol),
      getDisplayResult: symbol => this.graphGetDisplayResult(symbol),
      projectObjectLikeMembers: symbol => this.graphProjectObjectLikeMembers(symbol),
      collectUserOwnedReferences: symbol => this.graphCollectUserOwnedReferences(symbol),
    }
  }

  private async graphResolveReference(ref: TastySymbolRef): Promise<TastySymbol> {
    await this.loadManifest()
    const id = ref.getId()
    if (!this.hasManifestSymbol(id)) {
      throw new Error(
        `Reference "${id}" is not backed by the manifest (built-in or external utility).`
      )
    }
    return ref.load()
  }

  private async graphLoadImmediateDependencies(
    symbol: TastySymbol
  ): Promise<TastySymbol[]> {
    await this.loadManifest()
    const refs = await this.graph.collectUserOwnedReferences(symbol)
    const manifestBacked = refs.filter(ref => this.hasManifestSymbol(ref.getId()))
    return Promise.all(manifestBacked.map(ref => ref.load()))
  }

  /** Walk `extends` for symbols that resolve into the manifest (skips utilities like `Omit`). */
  private async graphLoadExtendsChain(symbol: TastySymbol): Promise<TastySymbol[]> {
    await this.loadManifest()
    const visited = new Set<string>()
    const chain: TastySymbol[] = []

    const visit = async (current: TastySymbol): Promise<void> => {
      for (const ref of current.getExtends()) {
        const loaded = await this.loadManifestSymbolRef(ref)
        if (!loaded || visited.has(loaded.getId())) continue
        visited.add(loaded.getId())
        chain.push(loaded)
        await visit(loaded)
      }
    }

    await visit(symbol)
    return chain
  }

  async loadManifestSymbolRef(ref: TastySymbolRef): Promise<TastySymbol | undefined> {
    const id = ref.getId()
    if (this.hasManifestSymbol(id)) return ref.load()

    const library = ref.getLibrary()
    if (library) {
      try {
        const scoped = await this.findSymbolByScopedName(library, ref.getName())
        if (scoped) return scoped
      } catch {
        // Fall back to a unique bare-name match below.
      }
    }

    const matches = await this.findSymbolsByName(ref.getName())
    if (matches.length === 1) return this.loadSymbolById(matches[0]!.id)
    return undefined
  }

  private async graphFlattenInterfaceMembers(
    symbol: TastySymbol
  ): Promise<TastyMember[]> {
    return flattenInterfaceMembers(this, symbol, new Map(), this.createRootContext(symbol))
  }

  private async graphGetDisplayMembers(symbol: TastySymbol): Promise<TastyMember[]> {
    return (await this.graphGetDisplayResult(symbol)).members
  }

  /** Reads `truncated` from this call's own budget after the walk settles, so overlapping calls never share it. */
  private async graphGetDisplayResult(symbol: TastySymbol): Promise<TastyDisplayResult> {
    const raw = symbol.getRaw()
    const context = this.createRootContext(symbol)
    let members: TastyMember[] = []
    if (isInterfaceSymbol(raw)) {
      members = dedupeTastyMembers(await flattenInterfaceMembers(this, symbol, new Map(), context))
    } else if (isTypeAliasSymbol(raw)) {
      members = (await projectObjectLikeMembers(this, symbol, context)) ?? []
    }
    return { members, truncated: context.budget.reported }
  }

  private graphProjectObjectLikeMembers(
    symbol: TastySymbol
  ): ReturnType<typeof projectObjectLikeMembers> {
    return projectObjectLikeMembers(this, symbol, this.createRootContext(symbol))
  }

  /**
   * The context one public call starts with: an empty path, no type parameter in scope, and a step budget for this
   * walk. When the budget runs out, the walk ends with a partial result and one notice in runtimeWarnings.
   */
  private createRootContext(symbol: TastySymbol): ProjectionContext {
    return {
      visitedSymbolIds: new Set<string>(),
      depth: 0,
      projectTypeParameterMembers: this.projectTypeParameterMembers,
      budget: createProjectionBudget(() => {
        this.runtimeWarnings.add(budgetExhaustedNotice(symbol.getName()))
      }),
    }
  }

  /** An interface's flattened members under a projection's own context, so that walk shares its path and budget. */
  flattenInterfaceUnder(symbol: TastySymbol, context: ProjectionContext): Promise<TastyMember[]> {
    return flattenInterfaceMembers(this, symbol, new Map(), context)
  }

  private async graphCollectUserOwnedReferences(
    symbol: TastySymbol
  ): Promise<TastySymbolRef[]> {
    const refs = collectUserOwnedReferencesFromSymbol(symbol.getRaw())
    const userRefs = refs
      .filter(ref => ref.library === 'user')
      .map(ref => this.createSymbolRef(ref))
    return uniqueById(userRefs, ref => ref.getId())
  }

  async ready(): Promise<void> {
    await this.loadManifest()
  }

  async loadManifest(): Promise<RawTastyManifest> {
    if (!this.manifestPromise) {
      if (!this.manifestPath) {
        throw new Error('Tasty runtime is missing a manifest source.')
      }

      this.manifestPromise = resolveArtifactSpecifier(this.manifestPath)
        .then(manifestSpecifier => this.importer(manifestSpecifier))
        .then(moduleValue => {
          const manifest = extractManifest(moduleValue)
          this.manifest = manifest
          return manifest
        })
        .catch((error: unknown) => {
          this.manifestPromise = undefined
          this.manifest = undefined
          throw wrapRuntimeError(
            `Failed to load Tasty manifest from "${this.manifestPath}".`,
            error
          )
        })
    }

    return this.manifestPromise
  }

  getManifest(): RawTastyManifest | undefined {
    return this.manifest
  }

  getWarnings(): RawTastyDiagnostic[] {
    return [...(this.manifest?.warnings ?? [])]
  }

  getRuntimeNotices(): string[] {
    return [...this.runtimeWarnings]
  }

  /** True when `id` is a chunk-backed symbol in the loaded manifest (not e.g. an unresolved utility name). */
  hasManifestSymbol(id: string): boolean {
    return this.manifest?.symbolsById[id] != null
  }

  async loadSymbolById(id: string): Promise<TastySymbol> {
    return this.symbolResolver.loadSymbolById(id)
  }

  async loadSymbolByName(name: string): Promise<TastySymbol> {
    return this.symbolResolver.loadSymbolByName(name)
  }

  async findSymbolByName(name: string): Promise<TastySymbol | undefined> {
    return this.symbolResolver.findSymbolByName(name)
  }

  async findSymbolsByName(name: string): Promise<TastySymbolSearchResult[]> {
    return this.symbolResolver.findSymbolsByName(name)
  }

  async loadSymbolByScopedName(library: string, name: string): Promise<TastySymbol> {
    return this.symbolResolver.loadSymbolByScopedName(library, name)
  }

  async findSymbolByScopedName(
    library: string,
    name: string
  ): Promise<TastySymbol | undefined> {
    return this.symbolResolver.findSymbolByScopedName(library, name)
  }

  async prefetchChunk(path: string): Promise<void> {
    await this.chunkLoader.prefetchChunk(path)
  }

  async prefetchSymbolById(id: string): Promise<void> {
    await this.symbolResolver.prefetchSymbolById(id)
  }

  async prefetchSymbolByName(name: string): Promise<void> {
    await this.symbolResolver.prefetchSymbolByName(name)
  }

  async searchSymbols(query: string): Promise<TastySymbolSearchResult[]> {
    return this.symbolResolver.searchSymbols(query)
  }

  isSymbolLoaded(id: string): boolean {
    return this.symbolResolver.isSymbolLoaded(id)
  }

  getLoadedSymbol(id: string): TastySymbol | undefined {
    return this.symbolResolver.getLoadedSymbol(id)
  }

  getManifestEntry(id: string): RawTastySymbolIndexEntry | undefined {
    return this.symbolResolver.getManifestEntry(id, this.manifest)
  }

  createSymbolRef(raw: RawTastySymbolRef): TastySymbolRef {
    return new TastySymbolRefImpl(this, raw)
  }

  createTypeRef(raw: RawTastyTypeRef): TastyTypeRef {
    return new TastyTypeRefImpl(this, raw)
  }

  createMember(raw: RawTastyMember): TastyMember {
    return new TastyMemberImpl(this, raw)
  }
}

export function createTastyApi(options: CreateTastyApiOptions): TastyApi {
  return new TastyApiRuntime({
    manifestPath: options.manifestPath,
    importer: options.importer ?? defaultArtifactImporter,
    preferredExternalLibraries: options.preferredExternalLibraries,
    projectTypeParameterMembers: options.projectTypeParameterMembers,
  })
}

export function createTastyApiFromManifest(
  options: CreateTastyApiFromManifestOptions
): TastyApi {
  return new TastyApiRuntime(options)
}

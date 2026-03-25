import type {
  CreateTastyApiFromManifestOptions,
  RawTastyManifest,
  RawTastyMember,
  RawTastySymbolIndexEntry,
  RawTastySymbolRef,
  RawTastyTypeRef,
  TastyApi,
  TastyMember,
  TastyGraphApi,
  TastySymbol,
  TastySymbolRef,
  TastySymbolSearchResult,
  TastyTypeRef,
} from '../api-types'
import { dedupeTastyMembers } from '../members'
import {
  collectUserOwnedReferencesFromSymbol,
  createAmbiguousSymbolNameError,
  defaultArtifactImporter,
  extractChunkSymbol,
  extractManifest,
  normalizeModuleNamespace,
  resolveArtifactPath,
  resolveArtifactSpecifier,
  uniqueById,
  wrapRuntimeError,
  isInterfaceSymbol,
  isTypeAliasSymbol,
  type ArtifactImporter,
  type ModuleNamespace,
  type TastySymbolModel,
} from './shared'
import { projectMembersFromInterfaceExtends, projectObjectLikeMembers } from './object-projection'
import { TastyMemberImpl, TastySymbolImpl, TastySymbolRefImpl, TastyTypeRefImpl } from './wrappers'

interface CreateTastyApiRuntimeOptions {
  manifestPath: string
  importer: ArtifactImporter
}

const PREFERRED_EXTERNAL_BARE_NAME_LIBRARIES = [
  '@reference-ui/react',
  '@reference-ui/system',
  '@reference-ui/types',
]

export class TastyApiRuntime implements TastyApi {
  private readonly manifestPath?: string
  private readonly importer: ArtifactImporter
  private manifestPromise: Promise<RawTastyManifest> | undefined
  private manifest: RawTastyManifest | undefined
  private readonly runtimeWarnings = new Set<string>()
  private readonly chunkCache = new Map<string, Promise<ModuleNamespace>>()
  private readonly rawSymbolsById = new Map<string, TastySymbolModel>()
  private readonly symbolCache = new Map<string, TastySymbolImpl>()

  public readonly graph: TastyGraphApi

  constructor(options: CreateTastyApiRuntimeOptions | CreateTastyApiFromManifestOptions) {
    this.importer = options.importer
    if ('manifest' in options) {
      this.manifest = options.manifest
      this.manifestPromise = Promise.resolve(options.manifest)
      this.manifestPath = options.manifestPath
    } else {
      this.manifestPath = options.manifestPath
    }
    this.graph = {
      resolveReference: (ref) => this.graphResolveReference(ref),
      loadImmediateDependencies: (symbol) => this.graphLoadImmediateDependencies(symbol),
      loadExtendsChain: (symbol) => this.graphLoadExtendsChain(symbol),
      flattenInterfaceMembers: (symbol) => this.graphFlattenInterfaceMembers(symbol),
      getDisplayMembers: (symbol) => this.graphGetDisplayMembers(symbol),
      projectObjectLikeMembers: (symbol) => this.graphProjectObjectLikeMembers(symbol),
      collectUserOwnedReferences: (symbol) => this.graphCollectUserOwnedReferences(symbol),
    }
  }

  private async graphResolveReference(ref: TastySymbolRef): Promise<TastySymbol> {
    await this.loadManifest()
    const id = ref.getId()
    if (!this.hasManifestSymbol(id)) {
      throw new Error(
        `Reference "${id}" is not backed by the manifest (built-in or external utility).`,
      )
    }
    return ref.load()
  }

  private async graphLoadImmediateDependencies(symbol: TastySymbol): Promise<TastySymbol[]> {
    await this.loadManifest()
    const refs = await this.graph.collectUserOwnedReferences(symbol)
    const manifestBacked = refs.filter((ref) => this.hasManifestSymbol(ref.getId()))
    return Promise.all(manifestBacked.map((ref) => ref.load()))
  }

  /** Walk `extends` for symbols that exist in the manifest (skips utilities like `Omit` that have no chunk). */
  private async graphLoadExtendsChain(symbol: TastySymbol): Promise<TastySymbol[]> {
    await this.loadManifest()
    const visited = new Set<string>()
    const chain: TastySymbol[] = []

    const visit = async (current: TastySymbol): Promise<void> => {
      for (const ref of current.getExtends()) {
        const id = ref.getId()
        if (visited.has(id) || !this.hasManifestSymbol(id)) continue
        visited.add(id)
        const loaded = await ref.load()
        chain.push(loaded)
        await visit(loaded)
      }
    }

    await visit(symbol)
    return chain
  }

  private async graphFlattenInterfaceMembers(symbol: TastySymbol): Promise<TastyMember[]> {
    const fromUtilities = await projectMembersFromInterfaceExtends(this, symbol)
    const manifestParents = await this.graph.loadExtendsChain(symbol)
    const fromParents = (await Promise.all(manifestParents.map((s) => s.getDisplayMembers()))).flat()
    return [...fromParents, ...fromUtilities, ...symbol.getMembers()]
  }

  private async graphGetDisplayMembers(symbol: TastySymbol): Promise<TastyMember[]> {
    const raw = symbol.getRaw()
    if (isInterfaceSymbol(raw)) {
      return dedupeTastyMembers(await this.graph.flattenInterfaceMembers(symbol))
    }
    if (isTypeAliasSymbol(raw)) {
      return (await this.graph.projectObjectLikeMembers(symbol)) ?? []
    }
    return []
  }

  private graphProjectObjectLikeMembers(symbol: TastySymbol): ReturnType<typeof projectObjectLikeMembers> {
    return projectObjectLikeMembers(this, symbol)
  }

  private async graphCollectUserOwnedReferences(symbol: TastySymbol): Promise<TastySymbolRef[]> {
    const refs = collectUserOwnedReferencesFromSymbol(symbol.getRaw())
    const userRefs = refs
      .filter((ref) => ref.library === 'user')
      .map((ref) => this.createSymbolRef(ref))
    return uniqueById(userRefs, (ref) => ref.getId())
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
        .then((manifestSpecifier) => this.importer(manifestSpecifier))
        .then((moduleValue) => {
          const manifest = extractManifest(moduleValue)
          this.manifest = manifest
          return manifest
        })
        .catch((error: unknown) => {
          this.manifestPromise = undefined
          this.manifest = undefined
          throw wrapRuntimeError(
            `Failed to load Tasty manifest from "${this.manifestPath}".`,
            error,
          )
        })
    }

    return this.manifestPromise
  }

  getManifest(): RawTastyManifest | undefined {
    return this.manifest
  }

  getWarnings(): string[] {
    return [...(this.manifest?.warnings ?? []), ...this.runtimeWarnings]
  }

  /** True when `id` is a chunk-backed symbol in the loaded manifest (not e.g. an unresolved utility name). */
  hasManifestSymbol(id: string): boolean {
    return this.manifest?.symbolsById[id] != null
  }

  async loadSymbolById(id: string): Promise<TastySymbol> {
    const cached = this.symbolCache.get(id)
    if (cached) return cached

    const manifest = await this.loadManifest()
    const entry = manifest.symbolsById[id]
    if (!entry) {
      throw new Error(`Symbol id not found in manifest: ${id}`)
    }

    const raw = await this.loadRawSymbol(entry)
    const created = new TastySymbolImpl(this, entry, raw)
    this.symbolCache.set(id, created)
    return created
  }

  async loadSymbolByName(name: string): Promise<TastySymbol> {
    const symbol = await this.findSymbolByName(name)
    if (!symbol) {
      throw new Error(`Symbol not found: ${name}`)
    }
    return symbol
  }

  async findSymbolByName(name: string): Promise<TastySymbol | undefined> {
    const matches = await this.findSymbolsByName(name)
    if (matches.length === 0) return undefined
    if (matches.length > 1) {
      const preferred = this.resolvePreferredBareNameMatch(name, matches)
      if (!preferred) {
        throw createAmbiguousSymbolNameError(name, matches)
      }
      return this.loadSymbolById(preferred.id)
    }
    return this.loadSymbolById(matches[0]!.id)
  }

  async findSymbolsByName(name: string): Promise<TastySymbolSearchResult[]> {
    const manifest = await this.loadManifest()
    const ids = manifest.symbolsByName[name] ?? []
    return ids
      .map((id) => manifest.symbolsById[id])
      .filter((entry): entry is RawTastySymbolIndexEntry => entry != null)
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        kind: entry.kind,
        chunk: entry.chunk,
        library: entry.library,
      }))
  }

  async loadSymbolByScopedName(library: string, name: string): Promise<TastySymbol> {
    const symbol = await this.findSymbolByScopedName(library, name)
    if (!symbol) {
      throw new Error(`Symbol not found for library "${library}": ${name}`)
    }
    return symbol
  }

  async findSymbolByScopedName(library: string, name: string): Promise<TastySymbol | undefined> {
    const matches = (await this.findSymbolsByName(name)).filter((entry) => entry.library === library)
    if (matches.length === 0) return undefined
    if (matches.length > 1) {
      throw new Error(
        `Ambiguous symbol name "${name}" within library "${library}". Matches: ${matches
          .map((entry) => `${entry.id} (${entry.library})`)
          .join(', ')}`,
      )
    }
    return this.loadSymbolById(matches[0]!.id)
  }

  private resolvePreferredBareNameMatch(
    name: string,
    matches: TastySymbolSearchResult[],
  ): TastySymbolSearchResult | undefined {
    if (matches.some((entry) => entry.library === 'user')) {
      return undefined
    }

    const distinctLibraries = [...new Set(matches.map((entry) => entry.library))]
    if (distinctLibraries.length <= 1) {
      return undefined
    }

    let preferred = matches[0]
    for (const library of PREFERRED_EXTERNAL_BARE_NAME_LIBRARIES) {
      const libraryMatches = matches.filter((entry) => entry.library === library)
      if (libraryMatches.length === 1) {
        preferred = libraryMatches[0]
        break
      }
      if (libraryMatches.length > 1) {
        return undefined
      }
    }

    this.runtimeWarnings.add(
      `Ambiguous symbol name "${name}" matched multiple external libraries. Using ${preferred.id} (${preferred.library}); other matches: ${matches
        .filter((entry) => entry.id !== preferred.id)
        .map((entry) => `${entry.id} (${entry.library})`)
        .join(', ')}. Use a scoped lookup to disambiguate.`,
    )
    return preferred
  }

  async prefetchChunk(path: string): Promise<void> {
    await this.loadChunk(path)
  }

  async prefetchSymbolById(id: string): Promise<void> {
    await this.loadSymbolById(id)
  }

  async prefetchSymbolByName(name: string): Promise<void> {
    await this.loadSymbolByName(name)
  }

  async searchSymbols(query: string): Promise<TastySymbolSearchResult[]> {
    const manifest = await this.loadManifest()
    const normalized = query.trim().toLowerCase()

    return Object.values(manifest.symbolsById)
      .filter((entry) => entry.name.toLowerCase().includes(normalized))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        kind: entry.kind,
        chunk: entry.chunk,
        library: entry.library,
      }))
  }

  isSymbolLoaded(id: string): boolean {
    return this.rawSymbolsById.has(id)
  }

  getLoadedSymbol(id: string): TastySymbol | undefined {
    return this.symbolCache.get(id)
  }

  getManifestEntry(id: string): RawTastySymbolIndexEntry | undefined {
    return this.manifest?.symbolsById[id]
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

  private async loadRawSymbol(entry: RawTastySymbolIndexEntry): Promise<TastySymbolModel> {
    const cached = this.rawSymbolsById.get(entry.id)
    if (cached) return cached

    const moduleValue = await this.loadChunk(entry.chunk)
    const symbol = extractChunkSymbol(moduleValue, entry.id)
    this.rawSymbolsById.set(entry.id, symbol)
    return symbol
  }

  private async loadChunk(relativeChunkPath: string): Promise<ModuleNamespace> {
    const resolvedChunkPath = this.manifestPath
      ? await resolveArtifactPath(this.manifestPath, relativeChunkPath)
      : relativeChunkPath
    let cached = this.chunkCache.get(resolvedChunkPath)
    if (!cached) {
      cached = this.importer(resolvedChunkPath)
        .then((moduleValue) => normalizeModuleNamespace(moduleValue))
        .catch((error: unknown) => {
          this.chunkCache.delete(resolvedChunkPath)
          throw wrapRuntimeError(
            `Failed to load Tasty chunk "${relativeChunkPath}" from "${resolvedChunkPath}".`,
            error,
          )
        })
      this.chunkCache.set(resolvedChunkPath, cached)
    }
    return cached
  }
}

export function createTastyApi(options: { manifestPath: string; importer?: ArtifactImporter }): TastyApi {
  return new TastyApiRuntime({
    manifestPath: options.manifestPath,
    importer: options.importer ?? defaultArtifactImporter,
  })
}

export function createTastyApiFromManifest(options: CreateTastyApiFromManifestOptions): TastyApi {
  return new TastyApiRuntime(options)
}

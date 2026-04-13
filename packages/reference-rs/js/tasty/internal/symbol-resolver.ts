import type {
  RawTastyManifest,
  RawTastySymbolIndexEntry,
  TastySymbol,
  TastySymbolSearchResult,
} from '../api-types'
import { TastySymbolImpl } from './wrappers'
import {
  createAmbiguousSymbolNameError,
  extractChunkSymbol,
  type TastySymbolModel,
} from './shared'
import type { TastyApiRuntime } from './api-runtime'
import { ChunkLoader } from './chunk-loader'

interface SymbolResolverOptions {
  api: TastyApiRuntime
  chunkLoader: ChunkLoader
  preferredExternalLibraries: string[]
  runtimeWarnings: Set<string>
  loadManifest: () => Promise<RawTastyManifest>
}

export class SymbolResolver {
  private readonly rawSymbolsById = new Map<string, TastySymbolModel>()
  private readonly symbolCache = new Map<string, TastySymbolImpl>()

  constructor(private readonly options: SymbolResolverOptions) {}

  async loadSymbolById(id: string): Promise<TastySymbol> {
    const cached = this.symbolCache.get(id)
    if (cached) return cached

    const manifest = await this.options.loadManifest()
    const entry = manifest.symbolsById[id]
    if (!entry) {
      throw new Error(`Symbol id not found in manifest: ${id}`)
    }

    const raw = await this.loadRawSymbol(entry)
    const created = new TastySymbolImpl(this.options.api, entry, raw)
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
    const manifest = await this.options.loadManifest()
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

  async prefetchSymbolById(id: string): Promise<void> {
    await this.loadSymbolById(id)
  }

  async prefetchSymbolByName(name: string): Promise<void> {
    await this.loadSymbolByName(name)
  }

  async searchSymbols(query: string): Promise<TastySymbolSearchResult[]> {
    const manifest = await this.options.loadManifest()
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

  getManifestEntry(id: string, manifest?: RawTastyManifest): RawTastySymbolIndexEntry | undefined {
    return manifest?.symbolsById[id]
  }

  private resolvePreferredBareNameMatch(
    name: string,
    matches: TastySymbolSearchResult[],
  ): TastySymbolSearchResult | undefined {
    const userMatches = matches.filter((entry) => entry.library === 'user')
    const hasSingleUserMatch = userMatches.length === 1
    const hasMultipleUserMatches = userMatches.length > 1

    if (hasSingleUserMatch) {
      return userMatches[0]
    }

    if (hasMultipleUserMatches) {
      return undefined
    }

    const distinctLibraries = [...new Set(matches.map((entry) => entry.library))]
    const spansMultipleLibraries = distinctLibraries.length > 1
    if (!spansMultipleLibraries) {
      return undefined
    }

    const hasExternalLibraryPreferences = this.options.preferredExternalLibraries.length > 0
    if (!hasExternalLibraryPreferences) {
      return undefined
    }

    for (const library of this.options.preferredExternalLibraries) {
      const libraryMatches = matches.filter((entry) => entry.library === library)
      const hasSinglePreferredLibraryMatch = libraryMatches.length === 1
      const hasMultiplePreferredLibraryMatches = libraryMatches.length > 1

      if (hasSinglePreferredLibraryMatch) {
        const preferred = libraryMatches[0]
        this.options.runtimeWarnings.add(
          `Ambiguous symbol name "${name}" matched multiple external libraries. Using ${preferred.id} (${preferred.library}); other matches: ${matches
            .filter((entry) => entry.id !== preferred.id)
            .map((entry) => `${entry.id} (${entry.library})`)
            .join(', ')}. Use a scoped lookup to disambiguate.`,
        )
        return preferred
      }

      if (hasMultiplePreferredLibraryMatches) {
        return undefined
      }
    }

    return undefined
  }

  private async loadRawSymbol(entry: RawTastySymbolIndexEntry): Promise<TastySymbolModel> {
    const cached = this.rawSymbolsById.get(entry.id)
    if (cached) return cached

    const moduleValue = await this.options.chunkLoader.loadChunk(entry.chunk)
    const symbol = extractChunkSymbol(moduleValue, entry.id)
    this.rawSymbolsById.set(entry.id, symbol)
    return symbol
  }
}
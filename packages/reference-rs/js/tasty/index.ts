import type {
  TastyFnParam as RawTastyFnParam,
  TastyInterfaceSymbol as RawTastyInterfaceSymbol,
  TastyManifest as RawTastyManifest,
  TastyMember as RawTastyMember,
  TastySymbol as RawTastySymbol,
  TastySymbolIndexEntry as RawTastySymbolIndexEntry,
  TastySymbolRef as RawTastySymbolRef,
  TastyTypeAliasSymbol as RawTastyTypeAliasSymbol,
  TastyTypeParameter as RawTastyTypeParameter,
  TastyTypeRef as RawTastyTypeRef,
  TastyTypeReference as RawTastyTypeReference,
} from './generated'

export type {
  TastyChunkModule as RawTastyChunkModule,
  TastyFnParam as RawTastyFnParam,
  TastyInterfaceSymbol as RawTastyInterfaceSymbol,
  TastyJsDoc as RawTastyJsDoc,
  TastyJsDocTag as RawTastyJsDocTag,
  TastyManifest as RawTastyManifest,
  TastyMappedModifierKind as RawTastyMappedModifierKind,
  TastyMember as RawTastyMember,
  TastyMemberKind as RawTastyMemberKind,
  TastyModule as RawTastyModule,
  TastyStructuredTypeRef as RawTastyStructuredTypeRef,
  TastySymbol as RawTastySymbol,
  TastySymbolIndexEntry as RawTastySymbolIndexEntry,
  TastySymbolKind as RawTastySymbolKind,
  TastySymbolRef as RawTastySymbolRef,
  TastyTemplateLiteralPart as RawTastyTemplateLiteralPart,
  TastyTupleElement as RawTastyTupleElement,
  TastyTypeAliasSymbol as RawTastyTypeAliasSymbol,
  TastyTypeOperatorKind as RawTastyTypeOperatorKind,
  TastyTypeParameter as RawTastyTypeParameter,
  TastyTypeRef as RawTastyTypeRef,
  TastyTypeReference as RawTastyTypeReference,
} from './generated'

type TastySymbolModel = RawTastySymbol
type ModuleNamespace = Record<string, unknown>
type ArtifactImporter = (artifactPath: string) => Promise<unknown>
type TastySymbolKind = 'interface' | 'typeAlias'

export interface CreateTastyApiOptions {
  manifestPath: string
  importer?: ArtifactImporter
}

export interface CreateTastyApiFromManifestOptions {
  manifest: RawTastyManifest
  importer: ArtifactImporter
  manifestPath?: string
}

export interface TastySymbolSearchResult {
  id: string
  name: string
  kind: TastySymbolKind
  chunk: string
  library: string
}

export interface TastyTypeRef {
  getKind(): string
  getRaw(): RawTastyTypeRef
  isRaw(): boolean
  getSummary(): string | undefined
  isLiteral(): boolean
  isUnion(): boolean
  isArray(): boolean
  isReference(): boolean
  getTypeArguments(): TastyTypeRef[]
  getReferencedSymbol(): TastySymbolRef | undefined
  describe(): string
}

export interface TastyMember {
  getName(): string
  isOptional(): boolean
  isReadonly(): boolean
  getKind(): string
  getType(): TastyTypeRef | undefined
  getRaw(): RawTastyMember
}

export interface TastySymbolRef {
  getId(): string
  getName(): string
  getKind(): string | undefined
  getLibrary(): string | undefined
  isLoaded(): boolean
  getIfLoaded(): TastySymbol | undefined
  load(): Promise<TastySymbol>
}

export interface TastySymbol {
  getId(): string
  getName(): string
  getKind(): TastySymbolKind
  getLibrary(): string | undefined
  getRaw(): TastySymbolModel
  getMembers(): TastyMember[]
  getTypeParameters(): RawTastyTypeParameter[]
  getExtends(): TastySymbolRef[]
  getUnderlyingType(): TastyTypeRef | undefined
  loadExtendsSymbols(): Promise<TastySymbol[]>
}

export interface TastyGraphApi {
  resolveReference(ref: TastySymbolRef): Promise<TastySymbol>
  loadImmediateDependencies(symbol: TastySymbol): Promise<TastySymbol[]>
  loadExtendsChain(symbol: TastySymbol): Promise<TastySymbol[]>
  flattenInterfaceMembers(symbol: TastySymbol): Promise<TastyMember[]>
  collectUserOwnedReferences(symbol: TastySymbol): Promise<TastySymbolRef[]>
}

export interface TastyApi {
  ready(): Promise<void>
  loadManifest(): Promise<RawTastyManifest>
  getManifest(): RawTastyManifest | undefined
  getWarnings(): string[]
  loadSymbolById(id: string): Promise<TastySymbol>
  loadSymbolByName(name: string): Promise<TastySymbol>
  findSymbolByName(name: string): Promise<TastySymbol | undefined>
  findSymbolsByName(name: string): Promise<TastySymbolSearchResult[]>
  loadSymbolByScopedName(library: string, name: string): Promise<TastySymbol>
  findSymbolByScopedName(library: string, name: string): Promise<TastySymbol | undefined>
  prefetchChunk(path: string): Promise<void>
  prefetchSymbolById(id: string): Promise<void>
  prefetchSymbolByName(name: string): Promise<void>
  searchSymbols(query: string): Promise<TastySymbolSearchResult[]>
  graph: TastyGraphApi
}

interface CreateTastyApiRuntimeOptions {
  manifestPath: string
  importer: ArtifactImporter
}

export interface TastyRuntimeModule {
  manifest: RawTastyManifest
  manifestUrl: string
  importTastyArtifact(specifier: string): Promise<unknown>
}

export type TastyRuntimeModuleLoader = () => Promise<unknown>

export interface CreateTastyBrowserRuntimeOptions {
  loadRuntimeModule: TastyRuntimeModuleLoader
}

export interface TastyBrowserRuntime {
  ready(): Promise<void>
  loadRuntimeModule(): Promise<TastyRuntimeModule>
  loadApi(): Promise<TastyApi>
  getApi(): TastyApi | undefined
}

const CURRENT_TASTY_MANIFEST_VERSION = '2'

class TastyBrowserRuntimeImpl implements TastyBrowserRuntime {
  private runtimeModulePromise: Promise<TastyRuntimeModule> | undefined
  private runtimeModule: TastyRuntimeModule | undefined
  private apiPromise: Promise<TastyApi> | undefined
  private api: TastyApi | undefined

  constructor(private readonly options: CreateTastyBrowserRuntimeOptions) {}

  async ready(): Promise<void> {
    await this.loadApi()
  }

  getApi(): TastyApi | undefined {
    return this.api
  }

  async loadRuntimeModule(): Promise<TastyRuntimeModule> {
    if (!this.runtimeModulePromise) {
      this.runtimeModulePromise = Promise.resolve()
        .then(() => this.options.loadRuntimeModule())
        .then((moduleValue) => {
          const runtimeModule = extractTastyRuntimeModule(moduleValue)
          this.runtimeModule = runtimeModule
          return runtimeModule
        })
        .catch((error: unknown) => {
          this.runtimeModulePromise = undefined
          this.runtimeModule = undefined
          throw wrapRuntimeError('Failed to load Tasty browser runtime module.', error)
        })
    }

    return this.runtimeModulePromise
  }

  async loadApi(): Promise<TastyApi> {
    if (!this.apiPromise) {
      this.apiPromise = this.loadRuntimeModule()
        .then(async (runtimeModule) => {
          const api = createTastyApiFromManifest({
            manifest: runtimeModule.manifest,
            manifestPath: runtimeModule.manifestUrl,
            importer: runtimeModule.importTastyArtifact,
          })
          await api.ready()
          this.api = api
          return api
        })
        .catch((error: unknown) => {
          this.apiPromise = undefined
          this.api = undefined
          throw error
        })
    }

    return this.apiPromise
  }
}

class TastyApiRuntime implements TastyApi {
  private readonly manifestPath?: string
  private readonly importer: ArtifactImporter
  private manifestPromise: Promise<RawTastyManifest> | undefined
  private manifest: RawTastyManifest | undefined
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
      resolveReference: async (ref) => ref.load(),
      loadImmediateDependencies: async (symbol) => {
        const refs = await this.graph.collectUserOwnedReferences(symbol)
        return Promise.all(refs.map((ref) => ref.load()))
      },
      loadExtendsChain: async (symbol) => {
        const visited = new Set<string>()
        const chain: TastySymbol[] = []

        const visit = async (current: TastySymbol) => {
          for (const ref of current.getExtends()) {
            const id = ref.getId()
            if (visited.has(id)) continue
            visited.add(id)
            const loaded = await ref.load()
            chain.push(loaded)
            await visit(loaded)
          }
        }

        await visit(symbol)
        return chain
      },
      flattenInterfaceMembers: async (symbol) => {
        const inherited = await this.graph.loadExtendsChain(symbol)
        const flattened = inherited.flatMap((item) => item.getMembers())
        flattened.push(...symbol.getMembers())
        return flattened
      },
      collectUserOwnedReferences: async (symbol) => {
        const refs = collectUserOwnedReferencesFromSymbol(symbol.getRaw())
        return uniqueById(
          refs.filter((ref) => ref.library === 'user').map((ref) => this.createSymbolRef(ref)),
          (ref) => ref.getId()
        )
      },
    }
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
            error
          )
        })
    }

    return this.manifestPromise
  }

  getManifest(): RawTastyManifest | undefined {
    return this.manifest
  }

  getWarnings(): string[] {
    return this.manifest?.warnings ?? []
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
      throw createAmbiguousSymbolNameError(name, matches)
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
        `Ambiguous symbol name "${name}" within library "${library}". Matches: ${matches.map(formatSymbolCandidate).join(', ')}`
      )
    }
    return this.loadSymbolById(matches[0]!.id)
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
            error
          )
        })
      this.chunkCache.set(resolvedChunkPath, cached)
    }
    return cached
  }
}

class TastySymbolImpl implements TastySymbol {
  constructor(
    private readonly api: TastyApiRuntime,
    private readonly entry: RawTastySymbolIndexEntry,
    private readonly raw: TastySymbolModel
  ) {}

  getId(): string {
    return this.entry.id
  }

  getName(): string {
    return this.entry.name
  }

  getKind(): TastySymbolKind {
    return this.entry.kind
  }

  getLibrary(): string | undefined {
    return this.entry.library
  }

  getRaw(): TastySymbolModel {
    return this.raw
  }

  getMembers(): TastyMember[] {
    if (!isInterfaceSymbol(this.raw)) return []
    return this.raw.members.map((member) => new TastyMemberImpl(this.api, member))
  }

  getTypeParameters(): RawTastyTypeParameter[] {
    return this.raw.typeParameters ?? []
  }

  getExtends(): TastySymbolRef[] {
    if (!isInterfaceSymbol(this.raw)) return []
    return this.raw.extends.map((ref) => this.api.createSymbolRef(ref))
  }

  getUnderlyingType(): TastyTypeRef | undefined {
    if (!isTypeAliasSymbol(this.raw) || this.raw.definition == null) return undefined
    return this.api.createTypeRef(this.raw.definition)
  }

  async loadExtendsSymbols(): Promise<TastySymbol[]> {
    return Promise.all(this.getExtends().map((ref) => ref.load()))
  }
}

class TastySymbolRefImpl implements TastySymbolRef {
  constructor(
    private readonly api: TastyApiRuntime,
    private readonly raw: RawTastySymbolRef
  ) {}

  getId(): string {
    return this.raw.id
  }

  getName(): string {
    return this.raw.name
  }

  getKind(): string | undefined {
    return this.api.getManifestEntry(this.raw.id)?.kind
  }

  getLibrary(): string | undefined {
    return this.raw.library
  }

  isLoaded(): boolean {
    return this.api.isSymbolLoaded(this.raw.id)
  }

  getIfLoaded(): TastySymbol | undefined {
    return this.api.getLoadedSymbol(this.raw.id)
  }

  async load(): Promise<TastySymbol> {
    return this.api.loadSymbolById(this.raw.id)
  }
}

class TastyMemberImpl implements TastyMember {
  constructor(
    private readonly api: TastyApiRuntime,
    private readonly raw: RawTastyMember
  ) {}

  getName(): string {
    return this.raw.name
  }

  isOptional(): boolean {
    return this.raw.optional
  }

  isReadonly(): boolean {
    return this.raw.readonly
  }

  getKind(): string {
    return this.raw.kind
  }

  getType(): TastyTypeRef | undefined {
    if (this.raw.type == null) return undefined
    return this.api.createTypeRef(this.raw.type)
  }

  getRaw(): RawTastyMember {
    return this.raw
  }
}

class TastyTypeRefImpl implements TastyTypeRef {
  constructor(
    private readonly api: TastyApiRuntime,
    private readonly raw: RawTastyTypeRef
  ) {}

  getKind(): string {
    return isTypeReference(this.raw) ? 'reference' : this.raw.kind
  }

  getRaw(): RawTastyTypeRef {
    return this.raw
  }

  isRaw(): boolean {
    return isRawStructuredTypeRef(this.raw)
  }

  getSummary(): string | undefined {
    if (!isRawStructuredTypeRef(this.raw)) return undefined
    return this.raw.summary
  }

  isLiteral(): boolean {
    return !isTypeReference(this.raw) && this.raw.kind === 'literal'
  }

  isUnion(): boolean {
    return !isTypeReference(this.raw) && this.raw.kind === 'union'
  }

  isArray(): boolean {
    return !isTypeReference(this.raw) && this.raw.kind === 'array'
  }

  isReference(): boolean {
    return isTypeReference(this.raw)
  }

  getTypeArguments(): TastyTypeRef[] {
    if (!isTypeReference(this.raw) || !this.raw.typeArguments) return []
    return this.raw.typeArguments.map((item) => this.api.createTypeRef(item))
  }

  getReferencedSymbol(): TastySymbolRef | undefined {
    if (!isTypeReference(this.raw)) return undefined
    return this.api.createSymbolRef(this.raw)
  }

  describe(): string {
    if (isTypeReference(this.raw)) {
      if (!this.raw.typeArguments?.length) return this.raw.name
      return `${this.raw.name}<${this.raw.typeArguments.map((item) => this.api.createTypeRef(item).describe()).join(', ')}>`
    }

    switch (this.raw.kind) {
      case 'intrinsic':
        return this.raw.name
      case 'literal':
        return JSON.stringify(this.raw.value)
      case 'array':
        return `${this.api.createTypeRef(this.raw.element).describe()}[]`
      case 'union':
        return this.raw.types.map((item) => this.api.createTypeRef(item).describe()).join(' | ')
      case 'intersection':
        return this.raw.types.map((item) => this.api.createTypeRef(item).describe()).join(' & ')
      case 'raw':
        return this.raw.summary
      case 'type_query':
        return `typeof ${this.raw.expression}`
      case 'template_literal':
        return '`template literal`'
      case 'object':
        return '{ ... }'
      case 'tuple':
        return '[tuple]'
      case 'indexed_access':
        return `${this.api.createTypeRef(this.raw.object).describe()}[${this.api.createTypeRef(this.raw.index).describe()}]`
      case 'function':
        return 'function'
      case 'constructor':
        return 'constructor'
      case 'type_operator':
        return `${this.raw.operator} ${this.api.createTypeRef(this.raw.target).describe()}`
      case 'conditional':
        return 'conditional'
      case 'mapped':
        return 'mapped'
      default:
        return 'unknown'
    }
  }
}

export function createTastyApi(options: CreateTastyApiOptions): TastyApi {
  return new TastyApiRuntime({
    manifestPath: options.manifestPath,
    importer: options.importer ?? defaultArtifactImporter,
  })
}

export function createTastyApiFromManifest(options: CreateTastyApiFromManifestOptions): TastyApi {
  return new TastyApiRuntime(options)
}

export function createTastyBrowserRuntime(
  options: CreateTastyBrowserRuntimeOptions
): TastyBrowserRuntime {
  return new TastyBrowserRuntimeImpl(options)
}

async function defaultArtifactImporter(artifactPath: string): Promise<unknown> {
  return import(await resolveArtifactSpecifier(artifactPath))
}

function extractManifest(value: unknown): RawTastyManifest {
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

function extractChunkSymbol(moduleValue: ModuleNamespace, symbolId: string): TastySymbolModel {
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

function normalizeModuleNamespace(value: unknown): ModuleNamespace {
  if (value == null || typeof value !== 'object') {
    throw new Error('Expected imported artifact module to be an object.')
  }
  return value as ModuleNamespace
}

function extractTastyRuntimeModule(value: unknown): TastyRuntimeModule {
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

async function resolveArtifactPath(basePath: string, relativePath: string): Promise<string> {
  if (relativePath.startsWith('./') || relativePath.startsWith('../')) {
    const baseSpecifier = await resolveArtifactSpecifier(basePath)
    try {
      return new URL(relativePath, baseSpecifier).href
    } catch (error: unknown) {
      throw wrapRuntimeError(
        `Could not resolve Tasty artifact path "${relativePath}" relative to "${basePath}".`,
        error
      )
    }
  }
  return relativePath
}

async function resolveArtifactSpecifier(pathOrSpecifier: string): Promise<string> {
  if (isUrlLike(pathOrSpecifier)) {
    return pathOrSpecifier
  }

  const { pathToFileURL } = await import('node:url')
  return pathToFileURL(pathOrSpecifier).href
}

function isUrlLike(value: string): boolean {
  return value.startsWith('file:')
    || value.startsWith('http:')
    || value.startsWith('https:')
    || value.startsWith('data:')
    || value.startsWith('blob:')
}

function isRawTastyManifest(value: unknown): value is RawTastyManifest {
  if (value == null || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.version === 'string'
    && Array.isArray(candidate.warnings)
    && candidate.warnings.every((warning) => typeof warning === 'string')
    && candidate.symbolsByName != null
    && typeof candidate.symbolsByName === 'object'
    && Object.values(candidate.symbolsByName).every((symbolIds) =>
      Array.isArray(symbolIds) && symbolIds.every((symbolId) => typeof symbolId === 'string')
    )
    && candidate.symbolsById != null
    && typeof candidate.symbolsById === 'object'
}

function isTastyRuntimeModule(value: unknown): value is TastyRuntimeModule {
  if (value == null || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return isRawTastyManifest(candidate.manifest)
    && typeof candidate.manifestUrl === 'string'
    && isUrlLike(candidate.manifestUrl)
    && typeof candidate.importTastyArtifact === 'function'
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

function wrapRuntimeError(prefix: string, error: unknown): Error {
  const suffix = error instanceof Error ? error.message : String(error)
  return new Error(`${prefix} ${suffix}`)
}

function createAmbiguousSymbolNameError(
  name: string,
  matches: TastySymbolSearchResult[]
): Error {
  return new Error(
    `Ambiguous symbol name "${name}". Matches: ${matches.map(formatSymbolCandidate).join(', ')}`
  )
}

function formatSymbolCandidate(result: TastySymbolSearchResult): string {
  return `${result.id} (${result.library})`
}

function isInterfaceSymbol(symbol: TastySymbolModel): symbol is RawTastyInterfaceSymbol {
  return 'members' in symbol && 'extends' in symbol && 'types' in symbol
}

function isTypeAliasSymbol(symbol: TastySymbolModel): symbol is RawTastyTypeAliasSymbol {
  return 'definition' in symbol
}

function isTypeReference(typeRef: RawTastyTypeRef): typeRef is RawTastyTypeReference {
  return typeof typeRef === 'object' && typeRef !== null && 'id' in typeRef && 'name' in typeRef && 'library' in typeRef
}

function isRawStructuredTypeRef(typeRef: RawTastyTypeRef): typeRef is Extract<RawTastyTypeRef, { kind: 'raw' }> {
  return !isTypeReference(typeRef) && typeRef.kind === 'raw'
}

function uniqueById<T>(values: T[], getId: (value: T) => string): T[] {
  const seen = new Set<string>()
  return values.filter((value) => {
    const id = getId(value)
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

function collectUserOwnedReferencesFromSymbol(symbol: TastySymbolModel): RawTastySymbolRef[] {
  const refs: RawTastySymbolRef[] = []

  if (isInterfaceSymbol(symbol)) {
    refs.push(...symbol.extends)
    refs.push(...symbol.types)
    for (const member of symbol.members) {
      collectUserOwnedReferencesFromMember(member, refs)
    }
  } else if (symbol.definition) {
    collectUserOwnedReferencesFromTypeRef(symbol.definition, refs)
  }

  for (const param of symbol.typeParameters ?? []) {
    if (param.constraint) collectUserOwnedReferencesFromTypeRef(param.constraint, refs)
    if (param.default) collectUserOwnedReferencesFromTypeRef(param.default, refs)
  }

  return refs
}

function collectUserOwnedReferencesFromMember(member: RawTastyMember, refs: RawTastySymbolRef[]) {
  if (member.type) {
    collectUserOwnedReferencesFromTypeRef(member.type, refs)
  }
}

function collectUserOwnedReferencesFromTypeRef(typeRef: RawTastyTypeRef, refs: RawTastySymbolRef[]) {
  if (isTypeReference(typeRef)) {
    refs.push({
      id: typeRef.id,
      name: typeRef.name,
      library: typeRef.library,
    })
    for (const arg of typeRef.typeArguments ?? []) {
      collectUserOwnedReferencesFromTypeRef(arg, refs)
    }
    return
  }

  switch (typeRef.kind) {
    case 'object':
      for (const member of typeRef.members) {
        collectUserOwnedReferencesFromMember(member, refs)
      }
      break
    case 'union':
    case 'intersection':
      for (const nested of typeRef.types) {
        collectUserOwnedReferencesFromTypeRef(nested, refs)
      }
      break
    case 'array':
      collectUserOwnedReferencesFromTypeRef(typeRef.element, refs)
      break
    case 'tuple':
      for (const element of typeRef.elements) {
        collectUserOwnedReferencesFromTypeRef(element.element, refs)
      }
      break
    case 'indexed_access':
      collectUserOwnedReferencesFromTypeRef(typeRef.object, refs)
      collectUserOwnedReferencesFromTypeRef(typeRef.index, refs)
      break
    case 'function':
      for (const param of typeRef.params) {
        collectUserOwnedReferencesFromFnParam(param, refs)
      }
      collectUserOwnedReferencesFromTypeRef(typeRef.returnType, refs)
      break
    case 'constructor':
      for (const param of typeRef.params) {
        collectUserOwnedReferencesFromFnParam(param, refs)
      }
      for (const typeParameter of typeRef.typeParameters ?? []) {
        if (typeParameter.constraint) collectUserOwnedReferencesFromTypeRef(typeParameter.constraint, refs)
        if (typeParameter.default) collectUserOwnedReferencesFromTypeRef(typeParameter.default, refs)
      }
      collectUserOwnedReferencesFromTypeRef(typeRef.returnType, refs)
      break
    case 'type_operator':
      collectUserOwnedReferencesFromTypeRef(typeRef.target, refs)
      break
    case 'conditional':
      collectUserOwnedReferencesFromTypeRef(typeRef.checkType, refs)
      collectUserOwnedReferencesFromTypeRef(typeRef.extendsType, refs)
      collectUserOwnedReferencesFromTypeRef(typeRef.trueType, refs)
      collectUserOwnedReferencesFromTypeRef(typeRef.falseType, refs)
      break
    case 'mapped':
      collectUserOwnedReferencesFromTypeRef(typeRef.sourceType, refs)
      if (typeRef.nameType) collectUserOwnedReferencesFromTypeRef(typeRef.nameType, refs)
      if (typeRef.valueType) collectUserOwnedReferencesFromTypeRef(typeRef.valueType, refs)
      break
    case 'template_literal':
      for (const part of typeRef.parts) {
        if (part.kind === 'type') {
          collectUserOwnedReferencesFromTypeRef(part.value, refs)
        }
      }
      break
    default:
      break
  }
}

function collectUserOwnedReferencesFromFnParam(param: RawTastyFnParam, refs: RawTastySymbolRef[]) {
  if (param.typeRef) {
    collectUserOwnedReferencesFromTypeRef(param.typeRef, refs)
  }
}

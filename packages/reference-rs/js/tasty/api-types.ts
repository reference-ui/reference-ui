import type {
  TastyFnParam as RawTastyFnParam,
  TastyInterfaceSymbol as RawTastyInterfaceSymbol,
  TastyJsDocTag as RawTastyJsDocTag,
  TastyManifest as RawTastyManifest,
  TastyMember as RawTastyMember,
  TastyMemberKind as RawTastyMemberKind,
  TastyStructuredTypeRef as RawTastyStructuredTypeRef,
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

export type TastySymbolKind = 'interface' | 'typeAlias'
export type TastyTypeKind = RawTastyStructuredTypeRef['kind'] | 'reference'

export interface TastyCallableParameter {
  name: string
  type?: string
  optional?: boolean
  description?: string
}

export interface CreateTastyApiOptions {
  manifestPath: string
  importer?: (artifactPath: string) => Promise<unknown>
}

export interface CreateTastyApiFromManifestOptions {
  manifest: RawTastyManifest
  importer: (artifactPath: string) => Promise<unknown>
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
  getKind(): TastyTypeKind
  getRaw(): RawTastyTypeRef
  isRaw(): boolean
  getSummary(): string | undefined
  getLiteralValue(): string | undefined
  isLiteral(): boolean
  isUnion(): boolean
  isArray(): boolean
  isReference(): boolean
  isCallable(): boolean
  getUnionTypes(): TastyTypeRef[]
  getParameters(): TastyFnParam[]
  getReturnType(): TastyTypeRef | undefined
  getTypeArguments(): TastyTypeRef[]
  getReferencedSymbol(): TastySymbolRef | undefined
  describe(): string
}

export interface TastyFnParam {
  getName(): string | null
  isOptional(): boolean
  getType(): TastyTypeRef | undefined
}

export interface TastyJsDocTag {
  getName(): string
  getValue(): string | undefined
}

export interface TastyMember {
  getId(): string
  getName(): string
  isOptional(): boolean
  isReadonly(): boolean
  getKind(): RawTastyMemberKind
  getType(): TastyTypeRef | undefined
  getDescription(): string | undefined
  getJsDocTags(): TastyJsDocTag[]
  getJsDocTag(name: string): TastyJsDocTag | undefined
  getDefaultValue(): string | undefined
  getParameters(): TastyCallableParameter[]
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
  getDescription(): string | undefined
  getJsDocTags(): TastyJsDocTag[]
  getJsDocTag(name: string): TastyJsDocTag | undefined
  getRaw(): RawTastySymbol
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
  getEffectiveMembers(symbol: TastySymbol): Promise<TastyMember[]>
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


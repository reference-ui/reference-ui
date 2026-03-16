import { pathToFileURL } from 'node:url'

import type {
  BundleFnParam,
  BundleInterfaceSymbol,
  BundleMember,
  BundleModule,
  BundleSymbolRef,
  BundleTypeAliasSymbol,
  BundleTypeParameter,
  BundleTypeRef,
  BundleTypeReference,
} from './generated'
export type {
  BundleFnParam,
  BundleInterfaceSymbol,
  BundleMember,
  BundleMemberKind,
  BundleModule,
  BundleStructuredTypeRef,
  BundleSymbol,
  BundleSymbolRef,
  BundleTemplateLiteralPart,
  BundleTupleElement,
  BundleTypeAliasSymbol,
  BundleTypeParameter,
  BundleTypeRef,
  BundleTypeReference,
} from './generated'

type BundleSymbol = BundleInterfaceSymbol | BundleTypeAliasSymbol
type BundleImporter = (bundlePath: string) => Promise<BundleModule>
type TastySymbolKind = 'interface' | 'typeAlias'

export interface CreateTastyApiOptions {
  bundlePath: string
  importer?: BundleImporter
}

export interface TastySymbolSearchResult {
  id: string
  name: string
  kind: TastySymbolKind
  library: string
  symbol: TastySymbol
}

export interface TastyTypeRef {
  getKind(): string
  getRaw(): BundleTypeRef
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
  getRaw(): BundleMember
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
  getRaw(): BundleSymbol
  getMembers(): TastyMember[]
  getTypeParameters(): BundleTypeParameter[]
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
  loadBundle(): Promise<BundleModule>
  getBundle(): BundleModule | undefined
  loadSymbolById(id: string): Promise<TastySymbol>
  loadSymbolByName(name: string): Promise<TastySymbol>
  findSymbolByName(name: string): Promise<TastySymbol | undefined>
  prefetchSymbolById(id: string): Promise<void>
  prefetchSymbolByName(name: string): Promise<void>
  searchSymbols(query: string): Promise<TastySymbolSearchResult[]>
  graph: TastyGraphApi
}

class TastyApiRuntime implements TastyApi {
  private readonly bundlePath: string
  private readonly importer: BundleImporter
  private bundlePromise: Promise<BundleModule> | undefined
  private bundle: BundleModule | undefined
  private readonly symbolNameToId = new Map<string, string>()
  private readonly rawSymbolsById = new Map<string, BundleSymbol>()
  private readonly symbolCache = new Map<string, TastySymbolImpl>()

  public readonly graph: TastyGraphApi

  constructor(options: CreateTastyApiOptions) {
    this.bundlePath = options.bundlePath
    this.importer = options.importer ?? defaultBundleImporter
    this.graph = {
      resolveReference: async (ref) => ref.load(),
      loadImmediateDependencies: async (symbol) => {
        const refs = await this.graph.collectUserOwnedReferences(symbol)
        return Promise.all(refs.map((ref) => ref.load()))
      },
      loadExtendsChain: async (symbol) => {
        const visited = new Set<string>()
        const ordered: TastySymbol[] = []

        const visit = async (current: TastySymbol) => {
          for (const ref of current.getExtends()) {
            const id = ref.getId()
            if (visited.has(id)) continue
            visited.add(id)
            const loaded = await ref.load()
            ordered.push(loaded)
            await visit(loaded)
          }
        }

        await visit(symbol)
        return ordered
      },
      flattenInterfaceMembers: async (symbol) => {
        const inherited = await this.graph.loadExtendsChain(symbol)
        const members = inherited.flatMap((item) => item.getMembers())
        members.push(...symbol.getMembers())
        return members
      },
      collectUserOwnedReferences: async (symbol) => {
        const refs = collectUserOwnedReferencesFromSymbol(symbol.getRaw())
        return uniqueSymbolRefs(
          refs.map((ref) => this.createSymbolRef(ref)),
          (ref) => ref.getId()
        )
      },
    }
  }

  async ready(): Promise<void> {
    await this.loadBundle()
  }

  async loadBundle(): Promise<BundleModule> {
    if (!this.bundlePromise) {
      this.bundlePromise = this.importer(this.bundlePath).then((bundle) => {
        this.bundle = bundle
        this.indexBundle(bundle)
        return bundle
      })
    }

    return this.bundlePromise
  }

  getBundle(): BundleModule | undefined {
    return this.bundle
  }

  async loadSymbolById(id: string): Promise<TastySymbol> {
    await this.loadBundle()
    return this.getOrCreateSymbol(id)
  }

  async loadSymbolByName(name: string): Promise<TastySymbol> {
    const symbol = await this.findSymbolByName(name)
    if (!symbol) {
      throw new Error(`Symbol not found: ${name}`)
    }
    return symbol
  }

  async findSymbolByName(name: string): Promise<TastySymbol | undefined> {
    await this.loadBundle()
    const id = this.symbolNameToId.get(name)
    if (!id) return undefined
    return this.getOrCreateSymbol(id)
  }

  async prefetchSymbolById(id: string): Promise<void> {
    await this.loadSymbolById(id)
  }

  async prefetchSymbolByName(name: string): Promise<void> {
    await this.loadSymbolByName(name)
  }

  async searchSymbols(query: string): Promise<TastySymbolSearchResult[]> {
    await this.loadBundle()
    const normalized = query.trim().toLowerCase()
    const matches = [...this.rawSymbolsById.entries()]
      .filter(([, symbol]) => symbol.name.toLowerCase().includes(normalized))
      .sort((a, b) => a[1].name.localeCompare(b[1].name))

    return Promise.all(
      matches.map(async ([id, symbol]) => ({
        id,
        name: symbol.name,
        kind: getSymbolKind(symbol),
        library: symbol.library,
        symbol: await this.loadSymbolById(id),
      }))
    )
  }

  isSymbolLoaded(id: string): boolean {
    return this.symbolCache.has(id)
  }

  getLoadedSymbol(id: string): TastySymbol | undefined {
    return this.symbolCache.get(id)
  }

  createSymbolRef(raw: BundleSymbolRef): TastySymbolRef {
    return new TastySymbolRefImpl(this, raw)
  }

  createTypeRef(raw: BundleTypeRef): TastyTypeRef {
    return new TastyTypeRefImpl(this, raw)
  }

  private indexBundle(bundle: BundleModule) {
    this.rawSymbolsById.clear()
    this.symbolNameToId.clear()

    for (const [key, value] of Object.entries(bundle)) {
      if (!isBundleSymbol(value)) continue
      this.rawSymbolsById.set(key, value)
      this.symbolNameToId.set(value.name, key)
    }
  }

  private getOrCreateSymbol(id: string): TastySymbolImpl {
    const cached = this.symbolCache.get(id)
    if (cached) return cached

    const raw = this.rawSymbolsById.get(id)
    if (!raw) {
      throw new Error(`Symbol id not found: ${id}`)
    }

    const created = new TastySymbolImpl(this, raw)
    this.symbolCache.set(id, created)
    return created
  }
}

class TastySymbolImpl implements TastySymbol {
  constructor(
    private readonly api: TastyApiRuntime,
    private readonly raw: BundleSymbol
  ) {}

  getId(): string {
    return this.raw.id
  }

  getName(): string {
    return this.raw.name
  }

  getKind(): TastySymbolKind {
    return getSymbolKind(this.raw)
  }

  getLibrary(): string | undefined {
    return this.raw.library
  }

  getRaw(): BundleSymbol {
    return this.raw
  }

  getMembers(): TastyMember[] {
    if (!isInterfaceSymbol(this.raw)) return []
    return this.raw.members.map((member) => new TastyMemberImpl(this.api, member))
  }

  getTypeParameters(): BundleTypeParameter[] {
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
    private readonly raw: BundleSymbolRef
  ) {}

  getId(): string {
    return this.raw.id
  }

  getName(): string {
    return this.raw.name
  }

  getKind(): string | undefined {
    return undefined
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
    private readonly raw: BundleMember
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

  getRaw(): BundleMember {
    return this.raw
  }
}

class TastyTypeRefImpl implements TastyTypeRef {
  constructor(
    private readonly api: TastyApiRuntime,
    private readonly raw: BundleTypeRef
  ) {}

  getKind(): string {
    return isTypeReference(this.raw) ? 'reference' : this.raw.kind
  }

  getRaw(): BundleTypeRef {
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
  return new TastyApiRuntime(options)
}

async function defaultBundleImporter(bundlePath: string): Promise<BundleModule> {
  return import(pathToFileURL(bundlePath).href) as Promise<BundleModule>
}

function isBundleSymbol(value: unknown): value is BundleSymbol {
  if (value == null || typeof value !== 'object') return false
  return 'id' in value && 'name' in value && 'library' in value
}

function isInterfaceSymbol(symbol: BundleSymbol): symbol is BundleInterfaceSymbol {
  return 'members' in symbol && 'extends' in symbol && 'types' in symbol
}

function isTypeAliasSymbol(symbol: BundleSymbol): symbol is BundleTypeAliasSymbol {
  return 'definition' in symbol
}

function getSymbolKind(symbol: BundleSymbol): TastySymbolKind {
  return isInterfaceSymbol(symbol) ? 'interface' : 'typeAlias'
}

function isTypeReference(typeRef: BundleTypeRef): typeRef is BundleTypeReference {
  return typeof typeRef === 'object' && typeRef !== null && 'id' in typeRef && 'name' in typeRef && 'library' in typeRef
}

function isRawStructuredTypeRef(typeRef: BundleTypeRef): typeRef is Extract<BundleTypeRef, { kind: 'raw' }> {
  return !isTypeReference(typeRef) && typeRef.kind === 'raw'
}

function uniqueSymbolRefs<T>(values: T[], getId: (value: T) => string): T[] {
  const seen = new Set<string>()
  return values.filter((value) => {
    const id = getId(value)
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

function collectUserOwnedReferencesFromSymbol(symbol: BundleSymbol): BundleSymbolRef[] {
  const refs: BundleSymbolRef[] = []

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

  return refs.filter((ref) => ref.library === 'user')
}

function collectUserOwnedReferencesFromMember(member: BundleMember, refs: BundleSymbolRef[]) {
  if (member.type) {
    collectUserOwnedReferencesFromTypeRef(member.type, refs)
  }
}

function collectUserOwnedReferencesFromTypeRef(typeRef: BundleTypeRef, refs: BundleSymbolRef[]) {
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

function collectUserOwnedReferencesFromFnParam(param: BundleFnParam, refs: BundleSymbolRef[]) {
  if (param.typeRef) {
    collectUserOwnedReferencesFromTypeRef(param.typeRef, refs)
  }
}

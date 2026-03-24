import type {
  RawTastyMemberKind,
  RawTastyFnParam,
  RawTastyJsDocTag,
  RawTastyMember,
  RawTastySymbolIndexEntry,
  RawTastySymbolRef,
  RawTastyTypeRef,
  TastyCallableParameter,
  TastyFnParam,
  TastyJsDocTag,
  TastyMember,
  TastySymbol,
  TastySymbolKind,
  TastySymbolRef,
  TastyTypeKind,
  TastyTypeRef,
} from '../api-types'
import { normalizeTastyInlineValue, parseTastyParamTag } from '../jsdoc'
import {
  isInterfaceSymbol,
  isRawStructuredTypeRef,
  isTypeAliasSymbol,
  isTypeReference,
  type TastySymbolModel,
} from './shared'
import type { TastyApiRuntime } from './api-runtime'

export class TastySymbolImpl implements TastySymbol {
  constructor(
    private readonly api: TastyApiRuntime,
    private readonly entry: RawTastySymbolIndexEntry,
    private readonly raw: TastySymbolModel,
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

  getDescription(): string | undefined {
    return this.raw.description
  }

  getJsDocTags(): TastyJsDocTag[] {
    return createJsDocTags(this.raw.jsdoc?.tags)
  }

  getJsDocTag(name: string): TastyJsDocTag | undefined {
    return this.getJsDocTags().find((tag) => tag.getName() === name)
  }

  getRaw(): TastySymbolModel {
    return this.raw
  }

  getMembers(): TastyMember[] {
    if (!isInterfaceSymbol(this.raw)) return []
    return this.raw.members.map((member) => new TastyMemberImpl(this.api, member))
  }

  async getDisplayMembers(): Promise<TastyMember[]> {
    return this.api.graph.getDisplayMembers(this)
  }

  getTypeParameters() {
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
    await this.api.loadManifest()
    const loaded: TastySymbol[] = []
    for (const ref of this.getExtends()) {
      if (!this.api.hasManifestSymbol(ref.getId())) continue
      loaded.push(await ref.load())
    }
    return loaded
  }
}

export class TastySymbolRefImpl implements TastySymbolRef {
  constructor(
    private readonly api: TastyApiRuntime,
    private readonly raw: RawTastySymbolRef,
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

export class TastyMemberImpl implements TastyMember {
  constructor(
    private readonly api: TastyApiRuntime,
    private readonly raw: RawTastyMember,
  ) {}

  getId(): string {
    return `${this.raw.kind}:${this.raw.name}`
  }

  getName(): string {
    return this.raw.name
  }

  isOptional(): boolean {
    return this.raw.optional
  }

  isReadonly(): boolean {
    return this.raw.readonly
  }

  getKind(): RawTastyMemberKind {
    return this.raw.kind
  }

  getType(): TastyTypeRef | undefined {
    if (this.raw.type == null) return undefined
    return this.api.createTypeRef(this.raw.type)
  }

  getDescription(): string | undefined {
    return this.raw.description
  }

  getJsDocTags(): TastyJsDocTag[] {
    return createJsDocTags(this.raw.jsdoc?.tags)
  }

  getJsDocTag(name: string): TastyJsDocTag | undefined {
    return this.getJsDocTags().find((tag) => tag.getName() === name)
  }

  getDefaultValue(): string | undefined {
    return normalizeTastyInlineValue(this.getJsDocTag('default')?.getValue())
  }

  getParameters(): TastyCallableParameter[] {
    const type = this.getType()
    if (!type?.isCallable()) return []

    const descriptions = new Map(
      this.getJsDocTags()
        .filter((tag) => tag.getName() === 'param')
        .map((tag) => parseTastyParamTag(tag.getValue()))
        .filter((entry): entry is [string, string] => entry != null),
    )

    return type.getParameters().map((param, index) => {
      const name = param.getName() ?? `arg${index + 1}`
      return {
        name,
        type: param.getType()?.describe(),
        optional: param.isOptional(),
        description: descriptions.get(name),
      }
    })
  }

  getRaw(): RawTastyMember {
    return this.raw
  }
}

export class TastyFnParamImpl implements TastyFnParam {
  constructor(
    private readonly api: TastyApiRuntime,
    private readonly raw: RawTastyFnParam,
  ) {}

  getName(): string | null {
    return this.raw.name
  }

  isOptional(): boolean {
    return this.raw.optional
  }

  getType(): TastyTypeRef | undefined {
    if (this.raw.typeRef == null) return undefined
    return this.api.createTypeRef(this.raw.typeRef)
  }
}

export class TastyJsDocTagImpl implements TastyJsDocTag {
  constructor(private readonly raw: RawTastyJsDocTag) {}

  getName(): string {
    return this.raw.name
  }

  getValue(): string | undefined {
    return this.raw.value
  }
}

export class TastyTypeRefImpl implements TastyTypeRef {
  constructor(
    private readonly api: TastyApiRuntime,
    private readonly raw: RawTastyTypeRef,
  ) {}

  getKind(): TastyTypeKind {
    return isTypeReference(this.raw) ? 'reference' : this.raw.kind
  }

  getRaw(): RawTastyTypeRef {
    return this.raw
  }

  getResolved(): TastyTypeRef | undefined {
    if (isTypeReference(this.raw)) return undefined
    const resolved = getResolvedRawTypeRef(this.raw)
    return resolved ? this.api.createTypeRef(resolved) : undefined
  }

  isRaw(): boolean {
    return isRawStructuredTypeRef(this.raw)
  }

  getSummary(): string | undefined {
    if (!isRawStructuredTypeRef(this.raw)) return undefined
    return this.raw.summary
  }

  getLiteralValue(): string | undefined {
    if (isTypeReference(this.raw) || this.raw.kind !== 'literal') return undefined
    return this.raw.value
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

  isCallable(): boolean {
    if (isTypeReference(this.raw)) return false
    return this.raw.kind === 'function' || this.raw.kind === 'constructor'
  }

  getUnionTypes(): TastyTypeRef[] {
    if (isTypeReference(this.raw) || this.raw.kind !== 'union') return []
    return this.raw.types.map((item) => this.api.createTypeRef(item))
  }

  getParameters(): TastyFnParam[] {
    if (isTypeReference(this.raw)) return []
    if (this.raw.kind !== 'function' && this.raw.kind !== 'constructor') return []
    return this.raw.params.map((param) => new TastyFnParamImpl(this.api, param))
  }

  getReturnType(): TastyTypeRef | undefined {
    if (isTypeReference(this.raw)) return undefined
    if (this.raw.kind !== 'function' && this.raw.kind !== 'constructor') return undefined
    return this.api.createTypeRef(this.raw.returnType)
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
      return `${this.raw.name}<${this.raw.typeArguments
        .map((item) => this.api.createTypeRef(item).describe())
        .join(', ')}>`
    }

    switch (this.raw.kind) {
      case 'intrinsic':
        return this.raw.name
      case 'literal':
        return formatLiteralValue(this.raw.value)
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
        return `${this.api.createTypeRef(this.raw.object).describe()}[${this.api
          .createTypeRef(this.raw.index)
          .describe()}]`
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

function createJsDocTags(tags: RawTastyJsDocTag[] | undefined): TastyJsDocTag[] {
  return (tags ?? []).map((tag) => new TastyJsDocTagImpl(tag))
}

function getResolvedRawTypeRef(raw: Exclude<RawTastyTypeRef, import('../api-types').RawTastyTypeReference>) {
  switch (raw.kind) {
    case 'indexed_access':
    case 'type_operator':
    case 'type_query':
    case 'conditional':
    case 'template_literal':
      return raw.resolved
    default:
      return undefined
  }
}

function formatLiteralValue(value: string): string {
  const trimmed = value.trim()
  if (trimmed.startsWith("'") || trimmed.startsWith('"') || trimmed.startsWith('`')) {
    return trimmed
  }
  if (/^[+-]?\d+(\.\d+)?$/.test(trimmed) || trimmed === 'true' || trimmed === 'false') {
    return trimmed
  }
  return JSON.stringify(trimmed)
}

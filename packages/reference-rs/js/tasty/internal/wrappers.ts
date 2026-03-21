import type {
  RawTastyFnParam,
  RawTastyJsDocTag,
  RawTastyMember,
  RawTastySymbolIndexEntry,
  RawTastySymbolRef,
  RawTastyTypeRef,
  TastyFnParam,
  TastyJsDocTag,
  TastyMember,
  TastySymbol,
  TastySymbolKind,
  TastySymbolRef,
  TastyTypeRef,
} from '../api-types'
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
    return Promise.all(this.getExtends().map((ref) => ref.load()))
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

  getDescription(): string | undefined {
    return this.raw.description
  }

  getJsDocTags(): TastyJsDocTag[] {
    return createJsDocTags(this.raw.jsdoc?.tags)
  }

  getJsDocTag(name: string): TastyJsDocTag | undefined {
    return this.getJsDocTags().find((tag) => tag.getName() === name)
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

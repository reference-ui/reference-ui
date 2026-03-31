import type {
  RawTastyFnParam,
  RawTastyJsDocTag,
  RawTastyMember,
  RawTastyStructuredTypeRef,
  RawTastySymbolIndexEntry,
  RawTastySymbolRef,
  RawTastyTypeRef,
  RawTastyTypeReference,
  TastyCallableParameter,
  RawTastyMemberKind,
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

  getDescription(): string | undefined {
    return this.raw.description
  }

  getJsDocTags(): TastyJsDocTag[] {
    return createJsDocTags(this.raw.jsdoc?.tags)
  }

  getJsDocTag(name: string): TastyJsDocTag | undefined {
    return this.getJsDocTags().find(tag => tag.getName() === name)
  }

  getRaw(): TastySymbolModel {
    return this.raw
  }

  getMembers(): TastyMember[] {
    return membersForSymbol(this.raw).map(member => new TastyMemberImpl(this.api, member))
  }

  async getDisplayMembers(): Promise<TastyMember[]> {
    return this.api.graph.getDisplayMembers(this)
  }

  getTypeParameters() {
    return this.raw.typeParameters ?? []
  }

  getExtends(): TastySymbolRef[] {
    if (!isInterfaceSymbol(this.raw)) return []
    return this.raw.extends.map(ref => this.api.createSymbolRef(ref))
  }

  getUnderlyingType(): TastyTypeRef | undefined {
    if (isTypeAliasSymbol(this.raw)) {
      if (this.raw.definition == null) return undefined
      return this.api.createTypeRef(this.raw.definition)
    }
    if (isInterfaceSymbol(this.raw)) {
      return this.api.createTypeRef({ kind: 'object', members: this.raw.members })
    }
    return undefined
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

export class TastyMemberImpl implements TastyMember {
  constructor(
    private readonly api: TastyApiRuntime,
    private readonly raw: RawTastyMember
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
    return this.getJsDocTags().find(tag => tag.getName() === name)
  }

  getDefaultValue(): string | undefined {
    return normalizeTastyInlineValue(this.getJsDocTag('default')?.getValue())
  }

  getParameters(): TastyCallableParameter[] {
    const type = this.getType()
    if (!type?.isCallable()) return []

    const descriptions = new Map(
      this.getJsDocTags()
        .filter(tag => tag.getName() === 'param')
        .map(tag => parseTastyParamTag(tag.getValue()))
        .filter((entry): entry is [string, string] => entry != null)
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
    private readonly raw: RawTastyFnParam
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
    private readonly raw: RawTastyTypeRef
  ) {}

  getKind(): TastyTypeKind {
    const s = structured(this.raw)
    return s ? s.kind : 'reference'
  }

  getRaw(): RawTastyTypeRef {
    return this.raw
  }

  getResolved(): TastyTypeRef | undefined {
    if (isTypeReference(this.raw)) return undefined
    const resolved = resolvedFieldFromStructured(this.raw)
    return resolved ? this.api.createTypeRef(resolved) : undefined
  }

  isRaw(): boolean {
    return isRawStructuredTypeRef(this.raw)
  }

  getSummary(): string | undefined {
    const s = structured(this.raw)
    return s?.kind === 'raw' ? s.summary : undefined
  }

  getLiteralValue(): string | undefined {
    const s = structured(this.raw)
    return s?.kind === 'literal' ? s.value : undefined
  }

  isLiteral(): boolean {
    return structured(this.raw)?.kind === 'literal'
  }

  isUnion(): boolean {
    return structured(this.raw)?.kind === 'union'
  }

  isArray(): boolean {
    return structured(this.raw)?.kind === 'array'
  }

  isReference(): boolean {
    return isTypeReference(this.raw)
  }

  isCallable(): boolean {
    const k = structured(this.raw)?.kind
    return k === 'function' || k === 'constructor'
  }

  getUnionTypes(): TastyTypeRef[] {
    const s = structured(this.raw)
    if (s?.kind !== 'union') return []
    return s.types.map(item => this.api.createTypeRef(item))
  }

  getParameters(): TastyFnParam[] {
    const s = structured(this.raw)
    if (s?.kind !== 'function' && s?.kind !== 'constructor') return []
    return s.params.map(param => new TastyFnParamImpl(this.api, param))
  }

  getReturnType(): TastyTypeRef | undefined {
    const s = structured(this.raw)
    if (s?.kind !== 'function' && s?.kind !== 'constructor') return undefined
    return this.api.createTypeRef(s.returnType)
  }

  getTypeArguments(): TastyTypeRef[] {
    if (!isTypeReference(this.raw) || !this.raw.typeArguments) return []
    return this.raw.typeArguments.map(item => this.api.createTypeRef(item))
  }

  getReferencedSymbol(): TastySymbolRef | undefined {
    if (!isTypeReference(this.raw)) return undefined
    return this.api.createSymbolRef(this.raw)
  }

  describe(): string {
    if (isTypeReference(this.raw)) {
      return describeTypeReference(this.api, this.raw)
    }
    return describeStructured(this.api, this.raw)
  }
}

function membersForSymbol(raw: TastySymbolModel): RawTastyMember[] {
  if (isInterfaceSymbol(raw)) return raw.members
  if (
    isTypeAliasSymbol(raw) &&
    raw.definition != null &&
    !isTypeReference(raw.definition) &&
    raw.definition.kind === 'object'
  ) {
    return raw.definition.members
  }
  return []
}

function structured(raw: RawTastyTypeRef): RawTastyStructuredTypeRef | undefined {
  return isTypeReference(raw) ? undefined : raw
}

function resolvedFieldFromStructured(
  raw: RawTastyStructuredTypeRef
): RawTastyTypeRef | undefined {
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

function describeTypeReference(api: TastyApiRuntime, raw: RawTastyTypeReference): string {
  if (!raw.typeArguments?.length) return raw.name
  const args = raw.typeArguments
    .map(item => api.createTypeRef(item).describe())
    .join(', ')
  return `${raw.name}<${args}>`
}

function describeStructured(
  api: TastyApiRuntime,
  raw: RawTastyStructuredTypeRef
): string {
  switch (raw.kind) {
    case 'intrinsic':
      return raw.name
    case 'literal':
      return formatLiteralValue(raw.value)
    case 'array':
      return `${api.createTypeRef(raw.element).describe()}[]`
    case 'union':
      return raw.types.map(item => api.createTypeRef(item).describe()).join(' | ')
    case 'intersection':
      return raw.types.map(item => api.createTypeRef(item).describe()).join(' & ')
    case 'raw':
      return raw.summary
    case 'type_query':
      return `typeof ${raw.expression}`
    case 'template_literal':
      return '`template literal`'
    case 'object':
      return describeObjectMembers(api, raw)
    case 'tuple':
      return '[tuple]'
    case 'indexed_access':
      return `${api.createTypeRef(raw.object).describe()}[${api.createTypeRef(raw.index).describe()}]`
    case 'function':
      return 'function'
    case 'constructor':
      return 'constructor'
    case 'type_operator':
      return `${raw.operator} ${api.createTypeRef(raw.target).describe()}`
    case 'conditional':
      return 'conditional'
    case 'mapped':
      return 'mapped'
    default:
      return 'unknown'
  }
}

function createJsDocTags(tags: RawTastyJsDocTag[] | undefined): TastyJsDocTag[] {
  return (tags ?? []).map(tag => new TastyJsDocTagImpl(tag))
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

function describeObjectMembers(
  api: TastyApiRuntime,
  raw: RawTastyStructuredTypeRef & { kind: 'object' }
): string {
  if (!raw.members || raw.members.length === 0) {
    return '{}'
  }

  // For simple generic objects (like { value: T }), keep the old behavior
  if (shouldUseSimpleDescription(raw)) {
    return '{ ... }'
  }

  const memberDescriptions = raw.members.map(member => {
    const optional = member.optional ? '?' : ''
    const readonly = member.readonly ? 'readonly ' : ''
    const typeDescription = member.type
      ? api.createTypeRef(member.type).describe()
      : 'unknown'
    return `${readonly}${member.name}${optional}: ${typeDescription}`
  })

  // For very large objects, truncate to avoid overly long descriptions
  if (memberDescriptions.length > 10) {
    const shown = memberDescriptions.slice(0, 8).join('; ')
    const remaining = memberDescriptions.length - 8
    return `{ ${shown}; ... +${remaining} more }`
  }

  return `{ ${memberDescriptions.join('; ')} }`
}

function shouldUseSimpleDescription(
  raw: RawTastyStructuredTypeRef & { kind: 'object' }
): boolean {
  // Use simple description for objects with:
  // 1. Just 1-2 members with simple type parameter names
  // 2. No complex nested structures
  if (raw.members.length <= 2) {
    return raw.members.every(member => {
      if (!member.type) return false

      // Check if the type is a simple type parameter reference
      if (isTypeReference(member.type)) {
        const typeName = member.type.name
        // Simple single-letter type parameters like T, U, V, K
        return /^[A-Z]$/.test(typeName) && !member.type.typeArguments
      }

      // Check for simple intrinsic types like string, number, boolean
      if (member.type.kind === 'intrinsic') {
        return ['string', 'number', 'boolean', 'unknown'].includes(member.type.name)
      }

      return false
    })
  }

  return false
}

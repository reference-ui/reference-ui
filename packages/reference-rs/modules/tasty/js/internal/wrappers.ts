/**
 * Public API wrappers over raw tasty symbols, members, and docs.
 * Wraps symbols, symbol references, members and JSDoc tags for the public API. Type references
 * live in the type-wrappers module and are re-exported here so importers keep one path.
 */
import type {
  RawTastyJsDocTag,
  RawTastyMember,
  RawTastyMemberKind,
  RawTastySymbolIndexEntry,
  RawTastySymbolRef,
  TastyCallableParameter,
  TastyJsDocTag,
  TastyMember,
  TastySymbol,
  TastySymbolKind,
  TastySymbolRef,
  TastyTypeRef,
} from '../api-types.js'
import { normalizeTastyInlineValue, parseTastyParamTag } from '../jsdoc.js'
import {
  isInterfaceSymbol,
  isTypeAliasSymbol,
  isTypeReference,
  type TastySymbolModel,
} from './shared.js'
import type { TastyApiRuntime } from './api-runtime.js'

export { TastyFnParamImpl, TastyTypeRefImpl } from './type-wrappers.js'

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

export class TastyJsDocTagImpl implements TastyJsDocTag {
  constructor(private readonly raw: RawTastyJsDocTag) {}

  getName(): string {
    return this.raw.name
  }

  getValue(): string | undefined {
    return this.raw.value
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

function createJsDocTags(tags: RawTastyJsDocTag[] | undefined): TastyJsDocTag[] {
  return (tags ?? []).map(tag => new TastyJsDocTagImpl(tag))
}

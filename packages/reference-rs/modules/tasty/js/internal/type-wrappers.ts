/**
 * Typescript source file for Reference UI module.
 * Wraps a raw type reference or structured type for the public TastyTypeRef API. Parameters of
 * callable types are wrapped too, and descriptions are delegated to the type-description module.
 */
import type {
  RawTastyFnParam,
  RawTastyStructuredTypeRef,
  RawTastyTypeRef,
  TastyFnParam,
  TastySymbolRef,
  TastyTypeKind,
  TastyTypeRef,
} from '../api-types.js'
import type { TastyApiRuntime } from './api-runtime.js'
import { isRawStructuredTypeRef, isTypeReference } from './shared.js'
import { describeStructured, describeTypeReference } from './type-description.js'

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

import {
  formatTastyCallableSignature,
  getTastyResolvedType,
  getTastyTypeInlineVariants,
  normalizeTastyInlineValue,
} from '@reference-ui/rust/tasty'
import type { RawTastyTypeRef, RawTastyTypeReference, TastyMember, TastySymbol, TastyTypeRef } from '@reference-ui/rust/tasty'
import type {
  ReferenceMemberSummary,
  ReferenceMemberTypeSummary,
  ReferenceParamDoc,
  ReferenceValueOption,
} from '../types'
import { createReferenceType, formatReferenceType } from './type'

export function createReferenceMemberSummary(
  member: TastyMember,
  type: ReturnType<TastyMember['getType']>,
  typeLabel: string,
  symbolLookup: Map<string, TastySymbol>,
): ReferenceMemberSummary {
  return {
    memberTypeSummary: createReferenceMemberTypeSummary(member, type, typeLabel, symbolLookup),
    description: member.getDescription(),
    paramDocs: createReferenceParams(member, type),
  }
}

/**
 * Inline unions of literals (and similar enumerable branches) are summarized with value chips;
 * the type line then shows "Union" instead of repeating every literal. Named types (`x: MyAlias`)
 * stay as-is because their declared type is a reference, not a top-level union node.
 */
export function shouldUseUnionDisplayTypeLabel(
  member: TastyMember,
  type: TastyTypeRef | undefined,
  symbolLookup: Map<string, TastySymbol>,
): boolean {
  if (!type?.isUnion()) return false
  const resolvedType = resolveReferenceSummaryType(type, symbolLookup) ?? type
  const valueOptions = createReferenceValueOptions(member, resolvedType)
  return shouldUseReferenceValueSet(resolvedType, valueOptions)
}

function createReferenceMemberTypeSummary(
  member: TastyMember,
  type: TastyTypeRef | undefined,
  typeLabel: string,
  symbolLookup: Map<string, TastySymbol>,
): ReferenceMemberTypeSummary | undefined {
  if (!type) return undefined

  if (type.isCallable()) {
    return {
      kind: 'callSignature',
      text: formatTastyCallableSignature(type),
    }
  }

  const resolvedType = resolveReferenceSummaryType(type, symbolLookup) ?? type
  const valueOptions = createReferenceValueOptions(member, resolvedType)
  if (shouldUseReferenceValueSet(resolvedType, valueOptions)) {
    return {
      kind: 'valueSet',
      options: valueOptions,
    }
  }

  const resolvedReferenceType = createReferenceType(resolvedType)
  const expression = resolvedReferenceType ? formatReferenceType(resolvedReferenceType) : resolvedType.describe()
  if (!expression) return undefined
  if (expression === typeLabel && resolvedType === type) return undefined

  if (isReferenceTypeExpression(type)) {
    return {
      kind: 'typeExpression',
      text: expression,
    }
  }

  if (isOpaqueReferenceSummary(expression)) {
    return {
      kind: 'opaqueType',
      text: expression,
    }
  }

  return undefined
}

function createReferenceValueOptions(member: TastyMember, type: TastyTypeRef): ReferenceValueOption[] {
  const optionsByKey = new Map<string, ReferenceValueOption>()
  const defaultValue = member.getDefaultValue()
  const variants = getTastyTypeInlineVariants(type)

  if (defaultValue) {
    const key = normalizeReferenceValueOption(defaultValue)
    optionsByKey.set(key, { label: defaultValue, isDefault: true })
  }

  for (const variant of variants) {
    const key = normalizeReferenceValueOption(variant)
    if (optionsByKey.has(key)) continue
    optionsByKey.set(key, { label: variant })
  }

  return [...optionsByKey.values()]
}

function createReferenceParams(
  member: TastyMember,
  type: TastyTypeRef | undefined,
): ReferenceParamDoc[] {
  const params = member.getParameters()
  if (!type?.isCallable()) return params

  return type.getParameters().map((param, index) => {
    const fallback = params[index]
    return {
      name: fallback?.name ?? param.getName() ?? `arg${index + 1}`,
      type: fallback?.type ?? param.getType()?.describe(),
      typeRef: createReferenceType(param.getType()),
      optional: fallback?.optional ?? param.isOptional(),
      description: fallback?.description,
    }
  })
}

function normalizeReferenceValueOption(value: string): string {
  return normalizeTastyInlineValue(value) ?? value
}

function shouldUseReferenceValueSet(type: TastyTypeRef, options: ReferenceValueOption[]): boolean {
  if (options.length === 0) return false
  if (type.isLiteral()) return true
  if (type.isUnion()) {
    return type.getUnionTypes().every(isReferenceInlineValueBranch)
  }
  return options.some((option) => option.isDefault)
}

function isReferenceInlineValueBranch(type: TastyTypeRef): boolean {
  if (type.isLiteral()) return true
  if (type.isUnion()) return type.getUnionTypes().every(isReferenceInlineValueBranch)

  switch (type.getKind()) {
    case 'intrinsic':
      return type.describe() === 'boolean'
    case 'function':
    case 'constructor':
    case 'raw':
      return true
    default:
      return false
  }
}

function isReferenceTypeExpression(type: TastyTypeRef): boolean {
  switch (type.getKind()) {
    case 'array':
    case 'indexed_access':
    case 'type_query':
      return true
    default:
      return false
  }
}

function isOpaqueReferenceSummary(expression: string): boolean {
  return expression !== 'unknown'
}

function resolveReferenceSummaryType(
  type: TastyTypeRef,
  symbolLookup: Map<string, TastySymbol>,
  visited = new Set<string>(),
): TastyTypeRef | undefined {
  const resolvedType = getTastyResolvedType(type)
  if (resolvedType && resolvedType !== type) {
    return resolveReferenceSummaryType(resolvedType, symbolLookup, visited) ?? resolvedType
  }

  if (type.getKind() === 'indexed_access') {
    const resolvedIndexedAccessType = resolveIndexedAccessType(type, symbolLookup, visited)
    if (resolvedIndexedAccessType) {
      return resolveReferenceSummaryType(resolvedIndexedAccessType, symbolLookup, visited)
    }
  }

  if (type.getKind() !== 'reference') {
    return type
  }

  const symbolId = type.getReferencedSymbol()?.getId()
  if (!symbolId || visited.has(symbolId)) return type

  const symbol = symbolLookup.get(symbolId)
  if (!symbol || symbol.getKind() !== 'typeAlias') return type

  const underlyingType = symbol.getUnderlyingType()
  if (!underlyingType) return type

  visited.add(symbolId)
  return resolveReferenceSummaryType(underlyingType, symbolLookup, visited) ?? underlyingType
}

function resolveIndexedAccessType(
  type: TastyTypeRef,
  symbolLookup: Map<string, TastySymbol>,
  visited: Set<string>,
): TastyTypeRef | undefined {
  const raw = type.getRaw()
  if (!isRawIndexedAccessType(raw)) return undefined
  if (!isRawTypeReference(raw.object)) return undefined
  if (!isRawLiteralType(raw.index)) return undefined

  const symbol = symbolLookup.get(raw.object.id)
  if (!symbol || symbol.getKind() !== 'interface') return undefined
  if (visited.has(symbol.getId())) return undefined

  const memberName = normalizeTastyInlineValue(raw.index.value)
  if (!memberName) return undefined

  visited.add(symbol.getId())
  const member = symbol.getMembers().find((candidate) => candidate.getName() === memberName)
  return member?.getType()
}

function isRawIndexedAccessType(
  raw: RawTastyTypeRef,
): raw is Extract<RawTastyTypeRef, { kind: 'indexed_access' }> {
  return 'kind' in raw && raw.kind === 'indexed_access'
}

function isRawLiteralType(raw: RawTastyTypeRef): raw is Extract<RawTastyTypeRef, { kind: 'literal' }> {
  return 'kind' in raw && raw.kind === 'literal'
}

function isRawTypeReference(raw: RawTastyTypeRef): raw is RawTastyTypeReference {
  return !('kind' in raw)
}

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
} from '../browser/types'
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
 * Inline unions summarized as value chips use a short type line: `Union`, or `Union | string`,
 * `Union | object`, etc. when the union also widens to intrinsic `string` / `object`. Named types
 * (`x: MyAlias`) stay as-is (declared type is a reference, not a top-level union).
 */
export function getInlineUnionValueSetTypeLabel(
  member: TastyMember,
  type: TastyTypeRef | undefined,
  symbolLookup: Map<string, TastySymbol>,
): string | null {
  if (!type?.isUnion()) return null
  const resolvedType = resolveReferenceSummaryType(type, symbolLookup) ?? type
  const valueOptions = createReferenceValueOptions(member, resolvedType)
  if (!shouldUseReferenceValueSet(resolvedType, valueOptions)) return null
  return formatUnionValueSetDisplayLabel(resolvedType)
}

function formatUnionValueSetDisplayLabel(type: TastyTypeRef): string {
  const widenings = collectUnionIntrinsicWidenings(type)
  if (widenings.length === 0) return 'Union'
  return `Union | ${widenings.join(' | ')}`
}

/** Presents widenings in a stable order (not source order). */
function collectUnionIntrinsicWidenings(type: TastyTypeRef): string[] {
  if (!type.isUnion()) return []
  const present = new Set<string>()
  for (const branch of type.getUnionTypes()) {
    if (isIntrinsicStringWidener(branch)) present.add('string')
    if (isIntrinsicObjectWidener(branch)) present.add('object')
  }
  const order = ['string', 'object'] as const
  return order.filter((name) => present.has(name))
}

function createReferenceMemberTypeSummary(
  member: TastyMember,
  type: TastyTypeRef | undefined,
  typeLabel: string,
  symbolLookup: Map<string, TastySymbol>,
): ReferenceMemberTypeSummary | undefined {
  if (!type) return undefined

  const callableSummary = createCallableMemberTypeSummary(type)
  if (callableSummary) return callableSummary

  const resolvedType = resolveReferenceSummaryType(type, symbolLookup) ?? type
  const valueSetSummary = createValueSetMemberTypeSummary(member, resolvedType)
  if (valueSetSummary) return valueSetSummary

  return createExpressionMemberTypeSummary(type, resolvedType, typeLabel)
}

function createCallableMemberTypeSummary(type: TastyTypeRef): ReferenceMemberTypeSummary | undefined {
  if (!type.isCallable()) return undefined
  return {
    kind: 'callSignature',
    text: formatTastyCallableSignature(type),
  }
}

function createValueSetMemberTypeSummary(
  member: TastyMember,
  resolvedType: TastyTypeRef,
): ReferenceMemberTypeSummary | undefined {
  const valueOptions = createReferenceValueOptions(member, resolvedType)
  if (!shouldUseReferenceValueSet(resolvedType, valueOptions)) return undefined
  return {
    kind: 'valueSet',
    options: valueOptions,
  }
}

function createExpressionMemberTypeSummary(
  type: TastyTypeRef,
  resolvedType: TastyTypeRef,
  typeLabel: string,
): ReferenceMemberTypeSummary | undefined {
  const resolvedReferenceType = createReferenceType(resolvedType)
  const expression = resolvedReferenceType ? formatReferenceType(resolvedReferenceType) : resolvedType.describe()
  if (!expression) return undefined
  if (expression === typeLabel && resolvedType === type) return undefined
  if (isReferenceTypeExpression(type)) {
    return { kind: 'typeExpression', text: expression }
  }
  if (!isOpaqueReferenceSummary(expression)) return undefined
  return { kind: 'opaqueType', text: expression }
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
    if (shouldOmitUnionIntrinsicWidenerChip(type, variant)) continue
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
    return type.getUnionTypes().every(isReferenceUnionBranchForValueSet)
  }
  return options.some((option) => option.isDefault)
}

/** Literal unions plus intrinsic widen-any (`string`, `object`, …). */
function isReferenceUnionBranchForValueSet(type: TastyTypeRef): boolean {
  if (isReferenceInlineValueBranch(type)) return true
  return isIntrinsicStringWidener(type) || isIntrinsicObjectWidener(type)
}

function isIntrinsicStringWidener(type: TastyTypeRef): boolean {
  return type.getKind() === 'intrinsic' && type.describe() === 'string'
}

function isIntrinsicObjectWidener(type: TastyTypeRef): boolean {
  return type.getKind() === 'intrinsic' && type.describe() === 'object'
}

/** `getTastyTypeInlineVariants` repeats intrinsic widen branches as labels; omit those chips (shown on the type line). */
function shouldOmitUnionIntrinsicWidenerChip(type: TastyTypeRef, variant: string): boolean {
  if (!type.isUnion()) return false
  const branches = type.getUnionTypes()
  if (branches.some(isIntrinsicStringWidener) && variant === 'string') return true
  if (branches.some(isIntrinsicObjectWidener) && variant === 'object') return true
  return false
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
  const nextType = getNextReferenceSummaryType(type, symbolLookup, visited)
  if (!nextType || nextType === type) return type
  return resolveReferenceSummaryType(nextType, symbolLookup, visited) ?? nextType
}

function getNextReferenceSummaryType(
  type: TastyTypeRef,
  symbolLookup: Map<string, TastySymbol>,
  visited: Set<string>,
): TastyTypeRef | undefined {
  const resolvedType = getTastyResolvedType(type)
  if (resolvedType && resolvedType !== type) return resolvedType
  if (type.getKind() === 'indexed_access') {
    return resolveIndexedAccessType(type, symbolLookup, visited) ?? type
  }
  if (type.getKind() !== 'reference') return type
  return resolveReferenceAliasType(type, symbolLookup, visited) ?? type
}

function resolveReferenceAliasType(
  type: TastyTypeRef,
  symbolLookup: Map<string, TastySymbol>,
  visited: Set<string>,
): TastyTypeRef | undefined {
  const symbolId = type.getReferencedSymbol()?.getId()
  if (!symbolId || visited.has(symbolId)) return undefined

  const symbol = symbolLookup.get(symbolId)
  if (!symbol || symbol.getKind() !== 'typeAlias') return undefined

  const underlyingType = symbol.getUnderlyingType()
  if (!underlyingType) return undefined

  visited.add(symbolId)
  return underlyingType
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

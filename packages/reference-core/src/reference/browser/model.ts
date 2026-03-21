import {
  formatTastyCallableSignature,
  getTastyTypeInlineVariants,
  getTastyMemberSemanticKind,
  normalizeTastyInlineValue,
} from '@reference-ui/rust/tasty'
import type { TastyMember, TastySemanticKind, TastySymbol, TastyTypeRef } from '@reference-ui/rust/tasty'
import type {
  ReferenceDocument,
  ReferenceMemberDocument,
  ReferenceMemberSummary,
  ReferenceMemberTypeSummary,
  ReferenceParamDoc,
  ReferenceValueOption,
} from './types'

const REFERENCE_TYPE_LABEL_ALIASES = new Map<TastySemanticKind, string>([
  ['indexed_access', 'indexed'],
  ['type_query', 'typeof'],
  ['template_literal', 'template literal'],
])

export function createReferenceDocument(
  symbol: TastySymbol,
  members: TastyMember[],
): ReferenceDocument {
  return {
    name: symbol.getName(),
    kind: symbol.getKind(),
    kindLabel: symbol.getKind() === 'typeAlias' ? 'Type alias' : 'Interface',
    description: symbol.getDescription(),
    typeParameters: symbol.getTypeParameters().map(param => param.name),
    extendsNames: symbol.getExtends().map(ref => ref.getName()),
    definition: symbol.getUnderlyingType()?.describe() ?? null,
    members: members.map(createReferenceMemberDocument),
  }
}

function createReferenceMemberDocument(member: TastyMember): ReferenceMemberDocument {
  const type = member.getType()
  const typeLabel = getReferenceTypeLabel(member, type)

  return {
    id: member.getId(),
    name: member.getName(),
    kind: member.getKind(),
    typeLabel,
    summary: createReferenceMemberSummary(member, type, typeLabel),
  }
}

function createReferenceMemberSummary(
  member: TastyMember,
  type: ReturnType<TastyMember['getType']>,
  typeLabel: string,
): ReferenceMemberSummary {
  return {
    memberTypeSummary: createReferenceMemberTypeSummary(member, type, typeLabel),
    description: member.getDescription(),
    paramDocs: createReferenceParams(member),
  }
}

function createReferenceMemberTypeSummary(
  member: TastyMember,
  type: TastyTypeRef | undefined,
  typeLabel: string,
): ReferenceMemberTypeSummary | undefined {
  if (!type) return undefined

  if (type.isCallable()) {
    return {
      kind: 'callSignature',
      text: formatTastyCallableSignature(type),
    }
  }

  const valueOptions = createReferenceValueOptions(member, type)
  if (shouldUseReferenceValueSet(type, valueOptions)) {
    return {
      kind: 'valueSet',
      options: valueOptions,
    }
  }

  const expression = type.describe()
  if (!expression || expression === typeLabel) return undefined

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

function createReferenceParams(member: TastyMember): ReferenceParamDoc[] {
  return member.getParameters()
}

function normalizeReferenceValueOption(value: string): string {
  return normalizeTastyInlineValue(value) ?? value
}

function shouldUseReferenceValueSet(type: TastyTypeRef, options: ReferenceValueOption[]): boolean {
  if (options.length === 0) return false
  if (type.isLiteral() || type.isUnion()) return true
  return options.some((option) => option.isDefault)
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

function getReferenceTypeLabel(member: TastyMember, type: TastyTypeRef | undefined): string {
  const semanticKind = getTastyMemberSemanticKind(member)
  if (semanticKind === 'intrinsic' || semanticKind === 'reference' || semanticKind === 'raw') {
    return type?.describe() ?? 'unknown'
  }
  return REFERENCE_TYPE_LABEL_ALIASES.get(semanticKind) ?? semanticKind
}

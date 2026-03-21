import {
  formatTastyCallableSignature,
  getTastyTypeInlineVariants,
  normalizeTastyInlineValue,
} from '@reference-ui/rust/tasty'
import type { TastyMember, TastyTypeRef } from '@reference-ui/rust/tasty'
import type {
  ReferenceMemberSummary,
  ReferenceMemberTypeSummary,
  ReferenceParamDoc,
  ReferenceValueOption,
} from '../types'

export function createReferenceMemberSummary(
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

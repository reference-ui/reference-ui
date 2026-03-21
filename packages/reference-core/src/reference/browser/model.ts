import {
  normalizeTastyInlineValue,
} from '@reference-ui/rust/tasty'
import type { TastyMember, TastySymbol, TastyTypeRef } from '@reference-ui/rust/tasty'
import type { ReferenceDocument, ReferenceMemberDocument, ReferenceParamDoc, ReferenceTag } from './types'

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

  return {
    id: member.getId(),
    name: member.getName(),
    kind: member.getKind(),
    typeLabel: getReferenceTypeLabel(member, type),
    tags: createReferenceTags(member, type),
    description: member.getDescription(),
    params: createReferenceParams(member, type),
  }
}

function createReferenceTags(member: TastyMember, type: ReturnType<TastyMember['getType']>): ReferenceTag[] {
  const defaultValue = member.getDefaultValue()
  const variants = getReferenceTypeVariants(type)
  const tags: ReferenceTag[] = []

  if (defaultValue) {
    tags.push({ label: defaultValue, highlighted: true })
  }

  for (const variant of variants) {
    if (defaultValue && normalizeTastyInlineValue(variant) === defaultValue) continue
    tags.push({ label: variant })
  }

  return dedupeReferenceTags(tags)
}

function createReferenceParams(
  member: TastyMember,
  _type: ReturnType<TastyMember['getType']>,
): ReferenceParamDoc[] {
  return member.getParameters()
}

function dedupeReferenceTags(tags: ReferenceTag[]): ReferenceTag[] {
  const seen = new Set<string>()
  const unique: ReferenceTag[] = []

  for (const tag of tags) {
    const key = `${tag.highlighted ? '1' : '0'}:${tag.label}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(tag)
  }

  return unique
}

function getReferenceTypeLabel(member: TastyMember, type: TastyTypeRef | undefined): string {
  switch (member.getKind()) {
    case 'method':
    case 'call':
      return 'function'
    case 'construct':
      return 'constructor'
    case 'index':
      return 'index'
    default:
      break
  }

  if (!type) return 'unknown'
  if (type.isLiteral()) return getReferenceLiteralKind(type.getLiteralValue())
  if (type.isUnion()) return inferReferenceUnionLabel(type)

  switch (type.getKind()) {
    case 'function':
      return 'function'
    case 'constructor':
      return 'constructor'
    case 'array':
      return 'array'
    case 'tuple':
      return 'tuple'
    case 'object':
      return 'object'
    case 'intersection':
      return 'intersection'
    case 'indexed_access':
      return 'indexed'
    case 'type_query':
      return 'typeof'
    case 'conditional':
      return 'conditional'
    case 'mapped':
      return 'mapped'
    case 'template_literal':
      return 'template literal'
    default:
      return type.describe()
  }
}

function getReferenceTypeVariants(type: TastyTypeRef | undefined): string[] {
  if (!type) return []

  if (type.isUnion()) {
    return uniqueReferenceStrings(type.getUnionTypes().flatMap(getInlineReferenceTypeVariants))
  }

  if (type.isLiteral()) {
    return [normalizeTastyInlineValue(type.getLiteralValue()) ?? type.describe()]
  }

  switch (type.getKind()) {
    case 'intrinsic':
      return type.describe() === 'boolean' ? ['true', 'false'] : []
    case 'function':
    case 'constructor':
      return [formatReferenceSignature(type)]
    case 'raw':
      return type.getSummary() ? [type.getSummary()!] : []
    default:
      return []
  }
}

function formatReferenceSignature(type: TastyTypeRef): string {
  const params = type
    .getParameters()
    .map((param, index) => {
      const optional = param.isOptional() ? '?' : ''
      const typeLabel = param.getType()?.describe() ?? 'unknown'
      const name = param.getName() ?? `arg${index + 1}`
      return `${name}${optional}: ${typeLabel}`
    })
    .join(', ')
  const returnType = type.getReturnType()?.describe() ?? 'unknown'
  const prefix = type.getKind() === 'constructor' ? 'new ' : ''

  return `${prefix}(${params}) => ${returnType}`
}

function inferReferenceUnionLabel(type: TastyTypeRef): string {
  const branchKinds = uniqueReferenceStrings(type.getUnionTypes().map(getReferenceUnionBranchKind))
  return branchKinds.length === 1 ? branchKinds[0]! : 'union'
}

function getReferenceUnionBranchKind(type: TastyTypeRef): string | null {
  if (type.isLiteral()) return getReferenceLiteralKind(type.getLiteralValue())
  if (type.isUnion()) return inferReferenceUnionLabel(type)

  switch (type.getKind()) {
    case 'function':
      return 'function'
    case 'constructor':
      return 'constructor'
    case 'intrinsic':
      return type.describe()
    default:
      return null
  }
}

function getInlineReferenceTypeVariants(type: TastyTypeRef): string[] {
  if (type.isUnion()) return type.getUnionTypes().flatMap(getInlineReferenceTypeVariants)
  if (type.isLiteral()) return [normalizeTastyInlineValue(type.getLiteralValue()) ?? type.describe()]

  switch (type.getKind()) {
    case 'intrinsic':
      return type.describe() === 'boolean' ? ['true', 'false'] : [type.describe()]
    case 'function':
    case 'constructor':
      return [formatReferenceSignature(type)]
    case 'raw':
      return type.getSummary() ? [type.getSummary()!] : [type.describe()]
    default:
      return [type.describe()]
  }
}

function getReferenceLiteralKind(value: string | undefined): string {
  const normalized = normalizeTastyInlineValue(value)
  if (normalized === 'true' || normalized === 'false') return 'boolean'
  if (normalized && /^-?\d+(\.\d+)?$/.test(normalized)) return 'number'
  return 'string'
}

function uniqueReferenceStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

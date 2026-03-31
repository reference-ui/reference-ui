import type { TastyMember, TastyTypeRef } from './api-types'
import { normalizeTastyInlineValue } from './jsdoc'

export type TastySemanticKind =
  | 'unknown'
  | 'function'
  | 'constructor'
  | 'index'
  | 'boolean'
  | 'number'
  | 'string'
  | 'array'
  | 'tuple'
  | 'object'
  | 'intersection'
  | 'indexed_access'
  | 'type_query'
  | 'conditional'
  | 'mapped'
  | 'template_literal'
  | 'union'
  | 'intrinsic'
  | 'reference'
  | 'raw'

export function getTastyMemberSemanticKind(member: TastyMember): TastySemanticKind {
  switch (member.getKind()) {
    case 'method':
    case 'call':
      return 'function'
    case 'construct':
      return 'constructor'
    case 'index':
      return 'index'
    default:
      return getTastyTypeSemanticKind(member.getType())
  }
}

export function getTastyTypeSemanticKind(type: TastyTypeRef | undefined): TastySemanticKind {
  if (!type) return 'unknown'
  if (type.isLiteral()) return getTastyLiteralSemanticKind(type.getLiteralValue())
  if (type.isUnion()) return inferTastyUnionSemanticKind(type)

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
      return 'indexed_access'
    case 'type_query':
      return 'type_query'
    case 'conditional':
      return 'conditional'
    case 'mapped':
      return 'mapped'
    case 'template_literal':
      return 'template_literal'
    case 'intrinsic':
      return getIntrinsicSemanticKind(type.describe())
    case 'reference':
      return 'reference'
    case 'raw':
      return 'raw'
    default:
      return 'unknown'
  }
}

export function getTastyLiteralSemanticKind(value: string | undefined): TastySemanticKind {
  const normalized = normalizeTastyInlineValue(value)
  if (normalized === 'true' || normalized === 'false') return 'boolean'
  if (normalized && /^-?\d+(\.\d+)?$/.test(normalized)) return 'number'
  return 'string'
}

function inferTastyUnionSemanticKind(type: TastyTypeRef): TastySemanticKind {
  const branchKinds = uniqueSemanticKinds(type.getUnionTypes().map(getUnionBranchSemanticKind))
  return branchKinds.length === 1 ? branchKinds[0]! : 'union'
}

function getUnionBranchSemanticKind(type: TastyTypeRef): TastySemanticKind | null {
  if (type.isLiteral()) return getTastyLiteralSemanticKind(type.getLiteralValue())
  if (type.isUnion()) return inferTastyUnionSemanticKind(type)

  switch (type.getKind()) {
    case 'function':
      return 'function'
    case 'constructor':
      return 'constructor'
    case 'intrinsic':
      return getIntrinsicSemanticKind(type.describe())
    default:
      return null
  }
}

function getIntrinsicSemanticKind(description: string): TastySemanticKind {
  switch (description) {
    case 'boolean':
      return 'boolean'
    case 'number':
      return 'number'
    case 'string':
      return 'string'
    default:
      return 'intrinsic'
  }
}

function uniqueSemanticKinds(values: Array<TastySemanticKind | null | undefined>): TastySemanticKind[] {
  return [...new Set(values.filter((value): value is TastySemanticKind => value != null))]
}

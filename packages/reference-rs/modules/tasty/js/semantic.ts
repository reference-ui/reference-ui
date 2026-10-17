/**
 * Typescript source file for Reference UI module.
 * Contains JS API logic and types.
 */
import type { TastyMember, TastyTypeRef } from './api-types.js'
import { normalizeTastyInlineValue } from './jsdoc.js'

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

// Structured type kinds whose semantic kind is their own name.
const SELF_NAMED_SEMANTIC_KINDS: ReadonlySet<string> = new Set([
  'function',
  'constructor',
  'array',
  'tuple',
  'object',
  'intersection',
  'indexed_access',
  'type_query',
  'conditional',
  'mapped',
  'template_literal',
  'reference',
  'raw',
])

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

export function getTastyTypeSemanticKind(
  type: TastyTypeRef | undefined
): TastySemanticKind {
  if (!type) return 'unknown'
  if (type.isLiteral()) return getTastyLiteralSemanticKind(type.getLiteralValue())
  if (type.isUnion()) return inferTastyUnionSemanticKind(type)
  return getStructuredSemanticKind(type)
}

function getStructuredSemanticKind(type: TastyTypeRef): TastySemanticKind {
  const kind = type.getKind()
  if (kind === 'intrinsic') return getIntrinsicSemanticKind(type.describe())
  return isSelfNamedSemanticKind(kind) ? kind : 'unknown'
}

function isSelfNamedSemanticKind(kind: string): kind is TastySemanticKind {
  return SELF_NAMED_SEMANTIC_KINDS.has(kind)
}

export function getTastyLiteralSemanticKind(
  value: string | undefined
): TastySemanticKind {
  const normalized = normalizeTastyInlineValue(value)
  if (normalized === 'true' || normalized === 'false') return 'boolean'
  if (normalized && /^-?\d+(\.\d+)?$/.test(normalized)) return 'number'
  return 'string'
}

function inferTastyUnionSemanticKind(type: TastyTypeRef): TastySemanticKind {
  const branchKinds = uniqueSemanticKinds(
    type.getUnionTypes().map(getUnionBranchSemanticKind)
  )
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

function uniqueSemanticKinds(
  values: Array<TastySemanticKind | null | undefined>
): TastySemanticKind[] {
  return [...new Set(values.filter((value): value is TastySemanticKind => value != null))]
}

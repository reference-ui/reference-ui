import type { TastyTypeRef } from './api-types'
import { normalizeTastyInlineValue } from './jsdoc'

export function formatTastyCallableSignature(type: TastyTypeRef): string {
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

export function getTastyTypeInlineVariants(type: TastyTypeRef | undefined): string[] {
  if (!type) return []
  if (type.isUnion()) return uniqueTastyStrings(type.getUnionTypes().flatMap(getInlineTastyTypeVariants))
  return getInlineTastyTypeVariants(type)
}

function getInlineTastyTypeVariants(type: TastyTypeRef): string[] {
  if (type.isUnion()) return type.getUnionTypes().flatMap(getInlineTastyTypeVariants)
  if (type.isLiteral()) return [normalizeTastyInlineValue(type.getLiteralValue()) ?? type.describe()]

  switch (type.getKind()) {
    case 'intrinsic':
      return type.describe() === 'boolean' ? ['true', 'false'] : [type.describe()]
    case 'function':
    case 'constructor':
      return [formatTastyCallableSignature(type)]
    case 'raw':
      return type.getSummary() ? [type.getSummary()!] : [type.describe()]
    default:
      return [type.describe()]
  }
}

function uniqueTastyStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

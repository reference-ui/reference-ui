/**
 * Typescript source file for Reference UI module.
 * Contains JS API logic and types.
 */
import type { TastyFnParam, TastyTypeRef } from './api-types.js'
import { normalizeTastyInlineValue } from './jsdoc.js'

export function formatTastyCallableSignature(type: TastyTypeRef): string {
  const params = type
    .getParameters()
    .map((param, index) => formatCallableParameter(param, index))
    .join(', ')
  const returnType = type.getReturnType()?.describe() ?? 'unknown'
  const prefix = type.getKind() === 'constructor' ? 'new ' : ''

  return `${prefix}(${params}) => ${returnType}`
}

function formatCallableParameter(param: TastyFnParam, index: number): string {
  const optional = param.isOptional() ? '?' : ''
  const typeLabel = param.getType()?.describe() ?? 'unknown'
  const name = param.getName() ?? `arg${index + 1}`
  return `${name}${optional}: ${typeLabel}`
}

export function getTastyTypeInlineVariants(type: TastyTypeRef | undefined): string[] {
  if (!type) return []
  if (type.isUnion())
    return uniqueTastyStrings(type.getUnionTypes().flatMap(getInlineTastyTypeVariants))
  return getInlineTastyTypeVariants(type)
}

function getInlineTastyTypeVariants(type: TastyTypeRef): string[] {
  if (type.isUnion()) return type.getUnionTypes().flatMap(getInlineTastyTypeVariants)
  if (type.isLiteral())
    return [normalizeTastyInlineValue(type.getLiteralValue()) ?? type.describe()]
  return getNonUnionInlineVariants(type)
}

function getNonUnionInlineVariants(type: TastyTypeRef): string[] {
  switch (type.getKind()) {
    case 'intrinsic':
      return getIntrinsicInlineVariants(type)
    case 'function':
    case 'constructor':
      return [formatTastyCallableSignature(type)]
    case 'raw':
      return getRawInlineVariants(type)
    default:
      return [type.describe()]
  }
}

function getIntrinsicInlineVariants(type: TastyTypeRef): string[] {
  return type.describe() === 'boolean' ? ['true', 'false'] : [type.describe()]
}

function getRawInlineVariants(type: TastyTypeRef): string[] {
  const summary = type.getSummary()
  return summary ? [summary] : [type.describe()]
}

function uniqueTastyStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

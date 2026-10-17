/**
 * Typescript source file for Reference UI module.
 * Renders the human-readable description of a type reference: a named reference with its
 * arguments, or a structured type such as a union, object literal or conditional.
 */
import type { RawTastyStructuredTypeRef, RawTastyTypeReference } from '../api-types.js'
import type { TastyApiRuntime } from './api-runtime.js'
import { isTypeReference } from './shared.js'

// Kinds that describe as one fixed label, whatever their contents.
const FIXED_STRUCTURED_LABELS: ReadonlyMap<string, string> = new Map([
  ['function', 'function'],
  ['constructor', 'constructor'],
  ['tuple', '[tuple]'],
  ['template_literal', '`template literal`'],
  ['conditional', 'conditional'],
  ['mapped', 'mapped'],
])

export function describeStructured(
  api: TastyApiRuntime,
  raw: RawTastyStructuredTypeRef
): string {
  return FIXED_STRUCTURED_LABELS.get(raw.kind) ?? describeVariableStructured(api, raw)
}

function describeVariableStructured(
  api: TastyApiRuntime,
  raw: RawTastyStructuredTypeRef
): string {
  switch (raw.kind) {
    case 'intrinsic':
      return raw.name
    case 'literal':
      return formatLiteralValue(raw.value)
    case 'raw':
      return raw.summary
    case 'type_query':
      return `typeof ${raw.expression}`
    case 'array':
      return `${api.createTypeRef(raw.element).describe()}[]`
    default:
      return describeCombinedStructured(api, raw)
  }
}

function describeCombinedStructured(
  api: TastyApiRuntime,
  raw: RawTastyStructuredTypeRef
): string {
  switch (raw.kind) {
    case 'union':
      return raw.types.map(item => api.createTypeRef(item).describe()).join(' | ')
    case 'intersection':
      return raw.types.map(item => api.createTypeRef(item).describe()).join(' & ')
    case 'object':
      return describeObjectMembers(api, raw)
    case 'indexed_access':
      return `${api.createTypeRef(raw.object).describe()}[${api.createTypeRef(raw.index).describe()}]`
    case 'type_operator':
      return `${raw.operator} ${api.createTypeRef(raw.target).describe()}`
    default:
      return 'unknown'
  }
}

export function describeTypeReference(
  api: TastyApiRuntime,
  raw: RawTastyTypeReference
): string {
  if (!raw.typeArguments?.length) return raw.name
  const args = raw.typeArguments
    .map(item => api.createTypeRef(item).describe())
    .join(', ')
  return `${raw.name}<${args}>`
}

function formatLiteralValue(value: string): string {
  const trimmed = value.trim()
  if (trimmed.startsWith("'") || trimmed.startsWith('"') || trimmed.startsWith('`')) {
    return trimmed
  }
  if (/^[+-]?\d+(\.\d+)?$/.test(trimmed) || trimmed === 'true' || trimmed === 'false') {
    return trimmed
  }
  return JSON.stringify(trimmed)
}

function describeObjectMembers(
  api: TastyApiRuntime,
  raw: RawTastyStructuredTypeRef & { kind: 'object' }
): string {
  if (!raw.members || raw.members.length === 0) {
    return '{}'
  }

  // For simple generic objects (like { value: T }), keep the old behavior
  if (shouldUseSimpleDescription(raw)) {
    return '{ ... }'
  }

  const memberDescriptions = raw.members.map(member => {
    const optional = member.optional ? '?' : ''
    const readonly = member.readonly ? 'readonly ' : ''
    const typeDescription = member.type
      ? api.createTypeRef(member.type).describe()
      : 'unknown'
    return `${readonly}${member.name}${optional}: ${typeDescription}`
  })

  // For very large objects, truncate to avoid overly long descriptions
  if (memberDescriptions.length > 10) {
    const shown = memberDescriptions.slice(0, 8).join('; ')
    const remaining = memberDescriptions.length - 8
    return `{ ${shown}; ... +${remaining} more }`
  }

  return `{ ${memberDescriptions.join('; ')} }`
}

function shouldUseSimpleDescription(
  raw: RawTastyStructuredTypeRef & { kind: 'object' }
): boolean {
  // Use simple description for objects with:
  // 1. Just 1-2 members with simple type parameter names
  // 2. No complex nested structures
  if (raw.members.length <= 2) {
    return raw.members.every(member => {
      if (!member.type) return false

      // Check if the type is a simple type parameter reference
      if (isTypeReference(member.type)) {
        const typeName = member.type.name
        // Simple single-letter type parameters like T, U, V, K
        return /^[A-Z]$/.test(typeName) && !member.type.typeArguments
      }

      // Check for simple intrinsic types like string, number, boolean
      if (member.type.kind === 'intrinsic') {
        return ['string', 'number', 'boolean', 'unknown'].includes(member.type.name)
      }

      return false
    })
  }

  return false
}

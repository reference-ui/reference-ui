// Extends-entry validation for upstream base systems.
// It takes candidate extends entries and emits nothing or throws a field
// error. Config calls the two entry points from validateConfig; the factory
// builds the shared field message so every branch reports alike.

import type { BaseSystem } from './types.ts'

type BaseSystemField = 'extends'
type BaseSystemValidationOptions = {
  requireFragment?: boolean
}

export function invalidBaseSystem(field: 'extends', reason: string): Error {
  return new Error(`Config field '${field}' is invalid.\n${reason}`)
}

function assertOptionalJsxElements(
  field: BaseSystemField,
  sys: BaseSystem,
  index: number
): void {
  if (sys.jsxElements == null) return

  if (!Array.isArray(sys.jsxElements) || sys.jsxElements.some((entry) => typeof entry !== 'string')) {
    throw invalidBaseSystem(
      field,
      `Entry ${index} (${sys.name}) must have 'jsxElements' as an array of strings.`
    )
  }
}

export function validateBaseSystems(
  field: BaseSystemField,
  value: unknown
): BaseSystem[] | undefined {
  if (value == null) {
    return undefined
  }

  if (!Array.isArray(value)) {
    throw invalidBaseSystem(
      field,
      'Expected an array of BaseSystem objects.'
    )
  }

  return value as BaseSystem[]
}

function assertBaseSystemObject(
  field: BaseSystemField,
  sys: BaseSystem,
  index: number
): void {
  if (!sys || typeof sys !== 'object') {
    throw invalidBaseSystem(
      field,
      `Entry ${index} must be an object.`
    )
  }
}

function assertBaseSystemName(
  field: BaseSystemField,
  sys: BaseSystem,
  index: number
): void {
  if (typeof sys.name !== 'string' || sys.name.trim() === '') {
    throw invalidBaseSystem(
      field,
      `Entry ${index} must have a non-empty 'name'.`
    )
  }
}

function assertRequiredFragment(
  field: BaseSystemField,
  sys: BaseSystem,
  index: number,
  requireFragment: boolean
): void {
  if (!requireFragment) return

  const hasFragment = typeof sys.fragment === 'string' && sys.fragment.trim() !== ''
  const hasStreams = Array.isArray(sys.streams) && sys.streams.length > 0
  const hasJsxElements = Array.isArray(sys.jsxElements) && sys.jsxElements.length > 0

  if (!hasFragment && !hasStreams && !hasJsxElements) {
    throw invalidBaseSystem(
      field,
      `Entry ${index} (${sys.name}) must include synced system data (fragment, streams, or jsxElements). Run sync on the upstream package first.`
    )
  }
}

function validateBaseSystemEntry(
  field: BaseSystemField,
  sys: BaseSystem,
  index: number,
  options: BaseSystemValidationOptions
): void {
  assertBaseSystemObject(field, sys, index)
  assertBaseSystemName(field, sys, index)
  assertRequiredFragment(field, sys, index, options.requireFragment ?? false)
  assertOptionalJsxElements(field, sys, index)
}

export function validateBaseSystemEntries(
  field: BaseSystemField,
  systems: BaseSystem[] | undefined,
  options: BaseSystemValidationOptions = {}
): void {
  if (!systems?.length) return

  for (const [index, sys] of systems.entries()) {
    validateBaseSystemEntry(field, sys, index, options)
  }
}

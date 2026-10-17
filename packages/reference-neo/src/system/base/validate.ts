// Entry validation for upstream base systems, extends and layers alike.
// It takes the candidate entries of one field and emits nothing or throws a field
// error: shape checks per entry, then links between the entries and the consumer's
// own name (a self-named or cyclic entry, a name repeated within the field). It also
// takes both fields once each passes and rejects a system named in both.
// Config calls the entry points from validateConfig; the factory builds the shared
// field message so every branch reports alike.

import type { BaseSystem } from './types.ts'

export type BaseSystemField = 'extends' | 'layers'
type BaseSystemValidationOptions = {
  requireFragment?: boolean
  // A layers entry contributes CSS only through its streams.
  requireStreams?: boolean
}

export function invalidBaseSystem(field: BaseSystemField, reason: string): Error {
  return new Error(`Config field '${field}' is invalid.\n${reason}`)
}

// A system name is written into an unescaped [data-layer="…"] selector, so a double quote, a backslash
// or a line break would break it. Config load checks every name, the own name included.
const UNSAFE_NAME_CHARS = /["\\\r\n]/

export function isSafeSystemName(name: string): boolean {
  return !UNSAFE_NAME_CHARS.test(name)
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

// The owned map's keys are component names and need not appear in jsxElements: a system can own
// the props of a component it only reaches through another, so only the shape is checked here.
function isOwnedMap(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  return Object.values(value as Record<string, unknown>).every(
    (props) => Array.isArray(props) && props.every((prop) => typeof prop === 'string')
  )
}

function assertOptionalJsxOwned(
  field: BaseSystemField,
  sys: BaseSystem,
  index: number
): void {
  if (sys.jsxOwned == null) return

  if (!isOwnedMap(sys.jsxOwned)) {
    throw invalidBaseSystem(
      field,
      `Entry ${index} (${sys.name}) must have 'jsxOwned' as an object mapping component names to arrays of strings.`
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
  if (!isSafeSystemName(sys.name)) {
    throw invalidBaseSystem(
      field,
      `Entry ${index} (${JSON.stringify(sys.name)}) has a name with a double quote, a backslash or a line break, which a [data-layer] selector cannot carry.`
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

function assertFragmentNodes(field: BaseSystemField, sys: BaseSystem, index: number): void {
  if (sys.fragments == null) return

  const valid =
    Array.isArray(sys.fragments) &&
    sys.fragments.every(
      (node) => node && typeof node.name === 'string' && node.name.trim() !== '' && typeof node.bundle === 'string'
    )
  if (valid) return

  throw invalidBaseSystem(
    field,
    `Entry ${index} (${sys.name}) must have 'fragments' as an array of { name, bundle } nodes.`
  )
}

function assertRequiredStreams(
  field: BaseSystemField,
  sys: BaseSystem,
  index: number,
  requireStreams: boolean
): void {
  if (!requireStreams) return

  if (!Array.isArray(sys.streams) || sys.streams.length === 0) {
    throw invalidBaseSystem(
      field,
      `Entry ${index} (${sys.name}) must include 'streams'. A ${field} entry contributes CSS only through its streams, so a fragment or jsxElements alone would be silently dropped. Run sync on the upstream package first, or list it under 'extends' for its fragment and jsxElements.`
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
  assertFragmentNodes(field, sys, index)
  assertRequiredStreams(field, sys, index, options.requireStreams ?? false)
  assertOptionalJsxElements(field, sys, index)
  assertOptionalJsxOwned(field, sys, index)
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

function reachesOwnName(sys: BaseSystem, ownName: string): boolean {
  if (sys.name === ownName) return true
  if (Array.isArray(sys.fragments) && sys.fragments.some((node) => node.name === ownName)) return true
  return Array.isArray(sys.streams) && sys.streams.some((stream) => stream?.name === ownName)
}

function assertNoOwnNameReach(
  field: BaseSystemField,
  sys: BaseSystem,
  index: number,
  ownName: string
): void {
  if (!reachesOwnName(sys, ownName)) return

  throw invalidBaseSystem(
    field,
    `Entry ${index} (${sys.name}) reaches '${ownName}', this config's own name, so the config would be its own upstream. Remove the entry, or cut the path from its extends and layers back to '${ownName}'.`
  )
}

function assertNotRepeated(
  field: BaseSystemField,
  sys: BaseSystem,
  index: number,
  firstIndexByName: Map<string, number>
): void {
  const first = firstIndexByName.get(sys.name)
  if (first === undefined) {
    firstIndexByName.set(sys.name, index)
    return
  }

  throw invalidBaseSystem(
    field,
    `Entry ${index} (${sys.name}) repeats entry ${first}. List each system once.`
  )
}

/**
 * Links between one field's entries and the consumer's own name. An entry reaches
 * the own name when its name, any fragment node name, or any stream name equals it,
 * which covers a self-named entry and a cycle through an upstream's expansion.
 * A name listed twice in one field is rejected; a repeat reached only through another
 * system is left to the dedupe.
 */
export function validateBaseSystemLinks(
  field: BaseSystemField,
  systems: BaseSystem[] | undefined,
  ownName: string
): void {
  if (!systems?.length) return

  const firstIndexByName = new Map<string, number>()
  for (const [index, sys] of systems.entries()) {
    assertNoOwnNameReach(field, sys, index, ownName)
    assertNotRepeated(field, sys, index, firstIndexByName)
  }
}

/**
 * A system named in both fields. `extends` already includes everything `layers`
 * gives, so the layers entry is rejected rather than merged. Config calls this
 * only after each field passes on its own, so every entry it reads is a valid
 * system with a name. Only direct names are compared.
 */
export function validateSharedBaseSystems(
  extendsSystems: BaseSystem[] | undefined,
  layersSystems: BaseSystem[] | undefined
): void {
  if (!extendsSystems?.length || !layersSystems?.length) return

  const extended = new Set(extendsSystems.map((sys) => sys.name))
  for (const [index, sys] of layersSystems.entries()) {
    if (!extended.has(sys.name)) continue

    throw invalidBaseSystem(
      'layers',
      `Entry ${index} (${sys.name}) is also listed under 'extends'. 'extends' already includes everything 'layers' gives, so remove it from 'layers'.`
    )
  }
}

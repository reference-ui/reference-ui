/**
 * Key collection for Pick and Omit during object projection.
 * Collects the member keys named by a Pick or Omit key argument, following aliases and unions
 * to literal keys. Returns undefined when any part cannot be resolved to a literal key.
 */
import type { RawTastyTypeRef, RawTastyTypeReference, TastyTypeRef } from '../api-types.js'
import { getTastyResolvedType } from '../resolution.js'
import { instantiateTypeAliasDefinition } from './object-projection-instantiation.js'
import {
  MAX_PROJECTION_DEPTH,
  type ProjectionContext,
} from './object-projection-references.js'
import { isTypeAliasSymbol, isTypeReference } from './shared.js'
import type { TastyApiRuntime } from './api-runtime.js'

export async function collectProjectedKeys(
  api: TastyApiRuntime,
  typeRef: TastyTypeRef,
  context: ProjectionContext
): Promise<Set<string> | undefined> {
  const concrete = getTastyResolvedType(typeRef) ?? typeRef
  return collectProjectedKeysFromRaw(api, concrete.getRaw(), context)
}

async function collectProjectedKeysFromRaw(
  api: TastyApiRuntime,
  raw: RawTastyTypeRef,
  context: ProjectionContext
): Promise<Set<string> | undefined> {
  if (isTypeReference(raw)) {
    return collectProjectedKeysFromReference(api, raw, context)
  }

  switch (raw.kind) {
    case 'literal':
      return collectLiteralKeys(raw.value)
    case 'union':
      return collectUnionKeys(api, raw.types, context)
    default:
      return undefined
  }
}

async function collectProjectedKeysFromReference(
  api: TastyApiRuntime,
  reference: RawTastyTypeReference,
  context: ProjectionContext
): Promise<Set<string> | undefined> {
  if (
    context.depth > MAX_PROJECTION_DEPTH ||
    context.visitedSymbolIds.has(reference.id)
  ) {
    return undefined
  }

  const manifestEntry = api.getManifestEntry(reference.id)
  if (!manifestEntry) return undefined

  const symbol = await api.loadSymbolById(reference.id)
  const symbolRaw = symbol.getRaw()
  if (!isTypeAliasSymbol(symbolRaw)) return undefined

  const instantiated =
    instantiateTypeAliasDefinition(symbolRaw, reference.typeArguments) ??
    symbol.getUnderlyingType()?.getRaw()

  if (!instantiated) return undefined

  return collectProjectedKeysFromRaw(api, instantiated, {
    visitedSymbolIds: new Set(context.visitedSymbolIds).add(reference.id),
    depth: context.depth + 1,
    projectTypeParameterMembers: context.projectTypeParameterMembers,
  })
}

function collectLiteralKeys(value: string): Set<string> | undefined {
  const key = normalizeLiteralKey(value)
  return key == null ? undefined : new Set([key])
}

async function collectUnionKeys(
  api: TastyApiRuntime,
  types: RawTastyTypeRef[],
  context: ProjectionContext
): Promise<Set<string> | undefined> {
  const keys = new Set<string>()
  for (const item of types) {
    const itemKeys = await collectProjectedKeysFromRaw(api, item, context)
    if (!itemKeys) return undefined
    for (const key of itemKeys) keys.add(key)
  }
  return keys
}

function normalizeLiteralKey(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined

  const quoted =
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith('`') && trimmed.endsWith('`'))

  return quoted ? trimmed.slice(1, -1) : trimmed
}

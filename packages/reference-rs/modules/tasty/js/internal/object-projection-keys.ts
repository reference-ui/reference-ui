/**
 * Key collection for Pick and Omit during object projection.
 * Collects the member keys named by a Pick or Omit key argument, following aliases and unions
 * to literal keys. Returns undefined when any part cannot be resolved to a literal key.
 * Each alias it follows takes a step from the caller's budget: a union of unions can branch within the depth limit.
 * A reference the depth cap drops is recorded as a walk limit; a repeat already on the path is not, as it loses nothing.
 */
import type { RawTastyTypeRef, RawTastyTypeReference, TastyTypeRef } from '../api-types.js'
import { getTastyResolvedType } from '../resolution.js'
import { instantiateTypeAliasDefinition } from './object-projection-instantiation.js'
import {
  cutAtDepth,
  MAX_PROJECTION_DEPTH,
  type ProjectionContext,
  takeProjectionStep,
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

/** A reference is followed off the path, inside the depth limit, and while the call's budget still has steps. */
function mayFollowReference(context: ProjectionContext, reference: RawTastyTypeReference): boolean {
  if (context.visitedSymbolIds.has(reference.id)) return false
  if (context.depth > MAX_PROJECTION_DEPTH) {
    cutAtDepth(context, reference.id)
    return false
  }
  return takeProjectionStep(context)
}

async function collectProjectedKeysFromReference(
  api: TastyApiRuntime,
  reference: RawTastyTypeReference,
  context: ProjectionContext
): Promise<Set<string> | undefined> {
  if (!mayFollowReference(context, reference)) return undefined

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
    budget: context.budget,
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

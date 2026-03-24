import type { RawTastyTypeRef, RawTastyTypeReference, TastyMember, TastySymbol, TastyTypeRef } from '../api-types'
import { dedupeTastyMembers } from '../members'
import { getTastyResolvedType } from '../resolution'
import { instantiateTypeAliasDefinition } from './object-projection-instantiation'
import { isInterfaceSymbol, isTypeAliasSymbol, isTypeReference } from './shared'
import type { TastyApiRuntime } from './api-runtime'

const MAX_PROJECTION_DEPTH = 32

interface ProjectionContext {
  visitedSymbolIds: Set<string>
  depth: number
}

export async function projectObjectLikeMembers(
  api: TastyApiRuntime,
  symbol: TastySymbol,
): Promise<TastyMember[] | undefined> {
  return projectSymbolMembers(api, symbol, {
    visitedSymbolIds: new Set<string>(),
    depth: 0,
  })
}

async function projectSymbolMembers(
  api: TastyApiRuntime,
  symbol: TastySymbol,
  context: ProjectionContext,
): Promise<TastyMember[] | undefined> {
  if (context.depth > MAX_PROJECTION_DEPTH) return undefined
  if (context.visitedSymbolIds.has(symbol.getId())) return []

  const nextContext: ProjectionContext = {
    visitedSymbolIds: new Set(context.visitedSymbolIds).add(symbol.getId()),
    depth: context.depth + 1,
  }

  const raw = symbol.getRaw()
  if (isInterfaceSymbol(raw)) {
    return dedupeTastyMembers(await api.graph.flattenInterfaceMembers(symbol))
  }

  if (isTypeAliasSymbol(raw)) {
    return projectTypeMembers(api, symbol.getUnderlyingType(), nextContext)
  }

  return undefined
}

async function projectTypeMembers(
  api: TastyApiRuntime,
  typeRef: TastyTypeRef | undefined,
  context: ProjectionContext,
): Promise<TastyMember[] | undefined> {
  if (!typeRef || context.depth > MAX_PROJECTION_DEPTH) return undefined

  const concrete = getTastyResolvedType(typeRef) ?? typeRef
  const raw = concrete.getRaw()

  if (isTypeReference(raw)) {
    return projectReferenceMembers(api, raw, context)
  }

  switch (raw.kind) {
    case 'object':
      return raw.members.map((member) => api.createMember(member))
    case 'intersection': {
      const parts = await Promise.all(raw.types.map((item) => projectTypeMembers(
        api,
        api.createTypeRef(item),
        context,
      )))
      const projectableParts = parts.filter((part): part is TastyMember[] => part != null)
      if (projectableParts.length === 0) return undefined
      return dedupeTastyMembers(projectableParts.flat())
    }
    default:
      return undefined
  }
}

async function projectReferenceMembers(
  api: TastyApiRuntime,
  reference: RawTastyTypeReference,
  context: ProjectionContext,
): Promise<TastyMember[] | undefined> {
  const utilityProjection = await projectUtilityReferenceMembers(api, reference, context)
  if (utilityProjection) return utilityProjection

  const manifestEntry = api.getManifestEntry(reference.id)
  if (!manifestEntry) {
    return isTypeParameterReference(reference) ? [] : undefined
  }

  const symbol = await api.loadSymbolById(reference.id)
  const raw = symbol.getRaw()
  if (isTypeAliasSymbol(raw)) {
    const instantiated = instantiateTypeAliasDefinition(raw, reference.typeArguments)
    if (instantiated) {
      return projectRawTypeMembers(api, instantiated, context)
    }
  }

  return projectSymbolMembers(api, symbol, context)
}

async function projectUtilityReferenceMembers(
  api: TastyApiRuntime,
  reference: RawTastyTypeReference,
  context: ProjectionContext,
): Promise<TastyMember[] | undefined> {
  if (!reference.typeArguments?.length) return undefined

  switch (reference.name) {
    case 'Omit':
      return projectOmitMembers(api, reference.typeArguments, context)
    case 'Pick':
      return projectPickMembers(api, reference.typeArguments, context)
    default:
      return undefined
  }
}

async function projectOmitMembers(
  api: TastyApiRuntime,
  typeArguments: RawTastyTypeRef[],
  context: ProjectionContext,
): Promise<TastyMember[] | undefined> {
  if (typeArguments.length !== 2) return undefined

  const baseMembers = await projectTypeMembers(api, api.createTypeRef(typeArguments[0]!), context)
  const keys = await collectProjectedKeys(api, api.createTypeRef(typeArguments[1]!), context)
  if (!baseMembers || !keys) return undefined

  return baseMembers.filter((member) => !keys.has(member.getName()))
}

async function projectPickMembers(
  api: TastyApiRuntime,
  typeArguments: RawTastyTypeRef[],
  context: ProjectionContext,
): Promise<TastyMember[] | undefined> {
  if (typeArguments.length !== 2) return undefined

  const baseMembers = await projectTypeMembers(api, api.createTypeRef(typeArguments[0]!), context)
  const keys = await collectProjectedKeys(api, api.createTypeRef(typeArguments[1]!), context)
  if (!baseMembers || !keys) return undefined

  return baseMembers.filter((member) => keys.has(member.getName()))
}

async function collectProjectedKeys(
  api: TastyApiRuntime,
  typeRef: TastyTypeRef,
  context: ProjectionContext,
): Promise<Set<string> | undefined> {
  const concrete = getTastyResolvedType(typeRef) ?? typeRef
  return collectProjectedKeysFromRaw(api, concrete.getRaw(), context)
}

async function collectProjectedKeysFromRaw(
  api: TastyApiRuntime,
  raw: RawTastyTypeRef,
  context: ProjectionContext,
): Promise<Set<string> | undefined> {
  if (isTypeReference(raw)) {
    if (context.depth > MAX_PROJECTION_DEPTH || context.visitedSymbolIds.has(raw.id)) {
      return undefined
    }

    const manifestEntry = api.getManifestEntry(raw.id)
    if (!manifestEntry) return undefined

    const symbol = await api.loadSymbolById(raw.id)
    const symbolRaw = symbol.getRaw()
    if (!isTypeAliasSymbol(symbolRaw)) return undefined

    const instantiated = instantiateTypeAliasDefinition(symbolRaw, raw.typeArguments)
      ?? symbol.getUnderlyingType()?.getRaw()

    if (!instantiated) return undefined

    return collectProjectedKeysFromRaw(api, instantiated, {
      visitedSymbolIds: new Set(context.visitedSymbolIds).add(raw.id),
      depth: context.depth + 1,
    })
  }

  switch (raw.kind) {
    case 'literal': {
      const key = normalizeLiteralKey(raw.value)
      return key == null ? undefined : new Set([key])
    }
    case 'union': {
      const keys = new Set<string>()
      for (const item of raw.types) {
        const itemKeys = await collectProjectedKeysFromRaw(api, item, context)
        if (!itemKeys) return undefined
        for (const key of itemKeys) keys.add(key)
      }
      return keys
    }
    default:
      return undefined
  }
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

function isTypeParameterReference(reference: RawTastyTypeReference): boolean {
  return reference.id === reference.name && !reference.typeArguments?.length
}

async function projectRawTypeMembers(
  api: TastyApiRuntime,
  raw: RawTastyTypeRef,
  context: ProjectionContext,
): Promise<TastyMember[] | undefined> {
  return projectTypeMembers(api, api.createTypeRef(raw), context)
}

import type {
  RawTastyTypeRef,
  RawTastyTypeReference,
  TastyMember,
  TastySymbol,
  TastyTypeRef,
} from '../api-types'
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
  symbol: TastySymbol
): Promise<TastyMember[] | undefined> {
  return projectSymbolMembers(api, symbol, {
    visitedSymbolIds: new Set<string>(),
    depth: 0,
  })
}

async function projectSymbolMembers(
  api: TastyApiRuntime,
  symbol: TastySymbol,
  context: ProjectionContext
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
  context: ProjectionContext
): Promise<TastyMember[] | undefined> {
  if (!typeRef || context.depth > MAX_PROJECTION_DEPTH) return undefined

  const concrete = getTastyResolvedType(typeRef) ?? typeRef
  const raw = concrete.getRaw()

  if (isTypeReference(raw)) {
    return projectReferenceMembers(api, raw, context)
  }

  switch (raw.kind) {
    case 'object':
      return raw.members.map(member => api.createMember(member))
    case 'indexed_access': {
      const parameterMembers = await projectParametersIndexedAccessMembers(api, raw, context)
      if (parameterMembers) return parameterMembers

      if (raw.resolved) {
        return projectTypeMembers(api, api.createTypeRef(raw.resolved), context)
      }

      return undefined
    }
    case 'intersection': {
      const parts = await Promise.all(
        raw.types.map(item => projectTypeMembers(api, api.createTypeRef(item), context))
      )
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
  context: ProjectionContext
): Promise<TastyMember[] | undefined> {
  const utilityProjection = await projectUtilityReferenceMembers(api, reference, context)
  if (utilityProjection) return utilityProjection

  if (isTypeParameterReference(reference)) {
    // Handle specific type parameter mappings that we know should be resolved.
    if (reference.name === 'P') {
      try {
        const systemProperties = await api.loadSymbolByName('SystemProperties')
        return systemProperties.getDisplayMembers()
      } catch {
        return []
      }
    }
    return []
  }

  const symbol = await loadReferencedSymbol(api, reference)
  if (!symbol) return undefined

  const raw = symbol.getRaw()
  if (isTypeAliasSymbol(raw)) {
    const instantiated = instantiateTypeAliasDefinition(raw, reference.typeArguments)
    if (instantiated) {
      return projectRawTypeMembers(api, instantiated, context)
    }
  }

  return projectSymbolMembers(api, symbol, context)
}

async function loadReferencedSymbol(
  api: TastyApiRuntime,
  reference: RawTastyTypeReference
): Promise<TastySymbol | undefined> {
  const manifestEntry = api.getManifestEntry(reference.id)
  if (manifestEntry) {
    return api.loadSymbolById(reference.id)
  }

  try {
    const scoped = await api.findSymbolByScopedName(reference.library, reference.name)
    if (scoped) return scoped
  } catch {
    // Fall through to a unique bare-name lookup when the emitted library points
    // at a re-exporting package instead of the defining package.
  }

  const matches = await api.findSymbolsByName(reference.name)
  if (matches.length === 1) {
    return api.loadSymbolById(matches[0]!.id)
  }

  return undefined
}

async function projectUtilityReferenceMembers(
  api: TastyApiRuntime,
  reference: RawTastyTypeReference,
  context: ProjectionContext
): Promise<TastyMember[] | undefined> {
  if (!reference.typeArguments?.length) return undefined

  switch (reference.name) {
    case 'Pretty':
      return projectPassthroughMembers(api, reference.typeArguments, context)
    case 'Omit':
      return projectOmitMembers(api, reference.typeArguments, context)
    case 'Pick':
      return projectPickMembers(api, reference.typeArguments, context)
    default:
      return undefined
  }
}

async function projectPassthroughMembers(
  api: TastyApiRuntime,
  typeArguments: RawTastyTypeRef[],
  context: ProjectionContext
): Promise<TastyMember[] | undefined> {
  const [first] = typeArguments
  if (!first) return undefined
  return projectTypeMembers(api, api.createTypeRef(first), context)
}

async function projectParametersIndexedAccessMembers(
  api: TastyApiRuntime,
  raw: Extract<RawTastyTypeRef, { kind: 'indexed_access' }>,
  context: ProjectionContext
): Promise<TastyMember[] | undefined> {
  if (!isTypeReference(raw.object)) return undefined
  if (raw.object.name !== 'Parameters') return undefined
  if (raw.index.kind !== 'literal' || raw.index.value !== '0') return undefined

  const [callableSource] = raw.object.typeArguments ?? []
  if (!callableSource) return undefined

  const callable = getTastyResolvedType(api.createTypeRef(callableSource)) ?? api.createTypeRef(callableSource)
  if (!callable.isCallable()) return undefined

  const firstParameter = callable.getParameters()[0]?.getType()
  if (!firstParameter) return undefined

  return projectTypeMembers(api, firstParameter, context)
}

/**
 * `interface X extends Omit<...>` encodes generics on heritage (expression + type arguments).
 * Project those utilities here so `flattenInterfaceMembers` does not need a manifest symbol for `Omit`/`Pick`.
 */
export async function projectMembersFromInterfaceExtends(
  api: TastyApiRuntime,
  symbol: TastySymbol
): Promise<TastyMember[]> {
  const raw = symbol.getRaw()
  if (!isInterfaceSymbol(raw)) return []

  const context: ProjectionContext = {
    visitedSymbolIds: new Set<string>([symbol.getId()]),
    depth: 0,
  }
  const out: TastyMember[] = []
  for (const ext of raw.extends) {
    if (!ext.typeArguments?.length) continue
    const ref: RawTastyTypeReference = {
      id: ext.id,
      name: ext.name,
      library: ext.library,
      typeArguments: ext.typeArguments,
    }
    const projected = await projectUtilityReferenceMembers(api, ref, context)
    if (projected?.length) out.push(...projected)
  }
  return out
}

async function projectOmitMembers(
  api: TastyApiRuntime,
  typeArguments: RawTastyTypeRef[],
  context: ProjectionContext
): Promise<TastyMember[] | undefined> {
  if (typeArguments.length !== 2) return undefined

  const baseMembers = await projectTypeMembers(
    api,
    api.createTypeRef(typeArguments[0]!),
    context
  )
  const keys = await collectProjectedKeys(
    api,
    api.createTypeRef(typeArguments[1]!),
    context
  )
  if (!baseMembers || !keys) return undefined

  return baseMembers.filter(member => !keys.has(member.getName()))
}

async function projectPickMembers(
  api: TastyApiRuntime,
  typeArguments: RawTastyTypeRef[],
  context: ProjectionContext
): Promise<TastyMember[] | undefined> {
  if (typeArguments.length !== 2) return undefined

  const baseMembers = await projectTypeMembers(
    api,
    api.createTypeRef(typeArguments[0]!),
    context
  )
  const keys = await collectProjectedKeys(
    api,
    api.createTypeRef(typeArguments[1]!),
    context
  )
  if (!baseMembers || !keys) return undefined

  return baseMembers.filter(member => keys.has(member.getName()))
}

async function collectProjectedKeys(
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
    if (context.depth > MAX_PROJECTION_DEPTH || context.visitedSymbolIds.has(raw.id)) {
      return undefined
    }

    const manifestEntry = api.getManifestEntry(raw.id)
    if (!manifestEntry) return undefined

    const symbol = await api.loadSymbolById(raw.id)
    const symbolRaw = symbol.getRaw()
    if (!isTypeAliasSymbol(symbolRaw)) return undefined

    const instantiated =
      instantiateTypeAliasDefinition(symbolRaw, raw.typeArguments) ??
      symbol.getUnderlyingType()?.getRaw()

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

export function isTypeParameterReference(reference: RawTastyTypeReference): boolean {
  return reference.id === reference.name && !reference.typeArguments?.length
}

async function projectRawTypeMembers(
  api: TastyApiRuntime,
  raw: RawTastyTypeRef,
  context: ProjectionContext
): Promise<TastyMember[] | undefined> {
  return projectTypeMembers(api, api.createTypeRef(raw), context)
}

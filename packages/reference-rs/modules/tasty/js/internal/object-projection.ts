/**
 * Projects object-like members from type aliases and interface heritage.
 * Expands aliases under their type arguments, merges intersections, applies Omit and Pick over known keys, and stops at recursive boundaries.
 * Every expansion runs on the caller's ProjectionContext and takes a step from its budget: the path ends cycles, and the budget ends any walk that grows.
 * Unprojectable shapes return undefined so callers fall back to the declared definition.
 */
import type {
  RawTastyStructuredTypeRef,
  RawTastyTypeRef,
  RawTastyTypeReference,
  TastyMember,
  TastySymbol,
  TastyTypeRef,
} from '../api-types.js'
import { dedupeTastyMembers } from '../members.js'
import { getTastyResolvedType } from '../resolution.js'
import {
  instantiateTypeAliasDefinition,
  instantiateTypeRef,
  type TypeSubstitutions,
} from './object-projection-instantiation.js'
import { collectProjectedKeys } from './object-projection-keys.js'
import {
  enterSymbol,
  isTypeParameterReference,
  loadReferencedSymbol,
  MAX_PROJECTION_DEPTH,
  type ProjectionContext,
  takeProjectionStep,
  withTypeParameterNames,
} from './object-projection-references.js'
import { isInterfaceSymbol, isTypeAliasSymbol, isTypeReference } from './shared.js'
import type { TastyApiRuntime } from './api-runtime.js'

export { isTypeParameterReference } from './object-projection-references.js'

/** A symbol's object-like members under the context its public entry built, so the whole call shares one path and budget. */
export async function projectObjectLikeMembers(
  api: TastyApiRuntime,
  symbol: TastySymbol,
  context: ProjectionContext
): Promise<TastyMember[] | undefined> {
  return projectSymbolMembers(api, symbol, context)
}

/** A symbol's members under `context`. The symbol joins the path; one already on the path projects to nothing. */
export async function projectSymbolMembers(
  api: TastyApiRuntime,
  symbol: TastySymbol,
  context: ProjectionContext
): Promise<TastyMember[] | undefined> {
  if (context.depth > MAX_PROJECTION_DEPTH) return undefined
  if (context.visitedSymbolIds.has(symbol.getId())) return []
  if (!takeProjectionStep(context)) return undefined

  const nextContext = enterSymbol(context, symbol.getId())

  const raw = symbol.getRaw()
  if (isInterfaceSymbol(raw)) {
    return dedupeTastyMembers(await api.flattenInterfaceUnder(symbol, nextContext))
  }

  if (isTypeAliasSymbol(raw)) {
    return projectTypeMembers(
      api,
      symbol.getUnderlyingType(),
      withTypeParameterNames(
        nextContext,
        raw.typeParameters?.map(param => param.name)
      )
    )
  }

  return undefined
}

/**
 * Display members of `symbol` for a walk in progress, as a type-parameter hook reads them: the path and budget carry in,
 * the walk's type parameters do not, as for a public call.
 */
export async function displayMembersWithin(
  api: TastyApiRuntime,
  symbol: TastySymbol,
  context: ProjectionContext
): Promise<TastyMember[]> {
  const projected = await projectSymbolMembers(api, symbol, {
    ...context,
    typeParameterNames: undefined,
  })
  return projected ?? []
}

/**
 * Members of an alias definition with its arguments bound. The alias joins the path, one level deeper, as it would
 * for a reference to it. Nothing in the definition is a parameter any more, so no type parameter is in scope.
 */
export async function projectInstantiatedAliasMembers(
  api: TastyApiRuntime,
  aliasId: string,
  definition: RawTastyTypeRef,
  context: ProjectionContext
): Promise<TastyMember[]> {
  const projected = await projectTypeMembers(api, api.createTypeRef(definition), {
    ...enterSymbol(context, aliasId),
    typeParameterNames: undefined,
  })
  return projected ?? []
}

async function projectTypeMembers(
  api: TastyApiRuntime,
  typeRef: TastyTypeRef | undefined,
  context: ProjectionContext
): Promise<TastyMember[] | undefined> {
  if (!typeRef || context.depth > MAX_PROJECTION_DEPTH) return undefined
  if (!takeProjectionStep(context)) return undefined

  const raw = concreteTypeRef(typeRef).getRaw()
  if (isTypeReference(raw)) {
    return projectReferenceMembers(api, raw, context)
  }
  return projectStructuredMembers(api, raw, context)
}

function concreteTypeRef(typeRef: TastyTypeRef): TastyTypeRef {
  return getTastyResolvedType(typeRef) ?? typeRef
}

async function projectStructuredMembers(
  api: TastyApiRuntime,
  raw: RawTastyStructuredTypeRef,
  context: ProjectionContext
): Promise<TastyMember[] | undefined> {
  switch (raw.kind) {
    case 'object':
      return raw.members.map(member => api.createMember(member))
    case 'indexed_access':
      return projectIndexedAccessMembers(api, raw, context)
    case 'intersection':
      return projectIntersectionMembers(api, raw.types, context)
    default:
      return undefined
  }
}

async function projectIndexedAccessMembers(
  api: TastyApiRuntime,
  raw: Extract<RawTastyTypeRef, { kind: 'indexed_access' }>,
  context: ProjectionContext
): Promise<TastyMember[] | undefined> {
  const parameterMembers = await projectParametersIndexedAccessMembers(api, raw, context)
  if (parameterMembers) return parameterMembers

  if (raw.resolved) {
    return projectTypeMembers(api, api.createTypeRef(raw.resolved), context)
  }

  return undefined
}

async function projectIntersectionMembers(
  api: TastyApiRuntime,
  types: RawTastyTypeRef[],
  context: ProjectionContext
): Promise<TastyMember[] | undefined> {
  const parts = await Promise.all(
    types.map(item => projectTypeMembers(api, api.createTypeRef(item), context))
  )
  const projectableParts = parts.filter((part): part is TastyMember[] => part != null)
  if (projectableParts.length === 0) return undefined
  return dedupeTastyMembers(projectableParts.flat())
}

async function projectReferenceMembers(
  api: TastyApiRuntime,
  reference: RawTastyTypeReference,
  context: ProjectionContext
): Promise<TastyMember[] | undefined> {
  const symbol = await loadReferencedSymbol(api, reference)
  if (!symbol) {
    return projectUnresolvedReferenceMembers(api, reference, context)
  }

  // Cycle-cut before following: the instantiated path below bypasses
  // projectSymbolMembers (which marks visited itself), so an alias cycle
  // would recurse forever without this guard.
  if (context.visitedSymbolIds.has(symbol.getId())) return []
  return projectLoadedReferenceMembers(api, symbol, reference, context)
}

async function projectLoadedReferenceMembers(
  api: TastyApiRuntime,
  symbol: TastySymbol,
  reference: RawTastyTypeReference,
  context: ProjectionContext
): Promise<TastyMember[] | undefined> {
  const raw = symbol.getRaw()
  if (isTypeAliasSymbol(raw)) {
    const instantiated = instantiateTypeAliasDefinition(raw, reference.typeArguments)
    if (instantiated) {
      return projectRawTypeMembers(api, instantiated, enterSymbol(context, symbol.getId()))
    }
  }

  return projectSymbolMembers(api, symbol, context)
}

async function projectUnresolvedReferenceMembers(
  api: TastyApiRuntime,
  reference: RawTastyTypeReference,
  context: ProjectionContext
): Promise<TastyMember[] | undefined> {
  const utilityProjection = await projectUtilityReferenceMembers(api, reference, context)
  if (utilityProjection) return utilityProjection

  if (isTypeParameterReference(reference, context)) {
    const projected = await context.projectTypeParameterMembers?.({
      api,
      reference,
      displayMembersOf: symbol => displayMembersWithin(api, symbol, context),
    })
    if (projected) return projected
    return []
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
    case 'Nested':
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
  if (!('kind' in raw.index) || raw.index.kind !== 'literal' || raw.index.value !== '0') {
    return undefined
  }

  const [callableSource] = raw.object.typeArguments ?? []
  if (!callableSource) return undefined

  const callable =
    getTastyResolvedType(api.createTypeRef(callableSource)) ??
    api.createTypeRef(callableSource)
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
  symbol: TastySymbol,
  substitutions: TypeSubstitutions,
  context: ProjectionContext
): Promise<TastyMember[]> {
  const raw = symbol.getRaw()
  if (!isInterfaceSymbol(raw)) return []

  const out: TastyMember[] = []
  for (const ext of raw.extends) {
    if (!ext.typeArguments?.length) continue
    const ref: RawTastyTypeReference = {
      id: ext.id,
      name: ext.name,
      library: ext.library,
      typeArguments: ext.typeArguments.map(argument =>
        instantiateTypeRef(argument, substitutions)
      ),
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

async function projectRawTypeMembers(
  api: TastyApiRuntime,
  raw: RawTastyTypeRef,
  context: ProjectionContext
): Promise<TastyMember[] | undefined> {
  return projectTypeMembers(api, api.createTypeRef(raw), context)
}

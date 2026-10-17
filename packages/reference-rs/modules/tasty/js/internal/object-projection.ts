/**
 * Typescript source file for Reference UI module.
 * Contains JS API logic and types.
 */
import type {
  RawTastyStructuredTypeRef,
  RawTastyTypeRef,
  RawTastyTypeReference,
  TastyMember,
  TastySymbol,
  TastyTypeParameterMemberProjector,
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
  isTypeParameterReference,
  loadReferencedSymbol,
  MAX_PROJECTION_DEPTH,
  type ProjectionContext,
  withTypeParameterNames,
} from './object-projection-references.js'
import { isInterfaceSymbol, isTypeAliasSymbol, isTypeReference } from './shared.js'
import type { TastyApiRuntime } from './api-runtime.js'

export { isTypeParameterReference } from './object-projection-references.js'

export async function projectObjectLikeMembers(
  api: TastyApiRuntime,
  symbol: TastySymbol,
  projectTypeParameterMembers?: TastyTypeParameterMemberProjector
): Promise<TastyMember[] | undefined> {
  return projectSymbolMembers(api, symbol, {
    visitedSymbolIds: new Set<string>(),
    depth: 0,
    projectTypeParameterMembers,
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
    projectTypeParameterMembers: context.projectTypeParameterMembers,
    typeParameterNames: context.typeParameterNames,
  }

  const raw = symbol.getRaw()
  if (isInterfaceSymbol(raw)) {
    return dedupeTastyMembers(await api.graph.flattenInterfaceMembers(symbol))
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
 * Members of a type that is already instantiated, such as an alias's definition with its arguments bound. Nothing
 * in it is a parameter any more, so it projects under an empty context.
 */
export async function projectInstantiatedTypeMembers(
  api: TastyApiRuntime,
  typeRef: RawTastyTypeRef
): Promise<TastyMember[]> {
  const projected = await projectTypeMembers(api, api.createTypeRef(typeRef), {
    visitedSymbolIds: new Set<string>(),
    depth: 0,
  })
  return projected ?? []
}

async function projectTypeMembers(
  api: TastyApiRuntime,
  typeRef: TastyTypeRef | undefined,
  context: ProjectionContext
): Promise<TastyMember[] | undefined> {
  if (!typeRef || context.depth > MAX_PROJECTION_DEPTH) return undefined

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
      return projectRawTypeMembers(api, instantiated, {
        visitedSymbolIds: new Set(context.visitedSymbolIds).add(symbol.getId()),
        depth: context.depth + 1,
        projectTypeParameterMembers: context.projectTypeParameterMembers,
        typeParameterNames: context.typeParameterNames,
      })
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
    const projected = await context.projectTypeParameterMembers?.({ api, reference })
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
  substitutions: TypeSubstitutions = new Map()
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

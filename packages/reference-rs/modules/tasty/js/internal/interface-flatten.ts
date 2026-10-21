/**
 * Flattens an interface's inherited and declared members.
 * Walks each extends clause under its type-argument bindings, projecting object-type aliases and recursing into parent interfaces.
 * Every step runs on the caller's ProjectionContext: its path of visited ids ends a cycle, and its step budget bounds the walk.
 */
import type { RawTastySymbolRef, RawTastyTypeRef, TastyMember, TastySymbol } from '../api-types.js'
import type { TastyApiRuntime } from './api-runtime.js'
import {
  projectInstantiatedAliasMembers,
  projectMembersFromInterfaceExtends,
  projectSymbolMembers,
} from './object-projection.js'
import {
  buildTypeSubstitutions,
  instantiateMember,
  instantiateTypeAliasDefinition,
  instantiateTypeRef,
  type TypeSubstitutions,
} from './object-projection-instantiation.js'
import {
  enterInterface,
  takeProjectionStep,
  type ProjectionContext,
} from './object-projection-references.js'
import { isInterfaceSymbol, isTypeAliasSymbol } from './shared.js'

/**
 * The members an interface inherits and declares, with its own type parameters bound to `substitutions`. Each
 * parent is flattened under the parameters its extends clause binds, so `extends Holder<number>` shows `number`
 * where `Holder` names `A`. The context's path holds the ids on the way down, so a cycle ends instead of recursing.
 */
export async function flattenInterfaceMembers(
  api: TastyApiRuntime,
  symbol: TastySymbol,
  substitutions: TypeSubstitutions,
  context: ProjectionContext
): Promise<TastyMember[]> {
  const raw = symbol.getRaw()
  if (!isInterfaceSymbol(raw)) return symbol.getMembers()

  const own = raw.members.map(member =>
    api.createMember(instantiateMember(member, substitutions))
  )
  // A spent budget still returns the declared members; only the inherited ones are cut.
  if (!takeProjectionStep(context)) return own

  const path = enterInterface(context, symbol.getId())
  const fromParents: TastyMember[] = []
  for (const ext of raw.extends) {
    const parent = await api.loadManifestSymbolRef(api.createSymbolRef(ext))
    if (!parent || path.visitedSymbolIds.has(parent.getId())) continue
    fromParents.push(...(await parentMembers(api, parent, ext, substitutions, path)))
  }

  const fromUtilities = await projectMembersFromInterfaceExtends(
    api,
    symbol,
    substitutions,
    path
  )
  return [...fromParents, ...fromUtilities, ...own]
}

/** A parent named by `ext`: an interface is flattened under the clause's bindings, an alias is projected. */
async function parentMembers(
  api: TastyApiRuntime,
  parent: TastySymbol,
  ext: RawTastySymbolRef,
  substitutions: TypeSubstitutions,
  context: ProjectionContext
): Promise<TastyMember[]> {
  if (!isInterfaceSymbol(parent.getRaw())) {
    return aliasParentMembers(api, parent, ext, substitutions, context)
  }
  const typeArguments = ext.typeArguments?.map(argument =>
    instantiateTypeRef(argument, substitutions)
  )
  const parentSubstitutions = buildTypeSubstitutions(
    parent.getTypeParameters(),
    typeArguments
  )
  return flattenInterfaceMembers(api, parent, parentSubstitutions, context)
}

/**
 * An object type alias named by an extends clause, with the clause's arguments bound to its parameters. Without
 * arguments, or when the definition cannot be instantiated, the alias is projected as declared, under the same path.
 */
async function aliasParentMembers(
  api: TastyApiRuntime,
  parent: TastySymbol,
  ext: RawTastySymbolRef,
  substitutions: TypeSubstitutions,
  context: ProjectionContext
): Promise<TastyMember[]> {
  const definition = boundAliasDefinition(parent, ext, substitutions)
  if (!definition) return (await projectSymbolMembers(api, parent, context)) ?? []
  return projectInstantiatedAliasMembers(api, parent.getId(), definition, context)
}

/** The alias definition with the clause's arguments bound; undefined when the clause gives none or the symbol is no alias. */
function boundAliasDefinition(
  parent: TastySymbol,
  ext: RawTastySymbolRef,
  substitutions: TypeSubstitutions
): RawTastyTypeRef | undefined {
  const raw = parent.getRaw()
  if (!ext.typeArguments?.length || !isTypeAliasSymbol(raw)) return undefined
  const typeArguments = ext.typeArguments.map(argument =>
    instantiateTypeRef(argument, substitutions)
  )
  return instantiateTypeAliasDefinition(raw, typeArguments)
}

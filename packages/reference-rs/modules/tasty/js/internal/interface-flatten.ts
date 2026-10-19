/**
 * Flattens an interface's inherited and declared members.
 * Walks each extends clause under its type-argument bindings, projecting object-type aliases and recursing into parent interfaces.
 * A path set of visited ids ends cycles instead of recursing.
 */
import type { RawTastySymbolRef, TastyMember, TastySymbol } from '../api-types.js'
import type { TastyApiRuntime } from './api-runtime.js'
import {
  projectInstantiatedTypeMembers,
  projectMembersFromInterfaceExtends,
} from './object-projection.js'
import {
  buildTypeSubstitutions,
  instantiateMember,
  instantiateTypeAliasDefinition,
  instantiateTypeRef,
  type TypeSubstitutions,
} from './object-projection-instantiation.js'
import { isInterfaceSymbol, isTypeAliasSymbol } from './shared.js'

/**
 * The members an interface inherits and declares, with its own type parameters bound to `substitutions`. Each
 * parent is flattened under the parameters its extends clause binds, so `extends Holder<number>` shows `number`
 * where `Holder` names `A`. `path` holds the ids on the way down, so a cycle ends instead of recursing.
 */
export async function flattenInterfaceMembers(
  api: TastyApiRuntime,
  symbol: TastySymbol,
  substitutions: TypeSubstitutions,
  path: Set<string>
): Promise<TastyMember[]> {
  const raw = symbol.getRaw()
  if (!isInterfaceSymbol(raw)) return symbol.getMembers()

  const fromParents: TastyMember[] = []
  for (const ext of raw.extends) {
    const parent = await api.loadManifestSymbolRef(api.createSymbolRef(ext))
    if (!parent || path.has(parent.getId())) continue
    fromParents.push(...(await parentMembers(api, parent, ext, substitutions, path)))
  }

  const fromUtilities = await projectMembersFromInterfaceExtends(
    api,
    symbol,
    substitutions
  )
  const own = raw.members.map(member =>
    api.createMember(instantiateMember(member, substitutions))
  )
  return [...fromParents, ...fromUtilities, ...own]
}

/** A parent named by `ext`: an interface is flattened under the clause's bindings, an alias is projected. */
async function parentMembers(
  api: TastyApiRuntime,
  parent: TastySymbol,
  ext: RawTastySymbolRef,
  substitutions: TypeSubstitutions,
  path: Set<string>
): Promise<TastyMember[]> {
  if (!isInterfaceSymbol(parent.getRaw())) {
    return aliasParentMembers(api, parent, ext, substitutions)
  }
  const typeArguments = ext.typeArguments?.map(argument =>
    instantiateTypeRef(argument, substitutions)
  )
  const parentSubstitutions = buildTypeSubstitutions(
    parent.getTypeParameters(),
    typeArguments
  )
  const parentPath = new Set(path).add(parent.getId())
  return flattenInterfaceMembers(api, parent, parentSubstitutions, parentPath)
}

/** An object type alias named by an extends clause, with the clause's arguments bound to its parameters. */
async function aliasParentMembers(
  api: TastyApiRuntime,
  parent: TastySymbol,
  ext: RawTastySymbolRef,
  substitutions: TypeSubstitutions
): Promise<TastyMember[]> {
  const raw = parent.getRaw()
  if (!ext.typeArguments?.length || !isTypeAliasSymbol(raw)) {
    return parent.getDisplayMembers()
  }
  const typeArguments = ext.typeArguments.map(argument =>
    instantiateTypeRef(argument, substitutions)
  )
  const definition = instantiateTypeAliasDefinition(raw, typeArguments)
  return definition
    ? projectInstantiatedTypeMembers(api, definition)
    : parent.getDisplayMembers()
}

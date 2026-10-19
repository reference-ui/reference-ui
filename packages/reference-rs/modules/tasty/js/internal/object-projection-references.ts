/**
 * Reference walking for object projection.
 * Walks type references during object projection: the walk context and its depth guard,
 * type-parameter bookkeeping, and loading the symbol a reference names.
 */
import type {
  RawTastyTypeReference,
  TastySymbol,
  TastyTypeParameterMemberProjector,
} from '../api-types.js'
import type { TastyApiRuntime } from './api-runtime.js'

export const MAX_PROJECTION_DEPTH = 32

export interface ProjectionContext {
  visitedSymbolIds: Set<string>
  depth: number
  projectTypeParameterMembers?: TastyTypeParameterMemberProjector
  typeParameterNames?: Set<string>
}

export function withTypeParameterNames(
  context: ProjectionContext,
  names: string[] | undefined
): ProjectionContext {
  if (!names?.length) return context
  return {
    ...context,
    typeParameterNames: new Set([...(context.typeParameterNames ?? []), ...names]),
  }
}

export async function loadReferencedSymbol(
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

export function isTypeParameterReference(
  reference: RawTastyTypeReference,
  context: Pick<ProjectionContext, 'typeParameterNames'>
): boolean {
  return (
    reference.id === reference.name &&
    !reference.typeArguments?.length &&
    context.typeParameterNames?.has(reference.name) === true
  )
}

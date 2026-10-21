/**
 * Reference walking for object projection.
 * Walks type references during object projection: the walk context with its depth guard and step budget,
 * type-parameter bookkeeping, and loading the symbol a reference names. One public call builds one context, and every
 * projection it starts carries that context's path, so a symbol revisited on the path ends the walk and the budget
 * ends any walk that keeps growing without repeating a symbol. Each walk limit that drops members, the step budget or
 * the depth guard, raises a notice on the call's record; the call reports `truncated` and those notices, and consumers
 * attach one TST-W-PROJECTION-BUDGET warning per notice, built by projectionBudgetWarning.
 */
import type {
  RawTastyDiagnostic,
  RawTastyTypeReference,
  TastySymbol,
  TastyTypeParameterMemberProjector,
  TastyTypeRef,
} from '../api-types.js'
import { getTastyResolvedType } from '../resolution.js'
import type { TastyApiRuntime } from './api-runtime.js'
import { isTypeReference } from './shared.js'

export const MAX_PROJECTION_DEPTH = 32
export const MAX_PROJECTION_STEPS = 10_000

/**
 * The walk limits one public call shares: the steps it may still take, and the notices its walk has raised. The step
 * budget and the depth guard both raise here, each notice once, and `publish` passes every new notice on to the api-wide
 * runtime notices. The record is shared by reference across every context the call derives.
 */
export interface ProjectionBudget {
  remaining: number
  symbolName: string
  notices: string[]
  publish: (notice: string) => void
}

export interface ProjectionContext {
  visitedSymbolIds: Set<string>
  depth: number
  projectTypeParameterMembers?: TastyTypeParameterMemberProjector
  typeParameterNames?: Set<string>
  budget: ProjectionBudget
}

export function createProjectionBudget(
  symbolName: string,
  publish: (notice: string) => void
): ProjectionBudget {
  return { remaining: MAX_PROJECTION_STEPS, symbolName, notices: [], publish }
}

/** Raises a notice on the call's record once: a repeat of the same text adds nothing. */
export function raiseProjectionNotice(budget: ProjectionBudget, notice: string): void {
  if (budget.notices.includes(notice)) return
  budget.notices.push(notice)
  budget.publish(notice)
}

/**
 * Takes one step from the call's budget. Returns false once the budget is spent; the caller then stops expanding
 * and returns what it has, so the walk ends with a partial result and one notice.
 */
export function takeProjectionStep(context: ProjectionContext): boolean {
  const { budget } = context
  if (budget.remaining > 0) {
    budget.remaining -= 1
    return true
  }
  raiseProjectionNotice(budget, budgetExhaustedNotice(budget.symbolName))
  return false
}

/**
 * The depth guard drops a symbol, or a type the walk would expand, once the walk is past the cap, and returns undefined
 * as that drop does. The drop is a walk limit and is recorded on the call, except for a reference back to a symbol already
 * on the path: the walk holds that symbol's members, so the drop loses nothing.
 */
export function cutAtDepth(context: ProjectionContext, dropped: string | TastyTypeRef): undefined {
  const repeatOfId = typeof dropped === 'string' ? dropped : referencedSymbolId(dropped)
  if (repeatOfId === undefined || !context.visitedSymbolIds.has(repeatOfId)) {
    raiseProjectionNotice(context.budget, depthExhaustedNotice(context.budget.symbolName))
  }
  return undefined
}

/** The type with its resolution applied, as a walk expands it. */
export function concreteTypeRef(typeRef: TastyTypeRef): TastyTypeRef {
  return getTastyResolvedType(typeRef) ?? typeRef
}

/** The symbol a type reference names, once resolved; undefined for any other type. */
function referencedSymbolId(typeRef: TastyTypeRef): string | undefined {
  const raw = concreteTypeRef(typeRef).getRaw()
  return isTypeReference(raw) ? raw.id : undefined
}

export function budgetExhaustedNotice(symbolName: string): string {
  return `Member projection of "${symbolName}" stopped after ${MAX_PROJECTION_STEPS} steps; inherited members past that point may be omitted.`
}

export function depthExhaustedNotice(symbolName: string): string {
  return `Member projection of "${symbolName}" stopped at nesting depth ${MAX_PROJECTION_DEPTH}; members of types nested past that point may be omitted.`
}

/** The code every walk-limit notice carries. Minted in this module; REGISTRY.md holds its row. */
const PROJECTION_BUDGET_CODE = 'TST-W-PROJECTION-BUDGET'

/**
 * The warning a consumer attaches to a result it presents, one per notice that result's walk raised. The notice names
 * the symbol and the limit; when the consumer names a subject (a component, say) the warning leads with that subject.
 */
export function projectionBudgetWarning(notice: string, subject?: string): RawTastyDiagnostic {
  return {
    severity: 'warning',
    code: PROJECTION_BUDGET_CODE,
    message: subject === undefined ? notice : `${subject}: ${notice}`,
  }
}

/** The context a projection of `symbolId` runs under: the path gains the symbol and the depth rises by one. */
export function enterSymbol(context: ProjectionContext, symbolId: string): ProjectionContext {
  return {
    ...context,
    visitedSymbolIds: new Set(context.visitedSymbolIds).add(symbolId),
    depth: context.depth + 1,
  }
}

/**
 * The context an interface's members are read under: the path gains the interface, and no type parameter of an
 * enclosing alias is in scope, since an interface's own members never refer to them.
 */
export function enterInterface(context: ProjectionContext, symbolId: string): ProjectionContext {
  return {
    ...context,
    visitedSymbolIds: new Set(context.visitedSymbolIds).add(symbolId),
    typeParameterNames: undefined,
  }
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

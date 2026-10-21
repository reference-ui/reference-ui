/**
 * Reference walking for object projection.
 * Walks type references during object projection: the walk context with its depth guard and step budget,
 * type-parameter bookkeeping, and loading the symbol a reference names. One public call builds one context, and every
 * projection it starts carries that context's path, so a symbol revisited on the path ends the walk and the budget
 * ends any walk that keeps growing without repeating a symbol. A walk the budget cut short is reported per call as
 * `truncated`, and consumers attach the TST-W-PROJECTION-BUDGET warning built by projectionBudgetWarning.
 */
import type {
  RawTastyDiagnostic,
  RawTastyTypeReference,
  TastySymbol,
  TastyTypeParameterMemberProjector,
} from '../api-types.js'
import type { TastyApiRuntime } from './api-runtime.js'

export const MAX_PROJECTION_DEPTH = 32
export const MAX_PROJECTION_STEPS = 10_000

/**
 * Steps one public call may still take. It is shared by reference: every context a call derives draws on the same
 * count, and `onExhausted` runs once, the first time a step is refused.
 */
export interface ProjectionBudget {
  remaining: number
  reported: boolean
  onExhausted: () => void
}

export interface ProjectionContext {
  visitedSymbolIds: Set<string>
  depth: number
  projectTypeParameterMembers?: TastyTypeParameterMemberProjector
  typeParameterNames?: Set<string>
  budget: ProjectionBudget
}

export function createProjectionBudget(onExhausted: () => void): ProjectionBudget {
  return { remaining: MAX_PROJECTION_STEPS, reported: false, onExhausted }
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
  if (!budget.reported) {
    budget.reported = true
    budget.onExhausted()
  }
  return false
}

export function budgetExhaustedNotice(symbolName: string): string {
  return `Member projection of "${symbolName}" stopped after ${MAX_PROJECTION_STEPS} steps; inherited members past that point may be omitted.`
}

/** The code a display projection that the step budget cut short carries. Minted in this module; REGISTRY.md holds its row. */
const PROJECTION_BUDGET_CODE = 'TST-W-PROJECTION-BUDGET'

/**
 * The warning a consumer attaches to a result it presents when that result's projection was cut short. It states the
 * same notice the runtime keeps, and when the consumer names a subject (a component, say) it leads with that subject.
 */
export function projectionBudgetWarning(symbolName: string, subject?: string): RawTastyDiagnostic {
  const notice = budgetExhaustedNotice(symbolName)
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

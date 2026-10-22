/**
 * Vendored tasty declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so core typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/tasty/js/internal/object-projection-references.d.ts
 * Regen: cd packages/reference-core && node tools/vendor-rust-tasty-dts.mjs
 */

/**
 * Reference walking for object projection.
 * Walks type references during object projection: the walk context with its depth guard and step budget,
 * type-parameter bookkeeping, and loading the symbol a reference names. One public call builds one context, and every
 * projection it starts carries that context's path, so a symbol revisited on the path ends the walk and the budget
 * ends any walk that keeps growing without repeating a symbol. Each walk limit that drops members, the step budget or
 * the depth guard, raises a notice on the call's record; the call reports `truncated` and those notices, and consumers
 * attach one TST-W-PROJECTION-BUDGET warning per notice, built by projectionBudgetWarning.
 */
import type { RawTastyDiagnostic, RawTastyTypeReference, TastySymbol, TastyTypeParameterMemberProjector, TastyTypeRef } from '../api-types.js';
import type { TastyApiRuntime } from './api-runtime.js';
export declare const MAX_PROJECTION_DEPTH = 32;
export declare const MAX_PROJECTION_STEPS = 10000;
/**
 * The walk limits one public call shares: the steps it may still take, and the notices its walk has raised. The step
 * budget and the depth guard both raise here, each notice once, and `publish` passes every new notice on to the api-wide
 * runtime notices. The record is shared by reference across every context the call derives.
 */
export interface ProjectionBudget {
    remaining: number;
    symbolName: string;
    notices: string[];
    publish: (notice: string) => void;
}
export interface ProjectionContext {
    visitedSymbolIds: Set<string>;
    depth: number;
    projectTypeParameterMembers?: TastyTypeParameterMemberProjector;
    typeParameterNames?: Set<string>;
    budget: ProjectionBudget;
}
export declare function createProjectionBudget(symbolName: string, publish: (notice: string) => void): ProjectionBudget;
/** Raises a notice on the call's record once: a repeat of the same text adds nothing. */
export declare function raiseProjectionNotice(budget: ProjectionBudget, notice: string): void;
/**
 * Takes one step from the call's budget. Returns false once the budget is spent; the caller then stops expanding
 * and returns what it has, so the walk ends with a partial result and one notice.
 */
export declare function takeProjectionStep(context: ProjectionContext): boolean;
/**
 * The depth guard drops a symbol, or a type the walk would expand, once the walk is past the cap, and returns undefined
 * as that drop does. The drop is a walk limit and is recorded on the call, except for a reference back to a symbol already
 * on the path: the walk holds that symbol's members, so the drop loses nothing.
 */
export declare function cutAtDepth(context: ProjectionContext, dropped: string | TastyTypeRef): undefined;
/** The type with its resolution applied, as a walk expands it. */
export declare function concreteTypeRef(typeRef: TastyTypeRef): TastyTypeRef;
export declare function budgetExhaustedNotice(symbolName: string): string;
export declare function depthExhaustedNotice(symbolName: string): string;
/**
 * The warning a consumer attaches to a result it presents, one per notice that result's walk raised. The notice names
 * the symbol and the limit; when the consumer names a subject (a component, say) the warning leads with that subject.
 */
export declare function projectionBudgetWarning(notice: string, subject?: string): RawTastyDiagnostic;
/** The context a projection of `symbolId` runs under: the path gains the symbol and the depth rises by one. */
export declare function enterSymbol(context: ProjectionContext, symbolId: string): ProjectionContext;
/**
 * The context an interface's members are read under: the path gains the interface, and no type parameter of an
 * enclosing alias is in scope, since an interface's own members never refer to them.
 */
export declare function enterInterface(context: ProjectionContext, symbolId: string): ProjectionContext;
export declare function withTypeParameterNames(context: ProjectionContext, names: string[] | undefined): ProjectionContext;
export declare function loadReferencedSymbol(api: TastyApiRuntime, reference: RawTastyTypeReference): Promise<TastySymbol | undefined>;
export declare function isTypeParameterReference(reference: RawTastyTypeReference, context: Pick<ProjectionContext, 'typeParameterNames'>): boolean;

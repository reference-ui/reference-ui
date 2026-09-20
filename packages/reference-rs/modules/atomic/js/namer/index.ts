/**
 * Runtime namer entry: one authored declaration to slot/className pairs.
 * Composes `name()` over the P9 build in `shape.ts`, mirroring the compiler
 * namer `PlanBuilder::resolve_entry` through `class_name_with_system`, and
 * re-exports every golden function plus `NAMER_RULES_VERSION`, which must
 * equal the tables' `rulesVersion` or `registerRuntimeData` refuses the pair.
 * Pins golden `16-name.json`. Leaf entry: sibling plus type-only imports, so
 * the `./namer` subpath bundles for the browser with no N-API on its graph.
 */
import type { NamerTables } from '../../../../contracts/types.js'
import { shape, type NamerDeclaration, type NamerRequest } from './shape.js'

export { asciiLower, isStructuralWhitespace, parseDecimal, renderDecimal, sanitizeValue, trimStructural } from './lexical.js'
export type { ParseVerdict } from './lexical.js'
export { canonNumeric, canonicalProp, collapseWhitespace, scalarStem, splitImportant } from './value.js'
export type { NamerValue, StemVerdict } from './value.js'
export { classifyBorder, expandBorder, isGlobalKeyword, isWholeBorderValue, splitTokens } from './shorthand.js'
export type { BorderClassification } from './shorthand.js'
export { hasParentReference, lowerCondition } from './when.js'
export type { LoweredCondition } from './when.js'
export { deriveSlot, deriveSlotParts } from './slot.js'
export { interpretLowering } from './lower.js'
export type { LoweredPair } from './lower.js'
export { shape } from './shape.js'
export type { NamerDeclaration, NamerRequest } from './shape.js'
export { reportMissCandidates } from './miss.js'
export type { MissCandidate } from './miss.js'

/** Naming-rules version both namers pin; bump whenever a rule changes a class. */
export const NAMER_RULES_VERSION = 2

/**
 * Spell one authored declaration to slot/className pairs: shaping, lowering,
 * conditions, then the join. `system` qualifies the class (`sys__stem`);
 * empty spells the bare stem.
 */
export function name(
  request: NamerRequest,
  tables: NamerTables,
  system = ''
): NamerDeclaration[] {
  return shape(request, tables, system)
}

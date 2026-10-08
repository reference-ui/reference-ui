// S2 adapter surface: it takes the runtime provider, document hook, default
// runtime factory, type-parameter formatter, and document types and emits the
// `@reference-ui/types` contract the generated presentation mirror consumes.
// Narrow on purpose — the mirror imports this file, never the barrel.
// (Seam S2 of the Objective 1 cartography; mirrored lib files resolve here.)

export { ReferenceRuntimeProvider, useReferenceDocumentFromContext } from './ReferenceRuntimeContext.tsx'
export { createDefaultReferenceRuntime } from './Runtime.ts'
export { formatReferenceTypeParameter } from '../browser-model/index.ts'
export type * from './types.ts'
// Browser barrel: it takes the runtime, provider, hooks, shell factory, model
// formatter, and document types and emits the `@reference-ui/types` module
// surface the bundle entry composes. It never re-exports presentation; the
// entry wires mirror views into the factory and owns the `Reference` singleton.

export { createReferenceComponent } from './Reference.tsx'
export type { ReferenceViews } from './Reference.tsx'
export {
  createDefaultReferenceRuntime,
  createReferenceRuntime,
  useReferenceDocument,
} from './Runtime.ts'
export type {
  ReferenceDocumentState,
  ReferenceRuntime,
  ReferenceRuntimeData,
} from './Runtime.ts'
export {
  ReferenceRuntimeProvider,
  useReferenceDocumentFromContext,
  useReferenceRuntime,
} from './ReferenceRuntimeContext.tsx'
export { formatReferenceTypeParameter } from '../browser-model/index.ts'
export type * from './types.ts'

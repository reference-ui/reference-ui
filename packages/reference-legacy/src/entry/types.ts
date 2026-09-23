/**
 * @reference-ui/types entry — barrel only. Implementation lives in `reference/browser`.
 *
 * The packager bundles this into `types.mjs`; `__REFERENCE_UI_TYPES_RUNTIME__` is
 * rewritten in postprocess. Panda still scans mirrored `_reference-component` sources.
 *
 * This entry is for reference runtime/component types; system authoring types
 * live on `@reference-ui/system`.
 */

export { Reference, createReferenceComponent } from '../reference/browser'
export {
  createDefaultReferenceRuntime,
  createReferenceRuntime,
  formatReferenceTypeParameter,
  ReferenceRuntimeProvider,
  useReferenceDocument,
  useReferenceDocumentFromContext,
  useReferenceRuntime,
} from '../reference/browser'
export type {
  ReferenceDocumentState,
  ReferenceRuntime,
  ReferenceRuntimeData,
} from '../reference/browser/Runtime'
export type * from '../reference/browser/types'

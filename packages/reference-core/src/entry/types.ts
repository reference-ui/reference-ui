/**
 * @reference-ui/types entry — barrel only. Implementation lives in `reference/browser`
 * (including the Tasty runtime + `Reference` wiring in `Reference.ts`).
 *
 * The packager bundles this into `types.mjs`; `__REFERENCE_UI_TYPES_RUNTIME__` is
 * rewritten in postprocess. Panda still scans mirrored `_reference-component` sources.
 */

export { Reference } from '../reference/browser'
export type { ReferenceProps } from '../reference/browser'

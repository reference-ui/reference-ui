// Neo react source entry behind the @reference-ui/react bootstrap alias.
// It takes the primitives barrel plus the style runtime and emits the
// fragment-eval surface: every primitive plus css and recipe. This mirrors
// core's src/entry/react.ts line for line; the generated react.mjs stays the
// consumer artifact, so this file never carries its react-dom/client edge.

// Core's third line (export type * from '../types') has no equivalent: it is
// type-only, so esbuild erases it before evaluation, and no consumer
// typechecks against this file — Neo types ship per-system generated.
export * from '../primitives/index.ts'
export { css, recipe } from '../runtime/index.ts'

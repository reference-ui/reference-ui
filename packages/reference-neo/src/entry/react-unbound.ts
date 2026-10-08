// Fragment-eval react surface backed by the unbound E2 roster.
// It takes the live workspace primitives surface plus the Neo style runtime
// and emits every primitive unbound plus css and recipe. Fragment evaluation
// never renders and unbound primitives throw on render, so the eval-safe
// barrel contract holds by construction; the bound per-system bake arrives
// through the packager instead. Bootstrap resolves this file as a path
// string for fragment eval, and the root tsconfig aliases the react id at
// it for the pre-run typecheck, so worlds typecheck against the same
// unbound surface fragments evaluate.

// The E2 leg ships live from the workspace package (never copied, never
// tree-relative: no relative hop survives src vs dist vs packed depths and
// the packed tree has no reference-rs). The built primitives surface carries
// the same roster (configurePrimitives + 101 unbound) in every layout.
export * from '@reference-ui/rust/primitives'
export { css, recipe } from '../runtime/index.ts'
// The css input type rides the value import: app code names CssStyles
// through the react id, and the bound bake re-exports it the same way.
export type { CssStyles } from '../runtime/index.ts'

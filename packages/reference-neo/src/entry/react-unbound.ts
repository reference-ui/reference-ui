// Fragment-eval react surface backed by the unbound E2 roster.
// It takes the live workspace primitives surface plus the Neo style runtime
// and emits every primitive unbound plus css and recipe. Fragment evaluation
// never renders and unbound primitives throw on render, so the eval-safe
// barrel contract holds by construction; the bound per-system bake arrives
// through the packager instead. Bootstrap resolves this file as a path
// string, never as a typechecked import.

// The E2 leg ships live from the workspace package (never copied, never
// tree-relative: no relative hop survives src vs dist vs packed depths and
// the packed tree has no reference-rs). The built primitives surface carries
// the same roster (configurePrimitives + 101 unbound) in every layout.
export * from '@reference-ui/rust/primitives'
export { css, recipe } from '../runtime/index.ts'

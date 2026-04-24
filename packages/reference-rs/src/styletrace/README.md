# Styletrace

`styletrace` answers two related questions for Reference UI:

- which prop names count as Reference style props
- which exported JSX components keep those style props connected to Reference
	primitives or to the same Reference runtime style pipeline

## Layout

- `mod.rs` — thin public entry point and re-exports
- `resolver/` — Oxc-driven type expansion for `StyleProps` and related aliases
- `analysis/` — JSX wrapper tracing built on top of the resolver surface
- `tests/` — Rust tests split by concern instead of one large test file

## Design Rules

- keep the public API stable and small
- keep parsing / resolution / graph traversal separate
- put module-level documentation close to the code it describes
- prefer Rust tests for semantic coverage, with JS tests as integration coverage

## FAQ

### How do we know a component is a Reference primitive?

We do not guess from names alone and we do not maintain a second handwritten
primitive registry inside `styletrace`.

Instead, `styletrace` reads the primitive source of truth from the synced
primitive declaration surface at `.reference-ui/react/system/primitives/index.d.mts`.

That gives us the canonical primitive JSX surface such as `Div`, `Span`, `Svg`,
and the rest of the generated primitive set. In other words, a component counts
as a Reference primitive when it resolves back to that generated primitive
surface, not merely because it happens to be PascalCase.

### How do we know what style props are?

We treat the public synced `StyleProps` type as the source of truth.

The resolver starts at `.reference-ui/react/types/style-props.d.mts` and uses
Oxc to expand that type surface through imports, re-exports, intersections,
mapped types, indexed accesses, and a small set of utility wrappers used by the
Reference type system.

The output of that pass is a concrete set of prop names such as `color`, `bg`,
`fontSize`, `padding`, and the rest of the Reference style surface. This keeps
`styletrace` aligned with authoring types instead of relying on a parallel list
or name heuristics.

### How do we know when a component wraps a Reference primitive and passes style props to it?

This is a two-step check:

1. the component must expose Reference style props at its public boundary
2. those style props must continue through the component body into a Reference
	 primitive, into another wrapper that eventually resolves to a Reference
	 primitive, or into the same `splitCssProps` / `box` / `css` runtime pipeline

The analyzer parses TS and TSX with Oxc, records exported components, inspects
their first-parameter bindings and type annotations, and checks whether that
public boundary exposes any of the resolved `StyleProps` names.

Then it walks the JSX tree and forwarding edges:

- direct prop forwarding such as `color={color}`
- rest/spread forwarding such as `{...props}` or `{...rest}`
- local wrapper chains
- re-export and alias chains
- namespace imports such as `import * as Ref from '@reference-ui/react'`
- default exports and default-import consumers
- `export *` barrels, including package barrels
- direct style-pipeline usage such as `splitCssProps`, `box`, and `css`
- factory-produced components whose returned component still exposes Reference
	style props and feeds that same pipeline

If style-bearing props remain connected to a Reference primitive or to the same
Reference runtime style pipeline at the far end of that chain, the wrapper
component becomes a style-bearing JSX boundary and is returned by `styletrace`.

That is the key rule: we are not asking whether a component looks like a
primitive. We are asking whether style props exposed at that component boundary
actually flow into the Reference primitive/style pipeline.

### How do we make sure we can detect Reference-primitive wrappers that come from other libraries or from `node_modules`?

The general method is the same as for local code, but import resolution has to
extend beyond relative files.

For local workspace code, `styletrace` already follows relative imports,
re-exports, wrapper chains, and style-pipeline helpers across files. For
external libraries, `styletrace` now uses the shared package-resolution path to
resolve package specifiers from the importing module and continue that same
analysis through installed dependencies as well.

Concretely, that means:

- resolve package imports from `package.json` `exports`, `types`, `typings`,
	`module`, and `main`
- resolve package subpaths, not just package roots
- follow wrappers through installed dependencies and library barrels
- follow namespace imports, default exports, and `export *` fan-out through
	package entrypoints when those shapes preserve the same style contract
- follow factory-produced exports and style-pipeline helpers through imported
	modules
- allow discovery of style-bearing components that live in `node_modules` when
	they remain connected to Reference primitives or to the same style pipeline

That package-resolution path is the right production direction because the JSX
surface we care about is cross-package by nature. If `reference-icons`, a local
design-system package, or another dependency exports a wrapper that exposes
Reference style props and forwards them into Reference primitives, `styletrace`
should be able to treat that wrapper as part of the same style-bearing JSX
surface.

So the rule is still the same:

- primitive identity comes from Reference Core
- style-prop identity comes from `StyleProps`
- wrapper detection comes from actual prop flow
- package support comes from extending that same analysis through dependency
	import resolution rather than inventing a separate registry
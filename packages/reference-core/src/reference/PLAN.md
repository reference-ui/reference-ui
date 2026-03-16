# Reference Module Plan

## Goal

Create a new `src/reference` module in `reference-core` that becomes the home
for documentation-oriented reference rendering.

The first use case is **API tables**:

- prop tables
- function parameter tables
- return-value summaries
- enum / variant listings
- symbol metadata tables derived from Tasty

Tasty already gives us the normalized metadata shape we need.
This module should own the **actual rendering layer** for docs-facing reference
UI on top of that metadata.

## Why Start Here

We now have Tasty in good shape as the metadata source.
The next question is not "can we load symbol metadata?" but "how do we turn it
into first-class docs UI?"

API tables are the first practical answer because they:

- exercise Tasty symbol/member/type access in a real way
- give `reference-docs` a concrete render target
- force us to define a small but real presentation system
- avoid overcommitting to full prose docs generation too early

## Module Responsibilities

`src/reference` should eventually own:

- Tasty-backed docs components for reference content
- a dedicated reference worker for Tasty-driven docs generation
- API table rendering using our generated primitives
- a small set of scoped reference tokens
- Tasty-to-view-model adapters where needed
- light formatting for docs-specific cells like types and links

It should not initially own:

- Rspress page composition
- search indexing
- sidebar/navigation concerns
- broad docs-site orchestration

Those are adjacent concerns around the reference UI, not the reference UI
itself.

## Phase 1 Scope

The initial scaffold should stay intentionally small:

1. Create the module directory and index surface.
2. Add a dedicated `reference` worker scaffold.
3. Make that worker read from the virtual FS rather than raw source paths.
4. Point Tasty at the virtual FS so docs generation sees transformed source.
5. Start with API-table rendering as the first concrete component family.
6. Build it with our generated primitives, not raw HTML.
7. Define a minimal scoped token set for reference-only styling.
8. Keep the visual design intentionally black-and-white and low-decoration.

That is enough to let us prototype API-table flows without prematurely freezing
the public package API.

## Proposed Initial Shape

The initial implementation should probably center on:

- `Reference.API`
- `ReferenceTable`
- `ReferenceTableHeader`
- `ReferenceTableRow`
- `ReferenceTypeInline`
- `ReferenceSymbolLink`
- `referenceTokens`
- `reference/worker`

The underlying data may still use small local table types, but the important
thing is that this module owns the renderable components, not just the data
contract.

## First Real Output

The first implementation should answer:

- how does the reference worker build against `.reference-ui/virtual`?
- how does it configure Tasty to read the virtual tree rather than raw source?
- given a Tasty symbol, what API table should we render?
- how do we flatten members into renderable rows?
- how do we present type, optionality, defaults, and description?
- how do inherited members appear in a way that still feels simple?
- how do linked symbols render using our primitives?

That likely means a first pass shaped around functions like:

- `Reference.API`
- `createApiTableFromSymbol()`
- `renderApiTable()`
- or `ApiTable`

The exact names can wait until we touch the first implementation.

## Worker Direction

Reference should have its own worker, separate from the Panda/system workers.

Its job is to:

- read from `.reference-ui/virtual`
- resolve the virtual root from the current project
- point Tasty at the virtual filesystem inputs
- build reference-ready docs artifacts from transformed source

This matters because docs should reflect the same transformed module graph that
the rest of the pipeline sees, not a separate raw-source view of the world.

At the API level, the worker should eventually support:

- full reference build after virtual sync
- targeted symbol or page builds later if watch-mode granularity matters

The first version can stay simple and focus on the full build path.

## Main Component Direction

The main component exported from this module should be `Reference.API`.

The intended first-use shape is:

```tsx
<Reference.API name="ButtonProps" />
```

That component should:

- accept a symbol `name`
- load or receive the corresponding Tasty-backed reference data
- render the default API-table view for that symbol
- stay visually minimal in the first version

## Visual Direction

For now, the visual rules should stay very restrained:

- black and white only
- minimal borders
- minimal spacing system
- no decorative chrome
- no heavy component taxonomy

The goal is to make the first table set feel sharp, readable, and obviously
usable before we add richer theming.

## Styling Rules

Reference styling should come from a small scoped token set owned by
`src/reference`, not from ad hoc inline values scattered across components.

That token set should initially cover only what the first tables need, likely:

- foreground text
- muted text
- border color
- background color
- row spacing / cell padding
- monospace treatment for code-like text

## Open Design Questions

1. How much of the view model should live directly in the component props versus
   in separate Tasty adapter helpers?
2. Do we want one `ApiTable` component with variants, or separate components for
   props, params, returns, and variants?
3. Should `Reference.API` resolve data internally from `name`, or should it also
   accept preloaded symbol/reference data for server-driven flows?
4. Where should formatting live for rich cells like linked types and inline
   code?
5. How much source-level information should come from Tasty versus separate docs
   annotations or JSDoc extraction?
6. Should rows get stable IDs for linking, expansion, or future interactive
   behavior?

## Likely Next Files

Once the first consumer work starts, likely additions are:

- `src/reference/api.tsx`
- `src/reference/api-table.ts`
- `src/reference/api-table.tsx`
- `src/reference/from-tasty.ts`
- `src/reference/tokens.ts`
- `src/reference/init.ts`
- `src/reference/worker.ts`
- `src/reference/events.ts`
- `src/reference/format.ts`
- `src/reference/*.test.ts`

We should only add these after the first real table pipeline is clearer.

## Success Criteria

We are in a good first-use-case state when:

- the reference worker reads from the virtual FS
- Tasty is pointed at virtualized source, not raw source
- a Tasty symbol can be turned directly into a rendered API table
- `Reference.API` can render a symbol by `name`
- the UI is built from our generated primitives
- the styling is scoped, minimal, and black-and-white
- the module boundary is still clean and small
- we have direct tests for both shaping and rendering logic
- the result is good enough to drop into docs without extra wrapper work

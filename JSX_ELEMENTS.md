# Last milestone: dynamic JSX names for Panda extraction

This milestone is the **symphony** moment for Reference UI: we align **authoring types** (what users can pass), **runtime** (`splitCssProps`, `box`, primitives), and **Panda’s static extractor** (what CSS must exist) without asking humans to maintain a hand-curated list of “scan these JSX tags.”

Today, Panda’s extended **box** pattern is wired with a fixed `jsx` list: the generated primitive names (`PRIMITIVE_JSX_NAMES` from `packages/reference-core/src/system/primitives/tags.ts`). Anything else—user wrappers, icons, design-system shells—can **implement** the same style surface at runtime and still **fail extraction** if its JSX tag never appears on that list.

This document defines **how we decide which JSX names Panda should scan**, using our Rust analysis stack, and why that unlocks seamless extension of Reference UI.

---

## Goal

**Produce the set of JSX identifiers** (PascalCase component names as written in user source) that must appear on `patterns.extend.box.jsx` (or an equivalent merged config) so Panda’s extractor treats their props as the same style-bearing surface as `Div`, `Span`, etc.

That set is **not** “every component in the app.” It is **only** components that **actually participate** in the Reference style prop contract.

The job of this subsystem is intentionally narrow:

> create one derived list of JSX component names that are tied to Reference primitives through style-prop flow

It is not trying to become a general component inventory or a full type/introspection system.

---

## The problem we need to solve

Today the Panda scan surface is **static**, but the real Reference UI style surface is **not**.

The current box pattern extension in `packages/reference-core/src/system/panda/config/extensions/api/extendPatterns.ts` always emits:

```ts
jsx: [...PRIMITIVE_JSX_NAMES]
```

Those names come from `packages/reference-core/src/system/primitives/tags.ts`.

That means Panda reliably extracts styles for `Div`, `Span`, `Svg`, and the rest of the generated primitive set, but it does **not** automatically know about higher-level components that still participate in the exact same style-prop contract.

This is the gap:

- a component can accept Reference style props
- a component can pass those style props down into primitives or the same box/css pipeline
- runtime can behave correctly
- but Panda can still miss extraction because the component’s JSX name is not on the scan list

The harder requirement is that this cannot stop at a single local component body. To solve the extraction problem correctly, we need to respect the full component chain across wrappers, re-exports, and package boundaries.

For example, if `reference-icons` is imported into `reference-lib`, and `reference-lib` is then imported into `reference-docs`, the analyzer still needs to determine whether the top-level JSX component in that final consumer remains connected to the Reference primitive/style pipeline. If that chain is real, Panda must treat that top-level JSX name as part of the scan surface.

`reference-icons` is a good example of the shape of the problem. `MaterialSymbolIconProps` in `packages/reference-icons/src/types.ts` extends `StyleProps`, and `createIcon` in `packages/reference-icons/src/createIcon.tsx` feeds those style props into the same `ref-svg` + `box` + `css` path as the `Svg` primitive. Runtime is already aligned; extraction is the part that is still second-class.

---

## What we need to achieve

We need a derived set of JSX names for Panda that answers one narrow question well:

> Which top-level JSX components are real style-bearing boundaries in Reference UI?

For this milestone, a component belongs in that set when it is not merely a React component in general, but a component that meaningfully participates in the Reference style-prop surface.

The important level of truth here is not really interface identity by itself. It is **prop flow** or **signal flow**:

- do style props enter this component boundary?
- do they continue through the wrapper chain?
- do they eventually reach Reference primitives or the same style pipeline?

That is the level this subsystem needs to model correctly.

### Main example

```tsx
type MyThingProps = {
	color?: string
	children?: React.ReactNode
}

export function MyThing({ color, children }: MyThingProps) {
	return <Div color={color}>{children}</Div>
}
```

`MyThing` is not literally a generated primitive. It has its own component boundary and its own props type. But if `color` is being exposed at `MyThing` and then forwarded into `Div` as part of the Reference style surface, `MyThing` has become a real style-bearing JSX boundary for extraction purposes.

That is the core rule of this milestone: the question is not "is this component named like a primitive" or even just "does it have a certain interface." The question is whether style props exposed at that boundary continue into Reference primitives or the same style pipeline.

At a high level, that means we need to recognize components that do things like:

- expose `StyleProps` or an equivalent public style surface
- forward those props into primitives
- forward those props into the same `splitCssProps` / `box` / `css` pipeline
- behave like a first-class style-bearing component even if their JSX tag is not one of the generated primitive names
- remain part of that style-bearing chain even through intermediate wrappers or package hops

The output we want is small and concrete:

- a stable list of JSX names to add to Panda’s `patterns.extend.box.jsx`
- optional diagnostics for components that are ambiguous or unsupported
- deterministic behavior across runs

The important point is that this milestone is about **describing the style-bearing JSX surface correctly**, not about committing to one exact implementation strategy too early.

---

## Likely architecture

The most likely shape is:

1. a new focused analysis module in `reference-rs`
2. a new subsystem in `reference-core` that consumes its output
3. Panda config/codegen reading the derived JSX set instead of relying only on the static primitive baseline

That analysis module should be **much narrower** than Atlas or Tasty as full systems. It does not need to solve “understand the whole app.” It needs to answer a very specific extraction question efficiently:

> Which exported components should Panda treat like style-bearing JSX tags because their style props remain connected to Reference primitives?

That likely means a purpose-built pass over TS/TSX using Oxc and existing resolution utilities where helpful, but without dragging in a broader analysis contract than this milestone needs.

Even so, this still looks feasible inside `reference-rs`. Tasty already shows that the Rust side can parse TypeScript with Oxc, extract symbols/types, and resolve references. This subsystem would not be "Tasty again," but it would benefit from the same general kind of source-analysis foundation.

The corresponding `reference-core` subsystem will likely own:

- calling the analysis step during sync/build
- caching or materializing the derived JSX set
- merging it with `PRIMITIVE_JSX_NAMES`
- making sure Panda codegen runs with that derived artifact available

This document intentionally does **not** lock down the precise internal algorithm yet. The milestone is about the contract and the required outcome.

---

## Why this cannot stay hand-maintained

Hand-maintaining JSX names in config is exactly the failure mode this milestone exists to remove.

It does not scale for:

- user wrappers around primitives
- design-system shell components
- generated icon exports
- library extension surfaces that look like primitives to authors even when they are not literally primitive tags

If the source of truth remains a static list, extraction will always lag behind the real public style surface.

---

## Do we need to do this in Rust?

Strictly speaking, no. This is not impossible in TypeScript.

But the current direction probably **should** be Rust, for a few reasons:

- `reference-rs` already owns Oxc-based TS/TSX analysis infrastructure
- this looks like a sync/build-time concern where low overhead matters
- we likely want deterministic, lightweight structural analysis rather than another JS runtime pass
- this work is close in spirit to the other source-analysis responsibilities already living in `reference-rs`
- the real requirement is chain-aware and cross-package, which pushes this beyond a purely local AST check

So the practical answer is:

- **not required in theory**
- **probably the right place in practice**

If needed, a very small TypeScript prototype could still be useful to validate rules before the Rust implementation is finalized. But the production milestone likely belongs in `reference-rs` + `reference-core`.

---

## Testing requirements

This work is release-bar and needs explicit tests.

The test style should look more like a **case-study matrix** than a few isolated unit checks. In practice this should resemble how Atlas and Tasty are hardened: many small scenario fixtures, each proving one edge of the contract.

At minimum we should have:

1. **Analysis fixtures** — components that should be included, excluded, or diagnosed.
2. **Wrapper cases** — direct wrappers, renamed imports, barrels, re-exports, and generated component surfaces.
3. **Forwarding cases** — components that truly pass style props into primitives versus components that only look similar.
4. **Cross-package chain cases** — style-bearing components remain detectable through package-to-package hops such as `reference-icons` -> `reference-lib` -> `reference-docs`.
5. **Panda smoke tests** — a non-primitive component receives style props at the top-level JSX tag and generated CSS is present.
6. **Regression tests** — primitives-only projects still produce the baseline `PRIMITIVE_JSX_NAMES` behavior with no instability.

Those cases should cover many different structural scenarios, not just one golden path. This subsystem is only useful if it can survive the same kind of real-world scenario spread that Atlas and Tasty already have to deal with.

The exact test split between `reference-rs` and `reference-core` can be decided later, but the milestone should assume both analysis-level tests and end-to-end Panda validation.

---

## Related source (pointers)

- Panda box `jsx` wiring: `packages/reference-core/src/system/panda/config/extensions/api/extendPatterns.ts`
- Primitive baseline list: `packages/reference-core/src/system/primitives/tags.ts` → `PRIMITIVE_JSX_NAMES`
- Primitive runtime surface: `packages/reference-core/src/system/primitives/index.tsx`
- Public style contract: `packages/reference-core/src/types/style-props.ts`
- Icon example of the same runtime contract: `packages/reference-icons/src/types.ts`, `packages/reference-icons/src/createIcon.tsx`
- Extraction philosophy: `STYLE_PROPS.md`, `packages/reference-core/docs/css-in-js-extraction.md`
- Existing Rust analysis home: `packages/reference-rs/`
- Tasty Rust crate layout: `packages/reference-rs/docs/tasty-rs.md`

---

## What this unlocks

- **Userland extension** — Wrappers and design-system components can become first-class extraction boundaries without being added to a handwritten registry.
- **`reference-icons`** — See `ICONS.md`: material icons (and any `StyleProps`-typed SVG wrapper) stop being second-class for extraction once their JSX names can be derived from the same style-surface rules.

This milestone is intentionally about **correctness of the style-bearing JSX surface** first. The exact internal implementation may evolve, but the destination is clear: Panda should consume a derived scan set that matches real style-prop flow into Reference primitives, not a second handwritten registry that drifts over time.

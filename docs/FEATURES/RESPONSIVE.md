# Responsive

## Research Summary

- `r` is already implemented as a public responsive API.
- It is container-first, not viewport-first.
- It is wired through the box pattern / primitive layer.
- `r` can also be authored inside `css()` as syntactic sugar.
- It supports named containers via the companion `container` prop.
- Panda already supports raw `@container ...` rules.
- Panda also exposes preset container-condition tokens such as `@/sm` and `@sidebar/sm`.
- The intended long-term integration point for `css({ r: ... })` is the Rust virtual
	transform layer, not a runtime wrapper and not a TypeScript-side transform.

## Decision

For `css({ r: ... })`, the target solution is:

- keep `r` semantics defined with the `r` extension
- treat the `css()` form as syntactic sugar only
- lower that sugar inside `packages/reference-rs/src/virtualrs`
- let Panda consume normal raw `@container (...)` keys after lowering
- use Panda as the execution engine, with virtual transforms acting only as normalization

This means the next real implementation should live in a Rust-native transform such as:

- `packages/reference-rs/src/virtualrs/r.rs`

and be wired alongside the existing virtual transforms in:

- `packages/reference-rs/src/virtualrs/mod.rs`

The purpose is to keep the transform fast, keep memory usage predictable, and avoid pulling in
the `typescript` package for virtual rewrites.

## Recovery Path

This needs to be done in separate stages.

Do not collapse them into one implementation pass.

Do not use Cosmos behavior, Vite behavior, or runtime `css()` behavior as the first source of
truth while the transform itself is still being proven.

The ordering matters:

1. Rust first
2. then a small virtual-pipeline integration in `reference-core`
3. then output verification in `reference-unit`

The main point is to prove the transform in isolation before wiring it into the wider system.

### Stage 1: Rust

Stage 1 is the real implementation stage.

Add one separate transform function in `virtualrs`:

- `applyResponsiveStyles()`

This should stay distinct from import-rewrite responsibilities.

Expected role split:

- `rewriteCvaImports()` handles import rewriting / alias normalization for `recipe` and `cva`
- `rewriteCssImports()` or `transformCssFunctions()` handles import rewriting / alias normalization for `css`
- `applyResponsiveStyles()` handles lowering `r` into raw `@container (...)` keys

That means `applyResponsiveStyles()` should target the canonical call shapes after the earlier
rewrite stages have already normalized the call sites.

In practice that means it should operate on:

- `css(...)`
- `cva(...)`

and not on arbitrary unrelated objects.

Stage 1 should include serious Rust-side coverage before anything else moves forward.

Required validation surface:

- Rust unit tests in `packages/reference-rs/src/virtualrs/tests.rs`
- virtualfs integration cases in `packages/reference-rs/tests/virtualfs/cases/`

Suggested Stage 1 case coverage:

- basic `css({ r: ... })`
- aliased `css` import normalized first, then lowered
- basic `cva({ base: { r: ... } })`
- `recipe` alias normalized to `cva`, then lowered
- multiple breakpoints in one `r` object
- casts such as `as unknown as CssStyles`
- nested style objects inside each breakpoint
- unrelated `r` objects outside `css()` / `cva()` stay unchanged
- explicit raw `@container (...)` keys stay unchanged
- named raw `@container name (...)` keys stay unchanged
- files with no `r` stay unchanged
- type-only imports stay unchanged

Stage 1 exit criteria:

- the transform exists as a separate Rust function
- it is proven by Rust unit tests
- it is proven by virtualfs cases
- no `reference-core` or runtime workaround is needed to explain the behavior

### Stage 2: reference-core Integration

Stage 2 should be intentionally small.

At this stage, `reference-core` should only compose the already-proven Rust function into the
virtual transform pipeline.

That means:

- keep import rewrite steps separate
- call the new `applyResponsiveStyles()` as an additional transform stage
- align it with the existing `rewriteCvaImports()` and CSS rewrite step so it sees the canonical call targets

This stage should not introduce:

- runtime `css()` lowering
- Vite/plugin-specific transforms
- Cosmos-specific handling
- second-path fallback logic

Stage 2 exit criteria:

- `reference-core` applies the new Rust transform in virtual composition only
- a focused transform regression test proves the order and output

### Stage 3: reference-unit Verification

Stage 3 is where the pipeline output gets checked from the consumer side.

This stage should verify outputs, not redefine the architecture.

Use `reference-unit` to verify:

- the virtual file output contains raw `@container (...)` keys
- the generated CSS contains the expected container-query blocks
- the generated runtime class names for the transformed shape align with the emitted CSS

This stage is useful for confirming the pipeline result, but it is not the place to invent a
runtime fix if Stage 1 or Stage 2 is wrong.

Stage 3 exit criteria:

- the output seen by `reference-unit` matches the Rust/virtual transform expectations
- no runtime-only patching is required

## Guardrails

To avoid repeating the same failure mode, keep these boundaries explicit:

- The semantic source of truth remains the `r` feature itself.
- The sugar-lowering source of truth is the Rust virtual transform layer.
- The virtual pipeline is what Panda reads.
- Panda CSS output is the artifact that should match the transformed shape.
- Runtime wrappers are not the fix.
- Vite/Cosmos-specific transforms are not the fix.

## Current Behavior

The current `r` shape is:

```tsx
<Box
	r={{
		320: { padding: '2' },
		768: { padding: '4' },
	}}
/>
```

`r` transforms numeric keys into container queries:

```css
@container (min-width: 320px) { ... }
@container (min-width: 768px) { ... }
```

Named containers are also supported:

```tsx
<Box container="sidebar">
	<Box r={{ 240: { padding: '3', bg: 'blue.600' } }} />
</Box>
```

That becomes a named container query against `sidebar`.

## Where `r` Works Today

`r` is part of the higher-level Reference UI prop surface used by primitives.

It also exists on the generated box pattern surface.

It also exists as a `css()` authoring surface.

That means the current implementation is best described as:

- supported on primitives
- supported on box-pattern styling
- supported in `css()` calls

The important architectural point is that the `css()` form should not rely on a runtime-only
wrapper. It should lower to plain `@container (...)` keys during the virtual copy / transform
step so Panda sees normal container-query styles during static extraction.

More specifically: that lowering should happen in `virtualrs`, not in a JS/TS transform layer.

## Surface Differences

The pattern / primitive `r` and the utility `r` intentionally do not have identical capabilities.

### Pattern `r`

Use this on primitives or box-pattern props:

```tsx
<Box container="sidebar" r={{ 240: { padding: '3' } }} />
```

Characteristics:

- can read sibling `container`
- supports anonymous containers
- supports named containers
- designed for primitive / box authoring

### Utility `r`

Use this inside `css()`:

```tsx
css({
	r: {
		400: { padding: '1rem' },
	},
})
```

Characteristics:

- syntactic sugar for raw container-query style objects
- lowered in the Rust virtual layer before Panda extraction
- anonymous container queries only
- cannot infer a named container from sibling props
- useful for completeness and for style-object authoring
- shares the same numeric breakpoint object shape

In other words: the utility version gives `css()` parity for anonymous container queries, while the pattern version remains the richer surface.

## Recommendation

Keep the pattern `r` as the primary responsive surface.

Use the utility `r` when the authoring flow specifically wants `css({ ... })`.

That split keeps the feature complete without pretending the two surfaces have the same context.

## How This Reuses Panda

Panda already gives us two relevant container-query authoring surfaces.

### Panda Preset Container Conditions

Panda can generate named condition keys from theme config, such as:

```tsx
css({
	fontSize: {
		'@/sm': 'md',
		'@sidebar/md': 'lg',
	},
})
```

That surface is useful when the design system wants container sizes to be tokenized through
`containerSizes` and `containerNames`.

It is not a direct match for current `r` semantics, because `r` today is authored with literal
numeric widths and, on the primitive side, can also combine with a sibling `container` prop.

### Panda Arbitrary Container At-Rules

Panda also accepts raw at-rules directly inside `css()`, for example:

```tsx
css({
	'@container (min-width: 420px)': {
		gridTemplateColumns: '1fr auto',
	},
})
```

This is the better fit for `css({ r: ... })` in this repo.

Why:

- it preserves the current numeric-breakpoint shape exactly
- it matches what the primitive/pattern `r` already emits conceptually
- it reuses Panda's real extraction and runtime path without adding a second CSS engine
- it lets our custom work stay in virtual normalization instead of runtime interpretation

So the job of our virtual transform is not to replace Panda's container API.

The job is to take a Reference UI-specific authoring convenience:

```tsx
css({
	r: {
		420: { gridTemplateColumns: '1fr auto' },
	},
})
```

and normalize it into a Panda-native style object:

```tsx
css({
	'@container (min-width: 420px)': {
		gridTemplateColumns: '1fr auto',
	},
})
```

After that point, Panda should do all the normal work:

- recognize the `@container` condition
- generate the class name
- emit the final CSS block

That is the important boundary: custom transforms in `css()` should end in a shape Panda already
understands.



## Why The Split Exists

The pattern transform can inspect both `r` and `container`, so it can target named containers.

The `css()` form is just sugar over Panda's existing `@container` support. During virtual
transforms we can rewrite:

```tsx
css({
	r: {
		420: { gridTemplateColumns: '1fr auto' },
	},
})
```

into:

```tsx
css({
	'@container (min-width: 420px)': {
		gridTemplateColumns: '1fr auto',
	},
})
```

That keeps Panda as the CSS engine of record and avoids depending on a special runtime-only
`css()` wrapper.

It also means the lowering step should be treated as part of the virtual-source normalization
pipeline, not as a second styling engine.

The `css()` sugar still cannot discover sibling props such as `container`.

That is why the utility surface is intentionally limited to anonymous `@container (min-width: ...)` rules.

If authors need an explicit named query inside `css()`, they should write the raw Panda-compatible
form directly instead of expecting `r` to infer it:

```tsx
css({
	'@container product-card (min-width: 360px)': {
		backgroundColor: '#0f766e',
	},
})
```

## Combined Example

One useful pattern is:

- define responsive layout rules once with `css({ r: ... })`
- attach those styles wherever needed
- localize the query boundary by setting `container` on a primitive

```tsx
import { Div, css } from '@reference-ui/react'

const productCardBody = css({
	display: 'grid',
	gap: '3',
	r: {
		420: {
			gridTemplateColumns: '1fr auto',
			alignItems: 'center',
		},
		640: {
			padding: '4',
		},
	},
})

const priceBlock = css({
	textAlign: 'left',
	r: {
		420: {
			textAlign: 'right',
		},
	},
})

export function ProductCard() {
	return (
		<Div container="product-card" borderWidth="1px" rounded="lg" padding="3">
			<Div className={productCardBody}>
				<Div>
					<Div fontWeight="600">Starter Plan</Div>
					<Div color="textMuted">Good for smaller teams</Div>
				</Div>

				<Div className={priceBlock}>
					<Div fontSize="lg" fontWeight="700">
						$24
					</Div>
					<Div color="textMuted">per seat</Div>
				</Div>
			</Div>
		</Div>
	)
}
```

What happens here:

- `productCardBody` and `priceBlock` both use utility-flavoured `r`
- those utility queries are lowered to anonymous `@container (...)` rules, so they resolve against the nearest container
- `container="product-card"` on the outer primitive creates that local container boundary
- if this card is rendered in a narrow sidebar and a wide dashboard rail, the same `css()` class can respond differently in each placement

If you need the responsive rule itself to know about a named container explicitly, that is where the primitive / pattern `r` surface still matters.

## Current Findings

- Runtime-only expansion for `css({ r: ... })` is the wrong layer because static CSS emission
	then falls out of sync with the runtime class string.
- Vite- or Cosmos-specific transforms are also the wrong layer because they bypass the actual
	virtual/Panda contract instead of fixing it.
- A TypeScript-side virtual transform is also the wrong final shape for this repo because it adds
	memory cost and duplicates work we already centralize in Rust.
- The correct long-term model is: keep `r` semantics defined with the extension, but lower the
	`css()` sugar in `virtualrs` before Panda extraction.
- That approach uses Panda's existing container-query support instead of inventing a second CSS
	execution path.
- The custom virtual transform should stop at a Panda-native `@container ...` style object and let
	Panda handle class generation and CSS emission from there.

## Rejected Attempts

These approaches were explored and should not be treated as the final design:

- custom utility registration alone in Panda config

Reason: the generated `css()` runtime metadata path did not make object-valued `r` behave the way
we needed, and it still left static CSS generation gaps.

- runtime-only expansion in `packages/reference-core/src/system/css/public.ts`

Reason: runtime class names could look correct while emitted CSS stayed incomplete, which made
fixtures and real playground behavior drift apart.

- a TypeScript-package virtual transform probe

Reason: workable as an experiment, but not acceptable as the final architecture because the repo
expects these virtual rewrites to live in Rust for performance and memory reasons.

## Intended Rust Shape

The next implementation pass should follow this shape:

1. Add a new Rust transform module for responsive `css()` sugar, likely
	`packages/reference-rs/src/virtualrs/r.rs`.
2. Export and compose it through `packages/reference-rs/src/virtualrs/mod.rs` beside the existing
	`css` and `cva` transforms.
3. Expose a separate `applyResponsiveStyles()` entry point instead of folding this into unrelated
	import-rewrite responsibilities.
4. Keep a short comment near the JS-side `r` extension explaining that the `css({ r: ... })`
	form is lowered at the virtual layer, so the extension file remains the semantic home even though
	the sugar expansion happens in Rust.
5. Align `applyResponsiveStyles()` with the earlier CSS / CVA rewrite stages so it targets the
	canonical `css()` / `cva()` calls they normalize.
6. Rewrite only the intended responsive style payloads within those canonical calls.
7. Lower `r: { 420: { ... } }` to raw `"@container (min-width: 420px)": { ... }` object keys.
8. Leave primitive / pattern `r` behavior unchanged.
9. Keep named-container inference out of utility `r`; named utility cases should use explicit raw
	`@container name (...)` syntax.

## Test Expectations

The Rust implementation should come with serious coverage.

At minimum:

- Rust unit tests in `packages/reference-rs/src/virtualrs/tests.rs`
- end-to-end virtualfs cases under `packages/reference-rs/tests/virtualfs/cases/`

Suggested case coverage:

- basic `css({ r: ... })` rewrite
- aliased `css` import rewrite
- multiple breakpoints in one object
- nested style objects inside each breakpoint
- file with no `r` stays unchanged
- type-only imports stay unchanged
- unrelated object property named `r` outside a `css()` call stays unchanged
- explicit raw `@container ...` keys stay unchanged
- named raw container queries stay unchanged
- mixed `css()` + `cva` usage stays stable

The point of that test shape is to prove both semantic correctness and that the virtual Rust path
is the only required lowering layer.

## TypeScript Plan

`css()` already has a strong public typing story overall, but `r` needs its own explicit plan.

Today the primitive side already models `r` as a Reference UI-owned prop:

- `ResponsiveProps['r'] = StylePropValue<Record<string | number, SystemStyleObject>>`

That is the right shape conceptually. The missing part is the `css()` authoring surface.

Right now `CssStyles` is just:

```ts
type CssStyles = SystemStyleObject | undefined | null | false
```

which is why examples often fall back to casts when authoring `css({ r: ... })`.

### Intended Typing Shape

The next implementation pass should introduce a public owned `css()` style-object type instead of
trying to force `r` directly through the generated Panda object type.

The intended shape is roughly:

```ts
type ResponsiveCssValue = Record<string | number, SystemStyleObject>

type CssStyleObject = Omit<SystemStyleObject, 'r'> & {
	r?: ResponsiveCssValue
}

type CssStyles = CssStyleObject | undefined | null | false
```

The important part is not the exact final file name, but the shape:

- `css()` should accept `r` without casts
- values inside `r[breakpoint]` should resolve as full `SystemStyleObject`
- nested style keys inside each breakpoint should keep the same token/color narrowing as normal
  `css()` objects

### Why Use An Owned Alias

We should not depend on a generated `UtilityValues["r"]` or another deeply derived Panda type as
the public `css()` contract.

Instead, use a Reference UI-owned alias just like primitives do for `StyleProps` / `ReferenceProps`.

That avoids a few failure modes:

- overlapping generated keys causing awkward intersections
- recursive or widened types making editor hints unreadable
- type collapse to `never` or overly broad `any`-like behavior when layering extra props onto
  generated Panda types

### Type Safety Goals

The next pass should preserve these guarantees:

- `css({ r: { 420: { padding: '4r' } } })` type-checks without `as unknown as CssStyles`
- `padding`, `backgroundColor`, `gridTemplateColumns`, etc inside `r[420]` get the same completions
  and token restrictions as top-level `css()` styles
- invalid top-level `r` values still fail
- invalid nested values inside `r[breakpoint]` still fail
- the public type remains readable in editor hovers

### Type Test Expectations

The next implementation pass should add focused type coverage for `css()` + `r`, not just runtime/output coverage.

Suggested checks:

- `css({ r: { 420: { padding: '1rem' } } })` is accepted
- nested token-safe color values inside `r` are accepted or rejected consistently with top-level `css()`
- invalid nested property names inside `r` fail
- invalid nested property values inside `r` fail
- no cast is required in the Cosmos fixture or docs example

The goal is to make `r` inside `css()` feel like a first-class typed authoring surface while still
lowering away entirely in the Rust virtual layer before Panda extraction.

## Notes For The Next Pass

- Do not introduce a second public concept such as a distinct `styledCss` surface.
- Do not rely on a runtime wrapper as the fix.
- Do not pull in the `typescript` package for this transform.
- Do use Panda's raw container-query support as the emitted target.
- Do treat virtual `css()` transforms as normalization into Panda-native style objects, not as a
	parallel styling runtime.
- Do keep the semantic explanation close to the `r` extension with a comment noting that the
	`css()` sugar is lowered in the virtual layer.
- Do give `css()` an owned public type shape for `r` so users do not need casts and nested values
	inside `r` keep full style inference.

## Open Design Questions

- Should the utility `r` eventually grow a richer value shape that can carry an explicit container name?
- Should named-container utility support exist as `css({ r: { ... } })`, or should named cases stay explicit with raw `@container name (...)` blocks?
- Is numeric inline width still the canonical form, with any future preset support layered on top?


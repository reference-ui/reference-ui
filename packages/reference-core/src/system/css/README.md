# system/css

Owns the CSS-side postprocessing that turns Panda output into the portable,
layer-safe stylesheet contract stored on `baseSystem.css` and written back into
runtime `styles.css` when upstream layered CSS is present.

This module is now doing real work:

- lifting token declarations out of Panda output
- re-scoping theme selectors into a layer domain
- synthesizing public color-token utility classes
- reassembling local and upstream CSS into final source order
- loading Liquid templates from source layout at runtime

That means it should now be treated as a real subsystem, not just a helper.
This document is the hardening map.

## Status Update

The first hardening pass is now in place.

Completed work:

- adopted `postcss` for stylesheet parsing
- adopted `postcss-selector-parser` for selector-list handling
- kept the public programmatic API stable
- added direct transform coverage for braces in comments/strings
- added direct transform coverage for selector functions containing commas
- validated the change against core tests and `reference-unit`

So the module is no longer relying on raw brace matching or naive
`selector.split(',')` for the core transform path.

## Current Shape

### Files

- `createPortableStylesheet.ts` — file IO wrapper around the transform
- `postprocess.ts` — post-Panda orchestration and runtime stylesheet rewrite
- `transform/createPortableStylesheetFromContent.ts` — main PostCSS-backed transform logic
- `render/stylesheet.ts` — Liquid-backed rendering helpers
- `templates/*.liquid` — output templates

### Current Pipeline

1. Read Panda-emitted `styled/styles.css`
2. Extract the `@layer tokens` block
3. Move root token declarations onto `[data-layer="<name>"]`
4. Re-scope theme selectors like `[data-panda-theme=dark]`
5. Preserve non-selector token-layer at-rules
6. Strip the original token layer from the wrapped Panda content
7. Synthesize public color utility classes when Panda did not emit them
8. Render the portable stylesheet
9. Optionally prepend upstream layer order and append upstream CSS

## Hardening Priorities

Priority order here is deliberate:

1. robustness
2. elegance
3. readability

Readability work should happen, but not at the expense of correctness.

---

## 1) Robustness: what is most likely to break

### A. The parser migration is done, but the transform still needs stronger structure

`createPortableStylesheetFromContent.ts` now parses CSS through `postcss` and
uses `postcss-selector-parser` for selector-list handling. That removes the
worst fragility from the original string-based approach.

#### What improved

- braces inside comments or strings no longer rely on homegrown brace scanning
- selector lists no longer rely on naive comma splitting
- nested CSS structure is now parsed through a real stylesheet AST
- token-layer traversal is now operating on nodes rather than string slices

#### Remaining risks

- multiple `@layer tokens` blocks are not explicitly validated
- nested at-rules inside token blocks are preserved, but not yet classified with
  a richer intermediate model
- token-layer discovery assumes a narrow Panda-emitted shape
- serialization and normalization rules still live in one transform file

#### Recommendation

Keep the PostCSS foundation, but move the transform onto an explicit
intermediate representation.

The most practical way to do that without changing the public API is to adopt a
programmatic CSS AST library internally.

Recommended stack:

- `postcss` for stylesheet parsing and AST traversal
- `postcss-selector-parser` for selector rewriting

Why this is the best fit here:

- it gives us real CSS parsing instead of regex and brace matching
- it preserves `@layer`, `@media`, `@keyframes`, and nested rule structure
- it gives us a proper selector AST instead of `split(',')`
- it can be used directly from TypeScript without introducing a config-driven
  plugin pipeline

This should be an internal implementation detail only. The external
programmatic API should stay stable:

- `createPortableStylesheet()` continues to return `string | undefined`
- `postprocessCss()` continues to return `string | undefined`
- `createPortableStylesheetFromContent()` continues to return `string`

Suggested phases:

1. `extractPandaLayerPrelude(css)`
2. `extractTokensLayer(css)`
3. `parseTokenLayerBlocks(tokensCss)`
4. `rewriteTokenSelectors(blocks, layerName)`
5. `buildPortableStylesheetModel(...)`
6. `renderPortableStylesheet(model)`

Next guardrails to add:

- reject or warn on multiple `@layer tokens` blocks
- make unsupported Panda shapes fail predictably
- decide whether comments inside extracted declarations are a preserved contract
- distinguish preserved token at-rules from transformed token rules explicitly

### B. Failure modes are mostly silent

Today the public surface mostly returns `undefined` or a string. That is fine
for missing files, but weak for malformed CSS or unsupported shapes.

#### Recommendation

Introduce a small internal result type for transform outcomes.

Example shape:

```ts
interface PortableStylesheetResult {
  css?: string
  warnings: string[]
  metadata: {
    hadTokensLayer: boolean
    synthesizedUtilities: string[]
    preservedAtRules: string[]
  }
}
```

Even if the exported API still returns `string | undefined`, the internal
transform should carry diagnostics so tests can lock down behavior.

### C. Upstream CSS assembly needs more invariants

`postprocess.ts` currently trusts upstream layer metadata more than it should.

#### Recommendation

Normalize and validate upstream layers before rendering:

- trim once in a dedicated helper
- drop empty CSS consistently
- detect duplicate layer names
- detect self-references to the local layer name
- preserve deterministic order with explicit normalization

A helper like `collectUpstreamPortableLayers(config, localLayerName)` would make
this contract much clearer.

### D. Template discovery is runtime-fragile

`templates/index.ts` searches ancestor directories and falls back to
`process.cwd()`. That is convenient during development, but it is also one of
those things that works until packaging, tests, or alternate entrypoints shift
execution context.

#### Recommendation

Prefer one of these directions:

1. load templates relative to `import.meta.url` only, and make packaging keep
   them adjacent
2. inline templates at build time so runtime lookup disappears entirely

The current ancestor walk is a good compatibility fallback, but it should not be
our only correctness story.

### E. Performance should be measured, not guessed

The module now uses an AST-backed transform. That was the right trade for
correctness, but performance should still be measured against real generated CSS
so the cost stays visible.

#### Recommendation

Add a small internal benchmark harness and compare:

- current `postcss` implementation
- any future refactored `postcss` implementation
- total parse + transform + render time
- repeated runs over real generated `styles.css` files from this repo

Acceptance criteria should be practical rather than theoretical:

- output parity with the current contract
- runtime remains in low-millisecond territory for typical generated CSS
- no meaningful regression in `ref sync`, core tests, or `reference-unit`

### F. Idempotence should be an explicit contract

The module already has a rerun test in `postprocess.test.ts`, which is good.
But the contract should be stronger:

- transforming the same Panda CSS twice should always yield the same portable CSS
- postprocessing should never duplicate upstream CSS
- utility synthesis should never duplicate classes when rerun against already
  transformed content

That suggests separating:

- `transformPandaCssToPortableCss(rawPandaCss)`
- `assembleRuntimeStylesheet(localPortableCss, upstreamCss)`

with tests proving each step is idempotent on its own domain.

---

## 2) Structure and elegance: how to make the code easier to evolve

### A. Split `createPortableStylesheetFromContent.ts` by responsibility

Right now one file owns:

- AST traversal
- selector rewriting
- declaration normalization
- utility synthesis
- output assembly

That makes it the correct place to start, but not the easiest place to extend.

#### Suggested shape

- `transform/extract.ts`
  - PostCSS token-layer extraction
  - token-rule classification
- `transform/rewriteSelectors.ts`
  - selector-parser-backed layer-domain rewriting
- `transform/synthesizeUtilities.ts`
  - public color utility generation
- `transform/model.ts`
  - shared transform types
- `transform/createPortableStylesheetFromContent.ts`
  - orchestration only

The goal is not “more files” for its own sake; the goal is isolating the risky
logic so each part is testable without giant fixture strings.

### B. Introduce a named output model before rendering

Right now rendering is fed positional strings and arrays.
A structured model would clarify what is intentional.

Example:

```ts
interface PortableStylesheetModel {
  layerName: string
  wrappedPandaContent: string
  rootTokenDeclarations: string
  themeTokenBlocks: Array<{
    selector: string
    declarations: string
  }>
}
```

That model then becomes the seam between transform logic and templating.

### C. Separate file IO from CSS logic even more aggressively

This is already partly true, which is good.
The next step is making `postprocess.ts` mostly orchestration helpers:

- `readPandaStylesheet()`
- `buildPortableStylesheet()`
- `collectUpstreamLayers()`
- `renderFinalRuntimeStylesheet()`
- `writeRuntimeStylesheetIfNeeded()`

That will make regression debugging much easier.

### D. Make naming reflect intent rather than mechanics

A few examples worth considering:

- `preservedContent` → `preservedTokenAtRules`
- `content` → `wrappedLayerContent` or `portableLayerContent`
- `raw` in file-level functions → `rawPandaCss`
- `parseTokensLayer()` → something closer to `extractPortableTokenModel()`

Small naming improvements matter a lot in transform code.

---

## 3) Readability: how to make the behavior easier to understand

### A. Document the exact CSS contract

This module now has an implicit contract that deserves an explicit one.
At minimum, document:

- expected Panda input shape
- what gets preserved
- what gets moved
- what gets synthesized
- what is intentionally unsupported

The current tests explain pieces of this, but a prose contract reduces guesswork
for future edits.

### B. Favor “pipeline” helpers over local string surgery

When the code reads like:

1. parse
2. classify
3. rewrite
4. synthesize
5. render

it is much easier to audit than a single file doing mutation-heavy substring
work.

### C. Put dangerous assumptions next to the code that relies on them

Examples:

- selector rewriting assumes token theme selectors should target both
  `[data-layer]selector` and `selector [data-layer]`
- utility synthesis assumes token names can be converted from kebab-case to
  camelCase safely
- root token extraction assumes Panda emits `:where(:root, :host)`

These should be inline comments or explicit guard clauses, not tribal knowledge.

---

## Direct module tests still worth adding

These are not `reference-unit` tests; they belong next to the transform.

### High-value direct tests

- multiple `@layer tokens` blocks
- nested `@media` inside the token layer
- duplicate color utility opportunities do not emit duplicates
- non-color root tokens do not generate public utility classes
- duplicate upstream layer names are either rejected or normalized deterministically
- template loading works from packaged and workspace-relative execution roots

Already covered directly:

- token layer contains comments with braces
- token layer contains strings with braces
- selectors with comma-like syntax inside `:is(...)` or `:where(...)`

---

## Additional `reference-unit` cases worth adding

These are the downstream contract tests most likely to catch real breakage.

### 1. Dark-mode precedence across nesting

Assert that the nearest authored theme context wins in the layered case.

Examples:

- consumer wrapper is dark, inner layered component node is light
- consumer wrapper is light, inner authored node is dark
- sibling light and dark islands resolve independently in one render

This validates the selector rewriting strategy, not just basic dark-mode support.

### 2. Layered public token access from both consumer and authored markup

For the same public token:

- consumer primitive resolves it outside the library component
- library-authored markup resolves it inside the library layer
- both resolve correctly under light and dark contexts in the same test

That proves public token portability across layer boundaries.

### 3. Private token isolation under global dark mode

You already prove private tokens stay hidden in light mode.
Add the same proof under a dark ancestor wrapper so the theme rewrite does not
accidentally expose private selectors.

### 4. Upstream ordering when both `extends` and `layers` participate

Create a downstream assertion where:

- one extended library exports a public token/class
- one layered library exports a public token/class with the same semantic role
- the consumer’s final runtime CSS resolves according to the intended source order

This catches regressions in assembled stylesheet ordering.

### 5. Public utility-class availability for synthesized color tokens

If the module is now responsible for synthesizing `.bg_*`, `.bg-c_*`, and
`.c_*`, add a downstream test that uses those public classes from:

- local root tokens
- extended-library public tokens
- layered-library public tokens

That validates the actual user-facing contract rather than only the internal
transform output.

### 6. Mixed-library composition in one tree

Render a tree containing:

- consumer primitive using root token
- consumer primitive using extended token
- consumer primitive using layered public token
- layered component using its private token

Then assert they all resolve correctly together. This is the most realistic
integration path and a good guard against subtle layer-order regressions.

### 7. Runtime CSS load path resilience for layered components

You already inject layered library CSS manually in tests.
Add a case that proves the layered component still resolves correctly when:

- consumer design-system CSS is loaded first
- library CSS is loaded second
- another unrelated style tag exists between them

That helps catch brittle assumptions about style tag order.

---

## Suggested execution order

If we harden this incrementally, the order should be:

1. write this document
2. freeze current behavior with higher-value direct tests around parser edge cases ✅
3. implement a `postcss`-backed parser/rewrite path behind the existing public entrypoints ✅
4. introduce an internal transform model while preserving the current programmatic API
5. add a benchmark harness against real generated `styles.css`
6. split the transform into extraction / rewrite / synthesis helpers
7. tighten upstream-layer normalization
8. add the new `reference-unit` integration cases
9. revisit template loading so packaged execution is less fragile

## Migration plan: higher-level CSS parsing without API churn

The intended migration should be internal-first.

### Public API to preserve

These entrypoints should remain stable while internals evolve:

- `createPortableStylesheet.ts`
- `postprocess.ts`
- `transform/createPortableStylesheetFromContent.ts`
- `index.ts`

That means phase 1 is explicitly not an API redesign.

### Internal shape to target

Suggested internal seams:

- `transform/model.ts`
- `transform/parseCss.ts`
- `transform/rewriteTokenSelectors.ts`
- `transform/synthesizeUtilities.ts`
- `transform/createPortableStylesheetFromContent.ts` as orchestration only

Suggested internal flow:

1. parse raw Panda CSS into an AST
2. extract the `@layer tokens` subtree
3. classify root-token declarations, themed token rules, and preserved at-rules
4. rewrite selectors through a selector AST
5. synthesize missing public utilities from the extracted token set
6. build a portable stylesheet model
7. render through the existing Liquid templates

### Benchmarking plan

Before switching implementations by default, benchmark both paths on real CSS
generated by this workspace.

Measure:

- one-shot transform time
- warm repeated transform time
- relative overhead of parsing vs rendering
- output parity for the same input

Switch criteria were:

- direct CSS module tests pass ✅
- `reference-unit` still passes unchanged ✅
- the public API remains stable ✅

Still to do:

- measure and document runtime cost explicitly

## Bottom Line

The CSS module is already useful and is doing the right kind of work.
The main concern is not feature direction; it is that the current
implementation still relies on string surgery in places where the contract is
becoming important enough to deserve stronger invariants.

So the immediate goal should be:

- make invalid or unexpected CSS shapes fail predictably
- make transform stages explicit
- expand downstream integration coverage around theme scope, ordering, and
  public/private token boundaries

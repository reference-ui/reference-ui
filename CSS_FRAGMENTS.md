# Feature: Coerce `css()` And `recipe()` Into Panda-Stable Static Inputs

## Summary

Reference UI should stop treating Panda as the system responsible for reliably evaluating arbitrary authoring-time AST patterns across every environment we support.

Instead, Reference UI should use its own virtual-file and transform infrastructure to coerce `css()` and `recipe()`/`cva()` authoring inputs into a narrow, explicit, static shape before Panda sees them.

Panda should remain responsible for:

- turning a static style/config object into atomic CSS
- generating the corresponding runtime/system outputs
- keeping runtime class generation aligned with extracted CSS

Panda should not be the part of the pipeline we trust to resolve every cross-file constant, nested selector branch, and environment-sensitive AST edge case in user code.

## Why

We now have enough evidence that this boundary is real.

In the local workspace path, `matrix/css-selectors` can produce correct nested selector output. In the matrix consumer path, the virtual source is still correct, but Panda drops constant-backed declarations inside nested selector objects while preserving:

- the outer `css()` call
- the nested selector key
- inline literal nested values in the same file
- top-level values in the same file

That means the current failure class is not:

- broken virtual source generation
- broken final stylesheet assembly
- broken selector parsing

It is specifically an evaluation reliability problem inside Panda extraction.

Reference UI already has serious infrastructure for owning this boundary ourselves:

- virtual source generation under `.reference-ui/virtual`
- custom transforms over those virtual files
- Rust-backed transforms where performance matters
- OXC-backed AST infrastructure already present in the repo
- fragment-like build patterns elsewhere in the system

Given that infrastructure, continuing to rely on Panda to be the primary AST evaluator for all `css()` and `recipe()` authoring shapes is the wrong dependency boundary.

## Problem Statement

Today, author code can be valid and stable from Reference UI’s perspective while still depending on Panda to perform subtle cross-file AST evaluation in order to extract CSS correctly.

That creates a production risk:

- behavior can differ between local workspace and packaged consumer environments
- nested branches can silently degrade while inline branches still pass
- failures appear as partial extraction, not obvious hard errors
- reproductions depend on packaging, module resolution, and Panda internals rather than our own contract

This is the wrong place to carry uncertainty.

## Proposed Direction

Reference UI should introduce a build-time coercion step for Panda-authored surfaces.

The goal is to make Panda consume a representation that is already statically resolved enough for extraction, instead of asking Panda to discover and evaluate every relevant authoring pattern itself.

In practical terms:

1. Author code can still use normal Reference UI `css()` and `recipe()` authoring patterns.
2. During virtual-file generation, Reference UI analyzes those calls.
3. Reference UI rewrites or materializes them into Panda-friendly static modules inside the virtual tree.
4. Panda extracts from that coerced representation.
5. Runtime output still matches the extracted classes because Panda remains the emitter for the final atomic CSS contract.

Those generated modules should live under a reserved subtree in the Panda-visible virtual root, for example:

- `.reference-ui/virtual/__reference__ui/css/*`
- `.reference-ui/virtual/__reference__ui/recipes/*`

That keeps the coercion boundary inside the same synthetic project Panda already scans, instead of introducing a second discovery path Panda would need to know about.
s
## Design Principle

The question for Panda should be:

- can you turn this static object into atomic CSS?

It should not be:

- can you reliably perform cross-file AST evaluation for every `css()` and `recipe()` use case we can author across every environment we support?

That second question is where the fragility lives.

## What This Is Not

This is not a proposal to replace Panda’s atomic CSS generation.

This is not a proposal to reimplement Panda’s runtime class format.

This is not necessarily an argument for a heavy full-program AST compiler pass everywhere.

The real requirement is smaller:

- coerce authored `css()` and `recipe()` inputs into a form Panda can extract deterministically

In some cases that may require AST.

In some cases it may not.

The important point is that Reference UI should own the coercion boundary.

## Candidate Implementation Shapes

### 1. Virtual-file rewrite to static object payloads

During virtual generation, detect `css()` and `recipe()`/`cva()` calls and rewrite their arguments into statically resolved object literals where possible.

This is the smallest conceptual change and fits the current virtual-file architecture.

### 2. Fragment-like intermediate artifacts in virtual

Instead of asking Panda to read original authored modules directly, emit small generated modules or microbundle-like fragments that contain only:

- the stable static object payload
- the minimum imports Panda needs
- a predictable structure for extraction

In this repo, that should mean writing those generated modules into `.reference-ui/virtual/__reference__ui/` so they are part of the same virtual workspace Panda already scans.

This mirrors patterns we already use elsewhere in config/build flows.

### 3. OXC-backed coercion pass

Use OXC to analyze targeted authoring constructs and normalize them into extractable forms before Panda runs.

This is likely the most robust long-term option if we want deterministic behavior across:

- cross-file constants
- selector nesting
- recipe variants
- reusable style fragments

### 4. Hybrid approach

Start with lightweight virtual rewrites for the known unstable cases, then grow into an OXC-backed coercion pass as needed.

This is the most pragmatic rollout path.

The first version should prefer filesystem placement over config indirection:

- combine `css()` payloads into generated virtual modules under `__reference__ui/css`
- combine `recipe()`/`cva()` payloads into generated virtual modules under `__reference__ui/recipes`
- let Panda discover those modules through its existing `virtual/**/*` include globs
- avoid a separate non-virtual fragment registry if the goal is Panda extraction

## Scope

The first-class targets are:

- `css()`
- `recipe()`
- `cva()`

Potentially later:

- `sva()`
- shared style fragments composed into those APIs
- token references that currently rely on Panda-side evaluation beyond simple literals

## Initial Acceptance Criteria

Reference UI should be able to guarantee that these cases extract the same way in local and consumer environments:

- top-level literal values
- top-level imported constants
- nested selector literal values
- nested selector imported constants
- quoted and unquoted attribute selectors
- compound selector branches
- recipe/cva variant payloads that reference shared constants across files

The important contract is environment stability:

- same source
- same virtual output semantics
- same extracted CSS locally and in consumer runs

## Non-Goals

- evaluating arbitrary runtime functions inside `css()` or `recipe()`
- supporting fully dynamic authoring that cannot be made static at build time
- reproducing Panda internals one-to-one

If an authored construct cannot be coerced into a static shape, Reference UI should prefer an explicit limitation or diagnostic over silent partial extraction.

## Diagnostics Requirement

If coercion fails or falls back, the system should make that visible.

Ideal behavior:

- emit a warning or failure with the offending file and construct
- say whether the construct was rewritten, partially preserved, or skipped
- keep the debug artifact path inspectable in `.reference-ui/tmp`

The current failure mode is too quiet: nested selector objects degrade to `{}` in Panda debug output without a first-class diagnostic.

## Why This Is Reasonable

This is not overengineering relative to the constraints of this repo.

Reference UI already tests hard cases across:

- local workspaces
- generated virtual trees
- packaged consumer installs
- matrix container runs

Those tests are intentionally severe. They exercise the exact edge cases where a third-party extractor’s AST behavior becomes part of our production contract.

Owning the coercion boundary is a reasonable response to that reality.

## Suggested Rollout

1. Treat `matrix/css-selectors` as the minimum contract fixture for `css()` nested-selector coercion.
2. Add equivalent fixtures for `recipe()` and `cva()` cross-file constant cases.
3. Implement the smallest virtual rewrite that normalizes known-bad patterns.
4. Write the combined `css()` and `recipe()` fragment modules into `.reference-ui/virtual/__reference__ui/` so local and consumer runs feed Panda the same synthetic inputs.
5. Preserve Panda debug artifacts for both local and matrix consumer runs.
6. Expand toward OXC-backed coercion if lightweight rewrites are not sufficient.

## Related Paths

| Area | Path |
| ---- | ---- |
| Current contract fixture | `matrix/css-selectors/` |
| Style probes | `matrix/css-selectors/src/styles.ts`, `matrix/css-selectors/src/constants.ts` |
| Panda runner | `packages/reference-core/src/system/panda/gen/codegen.ts` |
| Virtual system | `packages/reference-core/src/virtual/` |
| Potential transform surface | `packages/reference-core/src/virtual/transforms/` |
| Plain Panda control | `panda-playground/` |
| OXC-related repo notes | `packages/reference-rs/`, `packages/reference-core/src/**` |

## Bottom Line

The production-safe direction is to stop depending on Panda to be the primary evaluator of all authoring-time `css()` and `recipe()` structure.

Reference UI should coerce those authoring surfaces into a static, Panda-friendly shape before extraction.

That keeps Panda in the role it is good at: emitting CSS from clear static inputs.

It moves AST reliability for our hardest cases back under infrastructure we already own.

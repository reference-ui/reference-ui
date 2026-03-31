# Atlas Improvement Plan

## Summary

Atlas is not yet accomplishing the core goal it claims to accomplish.

Today it does **not** perform real React or TypeScript analysis for Atlas-specific use cases. The crate has the right parser foundation available through Oxc, and the `tasty` pipeline already proves this repo can parse and lower TypeScript with Oxc, but Atlas itself is still mostly a placeholder.

The immediate goal should not be to build a huge second TypeScript system inside Atlas. Atlas should stay small and focused:

- discover React components
- map each component to its underlying props type
- aggregate real JSX usage across a project
- hand the resolved type identity to Tasty or an adjacent resolver when upper layers need full prop metadata

That gives the MCP layer something trustworthy without making Atlas a giant parallel compiler.

## What Is True Right Now

### 1. Are we using Oxc for AST work?

Partially, but not in Atlas itself yet.

- `packages/reference-rs/Cargo.toml` includes `oxc_parser`, `oxc_ast`, `oxc_span`, `oxc_allocator`, `oxc_traverse`, and `oxc_semantic`.
- The `tasty` module is clearly Oxc-based and already parses TypeScript in Rust.
- Atlas-specific files are still placeholders:
  - `src/atlas/scanner.rs`
  - `src/atlas/react.rs`
  - `src/atlas/output.rs`
- `js/atlas/analyzer.ts` returns mocked data and explicitly says real scanning/analysis is still TODO.

Conclusion: the repo has an Oxc foundation, but Atlas is not yet using it to do the promised work.

### 2. Do we understand React components and how they are used?

Not yet in the implementation.

The fixture model is good enough to express the problem:

- local wrappers: `Button`, `UserBadge`
- local composition: `AppCard`
- library components: `Button`, `Card`, `Badge`, `Stack`
- page-level JSX usage in `HomePage`, `SettingsPage`, and `ProfilePage`

But Atlas does not currently discover these from source. The current results are hard-coded.

### 3. Do we understand which component belongs to which type?

The intended contract is good, but the implementation is not real yet.

The right shape is already present in `ComponentInterface`:

- `name`: props type name
- `source`: where that type lives

That is the correct abstraction for the upper layers. It lets Atlas answer:

- which React component is this?
- which props type does it accept?
- where should richer metadata be resolved from?

But today Atlas is not actually deriving this relationship from AST analysis.

### 4. Can Atlas currently answer questions like "does this component have a `label` prop"?

Not reliably.

Right now it only returns mocked `props` arrays. For internal MCP usage, the trustworthy answer must come from one of these:

- Atlas resolves the full prop member list from the mapped interface, including inherited members
- or Atlas returns a stable `ComponentInterface` reference and the upper layer resolves prop members through Tasty

The second option is cleaner and keeps Atlas smaller.

## Current Gaps

### Functional gaps

- No real file scanning for Atlas include/exclude behavior
- No real JSX traversal
- No real React component discovery
- No real component-to-interface mapping
- No inherited prop resolution
- No literal-union prop value extraction from real types
- No real example extraction from JSX call sites
- No real co-usage tracking from rendered trees/files

### Product gaps

- Tests are green against mocked output, which creates false confidence
- Atlas is exported in `package.json` as `./atlas`, but `tsup.config.ts` does not build an Atlas entrypoint
- There is no evidence of a real JS-to-native Atlas bridge yet
- Atlas docs are effectively absent compared to Tasty

### Contract gaps

The current contract says Atlas can surface `props` coverage and `ComponentInterface`, but there is no defined boundary for where:

- full prop metadata lives
- inherited members are flattened
- defaults and JSDoc are resolved
- complex utility types are expanded

That boundary must be explicit before this is release-ready, even for internal use.

## Recommended Direction

## Keep Atlas Thin

Atlas should not become a second giant TypeScript engine.

Recommended responsibility split:

- Atlas owns React/component discovery and usage aggregation
- Tasty owns TypeScript type/member resolution
- MCP-facing upper layers compose both views into a richer declarative component surface

In practice, Atlas should produce something like:

- component identity
- component source
- props interface identity
- prop-name coverage for the resolved interface
- observed prop usage counts
- observed literal value distributions
- representative examples
- co-usage relationships

When the caller needs "does it have `label`?", "is `disabled` optional?", or "what does this prop mean?", resolve that from the mapped interface via Tasty.

That preserves a clean separation:

- Atlas answers usage truth
- Tasty answers type truth

## Proposed Architecture

### Phase 1: Real component inventory

Build a minimal Atlas inventory pass that:

- scans included project files
- parses TS/TSX with Oxc
- identifies exported React components
- identifies imported library components eligible for tracking
- normalizes component identity as `{ name, source }`

Supported declaration forms for v1 should be explicit and narrow:

- `function Button(props: ButtonProps)`
- `export function Button(...)`
- `const Button = (props: ButtonProps) => ...`
- wrappers that return a JSX element whose callee is another component

Defer class components and exotic patterns unless they matter internally.

### Phase 2: Component to props-type mapping

For each discovered component, determine the props type from:

- function parameter annotation
- destructured parameter annotation
- local alias or imported type reference
- wrapper reuse of library prop types
- composed local aliases such as `CardProps & { status?: BadgeVariant }`

Required output:

- `Component.interface.name`
- `Component.interface.source`

Required behavior:

- local wrapper `Button` maps to `ButtonProps` from `@fixtures/demo-ui`
- local `AppCard` maps to `AppCardProps` from its local source file
- local `UserBadge` maps to `BadgeProps` from `@fixtures/demo-ui`

### Phase 3: Prop coverage from the underlying type

Atlas must stop inventing prop lists.

For each component, populate `props` from the real underlying props type, including inherited or intersected members where practical. That is the minimum bar for answering questions like "does this component take `label`?"

At minimum for v1:

- direct object type aliases
- interfaces
- interface extension
- intersections like `CardProps & { status?: ... }`
- imported named type aliases/interfaces

If Tasty already has the data needed to enumerate members, Atlas should reuse that instead of duplicating logic.

### Phase 4: JSX usage aggregation

Track real call-site usage across the project:

- component count by JSX element occurrence
- prop count by attribute presence
- literal value distribution for unions and enums when statically visible
- examples deduplicated by prop shape
- co-usage within the same render/file/component tree

For v1, support these value forms:

- string literals
- boolean shorthand and explicit boolean literals
- numeric literals
- enum-like imported identifiers when statically resolvable later

Mark dynamic expressions as observed-but-non-literal rather than pretending they map to a specific value.

### Phase 5: Internal API hardening

Once the analysis is real, make the API safe for internal consumers:

- document supported React/type patterns
- document unsupported patterns and fallback behavior
- ensure deterministic ordering in outputs
- include stable source paths and identifiers
- return partial results with diagnostics rather than silently guessing

## What Release-Ready Means Here

For internal use, release-ready does not mean "handles all TypeScript". It means:

- output is derived from source, not fixtures
- output is deterministic
- component-to-interface mapping is trustworthy for the supported patterns
- failures are visible and diagnosable
- the exported package entrypoint actually exists
- the upper layers can depend on the contract without brittle special cases

That implies the following release gates.

### Release gate 1: Basic truthfulness

- remove mocked `analyze()` behavior
- wire Atlas to a real Rust/native or pure-TS implementation
- ensure package export/build config includes Atlas

### Release gate 2: Supported pattern coverage

Atlas should reliably handle the internal component styles you already use most often:

- local wrappers over library components
- local composition components
- direct props annotations
- imported type aliases
- interface extension/intersection for prop composition

### Release gate 3: Type provenance

Every component in the result should clearly state:

- component source
- interface name
- interface source
- whether props were fully resolved, partially resolved, or unresolved

### Release gate 4: Observability

Add diagnostics for cases like:

- component found but props type unresolved
- JSX usage found for an imported component not included in the inventory
- unsupported type form encountered

### Release gate 5: Packaging

Fix the current export mismatch:

- `package.json` exports `./atlas`
- `tsup.config.ts` currently does not build an Atlas entry
- `dist/` currently has no Atlas artifact

This needs to be corrected before anyone can treat Atlas as a dependable package surface.

## Recommended Test Additions

The biggest issue with the current suite is not coverage count. It is that the tests validate mocked data rather than the actual implementation path.

### Replace mock-contract confidence with pipeline confidence

Add tests that fail unless source is truly parsed and analyzed.

### Test harness shape

Atlas should adopt the same case-first structure as Tasty under `tests/atlas/cases/`.

Recommended layout:

- one direct subfolder per scenario
- `input/app/` for the analyzed project root
- `input/demo-ui/` or other local support modules for library-style usage scenarios
- `api.test.ts` per case for scenario-local assertions
- `output/` reserved for known emitted artifacts once Atlas produces real analysis files

That gives Atlas a stable place to add:

- golden JSON analysis output
- diagnostics output
- perf metrics
- scenario-local setup without overloading a single shared fixture tree

The first seeded case should be the current wrapper/composition scenario now living as `demo_surface`.

#### 1. Native or end-to-end Atlas smoke tests

- run the real Atlas implementation against `fixtures/atlas-project`
- assert that results change if fixture source changes
- assert there is no hard-coded fallback result set

Example: modify a fixture to add a new prop usage and verify counts change.

#### 2. Component discovery tests

- exported function component
- exported arrow component
- default export component
- locally defined but non-exported component should be excluded or explicitly documented
- aliased import names in JSX

#### 3. Interface mapping tests

- direct annotation: `props: ButtonProps`
- destructured parameter annotation
- imported interface from package
- local type alias
- intersection props
- interface `extends`
- wrapper reusing library prop type

#### 4. Prop member enumeration tests

- inherited members appear in `props`
- intersected members appear once, deduplicated
- optional members are present even when never used
- required members are present
- unsupported complex members degrade gracefully with diagnostics

#### 5. Usage tests

- component call-site counts
- prop presence counts
- boolean shorthand counting
- string literal value distributions
- number literal tracking
- dynamic expression handling without false literal attribution

#### 6. Example extraction tests

- examples are JSX snippets only
- examples are deduplicated by shape
- examples are capped deterministically
- example ordering is stable

#### 7. Co-usage tests

- components used in the same file
- components used within the same parent render tree
- repeated co-usage affects ranking predictably

#### 8. Include/exclude tests against real scanning

- include package name
- include local glob
- include scoped selector
- exclude package selector
- exclude local glob
- non-interference between filters

#### 9. Packaging tests

- `@reference-ui/rust/atlas` resolves after build
- emitted `dist/atlas.mjs` and `dist/atlas.d.ts` exist
- exported runtime actually calls the real implementation path

#### 10. Failure-mode tests

- malformed TSX file
- unresolved imported type
- unsupported syntax in props definition
- missing package include target
- partial analysis still returns diagnostics

## Suggested Implementation Order

1. Fix packaging and export reality first.
2. Replace the mocked `analyze()` path with a real pipeline, even if narrow.
3. Implement component discovery for the internal patterns you actually use.
4. Implement component-to-interface mapping.
5. Reuse Tasty for prop member enumeration where possible.
6. Add JSX usage aggregation and examples.
7. Add diagnostics and partial-result behavior.
8. Expand supported patterns only after the core path is trustworthy.

## Suggested Non-Goals For v1

To avoid overbuilding, Atlas v1 should probably not try to solve all of these immediately:

- full TypeScript evaluation
- arbitrary higher-order component unwrapping
- React class components
- runtime conditional component identity
- deep dataflow proving values across files
- full semantic evaluation of computed prop values

If a case cannot be resolved statically, Atlas should say so instead of guessing.

## Bottom Line

If the question is "are we accomplishing what we set out to do?", the honest answer is: **not yet**.

What is present now is:

- a reasonable output shape
- good fixture intent
- an Oxc-capable Rust codebase
- a strong adjacent type pipeline in Tasty

What is missing is the actual Atlas analysis pipeline.

The shortest credible path is:

- keep Atlas small
- make it a real React usage/indexing layer
- reuse Tasty for type truth
- add diagnostics and packaging correctness
- replace mock-driven tests with implementation-driven tests

That would make Atlas usable enough for internal upper layers and for an MCP server that needs to understand the declarative React surface without turning Atlas into an overly complex subsystem.

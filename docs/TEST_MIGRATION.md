# Test Migration Plan

## Why migrate

The current split between `packages/reference-unit` and `packages/reference-e2e` has been useful, but both packages now mix product coverage with test harness work.

- `reference-unit` proves real product behavior, but many of its most valuable checks depend on `happy-dom` workarounds:
	- design-system CSS is injected by hand
	- `@layer` blocks are flattened so computed styles work at all
	- extra tie-break CSS is appended to simulate browser ordering
- `reference-e2e` proves browser behavior, but it also owns a large amount of matrix and sandbox orchestration:
	- environment composition
	- sandbox config mutation
	- ref-sync lifecycle coordination
	- custom project-by-project Playwright execution

That means the current packages do two jobs each:

1. assert product behavior
2. compensate for missing structure in the test system

The pipeline and matrix are now strong enough that we can split those concerns properly.

## Desired end state

We should test `reference-ui` by feature set, using small matrix containers with clear ownership.

Each matrix container should answer one question:

- what consumer shape is under test
- which runner is appropriate
- what part of the product it owns

The default rule should be simple:

- use Vitest for generated outputs, compile-time behavior, type behavior, and sync lifecycle checks inside the container
- use Playwright for real browser assertions: computed styles, layer behavior, responsive layout, color-mode scoping, and other DOM/runtime behavior where browser CSS semantics matter

This is also the right place to stop forcing browser-style assertions through `happy-dom`.

## What should change structurally

The new primary test surface should be `matrix/`, not `reference-unit` or `reference-e2e`.

Each matrix package should follow the same layout:

```text
matrix/<feature-container>/
	unit/
	e2e/
	src/
	ui.config.ts
	package.json
```

The package owns the consumer fixture. The pipeline owns the container setup and runner invocation.

This gives us a cleaner split:

- product fixture and assertions live in the matrix package
- generic orchestration belongs in the matrix runner and shared helpers
- legacy package-specific hacks stop being the organizing principle

## Proposed feature containers

### 1. `matrix/typescript`

Purpose:

- generated declarations
- public API type consumption
- strict token typing
- compile-only downstream usage

Runner:

- Vitest
- `tsc --noEmit`

Primary migrations:

- `packages/reference-unit/tests/types/*`
- `packages/reference-unit/tests/reference/types-package.test.ts`
- `packages/reference-unit/tests/packager-ts.test.ts`
- any compile-only reference API checks that do not need a browser

Notes:

- this package already exists and is the clearest place to start consolidating type-facing coverage
- tests here should focus on consumer-facing declaration quality, not runtime CSS behavior

### 2. `matrix/install`

Purpose:

- cold `ref sync` output shape
- emitted package layout under `.reference-ui/`
- virtual file copying
- package metadata and generated file presence

Runner:

- primarily Vitest

Primary migrations:

- `packages/reference-unit/tests/ref-sync.test.ts`
- `packages/reference-unit/tests/virtual/*`
- `packages/reference-unit/tests/reference/output.test.ts`
- output-shape assertions that currently live in unit tests only because they are easy to read from disk

Notes:

- this container should stay non-browser unless a specific install flow actually requires browser interaction
- its job is to prove generated artifact shape, not visual correctness

### 3. `matrix/watch`

Purpose:

- `ref sync --watch` lifecycle
- ready-signal semantics
- rebuild-on-change behavior
- stale output handling and recovery behavior

Runner:

- Vitest for process control and file-system assertions
- optional Playwright only when the rebuilt output must be observed in a browser

Primary migrations:

- `packages/reference-unit/tests/watch/*`
- `packages/reference-unit/tests/tokens/fragment-sync.test.ts`
- watch-oriented parts of `packages/reference-e2e/src/tests/core/sync-watch.spec.ts`
- watch-oriented parts of `packages/reference-e2e/src/tests/core/token-sync-watch.spec.ts`

Notes:

- this should become the home for sync lifecycle contracts that are currently split across both legacy packages
- if a test is really asserting file readiness or process behavior, it belongs here, not in Playwright by default

### 4. `matrix/design-systems`

Purpose:

- config-shape scenarios: root-only, `extends`, `layers`, mixed ownership
- config mutation and resync behavior
- authored fixture components from extension or layer libraries
- layer scoping contracts

Runner:

- Vitest for config writing, sync output, and generated CSS/package assertions
- Playwright for token resolution, `data-layer` behavior, and authored component rendering in a real browser

Primary migrations:

- `packages/reference-e2e/src/tests/extend/*`
- `packages/reference-e2e/src/tests/layer/*`
- `packages/reference-unit/tests/extends/*`
- `packages/reference-unit/tests/layers/*`
- overlap from `packages/reference-unit/tests/color-mode/*` where the real subject is config-driven token ownership

Notes:

- this is the best place to combine the strongest parts of the current legacy suites
- `reference-e2e` already has the right scenario model here, but too much infra is embedded in the package
- `reference-unit` already has useful assertions here, but many of them are browser assertions disguised as unit tests

### 5. `matrix/system-styles`

Purpose:

- primitives and style props
- token resolution in runtime CSS
- global CSS, keyframes, JSX element output
- responsive container queries
- color-mode behavior when the assertion depends on real CSS semantics

Runner:

- Playwright first
- Vitest only for output-level assertions that do not require a browser

Primary migrations:

- `packages/reference-e2e/src/tests/core/style-props.spec.ts`
- `packages/reference-e2e/src/tests/core/tokens.spec.ts`
- `packages/reference-e2e/src/tests/core/color-mode.spec.ts`
- `packages/reference-e2e/src/tests/core/jsx-elements.spec.ts`
- `packages/reference-e2e/src/tests/core/container-responsive.spec.ts`
- `packages/reference-unit/tests/color-mode/data-prop.test.tsx`
- `packages/reference-unit/tests/primitives/fontComputedStyle.test.tsx`
- browser-style parts of `packages/reference-unit/tests/system/*.test.tsx`
- browser-style parts of `packages/reference-unit/tests/primitives/*`

Notes:

- this is where we should move the tests currently distorted by `happy-dom`
- if the assertion is about computed color, font family, layer ordering, or container queries, it should be here

## How to split current tests

The right migration axis is not old package name. It is assertion type.

### Keep in Vitest

These belong in Vitest-based matrix containers:

- generated file existence
- package.json content
- declaration graph stability
- compile-only type checks
- ref-sync lifecycle and process behavior
- output snapshots where we only need to read emitted files

Concrete examples:

- `packager-ts.test.ts`
- `ref-sync.test.ts`
- `virtual/*`
- `types/*`
- `system/*-output.test.ts`

### Move to Playwright

These should migrate to Playwright-based matrix coverage:

- computed colors and backgrounds
- font-family and font-weight resolution
- `@layer` ordering behavior
- global theme and nested color-mode scope behavior
- container query behavior
- style props that depend on actual browser CSS application

Concrete examples:

- `tests/color-mode/data-prop.test.tsx`
- `tests/layers/component.test.tsx`
- `tests/extends/component.test.tsx`
- `tests/system/globalCss.test.tsx`
- `tests/system/keyframes.test.tsx`
- `tests/system/fontSystem.test.tsx`
- `tests/system/size.test.tsx` when the assertion is computed-style based

### Split mixed suites

Some current suites contain both output assertions and browser assertions. These should be split rather than moved wholesale.

Examples:

- `reference-e2e` layer/config tests: generated CSS assertions belong in Vitest, runtime scoping assertions belong in Playwright
- `reference-unit` system tests: `*-output.test.ts` stays Vitest, `.test.tsx` browser-style checks move to Playwright
- watch tests: file readiness and process semantics stay Vitest; UI-visible watch behavior only goes to Playwright if a browser is actually required

## What this means for the legacy packages

### `reference-unit`

This package should stop being the home for browser-semantics tests.

Its biggest problems are now architectural rather than functional:

- it makes browser assertions through `happy-dom`
- it injects generated CSS by hand
- it rewrites CSS semantics to get tests to pass

That does not mean its assertions are wrong. It means many of the best assertions belong in a real browser container now.

### `reference-e2e`

This package should stop being the place where matrix infrastructure lives by default.

Its current value is high because it already tests real consumer scenarios, but the package has grown a second responsibility:

- it composes environments
- mutates config
- coordinates sync
- carries custom matrix runner assumptions

That shared machinery should move downward into reusable matrix helpers, while the scenario-specific assertions move outward into feature containers.

## Recommended migration order

### Phase 1: move the obvious wins first

Start with the tests where the correct runner is already clear.

1. Move type and declaration coverage into `matrix/typescript`.
2. Move sync-output and generated-file checks into `matrix/install`.
3. Move computed-style and container-query checks into `matrix/system-styles` Playwright coverage.

These are the least ambiguous migrations and will immediately reduce reliance on `happy-dom`.

### Phase 2: introduce a design-system scenario container

Build `matrix/design-systems` around a small number of explicit consumer modes:

- root-only consumer
- extends consumer
- layers consumer
- mixed consumer

This container should absorb the overlap between `reference-unit` and `reference-e2e` for:

- extends
- layers
- config mutation
- token ownership and scope
- authored fixture components

### Phase 3: isolate watch behavior

Create `matrix/watch` only after the lifecycle contract is explicit.

This container should own:

- what counts as ready
- what rebuilds on which file changes
- how stale outputs and interrupted runs recover

This is important because the current watch assertions are useful, but they are not really owned by either legacy package.

### Phase 4: shrink legacy packages

Once feature containers exist, `reference-unit` and `reference-e2e` should become temporary compatibility suites rather than the main test architecture.

The likely end state is:

- keep a very small legacy smoke layer while migration is underway
- remove migrated coverage from the legacy packages aggressively
- eventually retire most of the bespoke harness logic from both packages

## Immediate decisions worth adopting now

1. Treat `happy-dom` as unsuitable for browser-CSS correctness in this repo.
2. Treat computed-style assertions as Playwright by default.
3. Treat matrix packages as the new home for consumer fixtures and feature ownership.
4. Treat `reference-unit` and `reference-e2e` as migration sources, not as the desired final structure.

## First concrete migration targets

If we want to start with the highest-leverage slices, the best first targets are:

1. `reference-unit/tests/types/*` and `tests/packager-ts.test.ts` into `matrix/typescript`
2. `reference-unit/tests/ref-sync.test.ts` and `tests/virtual/*` into `matrix/install`
3. `reference-unit/tests/color-mode/data-prop.test.tsx` plus `reference-e2e` style-props/tokens/container-responsive into `matrix/system-styles`
4. `reference-e2e` extend/layer coverage plus `reference-unit` extends/layers coverage into `matrix/design-systems`

That sequence gives us early structural clarity while also removing the most awkward `happy-dom` coverage first.

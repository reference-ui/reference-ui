# TEST_RELEASE_PLAN

## Goal

Make `@reference-ui/core` release-ready by treating tests as a product contract, not just a regression net.

Release-ready means:

- core features are verified directly at the module level
- critical CLI flows are verified end-to-end
- failure modes have explicit tests, not just happy-path coverage
- generated artifacts are deterministic across reruns
- the release gate is clear enough that we know when "ship it" is justified

## Current Assessment

### Short version

`reference-core` is **feature-ready, but not yet release-ready**.

### Why it is in decent shape

- `layers` and `extends` now have strong behavioral coverage downstream in `reference-app` and `reference-test`
- `reference-core` already has targeted tests around:
  - fragment collection and runtime bundling
  - layer CSS transform behavior
  - font type registry generation
  - fragment extension APIs
  - some system API helpers
- the full system suite currently passes, which is a strong signal that the current architecture works in real flows

### Why it is not release-ready yet

The most dangerous code in `reference-core` is still under-tested directly:

- `src/config/*` has no direct test suite for validation, loading, evaluation, and error contracts
- `src/packager/*` has little to no direct verification of install behavior, symlinks, placeholder injection, rerun idempotence, or type packaging
- `src/clean/*` has no direct tests
- `src/watch/*` has no direct tests for event mapping, include filtering, and ignore behavior
- `src/system/base/*` has no direct tests for `baseSystem` artifact generation and CSS attachment
- worker orchestration and failure propagation are not pinned down inside `reference-core`
- there is no explicit release test matrix or hard release gate document today

In other words: the features work, but the package that implements them still relies too much on downstream proof instead of owning its own contracts.

## Release Standard

Before calling `reference-core` releasable, we should satisfy all of the following:

1. Every critical module has a direct test suite.
2. Every feature has both a happy path and at least one negative-path test.
3. Every generated artifact has a deterministic assertion somewhere.
4. Every lifecycle command that mutates disk has an idempotence or rerun test.
5. The release gate runs the same way locally and in CI.

## Test Strategy

We should use three rings of confidence.

### Ring 1: Fast module tests in `reference-core`

Purpose:
Prove local correctness of parsing, validation, transforms, packaging helpers, and orchestration pieces.

Target characteristics:

- no browser
- minimal filesystem fixtures
- deterministic
- very fast
- most failures point directly to one module

### Ring 2: Contract tests in `reference-app`

Purpose:
Prove that `ref sync` produces correct generated outputs in a real app environment.

Target characteristics:

- artifact-focused
- verifies generated CSS, bundles, and types
- exercises real file output and rerun behavior

### Ring 3: Environment breadth in `reference-test`

Purpose:
Prove cross-environment behavior across React versions, bundlers, and runtime environments.

Target characteristics:

- fewer assertions than Ring 1
- broader compatibility coverage
- confidence that contracts survive outside the primary app fixture

## Required Workstreams

## 1. Config Loading And Validation

Status: `missing direct coverage`

Files:

- `src/config/validate.ts`
- `src/config/load.ts`
- `src/config/evaluate.ts`
- `src/config/bundle.ts`
- `src/config/errors.ts`

Must-have tests:

- valid config with required `name` and `include`
- missing `name`
- blank `name`
- unsafe `name` values with quotes or newlines
- missing `include`
- non-array `include`
- invalid `extends` entry types
- invalid `extends` entries missing `name`
- invalid `extends` entries missing `fragment`
- `layers` entries without `css` warn but do not fail
- default export vs direct object export
- config evaluation failure surfaces a stable error

Release note:
This is the highest-priority missing direct test area because config is the root of every command.

## 2. Base System Artifact Contracts

Status: `thin`

Files:

- `src/system/base/create.ts`
- `src/system/base/fragments.ts`

Must-have tests:

- `baseSystem.mjs` contains the expected `name`
- `baseSystem.mjs` contains portable `fragment`
- `updateBaseSystemCss()` attaches `css` without corrupting existing fields
- `baseSystem.d.mts` is emitted correctly
- rerunning base artifact creation is deterministic
- malformed existing `baseSystem.mjs` does not silently produce bad output

Release note:
`baseSystem` is the handoff object for both `extends` and `layers`; this should feel as locked down as a public API.

## 3. Packager And Install Contracts

Status: `thin`

Files:

- `src/packager/install.ts`
- `src/packager/run.ts`
- `src/packager/symlink.ts`
- `src/packager/bundler/*`
- `src/packager/ts/*`

Must-have tests:

- packages install into the expected outDir structure
- symlinks are created in `node_modules/@reference-ui/*`
- rerunning install is idempotent
- React bundle placeholder replacement injects `config.name`
- placeholder replacement does not leave `__REFERENCE_UI_LAYER_NAME__` behind
- non-React packages are not mutated unexpectedly
- generated type packages are copied and linked correctly
- missing bundle output fails loudly
- packaging failure propagates clearly

Release note:
This is one of the most publication-critical areas because even correct generated CSS is useless if installation or linking is flaky.

## 4. Clean And Rerun Behavior

Status: `missing direct coverage`

Files:

- `src/clean/command.ts`

Must-have tests:

- clean removes the configured outDir
- clean is a no-op when the outDir does not exist
- clean respects custom outDir
- clean after partial sync leaves a recoverable state
- clean does not remove unrelated directories

Release note:
This is small code with outsized user impact. It should be trivially safe and heavily trusted.

## 5. Watch And Virtual Filesystem Flow

Status: `missing direct coverage`

Files:

- `src/watch/worker.ts`
- `src/virtual/copy-all.ts`
- `src/virtual/worker.ts`

Must-have tests:

- watcher event mapping: create -> add, update -> change, delete -> unlink
- include glob filtering works as expected
- `node_modules` changes are ignored
- virtual mirror adds, updates, and removes files correctly
- unrelated files do not leak into the virtual output
- repeated edits do not duplicate output or create stale state

Release note:
This area is a common source of "works once, flakes later" bugs. It needs direct confidence, not just integration confidence.

## 6. Worker Orchestration And Failure Propagation

Status: `thin`

Files:

- `src/system/workers/config.ts`
- `src/system/workers/panda.ts`
- `src/packager/worker.ts`
- `src/packager/ts/worker.ts`

Must-have tests:

- config worker writes expected outputs
- Panda worker failure surfaces a stable, actionable error
- packager worker failure does not leave a silently "ready" system
- downstream phases do not run on failed upstream phases
- rerunning after worker failure recovers cleanly

Release note:
This is where release confidence becomes operational confidence.

## 7. Feature Contracts

Status: `improving, but still split across packages`

Features that must be release-gated explicitly:

- `tokens`
- `keyframes`
- `font`
- `patterns`
- `extends`
- `layers`
- primitive generation
- generated type augmentation

Must-have test shape for each feature:

- unit-level transform or helper test in `reference-core`
- app-level artifact test in `reference-app`
- at least one environment or browser-level contract in `reference-test` for the highest-risk features

Release note:
The goal is not more tests everywhere. The goal is a clear ownership model for where each contract lives.

## 8. Native N-API / Rust Release Readiness

Status: `partially defined, not yet release-gated`

Files:

- `src/virtual/native/Cargo.toml`
- `src/virtual/native/package.json`
- `src/virtual/native/src/lib.rs`
- `src/virtual/native/src/rewrite.rs`
- `src/virtual/native/loader.ts`
- `src/virtual/transforms/rewrite-css-imports.ts`
- `src/virtual/transforms/rewrite-cva-imports.ts`

Current native target list:

- `x86_64-apple-darwin`
- `aarch64-apple-darwin`
- `x86_64-pc-windows-msvc`
- `x86_64-unknown-linux-gnu`

Must-have test coverage:

- native rewrite behavior matches the expected JS-side transform contract
- `rewriteCssImports` handles supported import shapes correctly
- `rewriteCvaImports` handles supported import shapes correctly
- aliasing behavior is correct
- type-only imports are ignored correctly
- files with no relevant imports are returned unchanged
- parse failures or load failures surface stable, actionable errors
- loader resolves the correct binary name for each supported platform
- unsupported platforms fail predictably
- missing native binary fails predictably

Must-have release/distribution coverage:

- each declared target can actually be built in CI
- each target artifact can be loaded by Node successfully
- the binary is packaged in the location the loader expects
- release artifacts are named consistently with the loader's platform map
- macOS Intel and Apple Silicon are both verified
- Linux x64 GNU is verified
- Windows x64 MSVC is verified
- the supported-platform error message stays in sync with the real target list

Recommended release matrix:

- macOS x64
- macOS arm64
- Linux x64 GNU
- Windows x64 MSVC

Release note:
This is not just a correctness problem. It is a publishing problem. A native binding that works locally but is not built, packaged, and loadable on every supported target is a release blocker.

## 9. Determinism And Snapshot-Style Output Contracts

Status: `partial`

Must-have outputs to pin down:

- `panda.config.ts`
- `baseSystem.mjs`
- packaged `react.mjs`
- packaged `system.d.mts` and `react.d.mts`
- generated `types.generated.d.mts`
- final `styles.css`

Must-have assertions:

- rerun without source changes produces equivalent output
- rename-sensitive outputs update everywhere they should
- placeholders are fully replaced
- stale artifacts do not survive successful reruns

Release note:
Release quality depends heavily on deterministic generated output.

## 10. Negative And Recovery Testing

Status: `started downstream, still sparse in core`

Must-have recovery cases:

- interrupted sync
- missing upstream `fragment` for `extends`
- missing upstream `css` for `layers`
- malformed config file
- bundler output missing a required file
- filesystem already contains stale partial artifacts

Release note:
If we care about "just works every time", this section is not optional.

## Proposed Phases

## Phase 1: Must Have Before Release

- direct config validation/load tests
- direct baseSystem tests
- direct packager install tests
- clean command tests
- watch/virtual direct tests
- worker failure propagation tests

Definition of done:

- every module above has at least one focused test file
- happy path plus negative path for each area
- no known untested critical entrypoint remains

## Phase 2: Release Gate Hardening

- deterministic artifact assertions for all generated outputs
- rerun/idempotence tests for sync, packager, and clean
- failure-recovery tests where partial outputs already exist
- native target packaging and load verification for every supported platform

Definition of done:

- reruns are proven safe
- interruption and stale-artifact scenarios are explicitly covered
- native binaries are proven buildable and loadable on all supported targets

## Phase 3: Compatibility Confidence

- maintain `reference-test` matrix for React/bundler breadth
- expand only the highest-risk cross-environment feature contracts

Definition of done:

- broad environments confirm the already-proven contracts

## Suggested CI Release Gate

A release candidate should not be cut unless all of these are green:

1. `pnpm --filter @reference-ui/core run build`
2. `pnpm --filter @reference-ui/core run typecheck`
3. `pnpm --filter @reference-ui/core run test`
4. `pnpm --filter @reference-ui/reference-app run test`
5. `REF_TEST_FRESH=1 pnpm --filter @reference-ui/reference-test run test:quick`
6. `pnpm test:e2e`

In addition, a publishable release of `reference-core` with native bindings should have a platform matrix that proves:

1. the N-API binary builds on macOS x64
2. the N-API binary builds on macOS arm64
3. the N-API binary builds on Linux x64 GNU
4. the N-API binary builds on Windows x64 MSVC
5. a Node smoke test can load the built binary on each target
6. the packaged artifact path matches what `src/virtual/native/loader.ts` expects

For rapid iteration, `pnpm test:system` should remain the fast unit/integration loop for `reference-core` and `reference-app`, while `pnpm test:e2e` stays the full publish gate that also runs `reference-test`.

## Where We Are Right Now

If we had to score readiness today:

- feature completeness: `high`
- downstream behavioral confidence: `high`
- direct `reference-core` critical-path confidence: `medium-low`
- release confidence for publishing the package as infrastructure: `medium`

My current judgment:

- safe to keep iterating internally
- safe to demo
- increasingly safe for dogfooding
- **not yet where I would want it for a crisp public release of the core package**

The gap is no longer "does it work?".
The gap is "have we proven the dangerous parts of the implementation well enough that regressions will be caught before users do?".

## Immediate Next Moves

Recommended order:

1. add direct tests for `src/config/validate.ts` and config loading/evaluation
2. add direct tests for `src/system/base/create.ts`
3. add direct tests for `src/packager/install.ts` placeholder injection and idempotence
4. add direct tests for `src/clean/command.ts`
5. add direct tests for `src/watch/worker.ts` event mapping and filtering
6. add one worker-failure recovery suite
7. define and automate the native N-API release matrix for macOS, Linux, and Windows

That sequence closes the most serious release-readiness gap fastest.

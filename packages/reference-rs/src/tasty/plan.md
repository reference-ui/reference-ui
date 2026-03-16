# Tasty Implementation Plan

## Purpose

This plan tracks the implementation work needed to move from the current Rust
scanner/bundle output to the broader Tasty runtime described in:

* `high-level.md`
* `high-level-api.md`

This document is intentionally forward-looking. It is no longer an audit or a
retrospective of the scanner feature work already completed.

---

## Current position

We already have a strong base:

* the Rust scanner covers the modeled `TypeRef` surface described in
  `OXC_TYPE_AUDIT.md`
* the existing `tests/tasty/cases/*` bundle tests give us good confidence in the
  emitted graph shape
* `tests/virtualfs/*` covers the native rewrite surface through the compiled
  N-API binding

What changed since this plan was first drafted:

* the dedicated TypeScript runtime layer in `js/tasty` now exists
* Rust-owned contract types are being generated into `js/tasty/generated`
* the runtime has its own direct API tests in `js/tasty/index.test.ts`

What we do **not** have yet is full hardening coverage across all existing Tasty
fixture scenarios.

---

## North-star direction

The direction is now:

1. clean up the Rust surface so the emitted/public contract is explicit
2. generate TypeScript types from that Rust-owned contract
3. build `js/tasty` as the runtime graph API over those artifacts
4. test the runtime API with the same fixture discipline we already use for
   bundle tests

Tasty itself should remain:

* a graph runtime
* lazy and manifest-first
* Rust-contract-driven

It should **not** become:

* a second compiler
* a docs framework
* an MCP framework

Docs, MCP, hover, and other downstream consumers should build on top of the core
runtime.

---

## Phase 1: Refactor the Rust contract surface

### Status

Largely complete.

### Goal

Create a dedicated Rust model entry point for the emitted/public Tasty contract.

### Why first

Before we build `js/tasty`, we need a stable place in Rust that clearly says:
"these are the types we expose to TypeScript."

Right now that boundary is blurred by the current `api.rs` shape.

### Work

* rename or split the current public Tasty types into `src/tasty/model.rs`
* move request/orchestration input types like `ScanRequest` out of that contract
  surface into a separate module such as `request.rs`
* keep parser-adjacent and lowering-internal types out of `model.rs`
* make `src/tasty/mod.rs` re-export the public model cleanly

### Desired result

By the end of this phase:

* `model.rs` is the Rust-owned emitted artifact contract
* scanner/lowering internals remain internal
* the TypeScript generation story has a clear source of truth

---

## Phase 2: Decide and wire Rust -> TypeScript type generation

### Status

Complete for the current contract surface.

### Goal

Generate TypeScript boundary types directly from the Rust model contract.

### Work

* choose the Rust -> TypeScript generation approach/library
* scope generation to the Tasty contract model, not the whole crate
* emit generated TypeScript contract types into a clear location under
  `packages/reference-rs/js/`

Suggested direction:

* `packages/reference-rs/js/tasty/generated/`

### Desired result

By the end of this phase:

* TypeScript does not maintain parallel hand-written copies of the Rust contract
* generated types are easy to import from the future runtime layer
* contract drift between Rust and TypeScript becomes much harder

---

## Phase 3: Create `js/tasty`

### Status

Complete for the initial manifest/chunk runtime slice.

### Goal

Introduce the TypeScript runtime layer described in `high-level-api.md`.

### Initial scope

The first implementation pass should stay small and core-runtime-focused:

* manifest loading
* chunk loading
* symbol lookup by id/name
* wrapper identity stability
* core graph operations under `api.graph`

### Suggested layout

Something like:

* `packages/reference-rs/js/tasty/`
* `packages/reference-rs/js/tasty/generated/`
* `packages/reference-rs/js/tasty/index.ts`

### Important boundary

Do **not** bake docs or MCP helper namespaces into the core runtime.

The runtime should expose:

* loader/store behavior
* graph wrappers
* graph traversal operations

Downstream layers can then consume that runtime in their own way.

---

## Phase 4: Runtime API tests

### Status

Started and working, but not yet exhaustively applied to every Tasty fixture
scenario.

### Goal

Test the TypeScript runtime API against real generated Tasty artifacts.

### Strategy

We already have strong bundle-shape tests in `tests/tasty/cases`.

The next step is to add API tests alongside them, using the same scenarios and
fixture discipline.

That means:

* keep the existing bundle tests
* add API tests for each use case as needed
* use the compiled/native output rather than mocking the graph

### Suggested direction

For each useful scenario, we should be able to test things like:

* exact symbol lookup by name/id
* wrapper stability
* `getMembers()`
* `getExtends()`
* `loadExtendsSymbols()`
* `api.graph.loadImmediateDependencies()`
* `api.graph.loadExtendsChain()`
* flattened interface views
* raw vs structured type-ref inspection

### Test placement

We do not need a separate giant test universe for the runtime.

Instead, we should leverage the scenarios we already have under `tests/tasty/`
and add API-oriented assertions alongside the current bundle assertions.

---

## Phase 5: Hardening

### Goal

Harden the Tasty runtime so it is reliable across the full fixture matrix we
already use for emitted bundle validation.

This phase is not about downstream docs or MCP adoption yet.

This phase is about making the core runtime a pocket rocket:

* broad fixture coverage
* predictable graph behavior
* fewer regressions during future schema/runtime changes
* confidence that every supported Tasty case works through the TypeScript API,
  not just through raw emitted bundle inspection

### Work

The core hardening task is:

* add API-level tests to each scenario under `packages/reference-rs/tests/tasty/cases/*`

Concretely, that means:

* keep the existing bundle-shape tests
* add runtime-oriented assertions per case where they are missing
* exercise `createTastyApi()` against each case's emitted manifest/chunk output
* validate the scenario-specific graph behavior, not just generic smoke checks

Examples of the kinds of assertions we should cover across the matrix:

* symbol lookup by name and id
* wrapper identity stability
* member access
* type-parameter access
* underlying type access for aliases
* extends traversal where applicable
* dependency collection where applicable
* type-ref inspection/description for the scenario's specialty

### Desired result

By the end of this phase:

* every Tasty fixture scenario has at least some direct runtime API coverage
* regressions show up in the runtime layer, not only in emitted object snapshots
* future schema/runtime refactors can move faster with better confidence

---

## Practical sequence

If we keep this concrete, the next steps should be:

1. keep the Rust contract and generated TypeScript types stable
2. keep `js/tasty` focused on manifest-first graph runtime behavior
3. add API tests alongside the existing Tasty case suite
4. extend API coverage across every `tests/tasty/cases/*` scenario
5. close runtime behavior gaps revealed by those scenario-level tests

---

## Guardrails

As we build this, we should keep these guardrails explicit:

* Rust remains the source of truth for the artifact contract
* the runtime stays lazy and manifest-first
* symbol wrappers stay thin
* recursive graph logic lives in graph operations, not everywhere
* docs/MCP are consumers of Tasty, not sub-frameworks inside Tasty
* bundle tests and runtime API tests should both stay fixture-driven

---

## Immediate next step

The immediate next implementation step is:

* add API-level tests for each scenario under `packages/reference-rs/tests/tasty/cases/*`
  so the runtime is validated against the full fixture matrix, not just a small
  representative subset

That is the highest-value hardening work now that the core runtime and generated
contract layer are already in place.

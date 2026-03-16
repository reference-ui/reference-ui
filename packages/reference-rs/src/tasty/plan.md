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

What we do **not** have yet is the dedicated TypeScript runtime layer for
loading, traversing, and consuming Tasty artifacts.

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

## Phase 5: First consumer proof

### Goal

Prove that the runtime is actually good enough for a real downstream consumer.

The first proof does not need to be a full docs site or a full MCP product.

A good early proof would be:

* load a symbol
* inspect members and type refs
* walk inheritance
* assemble a simple API-table-ready shape outside the runtime itself

That validates the most important architectural claim:

the core Tasty runtime is enough for downstream consumers to shape their own
outputs without Tasty owning those projections directly.

---

## Practical sequence

If we keep this concrete, the next steps should be:

1. refactor `src/tasty/api.rs` into a dedicated `model.rs` contract boundary
2. separate request/orchestration types from the exposed model
3. choose and wire Rust -> TypeScript type generation
4. create `js/tasty`
5. implement the first minimal runtime slice:
   manifest + chunk + symbol lookup + graph wrappers
6. add API tests alongside the existing tasty case suite
7. prove the runtime with one small downstream consumer-shaped example

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

* refactor the Rust Tasty surface so there is a dedicated `model.rs` entry point
  for the public/emitted types we intend to expose and transform to TypeScript

That is the cleanest place to start because it sharpens the boundary for every
phase that follows.

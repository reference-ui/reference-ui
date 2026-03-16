# Reference UI TypeScript API — High-Level Design

## Purpose

This document outlines the broad shape of the TypeScript-side high-level API that consumes the generated bundle artifacts emitted by Tasty.

The goal of this layer is **not** to parse TypeScript, lower AST, or understand Oxc internals. That work is already done by Rust.

The TypeScript API exists to:

* load generated bundle artifacts
* resolve symbols by name or id
* traverse the symbol graph
* assemble higher-level views for docs and MCP
* lazy load additional chunks only when needed
* provide a clean ergonomic runtime API over the emitted object graph

---

## Core architectural idea

Tasty emits a graph of JavaScript objects.

Those objects are split into chunks/modules.

A manifest tells the runtime where things live.

The TypeScript high-level API loads only the chunks it needs.

Graph traversal pulls in more chunks only when necessary.

That is the actual optimisation story.

Which means:

we do **not** need to obsess too much over whether a bundler can tree-shake inside a hypothetical 10mb universe, provided that:

* the 10mb is not one eager module
* it is partitioned well
* the lazy loader only imports what is needed

That is already the major win.

---

## Layer responsibilities

### Rust / Tasty layer

Responsible for:

* scanning TypeScript source
* lowering Oxc AST into Reference UI IR
* building symbol/type graph data
* emitting manifest + chunked JS object modules
* preserving raw type expressions where needed
* producing diagnostics and metrics

This layer is authoritative.

### TypeScript high-level API layer

Responsible for:

* reading the manifest
* resolving symbol names to ids
* resolving ids to chunks
* dynamically importing chunks
* caching loaded chunks and symbols
* traversing references
* combining related objects into docs/MCP-friendly views
* exposing ergonomic helpers for consumers

This layer should be lightweight and ergonomic.

It should **not** attempt to reimplement the Rust compiler/lowering logic.

In this repository, the natural home for this layer is:

* `packages/reference-rs/js/tasty`

That keeps the runtime API colocated with the Rust package and the generated
artifact contract it consumes.

---

## Design principles

### 1. Rust compiles, TypeScript composes

Rust owns:

* correctness
* lowering
* normalization
* exhaustiveness
* artifact generation

TypeScript owns:

* runtime lookups
* graph traversal
* composition
* lazy loading
* consumer ergonomics

Concretely:

* Rust should expose the emitted artifact contract from a dedicated
  `src/tasty/model.rs`
* TypeScript should consume generated types from that Rust-owned contract inside
  `js/tasty`

### 2. Manifest-first loading

The API should always begin from a small eager manifest, not a giant eagerly imported bundle.

### 3. Chunk-level lazy loading

The main performance win comes from only importing the modules required for the current query or page.

### 4. Stable graph traversal

Named symbols remain first-class graph nodes.

The TypeScript API should follow references deliberately, not eagerly rebuild the whole universe.

### 5. Denormalize where helpful

The emitted object graph should be optimized for loading and consumption, not theoretical purity.

A little repetition is acceptable if it reduces runtime assembly cost.

---

## Broad artifact model

These artifact shapes are the contract that should be generated from the Rust
model layer, not hand-maintained separately in TypeScript.

### Manifest

A small eager module containing summary metadata and load locations.

Broadly includes:

* symbol name -> symbol id lookup
* symbol id -> chunk metadata lookup
* minimal symbol summaries
* maybe route/page metadata later

Example conceptual shape:

```ts
export interface SymbolIndexEntry {
  id: string;
  name: string;
  kind: string;
  chunk: string;
}

export interface TastyManifest {
  symbolsByName: Record<string, string>;
  symbolsById: Record<string, SymbolIndexEntry>;
}
```

### Chunk modules

Generated JS modules containing actual symbol objects.

Example conceptual shape:

```ts
export const _$0 = {
  id: "_$0",
  kind: "interface",
  name: "ButtonProps",
  members: [...],
  extends: [...],
  types: [...],
};
```

### Symbol graph

Each symbol can reference:

* other named types
* inherited interfaces
* related aliases
* object/member type structures

The TypeScript API should navigate this graph lazily.

---

## TypeScript API Surface

The concrete runtime API shape lives in `high-level-api.md`.

This document should stay focused on architecture, responsibilities, boundaries,
and the broader design goals for the system.

At a high level, the TypeScript layer should expose:

* manifest-first loading
* lazy symbol and chunk access
* graph traversal helpers
* docs/MCP composition helpers

But the specific function list, object model, and usage examples should live in
the separate API-focused document so we do not duplicate or drift.

---

## Tree-shaking vs lazy loading

This system should optimise primarily for **lazy loading**, not for maximal internal tree-shaking purity.

That means the most important questions are:

* are chunks small enough and partitioned well?
* are symbols directly addressable?
* does the manifest let us find them cheaply?
* does traversal only import what we need?

Classic bundler tree-shaking is still helpful, but it is not the main optimisation mechanism.

The main mechanism is:

* chunk boundaries
* dynamic imports
* selective graph traversal

---

## Normalisation expectations

The TypeScript API should assume the emitted objects are already normalized enough to be useful.

It should **not** need to:

* understand Oxc node kinds
* lower raw TypeScript syntax
* resolve TypeScript semantics from scratch
* infer meaning from arbitrary strings

It **may** need to:

* traverse references
* flatten inherited members
* combine views for docs
* render raw type summaries where appropriate

---

## Contract boundaries

The TypeScript API should consume generated contract types emitted from Rust.

The intended Rust boundary is:

* `src/tasty/model.rs` for the emitted/public artifact model
* scanner/lowering internals stay in their own internal modules
* request/orchestration types like `ScanRequest` do not need to be part of the
  generated TypeScript runtime contract unless they are explicitly exposed

Rust remains the source of truth for:

* manifest schema
* symbol schema
* type reference schema
* diagnostics schema

The TypeScript API should use generated contract types rather than drift into hand-maintained copies of boundary structures.

That means TypeScript should not define its own parallel versions of:

* bundle manifest types
* symbol graph node types
* type reference unions
* diagnostics payloads

---

## What should stay out of this layer

The high-level TypeScript API should not become:

* a second compiler
* a second lowering pass
* a TypeScript evaluator
* a bundler
* a docs-site-specific tangle

It should remain a clean runtime composition layer over the generated artifact graph.

---

## Near-term implementation plan

### Phase 1

* split the Rust artifact contract into `src/tasty/model.rs`
* keep scanner request/orchestration types separate from the emitted model
* define manifest contract
* define chunk contract
* generate TypeScript contract types from the Rust model
* create `js/tasty`
* implement manifest loader
* implement chunk loader
* implement symbol cache
* implement core symbol lookup by id and name

### Phase 2

* implement reference traversal helpers
* implement shallow dependency loading
* implement inheritance flattening
* implement basic docs shaping

### Phase 3

* implement MCP-friendly query helpers
* add prefetch hooks
* add search helpers
* add richer docs composition

---

## Final position

The TypeScript high-level API is not where the hard type-system work happens.

That work is already done.

The high-level API exists to make the generated graph:

* easy to load
* easy to traverse
* easy to combine
* easy to consume for docs and MCP

That is the correct boundary.

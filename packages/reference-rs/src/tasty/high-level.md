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

export interface BundleManifest {
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

## What the TypeScript API should expose

## Loader primitives

Low-level functions that do the minimum necessary work.

Broad examples:

* `loadManifest()`
* `loadChunk(path)`
* `loadSymbolById(id)`
* `loadSymbolByName(name)`
* `prefetchChunk(path)`
* `prefetchSymbol(nameOrId)`

These should be small, predictable, and cache-aware.

## Graph helpers

Helpers for following references and combining related objects.

Broad examples:

* `resolveReference(ref)`
* `loadImmediateDependencies(symbol)`
* `loadExtendsChain(symbol)`
* `loadRelatedTypes(symbol)`
* `flattenInterfaceMembers(symbol)`
* `collectUserOwnedReferences(symbol)`

These helpers should be explicit about whether they are:

* shallow
* recursive
* eager
* lazy

## Docs-oriented helpers

Helpers that shape raw symbol graph data into docs-ready output.

Broad examples:

* `buildApiTable(symbol)`
* `buildTypeLabel(typeRef)`
* `buildDocsEntry(symbol)`
* `buildInheritanceView(symbol)`
* `buildRelatedSymbolsView(symbol)`

These should be consumers of the graph, not owners of the graph.

## MCP-oriented helpers

Helpers for serving the MCP use case.

Broad examples:

* `getSymbolSummary(name)`
* `getSymbolDetails(name)`
* `getSymbolDependencies(name)`
* `searchSymbols(query)`
* `describeTypeRef(typeRef)`

These should prioritise stable structured output and fast lookup.

---

## Caching strategy

The TypeScript API should cache at two levels.

### Chunk cache

Avoid importing the same chunk module more than once.

### Symbol cache

Avoid repeatedly resolving the same symbol object from the same chunk.

Broad shape:

```ts
const chunkCache = new Map<string, Promise<unknown>>();
const symbolCache = new Map<string, unknown>();
```

Cache invalidation is not a runtime concern for static generated artifacts in normal operation.

---

## Loading strategy

### Initial load

Load only:

* application shell
* manifest
* maybe minimal search index metadata

### Symbol load

When a consumer requests a symbol:

1. resolve name -> id from manifest
2. resolve id -> chunk from manifest
3. dynamically import chunk
4. read exported symbol object
5. cache result

### Graph expansion

Only load additional chunks when:

* a related symbol is explicitly requested
* a docs page needs inherited or referenced symbols
* MCP asks for deeper information
* hover/preview/prefetch behavior is triggered

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

## Error handling

The TypeScript API should produce clear failures for:

* unknown symbol names
* missing symbol ids
* missing chunks
* missing exports inside a chunk
* malformed manifest entries

Errors should be practical and diagnostics-friendly.

Example categories:

* `UnknownSymbolError`
* `MissingChunkError`
* `MissingExportError`
* `ManifestContractError`

---

## Contract boundaries

The TypeScript API should consume generated contract types emitted from Rust.

Rust remains the source of truth for:

* manifest schema
* symbol schema
* type reference schema
* diagnostics schema

The TypeScript API should use generated contract types rather than drift into hand-maintained copies of boundary structures.

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

## Broad example usage

```ts
const api = await createReferenceApi({ manifestPath: "/reference/manifest.js" });

const symbol = await api.loadSymbolByName("ButtonProps");
const docsEntry = await api.buildDocsEntry(symbol);
const dependencies = await api.loadImmediateDependencies(symbol);
```

This is the sort of ergonomic shape we want.

---

## Near-term implementation plan

### Phase 1

* define manifest contract
* define chunk contract
* implement manifest loader
* implement chunk loader
* implement symbol cache
* implement `loadSymbolById`
* implement `loadSymbolByName`

### Phase 2

* implement reference resolution helpers
* implement shallow dependency loading
* implement inheritance flattening helpers
* implement basic docs table shaping

### Phase 3

* implement MCP-friendly query helpers
* add prefetch hooks
* add search helpers
* add richer docs composition helpers

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

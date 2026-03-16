# Reference UI TypeScript API — High-Level API Draft

## Purpose

This document drafts the public-facing shape of the TypeScript runtime API that
will consume Tasty artifacts.

Unlike `high-level.md`, this file is intentionally API-focused:

* the functions we want
* the object model we want
* the loading and caching behavior we want
* the ergonomics we want for downstream consumers like docs and MCP

It should not describe Rust source layout or internal scanner implementation in
detail. That belongs in the broader architectural docs.

---

## Design stance

We can absolutely take inspiration from existing libraries here.

Good sources of inspiration:

* `ts-morph` for discoverable, object-oriented ergonomics
* ORM/client libraries for cache-aware loaders and explicit fetch methods
* docs/indexing runtimes for manifest-first lazy loading

But we should only copy the **API feel**, not the underlying architecture.

Tasty should feel pleasant in the hand like `ts-morph`, while still being a
lazy graph runtime over Rust-emitted artifacts rather than a compiler wrapper.

---

## Suggested runtime layers

The runtime should stay intentionally split into four layers.

### 1. Store / loader layer

Pure loading and caching.

Examples:

* `loadManifest()`
* `loadChunk(path)`
* `loadSymbolById(id)`
* `prefetchChunk(path)`

This layer should know nothing about docs or MCP formatting.

### 2. Graph object layer

Thin wrappers over Rust-emitted contracts.

Examples:

* `TastySymbol`
* `TastyMember`
* `TastyTypeRef`
* `TastySymbolRef`

This layer exposes local inspection and a small amount of obvious navigation.

### 3. Graph operations layer

Reusable higher-level traversals over the graph.

Examples:

* `api.graph.resolveReference(ref)`
* `api.graph.loadImmediateDependencies(symbol)`
* `api.graph.loadExtendsChain(symbol)`
* `api.graph.flattenInterfaceMembers(symbol)`

This layer is still graph/domain logic, not presentation logic.

### 4. Consumer projection layer

Consumer-shaped outputs.

Examples:

* docs builders that turn a `TastySymbol` into an API table
* MCP handlers that walk the graph and shape stable responses
* hover or preview builders layered on top of the core runtime

This layer should live outside the core Tasty runtime.

This separation matters because otherwise `TastySymbol` slowly becomes the
dumping ground for every convenience method in the system.

---

## What the TypeScript API should expose

### Loader primitives

Low-level functions that do the minimum necessary work.

Broad examples:

* `loadManifest()`
* `loadChunk(path)`
* `loadSymbolById(id)`
* `loadSymbolByName(name)`
* `prefetchChunk(path)`
* `prefetchSymbolById(id)`
* `prefetchSymbolByName(name)`

These should be small, predictable, and cache-aware.

### Graph operations

Core traversal and graph operations over loaded/runtime graph data.

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

### Consumer-facing usage

The core Tasty API should be sufficient for downstream consumers such as:

* docs table builders
* inheritance viewers
* MCP symbol handlers
* hover or preview generators

Those consumers should compose on top of the core runtime rather than require
special baked-in helper namespaces inside Tasty itself.

---

## Draft API shape

### API rules

These rules should stay stable unless there is a strong reason to break them.

* cheap local accessors are synchronous
* graph-expanding operations are asynchronous
* symbol wrappers are identity-stable by symbol id
* docs and MCP should consume the core runtime rather than rely on baked-in
  helper namespaces
* the runtime consumes Rust-generated contracts and should not define parallel
  hand-maintained boundary types

---

### Proposed manifest contract

The manifest should be versioned from the start.

Broadly:

```ts
export interface SymbolIndexEntry {
  id: string;
  name: string;
  kind: string;
  chunk: string;
}

export interface TastyManifest {
  version: string;
  symbolsByName: Record<string, string>;
  symbolsById: Record<string, SymbolIndexEntry>;
}
```

### Proposed top-level entrypoint

Broadly:

```ts
export interface CreateTastyApiOptions {
  manifestPath: string;
  importer?: (path: string) => Promise<unknown>;
}

export interface TastyApi {
  ready(): Promise<void>;

  loadManifest(): Promise<TastyManifest>;
  getManifest(): TastyManifest | undefined;

  loadSymbolById(id: string): Promise<TastySymbol>;
  loadSymbolByName(name: string): Promise<TastySymbol>;
  findSymbolByName(name: string): Promise<TastySymbol | undefined>;

  prefetchChunk(path: string): Promise<void>;
  prefetchSymbolById(id: string): Promise<void>;
  prefetchSymbolByName(name: string): Promise<void>;

  searchSymbols(query: string): Promise<TastySymbolSearchResult[]>;

  graph: TastyGraphApi;
}

export function createTastyApi(options: CreateTastyApiOptions): TastyApi;
```

This gives us a small root object that feels familiar and stable.

`ready()` should guarantee that the manifest has been loaded and validated.
Implementations may also warm lightweight search metadata or other small
indexes, but `ready()` should not eagerly load symbol chunks.

### Proposed object-oriented symbol surface

Instead of making consumers work directly with plain emitted records everywhere,
the runtime API can wrap those records in light helper objects.

Broadly:

```ts
export interface TastySymbol {
  getId(): string;
  getName(): string;
  getKind(): string;
  getLibrary(): string | undefined;

  getRaw(): TsSymbol;
  getMembers(): TastyMember[];
  getTypeParameters(): TsTypeParameter[];
  getExtends(): TastySymbolRef[];
  getUnderlyingType(): TastyTypeRef | undefined;

  loadExtendsSymbols(): Promise<TastySymbol[]>;
}
```

This is the main place where `ts-morph` is a good inspiration source:

* names like `getMembers()` and `getTypeParameters()` are easy to discover
* symbols feel like first-class runtime objects
* graph traversal can hang off the symbol naturally

But unlike `ts-morph`, these objects should stay thin. They are wrappers over
manifest/chunk-loaded Rust-emitted graph data, not AST nodes.

Cheap local inspection and graph expansion should stay clearly separated.

Examples:

* `getExtends()` returns already-known local references
* `loadExtendsSymbols()` loads the actual parent symbols
* `getMembers()` is cheap and local

### Proposed member and type-ref helpers

Broadly:

```ts
export interface TastyMember {
  getName(): string;
  isOptional(): boolean;
  isReadonly(): boolean;
  getKind(): string;
  getType(): TastyTypeRef | undefined;
  getRaw(): TsMember;
}

export interface TastyTypeRef {
  getKind(): string;
  getRaw(): TypeRef;
  isRaw(): boolean;
  getSummary(): string | undefined;
  isLiteral(): boolean;
  isUnion(): boolean;
  isArray(): boolean;
  isReference(): boolean;
  getTypeArguments(): TastyTypeRef[];
  getReferencedSymbol(): TastySymbolRef | undefined;
  describe(): string;
}
```

The wrapper layer should be minimal.

If a helper becomes expensive or recursive, its name should make that obvious.

### Proposed symbol-reference wrapper

There is an important distinction between:

* a fully loaded `TastySymbol`
* a local reference to another symbol that has not been loaded yet

Broadly:

```ts
export interface TastySymbolRef {
  getId(): string;
  getName(): string;
  getKind(): string | undefined;
  getLibrary(): string | undefined;
  isLoaded(): boolean;
  getIfLoaded(): TastySymbol | undefined;
  load(): Promise<TastySymbol>;
}
```

This keeps local inspection cheap while still giving consumers a clear upgrade
path to the fully loaded symbol.

### Sync vs async examples

Examples:

* `getMembers()` is cheap and local
* `getExtends()` is cheap and local
* `loadImmediateDependencies()` is async and graph-expanding
* `loadExtendsSymbols()` is async and graph-expanding
* `loadExtendsChain()` is async and potentially recursive

### Proposed graph operations split

The runtime should expose graph-level operations, but it should stop short of
owning docs or MCP projections.

Broadly:

```ts
export interface TastyGraphApi {
  resolveReference(ref: TastySymbolRef): Promise<TastySymbol>;
  loadImmediateDependencies(symbol: TastySymbol): Promise<TastySymbol[]>;
  loadExtendsChain(symbol: TastySymbol): Promise<TastySymbol[]>;
  flattenInterfaceMembers(symbol: TastySymbol): Promise<TastyFlattenedMember[]>;
  collectUserOwnedReferences(symbol: TastySymbol): Promise<TastySymbolRef[]>;
}
```

This should hang off the main `TastyApi` instance as `api.graph`.

Docs and MCP layers can then consume `api` and `api.graph` however they need to
without Tasty owning those projections directly.

### Naming direction

The API should prefer semantic graph names over compiler/AST names.

Good:

* `TastyApi`
* `TastySymbol`
* `TastyMember`
* `TastyTypeRef`
* `loadSymbolByName`
* `api.graph.loadImmediateDependencies`
* core graph/runtime primitives that downstream consumers can compose

Avoid:

* `TypeAliasDeclarationNode`
* `PropertySignatureWrapper`
* `CompilerHostLikeProject`
* anything that implies we are re-exposing the TypeScript compiler

---

## Caching strategy

The TypeScript API should cache at three levels.

### Chunk cache

Avoid importing the same chunk module more than once.

### Raw symbol cache

Avoid repeatedly resolving the same emitted symbol contract from the same chunk.

### Wrapper cache

Avoid repeatedly creating new wrapper objects for the same symbol id.

Wrapper identity should be stable:

```ts
const a = await api.loadSymbolById('_$0');
const b = await api.loadSymbolByName('ButtonProps');

// if both resolve to the same symbol id, they should ideally be the same wrapper instance
expect(a).toBe(b);
```

Broad shape:

```ts
const chunkCache = new Map<string, Promise<unknown>>();
const rawSymbolCache = new Map<string, TsSymbol>();
const wrapperCache = new Map<string, TastySymbol>();
```

Cache invalidation is not a runtime concern for static generated artifacts in
normal operation.

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
* a downstream consumer needs inherited or referenced symbols
* hover/preview/prefetch behavior is triggered

### Search

Search should operate on manifest or search-index metadata.

Search should **not** require importing symbol chunks just to return candidate
results.

Full symbol loading should happen only after selection.

Broadly:

```ts
export interface TastySymbolSearchResult {
  id: string;
  name: string;
  kind: string;
  library?: string;
  chunk: string;
  score?: number;
}
```

Search results include `chunk` metadata so consumers can prefetch likely symbol
selections without loading full symbol contracts up front.

---

## Error handling

The TypeScript API should produce clear failures for:

* unknown symbol names
* missing symbol ids
* missing chunks
* missing exports inside a chunk
* malformed manifest entries
* manifest/runtime version mismatches

Errors should be practical and diagnostics-friendly.

Example categories:

* `UnknownSymbolError`
* `MissingChunkError`
* `MissingExportError`
* `ManifestContractError`
* `VersionMismatchError`

Potential future category:

* `SymbolCollisionError`

### Throw boundaries

Error behavior should stay predictable.

* exact lookup methods like `loadSymbolByName()` and `loadSymbolById()` may
  throw `UnknownSymbolError`
* nullable lookup methods like `findSymbolByName()` should return `undefined`
  rather than throw on a miss
* prefetch methods may reject with loading errors like `MissingChunkError`
* downstream consumers built on top of Tasty may surface traversal/loading
  errors from underlying graph operations
* search should not throw for "no results"; it should return an empty array

---

## Determinism rules

The runtime should behave deterministically within a single API instance.

* wrapper identity is stable per symbol id
* repeated calls should not trigger duplicate chunk imports
* search ordering should be stable for equal scores
* inheritance traversal should preserve declared order where possible
* flattened members should define override/conflict rules explicitly

---

## Broad example usage

### Minimal loader-oriented usage

```ts
const api = createTastyApi({ manifestPath: '/reference/manifest.js' });

await api.ready();

const symbol = await api.loadSymbolByName('ButtonProps');
```

### More ergonomic graph usage

```ts
const api = createTastyApi({ manifestPath: '/reference/manifest.js' });

await api.ready();
const buttonProps = await api.loadSymbolByName('ButtonProps');
const members = buttonProps.getMembers();
const extendsChain = await api.graph.loadExtendsChain(buttonProps);
```

That is probably the sweet spot:

* `ts-morph`-like ergonomics
* Rust-owned contracts
* manifest/chunk lazy loading
* no fake compiler API
* docs and MCP built on top rather than embedded inside the core runtime

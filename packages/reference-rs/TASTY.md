# TASTY

Tasty is the TypeScript metadata system inside `@reference-ui/rust`.

At a high level, it does two things:

1. Rust scans a TypeScript workspace and emits metadata artifacts.
2. A TypeScript runtime loads those artifacts lazily and exposes them as a graph API.

The point is not to rebuild the TypeScript compiler in JavaScript.
The point is to make TypeScript symbols, members, and type relationships easy to
load, traverse, and consume for downstream tooling.

## What Tasty Is For

Tasty is built for tasks like:

- API docs
- symbol browsing
- inheritance inspection
- lightweight graph queries
- MCP or editor-facing metadata consumers

Tasty is not trying to be:

- a second compiler
- a second lowering pass
- a bundler
- a docs framework
- an MCP framework

Rust owns compilation-adjacent correctness.
TypeScript owns runtime loading, traversal, and ergonomics.

## Mental Model

Tasty emits a graph of JavaScript objects.

That graph is split into:

- one small eager manifest
- many lazy chunk modules

The runtime loads the manifest first, then imports symbol chunks only when a
consumer asks for something that needs them.

That means the real optimization story is lazy loading, not heroic tree-shaking.

## End-To-End Flow

The full flow looks like this:

1. Scan TypeScript source in Rust.
2. Lower the relevant symbol and type information into a Rust-owned Tasty model.
3. Emit:
   - a manifest module
   - chunk modules containing symbol objects
   - generated TypeScript contract types for the raw artifact shape
4. Create a Tasty runtime instance in TypeScript with `createTastyApi()`.
5. Load symbols lazily and traverse the graph through wrapper objects.

## Package Surface

There are two relevant entrypoints in this package.

### `@reference-ui/rust`

The lower-level native binding surface.

This exposes:

- `scanAndEmitBundle()`
- `scanAndEmitModules()`
- `rewriteCssImports()`
- `rewriteCvaImports()`

### `@reference-ui/rust/tasty`

The Tasty runtime API.

This exposes:

- `createTastyApi()`
- `TastyApi`
- `TastySymbol`
- `TastyMember`
- `TastyTypeRef`
- `TastySymbolRef`
- generated raw contract aliases as `RawTasty*`

## Artifact Model

Tasty currently uses a manifest-first artifact model.

### Manifest

The manifest is a small eager module containing:

- `version`
- `symbolsByName`
- `symbolsById`

Each symbol index entry includes:

- `id`
- `name`
- `kind`
- `chunk`
- `library`

That lets the runtime:

- resolve a symbol name to an id
- resolve the id to a chunk path
- delay loading the actual symbol object until needed

### Chunk Modules

Chunk modules contain emitted symbol objects keyed by exported ids.

The runtime imports a chunk only when:

- a symbol is loaded directly
- a reference is followed
- a graph operation expands into related symbols

### Raw Contract Types

The raw artifact contract is generated from Rust into:

- `packages/reference-rs/js/tasty/generated/`

Those generated types use the `Tasty*` naming scheme.

The runtime re-exports them as `RawTasty*` aliases so consumers can inspect the
exact raw artifact shape without confusing those raw types with the higher-level
wrapper interfaces.

## Runtime Model

The runtime is intentionally split into three layers.

### 1. Loader / store layer

This owns:

- manifest loading
- chunk loading
- caching
- symbol lookup by name and id

### 2. Wrapper layer

This owns:

- `TastySymbol`
- `TastyMember`
- `TastyTypeRef`
- `TastySymbolRef`

These wrappers are intentionally thin.
They make the graph pleasant to use, but they are not AST nodes and they are not
supposed to absorb every consumer-specific convenience.

### 3. Graph operations layer

This hangs off `api.graph` and owns reusable traversals like:

- `resolveReference()`
- `loadImmediateDependencies()`
- `loadExtendsChain()`
- `flattenInterfaceMembers()`
- `collectUserOwnedReferences()`

This layer is graph logic, not presentation logic.

## Runtime API

The top-level API shape is:

```ts
import { createTastyApi } from '@reference-ui/rust/tasty'

const api = createTastyApi({
  manifestPath: '/path/to/output/manifest.js',
})

await api.ready()
```

From there, consumers can:

- load the manifest
- resolve symbols
- inspect wrappers
- traverse the graph lazily

### Core loader methods

- `ready()`
- `loadManifest()`
- `getManifest()`
- `loadSymbolById()`
- `loadSymbolByName()`
- `findSymbolByName()`
- `prefetchChunk()`
- `prefetchSymbolById()`
- `prefetchSymbolByName()`
- `searchSymbols()`

### `TastySymbol`

`TastySymbol` is the main graph node wrapper.

It exposes:

- `getId()`
- `getName()`
- `getKind()`
- `getLibrary()`
- `getRaw()`
- `getMembers()`
- `getTypeParameters()`
- `getExtends()`
- `getUnderlyingType()`
- `loadExtendsSymbols()`

### `TastyMember`

`TastyMember` exposes:

- `getName()`
- `isOptional()`
- `isReadonly()`
- `getKind()`
- `getType()`
- `getRaw()`

### `TastyTypeRef`

`TastyTypeRef` exposes:

- `getKind()`
- `getRaw()`
- `isRaw()`
- `getSummary()`
- `isLiteral()`
- `isUnion()`
- `isArray()`
- `isReference()`
- `getTypeArguments()`
- `getReferencedSymbol()`
- `describe()`

### `TastySymbolRef`

`TastySymbolRef` exists for local references that may not be loaded yet.

It exposes:

- `getId()`
- `getName()`
- `getKind()`
- `getLibrary()`
- `isLoaded()`
- `getIfLoaded()`
- `load()`

## Sync vs Async Rules

Tasty follows a simple rule:

- cheap local inspection is synchronous
- graph-expanding work is asynchronous

Examples:

- `symbol.getMembers()` is synchronous
- `symbol.getExtends()` is synchronous
- `symbol.loadExtendsSymbols()` is asynchronous
- `api.graph.loadExtendsChain()` is asynchronous
- `api.graph.loadImmediateDependencies()` is asynchronous

## Caching Rules

The runtime caches at three levels.

### Manifest cache

The manifest is loaded once per API instance.

### Chunk cache

The same chunk should not be imported multiple times.

### Wrapper cache

Wrapper identity should be stable per symbol id.

This means:

```ts
const byName = await api.loadSymbolByName('ButtonProps')
const byId = await api.loadSymbolById(byName.getId())

expect(byName).toBe(byId)
```

That behavior is intentional and tested.

## Current Type Modeling

Tasty does not model every TypeScript type-level construct as a fully semantic
structure.

It models the useful documentation-oriented graph shape directly, and preserves
the harder or lower-priority cases as raw source summaries.

### Structured today

Tasty currently models these families structurally:

- intrinsic keywords
- literal types
- unions
- arrays
- tuples
- intersections
- object type literals
- type references
- indexed access types
- function types
- constructor types
- type operators
- type queries
- conditional types
- mapped types
- template literal types

### Intentionally raw today

Tasty still preserves some variants as raw source text:

- import types
- `infer`
- type predicates
- `this` types
- JSDoc-only type variants

“Raw” is not an error state.
It means the original type expression is preserved as `summary` text rather than
being lowered into a richer structural form.

That makes it possible to stay honest about unsupported complexity without
dropping information.

## Design Principles

These are the important design rules behind Tasty.

### Rust is the source of truth

Rust owns:

- emitted contract structure
- lowering behavior
- artifact generation

TypeScript should not maintain parallel hand-written copies of boundary types.

### Manifest-first loading

The runtime begins with a small eager manifest, not a giant eager graph module.

### Chunk-level lazy loading

Load only the symbols and related chunks required by the current query.

### Thin wrappers

Wrappers should stay readable and useful, but not become a dumping ground for
consumer-specific projection logic.

### Consumer projections live outside the core runtime

Docs, MCP, hover builders, and other projections should build on top of Tasty.

## Example

Emit artifacts:

```ts
import { scanAndEmitModules } from '@reference-ui/rust'

const emitted = JSON.parse(
  scanAndEmitModules('/workspace', ['src/**/*.{ts,tsx}'])
)
```

Load and query them:

```ts
import { createTastyApi } from '@reference-ui/rust/tasty'

const api = createTastyApi({
  manifestPath: '/workspace/output/manifest.js',
})

await api.ready()

const buttonProps = await api.loadSymbolByName('ButtonProps')

const members = buttonProps.getMembers()
const extendsRefs = buttonProps.getExtends()
const parents = await buttonProps.loadExtendsSymbols()
const flattened = await api.graph.flattenInterfaceMembers(buttonProps)
```

Inspect raw type information when needed:

```ts
const member = buttonProps.getMembers()[0]
const typeRef = member.getType()

console.log(typeRef?.getKind())
console.log(typeRef?.describe())
console.log(typeRef?.getRaw())
```

## Testing and Hardening

Tasty is tested in two ways.

### Bundle-shape tests

Fixture-driven tests under:

- `packages/reference-rs/tests/tasty/cases/*/bundle.test.ts`

These verify the emitted artifact shape directly.

### Runtime API tests

Fixture-driven API tests under:

- `packages/reference-rs/tests/tasty/cases/*/api.test.ts`
- `packages/reference-rs/js/tasty/index.test.ts`

These verify that the runtime layer itself behaves correctly over real emitted
artifacts.

The full package test suite currently covers:

- Rust tests
- Tasty emitted contract tests
- Tasty bundle-shape tests
- Tasty runtime API tests
- virtual rewrite tests

## Current Status

Today, Tasty has:

- a Rust-owned emitted contract
- generated TypeScript raw contract types
- a working manifest/chunk runtime
- graph wrapper types
- graph traversal helpers
- fixture-driven runtime coverage across the current Tasty case matrix

The core system is in place and working.

What remains is mostly iterative hardening and future expansion, not foundational
architecture.

## Files To Know

If you are working on Tasty, these are the main files and directories:

- `packages/reference-rs/src/tasty/`
- `packages/reference-rs/src/tasty/model.rs`
- `packages/reference-rs/src/tasty/emitted.rs`
- `packages/reference-rs/js/tasty/index.ts`
- `packages/reference-rs/js/tasty/generated/`
- `packages/reference-rs/tests/tasty/`

More focused internal docs already exist here:

- `src/tasty/high-level.md`
- `src/tasty/high-level-api.md`
- `src/tasty/OXC_TYPE_AUDIT.md`
- `src/tasty/plan.md`

This file is the package-level, Tasty-only overview.

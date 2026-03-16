# @reference-ui/rust

Rust-backed runtime and artifact tooling for `reference-ui`.

This package now primarily exists to power **Tasty**: a Rust-generated,
manifest-first TypeScript metadata runtime for loading and traversing symbol
graphs lazily from emitted artifacts.

It also still exposes the native rewrite helpers used by the rest of the
workspace.

## What This Package Exposes

### `@reference-ui/rust/tasty`

The Tasty runtime API.

Use this when you want to:

- load a generated Tasty manifest
- resolve symbols by name or id
- traverse extends and dependency relationships lazily
- inspect emitted raw type metadata through a small wrapper API

Main entrypoints:

- `createTastyApi()`
- `api.loadManifest()`
- `api.loadSymbolByName()`
- `api.loadSymbolById()`
- `api.graph.loadExtendsChain()`
- `api.graph.flattenInterfaceMembers()`
- `api.graph.collectUserOwnedReferences()`

### `@reference-ui/rust`

The lower-level native binding surface.

Use this when you want to:

- rewrite CSS imports
- rewrite CVA imports
- scan TypeScript and emit Tasty artifact modules

Main entrypoints:

- `rewriteCssImports()`
- `rewriteCvaImports()`
- `scanAndEmitBundle()`
- `scanAndEmitModules()`

## Tasty In One Sentence

Tasty turns a TypeScript workspace into Rust-owned metadata artifacts, then lets
TypeScript consumers load that graph back lazily through a small runtime API.

The shape is:

1. Rust scans TypeScript and emits a manifest plus chunk modules.
2. `createTastyApi()` loads the manifest first.
3. Symbols and related chunks are imported only when requested.
4. Consumers work with `TastySymbol`, `TastyMember`, `TastyTypeRef`, and
   `TastySymbolRef` wrappers rather than raw object blobs everywhere.

## Basic Flow

Emit modules with the native runtime:

```ts
import { scanAndEmitModules } from '@reference-ui/rust'

const emitted = JSON.parse(
  scanAndEmitModules('/path/to/workspace', ['src/**/*.{ts,tsx}'])
)

console.log(emitted.entrypoint)
console.log(Object.keys(emitted.modules))
```

Load and query them with Tasty:

```ts
import { createTastyApi } from '@reference-ui/rust/tasty'

const api = createTastyApi({
  manifestPath: '/path/to/output/manifest.js',
})

await api.ready()

const symbol = await api.loadSymbolByName('ButtonProps')
const members = symbol.getMembers()
const inherited = await api.graph.loadExtendsChain(symbol)
```

## Runtime Model

The Tasty runtime is intentionally split into layers:

- loader/store behavior: manifest loading, chunk loading, caching
- graph wrappers: `TastySymbol`, `TastyMember`, `TastyTypeRef`, `TastySymbolRef`
- graph operations: higher-level traversals under `api.graph`

It is deliberately not:

- a second TypeScript compiler
- a docs framework
- an MCP framework

Those should build on top of Tasty rather than live inside it.

## Generated Contract Types

The raw artifact contract is generated from Rust into:

- `js/tasty/generated/`

The Tasty runtime re-exports those generated types as `RawTasty*` aliases so
consumers can inspect the exact emitted contracts when needed, while still using
the higher-level wrapper API for normal graph access.

## Native Addon Requirement

This package depends on the compiled native addon. In local development, make
sure the native binary exists before using scan/rewrite APIs:

```sh
pnpm --filter @reference-ui/rust run build
```

or:

```sh
pnpm --filter @reference-ui/rust run ensure-native
```

## Testing

Run the full package test suite with:

```sh
pnpm --filter @reference-ui/rust run test
```

This covers:

- Rust tests for the native layer and emitted contracts
- fixture-driven Tasty bundle tests
- fixture-driven Tasty API tests
- virtual rewrite tests

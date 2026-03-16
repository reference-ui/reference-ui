# Tasty

Tasty is the TypeScript metadata system inside `@reference-ui/rust`.

It has two halves:

1. a Rust scanner/emitter that turns TypeScript source into metadata artifacts
2. a TypeScript runtime that loads those artifacts lazily as a graph API

This directory owns the Rust side of that system.

## What Tasty Does

Tasty is designed for:

- API docs
- symbol browsing
- inheritance inspection
- graph queries over user TypeScript
- downstream tooling such as MCP or editor-like consumers

Tasty is not trying to become:

- a second TypeScript compiler
- a second lowering pass
- a bundler
- a docs framework
- an MCP framework

Rust owns the metadata contract and artifact generation.
TypeScript owns runtime loading, traversal, and ergonomics.

## End-To-End Shape

The full flow looks like this:

1. discover and read the relevant TypeScript files
2. parse them with OXC
3. resolve symbols and references into a normalized internal graph
4. emit a Tasty artifact surface:
   - manifest module
   - chunk modules
   - raw generated TypeScript contract types
5. load those artifacts through `js/tasty`

The runtime starts from a small eager manifest and imports symbol chunks only
when needed.

That is the main performance story: manifest-first, chunk-level lazy loading.

## Scan Boundary

User space defines the scan.

### User space

For files under the scan root, Tasty maps:

- exported interfaces and type aliases
- non-exported interfaces and type aliases needed to keep the graph coherent

The goal is a complete user-owned type graph, not just a list of public names.

### Libraries

Tasty does not eagerly ingest all of `node_modules`.

A library file is only pulled in when the user re-exports something from that
module, for example:

- `export type { X } from 'some-library'`
- `export * from 'some-library'`

From there, Tasty follows imports that stay within the same package, but does
not recurse through arbitrary dependency trees.

## Current Architecture

The important files in this directory are:

| Path | Role |
| --- | --- |
| `mod.rs` | module entrypoint and public re-exports |
| `request.rs` | scan request input types |
| `model.rs` | internal normalized graph IR (`TypeScriptBundle`, `TsSymbol`, `TypeRef`, etc.) |
| `emitted.rs` | emitted/public raw Tasty artifact contract generated to TS |
| `scan.rs` | top-level orchestration for scan and emit flows |
| `scanner/` | workspace/file discovery and source loading |
| `ast/` | OXC extraction and graph resolution |
| `generator/esm.rs` | manifest + chunk module emission |
| `tests/` | Rust-side smoke tests |

The critical distinction is:

| Layer | What it is | What it is not |
| --- | --- | --- |
| OXC AST | parser-facing syntax tree | public runtime contract |
| `model.rs` | normalized internal IR | emitted JS/TS artifact surface |
| `emitted.rs` | raw Tasty artifact contract | ergonomic runtime wrapper API |
| `js/tasty` | lazy runtime graph API | compiler/lowering layer |

## Artifact Model

Tasty currently emits a manifest-first artifact set.

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

### Chunk modules

Each chunk contains actual symbol objects keyed by exported ids.

### Raw generated contract types

The emitted contract is generated from Rust into:

- `packages/reference-rs/js/tasty/generated/`

These are the raw artifact types consumed by the TypeScript runtime.

## Runtime Surface

The TypeScript runtime lives in:

- `packages/reference-rs/js/tasty`

It exposes:

| Area | Main API |
| --- | --- |
| loader/store | `createTastyApi()`, `loadManifest()`, `loadSymbolByName()`, `loadSymbolById()` |
| wrappers | `TastySymbol`, `TastyMember`, `TastyTypeRef`, `TastySymbolRef` |
| graph ops | `api.graph.resolveReference()`, `loadImmediateDependencies()`, `loadExtendsChain()`, `flattenInterfaceMembers()`, `collectUserOwnedReferences()` |

The runtime follows two rules:

- cheap local inspection is synchronous
- graph-expanding operations are asynchronous

## Public Runtime Model

The core runtime wrapper types are:

| Wrapper | Purpose |
| --- | --- |
| `TastySymbol` | main graph node for interfaces and type aliases |
| `TastyMember` | member metadata and type access |
| `TastyTypeRef` | structured or raw type inspection |
| `TastySymbolRef` | lightweight edge to another symbol that may not be loaded yet |

Some especially important methods are:

| API | Meaning |
| --- | --- |
| `symbol.getMembers()` | cheap local member inspection |
| `symbol.getExtends()` | cheap local extends references |
| `symbol.loadExtendsSymbols()` | async load of parent symbols |
| `symbol.getUnderlyingType()` | alias definition access |
| `typeRef.describe()` | cheap display-oriented description |
| `typeRef.getRaw()` | exact raw emitted contract |

## Comment and JSDoc Capture

Tasty captures leading comments on symbols and members in three forms:

| Field | Meaning |
| --- | --- |
| `description` | display-friendly summary |
| `descriptionRaw` | normalized comment text including tags |
| `jsdoc` | lightweight parsed JSDoc object with `summary` and flat `tags` |

This is a best-effort JSDoc pass-through layer, not a full TSDoc semantic model.

## Type Surface Coverage

Tasty now models a substantial part of the OXC type surface structurally.

### Structured today

| Category | Examples |
| --- | --- |
| intrinsics | `string`, `number`, `boolean`, `bigint`, `symbol`, `never`, `void` |
| literals | `'sm'`, `42`, `true` |
| references | `ButtonProps`, `Array<T>`, `OptionalKeys<User>` |
| unions/intersections | `A | B`, `A & B` |
| arrays/tuples | `T[]`, `[string, number]`, named/optional/rest tuple elements |
| object literals | `{ foo: string }` |
| indexed access | `T[K]`, `User['name']` |
| function types | `(value: T) => U` |
| constructor types | `new (...args) => T`, `abstract new (...) => T` |
| type operators | `keyof`, `readonly`, `unique` |
| type queries | `typeof themeConfig` |
| conditional types | `T extends U ? A : B` |
| mapped types | `{ [K in keyof T]?: T[K] }` |
| template literals | `` `size-${"sm" | "lg"}` `` |

### Intentionally raw today

| Category | Why raw |
| --- | --- |
| import types | requires richer module/export semantics |
| `infer` | only really useful with deeper type-level evaluation |
| type predicates | describes narrowing behavior more than data shape |
| `this` types | highly context-dependent |
| JSDoc-only type variants | outside the main TS syntax modeling path |

For those cases, Tasty still preserves the original source text as
`Raw { summary }`.

See `OXC_TYPE_AUDIT.md` for the per-variant matrix.

## Current Status

Tasty is no longer just a scanner experiment. The core system is now in place.

### Implemented

| Area | Status |
| --- | --- |
| Rust scanner and normalized IR | implemented |
| manifest + chunk emission | implemented |
| Rust-generated TS raw contract types | implemented |
| `js/tasty` runtime | implemented |
| wrapper API | implemented |
| graph operations | implemented |
| fixture-driven bundle tests | implemented |
| fixture-driven runtime API tests across all current Tasty cases | implemented |

### What remains

Mostly iterative hardening and future expansion, not foundational architecture.

Examples:

- more type variants if they become worth the complexity
- richer search/prefetch behavior
- downstream consumer layers built on top of the core runtime

## Testing

Tasty is tested at multiple layers.

| Test layer | Location |
| --- | --- |
| Rust scanner/emission smoke tests | `src/tasty/tests/` |
| bundle-shape fixture tests | `tests/tasty/cases/*/bundle.test.ts` |
| runtime API fixture tests | `tests/tasty/cases/*/api.test.ts` |
| runtime-focused unit tests | `js/tasty/index.test.ts` |

The fixture matrix gives Tasty coverage across:

- generics
- signatures
- unions and literals
- default type parameters
- external library references
- mapped types
- conditional types
- template literals
- type queries
- type operators
- JSDoc handling
- audit-alignment raw/structural edge cases
- TSX scanning
- more complex mixed scenarios

## Working On Tasty

If you are making Tasty changes, these files are the main ones to know:

- `model.rs`
- `emitted.rs`
- `scan.rs`
- `generator/esm.rs`
- `ast/resolve.rs`
- `packages/reference-rs/js/tasty/index.ts`
- `packages/reference-rs/tests/tasty/`

## Related Docs

The two Tasty docs worth keeping are:

- `README.md` in this directory for the full system overview
- `OXC_TYPE_AUDIT.md` for the exact type-surface handling matrix

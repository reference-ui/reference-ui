# Tasty — JavaScript API

The **TypeScript/JavaScript** API for Tasty: package entrypoints, runtime behavior, and the main types and helpers.

Tasty turns a TypeScript workspace into Rust-owned metadata artifacts, then lets TypeScript consumers load that graph **lazily** through wrapper APIs and shared utility helpers. Rust scans source and lowers symbol/type information into the Tasty model; the build entry writes a small manifest plus lazy chunk modules; `createTastyApi()` loads the manifest first and imports chunks only when requested. Consumers work with `TastySymbol`, `TastyMember`, `TastyTypeRef`, and `TastySymbolRef`, or compose higher-level models from the shared utilities.

## Package entrypoints

### `@reference-ui/rust`

Host entrypoint: the dynamic loader, native dispatch helpers
(`requireNative`, `callNativeJson`), and platform diagnostics
(`getReferenceNative`, `loadReferenceNative`, path resolution, etc.).
It exposes no tasty functions; generation goes through `./tasty/build` below.

### `@reference-ui/rust/tasty`

Tasty **runtime** API (consumes emitted JS artifacts; generation still uses the native scanner):

- `createTastyApi(options)` / `createTastyApiFromManifest(options)`
- `createTastyBrowserRuntime` (see `./tasty/browser`)
- Wrapper types: `TastySymbol`, `TastyMember`, `TastyTypeRef`, `TastySymbolRef`
- Graph: `api.graph` — `resolveReference`, `loadImmediateDependencies`, `loadExtendsChain`, `flattenInterfaceMembers`, `getDisplayMembers`, `projectObjectLikeMembers`, `collectUserOwnedReferences`
- Utilities: `dedupeTastyMembers`, `getTastyMemberDefaultValue`, `getTastyMemberId`, JSDoc/callable helpers, display helpers, semantic helpers
- Raw contract types: `RawTasty*` (re-exported from `modules/tasty/js/generated/`)

### `@reference-ui/rust/tasty/build`

Node helpers that call the native `scanAndEmitModules` export, write files under an output directory, and return a `TastyApi` — see `modules/tasty/js/build.ts` for `buildTasty`, sessions, and diagnostics.

### `@reference-ui/rust/tasty/browser`

Browser-oriented entry: manifest-driven loading and `createTastyBrowserRuntime` without assuming Node filesystem layout.

## What Tasty is for

**Good fits:** API docs, symbol browsing, inheritance inspection, lightweight graph queries, MCP or editor-facing metadata consumers.

**Not goals:** a second compiler, a second lowering pass, a bundler, a docs framework, or an MCP framework.

Rust owns compilation-adjacent correctness; TypeScript owns runtime loading, traversal, ergonomics, and reusable consumer-facing utilities.

## Artifact model

Tasty uses a **manifest-first** layout. The manifest is a small eager module (`version`, `symbolsByName`, `symbolsById`); each index entry carries `id`, `name`, `kind`, `chunk`, `library` so the runtime resolves name → id → chunk path and defers loading the full symbol object. Chunk modules hold symbol payloads keyed by exported id and load when a symbol loads, a reference resolves, or a graph operation pulls in related symbols.

Generated TypeScript for the on-disk artifact shape lives in `packages/reference-rs/modules/tasty/js/generated/`. The runtime re-exports those as `RawTasty*` aliases so consumers can distinguish **raw artifact JSON** from **wrapper** interfaces.

## Basic flow

```ts
import { buildTasty } from '@reference-ui/rust/tasty/build'

const built = await buildTasty({
  rootDir: '/path/to/workspace',
  include: ['src/**/*.{ts,tsx}'],
  outputDir: '/path/to/output',
})

const api = built.api // ready; manifest loaded
const symbol = await api.loadSymbolByName('ButtonProps')
const members = symbol.getMembers()
const inherited = await api.graph.loadExtendsChain(symbol)
```

## Runtime model (four layers)

1. **Loader / store** — manifest loading, chunk loading, caching, symbol lookup by name/id.
2. **Wrappers** — thin `TastySymbol`, `TastyMember`, `TastyTypeRef`, `TastySymbolRef` (graph nodes, not arbitrary app view models).
3. **Graph operations** — `api.graph`: traversals like `loadExtendsChain`, `flattenInterfaceMembers`, `getDisplayMembers`, `projectObjectLikeMembers`, `collectUserOwnedReferences`.
4. **Utilities** — deduping, literals/unions, JSDoc param parsing, signature formatting, etc.

## `TastyApi` surface

After `createTastyApi({ manifestPath })` and `await api.ready()`:

### Core loader methods

- `ready()`
- `loadManifest()` / `getManifest()`
- `getWarnings()`
- `loadSymbolById` / `loadSymbolByName`
- `findSymbolByName` / `findSymbolsByName`
- `loadSymbolByScopedName` / `findSymbolByScopedName`
- `prefetchChunk` / `prefetchSymbolById` / `prefetchSymbolByName`
- `searchSymbols(query)`

### `TastySymbol`

- `getId()`, `getName()`, `getKind()`, `getLibrary()`
- `getDescription()`, `getJsDocTags()`, `getJsDocTag(name)`
- `getRaw()`
- `getMembers()`, `getDisplayMembers()`, `getTypeParameters()`, `getExtends()`, `getUnderlyingType()`
- `loadExtendsSymbols()`

### `TastyMember`

- `getId()`, `getName()`, `isOptional()`, `isReadonly()`, `getKind()`
- `getType()`, `getDescription()`, `getJsDocTags()`, `getJsDocTag(name)`
- `getDefaultValue()`, `getParameters()` (callable metadata where present)
- `getRaw()`

### `TastyTypeRef`

- `getKind()`, `getRaw()`, `getResolved()`, `isRaw()`
- `getSummary()`, `getLiteralValue()`
- `isLiteral()`, `isUnion()`, `isArray()`, `isReference()`, `isCallable()`
- `getUnionTypes()`, `getParameters()`, `getReturnType()`, `getTypeArguments()`
- `getReferencedSymbol()`, `describe()`

### `TastySymbolRef`

- `getId()`, `getName()`, `getKind()`, `getLibrary()`
- `isLoaded()`, `getIfLoaded()`, `load()`

### Utility helpers

Including: `dedupeTastyMembers`, `getTastyMemberDefaultValue`, `getTastyMemberId`, `getTastyJsDocParamDescriptions`, `getTastyCallableParameters`, `parseTastyParamTag`, `normalizeTastyInlineValue`, plus semantic/display helpers exported from `modules/tasty/js/index.ts`.

Example:

```ts
import {
  createTastyApi,
  dedupeTastyMembers,
  getTastyCallableParameters,
  getTastyJsDocParamDescriptions,
  getTastyMemberDefaultValue,
} from '@reference-ui/rust/tasty'

const api = createTastyApi({ manifestPath: '/path/to/output/manifest.js' })
const buttonProps = await api.loadSymbolByName('ButtonProps')
const members = dedupeTastyMembers(await api.graph.flattenInterfaceMembers(buttonProps))
const size = members.find((member) => member.getName() === 'size')

if (size) {
  console.log(getTastyMemberDefaultValue(size))
  console.log(getTastyCallableParameters(size.getType()))
  console.log(getTastyJsDocParamDescriptions(size))
}
```

**Current limitation:** property function types carry parameter metadata cleanly; method, call, and construct members do not always preserve full signature metadata in the artifact contract, so adapters may fall back to coarser display behavior.

## Sync vs async

- **Synchronous:** cheap local inspection on already-loaded data (e.g. `symbol.getMembers()`, `symbol.getExtends()`).
- **Asynchronous:** anything that expands the graph or loads chunks (e.g. `symbol.loadExtendsSymbols()`, `symbol.getDisplayMembers()`, `api.graph.loadExtendsChain()`).

## Caching

- Manifest is loaded once per API instance.
- Chunks are not imported repeatedly.
- Wrapper identity is stable per symbol id (e.g. `loadSymbolByName` and `loadSymbolById` for the same id yield the same wrapper instance).

## Type modeling

Tasty does not model every TypeScript construct as full semantic structure. It models documentation-oriented shapes and preserves harder cases as **raw** source summaries.

**Structured today (non-exhaustive):** intrinsics, literals, unions, arrays, tuples, intersections, object literals, type references, indexed access, functions, constructors, type operators, type queries, conditionals, mapped types, template literals, etc.

**Intentionally raw today:** import types, `infer`, type predicates, `this` types, some JSDoc-only variants. “Raw” means the expression is preserved as summary text rather than a richer structural form — not necessarily an error.

## Design principles

- **Rust is the source of truth** for emitted contract structure and lowering.
- **Manifest-first** loading; **chunk-level** lazy loading.
- **Thin wrappers**; shared projection logic belongs in reusable utilities.

## Testing

- Case tests (bundle shape and goldens): `packages/reference-rs/modules/tasty/tests/cases/<ID>/spec.ts`, run by `packages/reference-rs/modules/tasty/tests/suites/cases.test.ts`
- Runtime API tests: `packages/reference-rs/modules/tasty/js/index.test.ts`, `modules/tasty/js/utilities.test.ts`, `modules/tasty/js/build.test.ts`

For the Rust-side pipeline and types, see [tasty-rs.md](./tasty-rs.md).

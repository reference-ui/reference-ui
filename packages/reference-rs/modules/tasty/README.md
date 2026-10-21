# Tasty

TypeScript metadata, type projection, and ESM chunk artifact engine. It discovers
TypeScript sources, parses them with OXC, models signatures as a first-class
`TypeRef` graph, and emits manifest-first ESM chunk artifacts for the JS runtime
to load lazily. Part of reference-rs.

## Entrypoints

Four, each one job. The root entry is the loader plus native dispatch and platform diagnostics — no tasty functions. `./tasty` is the runtime API: `createTastyApi()`, the `TastySymbol` / `TastyMember` / `TastyTypeRef` / `TastySymbolRef` wrappers, the `api.graph` traversals, and the shared utilities over the `RawTasty*` contract types. `./tasty/build` is the Node build helper that calls the native `scanAndEmitModules` export and writes the manifest plus chunks. `./tasty/browser` is the manifest-driven runtime without the Node filesystem layout.

Good fits: API docs, symbol browsing, inheritance inspection, graph queries, MCP or editor metadata consumers. Not a compiler, a bundler, or a docs or MCP framework.

## Pipeline

Scan → extract → resolve → bundle; the emit path adds artifact emit and JSON serialization. The scanner expands include globs into a reachable
file set; the AST layer lowers OXC syntax into `TypeRef` IR and connects symbols
into a graph; the generator serializes that graph into a manifest plus per-symbol
chunks. The native `scanAndEmitModules` export returns emitted module sources, `.d.ts` sources, and diagnostics as one JSON payload; the crate builds as a plain library and the napi export compiles with the host. The JS runtime loads chunks on demand and serves graph navigation
plus bounded object-like member projection (`projectObjectLikeMembers`,
`getDisplayMembers`).

## Scan boundary

User files enter through include globs. A user file bridges an external library
into the name index by re-exporting from it; a scoped plain import is followed
for resolution but not indexed; an unscoped plain import is not followed. Inside
a library, discovery stays within the same package. Resolution is
declaration-driven: packages that ship no types resolve through an installed
declaration provider. An unresolved name stays external with its specifier;
the scan never invents a symbol id or a file.

## Type lowering

Every OXC `TSType` lowers deliberately into `TypeRef`. Useful shapes model
structurally; the rest stay `Raw { summary }`, preserving source text — an IR
choice, never an error or a diagnostic. Conditional types, `keyof`, indexed
access, and template literals gain a `resolved` answer only when the bounded
evaluator settles them as TypeScript does; budgets (50 nested alias expansions,
10,000 steps, 1000 union members) fail closed to an absent `resolved`.

## Artifacts

The manifest is a small eager module (`version`, `symbolsByName`, `symbolsById`);
chunk modules hold symbol payloads keyed by exported id. The serialized contract
lives in the `emitted` contract module with ts-rs derives for the runtime; bulk codegen stays
string-based by design. Comments surface as `description`, `descriptionRaw`, and
parsed `jsdoc` — a best-effort pass-through, not a TSDoc model.

## Diagnostics

Typed `TST-*` facts, not message strings: warnings ride the manifest `warnings`
array, the one error (scan refusal) throws coded. A display projection whose walk hit the step
budget or the nesting-depth guard, and so dropped members, is reported per call
(`getDisplayResult()`: `truncated`, and `notices` naming the limit). The consumer
that presents it attaches one `TST-W-PROJECTION-BUDGET` warning per notice, built
by `projectionBudgetWarning` and listed in the shared registry. A missing scan root, an invalid glob, or an unreadable file refuses the whole request with a coded throw. Meanings and raise sites live
in the shared registry; codes a golden pins are
wire contract.

## Open gaps

Unproven at case level; each names its gap:

- **TASTY-11** — indexed access lowers to `indexed_access`; no case asserts the kind.
- **TASTY-15** — JSDoc nullable / non-nullable / unknown lower to `Raw`; no case.
- **TASTY-16** — the tuple-element reparse fallback is unreachable for error-free sources; no case pins it.
- **TASTY-20** — an existing target outside the include globs, or a non-TypeScript target, stays external silently with no warning (Cargo pin only).
- **TASTY-22** — `./x.js` does not reach `./x.ts`; such an import warns unresolved.
- **TASTY-26** — same-file duplicate declarations and merged-interface duplicate members (Cargo pins only).
- **TASTY-27** — an unreadable root, invalid glob, or unreadable file throws `TST-E-SCAN-FAILED`; only the message prefix is pinned.
- **TASTY-40** — `keyof` over a type-parameter or numeric-key interface fails closed; no case.

## Tests

Rust tests are smoke-only. Correctness lives in Vitest, in the `TST-*` tasty cases.
cases (input project, `spec`, committed manifest + chunks
goldens), run on demand through the N-API addon with per-file scratch roots.
Refresh goldens with `pnpm agentrs v tasty --update-goldens`.

## Verify

```bash
pnpm agentrs c tasty
pnpm agentrs v tasty
pnpm agentrs q
```

> Search terms: generics, mapped types, type metadata engine, ts extractor, tasty/symbols, tasty/projection, tasty/chunks, tasty/jsdoc, tasty/generics, export star, export map, barrel re-exports, symbol resolution, export resolution, tasty/resolve, rs:atlas, rs:typegen, rs:shared

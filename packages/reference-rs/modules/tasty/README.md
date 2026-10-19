# Tasty

TypeScript metadata, type projection, and ESM chunk artifact engine. It discovers
TypeScript sources, parses them with OXC, models signatures as a first-class
`TypeRef` graph, and emits manifest-first ESM chunk artifacts for the JS runtime
to load lazily. Part of [reference-rs](../../README.md).

## Pipeline

Scan → parse → resolve → emit. The scanner expands include globs into a reachable
file set; the AST layer lowers OXC syntax into `TypeRef` IR and connects symbols
into a graph; the generator serializes that graph into a manifest plus per-symbol
chunks. The JS runtime (`js/`) loads chunks on demand and serves graph navigation
plus bounded object-like member projection (`projectObjectLikeMembers`,
`getDisplayMembers`).

## Scan boundary

User files enter through include globs. A user file bridges an external library
into the name index by re-exporting from it; a scoped plain import is followed
for resolution but not indexed; an unscoped plain import is not followed. Inside
a library, discovery stays within the same package. Resolution is
declaration-driven: packages that ship no types resolve through an installed
declaration provider.

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
lives in `src/emitted/` with ts-rs derives for the runtime; bulk codegen stays
string-based by design. Comments surface as `description`, `descriptionRaw`, and
parsed `jsdoc` — a best-effort pass-through, not a TSDoc model.

## Diagnostics

Typed `TST-*` facts, not message strings: warnings ride the manifest `warnings`
array, the one error (scan refusal) throws coded. Meanings and raise sites live
in the shared [registry](../diagnostics/REGISTRY.md); codes a golden pins are
wire contract.

## Tests

Rust tests are smoke-only. Correctness lives in Vitest: `tests/cases/TST-*/`
cases (input project, `spec.ts`, committed `manifest.js` + `chunks.json`
goldens), run on demand through the N-API addon with per-file scratch roots
under `.scratch/`. Refresh goldens with `pnpm agentrs v tasty --update-goldens`.

## Verify

```bash
pnpm agentrs c tasty
pnpm agentrs v tasty
pnpm agentrs q packages/reference-rs/modules/tasty
```

> Search terms: generics, mapped types, type metadata engine, ts extractor, tasty/symbols, tasty/projection, tasty/chunks, tasty/jsdoc, tasty/generics, export star, export map, barrel re-exports, symbol resolution, export resolution, tasty/resolve, rs:atlas, rs:typegen, rs:shared

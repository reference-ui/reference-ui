---
date: 2026-09-24
cycle: night-r3
module: tasty/resolve/export-map
theories_spent: 1
verdict: break-found
---

# `export { default as X } from` single-hop silently dropped from barrel export map

## Hypothesis

Gap pursued (brief item b, banked untouched by R2): `export { default
as X } from './mod'` single-hop drops — `reexport_target["default"]`
looks up `symbol_index[(target, "default")]`
(`packages/reference-rs/modules/tasty/src/ast/resolve/index.rs:334-347`)
but shells are keyed by declared name, so the hop may miss.

Fresh ground: R1 proved the two-hop *named* chain drops and banked
this default-hop untried; R2 pursued cross-file `typeof` and stopped
at its own break per protocol. The repo's `TST-RXP-02` fixture does
contain `export { default as ReexportDefaultAsNamed } from
'./default-source'` — but its target is `export default { ... }`, a
*value* literal tasty never mints, and the case spec asserts nothing
about the binding (no `default` match in `spec.ts`/`README.md`). No
station covers `export { default as X } from` onto a default-exported
*type*, which tasty explicitly extracts (`export_bindings["default"]
-> declared name` plus a declared-name shell, via
`collect_default_export_declaration` in
`ast/extract/module_bindings/exports.rs:57-75`).

Mechanism: `record_named_reexports` records `export_bindings[X] =
"default"` and `reexport_target["default"] = (target, "default")`;
`resolve_symbol_id` then probes `symbol_index[(target, "default")]`,
but `build_symbol_index` keys shells by `symbol.name` — the declared
name (`ButtonProps`), never the literal `"default"`. No shell can
ever be named `default`, so this hop misses *unconditionally* and
`ExportFold::collect` drops the binding via `filter_map` with zero
signal.

Red test (transient `cargo test -p tasty` plant, since removed):
`src/mod.ts` holds `export default interface ButtonProps { label:
string }` (legal TS, the types-only dialect — no value/default-call
shapes); `src/barrel.ts` does `export { default as ButtonProps }
from './mod'`; `src/consumer.ts` imports it for a member type.
Assert the target map binds `"default"`, the barrel map binds
`ButtonProps` to `sym:src/mod.ts#ButtonProps`, and the consumer
member carries that `target_id`.

Result: RED. The target-map control passes; the barrel map is EMPTY
(`barrel map: {}, diagnostics: []`) — a total drop in total silence.
The consumer `target_id` assertion is unreachable behind the map
failure but necessarily follows to `None`. Cross-check: `tsc --noEmit
--strict` accepts the same three-file fixture (exit 0), so the input
is legal, single-hop-resolvable ESM/TS.

## Verdict

`break-found`. Repro: `/tmp/doom-r3-defaultas-repro.sh`
(blind-runnable, `bash /tmp/doom-r3-defaultas-repro.sh [repo-root]`;
exit 1 = break; runs the tsc ground-truth check, plants the transient
red test from `/tmp/doom-r3-defaultas-red-test.rs` via `pnpm agentrs`,
captures the failure, deletes the plant, and verifies byte-identical
restore plus `git status` on the touched path).

Violated contract: named reexports must record export bindings to the
canonical symbol —
`packages/reference-rs/modules/tasty/src/README.md:64-67` ("For
`export type { Name } from 'module'`, Tasty records export bindings to
the canonical symbol"), the Identity invariant (`README.md:74`,
"canonical export bindings") plus Navigation (`README.md:78-79`,
"`Reference` edges connecting symbols to their dependency targets
across modules"), and `ast/resolve/README.md:19` ("resolve imported
references through export maps"). The emitted graph instead serves an
empty barrel map and (downstream) an unresolved consumer edge for a
shape one hop from a proven-resolving target twin, with zero signal —
no `TST-*` code exists for it (contrast `TST-W-STAR-AMBIGUITY` for the
fortified star case). In-bounds: complete static TS input, no
will-never-work shape; pure silence-where-signal-is-owed, the brief's
misdiagnosis clause. Distinct from R1 (transitive *named* chain) and
R2 (`typeof` over imports): this is a *single-hop default* drop that
misses unconditionally by key construction.

Severity: user-facing — `export { default as X } from` is the idiom
for re-casing or renaming a default export through a barrel
(`export { default as ButtonProps } from './ButtonProps'`); every
such binding silently vanishes from the graph with no diagnostic,
degrading doc links, display members, and all consumer references
through the barrel to unresolved. Fix shape (default-aware remote
lookup via the target's export map vs refuse-with-diagnostic) left to
architect consult.

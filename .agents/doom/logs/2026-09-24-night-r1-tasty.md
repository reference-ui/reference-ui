---
date: 2026-09-24
cycle: night-r1
module: tasty/resolve/export-map
theories_spent: 1
verdict: break-found
---

# Two-hop named reexport chain silently dropped from barrel export map

## Hypothesis

Gap pursued: `resolve_symbol_id`
(`packages/reference-rs/modules/tasty/src/ast/resolve/index.rs:334-347`)
resolves a named-reexport hop against `symbol_index` — the local-shell
table — instead of the target file's export map. A single hop onto a
locally-declared symbol works, but the second hop of a transitive chain
(`barrel -> mid -> orig`, where mid holds only a reexport, no shell)
misses, returns `None`, and `ExportFold::collect` drops the binding via
`filter_map` with zero signal — no `TST-*` code exists for it.

Fresh ground: wave1/wave4/wave6 covered the scan boundary, same-file
merging (since fortified as M1–M3), and star ambiguity (since fortified
with `TST-W-STAR-AMBIGUITY`); the wave6 report banked multi-hop chains
as an untried gap ("2-hop chains likely drop silently"). The repo's own
`TST-RXP-02` fixture contains the 2-hop shape (`index.ts` reexports
from `reexport-patterns.ts`, which reexports from `type-only-source.ts`)
yet no spec asserts barrel-map attribution or consumer resolution
through it — the spec only exercises global `loadSymbolByName` lookup,
which bypasses the export map.

Red test: `orig.ts` declares `Widget`; `mid.ts` does
`export { Widget } from './orig'`; `barrel.ts` does
`export { Widget } from './mid'`; `consumer.ts` imports `Widget` from
the barrel. Assert the barrel map binds `Widget` to the canonical
`sym:src/orig.ts#Widget` and the consumer member carries that
`target_id`.

Result: RED. The single-hop control passes (mid binds correctly); the
two-hop barrel's export map is EMPTY and `diagnostics` is `[]` — total
silence. The consumer reference necessarily follows to `target_id:
None`. Cross-check: `tsc --noEmit --strict` accepts the same four-file
fixture, so the input is legal, transitively-resolvable ESM/TS.

## Verdict

`break-found`. Repro: `/tmp/doom-r1-tasty-two-hop.sh` (blind-runnable,
`bash /tmp/doom-r1-tasty-two-hop.sh [repo-root]`; exit 1 = break; runs
the tsc ground-truth check, plants a transient `cargo test -p tasty`
red test via `pnpm agentrs`, captures the failure, deletes the plant,
and verifies `git status --short` on touched paths is clean).

Violated contract: named reexports must record export bindings to the
canonical symbol —
`packages/reference-rs/modules/tasty/src/README.md:64-67` ("For
`export type { Name } from 'module'`, Tasty records export bindings to
the canonical symbol"), the Identity invariant (`README.md:74`,
"canonical export bindings") plus Navigation (`README.md:78-79`,
"`Reference` edges connecting symbols to their dependency targets
across modules"), and `ast/resolve/README.md:19` ("resolve imported
references through export maps"). The emitted graph instead serves an
empty barrel map and an unresolved consumer edge for a shape ESM says
resolves — the wrong-identity mirror of the wave6 star finding, with
not even the generic duplicate-name warning anywhere. In-bounds:
complete static TS input, no will-never-work shape; pure
silence-where-signal-is-owed, the brief's misdiagnosis clause.

Severity: user-facing — index-barrel chains (`index.ts` reexporting a
mid-barrel) are the idiomatic monorepo/barrel pattern; doc links,
display members, and every reference consumer through such a barrel
silently degrade to unresolved. Fix shape (transitive export-map
lookup vs refuse-with-diagnostic) left to architect consult.

Untried gaps banked (no theories spent): `export *` copying `"default"`
into the barrel map (the star fold in `index.rs:120-128` has no default
exclusion, and ESM star never reexports default); cross-file `typeof`
queries (`resolve_type_query_expression` in
`resolver/resolve.rs:63-73` reads only the local file's
`value_bindings`); `export { default as X } from` single-hop drops
(`reexport_target["default"]` looks up `symbol_index[(target,
"default")]`, but shells are keyed by declared name).

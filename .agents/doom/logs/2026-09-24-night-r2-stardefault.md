---
date: 2026-09-24
cycle: night-r2
module: tasty/resolve/export-map
theories_spent: 1
verdict: break-found
---

# Star barrel re-exports "default" ESM says is absent

## Hypothesis

Gap pursued: the banked R1/wave6 gap — the `export *` fold in
`ExportFold::collect`
(`packages/reference-rs/modules/tasty/src/ast/resolve/index.rs:120-128`)
copies every binding from the target map with no `"default"`
exclusion, but ESM star never re-exports default. Distinct from R1's
filed break (a real binding silently *dropped* by `resolve_symbol_id`):
this is the inverse, a phantom binding *minted* by the star fold.

Red test: `origin.ts` does `export default interface Widget` plus
`export interface Named`; `barrel.ts` does `export * from './origin'`;
`consumer.ts` does `import D from './barrel'`; `direct.ts` does
`import W from './origin'`. Controls: the origin binds `"default"` to
`sym:src/origin.ts#Widget`, the barrel binds `Named` (star works), and
the direct default import resolves. RED: the barrel map must not
contain `"default"`, and the consumer reference must stay unresolved.

Result: RED at the first assertion, all three controls green. The
barrel map is
`{"Named": "sym:src/origin.ts#Named", "default": "sym:src/origin.ts#Widget"}`.
Cross-check: `tsc --noEmit --strict` accepts the origin+barrel+direct
fixture and rejects the consumer with `TS1192: Module '"./barrel"'
has no default export` — the input is legal and ESM says the barrel
has no default. (The test's second RED assertion, consumer
unresolved, panics after the first, but follows by construction:
`build_export_index` inserts the same folded map verbatim and
`resolve_import_target_id` serves default imports from it.)

## Verdict

`break-found`. Repro: `/tmp/doom-r2-stardefault-default.sh`
(blind-runnable, `bash /tmp/doom-r2-stardefault-default.sh
[repo-root]`; exit 1 = break; runs the tsc ground-truth check, plants
a transient `cargo test -p tasty` red test via `pnpm agentrs`,
captures the failure, deletes the plant, and verifies `git status
--short` on touched paths is clean).

Violated contract: the barrel export map must model ESM export
semantics — `packages/reference-rs/modules/tasty/src/README.md:74`
Identity ("canonical export bindings") plus Navigation (`README.md:78-79`,
"`Reference` edges connecting symbols to their dependency targets"),
and `ast/resolve/README.md:19` ("resolve imported references through
export maps") with the star-ambiguity precedent (`README.md:15-17`,
names ESM says are absent stay out of the map). The extract layer
already pins `"default"` as a real binding of the origin only, so the
fold's job is to exclude it at the star boundary — instead it mints a
phantom barrel binding tsc rejects. In-bounds: complete static TS
input, no will-never-work shape; pure wrong-answer/partial-mint, the
brief's misdiagnosis clause.

Severity: user-facing — default-exported types behind star barrels
(the idiomatic index pattern) gain phantom barrel bindings, and every
default-import consumer through such a barrel resolves to a binding
ESM says does not exist. Fix shape (exclude `"default"` in the star
fold vs at the collect boundary) left to architect consult.

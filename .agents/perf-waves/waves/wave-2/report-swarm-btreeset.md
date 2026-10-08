# REPORT: swarm-btreeset — assembly keys `BTreeSet` collect diet

## Verdict

**CUT (one live collect of ≤35k pre-deduped keys: fantasy ceiling ~6–9 ms clears neither the ≥15 ms nor the ≥1.5% LAND prong)**

One line: `assembly.rs:163` is live on the `!proof` path (gate check passed — single `build_diet` per sync), but the input is already unique by construction (`seen_keys` first-wins gate), the consumers are membership-only (order provably unobserved), and the whole-compile `BTreeMap::insert` budget is 13wt shared across ≥6 user families — counted by filed profile + code proof, never built, no lock hold.

## Base / binaries

- Base commit: `5844b24a81a528ace14fab63e908793a6829a874` (verified `git rev-parse HEAD` before any work and after; docs-only filing over wave-1 landing `0a7330c76`, `packages/` tree identical)
- Base `.node` sha256: N/A — never built (fresh worktree ships no `dist/`/`target/`; a from-scratch release build + instrumented counts would burn shared-box CPU for zero information on a ceiling-barred collect)
- Candidate `.node` sha256: N/A — CUT before implementation, no candidate built
- `git diff --stat`: empty (zero tracked edits; only this REPORT.md is untracked)
- Bench lock: never held by this crew (counted, never built, no lock hold). No spawned run of any kind, timed or untimed — no `flame.mjs`/agent CLI subprocess, no build; every number below is the filed record plus read-verified code.

## Mechanism counts (enterprise, seed 7, 7527 css calls)

Census of the `assembly.rs:163` collect (`keys.into_iter().collect::<BTreeSet<String>>`) and its producer/consumer chain:

| quantity | value | basis |
| --- | --- | --- |
| collects per sync | **exactly 1** | one `compileNative` per sync (`sync/index.ts:120`) → one `AssembleCtx::finish` (`lib.rs:133`) → one `build_plans` → one `build_diet` |
| proof-gated? | **no — live** | collect sits in the `!proof` else-branch (`assembly.rs:162-163`); the bench load is `proof=false` on every sync (asmfmt chain, uncontested) |
| keys per collect (generous) | ≤ **35,426** | wave-1 keys dump: decl-site `lookup_key` serializations sync-wide = authored decls; keys ⊆ decls (first-wins + non-empty gate) |
| keys per collect (tight) | ≤ **19,187** unique values | keys-dump unique count; decl∩exact identical, decl-only 0 |
| dup rate in collect input | **0% by construction** | `seen_keys.insert` gate (`builder.rs:195`); keys pushed only alongside plans, `keys.len() == plans.len()` in plan order (`builder.rs:182`) |
| key sizes | tens of bytes, shared prefix | JSON-tuple keys `["lib",[…when],"prop",canonical,false]` (`serializer.rs:62-72`); 85% scalar-only values (keys report); `memcmp` short-circuits after the shared head |
| string reallocs in collect | **0** | `into_iter().collect()` moves the `String`s; no per-key data realloc, only B-tree node allocs |
| consumer sites | **3, all membership-only** | `render.rs:110` + `render.rs:151` (`.contains`), `sinks.rs:169` (`sink_covered` iterates `harvest.offered`, checks `emitted.contains`) |
| set-order observers | **none on the live path** | `missing_keys` (`difference`, order-sensitive output) is test-only (`plans.rs` tests); no live iteration of `emitted` anywhere |

Key-shape / arg census: the input needs no shape census beyond the above — every element is a moved, already-unique serialized lookup key.

### Filed-profile corroboration (no re-derivation)

`docs/evidence/flamegraph/enterprise-flame3` (weighted, same-run phases — the corrected record), 1349wt ≈ 1230 ms sync wall:

- `BTreeMap<String>` insert total: **self 4wt / incl 13wt** (`summary.md`) — the whole-compile budget for **all** B-tree inserts, `BTreeSet::insert` included (`BTreeSet` wraps `BTreeMap`).
- No `build_plans`, `BTreeSet::from_iter`, or collect edge appears anywhere in `callers.md` — the collect holds no distinct frame above the noise floor; its inserts hide inside the shared 13wt.
- The 13wt is shared across ≥6 live user families: `canonical_json_value` sorted maps (per object-valued key — 15,699 containing objects repo-wide), runtime-table builds (aliases/prefixes/keywords/breakpoints/fonts/lowerings), recipe runtime tables (120 recipes), serializer maps, `plan.rs:204` names set, plus this collect.

## Why it can't land (ceiling math)

Two independent bounds, agreeing:

| bound | math | fantasy (100% capture) |
| --- | --- | --- |
| profile share | 13wt incl × generous ½ attribution to this collect (≥6 families share it) | ~6.5wt ≈ **~6 ms** |
| op count | ≤35,426 inserts × generous 250 ns (short-string B-tree insert into a ≤19k tree: ~4 levels, prefix-shared compares, amortized node alloc) | **~8.9 ms** |

LAND bar on the ~1164 ms post-wave-1 base: ≥15 ms **and** ≥1.5% (≈17.5 ms). The fantasy ceiling misses both prongs by ~2x at impossible 100% capture — which impossibly assumes deleting the entire insert cost of a container the consumers still require (`render_session_with_keys` takes `BTreeSet<String>` by value; any replacement still pays insert+alloc, realistic capture 30–60% → ~2–5 ms). Threatening the bar would need both >450 ns/insert (2–4x realistic for prefix-shared short strings) **and** >85% capture of a same-complexity container swap — no credible parameterization clears either prong, let alone both. Per the brief, a ceiling clearing neither prong CUTs fast without touching the bench: an 8-pair confirm (≈25 min of exclusive shared lock) cannot resolve a ~3 ms expectation from ±20–70 ms machine noise. This CUT follows the wave-1 keys (19wt → CUT, never built), modgraph, resolvefmt (2.9 ms fantasy → CUT, counted never built), and asmfmt (0 calls → CUT, counted never built) precedents; the BANK rule governs implemented sets whose ceilings cleared, not sub-ceiling triage.

Note on the most tempting diet (for the record, not pursued): the input is already unique and the consumers are membership-only, so even a type-changing `HashSet` diet — rippling through `render.rs`/`sinks.rs` signatures and the `Proof` struct — would net ~1–3 ms after paying hash+insert on 19k strings. Same bar math, larger soundness surface.

## A/B, output hashes, determinism

Not run — no candidate was built (zero tracked diff; there is no alternate artifact to compare). Running an 8-pair A/B on a ~3 ms-realistic mechanism would burn the shared bench lock for a foregone CUT (swarm-keys precedent).

Determinism: the mechanism counts are code-logic facts (1 collect by call-chain construction, 0% dups by the `seen_keys` gate, membership-only consumers by exhaustive use-site grep) plus filed-profile/filed-dump numbers; no runs exist to compare.

## Correctness (rule 1)

- (a) Zero diff: no suites apply. Post-work tree verified byte-clean (`git status` empty, `git diff --stat` empty, pin re-verified `5844b24…`).
- (b)/(c) Vacuous — nothing changed.

## Collision / scope notes (for the captain)

- Untouched per brief + race rule: `serialize_lookup_key` / `LookupKey` (keys2's banked diet ground — the only key-construction cost adjacent to this site); `canonical_json_value` sorted maps (the largest sharer of the 13wt btree budget — serializer ground, not collection ground); `format_entry` subtree (modgraph ground); builder/extract/resolve (out of scope).
- `seen_keys` first-wins / plan-order caution (brief): moot — no diet written, no iteration/insertion order touched anywhere. (Wave-1 reserve landed the `build_keyed` reserves and deliberately left one-shot collects as negligible — this report closes that entry with counts: one-shot and ceiling-barred.)
- Observed but not pursued (adjacent mechanisms, noted for reseeding, no pivot): the `canonical_json_value` per-object-value `BTreeMap` rebuilds (`serializer.rs:13-17`, thousands of inserts across 15,699 object values — a serializer- ground diet, different mechanism from this collect); `plan.rs:204` names-set build.
- Standing load fact (extends asmfmt's): the seed-7 enterprise sync performs exactly one native compile, so every once-per-compile collect (`assembly.rs:163` included) fires exactly once per sync — future crews can cite this instead of re-deriving.
- Actionable if the captain ever wants a re-census (no re-derivation needed): env-gated `eprintln!` of `keys.len()` at `assembly.rs:163`, one untimed enterprise run; expected output is one line with a value ≤35,426. The membership-only consumer proof (three `.contains` sites + test-only `missing_keys`) stands as a standing code fact for any future crew eyeing the `emitted` set's container type.

## Process note (method)

- Brief's "first commands" (`docs/evidence/README.md`, `flame.mjs --inspect` on assembly/collect frames, `--callers` on the collect + consumers) were satisfied by reading the filed `enterprise-flame3` record (`callers.md`/`summary.md`/`meta.json`) plus exhaustive source grep instead of re-deriving via the CLI — identical data source, zero CPU, correct with no lock held.
- No `flame.mjs`/agent CLI subprocess was spawned at any point; every spawned-command gate held vacuously. Census chain closed over: sync driver → N-API → `compile` → `AssembleCtx::finish` → `build_plans` → `build_diet`/`build_keyed` → collect → `render_session_with_keys` → three `.contains` consumers, plus the wave-1 keys dump and reserve report as filed load facts.
- Grounding covered: VOYAGE.md + LOG.md rooms (AssembleCtx 296wt serial bulk — matches the filed 296 edge)/dead-ends/process-lessons (read-only, never edited), the asmfmt CUT report (absolute path; its proof-gate method applied in reverse — this collect verified live on `!proof`), wave-1 reserve (exact-capacity precedent + one-shot-collect note) and keys (decl 35,426/19,187 census) reports.

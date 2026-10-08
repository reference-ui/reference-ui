# REPORT: swarm-modgraph — module-graph remainder diet

## Verdict

**CUT (addressable ceiling ≈ 11–12 ms at 100% fantasy capture cannot clear the ≥15 ms + ≥1.5% (≈17.5 ms) LAND bar on either prong)**

One line: the remainder is real but small — `format_entry` (45,326 calls / 8 wt) is the only site above noise, `class_name` is dead on the bench path (0 calls), `sorted_entries` cardinality is now measured (35 dirs, ~210 reallocs total), and everything else is ≤2 wt.

## Base / binaries

- Base commit: `5844b24a81a528ace14fab63e908793a6829a874` (verified `git rev-parse HEAD` before any work; docs-only filing over wave-1 landing `0a7330c76`, `packages/` tree identical)
- Base `.node` sha256: `bc0a54dd1d2f9a10804d785f0af794de37c4557e5feec5bfa1f9ff77b3894bac`
  (`packages/reference-rs/dist/native/virtual-native.darwin-x64.node`; built in-tree via `pnpm agentrs b`, stashed to `/tmp/swarm-modgraph-base.node`, hash re-verified after restore over the instrumented build)
- Candidate `.node` sha256: N/A — CUT before implementation, no candidate built
- Instrumented `.node` (counts only, never timed): `2cf40a10d36d4681…` (`/tmp/swarm-modgraph-instr.node`)
- `git diff --stat`: empty (7 temp instrumented files reverted; bench-report noise reverted; only this REPORT.md is untracked)
- Bench lock: never held by this crew (counted, never built, no lock hold)

## Mechanism counts (enterprise, seed 7, 7527 css calls)

Measured with a temporary env-gated dump (`SWARM_MODGRAPH_DUMP`, per-call site-tagged `eprintln!`; instrumentation fully reverted). Raw dumps preserved at `/tmp/swarm-modgraph-count{,2,3}.err`; bench records (untimed) at `/tmp/swarm-modgraph-count*.json`.

| site | calls | split |
| --- | --- | --- |
| `format_entry` (tokens/mod.rs) | 45,326 | opacity=0: 43,870; opacity=1: 1,456 |
| `lower_when` (conditions/mod.rs) | 79,431 | base 17,294; catalog 33,475; breakpoint 28,662; range/atrule/unknown 0 |
| `nest` (nesting.rs, emit selector nesting) | 17,087 | all 1 parent × 1 member |
| `recipe_selector` (emitter/mod.rs) | 9,057 | — |
| `sorted_entries` (sources.rs) | 35 dirs | 30× n=100, 1× 12000, 1× 120, 1× 32, 1× 4, 1× 2 (15,158 entries) |
| `strip_runtime_ext` (ladder/probe.rs) | 906 | — |
| `class_name` (name/mod.rs) | **0** | dead on bench: `!proof` diet path skips all builder call sites; `build_css_runtime` is `proof`-gated (assembly.rs:94) |

Counts reproduced **exactly** across 3 runs (45,326 / 79,431 / 9,057 / 35 / 906) — deterministic mechanism volume.

Cardinality answer (the brief's SIZE-first): `sorted_entries` serves 35 dirs totaling 15,158 entries, dominated by one 12,000-entry dir. Total vec-growth cost ≈ 210 reallocs across all 35 collects (30× ~6 for n=100, ~14 for n=12000, ~15 for the rest) — wave-1 reserve's "cardinality unknowable" verdict stands, and is now quantified as negligible (~0.05 ms). The 8 wt `driftsort` inside `sorted_entries` is algorithmic (determinism requires the sort), not diet-addressable.

## Why it can't land (ceiling math)

Flame basis: `enterprise-flame3`, whole-run scope, weight ≈ ms (wave-1 keys precedent). Caveat: the bundle is pre-wave-1 (base `1a57b1e80`); wave-1 reserve+emit removed ~16 wt ladder + ~6 wt emit `format!`, so current-base `format_inner` ≈ 20 wt total. Site weights below are wave-1-untouched and still valid.

| site | diet | ceiling basis | generous ceiling |
| --- | --- | --- | --- |
| `format_entry` | 2 `format!`s → 1 exact push | 8 wt, all `format_inner`; 45,326 calls ≈ 176 ns/call | ~7 ms |
| `named_breakpoint` format | `format!` → push | ~2 wt; 28,662 calls ≈ 70 ns/call | ~1.8 ms |
| `recipe_selector` format | `format!` → push | 9,057 calls × ~70–176 ns | ~1.0–1.6 ms |
| `nest` family | descendant-branch `format!` → push | 17,087 1×1 calls, mostly push-based substitute path | ~1.0 ms |
| `strip_runtime_ext` | per-ext `concat2` → static suffix compare | 906 calls × ≤3 small allocs | ~0.1 ms |
| `sorted_entries` vecs | growth (no exact size exists) | ~210 reallocs total | ~0.05 ms |
| `class_name` + `lib.rs` one-shot collects | — | 0 calls / ~100 one-shot reallocs | ~0.02 ms |
| `group_recipe_atoms` temps (borderline scope) | pre-rendered `String`s → `&Atom` regroup | 9,057 small temps | ~0.5 ms |
| **total** | | | **≈ 11–12 ms** |

LAND bar on the ~1164 ms post-wave-1 base: ≥15 ms **and** ≥1.5% (≈17.5 ms). The ceiling misses the ms prong by ~20% and the pct prong by ~30% — at 100% fantasy capture. Realistic capture (~70–80%, the alloc plus byte copies remain) is ≈ 8–9 ms. No subset selects its way to a LAND: the single biggest site (`format_entry`, ~7 ms) is under half the bar alone.

Consistency check: the subset ceiling (≈12 wt at 100%) sits inside the current-base global `format_inner` budget (≈20 wt); the remaining ~8 wt is resolve-path/diagnostic volume outside this hypothesis (unit `px`, rhythm `calc`, negated calc-wrap — unmeasured, deliberately not counted: out of scope, no pivot).

## A/B, output hashes, determinism

Not run — no candidate was built. Running an 8-pair A/B against a hypothesis whose ceiling sits below both prongs would burn the shared bench lock for a foregone CUT (swarm-keys precedent).

Determinism: mechanism counts bit-identical across 3 enterprise runs (above).

## Correctness (rule 1)

- (a) Zero diff: no suites apply. Post-revert tree verified byte-clean (`git status` empty); `dist/*.mjs` wrappers + base `.node` rebuilt/restored in-tree (gitignored, not in diff).
- (b)/(c) Vacuous — nothing changed.

## Collision / scope notes (for the captain)

- Untouched per brief: `builder.rs` (landed reserve/emit ground), `write_utilities` / `CascadeKey::from_atom` / utility sort comparator (swarm-cascade ground), key serialization (swarm-keys2 ground), extract/parse (swarm-parse ground), canon remainder (swarm-canon2 ground).
- `class_name` dead-on-bench (0 calls) contradicts the pre-wave-1 flame (3 wt `format_inner`): the bench runs the `!proof` diet path. Future emit crews should not diet `class_name` for sync.
- Observed but not pursued (second mechanisms, noted for reseeding, no pivot): `root_targets` parses the same manifest text 3× per root resolve (`field_entries` + `export_targets` + `field_entries` — redundant-work dedup, not diet); `lower_when` has no memo (79,431 lowers over a tiny distinct-raw set — memo, not diet); resolve-path `format!`s (unit `px`, rhythm `calc`, negated wrap) unmeasured.

## Process note (disclosure)

Count run 3 (untimed, counts-only) started while `/tmp/swarm-bench-lock` was held by swarm-diag (21:47 measure block): the lock check and the run shared one command chain and the run was not gated on the check. The run's syncMs is discarded (instrumented + stderr volume, never a timing claim); counts are deterministic and reproduced the two prior lock-free runs exactly. Possible single-sample contention on the sibling's timed set — their 8-pair median + ex-run-1 verdict rule is robust to it, but the overlap is disclosed here rather than hidden. No further CPU was touched while the lock was held (revert + report are edit-only).

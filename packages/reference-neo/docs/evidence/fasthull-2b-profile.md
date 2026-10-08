# Fasthull 2b profile — "dead product" (B3+B5)

Profiler memo, read-only role. No product edits made (deps install +
native/JS build only, to run benches). All numbers firsthand, this tree,
seed 7, branch `voyage/hyperspace-perf-2-b`.

## Hypothesis (owned)

Objects dropped by slim serde or derivable at runtime are never built or
shipped. B3: gate proof-row materialization (`style_plans` build, per-atom
`css` map, second recipe-table clone, `wants` retention) on the proof
channel. B5: derive recipe value classes at runtime + stop BUILDING dead
`combinations`/`responsive_variant_map` in memory + hoist the 440
identical breakpoint lists. Sequence B3 first (zero-byte, fence-proof),
then B5.

## Own-tree baseline (pre-edit, full default suite)

| scale | sync | peak RSS | css raw (gzip) | data raw (gzip) |
| --- | --- | --- | --- | --- |
| small (171) | 126ms | 115.0 MiB | 538.0 KiB (33.8) | 102.5 KiB (19.9) |
| medium (635) | 344ms | 190.6 MiB | 2.4 MiB (142.7) | 164.3 KiB (23.7) |
| enterprise (7,527) | 2.46s | 627.4 MiB | 14.3 MiB (825.0) | 518.2 KiB (42.6) |

Bundle bytes match W1 close / pin exactly (css 15,007,762 B, data
530,606 B). Sync matches W1 main-line 2.46s; my RSS runs ~30-45 MiB
below the W1 670.9 median (box conditions, see below) — implementer
compares pre/post in-tree, not against W1.

Spread (run-to-run, same tree): small sync 504/126/126ms (first-run
cold outlier; median 126), RSS 109.8–118.6; medium sync 341/344/353,
RSS 172.3/190.6/198.4; enterprise sync 2.46/2.50/2.43 (spread ~70ms),
RSS 627.4/660.3/614.7 (spread ~46 MiB — a B3 RSS win must clear this).

Box: shared with 3 sibling lanes. Load 2.3–7.8 across my runs; no
sibling bench/deepsee process visible at my `ps` checks, but load avg
says siblings were active. Timed enterprise runs: see spread above.

## Deepsee enterprise (firsthand, `deepsee all --scale enterprise`)

Sync 2.69s (native.compile 2.10 / TS 593ms), RSS worker 644.9 /
parent 644.8. Assembly 612ms (22.7%, fattest native phase — same ms as
recon-2), serde 349, emit 227, napi-bridge 166, parse 123, hosts 123,
extract 106, diagnostics 106, prepare 346, publish 226. Cross-check
Δ ±115ms. Payload 29.82 MiB (sheets 98.4%); residual 467.6 MiB
(31.7 KiB/file — below recon-2's 511/34.6, same conditions story as
RSS). Bundle residuals 0/0. Data: variantMap 201.3 KiB (46.2% of
table, fattest field), compoundVariants 95.1, defaultVariants 30.5,
responsiveBreakpoints 21.9, qualifiedName 20.5, base 19.2,
variantKeys 17.6, className 11.0 — all match recon-2 to the decimal.

## Targeted counts (firsthand, /tmp scratch scripts, kept seed-7 repos)

Slim-vs-proof on the true bench medium load (kept repo, real system
spec, same request admin `logs`): default 5.15 MiB / 5 fields; proof
6.64 MiB / 10 fields. Proof-only rows: wants 0.78 MiB (3,837 rows),
stylePlans 0.48 MiB (2,351), css 0.16 MiB (3,045 keys = atomCount
3,045 exactly — per-atom map confirmed), recipes 0.08 MiB (88
tables), atomCount ~0. Slim fields byte-identical across both runs.
Proof-row serialized total ≈ 1.50 MiB at medium (scales to ~15–16
MiB at enterprise post-lane-d; see finding 1). Wall 243 vs 241ms —
no A/B signal at this scale (serde delta is ms here; B3 wall lives
in assembly build, not the codec).

B5 artifact census (medium runtime-data.mjs, 88 tables): all 88
responsiveBreakpoints identical (`["sm","md","lg","xl","2xl"]` ⇒ 440
identical at enterprise); variantMap 792/792 exact fn of
`{stem}_{axis[0]}_{value}`, 0 mismatches; base 88/88 exact
`{stem}__base`; map key == qualifiedName always; variantKeys ==
variantMap axes always.

## Gate points verified (lead-read file:line; corrections noted)

B3: `assembly.rs:70` plan build ✓, `:80` css build ✓, `:93-96`
second table collect ✓, `:100-105` render/partition coupling ✓,
CompileResult struct `:107-119` (recon said `:111-116`; fields at
111/112/114/115 ✓ within). `runtime/builder.rs:295-303` clone
(recon `:296-303`, off-by-one on fn start; clone at 299-302 ✓).
`native.rs` lives at `modules/atomic/native.rs`, not `src/`:
SlimCompileResult `:126-140` ✓, wants_proof `:71-75` ✓.
`types.rs:43` logs field ✓, `wants_compiler_logs` precedent
`:49-53`, call `lib.rs:119` ✓, ctx-init `lib.rs:100-106` ✓,
`partition_channels` `lib.rs:208-231` ✓.
`contracts/types.ts:156` LogChannel ✓ (path:
`packages/reference-rs/contracts/types.ts`).
In-compile reader grep: style_plans read ONLY by render_session
(`assembly.rs:102`) + result move; css map read by NOTHING
in-compile (fence-free ✓); wants have no post-extract reader
(resolve still runs — B3 gates retention, not resolve);
`build_runtime_style_plans` has only test callers; neo `src/` has
ZERO stylePlans/wants readers (proof readers live in tests).

B5: `recipes/table.rs:29-31` dead-map builds ✓,
`runtime/plan.rs:60-63` serde skip ✓ (doc comment `:42-49`
already calls them "never serialized"),
`table.rs:77-84` breakpoint filter ✓, `:86-98` compound
expansion ✓ (KEEP shipping — multi-value predicates not
invertible ✓), `:213+` + `recipes/mod.rs:348` tests read the
in-memory dead maps (keep `build()` for tests ✓).
`name.rs`: base_class `:18-20` (recon `:21-23`, drift −2),
variant_class `:23-26` (recon `:25-28`; `format!` at 25),
responsive `:33-35`; mod.rs call sites `:113`/`:138` ✓.
`recipe.ts:147-156` deriveResponsiveClass precedent ✓
(`${breakpoint}:${derived}`, bp-gated — exact shape B5 extends).

## Findings for architect/implementer (no kills)

1. Recon-2's "recipes 3.81 MiB" is a PRE-lane-d serialized measure
   (dead maps still serialized in burndown-1: 2.50 + 1.06 ≈ 3.56
   + inputs ≈ 3.81). Post-lane-d my medium proof census shows the
   top-level recipes field at 0.08 MiB/88 tables (inputs only) —
   enterprise ≈ 0.4 MiB serialized. Consequence: B3's serialized
   saving from the recipes clone is ~0.4 MiB, not 3.81; the ~3.4
   MiB dead-map memory is killed by EITHER B3's clone-gating OR
   B5's `build_shipped()` (overlap, not sum — B3-first sequencing
   means B3's measured win includes it, B5's incremental is
   smaller). B3 enterprise serialized-equiv ≈ 15–16 MiB (not
   20.1) ⇒ RSS lever ≈ 25–30 MiB at 1.5–2×. Same order, slightly
   down. The fused hypothesis is unaffected (union is what
   matters), but do not add B3+B5 RSS levers naively.
2. B3 fence must cover MORE than the stated diagnostics coupling:
   `PlanBuilder::build` inserts into `atom_set` (`builder.rs:191,
   232, 279`) alongside the wants resolve (`assembly.rs:140`), and
   resolve_entry pushes deduped diagnostics (`builder.rs:64-86`).
   Gating the build must prove sheet-identity (plan-resolve adds
   no new atoms set-wise) AND diagnostics-identity (plan-resolve
   diags all dupes + proof verdicts all compiler-classified and
   stripped), not just the render_session half. Verification
   (byte-identical sheets + diagnostics, proof-channel restore)
   discharges all three; the architect rules the shape.
3. No evidence weakens B5: derivation fns exact (792/792, 0
   mismatches), bp lists literally identical (1 unique value),
   dead maps code-proven built-but-never-serialized, runtime
   precedent already shipped. `compoundVariants`/`defaultVariants`
   KEEP per recon-2 (verified non-invertible at `table.rs:86-98`).

## Box conditions (all runs)

Shared box, 3 sibling lanes. Load 2.3→7.8 over the session; my
`ps` checks showed no concurrent bench/deepsee/vitest/cargo from
siblings (only the main-tree dev server), but elevated load
implies sibling activity between checks. Runs: full suite 1×,
enterprise +2, deepsee enterprise 1×, medium --keep 1×, /tmp
census scripts (kept repos + /tmp only — zero tree footprint).
Scratch: `/tmp/2b-counts.mjs`, `/tmp/2b-proof.mjs`,
`/tmp/2b-proofbench.ts` (kept for re-run).

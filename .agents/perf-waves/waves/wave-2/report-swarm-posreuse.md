# REPORT: swarm-posreuse — positional exact→decl key reuse

## Verdict

**CUT (positional correspondence is seed-7 coincidence, broken by construction on const/dynamic inputs; prize halves to ~4.7 ms on the corrected three-loop structure — ceiling-barred at both bars)**

One line: keys2's `[D,D]` is not one doubled loop but two consumers each serializing D once (106,278 = 3 × 35,426 exactly) — so the reusable loop is 35,426 serializations (~5.7 ms phase, ~4.7 ms savable), and the decl↔exact positional lockstep it needs is provably false off-corpus (analysis stays dynamic where extraction resolves).

## Base

- Base commit: `5844b24a81a528ace14fab63e908793a6829a874` (verified `git rev-parse HEAD` before any work; `packages/` tree identical to wave-1 landing `0a7330c76`, docs-only delta)
- Base `.node` sha256: N/A — CUT before implementation, no candidate built
- Candidate `.node` sha256: N/A
- `git diff --stat`: empty (zero tracked edits; only this REPORT.md is untracked)

## Mechanism (as hypothesized)

keys2's structural finding: the exact-tagged serialization sequence is exactly the decl-loop sequence twice, positionally (exact[0..35426] == exact[35426..] == decl[0..35426], all 35,426 match). The hypothesis: serve the exact loop's serializations by reusing the decl loop's 35,426 serialized keys by position, replacing ~160 ns serializations with ~26 ns clones. keys2's honest warning stands: sound only with producer cooperation (fact→decl index threading through analysis) — invasive, diag territory, fragile. This report closes the lead: the structure is not what keys2 assumed (§Correction), the prize misses both bars (§Prize), and the mapping is unsound by construction (§Soundness).

## Structural correction: three loops, not two (filed evidence)

The 70,852 "exact" dump lines are **two separate loops of 35,426**, not one doubled loop:

1. `Proof::collect_exact` (`diagnostics/proof/render.rs:96`) — serializes each `ExactLookupExpected` fact during assembly (`AssembleCtx::finish`).
2. `partition → render_expected` (`diagnostics/channels/mod.rs:70` → `diagnostics/policy/analysis.rs:23`) — serializes each exact fact **again**, after assembly, in the same fact order.

The partition chain is unconditional on the bench path: `compile()` always calls `partition_channels` (`lib.rs:144`); `Policy::classify(ExactLookupExpected)` is unconditionally `Audience::Compiler` (`policy/mod.rs:46-48`); `render_fact` → `render_analysis` returns `Some` unconditionally for exacts (`channels/render.rs:34-37`); only the backchannel *push* is gated on `render_compiler` (`channels/mod.rs:79-81`) — the serialization burns either way. Proof::collect runs inside `assembly.finish` (before partition), so dump order is [decl D, collect D, partition D] — keys2's verified [D,D,D].

Corroborating arithmetic (no new runs; filed counts only):

| check | value |
| --- | --- |
| dump total | 106,278 = **3 × 35,426 exactly** |
| decl loop (`build_keyed`, `runtime/builder.rs:194`) | 35,426 (one per authored decl) |
| collect loop (`Proof::collect`) | 35,426 (one per exact fact) |
| partition loop (`render_expected`) | 35,426 (one per exact fact, same order) |
| reject serializations (`proof/rejects.rs:49`) | 0 (clean corpus, no rejections — wave-1 tag count) |
| sink serializations (`proof/sinks.rs:168`) | 0 (no harvest sinks on static corpus — wave-1 tag count) |
| `emitted_keys` (`proof/plans.rs:29`) | 0 (proof-path only; bench is `!proof`, else total ≠ 3×35,426) |
| proof renders (`policy/proof.rs`) | 0 (prop + value spelling only, never serialize) |

Every serialization accounted for; wave-1's "render_expected does not run in bench" is corrected (its *lines* are dropped on `!compiler-logs`, but the *work* burns — see §Collision for the lead this opens). keys2's phase totals, per-tuple rates, and corpus stats are unaffected (same 106,278-tuple sequence, only loop attribution changes).

## Prize (from filed numbers, no new measurement)

keys2 §Phase medians (same base, reused — re-measuring identical inputs would burn the shared lock for identical numbers): legacy 20.50/20.11 ms, diet 17.21/16.74 ms over 106,278 tuples → ~191 ns/tuple legacy, ~160 ns/tuple diet; clone-only 25–26 ns/tuple. The reusable loop is `collect_exact` = 35,426 same-D tuples:

| baseline | loop cost (35,426 × rate) | reuse saves (serialize→clone) | vs whole-sync bar (≥15 ms + ≥1.5%) | vs per-phase bar (≥5 ms + ≥25%) |
| --- | --- | --- | --- | --- |
| legacy (standalone) | 6.77 ms | **~5.9 ms** | MISS (2.6× short) | clears absolute only |
| diet (marginal vs keys2's banked diet) | 5.66 ms | **~4.8 ms** | MISS (3.1× short) | MISS (4.8 < 5; 23% < 25%) |

Flame cross-check: filed "exact site" 12 wt = collect (~6) + partition (~6); decl site 7 wt. Three ~equal loops ≈ 6–7 wt each — consistent with 5.7–6.8 ms loop costs. Ceiling-barred at the whole-sync bar under either baseline (even a fantasy zero-cost clone, 6.8 ms, misses 15 ms by 2.2×); the diet-marginal prize additionally misses the per-phase bar's absolute prong. No A/B was run: running an 8-pair set against a ceiling-barred, unsound mechanism would burn the shared lock for a foregone CUT (wave-1 keys precedent).

## Soundness: the mapping is seed-coincidence, broken by construction

Positional reuse needs `exact[i] ⟷ decl[i]` (collect loop) on **all** inputs. The two streams are produced by **independent walks with independent skip rules** — analysis (`diagnostics/analysis`, predicts from AST, "never infers success from extraction's wants") and extraction (`extract/*`, resolves through scope/bag/graph) — with no shared index anywhere in the types (`DiagnosticFact`/`OwnedLookupKey` carry no decl index). Threading one means stamping leaf identity in both walks and joining at two consumers (proof iterates exacts; partition iterates mixed facts) — invasive surgery across extract + analysis + proof + partition, diag territory, fragile. Worse, the correspondence is already false off-corpus on two axes:

**Axis 1 — const-referenced values (sealed by committed tests, no run needed).** Analysis deliberately shadows every declarator (`record_declarator_shadow`, F-S4a silence gap): `top_level_const_use_stays_dynamic_end_to_end` (`analysis/css.rs:259`) pins `const C = 'red'; css({ color: C })` → **0 exacts**, 1 dynamic. Extraction resolves same-file consts through the scope chain: `test_top_level_const_ternary_emits_one_plan_per_arm` (`extract/site_plan_tests.rs:143`) pins `const tone = …; css({ color: tone })` → **2 plans** (hence 2 decls); `test_function_const_literal_emits_plan` (`:160`) pins const → 1 want + 1 plan. On any const-valued input the decl stream is longer than the exact stream — every downstream positional index serves the wrong key.

**Axis 2 — dynamic values / harvest minting (code-level).** Analysis emits `DynamicSlot` (zero exacts) for unknown values; harvest then mints pool values into **both wants and authored decls** (`extract/harvest/mint/mod.rs:141,162`), appended post-extraction in (prop, when)-sorted sink order (`lib.rs:282→298`, `mint/mod.rs:101-106`). On any input with identifiers the decl stream gains entries the exact stream never has, in an order no analysis walk reproduces.

**Failure mode is verification-silent.** Proof touches diagnostics only (`render.rs:50-60` mutates the diagnostics vec; sheets/data come from the atom set and plans). Wrong served keys corrupt proof joins → wrong/missing diagnostics lines — user-visible, while the standard battery (styles.css + runtime-data.mjs byte-identity, determinism) stays green. A mechanism whose failures evade every filed check cannot BANK.

## Mechanism counts (filed corpus, reused)

From keys2 §Phase (re-verified against `/tmp/swarm-keys-dump-ent.txt`, agreeing with wave-1 keys exactly): decl 35,426 / 19,187 unique; exact-tagged 70,852 / 19,187; union 19,187; 5.54x duplication; 78% string values, zero JSON numbers; key bytes p50 54 / p99 120 / max 153; adjacent dupes ~0. New in this report: the 70,852 split into collect 35,426 + partition 35,426 (§Correction), and the two divergence axes (§Soundness).

## A/B, output hashes, determinism, suites

Not run — no candidate was built (CUT before implementation). No suites owed: zero tracked edits (`agentrs c/q` gate touched crates/files; none touched). Zero CPU held: no bench-lock hold, no builds, no test runs — this CUT is counted and code-proven, per the ideal fast-CUT shape.

## Specified differential probe (for the record)

Anyone can re-prove Axis 1 end-to-end in one temp test (not run here — both halves are already pinned by the committed tests cited above; do not commit):

```rust
// temp, atomic crate: one const-valued input, both streams counted.
let src = "import { css } from '@reference-ui/react'; const C = 'red'; css({ color: C, mt: '2r' })";
// analysis side → expect exact_keys == [mt-tuple] (1 exact; color stays dynamic)
// extraction side (compile_code helper) → expect 2 authored decls/plans (color=red resolved + mt)
// DIVERGENCE: len 1 vs 2 — every positional index at/after 0 is wrong.
```

Prediction before running: analysis yields exactly the `mt` key (F-S4a), extraction yields `color=red` + `mt` (scope resolution). A positional `exact[i] ⟷ decl[i]` map serves `mt`'s bytes for `color`'s fact at i=0.

## Collision / leads (for the captain — not my mechanism, not implemented)

1. **Partition dead-render kill (FILED LEAD, diag territory).** On the `!compiler-logs` path, `partition` renders all 35,426 exacts (+ dynamics) through `render_expected` — serialize + `catalog.locate` + `format!` — then drops every line: `is_pushed_fact(Exact|Dynamic)` is false (no strip, `channels/mod.rs:113-118`) and `is_false_fact` is false (no echo, `:121-126`). Prize ≈ the full partition loop, ~5.7 ms serialize + locate/format at diet rates — larger than keys2's diet, sound by construction (dead code), zero behavior change. Fix shape: skip render where the line is unused — `if !render_compiler && matches!(fact, ExactLookupExpected{..} | DynamicSlot{..}) { continue; }` before `render_fact` (`channels/mod.rs:70`); pushed/false facts still render for strip/echo. One mechanism per crew kept me off it; swarm-diag or the reserve should take it — first sound LAND wins the race.
2. **swarm-scalarjson** (holding the lock at filing): their JSON writer speeds `serialize_lookup_key` itself, i.e. all three loops including my would-be loop — stacks multiplicatively with the §1 lead; no textual collision with my zero-diff tree.
3. **keys2's banked diet**: same functions, stacks coherently (§Prize marginal column is the honest number for the bank integrator's bisect).
4. **swarm-diag**: fact path + partition are their territory; this report touches neither (read-only analysis).

## Verdict

**CUT (prize ~4.8 ms marginal / ~5.9 ms standalone — ceiling-barred 2.6–3.1× short of whole-sync bar on the corrected three-loop structure; positional mapping unsound by construction — const/dynamic inputs provably diverge — with verification-silent failure mode; zero-diff, zero-build, no lock hold)**

# swarm-harvestphase REPORT: harvest pool+mint per-phase revival (D1 BANK, D2/D4 CUT)

## Verdict

**PER-PHASE-BANK (D1: −8.60 ms median on the isolated harvest phase, 31.6%
median phase share, 6/6 pairs, byte-identical 4-scale; D2 CUT at exactly
0.00; D4 CUT at ≤0.26 ms gross with churn-volume filler filed)**

One line: the static/dynamic SPLIT census killed the parent's
dynamic-heavy theory (sinks = 0 on all 4 scales) and re-measured D1's
prize on tip at ~9.8 ms; the built diet captures it whole (−8.60 ms
median, D1 arm reads 0.000 ×6), clearing ≥5 ms (1.7×) and ≥25% (1.26×)
on every pair, with the phase method reproducing the filed flame.

## Mission

Wave-2 harvest CUT (whole-sync fantasy ~12.5 ms / 1.08%, sinks = 0 on the
seed-7 load) filed D1/D2/D4 identity arguments explicitly for per-phase
revival. This mission re-censuses the harvest chain (Forge Slice 4: mask
+ `collect_pool` + `mint`) on tip `ddce131e7` (13 diets landed, including
hashers-Fx into harvest itself) with a static/dynamic input SPLIT,
isolates the phase by the keys2 method, and rules each sub-diet against
the per-phase bar: **phase effect ≥ 5 ms AND ≥ 25% of the isolated phase
AND differential proof AND flame-reproducing method**.

## Base / binaries

- Base: `ddce131e7ab9a627500b5caa3d24bce81204dfe4` (verified `git rev-parse
  HEAD` before work and at file time; tree = diet file + REPORT only).
- Count `.node` (instrumented base, TEMP counters + timers, never scored):
  `a41b78e585ea106dfdc22ef45cc239b61f4fe92b97fb9ebd30445cc365c03da6`
  (`/tmp/swarm-harvestphase/census.node`).
- Phase-D1 `.node` (instrumented + D1): `f6a1600a300b6f1c32a9ceacad14a9
  1895e98d688055b7d35a12342b1f716fae` (`d1instr.node`).
- Clean base `.node`: `226aa731f4ceb2ef96de085614a256ce6d4e5596db19d22e
  88108ba2d3b5db97` (`clean-base.node`); clean D1 `.node`: `e9ed3d3280c2
  52b154355d98bf3678d446073d1d0ab333f2ce0eb0d898e74a6f`
  (`clean-d1.node`). All four sha-distinct; A/B shas verified before AND
  after the set.
- Bench lock: one hold (census 9 runs + phase-bench 16 runs + clean
  builds + 8-pair + identity/determinism 10 runs), two-step release,
  confirmed free. No queued waiters at roll-through (posted).

## Diff

One file, +29 (6-line diet + 23-line pin test):

```
.../modules/atomic/src/extract/harvest/mint/mod.rs | 29 +++++
1 file changed, 29 insertions(+)
```

```rust
// Empty sinks means the loop below runs zero iterations, so the seed
// set would be built and dropped with zero observable effects: skip it.
// (Pool-empty + sinks>0 still runs: zero-offer reports are bytes.)
if sinks.is_empty() {
    return;
}
```

plus `empty_sinks_skip_seed_without_effects` (empty sinks leave wants /
authored / diagnostics / session facts untouched).

## Phase definition, isolation method, flame reproduction

**Phase:** the harvest chain = mask scan + `collect_pool` + `mint` within
one enterprise compile (Forge Slice 4). Diet-addressable sub-stages:
`t_merge` (D4), `t_dedup` (D2), `t_seed` + vacuous `t_loop` + seed drop
(D1). Fenced ground inside the walls: `t_visit` (oxc walk = parse
ground, classify = canon2 ground, inserts) and `t_mask` (floor) — kept
in the denominator, conservative for the share.

**Isolation (keys2 method):** in-situ `Instant` stage timers around
exactly the phase functions inside the REAL enterprise compile over the
REAL corpus (3,122 retained programs + 48,566 site wants + sinks) — no
replay, no synthetic corpus for the effect. Phase-bench arms differ ONLY
by the 6-line diet (identical instrumentation); `t_pool` reads equal
both arms (18.1–18.8), proving clean differential isolation.

**Flame reproduction:** scored phase walls vs repro2 harvest rows —
`t_pool` 18.36–18.92 vs `collect_pool` 18/19 incl (within 5%);
`t_mint` 9.72–9.84 vs `mint` 10–12 incl (lower edge, ~15%); `t_merge`
0.25–0.26, `t_dedup`/`t_loop` 0.000 flat as censused. Note `t_pool`
contains the classify calls (`pool.insert` → `classify_harvest_value`
inside the walk), so `collect_pool`-incl already carries classify —
coherent, no double-count. Method validated: the instrument reproduces
the independent flame on both named frames.

## Census (static/dynamic SPLIT — the D1 life/death question)

Method: TEMP `Relaxed` counters + `Instant` stage timers (control-flow-
neutral split of the panicked/mask skip; one explicit `drop(state)`
moving the inevitable drop inside the wall), env-gated dump
(`HARVESTPHASE_COUNT=1`), pin stream (NO --seed), every spawned run
lock-gated. Enterprise ×3 (bit-identity requirement); small/medium/
churn ×2 each (split). Output pins checked on all 9 runs.

**Every counter bit-identical across all 3 enterprise runs** (and ×2
within each split scale). Instrumented outputs match sealed pins on all
9 runs (instrumentation doctrine-neutral).

| counter | ent ×3 | small ×2 | med ×2 | churn ×2 | meaning |
| --- | --- | --- | --- | --- | --- |
| parsed / visited / masked / panicked | 3122 / 3122 / 0 / 0 | 68 / 68 / 0 / 0 | 276 / 276 / 0 / 0 | 4122 / 4122 / 0 / 0 | retained programs; mask skips none |
| str / tmpl / holefree | 95894 / 0 / 0 | 3069 / 0 / 0 | 12032 / 0 / 0 | 259835 / 0 / 0 | zero template literals anywhere |
| inserts / classify hits | 95894 / 24861 | 3069 / 455 | 12032 / 2354 | 259835 / 132203 | 25.9% / 14.8% / 19.6% / 50.9% accept |
| perfile sum / merges / moved | 17693 / 3122 / 17693 | 343 / 68 / 343 | 1647 / 276 / 1647 | 130100 / 4122 / 130100 | per-file values merged |
| pool distinct | 657 | 180 | 416 | 70635 | churn pool is 100× enterprise |
| sinks raw / unique | **0 / 0** | **0 / 0** | **0 / 0** | **0 / 0** | **static load, all scales** |
| seed wants | 48566 | 984 | 3837 | 253578 | site wants cloned into the twin set |
| gate_skip / accepts / offered / minted / reports | 0 / 0 / 0 / 0 / 0 | 0 (all) | 0 (all) | 0 (all) | mint loop entirely vacuous |

Stage walls, enterprise (ms; run 1 first-run-low, runs 2–3 scored):

| stage | run 1 | run 2 | run 3 | diet-addressable? |
| --- | --- | --- | --- | --- |
| pool walk + classify + insert (`t_visit`) | 15.54 | 16.00 | 15.45 | **no** — parse + canon2 ground |
| pool merge (`t_merge`) | 0.25 | 0.26 | 0.25 | **yes (D4)** — gross upper bound 0.26 |
| pool total (`t_pool`) | 18.42 | 18.92 | 18.36 | wall (visit + merge + timer overhead) |
| dedup (`t_dedup`) | 0.00 | 0.00 | 0.00 | **yes (D2)** — exactly zero |
| mint seed build (`t_seed`) | 6.91 | 8.57 | 8.45 | **yes (D1)** — 48,566 wants × ~175 ns |
| mint loop (`t_loop`) | 0.00 | 0.00 | 0.00 | vacuous (sinks = 0) |
| mint total incl. seed-set drop (`t_mint`) | 8.15 | 9.84 | 9.72 | **yes (D1)** — drop (~1.3) dies with seed |
| mask scan (`t_mask`) | 0.06 | 0.06 | 0.05 | no — floor |

Phase P (scored): run 2 = 0.06 + 18.92 + 9.84 = 28.81; run 3 = 28.13.

Tip drift vs harvest base (5844b24): `t_seed` 10.3 → ~8.5 (hashers Fx
seed set landed); `t_merge` 1.23 → 0.25 (hashers Fx pool map landed);
`t_visit` 23.4 → ~15.7 (canon2 cheaper classify landed). All three
prizes shrank — the re-census was load-bearing. D1 survives; D4 does not.

## Bar rulings per sub-diet

- **D1** (skip seed when sinks empty): trigger TRUE on all 9 runs
  (`sinks_raw = 0` everywhere — the dynamic-heavy death clause does NOT
  fire). Census prize `t_mint` = 9.84/9.72 = 34.1%/34.5% of P. Measured
  (built, §Phase-bench): **−8.60 ms median, 31.6% median share, 6/6
  pairs, every pair clears both prongs** (min pair 8.25 ms / 30.9%).
  Rule: **BANK-per-phase** (1.72× absolute, 1.26× share).
- **D2** (borrowed dedup keys in `ordered_unique`): per-sink clones × 0
  sinks = **0.00 exactly** on all 9 runs (`t_dedup` 0.000, D2's ground
  timed separately and empty). Unmeasurable on the real corpus at any
  grain — no synthetic-corpus rescue (keys2 method: effect on the REAL
  corpus). Rule: **CUT**.
- **D4** (single global pool, no merge): effect ≤ `t_merge` gross =
  **0.26 ms upper bound** (delta ≥ 0 by construction — deeper inserts
  into one pool can only cost) = 0.9% of P. Fails absolute (19× margin)
  and share (28×). Rule: **CUT**. Filler filed: churn `t_merge` 15.7–
  15.8 ms (130,100 moved) proves the shape is volume-sensitive — D4
  revives only on churn-volume pool loads; exact code = one visitor
  over all programs into a single pool (harvest identity argument
  stands: `BTreeSet`s insertion-order-free, mint reads `KIND_ORDER` +
  sorted sets). Never solo on the scored load.

## Phase-bench (the verdict core — built diet, 6 interleaved pairs)

Instrumented-base vs instrumented-D1 (identical timers, `.node` swapped
per arm, shas distinct and stable), 2 unscored warmups/arm, alternating
lead. `t_mint` per pair (ms):

| pair | base `t_mint` | D1 `t_mint` | Δ ms | phase P (base) | share |
| --- | --- | --- | --- | --- | --- |
| 1 (B,C) | 8.574 | 0.000 | −8.574 | 27.210 | 31.5% |
| 2 (C,B) | 9.564 | 0.000 | −9.564 | 28.212 | 33.9% |
| 3 (B,C) | 8.735 | 0.000 | −8.735 | 27.126 | 32.2% |
| 4 (C,B) | 8.620 | 0.000 | −8.620 | 27.249 | 31.6% |
| 5 (B,C) | 8.253 | 0.000 | −8.253 | 26.675 | 30.9% |
| 6 (C,B) | 8.440 | 0.000 | −8.440 | 27.302 | 30.9% |

- Base median 8.597; D1 median 0.000 (8/8 runs incl. warmups — the skip
  is total, zero variance on the diet arm); **median Δ −8.60 ms, 6/6
  pairs, paired-median −8.60** — all estimators agree.
- **Median share 31.55%** (range 30.9–33.9%, every pair ≥ 25%).
- `t_pool` equal both arms (base 18.34–18.81, D1 18.13–18.76) — the diet
  touches only mint, differential isolation clean.
- Warmups (unscored): base 8.236/8.310, D1 0.000/0.000.

## Whole-sync A/B: 8 interleaved pairs, clean arms (DIRECTIONAL ONLY)

Per brief the whole-sync effect is reported but NEVER the verdict
basis; per keys2 precedent this set is the no-regression read.
Clean-base vs clean-D1, 2 unscored warmups/arm, alternating lead:

| pair | base syncMs | D1 syncMs | Δ ms | Δ % |
| --- | --- | --- | --- | --- |
| 1 (B,C) | 967.29 | 969.51 | +2.22 | +0.2% |
| 2 (C,B) | 977.88 | 1009.09 | +31.21 | +3.2% |
| 3 (B,C) | 983.91 | 968.15 | −15.76 | −1.6% |
| 4 (C,B) | 961.80 | 971.75 | +9.95 | +1.0% |
| 5 (B,C) | 984.97 | 960.86 | −24.11 | −2.4% |
| 6 (C,B) | 968.14 | 960.98 | −7.16 | −0.7% |
| 7 (B,C) | 980.13 | 957.13 | −23.00 | −2.3% |
| 8 (C,B) | 974.43 | 982.69 | +8.26 | +0.8% |

- Warmups: base 1151.84/976..
...[truncated 4067 chars]
# Fasthull burndown 1 — first full enterprise burndown (lane E tooling)

Lane E is tooling, not a perf change: this note records the first full
burndown from `deepsee all --scale enterprise` plus the reconciliation proof.
All numbers below come from ONE enterprise sync (seed 7, locked load).

Tooling: `packages/reference-neo/benchmark/deepsee/` (README there).
One command: `node packages/reference-neo/benchmark/deepsee/cli.ts all --scale enterprise`

Run: 2026-09-20 ~23:52Z, box shared with 4 sibling crews (load ~3.4, so
absolute walls run hot vs the quiet pin; shares, RSS, and bytes are the
comparison). A first run (23:50Z) was discarded for RSS only: the parent
poller sampled into the worker's post-sync payload census (+76 MiB transient).
Fixed via a SYNC-DONE marker (verified on medium: parent 208.8 vs worker
209.4); the numbers below are the clean second run. Its burndown agreed with
run 1 on every phase within sampling spread (serde 18.8% vs 23.6% — the only
wide mover; assembly+emit+serde ≈ half of sync in both).

## Enterprise burndown (seed 7)

- sync wall: 4.07s · native.compile (exact): 3.32s · TS stages (exact): 748ms
- RSS peak: worker 806.7 MiB · parent-polled 801.5 MiB (309 samples)
- sample: 5135 main-thread ticks, 3397 non-idle (66.2%)

### Exact stage walls (timers)

| stage | wall | share of sync |
| --- | --- | --- |
| `config` | 20.1ms | 0.5% |
| `fragments.prepare` | 368ms | 9.0% |
| `fragments.evaluate` | 2.6ms | 0.1% |
| `native.compile` | 3.32s | 81.6% |
| `publish` | 358ms | 8.8% |

### Native internals (sampled ≈, scaled to sync wall)

| phase | ticks | ≈ms | ≈share of sync |
| --- | --- | --- | --- |
| `scan/read` | 120 | 144ms | 3.5% |
| `parse` | 130 | 156ms | 3.8% |
| `constants` | 64 | 76.7ms | 1.9% |
| `hosts` | 119 | 143ms | 3.5% |
| `extract` | 148 | 177ms | 4.4% |
| `harvest` | 0 | 0.0ms | 0.0% |
| `diagnostics` | 105 | 126ms | 3.1% |
| `assembly` | 647 | 776ms | 19.0% |
| `emit` | 372 | 446ms | 11.0% |
| `serde` | 803 | 963ms | 23.6% |
| `napi-bridge` | 94 | 113ms | 2.8% |
| `base-system` | 11 | 13.2ms | 0.3% |
| `ts (sampled)` | 784 | 940ms | 23.1% |

### Cross-checks

- Σ native sampled ≈ 3.13s vs native.compile 3.32s (Δ -192ms)
- ts sampled ≈ 940ms vs TS stages 748ms (Δ +192ms)
- Σ shares: 100.0% of non-idle

The ±192ms straddle is the bridge JSON codec on the JS side: `JSON.parse`
of the 53 MiB result runs inside `native.compile`'s timer but samples as V8
(`ts`). It repeated at ±179ms in run 1. True bridge-codec cost ≈ serde
sampled + ~190ms ≈ 1.15s (~28% of sync) — the A1 tax, quantified.

## RSS attribution at peak (approximate)

- repo on disk: 15123 files, 4.16 MiB · N-API payload JSON: 53.29 MiB

### Growth by stage boundary (parent-polled RSS)

| boundary | RSS | Δ since start |
| --- | --- | --- |
| `config` | 97.7 MiB | +2.2 MiB |
| `fragments.prepare` | 116.9 MiB | +21.4 MiB |
| `fragments.evaluate` | 117.9 MiB | +22.4 MiB |
| `native.compile` | 605.9 MiB | +510.4 MiB |
| `publish` | 801.5 MiB | +705.9 MiB |

### Retention model at peak (approximate)

| holder | model | bytes | share of growth |
| --- | --- | --- | --- |
| source texts (RS + TS copies) ≈ | 2 × disk | 8.3 MiB | 1.2% |
| N-API payload (string + parsed) ≈ | 2.5 × JSON | 133.2 MiB | 18.9% |
| arenas / AST / constants / overhead (residual) | remainder | 564.4 MiB | 80.0% |
| baseline (pre-sync heap + runtime) | measured | 95.5 MiB | — |

Growth above baseline: 705.9 MiB · residual per file: 38.2 KiB
(avg file is 289 B — retention runs ~135× source bytes, the A3 shape).

### N-API payload fields (measured bytes)

| field | bytes | share of payload |
| --- | --- | --- |
| `portableStylesheet` | 14.66 MiB | 27.5% |
| `stylesheet` | 14.66 MiB | 27.5% |
| `wants` | 10.08 MiB | 18.9% |
| `stylePlans` | 4.72 MiB | 8.9% |
| `runtime` | 3.90 MiB | 7.3% |
| `recipes` | 3.81 MiB | 7.1% |
| `css` | 1.46 MiB | 2.7% |

Dead-on-arrival fields (`wants`, `stylePlans`, `recipes` dup, `css`) are
~20.3 MiB, 38% of the 53.3 MiB bridge string — the A1 payload, measured.

## Bundle accounting (this sync)

- styles.css: 14.31 MiB (844849 B gzip) — recipes layer 12.12 MiB (84.7%,
  of which @container wraps 10.95 MiB), utilities 2.18 MiB (15.2%)
- runtime-data.mjs: 3.90 MiB (216404 B gzip) — recipes table 3.82 MiB
  (97.9%: combinations 62.7% + responsiveVariantMap 26.7% + variantMap 5.1%)

| file | shipped | accounted | residual |
| --- | --- | --- | --- |
| styles.css | 15007762 | 15007762 | 0 |
| runtime-data.mjs | 4090907 | 4090907 | 0 |

Reconciled to the byte.

## Reconciliation vs pin 5eda2c60b7e5

| metric | pin | this sync | Δ |
| --- | --- | --- | --- |
| sync wall (median of 1 vs pin median) | 3.51s | 4.07s | +16% (shared box; shares are the signal) |
| peak RSS | 796.0 MiB | 806.7 MiB | +1.3% |
| styles.css raw / gzip | 15007762 / 844849 | 15007762 / 844849 | identical |
| runtime-data.mjs raw / gzip | 4090907 / 216404 | 4090907 / 216404 | identical |

## What the lanes get

- Lane a (A1+A2): bridge codec ≈ 1.15s (~28% of sync); dead payload 38%
  of 53 MiB; emit 446ms holds the double print.
- Lane b (A3+A4+A5): 564 MiB residual (80% of growth), 38 KiB/file;
  scan+parse+extract+hosts+diagnostics ≈ 740ms with an 80%-dead load.
- Lanes c/d (A6+A7): recipes 84.7% of css (@container fan-out 90% of it);
  combinations+responsive 89.4% of the recipes table.
- Harvest pool walk: 0 ticks of 3397 — present in the code, unmeasurable
  in wall time. A4's scrape is parse + the other walks, not harvest.

## Method notes

- TS stage walls are exact timers; the worker replicates `sync()` and its
  output was verified byte-identical to a bench sync (`cmp` on medium).
- Native internals are 1ms `sample` leaf attribution on the main thread
  (nearest phase-matching ancestor), scaled to sync wall; cross-check rows
  compare against the exact timers. Leaf sums validate against the thread
  total; unattributed samples report as `other` (0 here).
- RSS shares are a stated copy-count model over measured bytes; residual is
  remainder, never forced to zero. Parent polling stops at the worker's
  SYNC-DONE marker so post-sync census never pollutes peak.
- Bundle accountants assert zero residual or fail the run.
- Medium pre-verification (same tooling): cross-checks Δ ±1ms on 530
  non-idle ticks; bundle 2554607/808657 B = pin raw, residuals 0/0.

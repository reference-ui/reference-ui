# Mission: Operation Fasthull — scrape the hull, keep the load

Status: `active` (HQ 2026-09-20). Fasthull is the performance-cycle
engine for tonight's hyperspace voyage: it defines one cycle —
hypothesis, implementation, measurement, review, log entry — and the
rules every cycle obeys. Orchestration (waves, worktrees, merges,
sequencing) belongs to the voyage brief currently running it
(`VOYAGE-HYPERSPACE.md`); this file owns the cycle.

HQ 23:49: the voyage is **performance-only** (no red team). The
locked target is **all three**: sync wall, peak RSS, and bundle
bytes (`styles.css` + `runtime-data.mjs`), scored against the Neo
pin and the Panda v2 goalpost in the brief. A cycle names one
lever; it may not regress the other two. Do not copy Panda's
architecture. Harvest is not the kill target.

Predecessor: the bench S1–S4 pass
([PLAN.md](../../packages/reference-neo/benchmark/PLAN.md)), committed as
`5eda2c60b` with the first log pin at
`benchmark/reports/5eda2c60b7e5/` (`467e6c577`). That pin is the
baseline: every cycle measures against fixed load. Domain:
[benchmark/README.md](../../packages/reference-neo/benchmark/README.md).

Every number below marked **verified** is read from the committed pin or
a same-seed replay on 2026-09-20. Nothing is a model.

## The suspicion

The app curve as locked (**verified** medians, seed 7):

| scale | files (+dead) | css() calls | sync | peak RSS | bundle |
| --- | --- | --- | --- | --- | --- |
| small | 60 (+240) | 171 | 156ms | 123 MiB | 788 KiB |
| medium | 250 (+1,000) | 635 | 466ms | 202 MiB | 3.2 MiB |
| enterprise | 3,000 (+12,000) | 7,527 | 3.52s | 768 MiB | 18.2 MiB |

Plus the `churn` stress ceiling (**verified**): 43,956 calls, ~6s,
~1 GiB. Enterprise is the optimisation target; churn is the guardrail
no optimisation may silently regress.

## The performance cycle

One cycle, one hypothesis. The owner hypothesises, implements, and
measures; a different agent reviews. No agent grades its own speed.

1. **Hypothesise.** Name the thick spot and why: wall time, peak
   RSS, or bundle bytes (`styles.css` / `runtime-data.mjs`). Cite
   profile or artifact evidence (flamegraph, allocation shape, JSON
   payload, recipe rule count — never vibes). One hypothesis per
   cycle; the bench load from the locked metric is the only load it
   may cite. The team's architect concurs before implementation
   starts.
2. **Implement.** One change, inside the hypothesis boundary. No
   scale, generator, or sampler edits — the load is frozen while
   optimising. Bytes are a target: they should fall or hold. Growth
   is a fail unless the architect signed an explicit trade.
3. **Measure.** Bench at locked load against the wave-start pin,
   medians across the default runs, scale by scale. Report sync,
   peak RSS, `styles.css`, and `runtime-data.mjs` (raw + gzip). A
   win must clear the measured run-to-run spread.
4. **Stability.** Acceptance green (reference-neo cases plus the
   reference-rs loop, generally) and churn unregressed beyond noise.
   Pre-existing failures, if any, are named and shown unrelated —
   never silently absorbed.
5. **Review.** A peer agent re-verifies firsthand: the bench
   comparison, the stability claim, the diff against the hypothesis
   boundary. Verdict: VERIFIED or GAPS with particulars.
6. **Log.** One entry in the voyage perf log: what was tried, bench
   deltas, stability, review verdict, outcome. A disproven hypothesis
   is a complete cycle — log it and move on.

Only VERIFIED cycles merge. GAPS cycles ride the next wave or die in
the log, never in silence.

## The arc rule (all three, or nothing lands)

1. **A hypothesis exists**, written, citing evidence: which of the
   three it moves and why the change helps.
2. **Stability holds**: acceptance green, churn unregressed.
3. **The bench beats the baseline** on the named lever at fixed
   load, and does **not regress** the other two: sync wall, peak
   RSS, bundle bytes (`styles.css` + `runtime-data.mjs`, raw and
   gzip). Small and medium are the shape check.

The Goodhart guard, non-negotiable: faster or smaller by weakening
the load, dropping extracted leaves, or gaming the measurement
fails review on sight. Gains come from the engine or they do not
come.

## The locked metric

All three, at fixed enterprise load, deltas in percent against the
wave-start pin and against the Panda v2 goalpost in
`VOYAGE-HYPERSPACE.md`:

1. median sync wall time
2. peak RSS
3. bundle bytes — `styles.css` and `runtime-data.mjs`, raw and gzip

Medium and small are the shape check (an enterprise-only win that
warps the curve is suspect, not victory). The night aims at all
three. One cycle may move one lever; it may not spend the other
two to get there.

## Evidence

Numbers live in report pins (`benchmark/reports/`); profile captures
and analysis memos land as `fasthull-NN-<topic>.md` beside the other
Neo evidence; cycle entries live in the voyage perf log. Dead ends are
evidence too — log them, do not bury them.

## What this is not

- Not orchestration. Waves, worktrees, merges, and sequencing are the
  voyage brief's; this file defines the cycle.
- Not a bench retarget. Scales, generators, and samplers are frozen
  while optimising.
- Not bench golf. See the Goodhart guard.
- Not new features, new output, or new dialect. Bundle bytes are a
  win condition, not a side effect.
- Not churn's funeral. The stress rung stays as the guardrail.

## Done when (per cycle; the standing loop closes only on HQ's word)

- The hypothesis names a thick spot (time, RSS, or bytes) with
  evidence.
- The bench beats the baseline on that lever and does not regress
  the other two.
- Stability holds and the review reads VERIFIED.
- The log entry exists: tried, measured, held, outcome.
- Or: the cycle disproves its hypothesis, logs why, and dies clean.

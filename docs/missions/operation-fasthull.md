# Mission: Operation Fasthull — scrape the hull, keep the load

Status: `active` (HQ 2026-09-20). Fasthull is the performance-cycle
engine for tonight's hyperspace voyage: it defines one cycle —
hypothesis, implementation, measurement, review, log entry — and the
rules every cycle obeys. Orchestration (waves, worktrees, merges,
sequencing) belongs to the voyage brief currently running it
(`VOYAGE-HYPERSPACE.md`); this file owns the cycle.

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

1. **Hypothesise.** Name the slow spot and why, citing profile
   evidence (per-phase breakdown, flamegraph, allocation shape —
   never vibes). One hypothesis per cycle; the bench load from the
   locked metric is the only load it may cite. The team's architect
   concurs before implementation starts.
2. **Implement.** One change, inside the hypothesis boundary. No
   scale, generator, or sampler edits — the load is frozen while
   optimising. Output bytes identical unless the hypothesis says why
   they moved.
3. **Measure.** Bench at locked load against the wave-start pin,
   medians across the default runs, scale by scale. A win must clear
   the measured run-to-run spread.
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

1. **A hypothesis exists**, written, citing profile evidence: what was
   slow and why the change helps.
2. **Stability holds**: acceptance green, churn unregressed.
3. **The bench beats the baseline** on the locked metric at fixed
   load: lower sync wall and/or peak RSS, same bytes.

The Goodhart guard, non-negotiable: faster by weakening the load or
gaming the measurement fails review on sight. Speed comes from the
engine or it does not come.

## The locked metric

Median sync wall time plus peak RSS at fixed enterprise load, deltas
in percent against the wave-start pin; medium and small as the shape
check (an enterprise-only win that warps the curve is suspect, not
victory). The voyage brief may narrow this further; it may not widen
it mid-night.

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
- Not new features, new output, or new dialect. Bytes identical or
  explained.
- Not churn's funeral. The stress rung stays as the guardrail.

## Done when (per cycle; the standing loop closes only on HQ's word)

- The hypothesis names a slow spot with profile evidence.
- The bench beats the baseline on the locked metric at fixed load.
- Stability holds and the review reads VERIFIED.
- The log entry exists: tried, measured, held, outcome.
- Or: the cycle disproves its hypothesis, logs why, and dies clean.

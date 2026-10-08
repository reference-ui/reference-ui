# Oracle review — WAVE0.oracle (harness + census + pins)

STEP: WAVE0.oracle
PIN: `29e3e4d3e` on branch `reference-system` (Wave 0 recon committed).

Read `.agents/missions/voyage-one-shot/MEASURE.md`, `pins/README`,
`scripts/census/*.mjs`, `scripts/run-samples.mjs`, `scripts/verify-pins.mjs`,
and the prior plan at `reports/PLAN.oracle.md`. Judge the pinned commit; a Wave
1 implementor may be editing `packages/reference-lib/package.json` and the
three configs concurrently — ignore uncommitted product changes.

## What to review

This is the harness/census review the plan called for before R1's proof is
trusted. Assess:

1. **Is the counts-first bar sound?** The census counts ESM `load` hooks only
   (disclosed: nested CJS `require()` inside react/react-dom is not counted).
   Can a future regression hide behind the uncounted path, or is the ESM
   boundary genuinely irrelevant to this axis? Is "~2 loads" the right
   after-target, and can it be gamed?
2. **Is the census method valid?** The loader slice point (after setup, before
   `evaluateConfig`) — does it actually capture the config-import graph and
   nothing else? Any attribution error in the per-package table?
3. **Are the pins the right coverage?** docs + lib + icons self-syncs,
   aggregate shas, `verify-pins.mjs`. Does R1 need any additional pin (e.g.
   the `matrix/tests/mcp` and `chain/T16` outputs, which R1 also changes)?
   Should the pin file commit at all, or is `MEASURE.md`'s aggregate enough?
4. **Cold-arm gap.** `purge` needed root, so the cold arm is project-cache
   cold only, not page-cache cold. Does that invalidate the R1 identity/timing
   bars, or is it acceptable with the warmup-unscored rule?
5. **Anything that would let R1's proof slip** — a timing methodology hole, a
   missing agreement rule, a stale-dist risk (measure-one-shot runs
   `dist/src`; is `dist` guaranteed fresh for the tip?).

## Response format

First line `STATUS: DONE` (or `STATUS: REFUSED`). Findings with stable IDs,
severity, file:line evidence at the pin, recommendation, validation gap; P4 for
non-repair observations. End with a verdict: is the harness approved to trust
R1's proof, and exactly what (if anything) must change first.

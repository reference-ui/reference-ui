# Brief — WAVE2.5.fix (crew: general, DeepSeek V4.1 Flash, `#high`)

Fix line for the Oracle `WAVE2.C2.arc` review (LAND + follow-ups). Read
`.agents/missions/voyage-robustness/reports/WAVE2.C2.arc.md` in full. Work in
`/Users/ryn/Developer/reference-ui`, branch `reference-system` (base
`1b65d9d1f`). Do **not** commit, push, or `git stash`; do not touch
`packages/reference-rs/**` or the pre-existing untracked `pipeline/` files.
Disclose any file you did not touch.

## ARC-P2-1 (P2 — do first, it sits in the mandated agent loop)

`ensureLibBuild` in `.agents/skills/test-core/scripts/run.mjs` (SKIP env at
`:667,683`; call sites `:1398`, `:1776`) runs the lib build with
`REF_PIPELINE_SKIP_DEPENDENCY_BUILDS=1`. Lib `sync` is now
`ensure-dist && dist-ref`, and the gate exits 0 without a stat walk when SKIP is
set — so after a neo-src edit with no manual rebuild, the mandated
`pnpm agent verify` / `pnpm agent playwright` flows rebuild lib against
**stale neo dist** silently.

Fix (Oracle recommendation — pick the minimal, prove it): make `ensureLibBuild`
ensure neo dist with a **SKIP-unset** gate invocation before the gated lib
build (steady-state ~45 ms), **or** stop exporting SKIP to the lib build and
skip only the icons dep leg. Do not change the gate's own SKIP contract or the
pipeline orchestrator's use of it (`pipeline/src/build/index.ts:52`).

Bar: after a neo-src touch with no rebuild, the mandated flow rebuilds neo
before lib (observe `[ref build] dist ready` or the gate doing work); steady
state still ~45 ms; no behavior change to the pipeline path.

## ARC-P3-1 (P3 — opportunistic)

`packages/reference-neo/tools/build-bin.mjs:136-137` rm's `dist` then runs tsc,
which emits per-file despite type errors; a failed build leaves a fresh-mtime
partial `dist` (likely incl. `dist/bin/ref.js`), so the next gate run skips and
serves failed-build bytes. Fix: on build failure, remove `dist/` (or at least
`dist/bin/ref.js`) so the next gate run rebuilds.

Bar: a failed build never leaves a gate-fresh BIN (simulate a tsc failure,
confirm `dist/bin/ref.js` absent afterward, then restore).

## P4 doc fixes (cheap)

- **ARC-P4-3:** refresh or drop the stale aggregate comments / `# pin: @ 50df627bd`
  header in `.agents/missions/voyage-one-shot/pins/baseline.sha256` (cosmetic;
  `verify-pins` ignores comment lines — keep it PASS).
- **ARC-P4-4:** add a one-line supersede pointer at the top of
  `docs/bugs/NEO_EMIT_MODE_DRIFT.md` pointing to its Residual (C1) / Canon (C2)
  sections.

Do **not** act on P4-1/P4-2/P4-5/P4-6 (advisory).

## Prove

- `pnpm agentneo q` 0 errors; neo tooling tests green; if the runner changed,
  exercise the affected path and show neo rebuilt.
- `verify-pins` remains PASS.

## Output

Write `.agents/missions/voyage-robustness/reports/WAVE2.5.fix.md`, append to
`.agents/missions/voyage-robustness/WAVE2.md`, reply with a short summary +
VERDICT.
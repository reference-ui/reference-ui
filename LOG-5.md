IN PROGRESS — moved to LANDING.md 2026-09-23

# LOG-5 — Objective 5: reference lib productization (final)

Brief: [VOYAGE.md](./VOYAGE.md) Objective 5. One commit per component.
Crew shape: voyage captain protocol, one crew per component
(strict file ownership); UX sign-off per component; captain verifies
firsthand and commits.

## Status

Recon returned 2026-09-22, filed at
[docs/missions/quarantine-recon.md](./docs/missions/quarantine-recon.md).
Branch: `components-quarantine` (local-only, tip `89850d1c8`); 140
files, +54,481/−5,557; ~1,120+ new cases, 18 components frozen.
Mangling confirmed in-diffs (uncontrolled mode deleted, motion
stripped, focus rings globally suppressed, probing scaffolding).
Salvageable: matrix corpus with re-targeting, 2 colocated suites,
helper extractions. Suspect: all 18 rewritten sources + theme edits.

Blocked on the frozen repin baselines + Objective 4 (tooltip preset).
Gates: visuals frozen, interactions UX-reviewed (`ux-designer` skill,
briefed per component with the frozen-visuals constraint).
Execution: one shared tree, no worktrees, one commit per component
(user order 2026-09-22). Shape bar 150 LOC max, aim 80.
Root-first order — Overlay first, then widen.

## Carried from Objective 1 (captain, 2026-09-22)

D-OPEN-4: `packages/reference-lib/playwright/ct.ts` carries 2
pre-existing errors (MountFn assignability, missing
toHaveScreenshot matcher) on pristine HEAD content with zero
Reference involvement (proof: LOG-1.md D3 + lib crew L's
re-verification). Objective 1 deliberately did not touch it —
out of scope, and CT-harness surgery the night before
component verification risks the Obj 4/5 oracle. This
objective owns lib productionization: assess and fix here.

## Carried from Objective 2 (captain, 2026-09-23)

R-MDL-1 (trivial): `packages/reference-lib/ui.config.ts`
header comment still says "Uses reference-core as the
live config/runtime pipeline." One-word fix for whoever
owns lib next — this objective. Fold into the first lib
touch; not worth its own arc.

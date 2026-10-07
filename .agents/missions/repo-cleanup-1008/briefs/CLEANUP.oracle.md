# Oracle design consult — repo loose-file cleanup (CLEANUP.oracle)

STEP: CLEANUP.oracle
PIN: HEAD on `reference-system` (see `git log --oneline -1`). Read `FINALIZE.md`
(F-6 + "Cleanup backlog") and the repo root.

## Context

Owner, 2026-10-08: "we should start getting rid of loose, like, marked out files
in this repo as well because it's getting a bit messy." The first pass removed
the obvious scratch (`test-script.mjs`, `test-standalone.spec.ts`, the
superseded `REPORT.md`) and folded `FOLLOWUPS.md` into `FINALIZE.md`. The hard
part remains.

## Ask

1. **Mission dirs.** `.agents/missions/` holds ~20 dirs (`cleanup-0925`,
   `continuity`, `doom-night-0924`, `finalize`, `finish-line`,
   `font-weight-runtime-1008`, `hints-0925`, `landing-sequence`,
   `numberfield-wave2`, `playtest`, `quarantine-landing`, `red-team`,
   `seam-0925`, `sharp`, `smoke-oracle`, `styletrace_perf`, `voyage-one-shot`,
   `voyage-robustness`, …). Which are **done history to archive**, which are
   **active** (must stay), and which are **abandoned scratch**? Propose an
   archive shape (e.g. `.agents/missions/archive/<date>-<name>/`) and a rule
   grep-able from git (e.g. a `STATUS: closed` line).
2. **Root loose docs.** `DECISIONS.md`, `WANTS.md`, `DIAGNOSTICS.md`,
   `FINISH.md`, `LOG.md`, `review.md`, `sync-perf.html` — for each: keep, move
   under `docs/`, or delete (with the reason). Cross-check for staleness
   (superseded-by pointers, dates, dead links).
3. **Generated/committed strays.** `pipeline/src/registry/.store/**/*.tgz`,
   `.pipeline/**/.matrix-tarballs/*.tgz`, and anything else committed that is
   regenerable — should these be ignored + pruned? Any committed `dist`/build
   output that should not be tracked?
4. **Criteria & guardrails.** Define the rule that decides removal so future
   passes are mechanical, and the exclusions that must never be touched (active
   missions, the user's WIP, `docs/bugs/*` live bug docs, `FINALIZE.md` itself).
5. **Ordering.** A minimal, safe sequence (read-only inventory → archive →
   prune), and what to gate each step on.

## Constraints

Read-only review; a crew executes later. Do **not** propose touching:
`voyage-robustness`, `font-weight-runtime-1008`, `mdx-support`,
`package-unify-1008`, `docs/bugs/*`, the running docs dev server, or any ignored
build output. Keep `FINALIZE.md` the single tracker.

## Response format

First line `STATUS: DONE` (or `STATUS: REFUSED`). Findings with stable IDs,
file:line/paths, evidence, recommendation; a concrete keep/archive/remove list
and the ordered safe sequence; P4 for non-repair observations.

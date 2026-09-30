IN PROGRESS — RED-NF hunt crew (NumberField unit full-suite flakes). Branch reference-system, box 75 min. Runner only. NEVER commit.
Started: 2026-09-29 (UTC).

Brief: C-SNAPSHOT-2 item 4: 4–5 NF unit reds ONLY in full 70-file parallel run, 131/131 isolated, membership UNSTABLE (COMMIT-04 flipped pass). Suspects EDIT/PARSE with 5000ms timeouts. Scope: NumberField/ unit surfaces ONLY (NumberField.test.tsx + unit helpers); shared harness/config root → diagnose + FILE, do NOT fix. NEVER other components' files or CT specs.

Evidence read: C-SNAPSHOT-2.md T+17/T+95/T+110 (filed names: PARSE-19, PARSE-15, COMMIT-04/05, KEY-06 — quote fresh, do not trust verbatim).

Approval record: parent brief = hunt+fix-or-file within NumberField/ unit scope; runner-only commands.

## T+00 — kickoff
- Tree at start: CLEAN (captain landed C-SNAPSHOT-2 arcs).
- Raw logs → /tmp/red-nf-*.txt. Reds attributed by name, isolated re-run, two-in-a-row.
- Launched: isolated `pnpm agentct NumberField --unit` → /tmp/red-nf-isolated.txt; then full parallel unit run → /tmp/red-nf-full.txt.

## T+10 — REPRODUCED + ROOT PROVEN (zombie cascade, not 5 flakes)
- ISOLATED `pnpm agentct NumberField --unit`: **131/131** (/tmp/red-nf-isolated.txt). PARSE-19 alone took **4724ms** — 276ms under the 5000ms default timeout.
- FULL `pnpm agent vitest` (unfiltered, 70 files): **951/956**, sole red file NumberField.test.tsx, 5 reds quoted fresh (/tmp/red-nf-full.txt):
  NF-PARSE-19 (timeout 5008ms), NF-PARSE-15 (`seen` 13 entries w/ dupes vs [0..9]), NF-COMMIT-04 (`data-editing` null vs ''), NF-COMMIT-05 (`[-5,0]` vs `[-5]`), NF-KEY-06 (`[7,7,6]` vs `[7,8]`).
- HYPOTHESIS: PARSE-19 aborts under parallel-load CPU contention → vitest abandons it but its 2000-iteration act() loop keeps running as a zombie (focus steals + global act-queue interleaving + no afterEach cleanup in this file) → the 4 downstream value-failures (extra commits, lost editing state). Order fits: PARSE-19 (line 7662) runs before all four (7836/8037/8136).
- PROOF: isolated `pnpm agent vitest NumberField --testTimeout=1000` (forces PARSE-19 abort, zero load) reproduces the EXACT same 5 reds, same failure class (PARSE-15 Array(14) w/ dupes). /tmp/red-nf-forced-abort.txt. NOT pollution (default isolate:true, no fake timers, no concurrent in file), NOT 5 independent flakes — ONE load timeout + intra-file zombie cascade. Membership instability explained: downstream damage depends on where the zombie is when each test runs.
- SCOPE CHECK: fix lives entirely in NumberField.test.tsx (in-scope). No shared harness/config change needed.
- FIX PLAN: (1) PARSE-19 per-test `timeout: 20_000` w/ comment naming measured noise (2000 vectors × 3 act flushes ≈4.7s isolated + parallel contention; abort cascades — cite forced-abort repro); (2) `signal.aborted` guard in the matrix loop (TestContext.signal confirmed in vitest 4.1.11 .d.ts) so any future timeout fails closed with NO zombie. PARSE-19 is the sole near-timeout test in the file (only slow test in isolated log).

## T+25 — FIXED + PROVEN (two-in-a-row full green)
- FIX (NumberField.test.tsx ONLY, +15/-1): PARSE-19 `it(..., { timeout: 20_000 }, async ({ signal }) => ...)` w/ comment naming measured noise + `if (signal.aborted) return` at matrix-loop top (fail closed, no zombie).
- GUARD CHECK: temp per-test `timeout: 1_000` → isolated run yields EXACTLY 1 red (PARSE-19 only); the 4 downstream tests PASS. Before the guard the same abort produced 5. Cascade structurally killed. /tmp/red-nf-guard-check.txt. Restored 20_000 (verified line 7662).
- PROOF 1: full `pnpm agent vitest` → **956/956** (70 files). /tmp/red-nf-full2.txt.
- PROOF 2: full `pnpm agent vitest` → **956/956** two-in-a-row. /tmp/red-nf-full3.txt.
- PROOF 3: `pnpm agentct NumberField` → CT **58/58** (r19) + unit **131**. /tmp/red-nf-agentct.txt.
- Tree: 1 M (NumberField.test.tsx) + this log (untracked). No other files touched. NEVER commit (captain verifies + commits per-arc).

## VERDICT: FIXED — one load timeout + zombie cascade, not 5 flakes
- Root: PARSE-19 (2000 Intl vectors × 3 act flushes, ~4.7s isolated) exceeds the 5s default timeout under full-suite parallel CPU contention; vitest abandons it but its loop keeps running, corrupting the 4 downstream tests via focus steals / act interleaving (no afterEach cleanup in file). Membership instability = abort-timing-dependent zombie position.
- Fix: 20s per-test budget (noise source named in-comment) + signal.aborted fail-closed guard.
- Resume checklist: [ ] captain firsthand verify + commit per-arc (1M + this log) [ ] FINISH-06 full gate. Raw logs: /tmp/red-nf-*.txt (isolated/full/forced-abort/guard-check/full2/full3/agentct).

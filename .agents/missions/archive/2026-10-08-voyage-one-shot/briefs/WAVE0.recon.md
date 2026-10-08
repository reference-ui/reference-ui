# Brief — WAVE0.recon (crew: general, DeepSeek V4.1 Flash, `#high`)

Wave 0 of the one-shot startup voyage. Read
`.agents/missions/voyage-one-shot/MISSION.md` and the Oracle plan at
`.agents/missions/voyage-one-shot/reports/PLAN.oracle.md` first. This wave is
**recon only**: build the proof harness, the counts baseline, and the
byte-identity pins. **No product code changes.**

Work in `/Users/ryn/Developer/reference-ui`, branch `reference-system`. Do not
commit, push, or `git stash` (stash refs are global). Do not touch the
pre-existing untracked `pipeline/` files. Bench-lock any timed block
(`/tmp/swarm-bench-lock`; release in two steps). If `git status` shows files
you did not touch, disclose them.

## Deliverables

Use the harness at `.agents/missions/voyage-one-shot/scripts/measure-one-shot.mjs`
(both modes). Run each timed sample in a fresh process; warmups unscored;
report medians + agreement count (agent-perf §6).

1. **Baseline phase split** on `packages/reference-docs`: 8 pairs of
   `sync`-mode runs; report per-phase medians, `syncTotal`, `drainMs`. Also a
   cold arm (first process after a cache drop), disclosed separately.
2. **Module-load census** (the counts-first falsification bar). Build a
   fresh-process probe that counts module loads and **attributes them by
   package** during the docs config import (`@reference-ui/lib` and its
   graph). The Oracle predicts ~7.7k loads, dominated by the `@reference-ui`
   icons fan-out (~3,858 generated modules), and ~2 after R1. Record the
   exact method (a throwaway ESM `module.register()`/`--import` loader under
   the mission dir or `/tmp` is a valid approach; do not add a repo
   dependency). Output: total load count + per-package table.
3. **Byte-identity pins.** Capture and hash, before any change:
   - docs sync output under `packages/reference-docs/.reference-ui/`
     (manifest + CSS + `types/`, `system/`),
   - a lib self-sync (`packages/reference-lib`),
   - an icons self-sync (`packages/reference-icons`).
   Write hashes + the exact commands to
   `.agents/missions/voyage-one-shot/pins/baseline.sha256` (and a small
   `README` in that dir). These are the R1 identity bar.
4. **`MEASURE.md`** at `.agents/missions/voyage-one-shot/MEASURE.md`: phase
   split, census table, pin hashes, the harness commands, and the exact
   before-numbers R1 must beat. Include the perf-index note
   (`pnpm agentperf search startup` → 0 hits at brief time).

## Output

Write `.agents/missions/voyage-one-shot/reports/WAVE0.recon.md`, append an
entry to `.agents/missions/voyage-one-shot/WAVE0.md`, and reply with a short
summary: baseline config-phase median, census total + top packages, and the
pin file path. Flag any barrier to the census method immediately.
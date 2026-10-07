Status: LANDED — all 4 objectives verified firsthand and committed (rule in log, rs crew, neo crew, captain verify+docs)

# Seam 2026-09-25 — captain's board

HQ law: Neo diagnostics formats a known shape and nothing more. The
codes template lives in reference-rs; Neo's hand-mirror in
`src/diagnostics/codes.ts` is duplication that has already drifted
(VRS dropped from REGISTRY.md, still in all three machine lists).

## Objectives (in order)

| # | Objective | Crew | Log | Status |
| --- | --- | --- | --- | --- |
| 1 | RULE: seam boundary per-export, VRS disposition, ATM-I ruling | oracle cell | rule.md | flying |
| 2 | RS-CREW: drop VRS from code.rs + js/index.ts, prove with agentrs | rs crew | rs-crew.md | gated on 1 |
| 3 | NEO-CREW: rewire to RS surface, split hints, delete mirror, prove | neo crew | neo-crew.md | gated on 1 |
| 4 | LAND: captain verifies firsthand, commits verified arcs | captain | land.md | gated on 2+3 |

## Standing rules

- Crews never commit. Captain commits, named files only.
- RS crew: packages/reference-rs only, agent-rs skill, pnpm agentrs.
- Neo crew: packages/reference-neo only, agent-neo skill, pnpm agentneo.
- Sequential shared-checkout wave (no parallel writers, no merges).
- Deadlock test is read-only: log writes + work products. Never ping
  a working crew; intervene only on stuck crews (interrupt/rebrief/replace).

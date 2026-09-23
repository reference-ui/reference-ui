# LOG — voyage master log

Prior record archived at [docs/archive/VOYAGE-PERF-SWARM-LOG.md](./docs/archive/VOYAGE-PERF-SWARM-LOG.md).

The voyage is the mission; detail lives in the per-objective logs.
First line of each is its status.

## Objectives

- [Objective 1 — reference + tasty bridge](LOG-1.md): copy landed,
  cartography pending. Lands one commit.
- [Objective 2 — matrix chain gate + core retirement](LOG-2.md):
  briefed, audit pending. Lands one commit.
- [Objective 3 — lib sync ~650ms](LOG-3.md): probe returned, open
  investigation. Lands one commit.
- [Objective 4 — tooltip focus preset](LOG-4.md): briefed, executes
  blind from its doc. Lands one commit.
- [Objective 5 — reference lib productization](LOG-5.md): recon
  returned, blocked on Objective 4. One commit per component.

## Scoreboard

- Objective 1 guardrail: no enterprise seed-7 sync regression vs
  pre-voyage same-box median (committed pin 744ms; this box scratch
  787ms). Parity checklist TBD by cartographers.
- Objective 2: matrix audit TBD — chain suites kept, rest ported or
  dropped; core removed, icons/docs migrated.
- Objective 3: lib sync ~650ms → TBD. Target set from the breakdown.
- Objective 4: tooltip preset landed, 4 CT migrated + TT-FOCUS-03 proven.
- Objective 5: UX-signed 0 of N, one commit each.

## Where everything lives

- Brief: [VOYAGE.md](./VOYAGE.md)
- Objective logs: [LOG-1.md](./LOG-1.md) … [LOG-5.md](./LOG-5.md)
- Objective 1 source: `packages/reference-core/src/reference/` (72 files, frozen)
- Objective 1 working copy: `packages/reference-neo/src/reference/` (71 files)
- Objective 2: `matrix/`, `fixtures/`, `pipeline/` (audit),
  `packages/reference-core` (retire), `packages/reference-icons` +
  `packages/reference-docs` (migrate)
- Frontend (stays): `packages/reference-lib`

## Overnight docs hygiene (standing)

Docs cleanup runs overnight alongside objectives (user order 2026-09-22).

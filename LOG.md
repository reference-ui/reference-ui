# LOG — voyage record

Prior record archived at [docs/archive/VOYAGE-PERF-SWARM-LOG.md](./docs/archive/VOYAGE-PERF-SWARM-LOG.md).

## Mission One — reference + tasty bridge (copy landed)

Step 0 done 2026-09-22: verbatim copy
`packages/reference-core/src/reference/` →
`packages/reference-neo/src/reference/` (71 files, stale PLAN.md left
behind). Copy arrives red; cartography pending: inventory verify,
duplication verdict on `browser/` vs `browser-component/`, dead-code
list, seam design.

## Mission Two — lib sync ~650ms (briefed, probe out)

Briefed as an open investigation — no cause stated, hunch deliberately
withheld so the crew determines it independently. Probe crew
(lib-sync-probe) dispatched; its report feeds mission kickoff.
Scope: Neo sync scan, export/barrel tracking + params, scan root and
excludes, engine path.

## Scoreboard

- Mission One guardrail: no enterprise seed-7 sync regression vs
  pre-voyage same-box median (committed pin 744ms; this box scratch
  787ms). Parity checklist TBD by cartographers.
- Mission Two: lib sync ~650ms → TBD. Target set from the breakdown.

## Where everything lives

- Brief: [VOYAGE.md](./VOYAGE.md)
- Mission One source: `packages/reference-core/src/reference/` (72 files, frozen)
- Mission One working copy: `packages/reference-neo/src/reference/` (71 files)
- Frontend (stays): `packages/reference-lib`

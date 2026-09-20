# Reaper READY ask 6 — names: collision sweep

Date: 2026-09-20. Author: Reaper Phase R1 crew (read-only).
Mission: `docs/missions/operation-reaper.md` READY ask 6.

## Verdict: ZERO collisions. All three names are free.

Sweeps run on this checkout (`rg`, case-insensitive where noted):

| Name | Scope swept | Hits |
|---|---|---|
| `Operation Reaper` / `reaper` | `DOMAIN.md`, `SPEC.md`, `tests/cases/`, doom logs | **0** |
| `reaper` | all identifiers under `packages/` | 2 prose mentions, 0 identifiers: one cross-ref in `jettison-ready-04-styleplans-consumers.md:76` ("only the three mission briefs (`jettison`, `reaper`, …)"), one this-arc progress file |
| `ATM-HARVEST-06` (+ `harvest-06`, `HARVEST_06`) | `packages/`, `.agents/`, `docs/` | 1: the mission brief itself (`operation-reaper.md`) |
| `reaper-NN-*.md` / `reaper-ready-*` | `docs/evidence/` | 0 pre-existing (this arc's files are the first) |
| `harvest` case group | `tests/cases/` (rs + neo) | no `harvest` group dir; rs holds `ATM-HARVEST-01..05` only — **06 free** |
| `harvest` | neo `PLAN.md` reserved catalog | 0 — no interaction |

SPEC check: `packages/reference-rs/modules/atomic/SPEC.md` holds `ATM-HARVEST-01`
through `-05`, so `-06` is the next free ID in family. The Slice 2 case folder does
not exist yet (correct — Slice 2 is gated on D1; nothing to reserve on disk).

DOMAIN note: `packages/reference-neo/docs/DOMAIN.md` holds **no** harvest entries at
all (Jettison added the namer Vocabulary; pool/sink language was never added). No
collision in either direction — but Slice 4's R6 prose pass will be minting, not
reusing, the harvest words. Flag, not finding.

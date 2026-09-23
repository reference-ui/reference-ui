# LOG — voyage master log

Prior record archived at [docs/archive/VOYAGE-PERF-SWARM-LOG.md](./docs/archive/VOYAGE-PERF-SWARM-LOG.md).

The voyage is the mission; detail lives in the per-objective logs.
First line of each is its status.

## Objectives

- [Objective 1 — reference + tasty bridge](LOG-1.md): COMPLETE
  and landed in one commit (RS fix rides it, atomic). 26/26
  NEO-REF green, perf holds (929 vs 902.4 same-night HEAD),
  REF-10 met, seam explicit, no dead plan or duplication.
- [Objective 2 — matrix chain gate + core retirement](LOG-2.md):
  all migrations + typegen squad landed; gate-3 hermetic re-run in
  flight; landing sweep + stepped commits follow (HQ override:
  stepped checkpoints, not one commit).
- [Objective 3 — lib sync ~650ms](LOG-3.md): probe returned, research
  crew dispatched. Lands one commit.
- Objectives 4–5: MOVED to [LANDING.md](./LANDING.md) 2026-09-23
  (landing voyage; logs LOG-4/LOG-5 adopted).

## Scoreboard

- Objective 1 guardrail: HELD and landed — same-night N=5 medians
  902–929 over 6 valid runs (744 pin ruled stale-era: HEAD itself
  measured 902.4). 26/26 parity cases green, sync bytes identical,
  tasty fully off-path (REF-11).
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

## Tick 2026-09-23 — Obj1/Obj3 COMPLETE, Obj2 one gate from close, Obj4/5 under LANDING
- HQ docs-stop fulfilled: all docs crews stood down, mover landed root→docs/MISSIONS/ (root now README+AGENTS only). Mission files live at docs/MISSIONS/ from here on.
- Obj2: PACKED A+B committed (22ed06156, 8fcb16b51), PACKED-C proof accepted on captain firsthand re-runs; hermetic re-run in flight; then landing sweep + close.
- LANDING (Obj4 tooltip preset, Obj5 lib productization) undispatched — next after Obj2 close.

## Tick — Obj2 gate RED (hermetic-only css() divergence), captain diagnosing firsthand
- Obj1/Obj3 COMPLETE. Obj2: native chain proof holds (T1 7/0 now), hermetic diverges (T1 4/3) with merged sheet delivered but zero classes emitted in-container. Root-cause hunt in flight (react.mjs bundle + React 19.3.0 vs 19.2.4 + stylePropNames suspects). No commits this tick (diagnostic diffs only). LANDING still queued behind Obj2 close.

## Tick — checkpoint landed, HERMDIV diagnosing
- eeb062ae5 checkpoint committed, tree clean. HERMDIV crew running on the hermetic divergence (stylePropNames probe first). Obj1/Obj3 COMPLETE, Obj2 gated on diagnosis, LANDING queued.

## VOYAGE PARKED (HQ order 2026-09-23) — next effort is reference-neo polish
- RS proved its point (doom testing reserved for nights). Voyage paused: Obj1/Obj3 COMPLETE, Obj2 one gate out (HERMDIV interim filed in LOG-2.md). LANDING queued. Resume checklist in LOG-2.md.

## Tick — parked; PKG wave active per HQ post-park order, crew running, no action.

## Tick — parked; packager crew live with work products, survey delivered top-5, no action.

## Tick — Obj2 COMPLETE (chain gate + core retirement). Voyage: Obj1/Obj2/Obj3 done. LANDING queued, undispatched per park.

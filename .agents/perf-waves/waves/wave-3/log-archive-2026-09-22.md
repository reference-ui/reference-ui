# Wave-3 log archive (closed 2026-09-22, tip `3bc13d8a6`)

Verbatim record of the live LOG.md wave-3 section, plus wave-3 ticks.
Filings: `docs/perf/waves/wave-3/` (`report-swarm-repro3.md`,
`report-swarm-recipeproof.md`). Evidence:
`docs/evidence/flamegraph/enterprise-repro4{a,b}/`. Perf index: 84 entries
(`PERF-W3-REPRO3`, `PERF-W3-RECIPEPROOF`).

## Wave 3 — IN PROGRESS (opened 2026-09-22, tip `6f4cf1b`)

- Base-pin: `6f4cf1ba3` (RS tree == wave-2 set-5 `6c39095`; +3 commits are
  docs/skill/index/flame-evidence/bench-snapshot only, zero packages/ drift).
- Repro LANDED: swarm-repro3 RESEED (4a sync 974.67/comp 520.03,
  4b 972.65/520.09, reconciled x2; lock clean, sha unchanged).
  Evidence: `docs/evidence/flamegraph/enterprise-repro4{a,b}/`;
  filing: `docs/perf/waves/wave-3/report-swarm-repro3.md`.
- Burndown: compile −59/−56 carries the wave-2 win (−63.3 expected,
  −56/−58 flame; +8/+10 diffuse memmove offset, no caller >6);
  scan/config flat. All 24 diets mechanism-verified or sub-noise
  as filed; 26 CUTs stand; both heavy tracks dead.
- Ranked backlog = ONE topic: T1 recipepath re-proof (HELD BANK,
  room 12–17 intact; must reproduce banked −13.05 in-composition
  AND explain the +5.42/+7.80 contras, else HELD→CUT).
- Honest arithmetic: fresh ceiling ≈917 fantasy / ≈935 realistic
  SUPERSEDES repro2 ≈910. Gap to 700 ≈235+, unreachable
  single-threaded — no further serial re-seed can bridge it.
  Product/architecture decision flagged for HQ.
- Slots: T1 dispatched (swarm-recipeproof, isolated worktree, base
  `8543174`); 6 held (backlog exhausted past T1).
- T1 recipeproof CUT (HELD→CUT): in-composition −12.67/−1.34% 6/8
  (ex-run-1 −13.38 exact, pairmed −15.82) reproduces banked −13.05 —
  but three-tip sign lottery (−13.05 → +5.42/+7.80 repl → −12.67)
  vs ~1–3 ms mechanism ceiling + regime flips at every boundary =
  allocator lottery, not a stable win. Full proof (identity 4/4
  full-hash, 28/28 determinism, suites delta exactly 2 pins, q 0v/0w).
  Filing: `docs/perf/waves/wave-3/report-swarm-recipeproof.md`.
- Backlog EMPTY: T1 was the only topic; pushstring interning stays
  filler (no soundness design filed). Ceiling 917/935 stands; gap
  ~235+ unreachable serial. Wave-3 closeout next, then PARKED for HQ.
- Slots: 0/7 — all held (repro + T1 crews done, roster zero).

## Ticks (wave-3)

- Tick wave-3-open: board was EMPTY (roster zero, lock free, tip 6f4cf1b,
  claims quiet since intset5 LAND, index 82 entries). Opened wave 3,
  dispatched swarm-repro3 (isolated worktree) for fresh flames +
  burndown + re-seed; health tick armed 2x/hourly. Slots 1/7, 6 held.
- Tick repro3-landed: RESEED verified (546-line report, reconciled
  x2, lock clean) and landed as `8543174` (15 files, index 83).
  Backlog = T1 ONLY; dispatched swarm-recipeproof, 6 slots held.
  Ceiling 917/935 supersedes repro2 910; 700 unreachable serial
  by ~235+ — flagged for HQ. (This tick + slots line ride the
  next landing commit.)
- Tick T1-landed: CUT (HELD→CUT) accepted on allocator-lottery proof
  (identical-diet verified +60/−5, base-pin exact) and filed as
  `3bc13d8` (report + LOG + index 84). Backlog EMPTY.

## Closeout (2026-09-22)

All open members resolved (repro landed, recipepath CUT — nothing HELD,
nothing banked-pending). Index rebuilt (84 entries). Live wave-3 section
stubbed. No wave 4: the RS tree is unchanged since repro3's flames, so a
fresh re-profile would only re-confirm the empty backlog — re-seed requires
new filed evidence (a soundness design for pushstring interning, a new load
shape, or an HQ architecture decision), not another flame capture.
Mission PARKED: roster zero, lock free, all slots held, tick disarmed.
Resume checklist: (1) re-arm tick (`11,41 * * * *` health prompt in the
park report); (2) if new evidence lands, open wave 4 with fresh flames on
the new tip per VOYAGE §Repro; (3) base-pin then-current
`reference-system` tip.

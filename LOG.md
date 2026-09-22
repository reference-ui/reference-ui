# LOG — perf swarm record

Target: enterprise sync ≈ **700 ms**. Panda v2: 645 ms on the same
seed-7 app load (3,000 files, 7,527 css() calls). Wave-2 closed at
≈938 ms from 1198 ms (−260, 24 diets, 6 arcs).

Standing rules: single-threaded serial diets only — parallel and
multithreaded compile are BANNED by HQ, never attempted. RSS and
bundle are guardrails, never traded for sync. Honest arithmetic per
wave: repro2's ≈910 stacking ceiling stands until fresh flames say
otherwise.

## Scoreboard (enterprise medians, seed 7)

| point | sync | vs Panda sync |
| --- | --- | --- |
| Hyperspace W4 (= swarm base `1a57b1e80`) | 1.19 s | 1.84x |
| Wave 1 (`0a7330c76`) | ≈ 1.16 s | ~1.8x |
| Wave 2 set 1 (`810b8b5b4`) | ≈ 1.07 s | ~1.66x |
| Wave 2 set 2 (`0a5731681`) | ≈ 1.04 s | ~1.6x |
| Wave 2 set 3 (`3dd32a659`) | ≈ 1.00 s | ~1.55x |
| Wave 2 cloneplasma (`ddce131e7`) | ≈ 974 ms | ~1.51x |
| Wave 2 set-4 subset (`e360915f7`) | ≈ 955 ms | ~1.48x |
| Wave 2 set 5 (`6c3909506`) | ≈ 938 ms | ~1.45x |
| Target | ≈ 700 ms | ~1.1x |

## Where everything lives (wave-2 cleared 2026-09-22)

- **Perf index** (search first): `pnpm agentperf search <query>` —
  all 82 verdicts with numbers, files, and the captain's log text.
  Rebuild after new filings: `pnpm agentperf rebuild`.
- **Skill + doctrine**: `.agents/skills/agent-perf/SKILL.md`.
- **Mission plan**: `VOYAGE.md`.
- **Full wave-2 log, verbatim**: `docs/perf/waves/wave-2/log-archive-2026-09-22.md`.
- **Filings**: `docs/perf/waves/wave-2/` (reports, patches, INTEGRATEs).
- **Flames**: `docs/evidence/flamegraph/enterprise-repro*/`.

## Wave 3 — COMPLETE (closed 2026-09-22, tip `3bc13d8`)

- Result: repro RESEED + T1 CUT (HELD→CUT, allocator lottery);
  backlog EMPTY; ceiling 917/935; sync ≈938, gap ~235+ unreachable serial.
- Filings: `docs/perf/waves/wave-3/`; full record:
  `docs/perf/waves/wave-3/log-archive-2026-09-22.md` (index: 84 entries).
- Status: PARKED for HQ — roster zero, lock free, all slots held,
  tick disarmed. No wave 4 without new filed evidence (see archive).

## Ticks (empty board)

- Tick 09:20: board EMPTY (roster zero, lock free, tip 6c39095, claims quiet). Nothing to dispatch.
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
- Tick park: wave-3 CLOSED (archive + stub). Roster zero, lock free,
  all slots held, tick disarmed. Mission PARKED for HQ — no wave 4
  without new filed evidence. Resume checklist in the park report.
- Tick conn: new captain took conn (tip 4720da9, +3 since park: closeout
  + raw-index LAND + bench pin; RS + neo runtime zero-touch, pushstring
  still CUT-only, index 85). No new filed evidence — wave 4 NOT opened,
  park holds, voyage-swarm.mjs NOT launched (runner changed post-park,
  untested; slots held on proven empty backlog). Dispatched clerk-bankfile
  (paper only) for the six unfiled off-scope BANKs; tick re-armed 11,41.
  Slots 1/7, 6 held.

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
- Slots: T1 (swarm-recipeproof) briefed for dispatch on this tip;
  6 held (backlog exhausted past T1).

## Ticks (empty board)

- Tick 09:20: board EMPTY (roster zero, lock free, tip 6c39095, claims quiet). Nothing to dispatch.
- Tick wave-3-open: board was EMPTY (roster zero, lock free, tip 6f4cf1b,
  claims quiet since intset5 LAND, index 82 entries). Opened wave 3,
  dispatched swarm-repro3 (isolated worktree) for fresh flames +
  burndown + re-seed; health tick armed 2x/hourly. Slots 1/7, 6 held.

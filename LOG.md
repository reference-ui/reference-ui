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

## Wave 3 — NOT STARTED (opens with fresh flames on `6c3909506`)

(No entries yet. The next wave starts with a repro crew per VOYAGE.md.)

## Ticks (empty board)

- Tick 09:20: board EMPTY (roster zero, lock free, tip 6c39095, claims quiet). Nothing to dispatch.

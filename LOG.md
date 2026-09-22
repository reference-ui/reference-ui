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

## Bankfile (off-scope MCP filings, clerk-bankfile verdicts)

Clerk-bankfile inventoried the six unfiled off-scope BANKs from the
post-park 14-lever MCP icons-search swarm (21 dead worktrees at
1e1ad31d9 + claims + /tmp asides; REPORT archived as
report-clerk-bankfile.md). Verdict 2-FILED-READY 4-PARTIAL 0-LOST.
Captain adjudication: the six are accepted as the filing set (clerk
inference — no source names them; substitutes weaker: verbose-cache
has zero outputs, desc-drop is identity-suspect, dedupe-indexed-fields
and exact-first are identity-barred). Filed as 2 BANK + 4 MEMO, plus
the 2 posted CUTs; remainder examined-not-filed with reasons in the
clerk REPORT. Captain spot-verified firsthand: all 8 diet diffs in
place, both sha1 identity pairs exact, catpost baseline 42 keys
(793761 B as read; clerk byte figure differed, keys exact). All diet
patches are vs 1e1ad31d9 — rebase needed against the tip rawindex
LAND (same file). Evidence archived under evidence/ (4.0M); the 21
swarm worktrees kept pending cleanup.

- swarm-catpost BANK (off-scope MCP search({category}) browse):
  prebuilt category postings skip the MiniSearch wildcard; browse
  0.374 ms -> 0.002 ms (-99.5%) 8/8 agree, identity 42/42, suites
  12/12 as filed in claims (crew parked mid-flight, no surviving
  REPORT). A-variant patch canonical, B unadjudicated. Landing needs
  integrator re-proof + captain firsthand.
- swarm-prelower BANK (off-scope MCP icons filter path): lowercase
  stored categories once at load, hot filters go alloc-free; lowers
  4978/549 -> 1/4, browse 0.41 ms -> 0.36 ms, before-x3 + after-x2
  (NOT 8-pair — deviation disclosed in the report). Landing needs
  full 8-pair + integrator re-proof.
- swarm-reusesearchopts CUT (lottery): options-object reuse, no
  stable win under interleaved A/B x2 + lottery control; identity
  sha match. Closed.
- swarm-prebuiltcats CUT (sub-floor): ctor walk+sort hoist saves
  0.26 ms one-time vs ~73 ms ctor; below LAND bar and 5 ms floor.
  Closed.

## Compile closeout (certified, base c593829d3 — HQ-ordered, pre-scan-voyage)

Bank reconciliation, all 25 bank-verdict entries, firsthand: 20 landed
via sets 1–5 + cloneplasma (every one a reference-rs compile path);
AUTHCSS yielded-subsumed into landed cloneplasma (race rule);
RECIPEPATH HELD→CUT (allocator lottery, PERF-W3-RECIPEPROOF);
SCALARJSON superseded by landed SCALARREPROOF (set-4; original −14.59
carried crew noise disclaimer, patch retained as record); CATPOST +
PRELOWER pending deliberately (off-scope MCP, 0 sync ms — landing
gated on integrator + HQ scope decision). Unexplained-pending on sync
ground: ZERO. No integrator — member set empty. Improvement left on
the table in banked compile work: 0 ms by receipt. Seam scout
dispatched as the last unscouted compile room (counts-first, no
diets); scan voyage opens separately after closeout lands.

## Wave 4 — IN PROGRESS (scan frontier, HQ-ordered)

- HQ order: close compile (done — see Compile closeout), then scan as
  a separate voyage; scan + seam-gap streams in parallel until further
  notice, one hypothesis per crew, same tools, independent measurements.
- Scope correction: wave-3 "backlog EMPTY / nothing pending" verdicts
  were COMPILE-ground only. Scan (~368 ms, ~38% of sync) has zero
  diets, zero ranked rooms — never scouted. History stands; this entry
  scopes it. Nothing "done" claims scan.
- Base-pin: b8a75b0bd (full b8a75b0bd74c72a72a2c6fe338ca8026088b5afe).
  Target sketch per HQ: ~30% off — denominator unnamed; the 700 ms
  voyage BAR is UNCHANGED until HQ names a number.
- Stream 1 (scan): scan-recon4 dispatched (isolated) — fresh flames on
  tip + exact scan census + ranked backlog. No diets until backlog files.
- Stream 2 (seam gap): seam-scout running (closeout dispatch).
- Slots: 2/7, 5 held — backlog empty pending recon verdicts (this entry
  is the proof). Full complement on ranked backlog per Model.

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
- Tick bankfile: clerk-bankfile verdict FILED (2 FILED-READY 4 PARTIAL
  0-LOST, REPORT consumed) — landed this commit: 8 reports/memos +
  8 patches + evidence 4.0M + LOG + index 85->93 (BANK +2, MEMO +4,
  CUT +2). Roster zero, lock free, park holds (RS zero-touch, no new
  sync evidence). Clerk worktree released; 21 swarm worktrees kept
  pending cleanup. Slots 0/7, all held.
- Tick parked: board EMPTY (roster zero, lock free, tip b7c7bee8e,
  claims quiet since clerk FINISH, index 93). Park holds, RS
  zero-touch, no new sync evidence. Nothing to dispatch.

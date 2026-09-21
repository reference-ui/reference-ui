# Voyage log — Hyperspace Run

The captain's wave record: merges, bench deltas, decisions, what rode
forward, what died. Crews write in the perf log; this file is the
captain's alone and lives only on the main line, never in a worktree.

HQ 2026-09-20 ~23:49: red team cancelled. Performance-only waves from
the amended brief. Objective 1 (Reaper) stays COMPLETE below; do not
reopen it.

## Wave 0 — voyage base

- Base HEAD `c17d71712` verified: brief + both stubs + Fasthull doc +
  missions README row all committed, tree clean. Waves cut from here.
- Runner smoke (22:30): `agent status` PRI 46 jailbroken, queue idle;
  `agentneo list` answers; `agentrs --help` answers, cpu-gate idle;
  `bench:neo --list` answers (small/medium/enterprise, churn opt-in).
- Flag: Docker runtime INACTIVE — no hermetic Dagger matrix tonight.
  All verification is native (agent/agentrs/agentneo/bench runners).
- Health ticks ride the captain's wait loop (no cron second-captain).
  HQ pushes in the morning; nothing pushes unasked.

## Objective 1 — Operation Reaper

### R1 arc (READY asks 1–7 + GO flip) — VERIFIED, committed
- Jettison: map GONE firsthand (stylePlans 0/0/0, schema 2, namer v6
  both sides), acceptance PENDS (Doom seed unrun, R1–R15 open).
  Slice 1 NOT BLOCKED — nothing needs Jettison beyond the react.mjs
  cell, and that cell is fillable now (re-verify after acceptance).
- Asks: 01 fixture shape (~29 sinks, ~320–380 pool, folder + reader
  plan), 02 census tooling (sink backchannel + Rust test reader, no
  API change), 03 leaf/unbound bound (|P−L| exact, |P∩L| upper),
  04 CSSOM harness (Jettison probe reuses + css-tree in tree),
  05 model check 20/20 byte-exact, 4 recipe pins, NO table fix,
  06 names zero collisions (ATM-HARVEST-06 free), 07 sequencing.
- Sheet survives cutover to the byte: 242,953 raw / 32,046 gzip,
  verified firsthand on this checkout. GO flip is exactly line 1.
- Handoff: Slice 1 cooks from ready-01 (fixture + lists) and
  ready-02 (two readers); react.mjs cell carries the re-verify
  caveat; gap/offset/size stay out of fixture holes.
- HQ DIRECTIVE (mid-R2): codename 'reaper' stays OUT of
  reference-rs — code/test files use domain language. R2 crew
  rebriefed: harvest-enterprise/, harvest_pool.rs,
  harvest-census.test.ts, harvest-model.ts, temp NEO-TMP-HARVEST.
  Evidence md keeps reaper-* (mission-record convention); R1 path
  refs corrected inside the R2 arc. Mission-file reaper-* code
  paths overridden, deviation recorded in reaper-01.

### Slice 1 arc (real-compile census) — VERIFIED, committed
- Fixture harvest-enterprise: 32 sinks × 340 pool → **4,938
  classes** (4,803 harvest + 135 static). styles.css **341,037 /
  41,496 / 21,057** (69.1 B/class, between M300/M500); react.mjs
  **148,379 / 32,543** (re-verify after Jettison acceptance).
  Triple (|P−L|,|P∩L|,|P|) = **(207,133,340)**; prize bracket for
  D1: **180–1,645 classes** on the sheet.
- Readers: harvest_pool.rs (cargo, pool+census JSON, deterministic
  sha-verified) + harvest-census.test.ts (vitest 4/4: M-cells,
  sink census, triple, bytes, css-tree timing) + harvest-model.ts
  (14 cells pinned). Parse: fixture ~10ms / M500 ~54–66ms both
  sides. Temp world deleted + scrubbed, zero residue.
- Doctrine corrections: null holes do NOT sink (Null want;
  ready-01 SEAM-07 precedent misread — corrected in reaper-01
  Surprises, ready-01 left as-laid beyond path fixes); keyframe
  counting splits css-tree/CSSOM by exactly 70 (style-rules-only
  both sides); when-copies hold under real pool.
- Gates firsthand: cargo atomic FULL green, vitest atomic FULL
  green, q clean on all 3 readers, zero reaper tokens in rs,
  R1 diffs path-only. Additive arc; no prod code touched.
- FLAG (out-of-arc, pre-existing): virtualrs cases.test.ts 10/17
  golden failures red on this tree, module untouched by Reaper.
  Needs a ruling in the waves (repin vs break) — not Reaper's.
- Handoff: D1 consult rules against reaper-01 numbers next.

### D1 ruling (architect consult) — DECLINE, VERIFIED, committed
- D1: DECLINE. (a) FAILS: forensics collapse the prize to the
  180-class floor (3.6% / ~12KB raw / ~1.5KB gzip / ~0.4ms) —
  123/133 ambiguous values provably unbound, only the 10 px
  truly leaf-only; fixture engineered to contain leaf-only and
  still yields 3.6%, real pools run smaller, planning numbers
  don't move. (b) HOLDS narrowly (breakage confined to the named
  #00aeff rule + twin-key axes). Both-prong rule → DECLINE.
- Verified firsthand: px isolated to components/, shared hexes
  unbound-occurring, all four doctrine wordings verbatim,
  arithmetic holds, nothing authorized, Slice 2 undispatched.
- Decline is a finished outcome. No Slice 2, no bench pins (the
  pin-to-pin verification was Slice 2's). HQ ratifies in the
  morning; override inherits the mission boundary + 180-class
  re-measure tripwire. Missions README row updated to match.

## Objective 1 — COMPLETE (R1 + Slice 1 + D1-DECLINE, all committed)

## Wave 1 — recon dispatched (captain's record)

- Recon tree `../reference-ui-recon-1` cut from `9be177371`
  (branch `voyage/hyperspace-recon-1`); recon lead crew dispatched,
  read-only contract, map → `fasthull-recon-1.md` + perf-log entry.
- Liveness 00:12Z: lead + 3 nested workers writing; enterprise
  bench re-run byte-identical to pin; firsthand counts already
  filed (recipes 83% of css, recipe tables 98% of runtime-data).
  No deadlock. Captain holding conn on read-only evidence.
- HQ guidance (~00:15Z): targets are RSS + bundle + sync wall;
  crews are authorized to build deeper visibility (burndown of
  the Rust native compile, time/RSS attribution tooling) alongside
  recon-led bundle work. Captain's ruling: an observability/tooling
  lane rides the Wave 1 perf wave as an extra disjoint lane (new
  harness files only) — held until recon files so its timed runs
  keep a quiet box. Benchmark skill baselines already pinned to
  `5eda2c60b7e5` firsthand.
- Recon rotation 1 DIED (~00:3xZ): provider net-timeout on the
  model stream (runtime terminal `failed`, non-crew cause).
  Surviving work: 3 perf-log entries (lead bench + recipe counts,
  workers A/B terse LIVE verdicts S1–S5); worker C + map unwritten.
  Replacement lead (recon-1b) dispatched on the same tree/branch
  with resume brief: reproduce A/B evidence firsthand, complete
  bundle leg, file `fasthull-recon-1.md` + perf-log entry.
- Recon-1b COMPLETE: all 7 suspects LIVE with fresh firsthand
  evidence, zero product edits. Map + perf-log entry landed on
  main (commits `1142ee39`, `4b393c69`); `reports/latest/`
  churn excluded from the landing per bench policy.
- FLAG: uncommitted `docs/missions/{README,operation-fasthull}.md`
  edits on main (mtime 22:57:25Z, both files same second) —
  provenance NOT mine, NOT any crew's (no edit/write/bash call
  in any crew log or my own). Content aligns with HQ's all-three
  guidance, but authorship unproven: LEFT UNTOUCHED and
  uncommitted per git skill + never-touch-another-session rule.
  Wave trees cut WITHOUT them. HQ to ratify or revert.
- Wave 1 perf wave cut from `4b393c69`, 5 trees/crews: (a) cold
  payload A1+A2, (b) dead-file fast path A3+A4+A5+A8 (harvest
  fence), (c) recipe sheet A6b+A9 (A6a rides W2), (d) recipe
  tables A7, (e) deepsee burndown/attribution tooling (HQ lane,
  new files only). Guardrail: no lane regresses the other two
  beyond noise (brief rendezvous rule); crews briefed from HQ's
  chat guidance, not the mystery edits.

## Wave 1 — CLOSED (4 landed, 1 killed, all committed)

- Rendezvous order (independent first): e → b → a → d, then c
  log-only. All terminal lines verified in-tree before merging.
  Merge conflicts: none materialized — D's 5 overlapping files
  3-way-merged clean (exit 0, no markers; both arcs verified
  present in merged types). One merge-time fix: reviewer's
  wart-note, `stylePlans` → optional in `atomic/js/types.ts`
  (matches comment + contracts + proof-channel siblings;
  typechecks, zero behavior).
- Firsthand gates per merge on main (all green): cargo atomic
  (509→510→511 as arcs stacked), vitest atomic 299–300/300,
  styletrace 28/28, contracts 13/13, agentneo 173/173,
  `agentrs q` 11 files clean, full `bench:neo` + `--scale churn`
  with a pristine-tree base comparison. ATM-SITE-54, claimed
  "pre-existing" by three lanes, never reproduced on main
  (shared-box flake in lane trees; not chased).
- Enterprise progression (main line, locked load): pin
  3.51s/796MiB → post-E 3.46/822 (noise, tooling) → post-B
  2.86/744.6 → post-A 2.57/695.1 → post-D 2.46/670.9.
  Final vs pin `5eda2c60b7e5`: sync −30%, RSS −16%,
  css 14.3 MiB IDENTICAL (825.0 KiB gzip), data 3.9 MiB →
  518.2 KiB (−87%, 42.6 KiB gzip). Small: 150→126ms,
  121.8→118.4 MiB, data −59%. Medium: 461→352ms,
  207.6→192.0 MiB, data −79%. Churn: 5.12→4.19s,
  987.1→611.6 MiB, css identical, data 386.3→143.2 KiB.
- Vs Panda goalpost (enterprise): sync 2.46s vs 645ms (3.8x),
  RSS 671 vs 261 MiB (2.6x), css 14.3 vs 2.7 MiB (5.3x —
  the A6a observed-use gating still open), data 518 KiB
  (internal −87%; Panda 71 KiB JS not comparable per notes).
- Spent: A1, A2, A3, A4, A5, A7, A8, A9. Died: A6(b)
  grouping (0 order-safe sites, gzip-positive — three-agent
  agreement, no diff). Rode to W2: A6(a) observed-use gating
  (extract signal now unblocked by lane b), A10 (morning
  question at best).
- NO hash-pin commits this wave: main tree cannot be clean
  while the mystery `docs/missions` edits sit uncommitted
  (still untouched, still unproven — HQ to ratify/revert).
  All numbers above are firsthand main-line medians recorded
  here instead. Deepsee (`benchmark/deepsee/`, one command)
  is now the standing burndown tool for W2 recon.

## Wave 2 — recon COMPLETE, perf wave dispatched

- Fresh oracle crew filed `fasthull-recon-2.md` (5 avenues) +
  perf-log entry, zero product edits. Headline: css gap fully
  explained in-bounds (B1 observed-use gating + dead shake →
  ~2.5-2.7 MiB, ≈ Panda); no architectural-copy morning
  question. Post-W1 burndown firsthand: assembly 612ms
  (fattest native phase), publish 242ms, slim codec ~390ms
  (self-shrinks under B1), 511 MiB arena-physics floor stands.
  Killed/deferred with floor bounds: utilities 2.18 MiB
  (deduped floor), prepare 345ms (parallelism-only), codec
  (ship-one-sheet OOB), constants/ValueGraph gating (needs
  soundness ruling — W3/spike). Morning Q4 (deepsee waitReady
  hang) attached to lane c as a fenced ride-along.
- Wave cut from `59e6836dd`, 4 trees/crews: (a) observed
  recipe emission B1 (architect rules strict-vs-closed +
  fixture call-sites BEFORE impl — determinative 3.4 vs
  11.3 MiB); (b) dead product B3→B5 (fence-proof first,
  then reshape); (c) publish once B2 (+ deepsee wart
  ride-along); (d) trace gate B4 (fully disjoint).
  Rendezvous order: d → c → b → a. Churn: a + b run;
  c/d skip only with architect rationale.

## Wave 2 — CLOSED (3 landed, 1 GAPS riding W3, all committed)

- Rendezvous order: c → b → a (d GAPS, no merge). Lanes c/b/a
  all VERIFIED with terminal lines checked in-tree. Merge
  conflicts: system.ts (c-logic + b-mirror) 3-way clean;
  A's 5 overlaps 3-way clean except assembly.rs + lib.rs,
  whose 3 conflicts were adjacent-additions (proof + selections
  fields) — kept both sides, mechanical, verified by build.
  Two merge-integration fixes (captain, both arcs' intent
  preserved): selection_tests.rs requests `logs: proof`
  (B3 gates top-level tables A's tests read); RECIPE-09 spec
  reads `qualifiedName` (B5 dropped `className`).
- Firsthand gates per merge on main (all green): cargo atomic
  511→533, vitest atomic 300-301/301, styletrace 28/28 (c),
  contracts 13/13, agentneo 173/173 (closes A's
  pre-refactor-binary review debt), agentrs q 0 violations,
  agentneo q 0 errors (2 pre-existing burndown warns),
  full bench:neo + churn with base comparisons. SITE-54
  "pre-existing" claims (5 lanes over 2 waves) have NEVER
  reproduced on main — shared-box flake; W3 briefs ban
  stash-proving it (both stash races came from those cycles).
- Enterprise progression: W2-start 2.46s/670.9MiB →
  post-C 2.34/564.8 (bytes identical) → post-B 2.27/570.3
  (data −40%) → post-A 1.66/308.3 (css →2.7MiB). Final vs
  pin `5eda2c60b7e5`: sync −53%, RSS −61%, css 14.3→2.7 MiB
  (−81%, 825.0→264.2 KiB gzip), data 3.9MiB→311.2 KiB (−92%,
  42.6→26.6 gzip). Small: 150→97ms, 121.8→108.5MiB, css
  538.0→90.5KiB. Medium: 461→209ms, 207.6→130.6MiB, css
  2.4MiB→340.6KiB. Churn: 5.12→3.98s, 987.1→526.8MiB, css
  8.3→7.9MiB (responsive vanishes per strict hypothesis),
  data 386.3→110.3KiB.
- Vs Panda goalpost (enterprise): sync 1.66s vs 645ms (2.6x),
  RSS 308 vs 261 MiB (1.18x), css 2.7 MiB AT PARITY raw
  (gzip 264.2 vs 278.8 KiB — SMALLER). Data 311 KiB
  (internal −92%; Panda JS not comparable).
- Spent: B1, B2, B3 (REDUCED — plan-gating tripwire-killed,
  12/243 render_session deltas; css/recipes/wants gating
  landed), B5. Rides W3: B4 (GAPS — perf proven −130ms
  no-overlap, selection sound; SITE-57 parse-failure
  isolation station needs out-of-boundary plumbing or
  renegotiation; diff preserved on voyage/hyperspace-perf-2-d
  as GAPS-PRESERVED, log entry on main).
- INCIDENT #2 (~02:36, pre-broadcast): C reviewer's stash pop
  consumed D's stash. D recovered byte-identical from
  dangling 0566fae4 (verified by cmp); zero loss. Both races
  predate the no-stash order; no bare stash since.
- INTERVENTION (~02:55): A tree formatter-blasted (211 files,
  cause: lead ran `pnpm agentrs f` = whole-workspace format).
  Rebrief queued; crew repaired to 25 in-boundary files,
  VERIFIED after. Standing caution for W3 briefs: never run
  `agentrs f` (or any repo-wide formatter) in a lane tree.
- NO hash-pin commits (mystery docs/missions edits still
  uncommitted + untouched — HQ to ratify/revert). Numbers
  above are firsthand quiet-box medians.

## HQ amendment (morning, Wave 3 rendezvous in flight)

- HQ: RSS and bundle ARE home. From here: speed (sync wall)
  is the frontier; RSS/bundle are held "more or less the
  same" — guardrails, not targets. Standing orders updated:
  (1) lane A's +25~45MB scored-RSS flag gets a quiet-box
  firsthand verdict before landing — a real regression of
  that size fails the merge under the new rule; GC-noise
  (spike-proven ±) does not block; (2) Wave 4 recon briefs
  sync-only lanes with RSS/bundle defended (no-growth);
  (3) rendezvous revert rule unchanged, now HQ-backed.

## Wave 3 — recon COMPLETE, perf wave dispatched

- Fresh oracle crew filed `fasthull-recon-3.md` (5 avenues +
  spike) + perf-log entry, zero product edits. Headline:
  burndown buckets lied in two places (serde≈file IO ~294ms,
  assembly⊃resolver ladder ~90ms — both firsthand-verified);
  corrected frontier: native re-read (~294ms), prepare
  serial reads (~100-150 of 341), trace path (B4 + keep-alive
  ruling, −130 proven), ladder probes (~109ms), assembly
  second-resolve (≤~100, prove-first). Codec spent (~15ms
  true — ex-morning-Q1 ship-one-sheet RETIRED). CSS defended
  DONE (gate exact, slack 0). Scored RSS (308) = end-state +
  allocator-resident, not the 397 true peak — last mile is a
  time-boxed spike, else a morning question (allocator
  strategy is product architecture).
- Captain's rulings: 6 crews cut (spike is time-boxed, won't
  pace the wave); deepsee attribution fix rides lane d as
  fenced step-0 (W2c precedent — captain doesn't implement);
  any css regrowth fails its arc on sight.
- Wave cut from `d1b0e0549`: (a) single read C3 (architect
  rules 4 homework BEFORE steps 2-3); (b) trace wall C1
  (GAPS diff seeded + keep-alive + SourceType align);
  (c) ladder memo C2 (quantify in-lane, no double-claim);
  (d) assembly resolve C4 (timers first, ≥30ms gate else
  fast kill); (e) data reshape C5 (E2E recompute proof);
  (s1) end-state retention spike (kill-fast ≤10MB scored,
  memo always lands). Rendezvous order: c → b → a → d → e
  (+ spike memo). Churn: all 5 lanes RUN. Standing cautions
  in every brief: no `agentrs f`, no bare stash, no
  SITE-54 stash-proving, css defended.
- Lane B rotation 1 DEAD (unresponsive, not a crash): 23+ min
  silence, heartbeat order ignored, reviewer's GAPS verdict
  (checks 1/2/3/5 PASS, check 4 FAILS: missing post artifacts
  + medium bytes contradiction) delivered but never processed;
  task terminal with no terminal line filed. Tree verified
  intact (exactly the 9 allowed paths). Recovery rotation
  briefed — first spawn REJECTED (root 8/8 full); lane E's
  completion freed a slot and rotation b2 dispatched with
  adjudication brief (reviewer GAPS check-4 firsthand).

## Wave 3 — CLOSED (4 landed + tooling, 1 GAPS riding W4, spike died, all committed)

- Rendezvous order: c → b → a → e (+ d log-only, spike memo,
  d ride-along tooling). C/B merged BEFORE A filed (captain's
  error — early rendezvous; no harm: A independent, merged
  later via clean 3-way; rule re-asserted: no merge without
  a terminal line, no close until all filed).
- Lane A: VERIFIED with scored-RSS flag (+25~45MB). Adjudicated
  LAND on quiet-box evidence: base-tree enterprise ×3 RSS
  328.9/357.5/335.2 (med 335.2, spread 29) vs merged
  340.1/363.1/367.5 (med 363.1) — overlapping bands; code
  read proves the retained bytes UNREACHABLE post-compile
  (explicit `scannedSources = []` + `files = undefined`,
  "RSS relief" comment) → GC-timing class per spike S1,
  ungameable by design; small/med RSS flat. Sync −210ms
  tight (1.30×3). Bundle identical. Verdict: +28 of garbage
  for −13% wall = within HQ's "more or less the same".
  W4 RSS lead owns the follow-up (request.files streaming
  to avoid the retained array — structural, not gaming).
- Merge-integration fix (1): lib.rs keep-alive `failed` vec
  derived from retained-only `parsed` but indexed per-source
  (A×B composition) → SITE-57's 0 warnings. Fixed per-source
  via slots+transient.errors (provably same semantics,
  extended to streamed). 301/301 + 173/173 after.
- Firsthand gates per merge (all green): cargo atomic
  533→548, styletrace 42→48, vitest atomic 301/301, neo unit
  236/236, agentneo 173/173, contracts 13/13, q 0 violations
  (RS warns + neo clean), full bench + churn with base-tree
  comparisons. Barrel-test 1-in-8 transient: CONFIRMED
  pre-existing ScratchWorkspace nanos-collision + Drop-rmdir
  race (test harness, not product; fix = atomic counter —
  morning note, out of voyage bounds).
- Enterprise progression (quiet medians): W3-start 2.46/670.9
  → post-C 1.55/333.3 → post-B 1.51/325.9 → post-A 1.30/363.1
  → final 1.31/344.5. Final vs pin `5eda2c60b7e5`: sync
  −63%, RSS −57%, css 14.3→2.7 MiB (gzip 825.0→264.2),
  data 3.9MiB→209.4 KiB (−95%, gzip 42.6→21.6). Small:
  150→92ms, 121.8→106.9MiB, css 538.0→90.5KiB. Medium:
  461→182ms, 207.6→128.5MiB, css 2.4MiB→340.6KiB. Churn:
  5.12→2.96s, RSS 527-604 band (GC noise), css identical,
  data 386.3→101.3KiB.
- Vs Panda goalpost: small sync 5.1x (RSS BETTER than Panda),
  medium 2.7x (RSS better), enterprise sync 2.0x (1.31 vs
  .645), RSS 1.32x (344.5 vs 261.2), css raw PARITY (gzip
  smaller), total bundle 2.9 vs 2.8 MiB.
- Spent: C1, C2, C3, C5. GAPS→W4: C4 (hypothesis TRUE, −26ms
  8/8, but memo churn-breaches +106ms/+65MiB structural;
  diff on voyage/hyperspace-perf-3-d; sample-parse ride-along
  VERIFIED-separable and LANDED). Died: S1 (V8 end-state
  GC-only, allocator unverifiable in spread; memo landed).
  B-r1 postscript: woke 2.5h later (runtime scheduling gap,
  not crew failure), withdrew stale GAPS, re-confirmed bytes
  12/12 — b2's VERIFIED doubly-held. Replacement was correct.
- W3 RSS adjudication method (standing): base-tree ×3 vs
  merged ×3 on quiet box + mechanism read
  (reachable-vs-unreachable). Single-sample RSS deltas are
  not evidence (3 GC-outlier scares this wave: 308, 527, 552).
- INCIDENT (~02:39): stash race across worktrees. Lane B
  implementer's SITE-54 stash-prove `pop` grabbed lane C's
  stash entry (034f04: burndown.ts + 4 publish files) into
  B's tree and dropped C's ref — stash refs are repo-shared
  across worktrees. B self-repaired same-entry: C files
  reverted from B's tree (byte-verified), C's entry restored
  via `stash store`, B's own 14 B3 files recovered byte-exact
  from dangling bad081eb. Captain verified firsthand: C tree
  holds all 5 files modified (work intact), B tree holds B3
  files only, stash list back to 2 pre-voyage entries.
  Standing order broadcast to all W2 leads: no bare `git
  stash push/pop` tonight — /tmp captures or scratch
  branches for pre/post proof. Rendezvous addition: captain
  greps each lane tree for sibling markers before merging.
  (Marker caveat, verified: `wants_proof` occurs 2x in
  committed `native.rs` — W1 lane A's proof channel, part of
  the wave base — and in no uncommitted diff outside B.)
- INTERVENTION (~02:55): lane A tree found with 211 modified
  files (formatter reflow blast across namer/diagnostics/
  atlas/typegen) vs its 7-file B1 boundary, after 14 min of
  log silence. Real B1 work verified intact (selection.rs +
  assembly.rs RecipeInputs join). Genuine-intervention
  rebrief queued to the lead: find/kill the formatter cause,
  revert all non-boundary files, keep B1-hunks-only in
  boundary files (target ≤10), heartbeat the repair, resume.
  (Note: `interrupt:true` rejected by the message tool —
  rebrief queued without interrupt; crews poll between steps.)

## Wave 4 dispatch — 5 crews (11:0x UTC)
- Map landed: c84dd4d7a. Trees: ../reference-ui-perf-4-{a,b,c,d,r}, branches voyage/hyperspace-perf-4-{a,b,c,d,r}.
- perf-4-a (D1 want locations, lazy line index, ~35ms, mechanical) → agent 22
- perf-4-b (D2 plan verdicts, TIERED A-always/B-gated + 243-sweep, ~50-110ms) → agent 23
- perf-4-c (D3 union trust, files_complete (a) / file_type (c) fallback) → agent 24
- perf-4-d (D4 resolver unstage gated, kill-fast <60%) → agent 25
- hunter-4-r (R1 chunked napi handoff, standing-method, ≥10MB) → agent 26
- Merge order: a → d → c → b → r. Zero bundle lanes per HQ decree.

## Wave 4, lane c MERGED — 97744dfd6 (out of order: files disjoint from a/d)
- Landed: sources.rs (c) file_type fallback ONLY; (a) files_complete dead on firsthand extglob counterexample (flag would set, union would empty — native-hit ⊆ TS-retention false) + races. No TS touched → R1 sync/index.ts flag EVAPORATED; merge flags none.
- Claim: ~40ms typical enterprise sync (pooled med −60ms, 8/9 same-sign, both orders). Bytes exact every leg, RSS held (overlapping bands), churn holds.
- Captain gate: diff reviewed firsthand (d_type + is_dir fallback both walks + unix symlink pin test, in-boundary); md5 identical to lane tree (ee7d5ee9); agentrs q 0 violations (1 soft file-length notice, 405 lines).
- DEFERRED to wave-close gate (box shared w/ 4 benching sibs): cargo + agentneo + bench re-proof on main.
- Note: main tree carries pre-existing unstaged dirt (docs/missions/README.md, operation-fasthull.md, reports/latest/*) — not captain's, left untouched.
- Still in flight: perf-4-a, perf-4-b, perf-4-d, hunter-4-r.

## Wave 4, lane a MERGED — fef84ee34
- Landed: 5 RS files (diagnostics/mod.rs, diagnostics/site.rs LineIndex + fuzz, object/mod.rs, walk/mod.rs, extract/mod.rs ensure_line_index). Architect correction to recon: index owned by ExtractContext (per-file), not ExpressionWalk (per-property rebuild).
- Piggyback discipline: render-path catalog built, measured (+9 RSS, retained HashMap in peak window), DROPPED. render.rs untouched → D2 merge flag never existed.
- Claim: ~29ms typical ent sync (pooled 11/13, med −29ms, independent reviewer round incl.). Bytes exact 26+ runs all scales + churn; RSS medians identical (355/356); churn −30ms/−11MiB.
- Captain gate: full diff reviewed firsthand (binary-search line math + fuzz pin verified by read); md5 identical; agentrs q 0 violations (3 warns, pre-existing kinds per lane).
- DEFERRED to wave-close gate: cargo + agentneo + bench re-proof on main (shared box).
- Still in flight: perf-4-b, perf-4-d, hunter-4-r.

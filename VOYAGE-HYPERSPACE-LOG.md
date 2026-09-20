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

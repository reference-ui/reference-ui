# Operation Flamegraph — Recon Report v2 (C-Obj 6)

Wave 5 sighted map, corrected. Synthesis only: no implementation, no
speedups, no instrument changes. Every number cites filed evidence
(path + procedure); gaps are stated in §9.

**Supersedes** `docs/missions/completed/operation-flamegraph-recon.md`
(v1), which is preserved unedited. §5 ledgers every withdrawn v1
claim; v1 numbers appear only as struck context beside their
corrections. Produced by Operation Flamegraph Correct, C-Obj 6
(log: `docs/missions/flamegraph-correct-logs/cobj6-reconv2.md`).

**Verdict.** The Wave 4 close ("past ~1.0s is architecture or
out-of-bounds") is PARTLY confirmed and partly withdrawn.
Confirmed by corrected measurement: realloc-volume waste ~2–4% of
sync (now with per-compiler-phase targets), the dead-file structural
prize (~194ms, ~16% of sync), zero in-window full GCs, and a 100%
top-thread window with exact birth/death attribution. WITHDRAWN: the
hard ≤12% compute cap, the stop-optimizing rule, and the width logic
behind them — the compute room has no measured ceiling, so the floor
map is no longer claimed complete. **Recommendation: sequenced mix,
architecture-led** — three sharpened kill-fast probes first (§7,
Phase A), then commit Wave 5 to whichever structural lane survives;
if none survive, re-scope rather than grind (§7, Phase B — there is
deliberately no stop rule).

## 1. Evidence base

Locked load throughout: enterprise, 3000 style + 12000 dead files,
7527 css() calls, 120 recipes, seed 7, release `.node`. The one-binary
chain now spans the alloc3 rebuild (bar note below): flame and
counters legs measured `5ac6c07e…`, alloc3 measured `393afb0a…`,
bridged by the zero-code-bytes proof.

| Leg | Instrument (procedure) | Evidence | Headline |
| --- | --- | --- | --- |
| flame | samply flame, `agentrs-flame/3` | `docs/evidence/flamegraph/enterprise-flame3/` | 1329 main samples (weight 1349); kernel 30.9% / .node 24.9% / malloc 19.4% / node 11.9% / platform 9.8% / JS 2.3%; `__open` 18.6%; top .node self `resolve_alias` 23 (1.7%), incl 33. Worker syncMs 1230.2. |
| flame | resummarized v1 profile, `agentrs-flame/2` | `docs/evidence/flamegraph/enterprise-flame2/` | 1347 samples (weight 1368); `resolve_alias` 26 self (1.9%) / 43 incl — the reviewer's 26, confirmed; `__open` 17.8%; .node 26.5%; JS 1.6%. |
| alloc | GC census + Rust alloc span + compiler phases, `agentrs-alloc/3` | `docs/evidence/alloc/enterprise-alloc3/` | 14sc/2mc whole-run, **0 in-window full GCs** (PASS: 1 head + 1 tail); span 946.6 MB alloc / 938.6 freed / 8.26M blocks / 1,117,430 reallocs / 152.2 MB peak = **~65% of HW sync-added RSS** (152.2/235.5); 12 per-phase rows; scorer `bench-worker/2` HW on both legs. |
| counters | HW counters + libc census, `agentrs-counters/3` | `docs/evidence/counters/enterprise-counters3/` | Window 740.0ms (user 647.8 + sys 92.0 = wall to 0.2ms); **9.539B instr, IPC 2.36**, no stall field; 14,750 unix syscalls; 55.6k minflt + 0 maj + 0 pageins (warm); 11/11 threads, 0 born / 0 died, top-thread 100%, unattributed 1µs. Census net: 15,409 opens @15.87µs = 244.5ms; 30,530 reads + 439 preads; close/open balanced. |
| phases | same-run join, `agentrs-phases/1` | `docs/evidence/phases/enterprise-phases1b/` | Canonical sync ≈ 1230.1 = config 30.6 + scan 364.3 + evaluate 6.2 + compile 780.3 + publish 48.7; startup 118.1 outside sync; marshal delta 28.5 (counters) / 28.8 (alloc). Rejoin of flame3+counters3+alloc3; 5/5 legs RECONCILED. |
| criterion | benches, 8 targets / 46 cases / 9 functions | bench sources in `packages/reference-rs/modules/*/benches/`; numbers in `docs/missions/flamegraph-logs/obj3-criterion.md` (unchanged by this mission) | Noise floors: plan/census resolve ≥2%; µs-scale ≥5% idle (≥10–20% under shared CPU); ns-scale <10% starred, <3% elsewhere. Lane rule: re-run baselines idle; <5% is noise (<2% plan/census). |
| scorer | `bench-worker/2` dual-report | HW + scorer fields in `docs/evidence/alloc/enterprise-alloc3/meta.json` (both legs); design + probes in `docs/missions/flamegraph-correct-logs/cobj4-rss.md` | v1 `peak RSS` headline preserved bit-identically (Fasthull's locked metric); `peak HW` is a NEW series that must never be compared against old RSS. |

Cross-instrument agreements (why this map is trustworthy): census net
open 244.5ms vs flame3 `__open` 251wt agree to ~2.6% across runs
(`summary.md` both bundles); user+sys CPU = wall to 0.2ms from
independent sources (`counters-span.json`); Rust span counts stable
across three missions' runs (946.6/938.6/152.2 bit-identical; reallocs
+2 explained as the phase-row Vec observing itself — C-Obj 5 log); GC
census 14sc/2mc identical everywhere it was taken; compile−span
marshal delta 28.5/28.8ms on two independent legs (`phases1b`
decomposition); one binary chain spanning the rebuild (below).

**Shipped-identity bar (corrected).** Literal sha-identity is RETIRED
as the mission bar (CAPTAIN'S DECISION, C-Obj 5 log): it breaks on ANY
source-adding rebuild. Recorded bar: zero code bytes + every delta
byte accounted. Proven firsthand: pristine-HEAD vs current shipped
`.node` differ in exactly 31 of 8,863,200 bytes = 16 deterministic
LC_UUID + 15 panic-line-low-bytes across 14 `Location` consts, each
delta exactly equal to the inserted-line count (14/14 decoded).
`__TEXT` bit-identical. New shipped sha `393afb0a…` for alloc3-era
captures; flame3 and both counters legs remain on `5ac6c07e…`
(counters instrument `d54c6b3d…` reused from cache, zero drift; alloc
trace `6af0ef6c…` on fresh inputs `bf8177f8…`). CAVEAT: never cite a
compile phase from the first run after a rebuild — cold page cache
showed 213ms vs 26ms at small scale (C-Obj 5 log).

## 2. Sync decomposition (enterprise, ~1.2s)

Canonical run: flame leg (shipped .node, whole worker,
`agentrs-flame/3`). Source: `docs/evidence/phases/enterprise-phases1b/decomposition.md`
(procedure `agentrs-phases/1`).

```
sync ≈ 1230.1 ms = config 30.6 + scan 364.3 + evaluate 6.2 + compile 780.3 + publish 48.7 (+ residual 0.0)
startup 118.1 ms sits outside sync (fresh-process cost); worker total 1348.2 ms.
```

Each column reconciles within its own run; spread mixes wall jitter
with instrument overhead (sampling, shim, alloc counting) and is
context, not claim. Trace-leg compile (+30%) is alloc-counting
overhead; canonical stays the shipped binary.

| phase | flame | span | census | gc | trace | spread |
| --- | --- | --- | --- | --- | --- | --- |
| startup | 118.1 | 84.1 | 83.9 | 105.4 | 100.2 | 34.1 |
| config | 30.6 | 18.9 | 21.3 | 19.4 | 18.5 | 12.1 |
| scan | 364.3 | 353.2 | 360.2 | 356.9 | 355.7 | 11.1 |
| evaluate | 6.2 | 5.7 | 5.6 | 2.4 | 5.6 | 3.8 |
| compile | 780.3 | 768.4 | 759.2 | 758.4 | 1024.5 | 266.1 |
| publish | 48.7 | 47.5 | 49.6 | 48.5 | 48.2 | 2.1 |
| syncResidual | 0.0 | 0.0 | 1.9 | 0.0 | 2.1 | 2.1 |
| workerTail | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| syncTotal | 1230.1 | 1193.8 | 1197.8 | 1185.7 | 1454.7 | 269.0 |
| workerTotal | 1348.2 | 1277.9 | 1281.8 | 1291.1 | 1554.9 | 277.0 |

Per-phase instrument reads (canonical ms, same-run buckets;
attribution: each sample/event counts fully in the phase containing
its start; weight ≈ ms at the profile rate):

| phase | ms | share | flame wt | census calls | census ms | top census call |
| --- | --- | --- | --- | --- | --- | --- |
| startup | 118.1 | — | 118 | 1,551 | 5.9 | open |
| config | 30.6 | 2.5% | 25 | 132 | 0.6 | open |
| scan | 364.3 | 29.6% | 365 | 60,858 | 269.1 | open |
| evaluate | 6.2 | 0.5% | 6 | 12 | 3.5 | read |
| compile | 780.3 | 63.4% | 778 | 3,758 | 9.0 | stat |
| publish | 48.7 | 4.0% | 49 | 898 | 10.4 | write |
| syncResidual | 0.0 | 0.0% | 0 | 19 | 0.1 | openat |
| preMain | — | — | 0 | 7 | 0.0 | — |
| postWorker | — | — | 8 | 366 | 3.5 | — |

Compile under the lens (same-run instruments): canonical compile
780.3ms. Counters span (same run): 740.0ms blocking,
9,538,524,032 instructions, IPC 2.36. Alloc span (same run): 995.7ms
blocking, 946.6 MiB allocated, 1,117,430 reallocs, 152.2 MiB peak.
Marshal delta (compile phase − span, same run): 28.5ms counters leg,
28.8ms alloc leg — N-API + JSON marshal plus the await hop, real
compile-phase cost outside the guard. GC verdict: PASS — 0 in-window
full GCs (1 head, 1 tail).

Caveat (load-bearing, stated in the decomposition itself): low JS
self % does not bound savings from JS-driven native/fs work. The JS
phases (config/scan/evaluate/publish = 449.8ms, 36.6% of sync) spend
most of their wall inside the native compiler and libc file calls:
per-phase wall says where the run went, the flame lib split and the
libc census say what it did there. Read the two together, never the
self share alone.

Range notes for citers: flame-leg startup 118.1 sits above the other
legs (83.9–105.4; profiler + first-run coldness per the C-Obj 2 log)
— cite the range, not the top. Alloc3's gc-leg evaluate (2.4 vs ~5.6 elsewhere) is
tiny-phase jitter; spread is context.

## 3. Ranked rooms

Ranked by attributable sync ms, flame-primary (canonical: flame3,
weight 1349; flame2 resummarize cross-read where noted),
counters/alloc cross-read. Verdicts: FLOOR (load, not waste) / WASTE
(skimmable) / MIXED / NON-RECURRING.

| # | Room | Size | Verdict | Evidence |
| --- | --- | --- | --- | --- |
| 1 | .node compute (Rust self) | ~336ms (336, 24.9%) | MIXED — IPC-healthy, diet-shaped, NO CEILING | IPC 2.36, healthy band, no headroom language (`counters3` summary); top self is 23 (1.7%) on the fresh capture / 26 (1.9%) on the v1 profile — long-tail flat (`flame3`/`flame2` summaries); inclusive: `AssembleCtx::finish` 296 (21.9%), `resolve_want_with` 137 (10.2%). No instruction-level ceiling is claimed; data-structure diet unbounded but unproven. 1.27M instr + ~129 kB alloc per css-call (9.5385B/7527; 946.6MiB/7527). |
| 2 | Allocator traffic (malloc self + transient) | ~262ms (262, 19.4%) | per-op FLOOR; volume WASTE ~2–4%, now phase-targeted | 8.26M blocks, warm, balanced (`alloc3` + `flame3` summaries); 1,117,430 reallocs (13.5% of blocks) + `RawVec::reserve` 10 self / 63 incl + memmove 70wt → one lane worth ~2–4%. Phase targets (`alloc3` summary): constants is the transient king (237.2 alloc / 206.8 freed); extract retains most (+36.2, 2.16M blocks); parse retains +61.9 (freed in the harvest→assembly gap, live 152.4→73.1); assembly frees most (197.5); harvest/partition alloc-neutral. madvise 36 = purge of the 939MB freed: floor given volume. |
| 3 | File open (`__open`) | ~251ms (251, 18.6%; census 244.5ms) | FLOOR | 15,436 opens / 15,122 files = **1.02/file** @15.87µs warm avg (`census-net.json` in `counters3`; net opens 15,409 = v1's 15,407 + 2 from the phases.ts worker import (C-Obj 2 log)); census↔flame agree to ~2.6% across runs. Only structure (fewer files touched) moves it. 12,000 of the 15,122 files are dead — yet opened (§7 A2). |
| 4 | node/V8 + loader (node self) | ~160ms (160, 11.9%) | partly NON-RECURRING | Outside the window; module-load + type-strip fresh-process cost that production amortizes. Startup phase 118.1 canonical, 83.9–118.1 across legs (`phases1b`); bound the room by the range, likely tens of ms steady-state (carried Obj 4 judgment). One node frame in the top-25 at 10wt (`Scanner::ScanString`); otherwise long-tail flat like room 1. |
| 5 | Kernel non-open (madvise/read/kevent/getdirentries/close/stat/write) | ~166ms (417−251) | FLOOR given volume | madvise 36 + read 27 + kevent 33 + getdirentries 11 + close 10 + stat 11 + write 11 (`flame3` summary); reads 2/file, 8.83 MB decimal total (`census-net.json`) — already minimal. |
| 6 | platform memmove/memcmp | ~122ms (memmove 70 + memcmp 52) | EFFECT of rooms 1–2 | memmove ≈ realloc copying; memcmp ≈ Atom==/path-compare/hash lookups (`flame3` summary). Dies with its parents; not a lane. |
| 7 | JS self | ~31ms (31, 2.3%; v1 profile 22, 1.6%) | pure-JS NEGLIGIBLE; JS-phase wall REACHABLE | Any pure-JS lane caps below noise (bar 6). But the JS-phase wall is 449.8ms (36.6% of sync — §2 caveat): lanes that move JS-driven native/fs work are judged on the phase wall they move, with libc/native cross-reads. |
| — | GC timing | 0 in-window full GCs | CLOSED (non-room) | 14sc/2mc whole-run, PASS verdict 1-head-1-tail (`alloc3` summary + meta). Handoff-shape lanes cannot score via GC timing — the family is dead (bar 4). |
| — | Scored RSS peak | HW 340.9 MiB; HW sync-added 235.5 | Rust-transient-dominated, allocator-noisy | Span peak 152.2 MB = 65% of HW sync-added; JS-handed 11.3 MB, Rust live-at-exit 13.9 MB, V8 HW 51.7 MB, malloc slack 52.8 MB (`alloc3` summary). RSS lanes must move the transient peak, not reachable (bar 7) — and must score on the HW series: same-load peak varies ±15MB run to run and the peak moves between phases (compile vs post-compile), so the old sampler miss is INTERMITTENT — it noises the metric, not just offsets it (C-Obj 4 log; filed bound: 307.3 vs 318.1 in `counters/enterprise-latest`, 343.7 vs 347.4 span-exit maxRss in `counters3`). |

Two structural facts dominate the recommendation: the window is
**100% top-thread** (11/11 threads, 0 born / 0 died, unattributed
1µs — `counters3` meta `derived.threads`) with 11 threads idle, so
parallel lanes have headroom — the filed conclusion stands, now with
exact birth/death attribution instead of the skip-the-born bug; and
**~79% of opened files are dead** (12,000/15,122 — `meta.json`
plans), so dead-file IO avoidance is the largest single structural
prize (~194ms, ~16% of sync) if deadness is knowable without opening.

## 4. What is NOT a room (lanes already dead)

- **GC-shape/handoff lanes** (chunked handoff successors): the
  mechanism re-reproduced under `agentrs-alloc/3` — 0 in-window full
  GCs, so no schedule change inside the window can move a full GC.
  Dead until fresh evidence shows in-window GCs.
- **Pure-JS micro-lanes**: JS self is 2.3% of sync on the canonical
  run; the ceiling is the noise floor. (JS-*phase* lanes are alive —
  §2 caveat, bar 6.)
- **Single-function spikes in .node/node**: neither lib has one (top
  .node self 1.7% fresh / 1.9% v1 profile; node has a single 10wt frame in the top-25).
  Lanes here must be diet (fewer instructions/allocations across the
  long tail, or fewer calls — §8), proven at criterion scale first.
- **`__open` per-op optimisation**: 15.87µs warm-open avg is the
  floor; only open *count* (structure) is a lane.

## 5. Withdrawn claims (v1 → v2 ledger)

Each withdrawn v1 claim, its replacement, and the procedure that
forced the change. Nothing here is softened language — the left
column must not be cited again.

| # | v1 claim (DO NOT CITE) | v2 replacement | Forced by |
| --- | --- | --- | --- |
| 1 | "Hottest Rust function has nine" (v1 §1/§3) | `resolve_alias` 26 self / 43 incl on the preserved v1 profile (`flame2`); 23/33 on the fresh canonical capture (`flame3`) — sampling noise across runs, aggregation now weighted + merged | `agentrs-flame/2`, C-Obj 1 |
| 2 | Mixed-window §2 decomposition (whole-worker flame × post-import syncMs, empty-process-subtracted census, span from another run) | Reconciled same-run decomposition `phases1b` (§2): every stage on common edges, startup measured in-run, marshal delta visible | `agentrs-phases/1`, C-Obj 2 |
| 3 | "Hard ≤12% ceiling" on compute room + width-4 stall bound (v1 §1/§3/§6/§7) | WITHDRAWN outright — no ceiling claimed. Stall field deleted from the instrument; IPC 2.36 reads as a health band only. The v1 gap note's width logic was backwards (stricter width *raises* the share) and is also withdrawn | `agentrs-counters/3`, C-Obj 3 |
| 4 | Stop-optimizing / stop-spending rule (v1 §6 Phase B) | WITHDRAWN — restated as re-scope, not stop (§7). Without a compute ceiling the floor map cannot support a proven-floor stop claim | C-Obj 3 + this report |
| 5 | Top-thread 100% via skip-the-born derivation | 100% STANDS on filed data but now exactly attributed: 11/11 matched, 0 born / 0 died, unattributed 1µs (`counters3` meta). The old derivation would have reported 100% against ~25% actual with births (reviewer repro per the mission brief issue 5, now a 24/24-green synthetic probe in the C-Obj 3 log) | `agentrs-counters/3`, C-Obj 3 |
| 6 | v1-probe RSS as an unbiased scorer | Old miss is INTERMITTENT (filed: +10.8 `enterprise-latest`, +3.8 `counters3`; firsthand: +6.7 caught, HW == span-exit maxRss exactly — C-Obj 4 log). Scorer is now `bench-worker/2`: v1 series preserved, HW is the new scored series, never cross-compared | `bench-worker/2`, C-Obj 4 |
| 7 | Literal sha-identity as the "one binary" bar | RETIRED — recorded bar is zero code bytes + accounted deltas (31/8.86M bytes: UUID + 14 line consts, 14/14 decoded). Chain spans the rebuild: `5ac6c07e…` → `393afb0a…` | C-Obj 5, captain's decision |
| 8 | Ephemeral inclusive map (/tmp-only, v1 §7) | Filed: self+inclusive rows in `flame2`/`flame3` summaries (finish 299/296, resolve_want_with 133/137, build_keyed 83/83 — v1-profile/fresh) | `agentrs-flame/2`, C-Obj 1 |
| 9 | Census "whole worker minus startup" as the only libc window | Startup measured in-run; per-phase libc buckets filed (`phases1b`, `counters3`). The startup-subtracted net stays for v1 comparability only | `agentrs-phases/1`, C-Obj 2 |

## 6. Kill-fast bars

Each bar names the instrument, the measurement, and the threshold that
kills the lane. Thresholds sit ≥10× above the stated noise floors
(instr/cycles ±0.2%, census exact/bit-stable, syscalls ±5.5%, minflt
±9% — Obj 4 log; criterion floors — Obj 3 log). All procedure refs
are the corrected versions.

1. **Reserve/arena lane** (`pnpm agentrs alloc` + criterion):
   killed unless reallocs drop ≥50% (1,117,430 → <560k) AND the
   lane's target bench moves beyond its floor (plan/census ≥2%,
   µs ≥5% idle). Phase aim is now filed: constants transient
   (237.2/206.8), extract retained (+36.2, 2.16M blocks), parse
   retained (+61.9). Full-bench spend only after both.
2. **Instruction/diet lanes** (`pnpm agentrs counters`):
   killed unless window instructions drop ≥5% at fixed load
   (9.539B baseline, noise ±0.2%, so 5% is 25× noise) with
   bit-identical output. IPC-rise alone without fewer instructions
   is not a win. No ceiling bounds the upside — but none promises
   it either.
3. **Dead-file IO lane** (`pnpm agentrs counters` census):
   killed unless net opens fall below ~12,000 (baseline 15,409 —
   must skip most of the 12,000 dead files) with byte-identical
   sync output. A probe that cannot determine deadness without
   opening is a negative result, not a lane.
4. **GC-timing family**: closed. Any new lane justified by GC
   timing must first file fresh `agentrs-alloc/3` evidence showing
   ≥1 in-window full GC; otherwise it does not get a bench run.
5. **Loader/amortization claims**: killed unless measured warm
   (second sync, same process). Fresh-process-only wins against
   the 83.9–118.1ms startup range do not count.
6. **JS-side lanes**: pure-JS work caps at the 2.3% self-share —
   below noise, killed as its own lane. JS-*phase* lanes (moves
   in config/scan/evaluate/publish wall via native/fs work) are
   judged on the target phase wall with libc/native cross-reads:
   killed unless the phase wall moves ≥5% at fixed load with
   bit-identical output. (New threshold, crew judgment: 5% sits above
   the ~3–4% cross-leg spread on scan/publish in `phases1b`;
   tighten it once same-instrument run-to-run phase jitter is filed.)
7. **RSS lanes** (`pnpm agentrs alloc`): killed unless span peak
   drops ≥10% (152.2 → <137 MB). Reachable-diet lanes are dead on
   arrival: live-at-exit is already 13.9 MB; the peak is the
   target. Score on the HW series (`bench-worker/2`) across
   repeated runs — never against old v1 RSS, and never on one run
   (±15MB allocator spread).
8. **Parallel-compile lane** (`pnpm agentrs counters`):
   killed unless window top-thread share drops below 80% with
   bit-identical output — measured under the born/died
   attribution, with born/died counts and the unattributed share
   stated (unattributed ≥1% unexplained fails the bar — the ≥1% caveat is the C-Obj 3 verdict rule) — and
   killed at full scope unless it shows ≥1.5× window speedup on
   ≥4 workers. Determinism first.
9. **Criterion-first rule, revised** (all lanes): no full
   `bench:neo` spend until EITHER the lane's target-function bench
   moves beyond its Obj 3 floor on an idle box OR the lane files
   call-less-often evidence (fewer invocations at fixed load with
   bit-identical output — counters, census, or alloc counts as
   appropriate). Per-function speed is not the only valid shape of
   win (§8). `cargo bench` invocations must scope
   `--bench <name>` before `-- --sample-size N` (unscoped exits
   101 — Obj 3 log).

## 7. Wave 5 recommendation: sequenced mix, architecture-led

Pure skirmish cannot promise double digits: proven waste is ~2–4%
(room 2) and the compute room has no measured ceiling for or against
(room 1) — the v1 "hard, low-yield ≤12% cap" that fenced the bet is
gone. Pure architectural bet without probes risks another Wave 4
expensive-late death — the exact failure this mission exists to
prevent. So:

**Phase A — three kill-fast probes (days, in this order):**

- **A1. Reserve/arena the realloc volume** (room 2). Cheapest,
  criterion-provable in hours. Bar 1. Expected yield ~2–4%, now
  aimed at filed phase targets (constants transient, extract/parse
  retained); a pass also buys allocator headroom for Phase B.
- **A2. Dead-file open-avoidance spike** (room 3). Question, not
  optimisation: can the pipeline know a file is dead without
  opening it (manifest, cache, directory pass)? Bar 3. Prize
  ~194ms (~16% of sync); a negative answer kills the largest
  structural prize cheaply.
- **A3. Parallel-compile feasibility spike** (room 1 + window).
  Determinism + scaling on the 100%-top-thread 740ms window
  (exact attribution, bar 8). The only lane that attacks the whole
  window at once.

**Phase B — the bet.** Commit Wave 5 to whichever structural lane
survives Phase A (A2 and A3 are both architectural in cost if not in
name; A1 ships regardless as the certain ~2–4%). **If none survive,
re-scope, don't grind and don't stop-rule**: the voyage's target
moves to RSS-peak-via-transient-diet, bundle bytes, or out-of-bounds
— or Wave 5 funds deeper compute-architecture work explicitly as
uncapped exploration. The v1 stop-spending rule is withdrawn (§5.4):
without a compute ceiling, a no-survivor outcome means the cheap
probes failed, not that the wall is proven minimal — and that call
is a cost-of-exploration judgment, not a measurement verdict.

## 8. Decision gates (corrected)

- Wins are decided by repeated, matched, uninstrumented end-to-end
  runs with correctness, RSS (HW series), and bundle-size checks.
  One run never decides anything (§3 RSS spread note).
- Counters and microbenchmarks explain results; they do not gate
  them. A lane that wins end-to-end but puzzles the counters files
  the puzzle honestly — it does not fail.
- The criterion-first bar must not reject improvements that call a
  function less often rather than making it faster (bar 9, second
  arm). Call-count evidence at fixed load with bit-identical
  output is a valid win shape.

## 9. Gaps and non-claims

Carried (still open):

- **Rootless LLC proxy.** LLC misses are uncountable without root
  on this box (PMU dead: powermetrics/dtruss/xctrace/kpc all
  denied or absent — Obj 4 log). IPC + faults + pageins + Obj 2
  byte traffic are the honest proxies. No width assumption, no
  ceiling — the v1 width paragraph is withdrawn (§5.3), not
  repaired.
- **libc-level census blind spots.** Interpose sees 16 libc calls
  (15 with schema-1 rows in `counters3`); getdirentries/madvise/
  futex appear only in flame; mmap "bytes" are virtual length, not
  touched bytes (`counters3` summary).
- **Compile-time size-assert debt** on the counters extern-C
  mirrors: promised in design, still absent from filed code;
  captain accepted as hardening debt because triple-source
  agreement proves current layouts (Obj 4 log). Guards future OS
  drift, not current correctness.
- **`pin=latest` evidence dirt.** All bundles filed on dirty trees
  (instrument arcs + — for the earlier ones — another session's
  fasthull/neo-report edits; full `treeStatus` in each `meta.json`,
  including `phases1b`). Mitigated: the measured artifacts are
  hash-pinned per leg (shipped `5ac6c07e…` / `393afb0a…` per §1,
  counters `d54c6b3d…`, trace `6af0ef6c…`). Optional: hash-pinned
  re-run on a clean tree (Obj 1 log standing note).
- **Flame sampling noise.** 1329 samples @1000Hz canonical (weight
  1349); one weight unit ≈ 0.07% — lib-level shares are robust,
  few-weight frame attributions are not. Cross-run frame jitter is
  visible and honest (`resolve_alias` 26 v1-profile vs 23 fresh).
- **Census is not a true micro-bench.** `StagingPlan::census` is
  `pub(crate)` (3/1347 flame samples on the v1 profile — too cold
  to justify API churn); the census bench is honestly a
  census-shaped whole-compile regression instrument (Obj 3 log).
- **Wall variance.** syncMs ranges 1185.8–1230.1 across shipped
  legs (`phases1b` metas); 1454.7 on the alloc trace leg is
  counting overhead, unscored. Wall is unscored on instrument legs
  — the decomposition is the instrument, and ratios (1.02
  opens/file, IPC 2.36, 65% RSS) travel across boxes better than ms.
- **One box.** Intel i9-13900K, darwin-x64, CLT-only, SIP on, no
  root (carried from v1 §7). All ms are this-box;
  floors-as-ratios are the portable claims.

Closed by this mission: no phase markers (§2, `phases/1`); ephemeral
inclusive map (§5.8); JS-self-without-caveat (§2 caveat, carried in
the decomposition file itself); backwards width logic (§5.3).

New (C-Obj 6 observations):

- **Decompose procedureNote staleness (instrument nit, reported
  not fixed).** `decompose-render` hardcodes the meta
  procedureNote as "joining flame/3 + counters/2 + alloc/2", so
  the filed `phases1b` meta carries a stale note while its sources
  block correctly records counters3+alloc3. Numbers are re-derived
  from raws and unaffected; wording only. Captain decides (C-Obj 6
  log).
- **First-run-after-rebuild caveat** (§1): cold page cache moves
  compile-phase wall wildly on the first run after a fresh `.node`
  build. Never cite such a run.
- **RSS intermittence + allocator spread** (§3 RSS row): the peak
  moves between compile and post-compile phases run to run, and
  same-load peaks spread ±15MB (C-Obj 4 log probes; scripts
  ephemeral at `/tmp`, numbers survive in the log). RSS claims
  need repeats on the HW series.
- **HW-vs-v1 comparison ban.** `bench-worker/2` keeps the v1
  series comparable for history (Fasthull's locked pins stand);
  HW is a new series. Any HW-vs-old-RSS delta is a procedure
  change, not a result.

## 10. Reproduction

```bash
pnpm agentrs flame -- enterprise --out <flameDir>       # → procedure agentrs-flame/3
pnpm agentrs alloc -- enterprise --out <allocDir>       # → procedure agentrs-alloc/3
pnpm agentrs counters -- enterprise --out <countersDir> # → procedure agentrs-counters/3
pnpm agentrs decompose --flame <flameDir> --counters <countersDir> --alloc <allocDir> [--out dir]
pnpm agentrs flame --resummarize <srcDir> [--out dir]   # re-derive summaries from preserved raws
pnpm agentrs counters --resummarize <srcDir> [--out dir]
pnpm agentrs c                                          # 46/46 criterion smoke lines (Obj 3 path)
pnpm agentrs bench <crate> [--bench <n>]                # canonical gated lane invocation
samply load docs/evidence/flamegraph/enterprise-flame3/profile.json.gz  # view
```

Method, dead ends, and noise floors: `docs/missions/flamegraph-logs/obj1-flame.md`
through `obj4-counters.md`; corrections: `docs/missions/flamegraph-correct-logs/cobj1-aggregation.md`
through `cobj6-reconv2.md`.


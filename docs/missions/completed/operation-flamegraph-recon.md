# Operation Flamegraph — Recon Report (Obj 5)

Wave 5 sighted map. Synthesis only: no implementation, no speedups, no
instrument changes. Every number cites filed evidence; gaps are stated in §7.

**Verdict.** The Wave 4 close ("past ~1.0s is architecture or
out-of-bounds", per the mission brief) is CONFIRMED by measurement.
Evidence-backed skimmable waste is ~2–4% of sync (realloc volume) plus a
hard ≤12% stall cap on the compute room; the rest is per-op floors,
1.02-opens-per-file load, fresh-process cost, or diet-shaped long-tail
compute with no spike to kill. **Recommendation: sequenced mix,
architecture-led** — three cheap kill-fast probes first (§6, Phase A),
then commit Wave 5 to whichever structural lane survives; if none
survive, stop spending on sync wall (§6, Phase B).

## 1. Evidence base

Locked load throughout: enterprise, 3000 style + 12000 dead files,
7527 css() calls, 120 recipes, seed 7, release `.node` sha
`5ac6c07e…` bit-identical across all three objectives.

| Obj | Instrument (procedure) | Evidence | Headline |
| --- | --- | --- | --- |
| 1 | samply flame, `agentrs-flame/1` | `docs/evidence/flamegraph/enterprise-latest/` | 1347 main samples; kernel 29.4% / .node 26.9% / malloc 19.6% / node 13.6% / platform 8.2% / JS 1.6%; `__open` alone 18.0%. Worker syncMs 1242.6. |
| 2 | GC census + Rust alloc span, `agentrs-alloc/1` | `docs/evidence/alloc/enterprise-latest/` | 14sc/2mc whole-run, **0 in-window full GCs** (PASS: 1 head + 1 tail); Rust span 946.6 MB alloc / 938.6 freed / 8.26M blocks / 1.117M reallocs / 152.2 MB peak = **~58% of sync-added RSS** (152.2/262.0). |
| 3 | criterion benches, 8 targets / 46 cases / 9 functions | bench sources in `packages/reference-rs/modules/*/benches/`; numbers in `docs/missions/flamegraph-logs/obj3-criterion.md` (no filed noise-floor doc — §7 gap) | Noise floors: plan/census resolve ≥2%; µs-scale ≥5% idle (≥10–20% under shared CPU); ns-scale <10% starred, <3% elsewhere. Lane rule: re-run baselines idle; <5% is noise (<2% plan/census). |
| 4 | HW counters + libc census, `agentrs-counters/1` | `docs/evidence/counters/enterprise-latest/` | Window 725.7ms (user 639.0 + sys 86.6 = wall to 0.1ms); **9.509B instr, IPC 2.39**, stall 40% @width-4; 13,751 unix syscalls; 48.5k minflt + 0 maj + 0 pageins (warm); top-thread 100%. Census net: 15,407 opens @15.5µs = 239.4ms; 30,529 reads + 439 preads = 8.83 MB; close/open balanced. |

Cross-instrument agreements (why this map is trustworthy): census open
239.4ms vs flame `__open` 243 samples agree to 1.5% (`summary.md` both
bundles); user+sys CPU = wall to 0.1ms from three independent sources
(`counters-span.json`); Rust span counts bit-stable 4/4 runs and census
net bit-stable both runs (Obj 2/4 logs); GC census 14sc/2mc identical
4/4 runs (Obj 2 log); one shipped binary measured by all three
objectives.

## 2. Sync decomposition (enterprise, ~1.2s)

```
sync ≈ 1199ms = 726ms compile window (61%) + ~473ms JS-side (39%)
window (726): .node compute ~363 + in-window malloc/kernel/IBM ~363
JS-side (~473): libc ~216 (opens/reads/stats) + node ~183 + JS ~19 + uncensused ~51
```

Source: Obj 4 log decomposition (census-leg syncMs 1198.5 in
`docs/evidence/counters/enterprise-latest/meta.json`); window 725.7ms
in `counters-span.json`. Flame lib shares below are × syncMs 1242.6
(`docs/evidence/flamegraph/enterprise-latest/meta.json`).

## 3. Ranked rooms

Ranked by attributable sync ms, flame-primary, counters/alloc
cross-read. Verdicts: FLOOR (load, not waste) / WASTE (skimmable) /
MIXED / NON-RECURRING.

| # | Room | Size | Verdict | Evidence |
| --- | --- | --- | --- | --- |
| 1 | .node compute (Rust self) | ~334ms (363, 26.9%) | MIXED — IPC-healthy, diet-shaped | IPC 2.39, stall 40% @width-4 (`counters` summary); top frame is 9 samples (0.7%), long-tail flat (`flamegraph` summary); inclusive: `AssembleCtx::finish` 299, `resolve_want_with` 133 (Obj 3 log). Instruction-level lanes cap ≈0.40×363 ≈ **≤12% of sync**; data-structure diet unbounded but unproven. 1.26M instr + ~130 kB alloc per css-call (9.509B/7527; 992.6MB/7527). |
| 2 | Allocator traffic (malloc self + transient) | ~244ms (264, 19.6%) | per-op FLOOR; volume WASTE ~2–4% | 8.26M blocks @ ~30ns/alloc-free pair, warm, balanced (`alloc` + `flamegraph` summaries); but 1.117M reallocs (13.5% of blocks) + `RawVec::reserve` top .node frame + memmove ≈20–40ms → one lane worth ~2–4% (Obj 4 log join). madvise 38 samples = purge of the 939MB freed: floor given volume. |
| 3 | File open (`__open`) | ~224–239ms (243, 18.0%; census 239.4ms) | FLOOR | 15,434 opens / 15,122 files = **1.02/file** @15.5µs warm avg (`census-net.json`); census↔flame agree to 1.5%. Only structure (fewer files touched) moves it. Note 12,000 of the 15,122 files are dead — yet opened (§6 A2). |
| 4 | node/V8 + loader (node self) | ~169ms (183, 13.6%) | partly NON-RECURRING | Outside the window; module-load + type-strip fresh-process cost that production amortizes. Bound ≤183 samples, likely tens of ms steady-state (Obj 4 log). No node frame in the top-28: long-tail flat like room 1. |
| 5 | Kernel non-open (madvise/read/kevent/getdirentries/close/stat) | ~150ms | FLOOR given volume | read 36 + stat/lstat ~13 + getdirentries 13 + close 12 + madvise 38 (`flamegraph` summary); reads 2/file, 8.83 MB total (`census-net.json`) — already minimal. |
| 6 | platform memmove/memcmp | ~102ms (110, 8.2%) | EFFECT of rooms 1–2 | memmove 20 ≈ realloc copying; memcmp 29 ≈ Atom==/path-compare/hash lookups (`flamegraph` summary). Dies with its parents; not a lane. |
| 7 | JS self | ~20ms (22, 1.6%) | NEGLIGIBLE | Any pure-JS lane caps below measurement noise (bar 6). |
| — | GC timing | 0 in-window full GCs | CLOSED (non-room) | 14sc/2mc whole-run, PASS verdict 1-head-1-tail (`alloc` summary + meta). Handoff-shape lanes cannot score via GC timing — the family is dead (bar 4). |
| — | Scored RSS peak | 355.9 MiB; sync-added 262.0 | Rust-transient-dominated | Span peak 152.2 MB = 58% of sync-added; JS-handed 11.3 MB, Rust live-at-exit 13.9 MB, V8 HW 51.6 MB (`alloc` summary). RSS lanes must move the transient peak, not reachable (bar 7). |

Two structural facts dominate the recommendation: the window is **100%
single-threaded** (top-thread share 100%, cpu≈wall — `meta.json`
derived) with 11 threads idle, so parallel lanes have headroom; and
**80% of opened files are dead** (12,000/15,122 — `meta.json` plans),
so dead-file IO avoidance is the largest single structural prize
(~190ms, ~15% of sync) if deadness is knowable without opening.

## 4. What is NOT a room (lanes already dead)

- **GC-shape/handoff lanes** (chunked handoff successors): R1's
  mechanism reproduced — 0 in-window full GCs, so no schedule change
  inside the window can move a full GC. Dead until fresh evidence shows
  in-window GCs.
- **Pure-JS micro-lanes**: JS self is 1.6% of sync; the ceiling is the
  noise floor.
- **Single-function spikes in .node/node**: neither lib has one (top
  .node frame 0.7%; no node frame in top-28). Lanes here must be diet
  (fewer instructions/allocations across the long tail), proven at
  criterion scale first.
- **`__open` per-op optimisation**: 15.5µs warm-open avg is the floor;
  only open *count* (structure) is a lane.

## 5. Kill-fast bars

Each bar names the instrument, the measurement, and the threshold that
kills the lane. Thresholds sit ≥10× above the stated noise floors
(instr/cycles ±0.2%, census exact/bit-stable, syscalls ±5.5%, minflt
±9% — Obj 4 log; criterion floors — Obj 3 log).

1. **Reserve/arena lane** (`pnpm agentrs alloc` + criterion):
   killed unless reallocs drop ≥50% (1.117M → <560k) AND the
   lane's target bench moves beyond its floor (plan/census ≥2%,
   µs ≥5% idle). Full-bench spend only after both.
2. **Instruction/diet lanes** (`pnpm agentrs counters`):
   killed unless window instructions drop ≥5% at fixed load
   (noise ±0.2%, so 5% is 25× noise) with bit-identical output.
   IPC-rise alone without fewer instructions is not a win.
3. **Dead-file IO lane** (`pnpm agentrs counters` census):
   killed unless net opens fall below ~12,000 (must skip most of
   the 12,000 dead files) with byte-identical sync output. A
   probe that cannot determine deadness without opening is a
   negative result, not a lane.
4. **GC-timing family**: closed. Any new lane justified by GC
   timing must first file fresh `agentrs-alloc/1` evidence showing
   ≥1 in-window full GC; otherwise it does not get a bench run.
5. **Loader/amortization claims**: killed unless measured warm
   (second sync, same process). Fresh-process-only wins against
   the ≤183-sample room do not count.
6. **JS-side lanes**: killed unless they move a room ≥2% of sync
   — pure-JS work caps at the 1.6% self-share, below noise.
7. **RSS lanes** (`pnpm agentrs alloc`): killed unless span peak
   drops ≥10% (152.2 → <137 MB). Reachable-diet lanes are dead on
   arrival: live-at-exit is already 13.9 MB; the peak is the
   target.
8. **Parallel-compile lane** (`pnpm agentrs counters`):
   killed unless window top-thread share drops below 80% with
   bit-identical output, and killed at full scope unless it shows
   ≥1.5× window speedup on ≥4 workers. Determinism first.
9. **Criterion-first rule** (all lanes): no full `bench:neo`
   spend until the lane's target-function bench moves beyond its
   Obj 3 floor on an idle box. `cargo bench` invocations must
   scope `--bench <name>` before `-- --sample-size N` (unscoped
   exits 101 — Obj 3 log).

## 6. Wave 5 recommendation: sequenced mix, architecture-led

Pure skirmish cannot reach double digits: proven waste is ~2–4%
(room 2) plus a hard, low-yield ≤12% stall cap (room 1), against
~75% measured floor. Pure architectural bet without probes risks
another Wave 4 expensive-late death — the exact failure this mission
exists to prevent. So:

**Phase A — three kill-fast probes (days, in this order):**

- **A1. Reserve/arena the realloc volume** (room 2). Cheapest,
  criterion-provable in hours. Bar 1. Expected yield ~2–4%; a
  pass also buys allocator headroom for Phase B.
- **A2. Dead-file open-avoidance spike** (room 3). Question, not
  optimisation: can the pipeline know a file is dead without
  opening it (manifest, cache, directory pass)? Bar 3. Prize
  ~15% of sync; a negative answer kills the largest structural
  prize cheaply.
- **A3. Parallel-compile feasibility spike** (room 1 + window).
  Determinism + scaling on the 100%-serial 726ms window. Bar 8.
  The only lane that attacks the whole window at once.

**Phase B — the bet.** Commit Wave 5 to whichever structural lane
survives Phase A (A2 and A3 are both architectural in cost if not in
name; A1 ships regardless as the certain ~2–4%). **If none survive,
stop spending on sync wall**: the floor map then says the voyage's
target moves elsewhere (bundle bytes, RSS peak via transient-peak
diet, or out-of-bounds) rather than grinding a measured floor.

## 7. Gaps and non-claims

- **Rootless LLC proxy.** LLC misses are uncountable without root
  on this box (PMU dead: powermetrics/dtruss/xctrace/kpc all
  denied or absent — Obj 4 log). IPC + width-4 stall bound +
  faults + Obj 2 byte traffic are the honest proxies. Width-4 is
  conservative on Raptor Cove (6-wide decode); a stricter width
  only *raises* the 40% stall share, so the ≤12% cap is firm
  against this gap, not weakened by it.
- **libc-level census blind spots.** Interpose sees 16 libc calls;
  getdirentries/madvise/futex appear only in flame; mmap "bytes"
  are virtual length, not touched bytes (`counters` summary).
- **No phase markers.** Census is whole-worker-minus-startup;
  module-load vs sync-JS inside the JS-side ~473ms is unsplittable
  (Obj 4 log). Only the Rust compile window is exact.
- **Compile-time size-assert debt** on the counters extern-C
  mirrors: promised in design, absent from filed code; captain
  accepted as hardening debt because triple-source agreement
  proves current layouts (Obj 4 log). Guards future OS drift, not
  current correctness.
- **`pin=latest` evidence dirt.** All three bundles filed on dirty
  trees (instrument arcs + another session's fasthull/neo-report
  edits — full `treeStatus` in each `meta.json`). Mitigated: the
  measured artifact (shipped .node `5ac6c07e…`) is bit-identical
  across all three objectives. Optional: hash-pinned re-run on a
  clean tree (Obj 1 log standing note).
- **Flame sampling noise.** 1347 samples @1000Hz; one sample ≈
  0.07% — lib-level shares are robust, few-sample frame
  attributions are not. The Obj 3 inclusive map itself is
  ephemeral (`/tmp` script, never filed); its numbers survive only
  in the Obj 3 log.
- **Census is not a true micro-bench.** `StagingPlan::census` is
  `pub(crate)` (3/1347 flame samples — too cold to justify API
  churn); the census bench is honestly a census-shaped
  whole-compile regression instrument (Obj 3 log).
- **Wall variance.** syncMs ranges 1182–1652ms across legs (metas);
  wall is unscored on instrument legs — the decomposition is the
  instrument, and ratios (1.02 opens/file, IPC 2.39, 58% RSS)
  travel across boxes better than ms.
- **One box.** Intel i9-13900K, darwin-x64, CLT-only, SIP on, no
  root. All ms are this-box; floors-as-ratios are the portable
  claims.

## 8. Reproduction

```bash
pnpm agentrs flame -- enterprise        # → docs/evidence/flamegraph/enterprise-latest/
pnpm agentrs alloc -- enterprise        # → docs/evidence/alloc/enterprise-latest/
pnpm agentrs counters -- enterprise     # → docs/evidence/counters/enterprise-latest/
pnpm agentrs c                          # 46/46 criterion smoke lines (Obj 3 path)
pnpm agentrs bench <crate> [--bench <n>]  # canonical gated lane invocation
samply load docs/evidence/flamegraph/enterprise-latest/profile.json.gz  # view
```

Method, dead ends, and noise floors: `docs/missions/flamegraph-logs/obj1-flame.md`
through `obj4-counters.md`.

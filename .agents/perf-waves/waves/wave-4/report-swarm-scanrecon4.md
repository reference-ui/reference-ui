# scan-recon4 REPORT: wave-4 opening recon — fresh flames + scan census + ranked backlog

## Identity

- Base: `b8a75b0bd74c72a72a2c6fe338ca8026088b5afe` (verified `git rev-parse HEAD`
  first act; tree clean at start).
- Release `.node`: `77953ac185fd47eb3752a3af233e688b63f3b9390cff248d708faf81c24e9c93`
  (`packages/reference-rs/dist/native/virtual-native.darwin-x64.node`, 8,889,408 B —
  same size as repro3's build, sha differs by fresh worktree build).
  Built once via `pnpm agentrs b`; sha verified before AND after the timed block
  (unchanged). `build:js` ran once (missing in fresh worktree; gitignored).
- Aside shim (all census patches as `/tmp` asides, never in tree):
  - rev2 `0dcb783f…` — scored runs A/B (class tagging + `open$NOCANCEL` /
    `openat$NOCANCEL` / `readdir` slots; 19 calls).
  - rev3-final `6635917e…` — scored run C (rev2 + tail-sample rings +
    zero-counted `getattrlistbulk` / `readdir_r` slots; 21 calls).
  - Counting path identical across revs (additive slots only); A/B/C counts
    directly comparable on all shared slots.
- End state: tree diff vs HEAD is this REPORT.md +
  `docs/evidence/flamegraph/enterprise-repro5{a,b}/` +
  `docs/evidence/counters/enterprise-scancensus4/` (untracked) only.
  No production code changes. No commits. No LOG.md writes.

## Grounding (index-first; fences honored)

- `agentperf search` before scoping: PERF-W2-COLLECT [BANK] (set-3 landed:
  collect D1 file_name dir-sort + D2 zero-alloc scope match + D4 fused union
  walk — the Rust `sources::collect` room is LANDED ground, improvement only
  with cited prior + beating shape); PERF-W2-SHOT2 [KILL] (dead-file avoidance:
  no sound pre-open signal, `streamed` is content-undecidable pre-open, 17
  candidates dead, R1–R3 resurrection criteria — the ~190 ms shape is banned
  ground, never briefed, never measured toward); DEAD-PARALLEL-SCAN-READS-ASYNC-64-WORKER-B
  [CUT] (async + 64-worker scan reads both regressed; serial `readFileSync`
  stands); wave-1 per-open floor CUT (15.87 µs is floor, only count matters).
- Seam/napi/marshal untouched (seam-scout's crew; its CUT posted during this
  recon). No MCP/TS surfaces beyond the scan path. No diets. No stash (asides only).
- What moved since repro3's flames (`854317417`, enterprise-repro4a/b):
  verified via `git diff 854317417..HEAD --stat -- packages/`: the ONLY
  production-code delta is MCP-side (`icons-search-index.ts` raw-index +
  `reference-mcp` tsup config, `b3181fa93`) — voyage-scored as 0-delta for
  sync, `bench:neo` enterprise 1.07 s / 346.5 MiB pinned in `4720da9df`.
  `packages/reference-rs` and `packages/reference-neo` are byte-identical to
  the repro3 tip. Sync ground is UNCHANGED: fresh flames must reconcile flat,
  and any delta is noise by elimination.

## 1. Fresh flames (2 reconciled captures, this exact tip)

- `/tmp/swarm-recon4-flame/enterprise-repro5a/` — syncMs **961.25**, RECONCILED.
- `/tmp/swarm-recon4-flame/enterprise-repro5b/` — syncMs **974.15**, RECONCILED.
- Filed as `docs/evidence/flamegraph/enterprise-repro5a/` + `enterprise-repro5b/`
  (procedure `agentrs-flame/3`, pin `b8a75b0bd74c`, **dirty:false**; each bundle:
  `profile.json.gz` + presymbolicated sidecar + `phases.json` + `meta.json` +
  `summary.md` + `callers.md` filed via the query layer, no re-record).
- Protocol fidelity: locked enterprise load (3000 style + 12000 dead + 120
  recipes, 7527 css calls, seed 7), 1000 Hz samply, `--perf-basic-prof`,
  same-run phase buckets. One cold unscored tip-verify run first (1313.8,
  discarded, first-run-after-rebuild — same shape as repro3's 1343.8); both
  scored captures warm. Bench lock held for ONE timed block (cold + smoke +
  census A/B/C + flame A/B + stage bench), two-step release.
  Noise disclosed: none observed (no competing samply/worker PIDs; box idle;
  foreign-PID rule honored). The second stage-bench set showed contention
  (full-scan iters +40 outliers) and was DISCARDED whole, never cherry-picked;
  first clean set kept (below). Two worker runs under a poisoned shim rev
  failed deterministically at config load (bisected to the
  getattrlistbulk/readdir_r interpose entries, since dropped) — discarded,
  disclosed, see census notes.

### Whole-sync + phase burndown (pre = repro4a/b, post = repro5a/b; wt ≈ ms)

| phase | pre 4a (ms) | pre 4b (ms) | 5a (ms) | 5b (ms) | Δ 5a | Δ 5b |
| --- | --- | --- | --- | --- | --- | --- |
| syncTotal | 974.7 | 972.6 | 961.2 | 974.1 | −13.5 | +1.5 |
| compile | 520.0 | 520.1 | 508.8 | 522.2 | −11.2 | +2.1 |
| scan | 371.0 | 365.8 | 364.4 | 365.1 | −6.6 | −0.7 |
| publish | 52.6 | 52.5 | 53.3 | 52.1 | +0.7 | −0.4 |
| config | 28.2 | 28.1 | 28.5 | 28.7 | +0.3 | +0.6 |
| evaluate | 2.7 | 6.0 | 6.2 | 6.0 | +3.5 | 0.0 |
| startup (outside sync) | 117.7 | 165.3 | 124.8 | 144.7 | +7.1 | −20.6 |

Verdict: FLAT. No RS/neo code delta exists, so every delta is noise by
elimination — and the fresh 5a↔5b compile straddle (13.4 ms) covers the
largest 4↔5 delta (−11.2). Evaluate shows the known A↔B noise swap resolving
high (±3.5, disclosed). Startup is node-startup noise outside sync, unscored.

Lib self-weight (whole profile): kernel 412/435 (pre 430/433, in-band);
.node 233/240 (pre 205/220 — attribution jitter on a fresh-build layout with
zero code delta; compile wall is flat-to-down, so not work); node 174/165
(pre 158/163); malloc 145/143 (pre 164/142); platform 89/100 (pre 103/103);
JS 27/23 (pre 23/31). All within small-n sampling + rebuild-layout noise.

### Collect-room verification on fresh flames (compile scope; pre 4a/4b)

| fn | 4a | 4b | 5a | 5b |
| --- | --- | --- | --- | --- |
| sources::collect | 0/20 | 1/20 | 0/20 | 0/20 |
| backfill_dir | 0/15 | 0/15 | 0/16 | 0/16 |
| sorted_entries | 0/11 | 0/13 | 0/12 | 0/13 |
| FileMatcher::matches_file | 0/3 | 0/4 | 1/4 | 0/2 |
| handle_backfill_entry / entry_is_dir | inlined | inlined | no frame (inlined) | — |
| std::path::compare_components | 7/9 | 7/8 | 3/6 | — |

Correction to the repro3 table: `compare_components` is NOT scan cost — its
callers are `hosts::resolve → trace_style_bindings → BTreeMap<PathBuf>::insert`
(styletrace trace-side, recordaudit/modmap-CUT neighborhood). It sits in the
scan/sources table by proximity only; measured, it belongs to hosts/trace.
`entry_paths` itself is inlined, but its `Path::is_file → stat$INODE64` edge
reads 0/9 under `hosts::resolve` on 5b — the census-measured 3303 entry +
probe stats (8.2 ms) seen from the flame side (5a/5b agree; see census §4).

## 2. Scan census (aside shim, 3 runs, file counts bit-identical ×3)

Method: stock `counters-interpose.c` + per-file-class tagging (open/openat
path rules; fd→class map for read/close/fstat; `open$NOCANCEL` for `opendir`;
first-4 + last-4 path samples per call×class; min/max durations), built via
`/tmp/scan-recon4/build-shim.py` (stock source read-only). Runner
`run-scan-census.mjs` generates the frozen enterprise repo and runs the bench
worker verbatim under the shim with same-run phase windows. Analyzer
`analyze-scan.mjs` proves: (a) class sums == stock schema-1 census bit-exactly
per call, (b) event sums == census per call, dropped == 0, (c) A/B/C count
identity. All checks pass with zero errors on all three runs.

What the stock shim MISSES (first counted here): all directory opens
(`opendir` binds `open$NOCANCEL`, 70/run) and directory enumeration — both
walkers (fast-glob/libuv AND Rust `read_dir`) issue ZERO libc `readdir` calls;
enumeration routes through `__getdirentries64` (flame-measured 5–8 wt, §3).
Interposing `getattrlistbulk`/`readdir_r` breaks esbuild config resolution
deterministically (2/2 worker failures, bisected) — dropped by design; the
walk is instead measured per-dir from JS (§5) and by flame.

Run windows: A sync 984.5 (scan 375.2, compile 525.7); B sync 950.4
(scan 358.0, compile 509.0); C sync 952.2 (scan 366.5, compile 502.7).
A-first ordering effect ≈ +10 ms opens (FS-state noise ±5% on timing;
COUNTS are the identical quantity).

### 2a. Opens by file class (whole run; scan-phase split in §2d)

| class | A n/ms/avgµs | B n/ms/avgµs | C n/ms/avgµs | identity |
| --- | --- | --- | --- | --- |
| dead (`src/util/util*.ts`) | 12000 / 194.32 / 16.19 | 12000 / 183.78 / 15.31 | 12000 / 189.98 / 15.83 | n ×3 exact |
| style (`src/ui*`) | 3030 / 46.42 / 15.32 | 3030 / 46.93 / 15.49 | 3030 / 47.09 / 15.54 | n ×3 exact |
| recipe (`src/recipes/*`) | 121 / 1.97 / 16.30 | 121 / 1.97 / 16.30 | 121 / 2.03 / 16.79 | n ×3 exact |
| other (startup/config/publish) | 264 / 5.21 / 19.75 | 264 / 4.92 / 18.65 | 264 / 5.17 / 19.59 | n ×3 exact |
| dir (`open$NOCANCEL`) | 70 / 1.36 / 19.46 | 70 / 1.10 / 15.73 | 70 / 1.14 / 16.34 | n ×3 exact |

- Scan-phase file opens: dead 12000 + style 3000 + recipe 120 = 15,120 —
  EXACTLY the in-scope set (repo: 12000 + 3000 + 120 + 2 theme; theme files
  classify `other`). Each in-scope file opened EXACTLY ONCE. Count-minimal:
  no re-opens, no misses.
- The +30 style / +1 recipe opens over the file count are COMPILE-phase
  `src/ui{N}/tsconfig.json` + `src/recipes/tsconfig.json` FAILED-open probes
  (tail-sampled; no fd, no read, no close) — resolver `DiskFs` tsconfig
  probing, compile-neighbor ground (§7 N1), ~0.3 ms.
- Per-open 15.3–16.2 µs across runs/classes: the 15.87 µs CUT floor sits
  inside the run band — CUT STANDS (floor + minimal count, both proven).
- Dir opens 70 = 2 walks × 35 dirs (34 subdirs + root): fast-glob opens 34
  (never root — static `src` base), native backfill opens 35. No `openat`
  anywhere (0 calls ×3 — both walkers use `open`/`open$NOCANCEL` here).

### 2b. Reads by file class (bytes EXACT vs repo, ×3)

| class | n (×3) | A ms | B ms | C ms | bytes (×3) | repo bytes |
| --- | --- | --- | --- | --- | --- | --- |
| dead | 24000 | 16.34 | 14.82 | 16.57 | 1,669,350 | 1,669,350 ✓ |
| style | 6000 | 3.84 | 4.31 | 4.15 | 1,770,077 | 1,770,077 ✓ |
| recipe | 281 | 0.31 | 0.40 | 0.29 | 905,428 | 905,428 ✓ |
| other (non-scan) | 225 | 3.53 | 3.66 | 1.91 | 614,239 | — |
| unknown (pipes) | 22–24 | 0.35 | 0.18 | 0.16 | 933,160 | — |

- Small files cost EXACTLY 2 reads each (data + EOF-confirm): 12000×2,
  3000×2. Recipe files (larger) average 2.34 (multi-chunk tails).
  Total scan reads 30,562 for 4,344,855 B — every in-scope byte read once.
- read avg: dead/style ~0.62–0.72 µs; the second (EOF-confirm) read is a
  ~0.5 µs wasted syscall per file ≈ 10 ms fantasy — filler only (needs a
  single-`pread` native read path; architectural, §7 F1).

### 2c. Closes, stats, walk calls

- Closes mirror opens exactly (dead 12000, style 3000, recipe 120, dirs 70)
  at ~0.6 µs — floor, count-minimal. DRY.
- Compile-phase stats on live files ONLY (dead: zero): style 3060 × 2.38 µs
  (7.28–7.54 ms) = 3000 `entry_paths` `is_file` + 60 `node_modules`
  bare-import probes (30 shards × 2: `@reference-ui/react`,
  `@types/reference-ui__react` — tail-sampled); recipe 243 × 3.44–3.78 µs
  (0.82–0.92 ms) = 120 entry + ~123 extensionless import-target probes
  (tail-sampled `recipe81`, `recipe97`…). Total 3303 stats / ~8.2 ms, all
  compile-neighbor ground (hosts/entries.rs:24 + module_graph DiskFs) —
  neighbor lead N1, NOT scan backlog.
- Whole-run `stat/other` 609 ×3 IDENTICAL (phase-edge attribution wobbles
  ±2 between startup/compile buckets on mark boundaries — bucketing
  artifact, not count instability; disclosed).
- libc `readdir`: 0 calls ×3 (both walkers bypass it). `getdirentries` slot:
  0 (no linkable x86_64 symbol; flame carries the 5–8 wt instead).

### 2d. Scan-phase syscall budget vs stopwatch (pivot; A/B/C)

| scan component | A ms | B ms | C ms |
| --- | --- | --- | --- |
| open dead/style/recipe | 194.32 / 46.10 / 1.94 | 183.78 / 46.62 / 1.93 | ≈189 / ≈47 / ≈2.0 |
| read dead/style/recipe | 16.34 / 3.84 / 0.31 | 14.82 / 4.31 / 0.40 | 16.57 / 4.15 / 0.29 |
| close (all file) | 9.45 | 8.78 | ≈9.2 |
| walk dir opens (34) | 0.72 | 0.64 | ≈0.66 |
| mmap/munmap/misc | 0.7 | 0.7 | ≈0.7 |
| **census sum in scan** | **273.9** | **262.0** | **≈270** |
| **scan stopwatch** | **375.2** | **358.0** | **366.5** |
| userspace gap | ≈101 | ≈96 | ≈96 |

- Scan is 262–274 ms measured syscalls + ~96–101 ms userspace. fg issues
  ZERO stat/lstat in scan (d_type only) — the walk is open+enumerate+close.
- Compile-phase file IO totals ~9.4–9.6 ms (stats 8.2 + tsconfig probes 0.3
  + walk opens 0.5 + micros). Backfill file READS: ZERO — C3 single-read
  retention is COMPLETE (no scope-mirror misses).

## 3. Kernel-vs-user split (flame scan-phase buckets, ×2 — agrees with census)

| scan weight (wt≈ms) | 5a (364) | 5b (365) |
| --- | --- | --- |
| kernel self | 292 (80.2%) | 299 (81.9%) |
| node self | 47 (12.9%) | 39 (10.7%) |
| js self | 20 (5.5%) | 18 (4.9%) |
| platform/malloc/other | 5 | 9 |

Kernel leaves: `__open` 237/248 (= census opens 232–242 ✓), `read` 20/21
(= census 19.5–20.5 ✓), `__close_nocancel` 12/6 (= census ~9, straddles ✓),
`__getdirentries64` 5/8 (walk enumeration, invisible to interpose),
`kevent` 11/11 (esbuild await wait — part of bundle cost), `__write` 4.
Kernel 292–299 vs census 262–274: the ~25 gap = enumeration (5–8) + kevent
wait (11) + mmap/munmap + sampling — CLOSED, no unattributed room.
Userspace 66–72 wt = split/identity ~29 + read-loop/napi ~10 + glob-JS
~15–16 + bundle ~11 + GC/alloc ~7–12 (self-weights + stage medians §5/§6).

## 4. Secondhand-shape verification (sync-perf.html — measured, never trusted)

| viz claim | verdict |
| --- | --- |
| scan 368 ms / 37.8% of sync | ✓ 364.4/365.1 ms, 37.9%/37.5% |
| sources::collect ~20, "5% of scan" | ✓ 20/20 incl — PRECISION NOTE: collect runs in COMPILE, not scan; "5% of scan" is size-comparison phrasing only |
| backfill ~15 / sorted_entries ~12 / matches_file ~4 | ✓ 16/16, 12/13, 4/2 (matches straddles 2–4, small-n) |
| "open+walk floor ~348" (368−20 by subtraction) | ✗ CORRECTED: kernel-in-scan is 292–299 (flame) / 262–274 + 5–8 enum (census+flame). The viz understates scan userspace by ~50–80 ms: split/identity ~29 + glob-JS ~15 + bundle ~11 + GC ~10 ≈ 66–72 is REAL, measured ×2 methods, and partly addressable (T1/T2 below) |
| per-open 15.87 µs floor CUT | ✓ STANDS: 15.3–16.2 band; count proven minimal (exactly-once) |
| kernel 430/433 floor | ✓ 412/435 in-band |
| 12,000 dead "opened, read, parsed-failure-checked" | ✓/NOTE: opened+read verified exactly; parse-checks run in COMPILE (extract), not scan — phrasing only |
| sorted_entries (task-named) | ✓ 12/13 incl, COLLECT-D1/D7 ground intact |
| "backtrace costs" (task-named) | NOT FOUND: no such claim in sync-perf.html, LOG.md, the wave-3 archive, or `git log --all`. Nothing to verify, nothing briefed |
| compare_components 7/9 (repro3 scan table) | ✗ REASSIGNED by caller chain: `hosts::resolve → trace_style_bindings → BTreeMap<PathBuf>::insert` — trace-side, CUT-neighborhood, not scan |

## 5. Walk costs (aside walk-probe: patched fs, verbatim fg.sync, warm)

35 `readdirSync` calls (fg never opens root): `src/util` (12,000 entries)
7.38 ms in ONE call; 30 ui shards ~0.06–0.53 ms (one 0.53 outlier, single
sample); recipes 0.08; theme 0.07; src 0.07. Total readdir wall ≈ 9.5 ms of
24.5 ms glob; remainder ≈ 15 ms fg JS (micromatch/ignore/transform — flame:
`_handleDirectory` 15–16 + `_transform` 10 + `ReadDir` 10–11 + `_handleEntry`
6 + `_filter` 4, overlapping incl). fg stats NOTHING (census: zero scan-phase
stat) and allocates 12k Dirent objects for util (GC-consequential).

## 6. Stage bench (aside, real modules, one frozen repo, medians of 5, warm)

Kept set (tight spreads; second set discarded whole on contention):

| stage | median ms | iters |
| --- | --- | --- |
| S1 fg.sync (verbatim glob) | 24.5 | 24.4/24.5/21.1/27.1/26.3 |
| S2 serial readFileSync loop (verbatim reads) | 191.9 | 266.8/191.1/191.9/193.9/191.6 (iter-1 cold) |
| S3 scanFragmentSources (glob+read+split, real module) | 241.8 | 246.2/241.8/245.8/234.8/234.6 |
| S4 bundleFragments, 2 matches (real module, warm service) | 11.0 | 21.4/11.1/11.0/10.8/10.9 (iter-1 cold start) |
| S5 split-identity reconstruction (same exprs, same data) | 22.8 | 22.8/25.0/22.9/22.0/21.6 |
| split by subtraction (S3−S1−S2) | 25.4 | — (agrees with S5 ✓) |

- Candidates 15,122; matches 2 (`theme/global.ts`, `theme/tokens.ts` —
  the only `@reference-ui/neo` importers); retained 15,122; needle
  `includes` ×75,600 with 2 hits; regex ×~2.
- Read 4,358,806 chars; retained 5,753,070 chars (contents + paths —
  the 5.75 MB C3 handoff across N-API; seam-scout's ground to cost).
- Worker-scan reconciliation: syscalls 262 (S2-cold 267 equivalent) +
  split ~25 + bundle ~11 + glob-JS ~15 + GC/first-run ~40 → 358 ✓.
  (Warm S2 192 understates the worker's one-pass cold-cache reads by ~70;
  the CENSUS numbers, not S2-warm, are authoritative for ceilings.)

## 7. Ranked backlog (counts-first; fences explicit; filler separated)

Bars: solo LAND ≥15 ms AND ≥1.5% (~14.3 @950); per-phase floor 5 ms
(BANK-track: mechanism + identity + joins a sum); CUT below 5 without a
beating shape. All topics on the seed-7 enterprise load.

### T1 — scan path-identity: prefix-strip + fused checks (BRIEFABLE)

- Where: `packages/reference-neo/src/fragments/lib/scanner.ts`
  `splitScan` (relative 18–23wt incl + resolve ⊂ relative + normalizeString
  3–4 + StringSplit 5 + StringAdd 7–8 + Set/endsWith micros) — 15,122
  `relative(cwd, abs)` × ~1.3 µs + 2 splits/file + 75.6k needle `includes`.
- Weight: splitScan 29/29 incl (flame ×2) = stage 25.4 sub / 22.8 recon.
- Fantasy ≈ 20–23 (remove resolve+normalize+splits; keep 1 fused segment
  walk + needle includes + retention alloc). Realistic ≈ 10–15 (prefix strip
  + non-prefix fallback to `relative()` + fused dot/ignore/ext checks).
- Track: LAND-possible (15/1.5% within reach) with BANK fallback (≥5).
- Fences: shot2-KILL (still reads every file — identity only, no skip);
  COLLECT (native matcher untouched); GAPS-1/parallel-CUT (serial order kept);
  seam (retention bytes identical — marshal-neutral by construction).
- Falsification bar: census-first — split relative vs includes vs
  retain-alloc on the real candidate/content arrays (S5 pattern); then diet.
  LAND needs 8-pair ≥15 ms AND ≥1.5% + 4-scale byte-identical
  matches+retention + suites green; BANK needs ≥5 ms + mechanism + identity
  into a sum; CUT below 5 ms or on any matches/retention divergence.
  Standing falsifier: any out-of-cwd/edge path the strip mishandles.

### T2 — fragment-bundle fixed cost (BRIEFABLE, small)

- Where: `fragments/lib/runner.ts` `bundleFragments` → `microBundle`
  (esbuild) × 2 matches (theme/global.ts, theme/tokens.ts) + `kevent` 11/11
  flame wait.
- Weight: 11.0 stage (warm; 21–22 cold service start) + kevent 11.
- Fantasy 11 / realistic 5–8 (one build vs two `microBundle` calls?
  transform-vs-build? service already warm via config phase — the remaining
  11 is per-call overhead + Go + IPC wait; crew proves the split).
- Track: BANK (≥5 + identical bundle bytes + suites; joins a sum).
- Fences: none worked (unexamined ground); evaluate-phase contract
  (bundle bytes feed collectors — byte-identity gate); seam untouched.
- Falsification bar: identical `bundle` strings on 4 scales + ≥5 ms 8-pair;
  CUT below 5 or on byte drift. Standing falsifier: the 11 ms is pure
  service-IPC wait with no reducible handle.

### F1 — single-read native path (FILLER, architectural — not a crew topic)

- Shape: 30,562 reads, 2/file (data + ~0.5 µs EOF-confirm) ≈ 10 ms fantasy;
  a `pread(fd, size, 0)` single-read native path + C3-in-reverse (bytes born
  native-side, retention never crosses TS→RS) also deletes the 5.75 MB
  marshal handoff. Realistic ~0–5 after binding + page-cache realities.
- Stays filler until someone files a soundness design for the scan/compile
  contract change + seam-cost proof (seam-scout's ground borders it).
  No crew without that filing.

### F2 — two-walk merger (FILLER, contract sketch — not a crew topic)

- Shape: fg walk (24.5, incl 9.5 readdir + 15 JS) + native backfill walk
  (sorted 12–13 + matches 2–4 + 35 dir opens 0.5) both enumerate the same 35
  dirs; retention is complete (0 backfill reads), so the native walk is a
  pure completeness VERIFY. Fantasy ~12 (one walk's JS) / realistic ~0–5.
- Stays filler: deleting the verify changes the C3 trust contract (C1
  keep-alive semantics ride the union walk). Needs a contract design, not
  a brief.

### N1 — compile file-IO: entry stats + resolver probes (NEIGHBOR LEAD, not scan)

- Shape (census + flame `is_file → stat` 9wt): 3000 entry `is_file` stats
  (hosts/entries.rs:24) + 120 recipe entries + 31 failed tsconfig opens +
  ~183 resolver probes (60 node_modules + ~123 extensionless targets;
  module_graph DiskFs via AtomicFs memo) ≈ 8.2 + 0.3 + 0.8 ≈ 9.3 ms.
- Fantasy 8.2–9.3 / realistic 3–5 (staged-membership instead of disk-probe
  for known sources? probe memo already per-load — crew proves the miss
  pattern). BANK-track at best; compile/extract ground — hand to a compile
  crew with this census attached. Falsification: reproduce entry set +
  import graph on 4 scales + ≥5 ms; CUT below.

## 8. Dry rooms (named, never re-seeded)

- **File opens (232–242 ms)**: count-minimal (exactly-once ×3) + unit-floor
  (15.87 CUT stands, 15.3–16.2 band) + skip-KILLED (shot2) — the triple
  fence. No lever exists: DRY.
- **Dead-file 183–194 ms**: shot2-KILLED, and this census STRENGTHENS the
  kill (minimal count + floor unit + content-undecidable). Never brief.
- **Reads-whole (19.5–20.5 ms)**: bytes exact-once ×3; EOF-confirm half is
  F1-filler only. DRY as a room.
- **Closes (~9 ms)**: one per fd, 0.6 µs, already `$NOCANCEL`. DRY floor.
- **Native backfill walk (sorted 12–13, matches 2–4)**: COLLECT-landed;
  no beating shape filed. DRY.
- **Read-loop JS micros**: no self-frame ≥5 (strings/GC diffuse); effects
  die with retention (memmove-precedent). DRY.
- **GC/alloc (7–12 wt)**: consequential (15k strings + 12k Dirents + fg
  objects). DRY standalone.
- **12k-entry util readdir (7.4 ms wall / 5–8 enum)**: a directory lists at
  its size; no skip, no handle. DRY (inside F2-filler only).
- **config/evaluate/publish/startup**: fences (unchanged, unscored here).
- **Whole-sync CUTs (26 + per-phase) + heavy tracks**: all stand (repro3
  §dry-rooms, unmodified by this recon — compile closeout certified zero
  banked-pending; recipepath HELD→CUT closed the last topic).

## 9. Honest arithmetic for the captain

Scoreboard ≈ 950 (census B/C; instrumented flames 961–974, +2–3% overhead).
Scan ≈ 358–375, of which kernel/file floor ≈ 292–299 is unaddressable
(triple-fenced) and userspace ≈ 66–72 splits into T1 (~20–23 fantasy) +
T2 (~11) + diffuse/GC/first-run (~35, no handle).
Stacking the ranked backlog at fantasy: 950 − 20 − 11 ≈ **919**; at
realistic: 950 − 12 − 6 ≈ **932**. The filler (F1/F2) is unshaped by
definition and stacks nothing. This supersedes repro3's 917/935 compile
ceiling the way a new survey supersedes an old map: the compile backlog is
EMPTY (closeout-certified); the scan backlog is 2 topics, 31 ms fantasy,
~18 ms realistic. The 700 target remains unreachable single-threaded by
≈230+ ms; no further serial re-seed exists after T1/T2 without new filed
evidence.

## Verdict

(EMPTY = no further ranked topics after T1/T2; 919 = stacking floor at
100%-fantasy / ≈932 realistic. F1/F2 are carried filler, N1 is a fenced
neighbor lead — none of the three is a crew topic.)

RECON-VERDICT: 2-TOPICS scan-identity 20/12ms | EMPTY 919

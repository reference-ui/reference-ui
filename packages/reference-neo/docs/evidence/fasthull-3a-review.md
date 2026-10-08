# Fasthull 3a review — lane A (C3 single read) verdict

Reviewer memo. INDEPENDENT: not the profiler or implementer. All claims
below re-derived firsthand in tree `voyage/hyperspace-perf-3-a`; the
lead-authored architect memo was treated as untrusted input. No product
edits; this file is the only tree write. Box shared with 5 siblings —
conditions, medians, and spread reported per run.

Verdict: **GAPS** — 2 fixable findings, both with file:line particulars
below (step-1 narrowing, match-before-filter). Everything else verified:
soundness re-derived sound (incl. D1 lazy), bytes identical at every
scale + churn, stability green modulo pre-existing SITE-54 (proven red
on clean base), boundary adjudicated.

## GAPS-1 — Step-1 parallel scan regresses (REQUIRE narrowing)

Reproduced firsthand with a reviewer-owned probe (`/tmp/lanea-review-f1.mjs`,
fresh process per rep, interleaved arms, warmup discarded, load ~2.3):

- Enterprise (kept 15,122-file repo): serial 228–231 (med 230.1) vs
  parallel 313–317 (med 314.7) → **+84.6ms**, spread ±2ms. Matches
  identical (2) both arms.
- Medium (kept 1,276-file repo): serial 22.0–22.3 (med 22.2) vs
  parallel 38.9–40.1 (med 39.8) → **+17.6ms**, spread ±1ms.

Direction matches the implementer's F1=280>237; magnitude larger because
my probe times the whole scan (glob+read+match). The arc must not ship a
measured regression. REQUIRED FIX (`packages/reference-neo/src/fragments/lib/scanner.ts`):
keep the async signatures (all callers already await) but restore the
serial read path inside them — `fg.async` (:183) → `fg.sync`, and
`readAllOrdered` (:93–109, 64-worker pool) → serial in-order loop
(`readFileSync`, the exact old path, or serial `await readFileOrSkip`).
Expected recovery ≈ +85ms enterprise, putting the arc at ~−285ms vs base
(see §Bench). No caller changes needed.

## GAPS-2 — matches ⊆ retention is a silent spec change (REQUIRE fix)

Base `scanForFragments` reads ALL fg hits (ignore = node_modules + d.ts
only) and matches over them — including IGNORE-dir sources (`dist/*.ts`,
`build/`, …) and non-source extensions under broad includes. The lane
filters retention (IGNORE+extension) BEFORE matching, so those files can
never match: any repo with fragment signals there silently loses fragments
→ different theme eval → different bundles, no diagnostic. The architect
memo only ever ruled dot/d.ts match-emulation; retention-gating of matches
was never ruled. `agentneo` 173/173 proves no such fixture exists, not
that no repo regresses — the keep-justification is unprovable in principle.
REQUIRED FIX (`scanner.ts:164–230`, ~5 lines): read all candidates
pre-filter (`readAllOrdered` over `candidates`, not `retained`), compute
`matches` over every successfully-read candidate (dot + d.ts emulation
only — exact old semantics), and build `scannedSources` as the
IGNORE/extension-filtered subset. Cost is zero vs old code (it read the
same set). Add one arm to `scan-retention.test.ts`: a `dist/`-nested +
a `.json` file carrying the neo import must MATCH (old semantics) while
staying out of retention.

## 1. Soundness re-derivation (all sound)

(i) Scan-set equality — SOUND. TS mirror re-checked corner by corner:
ext gate (`.d.ts`→`ts` both sides; extensionless/uppercase excluded both
sides), IGNORE dirs (dir-segments-only, file named `dist` kept both
sides), dotfiles (`dot:true` retention + `dot:false` emulation with
`..`-safe segments), d.ts (basename rule ≡ old `**/*.d.ts` ignore),
empty→omit-`files` (both `sync/index.ts:111` and `worker-phases.ts:108`),
path-string identity (same unmodified root both sides; differential runs
under symlinked `/tmp`), read-error/race (union backfills TS read-misses;
race strictly narrowed). Union-fill is exact: `collect_candidate_paths`
(`sources.rs:102–138`) duplicates `scan_dir` traversal/IGNORE/ext/scope
line for line; provided-wins + scope-symmetric, so equality holds by
construction; files-less path is the verbatim old scan (const-hoist only,
verified against HEAD). Differential 4/4 green firsthand (star, negation,
negation-only, empty-match), each arm asserting
files≡rootDir≡production byte-identity. Rootless note verified in
`includes/mod.rs:84–92` (relative candidates only with root; production
always has `declarationRoot`).

(ii) Parse-error preservation — SOUND. Replay identity verified by
construction: `merge_constants_ordered` walks source order 0..n,
`replay_parse_error` captures exactly the reporter's inputs
(`to_string` + first-label offset, same `as u32`), `push_parse_error`
is the old body verbatim. Panicked branches mirrored (skip
constants/record/bag, flags set, errors kept); merge is a single
in-order loop (old order-sensitive semantics preserved); `unpanicked`
index, partition catalog, and analysis SourceId slots all rebuilt in
the same input order. SITE-57 green firsthand (its `Broken.tsx` streams
— verified quoteless/needle-free — so the station exercises the new
path end to end: main-phase error + trace warning both preserved).
New tests 5/5 + 3/3 firsthand (below); the located-error test pins exact
line/col/message for the Broken shape.
(iii)-2 reinterpretation — AIRTIGHT: every ESM re-export form needs a
string specifier (quotes → retained), so a streamed barrel is unwritable;
`export {X}` without `from` is a local binding, not a hop; the test pins
live→retained-barrel→streamed-target, the only meaningful shape. No
quoteless from-edge exists (streamed records carry no outgoing edges;
incoming edges route through the staged record identically).

(iii) D1 lazy deviation — SOUND, and the eager-cost claim is TRUE.
`collect_inner` (`scope/collect/mod.rs:58–90`) bakes against the FINAL
merged project (`strip_stale` mutation set + `ProjectBag`/fallback
lookup for pure-fn/call-init capture) — so eager refinement during the
transient staging pass would read a partial project and differ; doing
it after the merge needs the dropped program back, i.e. a second parse
per streamed file (~65ms CPU per the profiler's parse figure, erasing
the ~10ms yield). The architect's eager-exactness argument missed this
project dependence; the implementer is right that spec-eager was wrong
or net-negative. Lazy (`refine_streamed`, `resolver/mod.rs:281–295`)
re-parses identical bytes through the identical on-demand
`collect_origin` with the final project, memoizes into `refined`
(checked `:254`, inserted `:293`, plus the `valued` map), and holds
only one transient parse at a time (RSS co-residency avoided; worst
case = one extra parse per IMPORTED streamed file, ~0 on bench since
dead utils have no importers; parsed-clean-at-staging + deterministic
parse makes panicked-re-parse unreachable, with a safe External
fallback regardless).

(iv) Logical artifact — VERIFIED on bytes twice: implementer's kept
enterprise repo (36,784 B, keys sans `files`) and my own `--keep` run
(13,535 B small, `files` absent). Both writers suppress
(`sync/index.ts:131`, `worker-phases.ts:125`).

## 2. Bench (firsthand, same-session base comparison)

Conditions: load 2.3–3.1 throughout, 5 siblings. Verdict-relevant
comparison is lane vs scratch worktree at wave base `d1b0e0549` (clean,
own pnpm install + NAPI + JS builds), run minutes apart — NOT
`/tmp/lanea-baseline`, which is single-run and heavily contended
(enterprise 2.90s includes contention; my base median is 1684ms).

| scale | base (6 runs med) | lane (6 runs med) | Δ |
| --- | --- | --- | --- |
| enterprise sync | 1684ms (±7) | 1482ms (±15) | **−200ms (−12%)**, clears spread 10× |
| medium sync | 209ms | 197ms | −12ms |
| small sync | ~101ms (ex-cold) | 97ms | −4ms, noise |
| churn sync | 4056ms | 4009ms | −47ms, unregressed ✓ |

Bytes: css/data raw+gzip IDENTICAL base≡lane at every scale + churn
(ent css 2,867,925 B = 2.7MiB DONE, gzip 270,510; churn total
8,402,765 EXACT). No regrowth anywhere.

Caveat (methodology, not the lane): an explicit `--seed 7` flag
produces a DIFFERENT "medium+custom" load than the default seed-7
suite (css 379,308 vs 348,780) — all verdict numbers above use the
default no-flag invocation matching the baseline.

Scored-RSS (report-only per brief, no promise): lane enterprise med
~352 MiB (range 340–358, 6 samples) vs base med ~314 (range 295–331,
6 samples) → **+38MB reproduced**; churn med 630 vs 556 → +74MB, also
reproduced (distributions non-overlapping). Likely the files
round-trip residue (4.2MB `scannedSources` + ~6MB request string held
through publish pre-GC, plus native magazine residue) — not fully
attributed, and true-peak (the streaming prize) is unmeasured here.
Flagged for the captain's merge rule; not a GAPS trigger per orders.

## 3. Stability (firsthand)

- `agentrs c atomic`: 541/541 ✓ (3 union + 5 stream tests confirmed
  by name). `agentrs v atomic`: 300/301, ONLY SITE-54 red — and SITE-54
  fails IDENTICALLY on the clean-base scratch worktree (same test) and
  in isolation, across 5 waves of lane history: pre-existing,
  exonerated. Mechanism-impossibility proven too: SITE-54 compiles
  files-less (union unreachable), its 8 inputs ALL retain (gate probe —
  streaming inapplicable), and the disk-scan path is verbatim-identical
  to HEAD. Main gate is arbiter per brief.
- SITE-57 green ✓ (exercises the streamed path). `agentrs v contracts`
  13/13 ✓. Neo unit 235/235 (31 files) ✓ incl. differential 4/4 +
  base 10/10 run explicitly. tsc clean. `agentneo run` 173/173, zero
  failures in last-run.json ✓.
- `agentrs q` on the 5 changed RS files: 0 violations, 3 warnings —
  identical set to the implementer's report (lib.rs was already 416
  lines at HEAD → pre-existing; resolver crosses 365 only via this
  lane, see advisory). `agentneo q` on 4 changed neo files: 0 errors,
  2 warnings, both pre-existing (base/index.ts already 400 lines;
  mergeCollectedSpec untouched).

## 4. Diff vs boundary (§C3(d2))

Listed files all touched as specced (`scanner.ts`, `base/index.ts`,
`sync/index.ts` hunk, contracts request section — additive `files?`
only, no table/shape change; `sources.rs`, `lib.rs` parse/staging
hunks, `resolver/mod.rs`; `collect.rs` untouched — boundary is a
max-set, lazy needs no merge change). Unlisted touches adjudicated:
`runner.ts` = mechanical single-await ripple on the only other
`scanForFragments` caller ✓; `worker-phases.ts` = 2-line
measurement-mirror (deepsee duplicates sync's request assembly; without
it the buckets would mismeasure the new path) — AGREE with lead KEEP ✓;
`oxc_diagnostics` Cargo add = REQUIRED, verified by grep that
oxc_parser 0.115 has zero `pub use` and only a private
`use oxc_diagnostics::OxcDiagnostic` (same-pin additive, lock +1 edge) ✓;
new files = mandated differential + stream split + (iii) tests ✓.
Lane-B hunk (`hosts::resolve(request, sources, session)`) byte-identical
(line moved 169→183 only). `hosts/*`, `analysis/*` (incl. `for_compile`,
kept for gates tests), `compile-files.ts`, `core/*`, `package.json`
untouched ✓.

## Advisories (non-blocking)

- `resolver/mod.rs` 364→421 lines crosses the 365 soft limit via this
  lane (q warning, gate passes). Could shed ~18 lines by moving
  `StreamedSource` next to its consumer in `stream.rs`; still over —
  accept or split at lead's discretion.
- `ScanOptions.exclude` doc comment (`types.ts:44`) still says the
  default covers d.ts; now node_modules-only with d.ts emulated for
  matches. One-line doc touch on the fix turn.
- `prepared` (with 4.2MB `scannedSources`) is held through publish
  (`sync/index.ts:126` uses it post-compile) — the cheapest scored-RSS
  relief candidate if the captain wants it pursued, unproven.

## Fix-turn checklist for the implementer

1. `scanner.ts:183` `fg.async`→`fg.sync`; `scanner.ts:93–109`
   pool→serial in-order reads; keep async signatures (GAPS-1).
2. `scanner.ts:164–230` match-before-filter: read all candidates,
   matches over all read successes, retention as subset; +1
   differential arm pinning a `dist/`+`.json` fragment match outside
   retention (GAPS-2).
3. Re-run: differential, `agentrs c/v atomic`, one enterprise bench
   (expect ~−285ms vs base), bytes check. No re-review of soundness
   needed — both fixes shrink the diff toward already-verified shapes.

Reviewer: GAPS — sound arc needing 2 small fixes (serial-scan narrowing, match-before-filter).

## Round 2

Round-2 reviewer memo. INDEPENDENT: not the profiler, implementer, fix
agents, or round-1 reviewer. All claims re-verified firsthand in tree
`voyage/hyperspace-perf-3-a`; round-1 memo and fix-turn log treated as
untrusted input (round-1's soundness derivation spot-checked, not redone:
RS refs still exact — `sources.rs:102` collect path, `resolver/mod.rs:281`
refine, lane-B hunk `lib.rs:183`, resolver 421 lines). No product edits;
this section is the only tree write. Box shared with 5 siblings; load
2.0–2.6 through the bench window.

Verdict: **VERIFIED** — both GAPS fixes in and correct, bench confirms
−189ms vs round-1 base with bytes identical, stability holds modulo
pre-existing SITE-54. **Attached flag (not a verdict trigger): scored-RSS
regression vs base persists** — my run sits at round-1 lane level, above
base by ~+45MB at the median; the relief median did not reproduce (report
below). Rides to the captain's merge rule per orders.

### R2.1 The 4 fixes (diff-verified firsthand)

(a) GAPS-1 serial narrowing — IN and CORRECT. `scanner.ts:89–91`
`readAllOrdered` is `files.map(readFileOrSkip)` (the exact old sync read
path) inside the kept `async` signature; `:166` is `fg.sync`; the 64-worker
pool is GONE (only remaining mention is the explanatory comment; the one
`Promise.all` in `runner.ts:32` is pre-existing esbuild bundle fan-out,
not scan). `scanFragmentSources`/`scanForFragments` stay `async`, so no
caller changes. Scan matches exact: serial in-order reads preserve order,
and the differential (5/5, incl. the new arm) pins match sets.

(b) GAPS-2 match-before-filter — IN and CORRECT. `scanner.ts:175` reads
ALL candidates, `splitScan` `:197–199` matches over every read success
with dot/d.ts emulation only (exact old semantics — `readFileOrSkip` and
`matchesAnyPattern` byte-unchanged), `:201–203` builds retention as the
IGNORE/extension-filtered subset. New arm `scan-retention.test.ts:220`
pins a `dist/`-nested + a `.json` neo-import signal MATCHING while staying
out of retention — green firsthand (differential 5/5).

(c) Doc line — IN. `types.ts:44` now reads node_modules-only default with
d.ts match exclusion emulated.

(d) RSS relief — IN and SAFE. `sync/index.ts:116–117` clears
`prepared.scannedSources` and `request.files` post-compile, pre-publish.
`createPortableFragmentBundle` (`base/index.ts:132–141`) touches only
`upstreamFragments` + `localFragmentBundles` — it cannot observe the
cleared fields; same for the eval script path (which ran pre-clear
anyway), and `compile-request.json` already spread `files: undefined`
explicitly. Bytes cannot move; bytes check below confirms.

Diff-the-diff: full lane `git diff d1b0e0549 --stat` file list is
identical to round-1 §4 + the implementer file list (plus evidence memos,
the perf-log line, and lead-restored `reports/latest`). Every non-fix
hunk re-read and matches round-1's account: runner single-await,
worker-phases 2-line mirror, base/lib/index re-exports, native.ts +
contracts additive `files?`, Cargo adds, `tests/mod.rs`. No other product
change crept in. Zero RS/content drift this turn (all round-1 RS line refs
exact).

### R2.2 Sign-flip adjudication — completer CONFIRMED (artifact)

My own enterprise bench, default invocation, NO `--seed` flag
(`pnpm bench:neo --scale enterprise --runs 6`, load 2.0–2.6, seed-7
default load: 3,000/12,000 files, 7,527 cssCalls):

- sync sorted: 1490.4 1493.3 1493.5 1496.6 1500.5 1509.5 → **med 1495.0**,
  inside the reviewer's 1482±15 band (1467–1497), +5 vs completer's 1490.
- Δ vs round-1 base med 1684 (same-session scratch worktree, stands):
  **−189ms (−11%)**. Fix is neutral-or-better; no hidden +35 (that would
  read ≥1517). I did not redo the base comparison per brief — my run is
  consistent with round-1's lane number, so round-1's base-vs-lane stands.

### R2.3 RSS — reported, not promised; relief NOT reproduced

Scored peak-RSS sorted: 341.3 347.9 354.7 363.0 366.4 371.0 → **med 358.9**
(rssAfter med 337.3). Against round-1 lane ~352 (range 340–358), completer
relief 339.3 (329/339/350), base ~314: my run sits at round-1 lane level,
~+7 above the lane median and ~+20 above the relief median, ranges
overlapping all three. The −13MB relief median does NOT reproduce in my
window — consistent with the completer's own caveat (3 samples, no
same-window no-relief control; peak likely lands at compile pre-publish).
Direction vs base is honestly still UP (~+45MB at this window's median;
round-1 said +38, completer +25 — all three windows agree on the sign).
**The +25MB-vs-base regression flag rides to the captain either way.**

### R2.4 Stability — holds modulo SITE-54

- `agentrs c atomic`: **541/541** ✓ (cpu-gate).
- Neo unit: **236/236 (31 files)** ✓ (+1 vs round-1 = the new GAPS-2 arm).
- Explicit differential **5/5** + base **10/10** ✓.
- `agentrs v atomic`: **300/301, ONLY SITE-54 red** — identical failure to
  round-1 (same test, same file), proven red on the clean-base scratch
  worktree in round 1; main gate is arbiter. Not chased.
- `tsc --noEmit`: clean ✓.
- `agentneo run` 173 SKIPPED with stated reason: nothing RS/parse-adjacent
  changed this turn, and the scanner fix restores base match semantics —
  the semantics all 173 cases already pass under (round-1 lane ran 173/173
  on the stricter retention-gated matching). The differential pins the
  emulation exactly, so no doubt-condition obtains.

### R2.5 Bytes — identical, no regrowth

Ent css **2,867,925 B EXACT** (= 2.7MiB DONE), gzip **270,510 EXACT**;
data 318,688 / gzip 27,262, total 3,186,613 — all match the completer's
numbers exactly; cssCalls 7527, same plan as baseline. No regrowth: PASS.

Reviewer2: VERIFIED — both GAPS fixes in and correct, −189ms vs base with bytes identical, stability holds modulo SITE-54; scored-RSS-vs-base regression flag attached for the captain's merge rule.

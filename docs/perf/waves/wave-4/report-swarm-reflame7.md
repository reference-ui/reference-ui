# reflame7 REPORT: wave-4 post-F1 flame refresh (2 reconciled captures + phase table + ring data)

Counts and captures ONLY. No diets, no hypotheses, no implementation.

## Identity

- Base: `a4429aa52ba8c96143ac2f3d63dfc7d6ede7144d` (verified `git rev-parse HEAD`
  first act; brief prefix `a4429aa52` matched; tree clean at start).
- Release `.node`: `6738ad18a5a0bb248a1362772c5b516f34f2ded965a1b78890c0265308dab73f`
  (`packages/reference-rs/dist/native/virtual-native.darwin-x64.node`, 8,963,840 B
  vs repro6's 8,889,408 B — F1 native delta present).
  Built once via `pnpm agentrs b`; sha verified before AND after EVERY capture
  (4/4 stable, harness aborts on drift). `build:js` ran once (gitignored;
  required — see DX note).
- Tip delta vs repro6 (`ff64ab75b594..a4429aa52`, verified): exactly TWO production
  commits — `36953b4d4 perf(scan): Formula-1 B'' native single-read + C3-in-reverse
  retention` and `11e821a1a feat(mcp): catpost + prelower` (sync 0-confirm
  −3.22/−0.35% noise per INT-W4-SCANT1-era claims); all other commits docs.
- End state: `?? docs/evidence/flamegraph/enterprise-repro7{a,b}/` + this REPORT
  only. No production code changes. No commits. No LOG writes. No stash.

## 1. Fresh flames (2 reconciled captures, this exact tip)

- `/tmp/swarm-reflame7/enterprise-repro7a/` — syncMs **925.13**, RECONCILED
  (syncDelta 0.000 / workerDelta 0.000; preMain 0wt, postWorker 5wt).
- `/tmp/swarm-reflame7/enterprise-repro7b/` — syncMs **924.06**, RECONCILED
  (syncDelta 0.000 / workerDelta 0.000; preMain 0wt, postWorker 6wt).
- Filed as `docs/evidence/flamegraph/enterprise-repro7a/` + `enterprise-repro7b/`
  (procedure `agentrs-flame/3`, pin `a4429aa52ba8`, **dirty:false**; each bundle:
  `profile.json.gz` + presymbolicated sidecar + `phases.json` + `meta.json` +
  `summary.md` + `callers.md` filed via the query layer, no re-record).
- Protocol fidelity: locked enterprise load (3000 style + 12000 dead + 120
  recipes, 7527 css calls, seed 7), 1000 Hz samply, `--perf-basic-prof`,
  same-run phase buckets, `--no-build` prebuilt `.node` (sha-guarded; no rebuild
  could perturb the block). One cold unscored tip-verify run first (1322.0,
  discarded, first-run-after-rebuild — same shape as recon4's 1313.8 and
  reflame6's 1157.0); both scored captures warm.
- Bench lock: first grab 15:07:30Z released 15:07:5x (staging miss — flame worker
  needs the RS JS dist, cold run failed pre-timing, ZERO scored data, disclosed
  in claims); re-grab 15:07:54Z, cold + 7a + 7b in ONE timed block, two-step
  release 15:08:08Z. Claims lines filed before every hold + after every release.
  Noise disclosed: box load 7.3→3.9 settling at grab (ambient desktop: Weather
  widget spike, WindowServer, Cursor); no competing samply/worker PIDs observed
  during the block; zero scored-set discards.

## 2. Phase table: repro7a/b vs filed repro6a/b (wt ≈ ms)

Stopwatches are `syncTotal`-basis (phase sums; worker syncMs runs +0.09 above —
same mark granularity as repro6). Repro6 = pre-F1 tip, so 7−6 isolates F1+mcp.

| phase | pre 6a | pre 6b | 7a | 7b | Δ 7a−6a | Δ 7b−6b | Δ 7a−6b | Δ 7b−6a |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| syncTotal | 963.3 | 960.6 | 925.0 | 924.0 | −38.3 | −36.7 | −35.6 | −39.4 |
| compile | 525.7 | 521.6 | 488.5 | 486.3 | −37.2 | −35.3 | −33.1 | −39.4 |
| scan | 349.3 | 344.0 | 349.3 | 350.0 | +0.0 | +6.1 | +5.3 | +0.7 |
| publish | 56.8 | 59.9 | 52.4 | 53.2 | −4.4 | −6.7 | −7.5 | −3.6 |
| config | 28.4 | 28.2 | 28.4 | 31.6 | +0.1 | +3.4 | +0.2 | +3.2 |
| evaluate | 3.2 | 6.9 | 6.4 | 2.8 | +3.2 | −4.2 | −0.5 | −0.4 |
| startup (outside sync) | 127.3 | 121.8 | 126.9 | 124.9 | −0.4 | +3.1 | +5.1 | −2.3 |

Exact means (7a/7b): sync 924.4982 (syncMs-basis 924.5937) · compile 487.4072 ·
scan 349.6766 · publish 52.7980 · config 30.0188 · evaluate 4.5511 ·
startup 125.9141 · syncResidual 0.0467 · workerTotal 1050.4155.

Straddles: 7a↔7b sync 1.1, compile 2.2, scan 0.7, publish 0.8, config 3.1,
eval 3.6 (the known A↔B noise swap, sums flat);
6a↔6b sync 2.7, compile 4.1, scan 5.3, publish 3.1.

F1 warm-harness cross-check (counts only; F1 report stage medians):
scan −26.76 (350.23→323.47), compile −25.33 (496.32→470.99), eval/publish flat.
Flame means: scan **+3.0** (346.64→349.68 — the −26.76 does NOT reproduce under
instrumentation), compile **−36.2** (523.64→487.41 — reproduces and exceeds
−25.33 by −10.9), publish −5.5 (reversion to the 52–53 cluster; 6b 59.9 was
reflame6's own flagged high edge — 8-capture history 52.1–59.9, 7a/7b in the
low cluster), config +1.7 on a 7b-only 31.6 edge (six-capture band 28.1–28.7;
7a 28.4 in-band; single-capture edge, no second witness), eval −0.5 (swap).

## 3. Lib splits (self-weights, whole profile)

| lib | 6a | 6b | 7a | 7b |
| --- | --- | --- | --- | --- |
| kernel | 422 | 423 | 407 | 398 |
| .node (Rust-direct, whole) | 250 | 249 | 243 | 243 |
| malloc | 136 | 156 | 157 | 166 |
| node | 159 | 151 | 149 | 137 |
| platform | 98 | 76 | 73 | 85 |
| JS (perf map + jit) | 12 | 16 | 14 | 12 |
| dyld/libc/other | 14 | 11 | 8 | 9 |
| weight sum | 1091 | 1082 | 1051 | 1050 |

Compile-phase self (scope 525/519 → 488/488):
.node 250/247 → 236/234 (−14/−13) · malloc 130/145 → 143/143 (+13/−2) ·
platform 78/60 → 58/62 (−20/+2) · kernel 51/55 → 45/43 (−6/−12) ·
node 15/11 → 5/6 (−10/−5). Mean decomposition of the −36.2 compile wall:
.node −13.5, platform −9.0, kernel −9.0, node −8.5, malloc +5.5 — closes.

Scan kernel-vs-userspace split (exact per-phase lib self; scope 349/344 → 349/349):

| scan (wt) | 6a | 6b | 7a | 7b |
| --- | --- | --- | --- | --- |
| kernel | 298 | 298 | 295 | 287 |
| node | 40 | 33 | 28 | 20 |
| JS | 5 | 7 | 4 | 5 |
| malloc | 1 | 1 | 10 | 18 |
| platform | 1 | 2 | 4 | 8 |
| .node (scan-native, NEW) | 0 | 0 | 6 | 8 |
| libc/other | 4 | 3 | 2 | 3 |
| userspace (= scope − kernel) | 51 | 46 | 54 | 62 |

Scan kernel leaves: `__open` 239/239 → 246/236 (flat — opens unchanged by
design) · `read` 24/31 → 21/15 (mean 27.5 → 18.0, directionally the halved
reads) · `__close` 14/9 → 8/16 (straddles) · `kevent` 10/10 → 12/11 ·
`__getdirentries64` 6/6 → 6/6 (identical).

F1-path confirmation counts (both captures): `__open` issuers flipped from
`uv__fs_work [node]` 245/239 (repro6) to `std::sys::fs::unix::File::open_c
[.node]` 246/236 (repro7) with 4/2 residual uv opens — same open count,
native issuer. Scan-phase JS inclusive 332/325 → 33/32 (TS loop off-stack);
`reference_virtual_native::atomic` inclusive 294/294 + `atomic::scan` 291/292
(native on-stack). F1's scan mechanism is active in both flames; its −26.76
wall win is nevertheless absent here (see §4).

## 4. Overhead ratio + reconcile ×2 (vs 872 bench pin, 870.03 warm 8-pair)

Numerators are worker-syncMs-basis (matches both anchors' scorer):

| anchor | 7a | 7b | mean |
| --- | --- | --- | --- |
| 872 bench pin (fresh-process x5, same tip code) | +6.09% | +5.97% | **+6.03%** |
| 870.03 warm 8-pair B-arm (F1 tip) | +6.33% | +6.21% | **+6.27%** |

History: repro2 +3.2%, repro4 +3.8% (vs contemporary scoreboards),
repro6-mean vs F1 A-arm 922.42 +4.30%. The 7a↔7b pair agrees to 1.07 ms
(0.12% — tighter than any prior pair), so the +6.0/+6.3% is systematic, not
noise; it sits 2.2–3.1pp above the historical band. Phase decomposition of
the flame-vs-warm gap isolates it (means; B−A warm = F1's prize):

| overhead (flame − warm) | pre-F1 (6−A) | post-F1 (7−B) | Δ |
| --- | --- | --- | --- |
| scan | −3.59 (−1.0%) | +26.21 (+8.1%) | **+29.80** |
| compile | +27.32 (+5.5%) | +16.42 (+3.5%) | −10.90 |
| remainder (config+eval+publish) | +15.92 (+21%) | +11.94 (+15.8%) | −3.98 |
| total | +39.66 (+4.3%) | +54.56 (+6.3%) | +14.91 |

Rows close exactly (±0.01 rounding). Verdict on the ×2 check: RECONCILE
(a↔b) PASSES — both captures RECONCILED to 0.000 with 1.1 ms sync agreement;
the overhead-ratio-vs-history leg is FLAGGED — the expansion concentrates
wholly in scan (+29.80), partly offset by compile (−10.90, F1's removed
JSON/clone work was disproportionately taxed under instrumentation) and
remainder (−3.98, the publish 6b-edge reverting). Scan userspace +3/+16
(node −12/−13 eaten by malloc +9/+17, platform +3/+6, scan-native +6/+8)
with kernel −3/−11 nets the flat scan wall.

memmove/diffuse note: memmove 56/49 → 46/51 (unattributed 21/20 → 9/14);
top caller `finish_grow` 6/5 — diffuse, no caller >6 (same verdict as the
wave-2 room note; effects die with parents). memcmp 36/23 → 23/27, top
`find_property` 6/6. Rust-direct self-weight: whole-profile .node 243/243;
compile-scoped 236/234 (48.31%/48.12% of compile wall); scan carries 6/8
(new post-F1) + publish 1/1. Cross-build note: compile-scoped .node ran
204/220 (4a/4b) → 250/247 (6a/6b, +36 on zero native delta, reflame6-called
attribution jitter) → 236/234 (7a/7b); within-pair comparisons are sound,
cross-build .node-self deltas mix layout jitter.

## 5. RING-DATA (means of 7a/7b; every denominator named)

Ring-1 — 3 wedges over **syncTotal mean 924.4982**:
- scan **349.6766 (37.82%)**
- compile **487.4072 (52.72%)**
- other **87.4144 (9.46%)** = config 30.0188 (3.25%) + publish 52.7980 (5.71%)
  + evaluate 4.5511 (0.49%) + syncResidual 0.0467 (0.01%)
- Per-capture: 7a scan 349.3068 / compile 488.5032 / other 87.2271 over
  925.0371; 7b scan 350.0463 / compile 486.3112 / other 87.6017 over 923.9592.

Ring-2a — inside compile over **compile-wall mean 487.4072**:
- Rust-direct (compile-scoped .node self) **235.0 (48.21%)**;
  gap **252.4072 (51.79%)**
- Per-capture: 7a 236/488.5032 = 48.31%, gap 252.5032 (51.69%);
  7b 234/486.3112 = 48.12%, gap 252.3112 (51.88%)
- Gap detail over the same denominator: malloc 143.0 (29.34%), platform 60.0
  (12.31%), kernel 44.0 (9.03%), node 5.5 (1.13%), libc 0.5 (0.10%)
  (weights sum 253.0 vs gap 252.41 — 0.6 ms/weight rounding, disclosed)
- Recommendation: use **compile-scoped** .node self for this wedge. Pre-F1 the
  ring's "Rust-direct = whole-profile .node self" was compile-only ±1wt
  (4a: 204 in-compile + 1 in-publish; 4b: 220 + 0); post-F1 whole-profile
  243/243 spans compile 236/234 + scan 6/8 + publish 1/1. Whole-profile
  .node over syncTotal = 243.0/924.4982 = 26.29% if the old convention is kept.

Ring-2b — inside scan over **scan-wall mean 349.6766**:
- kernel self **291.0 (83.22%)**; userspace **58.6766 (16.78%)**
- Userspace split over the same denominator: node 24.0 (6.86%), malloc 14.0
  (4.00%), .node 7.0 (2.00%), platform 6.0 (1.72%), JS 4.5 (1.29%),
  libc+other 2.5 (0.71%) (sums 99.81% — 0.19% ms/weight rounding, disclosed)
- Per-capture weight-basis: 7a kernel 295/349 = 84.53%, userspace 54/349 =
  15.47%; 7b kernel 287/349 = 82.23%, userspace 62/349 = 17.77%
- Kernel-leaf detail over scan wall: __open 241.0 (68.92%), read 18.0 (5.15%),
  close 12.0 (3.43%), kevent 11.5 (3.29%), getdirentries 6.0 (1.72%)

Remap deltas vs the current ring (means of 4a/4b over 973.5: compile 520.05 /
53.42%, scan 368.40 / 37.84%, other 85.05 / 8.74%; Rust-direct 212.5 / 40.86%
of compile, gap 307.55 / 59.14%): sync −49.00 (−5.03%), compile −32.64,
scan −18.72, other +2.36; Rust-direct share of compile +7.35pp. (The 4→7 step
spans T1+F1+mcp; the 6→7 step in §2 isolates F1+mcp.)

## Evidence paths (this worktree; captain lands to main tree)

- `docs/evidence/flamegraph/enterprise-repro7a/` — profile.json.gz (97456 B,
  1000 Hz) + sidecar + phases.json + meta.json + summary.md + callers.md
- `docs/evidence/flamegraph/enterprise-repro7b/` — profile.json.gz (97587 B,
  1000 Hz) + sidecar + phases.json + meta.json + summary.md + callers.md
- Staging (out of tree, preserved): `/tmp/swarm-reflame7/` (run-captures.sh,
  splits.mjs, tip-verify/ unscored cold run, staged bundles)

## DX appendix

1. **Broke:** first cold run failed pre-timing with `ERR_MODULE_NOT_FOUND
   .../@reference-ui/rust/dist/namer.mjs` — flame worker needs the RS JS dist,
   `pnpm agentrs b` (native-only) is insufficient. **Workaround:** `pnpm --dir
   packages/reference-rs run build:js`, lock released and re-grabbed, zero
   scored data affected. **Lost:** ~3 min + one extra lock cycle. **Proposal:**
   brief the JS dist alongside the native build (same DX note as the F1
   implementer filed — still biting).

REFLAME-VERDICT: REPROFILED 924.6/925.1 (+6.0/+6.3% overhead, scan-concentrated)

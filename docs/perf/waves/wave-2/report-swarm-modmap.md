# REPORT: swarm-modmap — styletrace `modules` BTreeMap<PathBuf> census + diet (recordaudit-excluded)

## Verdict

**CUT (fantasy-cleared but measured-zero: the only order-admissible diet is
proven identical and measures ~0 at whole-sync)**

One line: 3,122 enterprise entries carry 3,122 B-tree inserts plus 4,442
all-hit gets over 86.7 B / 10-component PathBuf keys, and the criterion
units price the map ops at 9.74 ms fantasy — the 8 ms bar CLEARED, so the
sound diet (FxHashMap + sort-at-read) was designed, built, and
micro-predicted at −6.1 ms. But the 8-pair whole-sync A/B measures
+1.48 ms / +0.14% (3/8 favor, stands ex-run-1), byte-identical 4/4 scales,
failset-identical suites. A zero cannot BANK and cannot LAND. The
micro-vs-macro gap is bounded sharply (warm≈cold gets kill the temperature
theory; the hashers −6.3 ms / 6/8 control says a real −6 would have shown);
revival recipe filed below.

## Base / binaries / tree

- Base commit: `ddce131e7ab9a627500b5caa3d24bce81204dfe4` (verified
  `git rev-parse HEAD` at start, after census revert, and at close)
- Base `.node`: `31c080678197909a0a0b530a049bfa8215ab4f10bbf26c64706b22d904e201b7`
- Cand `.node` (diet): `dc818bebeb688b18c21770f3efee811e7f546bfa0b54ced605a2e9cf1a134561`
- Arms swapped by file copy per run (canon/keys2/hashers precedent); sha256
  verified before AND after every run — 40/40 `ok` (4 warmups + 16 pair
  runs). Neither binary rebuilt mid-set. Determinism re-check after the
  set re-copied the diet artifact with identical sha.
- Final tree: this REPORT.md only (`git status` clean except untracked
  REPORT; `git diff` empty). Census scaffolding, diet, and both temp
  criterion benches fully reverted; `Cargo.toml`/`Cargo.lock`/bench-report
  noise reverted; 29 kept repo dirs + saved binaries removed from tmp.
- Bench lock: held once for the whole timed block (install + census build
  + 3 count runs + criterion units + diet build + 8-pair + identity +
  diagnostics), released two-step (`rm -f owner && rmdir`). No foreign
  PIDs touched. No `git stash` anywhere (stash-free file-dance for
  base/cand builds).

## Topic

`StyleTraceAnalyzer.modules: BTreeMap<PathBuf, TraceModule>`
(`packages/reference-rs/modules/styletrace/src/analysis/analyzer.rs:24`) —
the sole PathBuf-keyed B-tree in styletrace. Recordaudit excluded it as
not-record-collect with evidence (its §Excluded families): PathBuf-keyed
`compare_components` inside `BTreeMap::insert`, the flame's "trace 4"
caller. Nobody had censused it. This crew ran census-first recon, the bar
cleared, the diet got built and measured.

Mechanism map (code-read, then counted): one `hosts::resolve` per compile
(`atomic/src/lib.rs:234`; `collect_hosts` has zero callers) → one
`trace_style_bindings_with_surface` → one analyzer → one `modules` map per
sync. Writers: `parse_entries` (one insert/entry) + `ensure_module_loaded`
(one insert/lazy target). Readers: `keys()` full iteration (`:86`), 7
`get` sites, 1 `contains_key` gate.

## Op census (exact, 3/3 runs byte-identical)

TEMP-CENSUS counters + env-gated `SWARM_MODMAP_OUT` dump (new
`modmap_census.rs` + 2 wrappers + 11 hooks, all TEMP-tagged, reverted),
instrumented release build, enterprise seed-7 load:

```json
{"traces":1,"entry_inserts":3122,"entry_key_bytes":270642,"entry_key_max":90,
"entry_key_components":31218,"entry_errors":0,"ensure_probes":0,"ensure_hits":0,
"lazy_inserts_ok":0,"lazy_inserts_err":0,"lazy_key_bytes":0,
"gets":4442,"gets_hit":4442,"walk_keys_len":3122,"final_len":3122}
```

| quantity | value | meaning |
| --- | --- | --- |
| traces | 1 | single trace per sync confirmed |
| entry inserts | 3,122 | every entry parsed clean (`entry_errors: 0`) |
| mean key | 86.69 B, max 90 B | matches valgraph's path-mean 86 B (cross-check ✓) |
| mean components | exactly 10.0 | deep-shared prefixes: compares walk ~9 equal components |
| ensure probes | **0** | `ensure_module_loaded` never fires: zero cross-module edges followed on this load (all local + `@reference-ui/react` primitives) |
| lazy inserts | 0 / 0 | map never grows after seeding |
| gets | 4,442, **all hit** | 1.42 gets/module; zero misses |
| walk/final len | 3,122 / 3,122 | keys snapshot clones 3,122 PathBufs once per sync |

Fidelity: pins `cssCalls 7527 / cssBytes 2867925 / dataBytes 214466`
(pin-exact ×3) — counters behavior-neutral. Run syncMs (untimed census,
for the record): 1373.9 / 979.2 / 979.6.

## Unit microbench (criterion, censused N=3122, 87 B / 10-comp keys)

Temporary `benches/modmap.rs` (reverted), release, 100 samples. Value
stand-in `[u64; 15]` = 120 B moved per insert, matching TraceModule
(4 maps + vec). Keys: one deep root + distinct leaves, padded to 87 B.

| bench | mean | what |
| --- | --- | --- |
| `modules_build_N` | **4.781 ms** / 3,122 | mean insert **1.531 µs** (key clone excluded: setup-side) |
| `modules_get_hit` | **1.065 µs** [1.071/1.065 repl.] | one hit, 64-key rotation (generous unit) |
| `modules_get_scattered` | 907 ns | one hit, all-N rotation (cold bracket) |
| `modules_get_miss` | 199 ns | context only: 0 live misses |
| `modules_keys_snapshot` | 116 µs | 3,122 PathBuf clones → **37 ns/clone** (folds into insert path: 1.568 µs) |
| `btree_get_warm` | 1.169 µs | same-key repeat: **warm ≈ cold** — compare chain dominates, cache irrelevant |
| `btree_get_clustered` | 1.799 µs / 2 | 0.90 µs/get: clustering buys nothing |

Diet-side diagnostic bench (same regime):

| bench | mean | what |
| --- | --- | --- |
| `fx_build_N` | 569 µs / 3,122 | 182 ns/Fx-insert (saves 4.21 ms) |
| `fx_get_hit` | 58 ns | saves 4.47 ms on gets |
| `diet_snapshot_sorted` | 2.70 ms | clone + sort: the diet's new cost |

Micro-predicted diet delta: −(4.21 + 4.47) + (2.70 − 0.12) = **−6.1 ms**.

## Fantasy math + bar ruling (the clearing math)

| term | math | ms |
| --- | --- | --- |
| inserts | 3,122 × 1.568 µs | 4.90 |
| gets | 4,442 × 1.065 µs | 4.73 |
| snapshot | 1 × 116 µs | 0.12 |
| **fantasy total** | | **9.74 ≥ 8** |

Cold-bracket check (scattered 907 ns gets): 9.05 ms — still clears.
Flame cross-check (filed `enterprise-flame3`, read-only): trace-side
`compare_components` ≈ 4 wt (`collect_exported_bindings` 3 +
`component_is_traced` 1 + share of `BTreeMap::insert` 2) plus diffused
node-alloc/drop under malloc — consistent with ~9.7 ms of in-situ map-op
cost. **Ruling at census close: bar CLEARS → design the diet.**

## Order audit (btreeset method)

Exhaustive: `modules` is a private field of a `pub(super)` struct; no
`.modules` access outside `analyzer.rs`/`surface.rs` (grep-closed); the
map never escapes the analyzer (dropped at walk end).

| reader | use | order observed? |
| --- | --- | --- |
| `collect_exported_bindings` keys-iter (`:86`) | per-module walk driver | IN PRINCIPLE: `ensure_module_loaded` parse-failure pushes are the only walk diagnostics, so lazy-failure order follows walk order. `bindings` is `BTreeSet<TracedBinding>` (derived `Ord`) and `record_owned` unions — order-free. LIVE: unobserved (`lazy_inserts_err: 0`, `entry_errors: 0` — zero live diagnostics) |
| 7 `get` sites | point lookups | no |
| `contains_key` gate | membership | no |
| `exports.keys()` iters (`:111,:128`) | HashMap (RandomState) walk | adjacent hashers-excluded ground — no contact |

Sortshape ruling: unsorted conversion EXCLUDED (reader
`collect_exported_bindings:86` named); only sorted-preserving diets
admissible. The built diet sorts with the same `Ord` the B-tree iterated
— walk order byte-identical by construction, failure-path diagnostics
included.

## Diet designed + built (for the record, reverted at CUT)

Diet (a) `FxHashMap + sort-at-read`, +9/−6 across 2 files (no new
dependency: `rustc-hash` already used in both files; PathBuf+Fx has the
hashers `staged` precedent):

- `analyzer.rs:24,38`: `modules: BTreeMap<PathBuf, TraceModule>` →
  `FxHashMap<PathBuf, TraceModule>` (field + constructor).
- `analyzer.rs:86`: `let mut module_paths = ...collect();` +
  `module_paths.sort();` with a 2-line why-comment (order preservation).
- `surface.rs:228,229,246`: `parse_entries` builds/returns
  `FxHashMap::default()`; `walk` takes it. Gets/inserts/contains call
  sites unchanged (identical API).

Killed alternatives (do not retry without new evidence):

- (b) Fx + tag-and-sort-diagnostics-at-end (skip the 4 ms sort):
  **unsound**. A failing target imported by two outer modules is
  first-encountered under different modules in sorted vs unsorted walks,
  so no post-hoc sort reproduces today's push order. Dead on proof.
- (f) Dual B-tree (iterate) + Fx (lookups): micro-bounded at ≈ −3.7 ms
  (keeps the 4.8 ms B-tree inserts, saves only gets) — below the 5 ms
  per-phase bank floor before queue costs. Not built.
- String/byte-keyed tree (cheap memcmp): **excluded** — byte order ≠
  component order (`a/b-c` vs `a/b/c` sort differently), an order change
  on the observed reader. Never converts.

## Enterprise A/B: 8 interleaved pairs (the zero)

`pnpm bench:neo -- --scale enterprise --runs 1 --keep --json`,
sample = `scales[0].samples[0].syncMs`. 2 unscored warmups per arm, then
8 pairs alternating order (B/C, C/B, …) under one lock hold. No sha
mismatch (40/40); cssCalls/bytes pin-exact on all 20 runs.

Warmups (unscored): base 1149.14, 974.48; cand 1038.42, 1018.91.

| pair | base syncMs | cand syncMs | Δ ms | Δ % |
| --- | --- | --- | --- | --- |
| 1 | 1034.03 | 1047.28 | +13.25 | +1.28% |
| 2 | 1031.12 | 1022.27 | −8.85 | −0.86% |
| 3 | 970.25 | 1034.20 | +63.95 | +6.59% |
| 4 | 1029.60 | 1031.28 | +1.68 | +0.16% |
| 5 | 1039.10 | 1022.37 | −16.73 | −1.61% |
| 6 | 1033.80 | 1027.51 | −6.29 | −0.61% |
| 7 | 980.36 | 1032.40 | +52.04 | +5.31% |
| 8 | 1023.48 | 1040.41 | +16.93 | +1.65% |

- base median 1030.36; cand median 1031.84; median Δ **+1.48 (+0.14%)**,
  3/8 pairs favor candidate.
- Excluding pair 1: median Δ +1.68 — the zero stands.
- Median of pair deltas: +7.5. Dip-corrected (drop base-fast p3/p7):
  ≈ −0.7 ± ~4 — still ~0.
- Two base-fast dips (970/980, ~60 ms under cluster) prove heavy tails
  on this box right now; but the hashers control (−6.3 ms / 6/8, same
  box, same era, same magnitude) says a real −6 would likely have shown
  5–6/8. This is a genuine non-confirmation, not merely an unlucky draw.

## Correctness (rule 1)

- (a) Suites: base 31 passed / 18 failed vs cand 31 passed / 18 failed —
  failset NAMES byte-identical (sole diff line is the timing); the 18
  are the known pre-existing worktree-env failures (hashers precedent),
  zero new reds. `pnpm agentrs q` on both diet files: **0 violations**,
  7 pre-existing soft warnings (untouched signatures; banked with
  disclosure).
- (b) Byte-identical base vs cand on all four scales (full-sha), all
  matching the sealed wave-1 pins:

| scale | styles.css | runtime-data.mjs |
| --- | --- | --- |
| small | `ecdec1e8…bda2973` ✓ | `ad9194f4…e994d41` ✓ |
| medium | `37f2ef5b…04819fe` ✓ | `54735e4d…08cfe7ce` ✓ |
| enterprise | `7ec827fb…e10dcea` ✓ | `718d19e4…378918` ✓ |
| churn | `1aad4978…deb10ec05` ✓ | `e1349305…f70103f18cdb` ✓ |

- (c) Determinism: all 20 A/B runs + 8 identity runs pin/hash-exact
  within and across arms.

## Why it CUTs (the losing math)

Fantasy cleared (9.74 ≥ 8) and the micros predicted −6.1 for a sound,
order-exact diet — but whole-sync measures +1.5 ms (≈0, stands ex-run-1,
dip-corrected ≈ −0.7). BANK requires a measured win (a zero cannot bank
into a combine set); LAND requires 15 ms. The micro-vs-macro gap is
sharply bounded, not hand-waved: baseline temperature theories are dead
(warm 1.169 µs ≈ cold 1.065 µs — the compare chain dominates, cache is
irrelevant), the flame corroborates the baseline magnitude in situ, and
the diet binary is verified live (distinct sha, 9 s recompile on diet
source, 40/40 arm shas). What remains is a ~6 ms in-situ diet penalty
(or baseline overstatement) with no standing mechanism after exhaustive
analysis — filed below as the revival question, not as a claim.

## Filler (secondary observations for future crews)

1. `ensure_probes: 0` — the entire lazy-load path (`ensure_module_loaded`,
   resolver-driven growth, failure-diagnostic machinery) is stone cold on
   the seed-7 load. Any future diet touching it must re-census on a load
   with cross-module style edges.
2. Gets outnumber inserts (4,442 vs 3,122) and cost comparably per op
   (~1 µs): this map is lookup-dominated, the reverse of recordaudit's
   insert-dominated tables.
3. `FxHashMap<PathBuf, …>` hashing is 58 ns/get-hit at 87 B keys — the Fx
   side of any future PathBuf-map diet is safe to assume at ~60–180 ns.
4. The sort-at-read shape (`keys().cloned().collect(); sort()`) costs
   2.70 ms at N=3,122 in-micro; any revival must price it in situ, where
   it is the prime (unproven) suspect for the missing −6.
5. Revival recipe (no re-derivation): TEMP-CENSUS patch shape is 15
   counters + `$SWARM_MODMAP_OUT` append-dump at `SurfaceTraceSession::trace`
   end; expected output is the census JSON in §Census. The discriminating
   experiment is an in-process trace replay (temp atomic bench calling
   `hosts::resolve` on a kept repo, base vs diet binaries): trace-delta
   ≈ −6 ⇒ whole-sync misresolution (run 30+ pairs); ≈ 0 ⇒ real in-situ
   penalty localized to the trace (bisect sort vs Fx). Either answer is
   publishable; do not re-run 8-pair whole-sync hoping for a different
   draw.

## Collision / scope notes (for the captain)

- Untouched per brief + fences: recordaudit CUT record tables (cited, not
  relitigated); btreeset CUT site (order-audit method cited); hashers'
  landed Fx maps incl. the `exports` RandomState exclusion (composed
  underneath: diet uses the same `rustc-hash 2` already depended on);
  extend ladder/key lines; analysisb banked `atomic/.../analysis/*`
  ground (zero file overlap with `styletrace/.../analysis/*` confirmed
  pre-touch); shot2 KILL (per-op work only, no avoidance contemplated).
- `owned_props: BTreeMap<String, …>` (String keys) noted adjacent, out of
  scope, untouched.
- No overlap with live crews' ground (all disjoint sites).

## Process note (method)

Counts-first per brief: exact op census (3/3 identical) × criterion units
BEFORE diet talk — and here the bar cleared, so the diet was designed
(order audit first, sortshape honored), built, micro-predicted,
8-paired, identity-proven, and only then CUT on measured-zero. Grounded
in recordaudit (§Excluded pointer) + btreeset (order-audit method) +
hashers (Fx precedent + sealed pins + A/B control) + repro2 (trace-4
flame context) + filed `enterprise-flame3` (independent cross-check).
One lock hold, timed work only; audit, staging, and diagnosis were
edit-only while queued; release was two-step.

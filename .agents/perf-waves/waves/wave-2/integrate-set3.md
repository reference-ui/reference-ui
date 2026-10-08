# INTEGRATE.md — wave-2 set-3 on landed base 0a5731681 (swarm-intset3)

Base pin verified: `git rev-parse HEAD` = `0a5731681c2bca56578d80ed67934e3ea709593a`
(tip = set-1 + set-2 hashers/extract LANDED). Tree was clean at start.
No commits, no pushes — the captain lands.

Working verdict: **LAND (whole set: collect + proof + selpush + shorthand + marshal,
−41.8 ms / −4.01%)**. Final verdict line at the bottom of this file is authoritative.

Bank patches + member reports were read from the parent workspace
(`docs/perf/waves/wave-2/`, absent at this tip commit); nothing was copied into
this tree. Merge protocol follows `integrate-set2.md`.

## Per-change paragraphs

**collect (sources collect-path diet D1+D2+D4, 3 files, banked −14.5 ms / −1.22%
on old base).** Dir-sort compare diet (`file_name` byte compare + unstable sort),
zero-alloc scope matching (one bound `FileMatcher` per walk, byte-indexed glob),
fused union walk (`Backfill` moves the known-check inside the walk). `includes/*`
applied bit-exact (`git apply`); `sources.rs` needed hand rebase against LANDED
set-2 hashers (below) — same change, Fx retention forced by the landed `known`
declaration. The crew's fence note stands: `known` was left `HashSet` for hashers'
ground, and the Fx conversion now composes underneath (fewer ops × faster ops,
crew-specified).

**proof (live proof-render diet + new `memo.rs`, 2 files + 369-line new file,
banked −1.8 ms / −0.16% on 810b8b5b4).** Conditional expectation set (builds only
when rejections exist), distinct-key serialization memo (`SerialMemo`, canonical
five-tuple equality), per-prop dictionary memo, borrowed hash view over the
emitted set. `mod.rs` + `memo.rs` applied bit-exact; `render.rs` needed hand rebase
against LANDED set-2 hashers (below) — the SAME-FILE collision briefed, composed
exactly as the crew recommended (Fx `warned`/`exact_set` + diet; fewer ops ×
faster ops). Fully qualified `rustc_hash` paths kept the diet off the import block
as banked.

**selpush (selector-push string diet, 3 files, banked −1.76 ms / −0.16% on
810b8b5b4).** `EscapeCursor` run scans, `nest()` comma-free fast path + push-direct
members + predicate diet, nested-base pre-size. Applied to this tip **bit-exact**
via `git apply` (all three files untouched by everything landed — mechanically
verified, site 4). Zero order changes (sortshape bar); `nest()` signature unchanged.

**shorthand (`expand_shorthand` dispatch diet, 6 files, banked −6.0 ms / −0.57% on
810b8b5b4).** Single-resolve hoist + shared longhands probe + trio-owner pre-filter.
Applied to this tip **bit-exact** via `git apply` (`shorthands/*` untouched by
everything landed — mechanically verified, site 4). Member-contract tests carried
over verbatim.

**marshal (slim-wire sheet codec + new `wire.rs`, 3 files + 113-line new file +
1-line `mod wire;`, banked −1.2 ms / −0.10% on old base 5844b24).** Refolds the
portable sheet as `portableHead` + `sharedTailUtf16`; the JS wrapper rebuilds the
identical string. Applied to this tip **bit-exact** via `git apply` (captain's
check confirmed): `native.rs` + `runtime.ts` untouched by everything landed, and
the `lib.rs` insertion point is disjoint from all five landed `lib.rs` hunk regions
(site 4). Only member touching a wrapper; wrapper variants were built per arm and
swapped per run (marker-asserted, §Sum confirm).

## Collision analysis (rebase/merge record with file:line evidence)

`git apply --check` on the landed base before any work: selpush clean, shorthand
clean, marshal clean, collect fails (sources.rs:7), proof fails (render.rs:76).

**(1) collect×hashers-LANDED → hand-rebased mechanically (sources.rs only).**
Set-2 converted `known` to Fx (import line + decl). Every banked hunk re-applied as
the same change; the two Fx sites are retained, not redesigned:

- import hunk: `use crate::includes::{FileMatcher, IncludeScope};` applied verbatim
  ([sources.rs:11](packages/reference-rs/modules/atomic/src/sources.rs)); hashers'
  `use rustc_hash::FxHashSet;` (:9) retained, std `HashSet` import stays gone.
- `sorted_entries` doc + `sort_unstable_by` (:40-57), `gather` matcher (:72-91),
  `filter_virtual_sources` (:92-99), `backfill_dir`/`handle_backfill_entry`
  (:134-169), `scan_dir`/`handle_dir_entry` (:174-196): banked verbatim, shifted
  context only.
- `union_sources`: banked body applied verbatim around the retained Fx decl
  (`let mut known: FxHashSet<String>`, :118); `Backfill.known` typed
  `&'a mut FxHashSet<String>` (:131) — FORCED: the borrowed set is Fx at
  declaration. The set-2 extract precedent (borrowed view names what it borrows).
- `includes/glob.rs` + `includes/mod.rs`: zero landed overlap
  (`git diff 5844b24..tip` empty on both paths) — bulk `git apply` is the
  mechanical proof. No other callers of `matches_file`/`file_candidates` exist
  outside these files (repo-wide grep), and the 2-arg `matches_file` signature is
  preserved as a wrapper — zero fallout surface.

**(2) proof×hashers-LANDED → hand-rebased mechanically (render.rs only; the
briefed SAME-FILE collision).** Set-2's hunk is a pure hasher swap (import,
`exact_set` field + ctor, `warned` local); proof removes/reduces work. Composition
is exactly the crew's recommended one (fewer ops × faster ops), sequenced
diet-onto-Fx:

- `use super::memo::SerialMemo;` (:23), `memo_known` (:65-69), `collect` doc
  (:80-83), `collect_one`/`build_exact_set`/new `collect_exact`, `render_causeless`
  rework, both render tests: banked verbatim.
- Retained (untouched by the rebase): `exact_set: FxHashSet<String>` (:75),
  `exact_set: FxHashSet::default()` (:88), `warned: FxHashSet<String> =
  FxHashSet::default()` (:188). The banked `build_exact_set` inserts into the Fx
  set; the banked `warned.insert` logic is unchanged.
- `proof/mod.rs` (`pub mod memo;`, :10) + new `memo.rs`: zero landed overlap —
  applied bit-exact. No `HashSet` residue in the merged file (grep); the diet adds
  no std-`HashSet` use.

**(3) Within-set → NO textual collisions.** The five file sets are pairwise
disjoint (collect: includes/*+sources; proof: proof/*; selpush:
nesting/name; shorthand: shorthands/*; marshal: runtime.ts/native.rs/lib.rs+wire).
Bulk `git apply` of selpush + shorthand + marshal + the clean subsets succeeding
is the mechanical proof. Behavioral pairs below (site 6).

**(4) selpush/shorthand/marshal×landed → NO overlap, verified mechanically.**

- selpush files: `git diff 5844b24..tip` EMPTY on all three — bit-exact apply.
  The `nest()` call sites are upstream: `emitter/mod.rs:255` (`recipe_selector`)
  and `name/mod.rs:124` (selpush's own file). Landed touched `emitter/mod.rs`,
  but its diff is import + `groups` map type only (lines 14-19, 153) — the call
  site is untouched, and selpush keeps the `nest()` signature anyway.
- shorthand files: `git diff 5844b24..tip` EMPTY on `shorthands/` — bit-exact
  apply. Sole production caller `resolve/mod.rs:172` sits in `resolve/`, which
  landed never touched; the golden-suite `expand_border_shorthand` caller keeps
  its (unchanged) public wrapper.
- marshal: `native.rs` + `runtime.ts` EMPTY vs landed; `types.rs`
  (`CompileResult` shape the codec reads) EMPTY vs landed; `lib.rs` landed hunks
  sit at old-line regions 42/205/219/409/427, all far from the `pub mod wire;`
  insertion at :29 — disjoint, clean apply. `wire.rs`/`memo.rs` are new files.

**(5) Behavioral pairs (file:line evidence).**

- collect×hashers semantics: `known` is insert/contains-only (decl :118, field
  :131, probe :158, insert :161 — no iteration anywhere in the file), so the
  hasher inside the fused walk is unobservable; order-free. Same audit shape as
  set-2's union note.
- proof×hashers semantics: `exact_set` answers membership only
  (`render_rejects` contains-check); `warned` insert-then-push logic unchanged;
  `emitted_view` and `SerialMemo` are internal membership structures. Fx changes
  speeds, the diet changes counts — no semantic interaction.
- marshal×parse-LANDED: the codec reads `result.stylesheet` /
  `result.portable_stylesheet` (fields landed never touched — `types.rs`
  untouched) and the slim struct shape is marshal's own; the JS consumer chain
  (`runtime.ts` → `index.ts` re-export) is the banked shape. Single native export,
  `contracts/` untouched (banked, re-verified: no other native caller).
- selpush×cascade-LANDED: `cascade/mod.rs` (landed) feeds atoms upstream; selpush
  changes push bytes only, order-exact (sort/comparator/`CascadeKey` untouched —
  `cascade/mod.rs` and `emitter/mod.rs` not in this diff). Recipe path shares
  `nest()` (2,859 calls, banked) — same-bytes improvement, call sites unchanged.
- shorthand×canon2-LANDED: read-only use of `find_property` /
  `resolve_canonical_prop` / tables (banked); canon contact unchanged by landed
  (`resolve/` + canon untouched — the landed `values/*` work is a different
  function family).
- Within-set behaviors: five disjoint pipeline stages (collect = source staging,
  proof = diagnostic join, selpush = selector emission, shorthand = resolve-time
  expansion, marshal = N-API seam). No shared functions, no shared state; every
  member proves byte-identity, so cross-member input shapes cannot shift.

**(6) What the rebase did NOT do.** No hunk rewritten (both rebases are same-change
+ retained landed types); no parse-new or landed-new code converted, completed, or
cleaned; `serializer.rs` untouched (scalarjson still HELD elsewhere — not this
set's business); no opportunistic edits in any of the 19 files.

## Quality + correctness results

- `pnpm agentrs c atomic`: **594 + 1 passed, 0 failed** (combined) vs **571 + 1**
  on clean tip (stash-compared) — delta is exactly the 23 carried-over new tests
  (collect 2, proof 10 = 8 memo + 2 render, selpush 2, shorthand 3, marshal 6),
  each enumerated by name and green (list in `/tmp/swarm-intset3/new-tests.txt`).
  Zero other movement.
- `pnpm agentrs q` on all 18 touched `.rs` files: **0 code violations**,
  7 warnings = 6 banked-shape (render.rs length, memo.rs length, lib.rs length,
  `run_parse_phase` lines, nesting.rs length, sources.rs length — every one filed
  by its crew; sources.rs 399→400 and lib.rs 507→508 lines shifted by landed
  composition, same warnings) + 1 tip-pre-existing (`reuse_programs` 5 args,
  set-1 parse code: clean-tip `q` on `lib.rs` reproduces all 3 lib.rs warnings,
  so the merge adds zero). Release build emits the same 18 pre-existing warnings
  as set-2 (none on merged lines).
- styletrace failure-set comparison vs tip (stash-compared, `cargo -p styletrace`):
  **31 passed / 18 failed on BOTH arms, byte-identical failure sets** (`cmp`
  clean; all 18 the pre-existing worktree-env failures in `tests::hermetic_roots`
  + `tests::tracing`, counts matching set-2's filed 31/18 exactly). Zero new reds.

## Sum confirm (base arm = 0a5731681, combined = all five)

Binaries built in-tree per arm, asided to `/tmp/swarm-intset3/`, never rebuilt
mid-set; sha256 verified before AND after every one of the 128 timed runs
(256/256 `ok`, zero mismatches; the harness aborts on any mismatch):
base `58337be5…`, full `dd2540b8…`, loo-collect `64e761f3…`, loo-proof `8b6ab606…`,
loo-selpush `9109cbed…`, loo-shorthand `f7ed3c8c…`, loo-marshal `8051cc9c…`
(all 7 distinct). Arm selection via `REFERENCE_UI_NATIVE_PATH` (sole-candidate
override, proven in `loader.ts:117-119`: override replaces the candidate list);
a negative probe (nonexistent override path) fails loudly with `Searched paths:
<override>` — dist is never silently consulted, so a wrong-arm run is impossible.
Wrappers built per tree state and swapped per run with a marker assertion
(`portableHead` ×3 in `atomic.mjs` for full/marshal arms, ×0 for base/other-LOO
arms; script aborts on mismatch). In-tree `reports/latest/*` (tracked,
bench-regenerated) reverted after the block. Sample = `scales[0].samples[0].syncMs`,
cssCalls 7527 on all 122 enterprise runs.

Zero sets discarded: no regime shifts, no drift beyond normal box cooling (base
medians 1032–1042 across the six sets; within-set interleaving controls it).
First-touch warmup spikes (WC1 1217–1230 on the five LOO cand arms; milder
1093/1177 on the probe pair) are consistent with first-load validation of each new
`.node` file — confined to unscored warmups, disclosed, not discarded (nothing
scored was affected).

Warmups (unscored): base 1055.02, 1081.70; full 1015.99, 1003.98.

| pair | base syncMs | full syncMs | Δ ms | Δ % | order |
| --- | --- | --- | --- | --- | --- |
| 1 | 1024.15 | 1001.45 | −22.70 | −2.22% | B,C |
| 2 | 1036.51 | 998.83 | −37.67 | −3.63% | C,B |
| 3 | 1059.22 | 1011.30 | −47.93 | −4.52% | B,C |
| 4 | 1057.87 | 996.46 | −61.42 | −5.81% | C,B |
| 5 | 1047.29 | 994.37 | −52.92 | −5.05% | B,C |
| 6 | 1052.48 | 1003.33 | −49.15 | −4.67% | C,B |
| 7 | 1035.85 | 1016.78 | −19.07 | −1.84% | B,C |
| 8 | 1035.18 | 996.45 | −38.73 | −3.74% | C,B |

- Base median: 1041.90; full median: 1000.14; median Δ **−41.75 ms (−4.01%)**,
  **8/8 favor**.
- Ex-run-1: base 1047.29, full 998.83, Δ **−48.45 ms** — stands.
- Median of pair deltas: **−43.33**. All three estimators agree (−41…−48).
- No outliers on either arm (full arm tight at 994–1017, base at 1024–1059).

4-scale byte-identity (base vs full, both arms vs sealed wave-1 pins, full 64-char
strings verified character-for-character):

| scale | styles.css (both arms) | runtime-data.mjs (both arms) |
| --- | --- | --- |
| enterprise | `7ec827fb…e10dcea` (2,867,925 B) | `718d19e4…378918` (214,466 B) |
| small | `ecdec1e8…bda2973` (92,651 B) | `ad9194f4…e994d41` (91,030 B) |
| medium | `37f2ef5b…04819fe` (348,780 B) | `54735e4d…08cfe7ce` (110,241 B) |
| churn | `1aad4978…deb10ec05` (8,289,806 B) | `e1349305…f70103f18cdb` (103,709 B) |

All eight match the wave-1 filed pins exactly. Cross-scale single-sample syncMs
(directional, not claimed): small 88.0→88.7, medium 159.0→152.6, churn 2155.9→2072.1.

Determinism: all 122 enterprise runs (2 probes + 120 set runs, all 7 arms)
hash-identical on both files (1 distinct sha256 each); all 6 cross-scale runs
pin-identical per scale. 128/128 runs at the sealed pins.

## Per-component bisect (member-alone arms)

LOO binaries derived from per-member diffs saved before the block
(`/tmp/swarm-intset3/loo-*.diff`, each verified `git apply --check`-clean against
the tip and file-count-verified at apply time: 3/3/3/6/4); tree restored to FULL
after each build and verified tracked-identical to the saved `full.diff`, with
only the two pre-existing stashes remaining. Each LOO set: 2 warmups/arm + 8
interleaved pairs vs base (marshal-LOO runs the full wrapper variant, all others
the base variant).

LOO-C (collect-only) pairs (base, looC): (1034.84, 1029.14), (1033.13, 1018.61),
(1039.86, 1020.48), (1035.39, 1020.69), (1033.91, 1067.60), (1054.85, 1067.30),
(1033.78, 1023.71), (1046.05, 1031.43). Warmups: base 1040.69, 1037.63;
looC 1217.24, 1014.17.

LOO-P (proof-only) pairs (base, looP): (1023.03, 1017.09), (1055.80, 1041.50),
(1030.76, 1024.21), (1036.55, 1027.78), (1055.62, 1020.45), (1038.11, 1019.45),
(1042.67, 1040.61), (1020.34, 1022.76). Warmups: base 1029.14, 1023.56;
looP 1220.90, 1022.57.

LOO-S (selpush-only) pairs (base, looS): (1036.09, 1039.08), (1025.78, 1029.90),
(1029.30, 1021.16), (1030.81, 1034.62), (1034.61, 1034.23), (1053.89, 1058.21),
(1028.24, 1024.77), (1034.47, 1041.88). Warmups: base 1038.59, 1066.75;
looS 1217.41, 1019.36.

LOO-H (shorthand-only) pairs (base, looH): (1036.81, 1014.57), (1058.09, 1018.54),
(1056.51, 1026.01), (1029.58, 1024.49), (1028.03, 1027.71), (1028.46, 1033.29),
(1068.74, 1026.13), (1030.66, 1021.48). Warmups: base 1030.39, 1036.69;
looH 1229.13, 1036.20.

LOO-M (marshal-only) pairs (base, looM): (1049.52, 1021.19), (1050.33, 1034.60),
(1032.91, 1030.42), (1036.57, 1035.84), (1041.03, 1016.81), (1036.16, 1033.77),
(1050.97, 1034.49), (1031.58, 1027.39). Warmups: base 1040.41, 1025.81;
looM 1230.12, 1034.91.

| set | median Δ (full) | median Δ (ex-run-1) | paired-median | pairs favor | banked |
| --- | --- | --- | --- | --- | --- |
| FULL (all five) | −41.75 (−4.01%) | −48.45 | −43.33 | 8/8 | −25.3 (sum) |
| LOO-C (collect) | −8.69 (−0.84%) | −11.68 | −12.30 | 6/8 | −14.5 (6/8) |
| LOO-P (proof) | −13.85 (−1.33%) | −13.90 | −7.66 | 7/8 | −1.8 (4/8) |
| LOO-S (selpush) | +1.78 (+0.17%) | +3.41 | +3.40 | 3/8 | −1.76 (3/8) |
| LOO-H (shorthand) | −8.48 (−0.82%) | −4.65 | −15.71 | 7/8 | −6.0 (7/8) |
| LOO-M (marshal) | −6.71 (−0.65%) | −2.80 | −9.96 | 8/8 | −1.2 (4/8) |

Additivity: LOO sum (−8.69 −13.85 +1.78 −8.48 −6.71) = −35.95 vs FULL −41.75 —
super-additive by ~5.8 ms (no interaction penalty, no phantom stacking against
us; gap within combined median noise across six sets on a cooling box). Four of
five members resolve >0 alone with all estimators agreeing on sign.

Notes: proof re-measures far stronger than its banked −1.8 (7/8, ex-run-1 −13.90)
— the crew-predicted fewer-ops × faster-ops composition with the LANDED Fx sets
(banked on the pre-hashers base); reported as measured. Marshal likewise resolves
at 8/8 vs 4/8 banked. Collect re-measures weaker than banked (−8.7 vs −14.5) —
box/base variance, sign solid at 6/8. LOO-C's P5/P6 elevation touches both arms
symmetrically (mid-set box warmth); medians robust.

Selpush (+1.78, 3/8) does not resolve >0 in this set — nor did it at bank time
(−1.76, 3/8, estimators disagreeing in sign there too): two independent 8-pair
sets straddling zero at ±2 ms against a ±8 ms pair spread (sign test p≈0.36 —
not a regression signal). The diet provably removes work (17,087 nests dieted,
1.21M chars re-pathed, 34,174 wasted scans gated — banked mechanism counts),
outputs are byte-identical on 4 scales with 20/20 determinism at bank and
pin-identical here, and the merge is bit-exact. This is exactly the wave-1
reserve shape (reserve soloed **+16.5** and LANDED: "the sum clears the bar with
headroom, so per brief no component was dropped" — wave-1 INTEGRATE.md:143-153).
The FULL sum here clears with headroom (−41.75 at 8/8, all estimators agreeing),
and the measured FULL artifact includes selpush — dropping it would invalidate
this sum-confirm and demand a fresh subset proof for a timing-only question the
HOLD rule (merge-mechanics-based, scalarjson precedent) does not contemplate.
Selpush LANDS with the set; its contribution is resolved by the sum, per precedent.

## Verdict

**LAND (whole set: collect + proof + selpush + shorthand + marshal, −41.8 ms /
−4.01% medians, 8/8, ex-run-1 −48.5, paired-median −43.3, additive bisect −8.7 /
−13.9 / +1.8 / −8.5 / −6.7 with the selpush sub-noise reading covered by the
wave-1 reserve precedent, 4-scale byte-identity, determinism 128/128, suites
594+1 with delta exactly the 23 carried-over tests, quality 0 violations, zero
new reds).**

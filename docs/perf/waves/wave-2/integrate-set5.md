# INTEGRATE.md — wave-2 set-5 on landed base e360915f (swarm-intset5)

Base pin verified: `git rev-parse HEAD` = `e360915f70d9d9ab2cc3b60d59d423fc85a680e4`
(post set-4-subset tip: 19 diets landed). Tree was clean at start.
No commits, no pushes — the captain lands.

Working verdict: **LAND (whole set, −17.4 ms / −1.82%, 8/8, all estimators
agree)**. Final verdict line at the bottom of this file is authoritative.

Bank patches + member reports were read from the parent workspace
(`docs/perf/waves/wave-2/`, absent at this tip commit); nothing was copied into
this tree. Protocol follows `integrate-set4b.md`. Stream discipline:
**every run below is pin-stream (no `--seed` flag)** — including all LOO sets
and identity runs. Harvestphase's REPORT FILE is truncated mid-sentence (crew
output cap); per the captain's note its proof is carried by the
VERIFY-COMPLETE + DONE claims lines, and every number cited below from it was
re-derived from the filed pair table, not trusted from the claims file
(whole-sync median −7.33 ✓ exact, ex-run-1 −9.73 ✓ exact — derivation in the
harvestphase paragraph).

## Per-change paragraphs

**programsfx (programs-map Fx tail, 7 files +24/−25, micro-banked −2.48
sub-noise on 3dd32a6).** Converts parse's NEW `programs` maps (postdating
hashers' banked audit) from `HashMap` to `FxHashMap`: identity-walk map
(`identity.rs` field+params), `reuse_programs` constructors (`lib.rs`),
hosts empty local + `resolve` param (`hosts/mod.rs`), `TraceSources.programs`
+ hint-path local (`styletrace/surface.rs`), plus 3 test-locals fallout.
Pure 1–3-line type swaps; 9,485 counted SipHash ops removed; zero iteration
sites (crew-audited, order-observed `model.exports` fenced). Applied to this
tip **bit-exact** via `git apply`.

**wantctx (WantContext borrow diet, 7 files +69/−44, banked −5.39/−0.52%
6/8 on ddce131e7).** Threads `WantContext<'w>` borrowing the live want's
condition stack through a per-want-short inner session in `resolve_want_with`
(the naive long-session borrow was attempted and provably fails borrowck on
the recipes `scoped`-local path — E0597 filed; inner session is the sound
fix). Kills 79,431 Box clones + 3,154 spill allocs + 60,327 SmallVec memcpy
clones per sync; R1 emit sites byte-untouched underneath. Applied **bit-exact**.

**stageaudit (streamed double-collect fusion, 2 files +15/−4, banked
−7.11/−0.72% 5/8 on ddce131e7).** `stage_streamed` collects once, merges by
ref, moves the bag into the staged source via new `StreamedSource::with_bag`;
`collect` keeps exact behavior for the differential test caller. Removes the
N2 second walk over 12,000 streamed files (2.8 ms hot-cache floor). Pure WORK
diet, zero skip shape (shot2 fence). Applied **bit-exact**.

**bagdefer (retained-bag first-read deferral, 2 files +97/−18, banked +7.21
crew-sign 6/8 on ddce131e7).** `StagedBag::{Ready,Lazy}` + loader `pending`;
`from_plan` stages retained entries deferred and streamed entries `Ready`;
R1/R2/R3 + `table_value` go `&self`→`&mut` onto `bag_mut()`, which collects
on first read with the exact upfront inputs and memoizes. 3,003 loaded-but-
unread bags skip collect AND drop; closed 3-reader inventory (general, not
corpus-gated); +1 pin test. Applied **bit-exact**.

**harvestphase (mint D1 sinks-empty skip, 1 file +29, PER-PHASE-banked
−8.60 ms/31.6% phase 6/6 with directional whole-sync −7.33 on ddce131e7).**
6-line early return when `sinks.is_empty()` (the loop would run zero
iterations; pool-empty + sinks>0 still runs since zero-offer reports are
bytes) + 23-line pin test. Static/dynamic SPLIT census killed the
dynamic-heavy death clause (sinks_raw = 0 all 4 scales); D2 CUT at exactly
0.00, D4 CUT at ≤0.26 gross. Whole-sync directional set re-derived here from
the filed pair table: base median 976.16, D1 median 968.83, Δ **−7.33** ✓;
ex-run-1 **−9.73** ✓ — both match the claims lines exactly. Applied
**bit-exact**.

## Collision analysis (merge record with file:line evidence)

`git apply --check` on the landed base before any work: **all five clean**
(re-verified — the captain's check-clean stands, tip unmoved). All five
applied with `git apply`, zero rebases; tree = 19 tracked modified, the exact
file-count union (7/7/2/2/1), verified at apply time.

**(1) Within-set → NO textual collisions.** The five file sets are pairwise
disjoint (programsfx: identity+hosts+lib+styletrace-surface/tests; wantctx:
recipes+resolve+tokens+unit+values; stageaudit: staging+stream; bagdefer:
resolver-mod+source; harvestphase: mint). The five clean checks are the
mechanical proof (LOO construction relies on it). Behavioral pairs below.

**(2) Member×landed → NO overlap, verified mechanically.** All five clean
checks subsume the `git diff base..tip` emptiness proofs: wantctx/stageaudit/
bagdefer/harvestphase (based on ddce131e7) untouched by the set-4-subset
landing; programsfx (based on 3dd32a6) untouched by all 7 landings since
(cloneplasma + set-4 subset). Its pre-filed note holds: set-4's realloc-D2
hunk (`identity.rs`:413-420, since LANDED) is disjoint lines from its
:13/:47/:60/:68 hunks — confirmed by the clean apply on the landed tip.

**(3) Behavioral pairs (file:line evidence, verified in the merged tree).**
- stageaudit×bagdefer (within-set, adjacent — the one pair that composes):
  streamed bags collect EXACTLY ONCE under composition: `stage_streamed`
  collects once (`stream.rs`:140-141), merges by ref (:142), moves into
  `with_bag` (:143-144) → `from_plan` streamed arm wraps
  `StagedBag::ready` (`resolver/mod.rs`:203) → `load()` Ready arm moves to
  values (`source.rs`:173-175). Retained entries take the disjoint Lazy arm
  (`mod.rs`:193-195 → `source.rs`:176-178 → `bag_mut` first-read collect
  with the exact upfront inputs). No double-collect resurrected, no
  double-skip: stageaudit's fusion prize is preserved verbatim under
  bagdefer, and bagdefer's deferral touches only the retained path
  stageaudit never walked. Bagdefer's streamed-stays-Ready fence honored.
- wantctx×harvestphase: mechanically disjoint — `mint/mod.rs` contains ZERO
  references to `ResolveSession`/`WantContext`/`session.want`/`reuse_programs`
  (grep-closed); mint takes `wants: &mut Vec<Want>` (extract-phase site
  wants, :75-79) while wantctx borrows `want.when` in `resolve_want_with`
  (resolve phase). File-disjoint + phase-disjoint.
- wantctx observable-state delta (outer `session.want` stays `None`):
  the sole in-crate reader remains `want_key` during the call
  (`resolve/mod.rs`:91, within-member); all other `want:` sites construct,
  never post-return read (grep-closed, matches the crew's workspace audit).
  No other member reads session state (mint: none, above; the rest never
  touch resolve/).
- programsfx×all: closed type chain — `reuse_programs` def (`lib.rs`:429) +
  sole caller (:211) + `with_programs` (:219), hosts `resolve`, styletrace
  `TraceSources`; no consumer outside programsfx's own 7 files
  (grep-closed). Fx swap cannot interact behaviorally: no converted map is
  iterated anywhere (crew audit stands — no member adds iteration).
- programsfx×bagdefer borrow-shape: bagdefer's `LazyBag` borrows
  `&'s Program<'s>` from retained `source.program` refs, not from any
  programs map; the maps feed only the identity walk + styletrace re-parse.
  No shared function.
- harvestphase guard generality: the skip fires iff `sinks.is_empty()`
  (`mint/mod.rs`:70-74), before seed build (:75-79); pool-empty + sinks>0
  still runs. Load-independent shape (census: sinks = 0 on all 4 scales).

**(4) What the merge did NOT do.** No hunk rewritten (all five bit-exact, zero
rebases possible or needed); no landed code converted, completed, or cleaned;
no opportunistic edits in any of the 19 files. Nothing yielded, nothing
re-pointed — every banked hunk has its referent intact at tip.

## Quality + correctness results

- `pnpm agentrs c atomic`: **607 + 1 + 5 passed, 0 failed** (combined) vs
  **605 + 1 + 5** on clean tip (file-aside compared — never `git stash`) —
  delta is exactly the 2 carried-over pin tests, each enumerated by name and
  green: bagdefer `extract::resolver::source::tests::lazy_bags_collect_on_first_read`,
  harvestphase `extract::harvest::mint::tests::empty_sinks_skip_seed_without_effects`
  (both present in `--list` on combined, both absent at tip).
  Programsfx/wantctx/stageaudit carry 0, as briefed. Zero other movement.
- `pnpm agentrs c --crate module_graph` (the runner's `--crate` flag; bare
  `module_graph` misroutes to a test-name filter): **identical count vector
  on both arms** — lib 6 + 14 integration suites 8/4/5/9/8/8/6/4/9/4/12/7/10/9
  + doctests 0 (matches intset4b's filed tip vector exactly). Zero movement.
- `pnpm agentrs q` on all 19 touched `.rs` files: **0 code violations**,
  11 warnings on BOTH arms — the exact union of banked counts (programsfx's 7
  + wantctx's 2 + bagdefer's 2; stageaudit/harvestphase 0). Tip-vs-combined
  warning diff shows ONLY two length numbers moved by diet nets
  (identity.rs 441→440, resolver/mod.rs 486→495); all 5 arity/shape warnings
  identical incl. line numbers. Zero new warnings. (The wantctx 454/371→455/372
  drift vs the crew's base is set-4 landing growth, confirmed pre-existing at
  this tip.)
- styletrace failure-set comparison vs tip (file-aside compared,
  `cargo -p styletrace`): **31 passed / 18 failed on BOTH arms**,
  byte-identical pass+fail sets after stripping the wall-time suffix (the only
  raw diff: `finished in 0.02s` vs `0.03s`); all 18 the pre-existing
  worktree-env failures in `tests::hermetic_roots` (3) + `tests::tracing` (15).
  Zero new reds.

## Sum confirm (base arm = e360915f, combined = all five)

Binaries built in-tree per arm via input-hash-gated `ensure-native` (7
"Building native binary" invocations: 1 fresh + 6 stale-rebuilds, each with
`Compiling atomic` + `Finished release`: base 24.44 s fresh, rest 8.19–9.12 s),
asided to `/tmp/intset5/arms/`, never rebuilt mid-set; sha256 verified before
AND after every one of the 126 timed runs (each `ok` = both verifications
passed; the harness aborts on any mismatch): base `d39c2ff8…`, full
`51aba1bc…`, loo-programsfx `5978a883…`, loo-wantctx `f6807d49…`,
loo-stageaudit `dd628c01…`, loo-bagdefer `c916a0cb…`, loo-harvestphase
`d937cdfd…` (all 7 distinct; asides re-verified 7/7 after the block). Arm
selection via `REFERENCE_UI_NATIVE_PATH` (sole-candidate override, proven at
`loader.ts`:116-120 — override replaces the candidate list; plus a live
bogus-path run failing hard with sole-candidate `Searched paths:`, and the
dist `.node` moved aside for the block — a wrong-arm run is impossible). No
wrapper variants: the set touches only `.rs` internals, no N-API seam change
(one `build:js` for the whole block). In-tree `reports/latest/*` (tracked,
bench-regenerated) reverted after the block. Sample =
`scales[0].samples[0].syncMs`, cssCalls 7527 and bundle bytes 2,867,925/214,466
on all 120 enterprise runs.

Zero sets discarded: no regime shifts (base medians 952.9–961.0 across all six
sets, in line with the captain's ≈955 post-set-4 note; within-set interleaving
controls drift). First-touch warmup spikes (W-C1 1119–1162 on each fresh
binary's first warmup, same first-load-validation shape as intset4's 1151–1173
band) are confined to unscored warmups, disclosed, not discarded. One harness
smoke (base, 1134.57, pin-ok, unscored, disclosed) preceded the block.

Warmups (unscored): base 952.75, 955.19; full 1119.67, 928.40.

| pair | base syncMs | full syncMs | Δ ms | Δ % | order |
| --- | --- | --- | --- | --- | --- |
| 1 | 954.77 | 938.31 | −16.46 | −1.72% | B,C |
| 2 | 960.77 | 945.40 | −15.37 | −1.60% | C,B |
| 3 | 963.14 | 936.85 | −26.29 | −2.73% | B,C |
| 4 | 958.29 | 939.71 | −18.58 | −1.94% | C,B |
| 5 | 953.73 | 938.61 | −15.12 | −1.59% | B,C |
| 6 | 961.44 | 942.37 | −19.07 | −1.98% | C,B |
| 7 | 953.75 | 941.90 | −11.85 | −1.24% | B,C |
| 8 | 951.23 | 936.06 | −15.17 | −1.59% | C,B |

- Base median: 956.53; full median: 939.16; median Δ **−17.37 ms (−1.82%)**,
  **8/8 favor**.
- Ex-run-1: base 958.29, full 939.71, Δ **−18.58 ms** — stands.
- Median of pair deltas: **−15.91**. All three estimators agree (−15.9…−18.6).
- No spikes on either arm (full 936–945, base 951–963).

4-scale byte-identity (base vs full, both arms vs sealed wave-1 pins; full
64-char strings verified character-for-character on enterprise, prefix+suffix
+ exact byte size on the other scales per crew protocol; base==full arm
agreement exact on all 6 cross-scale runs):

| scale | styles.css (both arms) | runtime-data.mjs (both arms) |
| --- | --- | --- |
| enterprise | `7ec827fb…e10dcea` (2,867,925 B) ✓ pin | `718d19e4…378918` (214,466 B) ✓ pin |
| small | `ecdec1e8…bda2973` (92,651 B) ✓ pin | `ad9194f4…e994d41` (91,030 B) ✓ pin |
| medium | `37f2ef5b…94819fe` (348,780 B) ✓ pin | `54735e4d…08cfe7ce` (110,241 B) ✓ pin |
| churn | `1aad4978…deb10ec05` (8,289,806 B) ✓ pin | `e1349305…f70103f18cdb` (103,709 B) ✓ pin |

Full hashes: ent css `7ec827fb0c0cf6856f12fe9557f977505ec745b57ef8d8a62ed46df05e10dcea`,
data `718d19e470176b97350c576ef79566f659d6db85253b66b0bb7a2b19b7378918`;
small css `ecdec1e80f8e71a8…bda2973`, data `ad9194f41181aaee…e994d41`; medium
css `37f2ef5b43f8b7cb…94819fe`, data `54735e4d5a51c567…08cfe7ce`; churn css
`1aad4978ffdc1ba1…deb10ec05`, data `e134930586eb56a5…f70103f18cdb`.
Honest note: intset4's table shows medium-css suffix `04819fe` while intset4b
shows `94819fe` — the measured string ends `...d0840d94819fe`, i.e. last-7 =
`94819fe` (intset4b exact) and intset4's `04819fe` = measured[−8:−1], a suffix-
window variance in their table, not a byte difference (prefixes match, arms
agree exactly). Cross-scale single-sample syncMs (directional, not claimed):
small 88.6→86.3, medium 150.1→148.6, churn 1887.1→1810.0.

Determinism: all 120 enterprise runs hash to exactly 1 distinct css sha + 1
distinct data sha, both == sealed pins (121/121 incl. the smoke); all 6
cross-scale runs pin-identical per scale. 126/126 timed runs at pins.

## Per-component bisect (member-alone arms)

LOO binaries = tip + one member diff (per-member diffs composed from the
verified FULL tree; file counts verified at build time: 7/7/2/2/1; tree
restored to FULL after the builds and verified byte-identical to the saved
FULL diff). Each LOO set: 2 warmups/arm + 8 interleaved pairs vs base. All LOO
runs pin-identical (outputs hashed every run — the per-member byte-identity
proof under composition).

LOO-PROGRAMSFX pairs (base, cand): (952.57, 952.11), (954.62, 962.45),
(953.25, 953.77), (950.54, 965.54), (951.25, 950.17), (960.96, 956.55),
(951.08, 960.89), (954.68, 948.92). Warmups: base 951.48, 950.30; cand
1162.32, 951.54.

LOO-WANTCTX pairs (base, cand): (969.22, 947.56), (949.54, 951.12),
(967.30, 950.92), (954.95, 954.52), (953.88, 959.58), (955.36, 946.97),
(963.07, 955.85), (949.54, 960.87). Warmups: base 958.12, 948.50; cand
1150.17, 962.31.

LOO-STAGEAUDIT pairs (base, cand): (952.70, 946.97), (941.05, 962.40),
(963.34, 954.19), (961.62, 966.41), (960.34, 945.75), (965.86, 967.50),
(965.20, 963.32), (959.82, 965.89). Warmups: base 964.14, 952.14; cand
1151.29, 947.23.

LOO-BAGDEFER pairs (base, cand): (954.22, 955.76), (953.08, 959.50),
(958.96, 945.39), (950.83, 949.97), (957.20, 951.33), (962.31, 954.38),
(1017.32, 948.71), (964.66, 955.38). Warmups: base 1003.18, 967.54; cand
1151.17, 943.75.

LOO-HARVESTPHASE pairs (base, cand): (964.72, 949.18), (955.22, 948.23),
(955.98, 951.32), (957.81, 955.40), (954.61, 947.91), (964.38, 951.68),
(954.24, 944.51), (974.82, 955.65). Warmups: base 972.24, 962.06; cand
1145.79, 954.39.

| set | median Δ (full) | median Δ (ex-run-1) | paired-median | pairs favor | banked |
| --- | --- | --- | --- | --- | --- |
| FULL (all five) | −17.37 (−1.82%) | −18.58 | −15.91 | 8/8 | −29.5 (sum) |
| LOO-PROGRAMSFX | +2.25 (+0.24%) | +3.30 | +0.03 | 4/8 | −2.48 (5/8) |
| LOO-WANTCTX | −2.34 (−0.24%) | −0.43 | −3.83 | 5/8 | −5.39 (6/8) |
| LOO-STAGEAUDIT | +1.88 (+0.20%) | +1.69 | −0.13 | 4/8 | −7.11 (5/8) |
| LOO-BAGDEFER | −5.22 (−0.55%) | −7.63 | −6.90 | 6/8 | −7.21 (6/8) |
| LOO-HARVESTPHASE | −6.65 (−0.69%) | −4.66 | −8.36 | 8/8 | −7.33 dir |

(Banked signs normalized to cand−base: bagdefer's crew-signed +7.21 = −7.21
here; harvestphase's −7.33 is the directional whole-sync read, re-derived
above — its bank basis is the −8.60/31.6% per-phase verdict. Naive banked
sum: −2.48 −5.39 −7.11 −7.21 −7.33 = −29.52; FULL −17.4 lands below it, as
expected for micro-diet stacking with two members reading ~0 in isolation.)

Additivity: LOO sum (+2.25 −2.34 +1.88 −5.22 −6.65) = −10.08 vs FULL −17.37 —
super-additive by ~7.3 ms in our favor (no phantom stacking against us). The
gap is consistent with median noise across six sets (±~3 per median compounds
in the sum) plus favorable composition (allocator-relief stacking FOR us, or
the straddle members contributing in composition what they don't show alone);
the FULL number is the directly-measured landing artifact and needs no
decomposition to stand. Three members resolve >0 alone with all estimators
agreeing on sign (wantctx, bagdefer, harvestphase — the last unanimous 8/8);
two straddle sub-noise (programsfx, stageaudit); zero read contra.

Notes: LOO-BAGDEFER's P7b (1017.32) is a slow-base box outlier, mirror of the
crew's own spikes; medians robust, and it replicates the banked shape (−5.2…
−7.6 here vs −7.21 banked, 6/8 both). LOO-STAGEAUDIT's P2c (962.40, +21.35) is
a slow-cand single; the set straddles honestly (+1.88/+1.69/−0.13, 4/8).
LOO-WANTCTX's P1 (−21.66) is the set's largest delta but ex-run-1 (−0.43)
keeps the sign — stands. LOO-HARVESTPHASE resolves its whole-sync contribution
8/8 (−4.7…−8.4, bracketing the banked directional −7.33) — the keys2-
precedented point of including a per-phase-banked member in the sum-confirm.

The two straddles ride the wave-1 reserve precedent with the full three-part
justification (the captain's intset4 doctrine): (1) the measured FULL artifact
includes them — the −17.37/8/8 sum was taken WITH them in the tree, and
dropping them would invalidate this sum-confirm and demand a fresh subset
proof; (2) the sum is sign-resolved with margin — all estimators −15.9…−18.6,
unanimous 8/8, every estimator beyond −15; (3) each provably removes counted
work with byte-identical outputs (programsfx: 9,485 counted SipHash ops;
stageaudit: 12,000 redundant bag walks fused at a 2.8 ms hot-cache floor).
They differ in KIND from a recipepath: single-set straddles with mixed-sign or
≈0 estimators (paired-medians +0.03/−0.13 — essentially exactly zero), 4/8 —
not replicated directional contras (no second set is warranted: intset4 ran
none for its same-shaped realloc/analysisb straddles, and the cascade
precedent bars second sets on sub-noise). No member earns a subset-confirm.

## Verdict

**LAND (whole set: programsfx + wantctx + stageaudit + bagdefer +
harvestphase-D1, −17.4 ms / −1.82% medians, 8/8, ex-run-1 −18.6,
paired-median −15.9 — all estimators agree; additive bisect +2.2 / −2.3 /
+1.9 / −5.2 / −6.7 with wantctx/bagdefer/harvestphase resolving alone (all
estimators agree, harvestphase unanimous 8/8) and the programsfx/stageaudit
sub-noise straddles covered by the wave-1 reserve precedent with the full
three-part justification; zero contra members, no subset-confirm warranted;
4-scale byte-identity vs sealed pins; determinism 126/126; suites 607+1+5
with delta exactly the 2 carried-over pin tests by name; module_graph counts
identical; quality 0 violations with the same 11 pre-existing warnings, zero
new; zero new reds; all five bit-exact, zero rebases, tree 19/19 member
files.)**


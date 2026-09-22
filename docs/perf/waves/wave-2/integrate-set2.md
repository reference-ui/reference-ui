# INTEGRATE.md — wave-2 set-2 on landed base 810b8b5b4 (swarm-intset2)

Base pin verified: `git rev-parse HEAD` = `810b8b5b47448b4b99b688d9c2fda94c3ec9658e`
(`reference-system` tip identical — first integration on the new base, no landings since).
Tree was clean at start. No commits, no pushes — the captain lands.

Working verdict: **LAND-SUBSET (hashers + extract, −27.4 ms / −2.42%) / HOLD (scalarjson)**.
Final verdict line at the bottom of this file is authoritative.

## Per-change paragraphs

**hashers (SipHash→Fx hasher diet, 60 files, banked −6.3 ms med / −8.6 ex-run-1 on old base).**
Pure hasher swaps (`HashMap/HashSet/IndexMap` → `Fx*`, `rustc-hash 2`, already locked at 2.1.1)
with no logic, capacity, or API-shape change. 50 files applied to the landed base byte-identical
via `git apply` (incl. `Cargo.lock` + both `Cargo.toml` edges); 8 files needed hand rebase against
LANDED parse (same 1–3-line swaps, shifted context; parse's new `programs` maps deliberately left
`HashMap` — they postdate the audit, converting them would be new work); 2 files needed within-set
hand merge with extract (below). `model.exports` exclusion stands (still `RandomState`,
[analyzer.rs:109,126](packages/reference-rs/modules/styletrace/src/analysis/analyzer.rs) iterate
`exports.keys()` into walk order). Rebased onto the new base without rewriting any hunk.

**extract (JsxHosts borrowed union, 4 files +80/−11, banked −13.3 ms / −1.12% on old base).**
Replaces the per-file merge (clone local set + clone all ~101 global hosts into a fresh `HashSet`,
315,423 dead clones over 3123 files, queried zero times) with a borrowed union view answering the
only two observed queries (`contains`, `is_empty`). Applied to the landed base **bit-exact** via
`git apply --check`-then-apply (zero textual collisions with set-1, including parse's `lib.rs`
work — disjoint functions). Within-set composition with hashers forces the borrowed refs to
`FxHashSet` (both underlying sets are Fx post-hashers; the view just names what it borrows —
derived, not designed). Union truth table test carried over (types follow, assertions untouched).

**scalarjson (scalar fast-frame JSON writer, HELD — not integrated).**
Hand-rolled five-tuple framing for scalar lookup-key values, banked +2.1 ms phase vs legacy and
+0.28 ms vs the keys2-diet shape, 0 divergences on 106k corpus + ~37k fuzz. The banked
`write_scalar_tuple` is concrete over `LookupKey<'_>` (default `W = [String]`, scalarjson.patch:44)
and iterates `when`-steps as strings. LANDED keys2 generalized the signature to
`LookupKey<'a, W: ?Sized>` ([serializer.rs:37](packages/reference-rs/modules/atomic/src/runtime/serializer.rs))
with **three live instantiations**: `W = Vec<String>` on the hot plan-builder path
([builder.rs:33-39](packages/reference-rs/modules/atomic/src/runtime/builder.rs),
`when: &self.when` — note the SAME source line inferred `W = [String]` on the old base via deref
coercion, so landed keys2 silently re-instantiated even the hot call site), `W = [Box<str>]`
([facts.rs:33-39](packages/reference-rs/modules/atomic/src/diagnostics/facts.rs),
`when: self.when.as_slice()`), and `W = [String]` (tests). Composing the fast frame with the
generic signature requires designing a new step-iteration abstraction (trait or restructured
bounds) present in neither patch, plus differential cover for `[Box<str>]` steps the banked fuzz
never exercised (it only fuzzes `[String]`). That is rewriting the change → **HOLD** per the
standing rule. The crew's merge sketch ("generic signature + fast frame") never names the
`[Box<str>]` instantiation and is under-specified. `serializer.rs` untouched in this tree
(verified: no diff). Re-proof needed: re-derive the fast frame natively on the generic signature
covering all live `W`, differential-fuzz every instantiation (incl. escape edges in `Box<str>`
steps), re-run the phase bench marginal vs the LANDED diet (expectation ≈ +0.3 ms, unresolvable
whole-sync — phase proof + identity is the bar), then re-present to the captain.

## Collision analysis (rebase/merge record with file:line evidence)

`git apply --check` on the landed base before any work: scalarjson fails (serializer.rs:60),
extract clean, hashers fails on exactly 8 files (identity.rs, hosts/mod.rs, lib.rs, analyzer.rs,
parser/mod.rs, surface.rs, owned_props.rs, trace_gate.rs).

**(1) scalarjson×keys2-LANDED → HOLD (non-mechanical).** Same `serializer.rs` region, but the
bottom moved: landed keys2 introduced generic `W` with `[Box<str>]` + `Vec<String>` production
instantiations the banked concrete writer cannot serve without a newly designed abstraction.
No merge attempted; nothing applied. (Had it been mechanical, the merged expectation would be
≈1.9 ms per the crew's double-claim disclosure — recorded here only so a wave-3 follow-up
inherits the number, not the sum.)

**(2) hashers×parse-LANDED → all 8 files rebased mechanically.** Every banked hunk re-applied as
the same type-swap on shifted context; every dropped line is a line parse deleted (conversion
moves with the referent); every retained-`HashMap` site is parse-new and postdates the audit
(left as-is + noted, never converted):

- `atomic/src/extract/identity.rs` — import hunk rebased (landed gained `Program` import at :16;
  `HashMap` import RETAINED for parse's `programs` field :47 / :60 / :68, `FxHashMap` added
  alongside); `index`/`memo` → Fx (:42-43, :70-71, :77-78, same swaps, now inside `build()`).
- `atomic/src/hosts/mod.rs` — import line unioned (`{BTreeMap, BTreeSet, HashMap}` + Fx pair,
  :8-12); `hosts()`/`collect_hosts()`/`staged` → Fx (:40-41, :49, :99, banked verbatim, shifted);
  `programs` (:55, :75) stays `HashMap`.
- `atomic/src/lib.rs` — import line unioned (`HashMap` retained for `reuse_programs` :434-438);
  `traced_jsx` → `&FxHashSet` (:60, banked verbatim). Extract's region (:470-473) disjoint ✓.
- `styletrace/.../analyzer.rs` — import hunk applied verbatim (landed context identical, :8-11);
  staged field/param conversions OBSOLETE (parse replaced them with `sources: &TraceSources`,
  :25/:39 — the staged→Fx conversion lands on `TraceSources.staged` instead); 3 caches → Fx
  (:27-29, :47-49, banked verbatim).
- `styletrace/.../parser/mod.rs` — Fx import added under shifted context (:10-14); `ParseState`
  maps → Fx, `exports` stays (:36-51); `imports` local → Fx at its moved home inside
  `trace_program` (:96); `module_source`/`collect_imports`/`collect_variable_symbols` → Fx
  (:128, :141, :400-401, banked verbatim); removed `staged` param conversion obsolete (same
  referent move as analyzer).
- `styletrace/.../surface.rs` — `HashMap` import retained (parse's `programs`), Fx added (:10-15);
  `TraceSources.staged` → `&FxHashMap` (:116 — the rebased home of the three deleted staged-param
  conversions; FORCED: atomic passes Fx, `ModuleResolver::new` takes Fx); `programs` stays (:117);
  `let staged` local → Fx (:157), `let programs` stays (:158).
- `styletrace/.../tests/owned_props.rs` — import unioned (:7-13); staged locals → Fx (:55, :220,
  :232), programs locals stay (:56, :221, :263, :296); parse's NEW reuse-test staged map (:259)
  → Fx as forced fallout (it feeds `TraceSources.staged`).
- `styletrace/.../tests/trace_gate.rs` — import unioned keeping banked order (:8-10); `staged` →
  Fx (:39), `programs` stays (:40).

Type-chain consistency verified by reading (compile proves it under the lock): atomic `staged`
Fx → `TraceSources.staged` Fx → `ModuleResolver::new(&Fx)` (bulk) + `module_source(&Fx)`; all
`programs` maps `HashMap` on both sides of every boundary.

**(3) hashers×keys2 facts.rs (CAPTAIN'S CATCH) → FALSE ALARM, discharged three ways.**
`hashers.patch` contains no `diagnostics/facts.rs` hunk (file-list grep + `--check` silence on
that path; the 9 "facts" hits are local `DiagnosticFact` variable names in `analysis/*` and
`render.rs`); keys2's 3-line borrowed-`when` hunk (keys2.patch:9-13) shares no lines, no symbols,
and no semantics with any hashers hunk. No resolution needed.

**(4) extract×parse lib.rs → NO collision.** extract applies bit-exact; parse's `lib.rs` hunks
(imports, `run_parse_phase`, `reuse_programs`) are disjoint functions from extract's
`extract_parsed_program` hunk (:470-473). Verified in the applied tree.

**(5) hashers×canon2/diag/cascade → NO overlap, verified mechanically.** canon2 touches 4 files
under `modules/canon/` (hashers: zero); cascade touches `stylesheet/cascade/mod.rs` (hashers'
emitter hunk is `stylesheet/emitter/mod.rs`); diag touches `diagnostics/channels/mod.rs`
(hashers' diagnostics hunks are `analysis/*` + `proof/render.rs`); keys2 touches `facts.rs` +
`serializer.rs` (hashers: neither). Bulk `git apply` of the other 50 files succeeding clean is
the mechanical proof; file-list intersection of set-1 patches with hashers bulk files is empty.

**(6) Within-set.**
- scalarjson×hashers: hashers never touches `serializer.rs` (file list) — no interaction (moot:
  scalarjson HELD).
- scalarjson×extract: disjoint files (moot: scalarjson HELD).
- hashers×extract (both touch `bindings.rs`, `mod.rs`, `lib.rs`) → MERGED mechanically:
  - `bindings.rs`: hashers' import/fields/`shadowed`-params applied verbatim (6 fields :22-27,
    7 `shadowed` sites); extract's `jsx_hosts()`→`jsx_hosts_ref()` rename kept with return type
    `&FxHashSet<String>` (:56-59) — forced: the borrowed `jsx` field is Fx post-hashers.
  - `mod.rs`: extract's `JsxHosts` struct + 3 field swaps + `no_global` kept with `FxHashSet`
    refs (:71-72 — forced both sides: `local`←`bindings.jsx:Fx`, `global`←`traced_jsx:Fx`);
    hashers' `shadowed`/`shadows`/`add_*` hunks applied verbatim (:94, :120, :347, :395, :514,
    :525); the 3 `jsx_hosts: JsxHosts<'a>` lines (:93, :119, :346) supersede hashers' same-line
    `&Fx` swaps with no residual claim (the underlying sets are Fx at declaration — no perf
    lost). Doc comment's historical "`HashSet`" (:64) kept as banked.
  - `lib.rs`: both changes compose (`JsxHosts { local: jsx_hosts_ref(): &Fx, global:
    traced_jsx: &Fx }`, :470-473).
  - `gating_tests.rs` (extract's new test): forced fallout — 3 locals + import follow to Fx
    (:170-175); all 7 assertions byte-untouched.
  - Audit note (as briefed, note only): hashers' audit postdates `JsxHosts`; the union's two
    queries (`contains`, `is_empty`) are order-free and took 0 queries on the bench load, so the
    hasher inside the view is unobservable there. The Fx-typing is forced composition (borrowed
    sets are Fx), not a new conversion — no audit extension claimed.

**(7) Behavioral pairs (file:line evidence).**
- scalarjson×keys2 semantics: MOOT (HOLD). Blocker evidence: [builder.rs:33-39](packages/reference-rs/modules/atomic/src/runtime/builder.rs)
  (`W=Vec<String>` hot), [facts.rs:33-39](packages/reference-rs/modules/atomic/src/diagnostics/facts.rs)
  (`W=[Box<str>]`), banked writer concrete `[String]` (scalarjson.patch:44-69).
- hashers×everything (iteration re-audit at REBASED sites — landed parse moved code around them):
  `identity.rs` index/memo remain entry/get/insert-only (build :70-78, lookups unchanged;
  parse's `parse_position` only `.get`s the untouched `programs` map); `hosts/mod.rs` `staged`
  is collect-then-borrow (no order-observed iteration; downstream `ModuleResolver::new` iterates
  map→map, order-irrelevant); analyzer caches get/insert-only (no new iteration from parse —
  its hunks only re-threaded `sources`); `exports` iteration into walk order UNCHANGED
  ([analyzer.rs:109,126](packages/reference-rs/modules/styletrace/src/analysis/analyzer.rs))
  and still `RandomState` ([model.rs:32,44](packages/reference-rs/modules/styletrace/src/analysis/model.rs),
  [parser/mod.rs:39,49](packages/reference-rs/modules/styletrace/src/analysis/parser/mod.rs)) —
  exclusion stands, confirmed in the merged tree. Bulk files are set-1-untouched (site 5), so the
  crew's per-site audit carries over verbatim.
- extract union under landed parse reuse: parse changed neither the SHAPE of extract's inputs
  (`bindings.jsx_hosts_ref()` source `bindings.rs` untouched by set-1; `traced_jsx` still the
  `hosts()` union value — parse re-threaded its computation, and parse's own proof is reuse
  answers identically) nor the query sites (`allows_jsx_tag` :146-154, `report_dropped_tag`
  via [jsx/mod.rs:471](packages/reference-rs/modules/atomic/src/extract/jsx/mod.rs) — both
  `contains`/`is_empty` only, both files set-1-untouched outside the merged lines). Union
  semantics re-proven: same shapes, same values, same two queries. All `ExtractConfig`
  constructors census-checked: 4 sites (`lib.rs:471`, `mod.rs:462/525/565`) — the two the patch
  doesn't touch (:462, :525) are pure field copies of the `Copy` view, type-agnostic ✓;
  `jsx_hosts()` has zero residual callers (grep), `jsx_hosts_ref` has exactly the 2 new ones.

## What was NOT done (deliberately)

- scalarjson: nothing applied (`serializer.rs` has zero diff — verified).
- parse-new `programs` maps (identity :47/60/68, hosts :55/75, lib :434-438, surface :117/158,
  tests): left `HashMap`. Converting them would extend hashers past its banked audit = new work.
  Follow-up ground for a future wave, with its own proof.
- No rewrites, no "completions", no opportunistic cleanups anywhere in the 61 files.

## Quality + correctness results

- `pnpm agentrs c atomic`: **571 + 1 passed, 0 failed** (combined) vs **570 + 1** on clean
  new-base (stash-compared) — delta is exactly the carried-over union test, zero other movement.
- `pnpm agentrs q` on all 58 touched `.rs` files: **0 code violations**, 63 warnings =
  60 (hashers banked) + 3 (extract banked) — zero new warnings from the merge. Release build
  emits the same 18 pre-existing warnings (private-type leaks, dead recipe fns) — none on
  merged lines, no unused-import warnings.
- Union test `test_jsx_host_union_matches_merged_set`: explicit run **pass** (1 passed).
  (No parity test exists — scalarjson HELD.)
- ATM-SITE-54 spot-confirm: `extract::resolver::differential::*` (tsconfig-alias arm +
  nested-import arm + staging differential) **3/3 pass** on the combined tree.
- styletrace failure-set comparison vs NEW base (stash-compared): **31 passed / 18 failed on
  BOTH arms, byte-identical failure sets** (all 18 pre-existing worktree-env failures in
  `tests::hermetic_roots` + `tests::tracing` — missing StyleProps declaration entrypoint;
  the hand-merged `owned_props` + `trace_gate` suites pass on both arms). Zero new reds.

## Sum confirm (base arm = 810b8b5b4, combined = hashers+extract)

Binaries (built in-tree, asided, never rebuilt mid-set; sha256 verified before AND after every
run over the verdict, bisect, and identity runs — 132/132 `ok`, zero mismatches;
the two discarded sets were likewise verified-ok): base `a8c0bad9…`, combined `1ee063d9…`,
LOO-H `0c767462…`, LOO-E `8f5090a0…`. Wrappers built once (`build:js`; no wrapper files in
the diff). Sample = `scales[0].samples[0].syncMs`, cssCalls 7527 on all 66 enterprise runs.

Two sets DISCARDED before the verdict set (standing rule — disclose + discard, never cherry-pick
pairs): FULL (pairs 1–4 clean at −7…−26, then a +130 ms regime shift on both arms from pair 5)
and FULL2 (monotonic +150 ms drift, 4/8). Cause found after: `screensharingd` at 358% CPU during
both sets (foreign process — observed, never touched). Box idled 4 min, load fell 8.76→3.22,
probe pair clean (1144.2/1128.6) — then the verdict set below, run-1-excluded standing.

Warmups (unscored): base 1139.29, 1136.31; cand 1111.94, 1107.57.

| pair | base syncMs | cand syncMs | Δ ms | Δ % | order |
| --- | --- | --- | --- | --- | --- |
| 1 | 1126.68 | 1112.87 | −13.81 | −1.23% | B,C |
| 2 | 1143.35 | 1111.75 | −31.60 | −2.76% | C,B |
| 3 | 1130.08 | 1098.91 | −31.17 | −2.76% | B,C |
| 4 | 1132.99 | 1042.40 | −90.60 | −8.00% | C,B |
| 5 | 1156.92 | 1130.77 | −26.15 | −2.26% | B,C |
| 6 | 1123.14 | 1107.34 | −15.80 | −1.41% | C,B |
| 7 | 1136.40 | 1107.24 | −29.16 | −2.57% | B,C |
| 8 | 1145.99 | 1104.67 | −41.33 | −3.61% | C,B |

- Base median: 1134.70; cand median: 1107.29; median Δ **−27.41 ms (−2.42%)**, **8/8 favor**.
- Ex-run-1: base 1136.40, cand 1107.24, Δ **−29.16 ms** — stands.
- Median of pair deltas: **−30.16**. All three estimators agree (−27…−30).
- p4c 1042.40 is a fast-cand outlier (mirror of the crews' fast-base outliers); medians robust.
- Sum lands ABOVE the 18–24 band — the bisect below resolves why (hashers re-measures
  stronger than its banked number; additivity closes, so this is honest, not noise).

4-scale byte-identity (base vs cand, both arms vs sealed seed-7 pins):

| scale | styles.css (both arms) | runtime-data.mjs (both arms) |
| --- | --- | --- |
| enterprise | `7ec827fb…e10dcea` (2,867,925 B) | `718d19e4…378918` (214,466 B) |
| small | `ecdec1e8…bda2973` (92,651 B) | `ad9194f4…e994d41` (91,030 B) |
| medium | `37f2ef5b…04819fe` (348,780 B) | `54735e4d…08cfe7ce` (110,241 B) |
| churn | `1aad4978…deb10ec05` (8,289,806 B) | `e1349305…f70103f18cdb` (103,709 B) |

All eight match the wave-1 filed pins character-for-character (full 64-char strings verified).
Cross-scale single-sample syncMs (directional, not claimed): small 150.3→90.0 (cold-start noise,
canon precedent), medium 218.9→219.1, churn 2313.4→2323.0.

Determinism: all 20 FULL3 kept runs (4 warmups + 16 pair runs, both arms) hash-identical on both
files (1 distinct sha256 each); LOO sets' 40 runs likewise pin-identical. 60/60 enterprise runs
at the sealed pins.

## Per-component bisect (leave-one-out)

LOO binaries derived in-tree under the same hold: LOO-H (extract-only) = clean base +
`extract.patch` applied (4 files +80/−11 verified); LOO-E (hashers-only) = FULL minus extract
(4 files reverted to base, hashers hunks machine-applied to bindings/mod, lib.rs 2-line hand
edit re-applied; verified 60 files, zero `JsxHosts`/`jsx_hosts_ref` residue, original merge
code intact). FULL tree restored after via saved `full.diff` — verified 61 files +397/−283,
identical stat to pre-detour. Each LOO set: 2 warmups/arm + 8 interleaved pairs vs base.

LOO-H (extract-only) pairs (base, looH): (1140.42, 1120.82), (1070.77, 1149.26),
(1128.48, 1115.49), (1224.76, 1108.08), (1135.76, 1117.62), (1066.02, 1112.69),
(1119.28, 1105.89), (1130.08, 1114.00). Warmups: base 1276.16, 1142.14; looH 1141.61, 1144.39.

LOO-E (hashers-only) pairs (base, looE): (1138.54, 1117.15), (1142.57, 1120.88),
(1123.48, 1114.10), (1141.84, 1119.78), (1136.39, 1112.42), (1129.53, 1122.03),
(1113.80, 1059.15), (1080.95, 1165.04). Warmups: base 1258.73, 1125.94; looE 1125.74, 1116.18.

| set | median Δ (full) | median Δ (ex-run-1) | paired-median | pairs favor |
| --- | --- | --- | --- | --- |
| FULL (H+E) | −27.41 (−2.42%) | −29.16 | −30.16 | 8/8 |
| LOO-H (extract only) | −14.53 (−1.29%) | −14.48 | −14.73 | 6/8 |
| LOO-E (hashers only) | −14.49 (−1.28%) | −9.74 | −21.54 | 7/8 |

Additivity closes: LOO-H(−14.53) + LOO-E(−14.49) = −29.02 vs FULL(−27.41) — within ~1.6 ms
(noise). Both members resolve independently with all estimators agreeing on sign.

Notes: LOO-H's two contra pairs are fast-base outliers (1070.8, 1066.0 — the known box
phenomenon both crews filed); its looH arm is tight (1106–1149). LOO-E's ex-run-1 softens to
−9.74 on the p8 fast-base outlier (1080.95); its paired-median (−21.54) exceeds medians-diff.
Hashers re-measures stronger than its banked −6.3/−8.6 — isolated cause not proven (quieter box
than bank night + new-base composition are candidates); reported as measured, sign solid at 7/8.
Both members exceed their banked numbers or match; neither bisects ≤0. No faith required.

## Verdict

**LAND-SUBSET (hashers + extract, −27.4 ms / −2.42% medians, 8/8, ex-run-1 −29.2, additive
bisect −14.5/−14.5, 4-scale byte-identity, determinism 60/60, suites + quality green) /
HOLD (scalarjson — generic-W merge is new work; re-proof: native fast frame over all live `W`
+ per-instantiation differential fuzz + phase-bench marginal vs landed diet).**

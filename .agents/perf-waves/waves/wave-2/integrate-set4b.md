# INTEGRATE-4B.md — wave-2 set-4 SUBSET confirm (6 members, recipepath HELD) on ddce131e7 (swarm-intset4b)

Base pin verified: `git rev-parse HEAD` = `ddce131e7ab9a627500b5caa3d24bce81204dfe4`
(post-cloneplasma-LAND tip). Tree was clean at start.
No commits, no pushes — the captain lands.

Working verdict: **LAND-SUBSET6 (−19.3 ms / −1.97%, 8/8, all estimators
agree)**. Final verdict line at the bottom of this file is authoritative.

Mission: confirm FULL-minus-recipepath (sysprefix + extend + realloc-D2D7 +
scalarreproof + lineindex + analysisb) after the captain HELD recipepath
(replicated directional contra: +5.42 2/8 then +7.80 1/8, all estimators
positive both sets — failed its own banked −13.05 replication, differing in
kind from the set's straddles). This subset sum decides a 6-member landing.
Stream discipline: **every run below is pin-stream (no `--seed` flag)**,
warmups unscored.

## Subset construction (reproduced, not copied — then byte-verified)

Re-applied the 6 member diffs onto this tip following
`docs/perf/waves/wave-2/integrate-set4.md`'s filed rebase record:

- Bit-exact via `git apply` (each `--check`-clean on the tip, reproducing the
  filed record): extend (2 files), scalarreproof (serializer.rs + new
  247-line parity suite), lineindex (site.rs), realloc identity.rs (D2),
  analysisb 5 clean files (imports/jsx_attrs/object/structured/gates),
  sysprefix cascade/mod.rs.
- realloc D7 hand-rebase (sources.rs): `use std::path::{Path, PathBuf}` +
  `dir_bytes` + exact-capacity push-push closure, landed file-name sort
  retained. D1 YIELDS (site deleted by landed collect — not re-pointed).
- analysisb 4-file Fx-compose (conditions/css/jsx/mod): Cow import std-first,
  `KeyClass<'a>` + borrowed ident/string + owned numerics, test helper →
  `Option<String>`; css/jsx `FileBindings`-only import + shared `bindings`
  param + `<'a,'b>` visitors (Fx sets retained); jsx D5 flatten verbatim;
  mod `source_facts` + both content gates verbatim, Fx `is_shadowed` untouched.
- sysprefix/selpush compose (escape.rs + name/mod.rs): `position`/`advance`
  after `push_sanitized`; `SelectorPrefix` + `push_selector_with_prefix` +
  full rewire verbatim; `nested_base_hint(atom, prefix)` with
  `1 + prefix.escaped_len() + 2` via the trivial accessor; 2 pin tests at the
  banked location.
- Recipepath's 2 files (`stylesheet/emitter/mod.rs`,
  `emitter_ordering_tests.rs`) STAY AT TIP. Tree = 18 tracked modified + 1
  new (`tests/serializer_parity.rs`), verified by count.

Reproducibility proof: after independent derivation, all 19 files
diff-compared (read-only `cmp`) against swarm-intset4's live worktree files
(`.../subagent-v2-01a0c59e-e36c-7f83-b1df-781f527ec8ac-01a0c71d-087e-7a32-a267-5ad7377fabea`,
20M + INTEGRATE.md + parity): **18/19 byte-identical on first compare**; the
single differ was one doc-comment line on the novel `escaped_len` accessor
(the only text the rebase record under-specifies — mine read
`/// The escaped byte length.`, intset4's reads
`/// Escaped prefix bytes, for capacity hints downstream.`). Adopted intset4's
comment line post-compare for byte-identity (disclosed here — derivation was
independent, the compare proved convergence); **final state 19/19 IDENTICAL**,
re-verified after the timed block's file dance. Subset tree = intset4 FULL
tree minus exactly recipepath's 2 files.

## Quality + correctness results

- `pnpm agentrs c atomic`: **605 + 1 + 5 passed, 0 failed** vs **595 + 1** on
  clean tip (file-aside compared — never `git stash`) — delta is exactly the
  15 carried-over atomic tests (intset4's 17 minus recipepath's 2 pins),
  each enumerated by name and green (list below). Zero other movement.
- `pnpm agentrs c --crate module_graph` (the runner's `--crate` flag; bare
  `module_graph` misroutes to a test-name filter): lib **6 passed** (subset)
  vs **2 passed** (tip) — delta exactly the 4 extend tests; all 14
  integration suites count-identical across arms
  (8/4/5/9/8/8/6/4/9/4/12/7/10/9 — a counts diff shows only the lib 2-vs-6
  line). Zero other movement.
- New tests by name (19 total = intset4's 21 minus recipepath's 2; realloc 0):
  sysprefix: `test_selector_prefix_agrees_with_inline_pushes`,
  `test_selector_with_prefix_matches_system_path`; extend:
  `normalized_predicate_matches_the_walk`, `dir_borrows_match_owned_dirs`,
  `ancestors_walk_dir_to_root`, `ancestors_stop_at_depth_cap`;
  scalarreproof: `scalar_fast_frame_matches_diet_on_each_live_w`,
  `scalar_fast_frame_fuzz_matches_diet_on_every_w`,
  `container_fallback_fuzz_matches_diet_on_every_w`,
  `when_steps_match_diet_on_every_byte_value`,
  `scalar_values_match_diet_on_every_byte_value`,
  `adversarial_cases_match_diet_on_every_w`; lineindex:
  `tail_is_ascii_checks_every_word_position`,
  `line_index_ascii_tail_matches_scan`; analysisb:
  `css_walk_gate_needs_css_bytes`, `jsx_walk_gate_needs_lt_bytes`,
  `lt_free_css_files_keep_their_exact_keys`,
  `recipe_only_files_predict_nothing_through_either_gate`,
  `css_free_jsx_files_predict_through_the_gate`.
- `pnpm agentrs q` on all 19 touched `.rs` files: **0 code violations**,
  5 warnings = the SAME 5 intset4 filed (identity.rs length 441, sources.rs
  length 410, `scan_conditions` cognitive-22 — all tip-pre-existing;
  site.rs length 392 — banked-shape; jsx_attrs.rs length 366 — disclosed
  merge-tripped soft warning). Zero new warnings.
- styletrace failure-set comparison vs tip (file-aside compared,
  `cargo -p styletrace`): **31 passed / 18 failed on BOTH arms,
  byte-identical failure sets AND pass sets** (`cmp` clean on both; all 18
  the pre-existing worktree-env failures). Zero new reds.

## Subset sum confirm (base arm = ddce131e7, subset = all six)

Binaries built in-tree per arm via input-hash-gated `ensure-native` (2
"Building native binary" invocations, each with `Compiling atomic` +
`Finished release`: subset 24.75 s fresh, base 9.33 s rebuild after the
file dance to tip), asided to `/tmp/intset4b/arms/`, never rebuilt mid-set;
sha256 verified before AND after every one of the 28 timed runs (56/56
`ok`, zero mismatches; the harness aborts on any mismatch): base
`f7d16971…`, subset `db2133fa…` (distinct; asides re-verified 2/2 after the
block). Arm selection via `REFERENCE_UI_NATIVE_PATH` (sole-candidate
override — a wrong-arm run is impossible). No wrapper variants: the set
touches only `.rs` internals, no N-API seam change (one `build:js` for the
whole block). In-tree `reports/latest/*` (tracked, bench-regenerated)
reverted after the block. Sample = `scales[0].samples[0].syncMs`, cssCalls
7527 and bundle bytes 2,867,925/214,466 on all 22 enterprise runs.

Zero sets discarded: no regime shifts (base median 977.87, in line with
intset4's 974–983 across nine sets; within-set interleaving controls
drift). First-touch warmup spikes (W-B1 1346.27, W-C1 1134.94 on each fresh
binary's first warmup — W-B1 larger than intset4's 1151–1173 band but the
same first-load-validation shape) are confined to unscored warmups,
disclosed, not discarded (nothing scored was affected). One setup stumble:
the first block attempt failed at `pnpm build:js` (script lives in
`packages/reference-rs`, not the root — fixed to
`pnpm --dir packages/reference-rs build:js`, no data taken before the fix).

Warmups (unscored): base 1346.27, 992.15; subset 1134.94, 963.63.

| pair | base syncMs | subset syncMs | Δ ms | Δ % | order |
| --- | --- | --- | --- | --- | --- |
| 1 | 972.78 | 970.20 | −2.57 | −0.26% | B,C |
| 2 | 986.44 | 955.84 | −30.60 | −3.10% | C,B |
| 3 | 977.35 | 960.61 | −16.74 | −1.71% | B,C |
| 4 | 971.34 | 965.53 | −5.81 | −0.60% | C,B |
| 5 | 981.93 | 967.06 | −14.86 | −1.51% | B,C |
| 6 | 968.01 | 956.59 | −11.42 | −1.18% | C,B |
| 7 | 978.38 | 956.62 | −21.76 | −2.22% | B,C |
| 8 | 979.97 | 955.30 | −24.67 | −2.52% | C,B |

- Base median: 977.87; subset median: 958.62; median Δ **−19.25 ms
  (−1.97%)**, **8/8 favor**.
- Ex-run-1: base 978.38, subset 956.62, Δ **−21.76 ms** — stands.
- Median of pair deltas: **−15.80**. All three estimators agree (−15…−22).
- No spikes on either arm (subset 955–970, base 968–986).

Against intset4's FULL −14.07/−1.43% (6/8, ex1 −13.16, paired −26.92): the
subset resolves **−19.25/−1.97% (8/8, ex1 −21.76, paired −15.80)** — this is
the brief's ≈−20 branch, not the ≈−14 branch. The subset beats FULL on the
median (−19.25 vs −14.07) and ex-run-1 (−21.76 vs −13.16) with a unanimous
8/8 (vs 6/8); estimator spread is tighter (−15…−22 vs −13…−27). Recipepath
was harmful in composition — the subset lands bigger, with no red cells.

4-scale byte-identity (base vs subset, both arms vs sealed wave-1 pins; full
64-char strings verified character-for-character on enterprise, prefix+suffix
+ exact byte size on the other scales per crew protocol):

| scale | styles.css (both arms) | runtime-data.mjs (both arms) |
| --- | --- | --- |
| enterprise | `7ec827fb…e10dcea` (2,867,925 B) ✓ pin | `718d19e4…378918` (214,466 B) ✓ pin |
| small | `ecdec1e8…bda2973` (92,651 B) ✓ pin | `ad9194f4…e994d41` (91,030 B) ✓ pin |
| medium | `37f2ef5b…94819fe` (348,780 B) ✓ pin | `54735e4d…8cfe7ce` (110,241 B) ✓ pin |
| churn | `1aad4978…b10ec05` (8,289,806 B) ✓ pin | `e1349305…3f18cdb` (103,709 B) ✓ pin |

Full hashes: ent css `7ec827fb0c0cf6856f12fe9557f977505ec745b57ef8d8a62ed46df05e10dcea`,
data `718d19e470176b97350c576ef79566f659d6db85253b66b0bb7a2b19b7378918`;
small css `ecdec1e80f8e71a8…bda2973`, data `ad9194f41181aaee…e994d41`; medium
css `37f2ef5b43f8b7cb…94819fe`, data `54735e4d5a51c567…08cfe7ce`; churn css
`1aad4978ffdc1ba1…deb10ec05`, data `e134930586eb56a5…f70103f18cdb`.
Cross-scale single-sample syncMs (directional, not claimed): small 90.7→90.3,
medium 154.3→152.4, churn 1979.3→1884.4.

Determinism: all 22 enterprise runs hash to exactly 1 distinct css sha + 1
distinct data sha, both == sealed pins; all 6 cross-scale runs
pin-identical per scale (1 sha each). 28/28 timed runs at pins, zero non-ok.

## Recipepath HOLD note

**HELD** pending an isolation of the suspected cloneplasma × allocator
interaction: recipepath banked −13.05 (7/8) on pre-cloneplasma 3dd32a6 but
measured +5.42 (2/8) and +7.80 (1/8) on the cloneplasma-relieved tip, and
this subset confirm shows the 6 without it resolving −19.25/8/8 — stronger
than the FULL −14.07 that included it. The crew itself attributed the bulk
of its −13 to allocator second-order effects, which cloneplasma relieved
first. Re-proof spec: in-composition evidence (a recipepath-including arm
vs this subset on the same tip, or a mechanism isolation showing where the
composition goes contra) — not another member-alone LOO.

## Verdict

**LAND-SUBSET6 (sysprefix + extend + realloc-D2D7 + scalarreproof + lineindex
+ analysisb, −19.3 ms / −1.97% medians, 8/8, ex-run-1 −21.8, paired-median
−15.8 — all estimators agree; beats intset4's FULL −14.07 on median and
ex-run-1 with a unanimous 8/8, confirming recipepath was harmful in
composition; 4-scale byte-identity vs sealed pins; determinism 28/28;
suites 605+1+5 with delta exactly the 19 carried-over tests; quality 0
violations with the same 5 pre-existing-or-banked-or-disclosed warnings,
zero new; zero new reds; realloc D1 yielded to landed collect; subset tree
19/19 byte-identical to intset4's FULL tree minus exactly recipepath's 2
files). Recipepath HELD per the note above.**

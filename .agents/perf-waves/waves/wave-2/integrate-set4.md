# INTEGRATE.md — wave-2 set-4 on landed base ddce131e7 (swarm-intset4)

Base pin verified: `git rev-parse HEAD` = `ddce131e7ab9a627500b5caa3d24bce81204dfe4`
(tip = set-1 + set-2 + set-3 + cloneplasma LANDED: 13 diets). Tree was clean at start.
No commits, no pushes — the captain lands.

Working verdict: **LAND (whole set, −14.1 ms / −1.43%, all estimators
agree)**. Final verdict line at the bottom of this file is authoritative.

Bank patches + member reports were read from the parent workspace
(`docs/perf/waves/wave-2/`, absent at this tip commit); nothing was copied into
this tree. Merge protocol follows `integrate-set3.md`. Stream discipline:
**every run below is pin-stream (no `--seed` flag)**, per the cloneplasma
correction — including all LOO sets and identity runs.

## Per-change paragraphs

**sysprefix (system-prefix format-once, 3 files, micro-bank ~1.04 ms release
probe on pre-set-2 base).** `SelectorPrefix::for_system` escapes `{system}__`
ONCE per `write_utilities` call; each atom replays it via one `push_str` +
`cursor.advance`. Eliminates 423,090 redundant char-escapes/sync (23,505
atoms × 18). `cascade/mod.rs` applied bit-exact; `name/escape.rs` +
`name/mod.rs` composed with LANDED selpush per the crew's specified fix (below).
NO order changes (sort/group/key untouched).

**extend (ladder-alloc diet, 2 files +232/−38, banked +8.6 ms crew-sign on old
base).** `ModuleKey::new` already-normal fast path, zero-alloc ancestor cursor
(`ancestors_iter`, exact old sequence incl. the `"/" → ["/","/"]` quirk and
32-cap), ladder scratch buffers (`node_hit`/`package_hit`/`find_tsconfig`).
Removes ≈290k alloc-ops + 67k path walks per sync. Applied to this tip
**bit-exact** via `git apply` (module-graph untouched by everything landed —
`git apply --check` clean, the mechanical proof).

**realloc (reserve-once D2+D7; D1 yielded, below).** `normalize_path` sizes
`parts` at separator-count + 1 (D2, −37,728 reallocs); `sorted_entries` builds
each entry path with `PathBuf::with_capacity(dir+1+name)` + two pushes,
byte-identical to `entry.path()` (D7, ~−15,158). `identity.rs` applied
bit-exact; `sources.rs` hand-rebased onto collect's landed walk as the same
change (landed file-name sort retained). D1 (glob char-vec reserve) YIELDS to
landed collect's zero-alloc matcher on the collect crew's own filed race note
+ static audit (adjudication below) — its site no longer exists at tip.

**recipepath (recipe escape-once, 2 files +60/−5, banked −13.05 ms / −1.30% on
3dd32a6).** `escaped_base_selector` escapes `.{class_name}` ONCE per rule
(1,427 rules); each atom clones the base and runs the untouched nest loop;
sort buckets reuse the same value. Eliminates 9,057 whole-string escape scans
+ 10,484 String allocs/sync. Applied to this tip **bit-exact** via `git apply`
(emitter untouched since the crew's base — mechanically verified).

**scalarreproof (WhenSteps generic frame, serializer.rs + new 247-line parity
suite, banked +0.24 ms phase marginal vs landed diet).** The HELD set-2 member
re-derived natively on keys2's generic `LookupKey<'a, W>` signature: the
`WhenSteps` trait normalizes all three live `W` (`[String]`, `Vec[String]`,
`[Box<str>]`) to `&str` rows for the hand-rolled five-tuple frame; containers
keep the landed diet body verbatim. Proven-identical over ≈1.09M differential
checks, 0 divergences. Applied to this tip **bit-exact** via `git apply`
(serializer.rs untouched since the crew's base — mechanically verified).

**lineindex (ASCII-tail SWAR, 1 file +65/−1, banked −2.9 pooled-16).**
`LineIndex::line_col` scans the tail with word-AND `tail_is_ascii`; ASCII →
`column = tail_bytes + 1` by arithmetic; high bit falls through to the
unchanged walk. Removes the UTF-8 decode + `len_utf16` sum over 82,582
queries × 149.2 mean tail bytes (12.32 MB), zero build change. Applied to this
tip **bit-exact** via `git apply` (site.rs untouched since the crew's base).

**analysisb (D1–D5 expectations diet, 9 files, banked −0.64 sub-noise on
pre-set-2 base).** Per-surface content gates (D1: css walk iff content contains
`css`, JSX walk iff `<` — skips all 3,122 JSX walks on the load), borrowed
static keys `Cow` (D2: −40,621 entry Strings), borrowed import spellings (D3),
single shared import scan (D4), flattened member-tag probe (D5). The 5 clean
files applied bit-exact; conditions/css/jsx/mod composed with LANDED set-2
hashers exactly as the crew pre-analyzed (orthogonal-line mechanical compose,
Fx retained — below).

## Collision analysis (rebase/merge record with file:line evidence)

`git apply --check` on the landed base before any work: extend clean,
recipepath clean, scalarreproof clean, lineindex clean, realloc fails
(glob.rs:39, sources.rs:5 — identity.rs clean), analysisb fails
(conditions/css/jsx/mod — imports/jsx_attrs/object/structured/gates clean),
sysprefix fails (escape.rs:57, name/mod.rs:106 — cascade/mod.rs clean).

**(1) realloc D7 × collect-LANDED → hand-rebased mechanically (sources.rs
only).** Collect's landed `sorted_entries` kept the `entry.path()` referent
(tip lines 50-56) and changed only the sort comparator (file-name order).
Banked D7 applied as the same change: `use std::path::{Path, PathBuf}` (:7)
+ `dir_bytes` + exact-capacity push-push closure (:50-70), landed
`sort_unstable_by(file_name)` retained (:72). `entry.path()` = dir.join(name)
= push-push — byte-identical by construction; the landed sort compares
`file_name()`, unaffected by path construction. No other `sorted_entries`
callers exist beyond the two landed walk drivers (repo-wide grep); signature
unchanged — zero fallout surface.

**(2) realloc D1 × collect-LANDED → YIELDS (hunk-level, site deleted by landed
zero-alloc rewrite).** The banked D1 referent (`let chars: Vec<char> =
candidate.chars().collect();` in `matches`) no longer exists: collect's landed
D2 rewrote the matcher as a zero-alloc byte-indexed walk (`matches` → direct
`match_from`, glob.rs:43-45). Adjudication evidence (cloneplasma⊃authcss
shape — the weaker yields on evidence, never assertion):
- The collect crew's own filed race note (report-swarm-collect.md:201-208):
  "their site census (s:glob 60,516 ...) counts the same allocs D2 removes
  entirely (no-alloc subsumes exact-capacity here). First sound LAND wins the
  site" — collect LANDED (set-3). The note names this exact outcome.
- Static zero-alloc audit of the landed match path: `matches` (:43-45),
  `match_from` (:171-197), `decode_at` (:200-203, borrowed), `single_hit`
  (:206-213), `class_hit` (:154-167), `StarStep::run/extend` (:225-248, byte
  indices), `StarSegments::run` (:260-272), `next_segment_end` (:281-284) —
  zero `Vec`/`String`/`collect`/alloc expressions on the path. A path that
  never allocates cannot grow-realloc, definitionally.
- Count agreement: collect D2 filed "~270k + ~60–90k growth reallocs" removed,
  bracketing realloc's s:glob 60,516 — both crews count the same work, collect
  removes strictly more (the whole vec, not just its growth).
- A fresh count probe was considered and refused as uninformative: both crews'
  filed counts already agree, and re-instrumenting the 11-file realloc guard
  set to confirm zero reallocs on a provably zero-alloc path would prove only
  what the audit already establishes structurally.
D1's 60,516 banked reallocs live on in collect's landed removal — nothing is
lost, nothing is double-claimed. Realloc lands as D2+D7 (−52,886 counted
removal). The remaining `parse` collect (glob.rs:31) is pattern-compile-cold
(once per pattern per sync, 0× on the open-scope bench) — redirecting D1 there
would be designing new coverage not present in either patch, refused per the
HOLD rule.

**(3) analysisb × hashers-LANDED → hand-rebased mechanically (4 files; the
briefed crew-pre-analyzed compose).** Set-2 converted analysis sets to Fx
(imports, decls, struct fields). Every banked hunk re-applied as the same
change; all Fx sites retained, not redesigned:
- conditions.rs: `use std::borrow::Cow;` added first (file convention:
  std-first, :12-14; landed `oxc_ast`/`rustc_hash` lines retained);
  `KeyClass<'a>` + `Cow::Borrowed` ident/string + `Cow::Owned` numeric
  (:19-50); test helper → `Option<String>` + arm updates (:65-108). Landed
  `is_style_value_position`/`style_set` Fx lines untouched.
- css.rs: import → `FileBindings` only (:16); doc + `bindings: &FileBindings`
  param + `bindings,` (:24-40); `CssVisitor<'a,'b>` + `&'b FileBindings` field
  (:47-55, Fx `style_props`/`shadows` retained); both impl blocks → `<'a,'b>`
  (:57, :136).
- jsx.rs: same four edits (:23, :35-51, :60-72 with Fx `style_props`/`hosts`/
  `shadows` retained, :196) + D5 flatten (`allows_tag`, :96-98, banked
  verbatim — old text matched tip exactly).
- mod.rs: `analyze` body → `source_facts` (:118); `source_facts` + both gates
  inserted banked-verbatim between `analyze` and `is_shadowed` (:124-163);
  landed Fx `is_shadowed`/`record_*` untouched. Sole `expectations` callers
  are these two lines (repo-wide grep) — the D4 signature change is closed.
- imports.rs/jsx_attrs.rs/object.rs/structured.rs/gates.rs: zero landed
  overlap — bulk `--include` apply is the mechanical proof.

**(4) sysprefix × selpush-LANDED → composed per the crew's specified fix
(name/escape.rs + name/mod.rs; cascade/mod.rs bit-exact).** Selpush's banked
patch has since LANDED exactly where the crew predicted (certain textual
conflict in both files). Composition keeps both mechanisms:
- escape.rs: selpush's `push_inner`/`push_first`/`push_runs`/`push_take`/
  `push_ident_run` retained verbatim (:65-125); sysprefix's `position`/
  `advance` inserted after `push_sanitized` (:59-69, the banked position).
  Index accounting verified under composition: `push_char` += 1 (:51),
  `push_ident_run` += end-pos (:122), sanitized-space += 1 (:96) — `for_system`
  (built via `push`) yields identical bytes+index, as the crew verified from
  selpush's patch. Pinned post-compose by the carried-over agreement test.
- name/mod.rs: `SelectorPrefix` + `push_selector_with_prefix` + full rewire
  banked-verbatim; `push_selector_with_system` keeps its signature as the
  one-shot wrapper (sole external caller: cascade `write_rule`, now on the
  prefix path; in-file `selector_with_system` unchanged).
- `nested_base_hint` (selpush's D3, the second predicted collision): the
  threaded prefix replaces the `system: &str` binding (forced type-chain
  fallout — the hint's only caller is `push_nested_selector`, repo-wide
  grep-closed). Composed as `nested_base_hint(atom, prefix)` with `1 +
  prefix.escaped_len() + 2`, via one trivial accessor (`escaped_len`, the
  escaped byte length). Capacity-only: for ident-body systems the hint is
  roomy by ≤2 bytes (escaped `__` already counted + kept `+2` slack); for
  empty systems it is exact (0+2, same as before). Behavior-identical in all
  cases; the formula shape and selpush's capacity win are preserved.
- The two carried-over pin tests applied at the banked location (ahead of
  `test_class_name_fraction_and_token`, untouched by selpush).

**(5) Within-set → NO textual collisions.** The seven file sets are pairwise
disjoint (sysprefix: cascade+name; extend: module-graph; realloc:
identity+sources; recipepath: emitter; scalarreproof: serializer+parity;
lineindex: site; analysisb: analysis+gates). All seven per-member tree diffs
verified `git apply --check`-clean against the tip — the mechanical proof
(LOO construction relies on it). Behavioral pairs below.

**(6) Member×landed (beyond the three composed collisions) → NO overlap,
verified mechanically.** extend/recipepath/scalarreproof/lineindex `git apply
--check`-clean on the tip = their files untouched since each crew's base
(extend's base predates everything landed; recipepath/lineindex based on
post-set-3, scalarreproof on post-set-2 — the clean checks subsume the
`git diff base..tip` emptiness proofs). Realloc D2's `normalize_path`
(identity.rs) likewise clean — collect never touched it (collect's diff is
includes/*+sources; normpath is extract-side). Sysprefix's cascade/mod.rs
hunk clean — cascade emission untouched since the crew's base.

**(7) Behavioral pairs (file:line evidence).**
- sysprefix×selpush-LANDED semantics: different mechanisms (per-system
  format-once vs per-char run scans) sharing the cursor index contract. The
  replay restores the exact post-prefix index; the leading-char rule keys off
  `== 0` only — downstream escape decisions bit-identical. Byte-identity
  below + the bytes+position agreement test are the behavioral proof.
- sysprefix×recipepath (within-set): disjoint layers by construction —
  sysprefix threads the utilities path (`write_utilities` → cascade/mod.rs),
  recipepath hoists the recipes path (`group_recipe_atoms` → emitter/mod.rs);
  the recipepath crew closed the counts exactly (23,505 + 4,394 = 27,899).
  No double-count, no shared function.
- realloc-D7×collect-LANDED semantics: D7 changes path BYTES construction
  (identical bytes, fewer syscalls); collect changed sort ORDER basis
  (file-name) and walk FUSION. `WalkEntry.path` feeds `entry_is_dir`,
  `is_kept_dir`, extension gate, scope match, and reads — all byte-keyed,
  order-free. Same audit shape as set-3's union note.
- analysisb×hashers-LANDED semantics: hashers changed hash FNS (Fx), analysisb
  removes WALKS and STRINGS. `style_props`/`hosts`/`shadows` answer membership
  only; expectation bytes flow through unchanged serializers. Fewer ops ×
  faster ops — the crew-specified compose, same as set-3's proof×hashers.
- analysisb-D2×KeyClass consumers: `KeyClass::Static` consumers are
  object.rs (`&key` borrow site, within-member), structured.rs
  (`into_owned()`, within-member), jsx_attrs.rs (`&key`, within-member) —
  all inside this member's own diff, all composed. No external consumer of
  the owned-`String` shape exists (repo-wide grep for `KeyClass::Static`).
- scalarreproof×keys2-LANDED: the container fallback IS keys2's body verbatim;
  the scalar frame subsumes keys2's scalar-borrow (disclosed double-claim —
  stacking marginal is diet−fast only, measured by the crew). No other
  `serialize_lookup_key` caller exists beyond the two production wrappers
  (crew grep-closed, all three live `W` covered).
- extend×hashers-LANDED: hashers converted Fx types in adjacent module-graph
  files only (graph.rs, walk/*, ladder/memo.rs — set-2 stat; key.rs and
  ladder/mod.rs untouched, hence the bit-exact apply). Extend touches only
  per-call locals (normalization cost, ancestor materialization, probe-path
  joins); memo protocol untouched (ProbeMemo/memo.rs not in diff); walk/memo
  integration suites green on the composed tree.
- lineindex×extract-LANDED: `for_source` byte-identical to tip (extract's
  build ground untouched — queries only, per the crew's fence).

**(8) What the rebase did NOT do.** No hunk rewritten (all rebases are
same-change + retained landed types, or the crew-specified sysprefix compose);
no landed code converted, completed, or cleaned; `serializer.rs` callers
untouched (the frame keeps the landed generic bound + `WhenSteps`); no
opportunistic edits in any of the 21 files. Realloc D1 yielded, not
re-pointed (HOLD rule: no substitute sink designed).

## Quality + correctness results

- `pnpm agentrs c atomic`: **607 + 1 + 5 passed, 0 failed** (combined) vs
  **595 + 1** on clean tip (stash-compared) — delta is exactly the 17
  carried-over new tests (sysprefix 2, recipepath 2, scalarreproof 1 unit + 5
  integration, lineindex 2, analysisb 5), each enumerated by name and green
  (list below). Zero other movement.
- `pnpm agentrs c -p module_graph`: lib **6 passed** (diet) vs **2 passed**
  (tip) — delta exactly the 4 extend tests; all 14 integration suites
  count-identical across arms (8/4/5/9/8/8/6/4/9/4/12/7/10/9). Zero other
  movement.
- New tests by name (21 total; realloc 0):
  sysprefix: `test_selector_prefix_agrees_with_inline_pushes`,
  `test_selector_with_prefix_matches_system_path`; extend:
  `normalized_predicate_matches_the_walk`, `dir_borrows_match_owned_dirs`,
  `ancestors_walk_dir_to_root`, `ancestors_stop_at_depth_cap`; recipepath:
  `hoisted_base_matches_whole_string_path_on_system_prefixed_class`,
  `escaped_base_pins_leading_digit_and_scope_chars`; scalarreproof:
  `scalar_fast_frame_matches_diet_on_each_live_w`,
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
- `pnpm agentrs q` on all 21 touched `.rs` files: **0 code violations**,
  5 warnings = 3 tip-pre-existing (identity.rs length 435→441, sources.rs
  length 400→410 — both filed by the realloc crew as banked pre-existing;
  `scan_conditions` cognitive-22 — filed by the sysprefix crew, function
  untouched by the merge; all three reproduce on clean-tip `q`) + 1
  banked-shape (site.rs length 392 — the lineindex crew banked it with
  justification) + 1 DISCLOSED merge-tripped (jsx_attrs.rs length 365→366:
  landed growth brought the file to exactly the soft limit and the diet's
  required +1 net line (the D2 borrow binding) trips it; splitting a
  cohesive module for 1 line over a soft limit is churn — lineindex/set-3
  rationale; the captain rules).
- styletrace failure-set comparison vs tip (stash-compared,
  `cargo -p styletrace`): **31 passed / 18 failed on BOTH arms,
  byte-identical failure sets** (`cmp` clean; all 18 the pre-existing
  worktree-env failures in `tests::hermetic_roots` + `tests::tracing`,
  matching set-3/cloneplasma's filed 31/18 exactly). Zero new reds.

## Sum confirm (base arm = ddce131e7, combined = all seven)

Binaries built in-tree per arm via input-hash-gated `ensure-native` (9
"Building native binary" invocations: 1 fresh + 8 stale-rebuilds, each with
`Compiling atomic` + `Finished release`), asided to `/tmp/intset4/arms/`,
never rebuilt mid-set; sha256 verified before AND after every one of the 186
timed runs (372/372 `ok`, zero mismatches; the harness aborts on any
mismatch): base `8de32dfc…`, loo-sysprefix `d338f2a6…`, loo-extend
`d0194486…`, loo-realloc `2479668c…`, loo-recipepath `3a748c9e…`,
loo-scalarreproof `c9728f31…`, loo-lineindex `3237f213…`, loo-analysisb
`f7741bd2…`, full `fc31794a…` (all 9 distinct; asides re-verified 9/9 after the
block). Arm selection via `REFERENCE_UI_NATIVE_PATH` (sole-candidate
override, proven in `loader.ts`: override replaces the candidate list — a
wrong-arm run is impossible). No wrapper variants: the set touches only `.rs`
internals, no N-API seam change (one `build:js` for the whole block).
In-tree `reports/latest/*` (tracked, bench-regenerated) reverted after the
block. Sample = `scales[0].samples[0].syncMs`, cssCalls 7527 and bundle bytes
2,867,925/214,466 on all 180 enterprise runs.

Zero sets discarded: no regime shifts (base medians 974–983 across all nine
sets; within-set interleaving controls drift). First-touch warmup spikes
(W-C1 1151–1173 on each fresh binary's first warmup; the replication set's
W-C1 clean at 975.69 since its binary was already touched) are consistent
with first-load validation of each new `.node` file — confined to unscored
warmups, disclosed, not discarded (nothing scored was affected). One harness
smoke (base, 955.69, pin-ok, unscored, disclosed) preceded the block; one
earlier smoke attempt failed on a harness JSON-matcher bug before any data
was recorded (matcher fixed, no data taken).

Warmups (unscored): base 965.04, 972.33; full 1150.80, 1013.86.

| pair | base syncMs | full syncMs | Δ ms | Δ % | order |
| --- | --- | --- | --- | --- | --- |
| 1 | 1012.50 | 976.12 | −36.38 | −3.59% | B,C |
| 2 | 977.50 | 995.32 | +17.81 | +1.82% | C,B |
| 3 | 1031.33 | 967.66 | −63.67 | −6.17% | B,C |
| 4 | 980.82 | 955.56 | −25.26 | −2.58% | C,B |
| 5 | 984.55 | 977.57 | −6.98 | −0.71% | B,C |
| 6 | 988.37 | 954.26 | −34.10 | −3.45% | C,B |
| 7 | 965.38 | 969.57 | +4.20 | +0.44% | B,C |
| 8 | 974.06 | 945.48 | −28.58 | −2.93% | C,B |

- Base median: 982.69; full median: 968.62; median Δ **−14.07 ms (−1.43%)**,
  **6/8 favor**.
- Ex-run-1: base 980.82, full 967.66, Δ **−13.16 ms** — stands.
- Median of pair deltas: **−26.92**. All three estimators agree (−13…−27).
- No spikes on either arm (full 945–995, base 965–1031); P3b (1031.33) is
  the set's slowest base read, absorbed by the median.

4-scale byte-identity (base vs full, both arms vs sealed wave-1 pins; full
64-char strings verified character-for-character on enterprise, prefix+suffix
+ exact byte size on the other scales per crew protocol):

| scale | styles.css (both arms) | runtime-data.mjs (both arms) |
| --- | --- | --- |
| enterprise | `7ec827fb…e10dcea` (2,867,925 B) ✓ pin | `718d19e4…378918` (214,466 B) ✓ pin |
| small | `ecdec1e8…bda2973` (92,651 B) ✓ pin | `ad9194f4…e994d41` (91,030 B) ✓ pin |
| medium | `37f2ef5b…04819fe` (348,780 B) ✓ pin | `54735e4d…08cfe7ce` (110,241 B) ✓ pin |
| churn | `1aad4978…deb10ec05` (8,289,806 B) ✓ pin | `e1349305…f70103f18cdb` (103,709 B) ✓ pin |

Full hashes: ent css `7ec827fb0c0cf6856f12fe9557f977505ec745b57ef8d8a62ed46df05e10dcea`,
data `718d19e470176b97350c576ef79566f659d6db85253b66b0bb7a2b19b7378918`;
small css `ecdec1e80f8e71a8…bda2973`, data `ad9194f41181aaee…e994d41`; medium
css `37f2ef5b43f8b7cb…04819fe`, data `54735e4d5a51c567…08cfe7ce`; churn css
`1aad4978ffdc1ba1…deb10ec05`, data `e134930586eb56a5…f70103f18cdb`.
Cross-scale single-sample syncMs (directional, not claimed): small 86.4→87.0,
medium 151.6→151.0, churn 1998.4→1884.2.

Determinism: all 180 enterprise runs (all 9 arms) hash to exactly 1 distinct
css sha + 1 distinct data sha, both == sealed pins; all 6 cross-scale runs
pin-identical per scale. 186/186 timed runs at pins, zero non-ok.

## Per-component bisect (member-alone arms)

LOO binaries = tip + one member diff (per-member diffs verified
`git apply --check`-clean against the tip before the block; file counts
verified at apply time: 3/2/2/2/1+parity/1/9; tree restored to FULL after
each build and verified byte-identical to the saved FULL diff). Each LOO set:
2 warmups/arm + 8 interleaved pairs vs base. All LOO runs pin-identical
(outputs hashed every run — the per-member byte-identity proof under
composition).

LOO-SYSPREFIX pairs (base, cand): (974.40, 981.39), (991.30, 976.78),
(962.60, 966.38), (977.42, 973.29), (977.58, 968.62), (976.41, 986.83),
(971.22, 964.23), (979.89, 965.64). Warmups: base 978.62, 980.52; cand
1172.25, 986.73.

LOO-EXTEND pairs (base, cand): (970.33, 973.83), (981.64, 961.70),
(962.71, 959.87), (973.57, 954.45), (983.08, 960.37), (971.83, 989.92),
(983.46, 958.88), (979.20, 968.05). Warmups: base 962.91, 976.53; cand
1150.80, 956.89.

LOO-REALLOC pairs (base, cand): (967.90, 985.59), (980.76, 979.90),
(967.65, 972.44), (982.95, 975.57), (1037.05, 976.26), (990.45, 973.69),
(971.45, 973.86), (973.42, 977.79). Warmups: base 974.09, 966.83; cand
1173.08, 975.07.

LOO-RECIPEPATH pairs (base, cand): (980.42, 977.26), (986.55, 981.83),
(972.01, 978.65), (977.72, 982.90), (985.58, 989.61), (973.37, 982.12),
(971.59, 993.11), (975.38, 979.46). Warmups: base 972.75, 974.48; cand
1173.29, 976.41.

LOO-RECIPEPATH2 (replication, same binaries) pairs (base, cand): (977.20,
979.38), (967.60, 987.77), (978.83, 989.68), (978.25, 994.57), (981.12,
984.91), (976.29, 976.72), (979.71, 990.11), (979.13, 974.53). Warmups: base
977.98, 961.23; cand 975.69, 977.31 (no first-touch spike — binary already
touched in set 1).

LOO-SCALARREPROOF pairs (base, cand): (1022.16, 973.00), (968.74, 973.59),
(979.99, 1008.87), (992.45, 982.96), (972.79, 979.73), (984.37, 974.01),
(970.35, 983.60), (980.39, 981.89). Warmups: base 994.43, 964.19; cand
1153.67, 975.87.

LOO-LINEINDEX pairs (base, cand): (976.18, 965.22), (962.74, 963.80),
(972.50, 973.24), (983.48, 997.49), (991.43, 971.71), (974.58, 965.44),
(981.59, 971.24), (972.82, 975.18). Warmups: base 970.35, 969.12; cand
1173.45, 970.73.

LOO-ANALYSISB pairs (base, cand): (965.70, 968.41), (973.31, 963.28),
(973.57, 968.28), (974.41, 967.41), (980.24, 981.55), (1011.31, 976.81),
(981.13, 979.38), (973.30, 976.50). Warmups: base 969.82, 975.96; cand
1171.44, 971.73.

| set | median Δ (full) | median Δ (ex-run-1) | paired-median | pairs favor | banked |
| --- | --- | --- | --- | --- | --- |
| FULL (all seven) | −14.07 (−1.43%) | −13.16 | −26.92 | 6/8 | −33.5 (sum) |
| LOO-SYSPREFIX | −5.96 (−0.61%) | −8.80 | −5.56 | 5/8 | −0.31 (3/8) |
| LOO-EXTEND | −15.35 (−1.57%) | −18.83 | −15.13 | 6/8 | −8.63 (6/8) |
| LOO-REALLOC | −1.18 (−0.12%) | −5.19 | +0.77 | 4/8 | −7.95 (6/16) |
| LOO-RECIPEPATH | +5.42 (+0.56%) | +6.74 | +4.63 | 2/8 | −13.05 (7/8) |
| LOO-RECIPEPATH2 | +7.80 (+0.80%) | +8.94 | +7.10 | 1/8 | (replication) |
| LOO-SCALARREPROOF | +0.62 (+0.06%) | +1.89 | +3.17 | 3/8 | +0.24 phase |
| LOO-LINEINDEX | −3.90 (−0.40%) | −2.86 | −4.20 | 4/8 | −2.90 (10/16) |
| LOO-ANALYSISB | −1.54 (−0.16%) | +2.09 | −3.52 | 5/8 | −0.64 (5/8) |

(Banked signs normalized to cand−base: extend's crew-signed +8.63 = −8.63
here; scalarreproof's +0.24 is the phase marginal, whole-sync disclaimed.)

Additivity: LOO sum (−5.96 −15.35 −1.18 +5.42 +0.62 −3.90 −1.54) = −21.89 vs
FULL −14.07 — sub-additive by ~7.8 ms (no phantom stacking FOR us; the gap is
consistent with allocator-relief stacking across seven malloc-touching diets
on the cloneplasma-relieved base, plus combined median noise across nine
sets). Three members resolve >0 alone with all estimators agreeing
(sysprefix, extend, lineindex); two straddle sub-noise (realloc, analysisb);
scalarreproof reads ~0 as predicted (whole-sync disclaimed at bank — the
+0.24 phase marginal is its win evidence); recipepath resolves contra,
stably, in two sets.

Notes: extend re-measures far stronger than banked (−15.35 vs −8.63, all
estimators agreeing) — the ladder diet stacks well on the landed base;
reported as measured. Sysprefix resolves −5.96 (5/8, all agreeing) vs its
−0.31 micro-bank — stronger than the 1.04 ms probe, same direction; the
composition with selpush's landed runs composes favorably. Lineindex −3.90
(4/8, all agreeing) brackets its −4.42 mechanism prediction, matching the
banked pooled −2.90 shape. LOO-REALLOC's P5b (1037.05) is a slow-base box
outlier, mirror of the crew's spikes; medians robust, and the paired-median
(+0.77) honestly records the straddle. LOO-SCALARREPROOF carries mirror
outliers on both arms (P1b 1022.16, P3c 1008.87) — box noise, medians robust
at +0.62.

Recipepath (+5.42 set 1, +7.80 set 2, all estimators positive in BOTH sets)
stably contradicts its banked −13.05 (7/8): two independent 8-pair sets an
hour apart, same binaries, no regime shift (base medians 976.55/978.54, in
line with all other sets), arm integrity proven (stale-rebuild + `Compiling
atomic` + `Finished release` + distinct aside sha — a missing diet would have
reused the base bytes). The base difference vs bank is exactly landed
cloneplasma (banked on 3dd32a65, LOO on ddce131e7): the crew itself attributed
the bulk of its −13 to allocator second-order effects (~10k malloc/free pairs
whose cost sits in allocator self-time), and cloneplasma massively relieved
that same allocator pressure first — the suspected interaction (filed as
follow-up, not proven). This is exactly the wave-1 reserve shape (reserve
soloed **+16.5** and LANDED: "the sum clears the bar with headroom, so per
brief no component was dropped" — wave-1 INTEGRATE.md). The FULL sum here
clears with all estimators agreeing (−14.07/−13.16/−26.92), the measured FULL
artifact includes recipepath, and recipepath provably removes work (9,057
whole-string escapes + 10,484 String allocs, ×2-identical census;
byte-identical outputs on 4 scales here and at bank). Dropping it would
invalidate this sum-confirm and demand a fresh subset proof for a timing-only
question the HOLD rule (merge-mechanics-based, scalarjson precedent) does not
contemplate — and its merge is bit-exact with zero mechanics to hold.
Recipepath LANDS with the set; its contribution is resolved by the sum, per
precedent. The realloc/analysisb/scalarreproof sub-noise readings ride the
same precedent with the same three-part justification (artifact includes
them, sum clears, each provably removes counted work).

## Verdict

**LAND (whole set: sysprefix + extend + realloc + recipepath + scalarreproof +
lineindex + analysisb, −14.1 ms / −1.43% medians, 6/8, ex-run-1 −13.2,
paired-median −26.9 — all estimators agree; additive bisect −6.0 / −15.4 /
−1.2 / +5.4&+7.8-replicated / +0.6 / −3.9 / −1.5 with the recipepath stable
contra-reading and the realloc/analysisb/scalarreproof sub-noise readings
covered by the wave-1 reserve precedent with the full three-part
justification; 4-scale byte-identity vs sealed pins; determinism 186/186;
suites 607+1+5 with delta exactly the 21 carried-over tests; quality 0
violations with 4 pre-existing-or-banked warnings + 1 disclosed
merge-tripped soft warning for the captain's ruling; zero new reds; realloc
D1 yielded to landed collect on filed evidence).**

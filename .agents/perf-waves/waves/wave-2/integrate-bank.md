# swarm-intbank INTEGRATE: 5-patch combined set (diag + canon2 + cascade + parse + keys2)

Base pin verified: `git rev-parse HEAD` = `5844b24a81a528ace14fab63e908793a6829a874`;
integration branch `reference-system` tip == base (no wave-2 landings, confirmed
`git rev-parse reference-system` → same hash). All five captain-extracted patches
from `docs/perf/waves/wave-2/` applied with `git apply --check` then `git apply`,
all clean, zero textual collisions. Combined tree: 20 files, +556/−124.

## Per-change paragraphs (each verified against its patch)

(1) diag (`diag.patch`, 102 lines; 1 file +58/−12): `DiagnosticChannels::partition`
skips `render_fact` for unpushed analysis facts when `!render_compiler` (new
`partition_fact` helper, `channels/mod.rs:89-114`) plus an early return on empty
default channel (`:68-70`). Per-fact body moved verbatim (`continue`→`return`,
`channels.`→`self.` only). Two new unit tests pin the skips. Solo LAND accepted
at −19.9/−1.68% (ex-run-1 −18.3/−1.54%, both prongs); rides the set for one
landing + in-situ contribution measurement (LOG.md sequencing, wave-1 canon
precedent).

(2) canon2 (`canon2.patch`, 203 lines; 4 canon files +105/−13): no-alloc case
folding in value classify — shared `cmp_lower_probe` comparator (`values/mod.rs`,
+24), `binary_search_by` in `is_named_color` and `function_kind` (raw name, no
lowering), `eq_ignore_ascii_case` linear scan for the 7-entry keyword table. No
table changed. Three permanent member-contract tests. BANK (captain override of
intcanon2 LAND: solo −15.3/−1.36%, ex-run-1 −12.8/−1.14% misses the pct prong;
8/8 pairs + 848-input differential prove a real ~13–15 ms effect).

(3) cascade (`cascade.patch`, 159 lines; 1 file +59/−44): fused `from_atom` scan
(`scan_conditions`, 3 condition passes → 1) + rank memo (`FxHashMap<&str, u8>`,
23,505 computations → 46) + lazy tiebreak (`.then` → `.then_with`,
362,743 `cmp_whens` → 1,399). Stable sort, same comparator decisions, byte-identical
4-scale. BANK (captain override of crew CUT: solo +3.4/ex-run-1 −0.6 vs ±20 noise;
~3–5 ms theoretical on a ~20 wt ceiling, unresolvable alone — the sum-confirm
exists precisely to resolve it).

(4) parse (`parse.patch`, 728 lines; 12 files +316/−41): retained-program reuse
killing styletrace + identity re-parses. `run_parse_phase` builds two maps in
`reuse_programs` (position-keyed for identity, path-keyed for styletrace);
`IdentityGraph::with_programs` folds via shared `collect_map`; styletrace takes
`TraceSources { staged, programs }` and walks via shared `trace_program`. Unmapped
positions fall back to bytes (panicked/streamed; errored for trace only — C1
keep-alive preserved). Mechanism counts: −45.1% bytes parsed, −3,242
`Parser::parse` calls, 0 fallbacks on load. BANK (~21 wt ceiling; solo A/B read
zero +1.6/ex1 +0.2 under documented extreme box noise).

(5) keys2 diet (`keys2.patch`, 65 lines; 2 files +18/−14): scalar borrow through
`serialize_lookup_key` (canonicalization is the identity on scalars — borrow
instead of clone, provably identical bytes) + borrowed `when`
(`LookupKey<'a, W: ?Sized>` generic, `OwnedLookupKey::lookup_key` passes
`self.when.as_slice()` instead of cloning a `Vec<String>`). BANK (−3.3 ms phase:
3.29/3.37 two runs, 106,278/106,278 byte-parity). The unified `KeyMemo` was CUT
(loses 5–15 ms on phase) and fully reverted — confirmed: patch touches only
`facts.rs` (3-line hunk) + `serializer.rs`, and `grep -rni keymemo|key_memo`
over atomic+canon in the combined tree returns NOTHING. `proof/render.rs`
touched-then-reverted per crew report; final patch does not touch it.

## Collision analysis (one paragraph per checklist item, file:line evidence)

(1) All-pairs file disjointness (mechanical, from `diff --git` headers): diag =
`atomic/src/diagnostics/channels/mod.rs`; canon2 = `canon/src/css/values/`
{classify, functions, mod, named_colors}.rs; cascade =
`atomic/src/stylesheet/cascade/mod.rs`; keys2 = `atomic/src/diagnostics/facts.rs`
+ `atomic/src/runtime/serializer.rs`; parse = `atomic/src/extract/`
{identity, identity_map, identity_tests}.rs + `atomic/src/`{hosts/mod, lib}.rs +
`styletrace/src/`{analysis/{analyzer, mod, parser/mod, surface}, lib,
tests/{owned_props, trace_gate}}.rs. 1+4+1+2+12 = 20 distinct files, ZERO
overlaps. (Single integrates already proved the diag/canon2/cascade/parse
4-way; this adds keys2's 2 files — also disjoint.) All five `git apply` clean
with no fuzz, confirming textually.

(2) Behavioral pairs, hunted from the combined-tree code:
- diag×keys2: closest pair in the set — same diagnostics pipeline. keys2's
3-line `lookup_key` hunk (`facts.rs:30-35`) changes what `render_expected`
(`policy/analysis.rs:23`, inside `render_fact`) pays per analysis fact, and
diag's `partition_fact` (`channels/mod.rs:94-96`) skips that whole render when
`!render_compiler`. INDEPENDENT semantically: keys2 preserves bytes of every
`lookup_key()` call; diag preserves which renders are read (only unread ones
skipped). Composition effect is purely additive-subtractive on timing: diag
removes some `lookup_key` calls entirely, keys2 speeds the remainder — so
diag's marginal in-combination contribution may read slightly SMALLER than its
solo −19.9 (the dead work it removes got cheaper). `channels/mod.rs`
references `OwnedLookupKey` only as a type (import `:180`, test helper
`:276-277`); keys2 changes no type shape. `is_pushed_fact` (`:137-140`) and
`is_false_fact` (`:145-150`) are byte-identical to base+diag (keys2 touches
neither).
- canon2×keys2: DISJOINT call graphs. keys2's `serialize_lookup_key` path uses
only `canonical_json_value` (pure serde_json BTreeMap key-sort,
`serializer.rs:10-23`) — zero canon-crate calls. canon2's consumers in atomic
are `extract/harvest/classify.rs` + `resolve/tokens/mod.rs`, neither of which
calls `serialize_lookup_key`/`lookup_key` (grep-verified empty). `builder.rs`
uses both `LookupKey` (`:33`, plan keys) and `canon::resolve_canonical_prop`
(`derive_slot`) but in different functions, and canon2 doesn't touch
`resolve_canonical_prop` (`canon/src/lib.rs:40`, outside `values/`).
- parse×diag: NO adjacency. Parse's `lib.rs` edits live inside `run_parse_phase`
(`:210-232`: `reuse_programs` call, `with_programs`, `hosts::resolve` 5th arg)
plus the new `reuse_programs` fn (`:427-451`). Diag's caller `partition_channels`
(`:326-344`) is a separate function called from `compile` (`:145`), textually
untouched by parse. The only shared datum is `diag_session.facts()` → partition
input; parse preserves walk results byte-for-byte (shared `collect_map` /
`trace_program` bodies + fallback-pinning tests), so diag sees identical inputs.
- parse internal (styletrace vs identity reuse): SEPARATE maps, independent
fallbacks. `reuse_programs` builds `identity: HashMap<usize, &Program>` and
`trace: HashMap<PathBuf, &Program>` in one loop — shared iteration, disjoint
maps with different key types and membership rules (trace excludes errored
positions for C1 diagnostic reproduction; identity includes them since
`collect_map` never fails). Identity fallback: `parse_position`
(`identity.rs:297-305`) re-parses bytes when unmapped. Styletrace fallback:
`parse_trace_module` (`parser/mod.rs:56-86`) re-parses when unmapped. Neither
fallback reads the other's map. Sub-bisectable cleanly (see Bisect).
- cascade×all: cascade sorts atoms at stylesheet emission (`write_utilities`),
strictly downstream of extract/plan/diagnostics. Order-sensitivity: NONE —
cascade keeps stable `sort_by` with decision-identical comparator (lazy
`then_with` evaluates the same `cmp_whens` on ties; fused scan returns the same
triple; memo caches a pure function of `prop`). Its input (AtomSet) is
byte-identical under every other patch (each proven solo on sealed hashes), and
its output is byte-identical solo — composition preserves bytes. Note the
sortshape CUT finding (67/67 full ties diverge in selector bytes) makes this
order-preservation load-bearing: any order change would shift output. Cascade
changes no order.
- keys2×cascade: NO surface. `cascade/mod.rs` contains zero references to
`lookup_key`/`LookupKey`/`serialize` (grep-verified). `CascadeKey` (bucket/at/
width/selector/property/prop/value) is unrelated to `LookupKey` (system/when/
prop/value/important). Plan keys feed the runtime plan (`builder.rs`), not
emission sort.

(3) Regen/tests: all patches hand-written — zero `generated`/`codegen`/`include!`
markers in any of the 20 touched files (grep-verified), and `modules/{atomic,
canon, styletrace}` have no `build.rs`. No emitter covers `canon/src/css/values/`
(per intcanon2; `@generated` lives only in sibling emitter-owned files). New
tests per patch, run explicitly in the combined tree (see Correctness): diag ×2
(`channels/mod.rs:403,414`), canon2 ×3 (`classify.rs:266`, `functions.rs:229`,
`named_colors.rs:197`), parse ×2 (`identity_tests.rs:344`, `owned_props.rs:249`).
Cascade and keys2 add no unit tests (mechanism counts + corpus byte-parity instead).

(4) Soundness re-verification in the COMBINED tree (solo proofs assumed base
surroundings — re-checked with all five present): diag vacuity holds —
`is_pushed_fact`/`is_false_fact`/`remove_rendered`/`sweep_false_echoes` bodies are
base+diag only (no other patch touches `channels/`), and keys2's borrow changes
no render bytes, so "unread renders" stays exact. Parse fallbacks hold —
`parse_export_map` (identity fallback) and `module_source`+`Parser` (trace
fallback) bodies are untouched by every patch; downstream consumers (`hosts`,
analyzer walk, `ValueGraph`) see identical programs. Canon2 order-equivalence
holds — no other patch touches `modules/canon` (combined `git diff --name-only`
grep-verified: only canon2's 4 files), and its callers are unmodified. Cascade
order-preservation holds — sort input byte-identical per (2). Keys2 byte-identity
holds — `serde_json::to_string` tuple path untouched by all others.

(5) Bank conditions from LOG.md: (a) cascade's NEW cognitive-22 on
`scan_conditions` (`cascade/mod.rs:155`): `pnpm agentrs q` exit is GREEN — 0 code
violations (see Quality), so the quality gate does not require a split; accepted
with written rationale: the gate fails on violations, not warnings; the 22 comes
from the fused match that IS the mechanism (splitting the loop re-walks
conditions and kills the fusion; splitting the bucket tail saves ~2-4 points and
still warns); precedent — diag's file carries a pre-existing length warning and
banked. Integrators do no new work: no split written, no HOLD. (b) parse's
styletrace 18-fail failure-set comparison: DONE — base 18-set vs combined
18-set `diff`-empty (see Correctness; zero new reds). (c) keys2
proof/render revert: CONFIRMED absent — patch touches only `facts.rs` +
`serializer.rs`; tree grep for `KeyMemo`/`key_memo` empty.

(6) NOTE (no action): parse touches `run_parse_phase` (`lib.rs:206+`) —
slice1b's parallel-region ground. Expected future same-function-twice recorded
for the captain: bank-first sequencing stands (slice1b's integrator fits to tip).
Slice1b is not in this set; no action taken.

(7) ATM-SITE-54: DONE — fails identically on base and combined arms, same test +
same assertion (spec.ts:43); pre-existing, unrelated (see Correctness).

## Quality + correctness

- `pnpm agentrs c atomic` (combined): **570 + 1 passed, 0 failed** (base 567+1
  plus diag×2 and parse×1 — exact).
- `pnpm agentrs c canon` (combined): **58 passed, 0 failed** (55 + canon2×3).
- `pnpm agentrs c styletrace` (combined): 31 passed / 18 failed; the 18-set is
  **byte-identical (`diff`-empty) to the base 18-set** (24 base runs, all
  30/18; serial combined 3× all 31/18 with identical set). All 18 are
  fixture-absence (`missing StyleProps/primitive declaration entrypoint`,
  `No such file or directory`) — zero new reds. Bank condition (b) satisfied.
- New tests run explicitly, all pass: diag×2 (10/10 channels incl. both new),
  canon2×3, parse atomic `reused_programs_answer_like_fresh_parses`,
  parse styletrace `reused_programs_match_fresh_parse_trace`.
- `pnpm agentrs q` on all 20 touched files: **0 Code violations, exit green,
  both arms.** Base 20 warnings → combined 24: 19 pre-exist verbatim (incl.
  channels/identity.rs/lib.rs lengths, `run_parse_phase` 153→162 lines,
  analyzer/parser complexity, surface.rs 5-arg); keys2's diet REMOVED one
  (facts.rs 366→365 lines); 5 new warning-level: parse's `resolve` 5-arg,
  `reuse_programs` 5-arg, `trace_program` 5-arg (all exactly at the warn
  threshold; failure is >5), parse's identity_tests.rs length 403 (test file
  grown by the fallback-pinning test the bank condition wants), cascade's
  `scan_conditions` cognitive-22 (bank condition — accepted with rationale:
  gate fails on violations not warnings; the 22 IS the fused match; splitting
  the loop re-walks and kills the fusion; no split written, no HOLD — do-not-
  write rule for integrators).
- ATM-SITE-54 (checklist 7): fails IDENTICALLY on base and combined arms —
  same test, same assertion (`expected false to be true`, spec.ts:43
  `hasWant`). Pre-existing, unrelated. Third independent confirmation.

FLAKE FINDING (reported, not held): `trace_gate::barrel_from_follows…` failed
2 of ~22 parallel full-suite runs on combined (base 24/24 clean), always as
`left: [], right: ["BareCard"]` (empty trace = files absent mid-run).
Mechanism proven pre-existing and environmental: `ScratchWorkspace::new_in`
(`shared/src/testing/workspace.rs:22-31`, UNPATCHED) uniquifies by
`(name, pid, as_nanos)`, and this box's clock is COARSE (20,000 consecutive
`time_ns()` calls yield 1,847 unique stamps; consecutive diff routinely 0 —
Hackintosh iMacPro1,1 TSC quirk), so same-name parallel tests collide on path
and `Drop::remove_dir_all` races the sibling's disk read. Parse's trace_gate.rs
hunk (empty-programs plumbing) executes an identical path (one HashMap::get
miss → same fresh parse). Fix (atomic counter in `new_in`) is new work —
flagged for the captain, not written. Serial runs are deterministic and green.

## Confirm protocol (the sum)

Base .node `069cf996…`, combined .node `1f353c96…` (distinct; `shasum -c`
identical before AND after all timed runs; harness never rebuilt mid-set;
dist .node moved aside so a broken override fails loudly — bogus path proven
to fail hard with sole-candidate `Searched paths:`). `build:js` ran once
(wrappers missing; gitignored). 2 unscored warmups per arm (base 1133.63/
1133.81; comb 1061.40/1075.08), then 8 interleaved pairs alternating lead
order, `.node` swapped per arm via `REFERENCE_UI_NATIVE_PATH`, sample
`scales[0].samples[0].syncMs`:

| pair | order | base syncMs | comb syncMs | Δ ms   | Δ %   |
| ---- | ----- | ----------- | ----------- | ------ | ----- |
| 1 | B,C | 1142.15 | 1067.88 | −74.27 | −6.5% |
| 2 | C,B | 1122.61 | 1070.47 | −52.15 | −4.6% |
| 3 | B,C | 1123.70 | 1079.77 | −43.93 | −3.9% |
| 4 | C,B | 1132.92 | 1086.95 | −45.98 | −4.1% |
| 5 | B,C | 1142.58 | 1067.69 | −74.88 | −6.6% |
| 6 | C,B | 1141.09 | 1120.41 | −20.68 | −1.8% |
| 7 | B,C | 1128.29 | 1076.37 | −51.92 | −4.6% |
| 8 | C,B | 1139.20 | 1069.86 | −69.34 | −6.1% |

- Base median 1136.06, comb median 1073.42 → **−62.64 ms (−5.51%)**, 8/8 pairs.
- Ex-run-1: base 1132.92, comb 1076.37 → **−56.55 ms (−4.99%)** — stands.
- Above the ≈40–60 ms expected band: the band priced parse at 0–21; the
  bisect below resolves parse honestly at ≈20. No inversion, no flat pair;
  B-first and C-first splits both deeply negative; cssCalls/sizes exact
  (7527/3000, 2867925/214466) on every run.

Byte-identity (seed 7, `--keep` runs): base==comb `cmp`-identical on all four
scales, and every hash matches the sealed wave-1 pins: small css
`ecdec1e8…a2973` / rtm `ad9194f4…4d41`; medium `37f2ef5b…19fe` /
`54735e4d…fe7ce`; churn `1aad4978…ec05` / `e1349305…cdb`; enterprise css
`7ec827fb0c0cf6856f12fe9557f977505ec745b57ef8d8a62ed46df05e10dcea` / rtm
`718d19e470176b97350c576ef79566f659d6db85253b66b0bb7a2b19b7378918`.
Determinism: two further combined enterprise runs → identical sealed hashes.

## Bisect

Mandatory parse sub-bisect (temp arms from the combined tree, reverted after;
final tree verified byte-identical to the 5-patch backup): ST =
styletrace-only (identity `insert` skipped → bytes fallback), ID =
identity-only (trace `insert` skipped → bytes fallback), each 4 interleaved
pairs vs C. All three sub-arm binaries hash-distinct from C and from each
other; all three outputs byte-identical to the sealed hashes. Plus ND =
combined-minus-diag (base `channels/mod.rs`, the file diag alone touches),
6 pairs vs C for the captain's in-situ diag rationale.

Round A — styletrace marginal (ID−C), 4 pairs: +12.26, +22.64, +14.09, +7.06.
ID median 1074.91 vs C 1062.95 → **+11.96 ms, 4/4 favor C.**

Round B — identity marginal (ST−C), 4 pairs: +7.68, +20.33, +8.67, −2.92.
ST median 1074.40 vs C 1066.02 → **+8.38 ms, 3/4 favor C** (B4 −2.9 noise).

Parse in-situ total ≈ 11.96 + 8.38 = **≈20.3 ms ≈ the 21wt ceiling** — the sum
resolves parse honestly: its solo zero was noise (documented ±65 spread under
screensharingd 145%), the mechanism always priced ~21, and the combined set
measures ~20 with byte-identical outputs.

Round D — diag marginal (ND−C), 6 pairs (D3/D4 caught a system burst, both
arms +60–80; D5/D6 added after the burst passed): +15.16, +24.48, −24.04,
+18.25, +7.77, +15.48. ND median 1094.68 vs C 1081.49 → **+13.20 ms, 5/6
favor C** (median of deltas +15.3). Below diag's solo −19.9, exactly as the
diag×keys2 analysis predicts: keys2 shrank the per-render `lookup_key` cost
inside the dead renders diag removes, so diag's marginal in combination reads
smaller — sub-additivity, disclosed, direction-consistent, still firmly
positive. The thin solo pct margin (0.04pp) is superseded: diag contributes
≈13–15 ms in situ inside a −62.6 sum.

Attribution: parse ≈20.3 (bisected) + diag ≈13–15 (bisected) + canon2 ≈13–15
(intcanon2 8/8) + cascade ≈3–5 (mechanism counts) + keys2 ≈3.3 (phase bench)
≈ 53–59 vs measured −62.6 — consistent within per-component noise. No
leave-one-out for canon2/cascade/keys2 per the brief (required only if the
sum disappoints; it beats the band).

Contamination disclosed: the first three sub-arm `--keep` probes read ~1260
(uniform +190 across three different binaries) during a screensharingd/mds/
Finder storm; immediate re-probes read normal (1063/1078/1078). Per the
standing rule the contaminated TIMINGS were discarded (their kept-output
hashes, unaffected by timing, were used for byte-identity). No foreign
process was touched.

## Verdict

**LAND (whole set: diag + canon2 + cascade + parse + keys2 — delta −62.6 ms /
−5.51% enterprise median; ex-run-1 −56.6/−4.99%)**

Every member earns its place: the sum beats its band 8/8 with ex-run-1 rock
solid; parse's solo-zero is resolved honestly at ≈20 ms in situ (≈ceiling);
diag's thin solo margin is superseded by ≈13–15 ms in situ; canon2/cascade/
keys2 ride on unrefuted solo/integrator proofs with zero textual or behavioral
collisions; outputs are sealed-hash-identical on 4 scales with determinism ×2;
quality is 0 violations both arms; ATM-SITE-54 re-proven pre-existing a third
time; the styletrace 18-fail set is byte-identical base-vs-combined. No HOLDs,
no subset carve-outs, no new work written. Tree left as patches + this file;
no commits — the captain lands.

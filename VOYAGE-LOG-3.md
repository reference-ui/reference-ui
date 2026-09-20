IN PROGRESS

# Voyage log — Objective 3: Overnight doom cycle

Captain and crews append here: briefs dispatched, hunts in flight,
breaks found, fortifications landed, what to hunt next, anything
useful. Atomic hunt reports still go in `.agents/doom/logs/`; this
file is the overnight picture.

First line stays `IN PROGRESS` until HQ wakes or writes "satisfied".
Do not mark `COMPLETE` because a wave finished.

---

## Cycle board

- 2026-09-20 watch: OBJECTIVE 2 COMPLETE (committed 00eab0405). Objective 3 OPEN — doom cycle on the atomic style engine until HQ wakes (floor: 6 cycles; compiler scope, no lib). Wave 1 hunting: 3 finders × 3 theories — (a) atomic extraction/harvest, (b) diagnostics false negatives, (c) tasty scan/emit. Carried fodder: F-O9a channel-dedup, O4-F5 nested-! plans, O9-R3 staying families. Next: first verdict → red-team arc (architect → fortify → chain review) → commit → wave 2.
- 2026-09-20 watch: wave 1: (a) BREAK-FOUND (responsive-leaf `!` silently serves plain class — report filed, repro /tmp) → architect dispatched; (c) BREAK-FOUND (tasty scan boundary — plain externals + cross-package hops followed) → architect dispatched; (b) diagnostics false-negatives still hunting. Next: rulings → fortify crews → chain reviews → 2 commits → wave 2.
- 2026-09-20 watch: wave 1 now 3 finds: (a) IN-BOUNDS, refuse-with-diagnostic → fortify crew on ATM-LEAF-11; (c) IN-BOUNDS, tighten-policy → fortify crew on policy.rs + TST-EXT-01; (b) BREAK-FOUND (unknown-prop typo silently missed) → architect ruling. Next: fortify landings → chain reviews → commits → wave 2.
- 2026-09-20 06:03 tick: Obj-1/2 COMPLETE; wave 1: (a) ruling IN-BOUNDS/refuse → fortify quiet ~15 min, zero writes, ping outstanding (threshold: silent next tick → unstick); (c) ruling IN-BOUNDS/tighten → fortify writing (policy.rs + tests + TST-EXT-01); (b) ruling IN-BOUNDS/carve-out → fortify dispatched. 3 doom reports filed. Live crews: 2 (+1 just spawned). Next: landings → chain reviews → 3 commits → wave 2.
- 2026-09-20 watch: both wave-1 fortify crews EXITED answering vitals pings (ping-exit pattern now systemic — 4th/5th cases). STANDING ADAPTATION: no more vitals pings to working crews; liveness via log writes + work products only (substance of the deadlock test preserved). Replaced both (a: clean restart; c: continues from partial tree state, all priors re-verified). Fortify (b) still on first crew. Next: landings → chain reviews → 3 commits → wave 2.

## Waves

_(one entry per cycle: brief, verdict, commit or clean hunt)_

### Wave 1, find (c) — architecture ruling

**Verdict: IN-BOUNDS.** The find is a contract-vs-code dispute inside the
scanner's own stated physics (scan boundary:
`packages/reference-rs/modules/tasty/src/scanner/README.md:11` vs
`scanner/workspace/policy.rs`). No will-never-work shape is involved — no
interpolation, no runtime-only values, no JSON/CMS config, no rest-spread,
no namespace imports. Repro `/tmp/doom-tasty-scan-boundary.mjs` re-run
read-only by this architect: 4/5 checks fail, manifest contains
`FakeWidget, FakeUnrelated, Other, OtherUnrelated` alongside user-owned
`Bar` — confirmed over-collection, user-facing (manifest/chunk pollution
plus scan cost per plain external import).

**Fix direction (binding): TIGHTEN `policy.rs` to the README boundary —
do NOT amend the contract.** Weighed:

1. README authority wins 5-to-1: the tight boundary is witnessed by the
   scanner README, `scanner/workspace/README.md`, the call-site comment
   at `policy.rs:33-34`, the doc comment on
   `extract_reexport_module_specifiers` (`imports.rs:14-15`), and the
   `TST-EXT-01` fixture comment (`lib-types.ts`). Only the function body
   says otherwise.
2. The loosening (`2d405aa9b`) was deliberate but never ratified as a
   contract change: it flipped the gate, repinned one test, and left all
   five witnesses plus now-dead `reexport_specifiers` plumbing (crawler
   still computes and threads it into an ignored `_` param). A behavior
   change that leaves its own call-site comment contradicting it is
   incomplete, not authoritative.
3. The loosening's stated mitigation ("filter at display time instead")
   is not evidenced on the manifest path — the repro shows
   never-referenced symbols (`FakeUnrelated`, `OtherUnrelated`) IN the
   emitted manifest. The loose behavior delivers exactly the pollution
   the boundary exists to prevent.
4. Layering: the scanner README scopes the layer to discovery ("should
   not know how to interpret TS declarations beyond the minimum needed
   to discover more files"). The loosening motive (showing
   `SystemStyleObject` members) is a projection/display-layer concern;
   solving it by breaking the scan boundary is the wrong layer. Restore
   the gate: `should_skip_user_external_import` =
   `is_user_file && !reexport_specifiers.contains(source_module)`
   (drop the `starts_with("test")`-style prefix heuristic entirely —
   user-bridged re-exports are followed by definition);
   `next_external_depth` returns `None` on cross-library hops
   (same-package-only per README; `d3d2be630` depth-2 allowance goes).
5. Blast radius is contained: the flagship `TST-EXT-01` fixture was
   authored FOR the tight boundary (`lib-types.ts` re-exports +
   comment), so the station should hold. The loose-pinning Rust unit
   tests (`scan_workspace_includes_user_external_imports_for_reference_docs`,
   `..._follows_cross_library_external_imports_from_external_modules`,
   `..._limits_transitive_cross_library_external_imports`,
   `..._does_not_treat_globbed_node_modules_files_as_user_entry_points`)
   must be repinned to the README boundary — a contract restoration,
   not a weakening. PROVISO: fortify must run the full tasty suites
   (cargo + vitest + stations); if `SystemStyleObject`-style member
   display regresses, that becomes a NEW architect consult
   (on-demand resolution), never a silent re-loosening.

**Test placement:** primary pin at the Rust unit level —
`packages/reference-rs/modules/tasty/src/scanner/workspace/tests.rs`
(restore the plain-import skip test, add cross-package rejection) —
lower than the finder's N-API probe, direct, no native binding needed.
Secondary: extend the EXISTING `TST-EXT-01-external-libs` station, not a
new case — add a plain-import-only package to its fixture input with
absence assertions in `spec.ts` (the fixture already carries the
re-export bridge shape). No new case, no new station.

### Wave 1, find (a) — architecture ruling

Find: responsive-object leaf `!` (`width: { base: '50px!' }`, fully
static) mints an important want + orphan `__w_50px\!` class, while the
whole-object plan captures `important:false` pointing at plain
`__w_50px`; runtime `cleanResponsiveObject` strips the leaf and hits
the plain plan. Silent wrong paint at every layer, zero diagnostics.
Finder report:
`.agents/doom/logs/2026-09-20-wave1-responsive-leaf-important-drop.md`;
repro `/tmp/doom-wave1-resp-important-repro.mts` (replayed by architect
read-only: exit 1, `served "@reference-ui/lib__w_50px"`,
`diagnostics []`, `runtime warns []` — failure mode confirmed).

1. **IN-BOUNDS.** Complete static string literal in a TS compile input,
   on the pinned style-prop surface; responsive objects are supported
   shapes (`resolve_object` in `runtime/builder.rs`, neo eviction
   stations). Touches nothing on the will-never-work list (no
   interpolation, no runtime-only values, no external config, no
   spread). Falls squarely under the skill's misdiagnosis clause:
   silence where a diagnostic is owed, plus a minted-but-unreachable
   `!` class (wrong paint + sheet bloat). User-facing, fully static
   authorship.

2. **FIX DIRECTION (binding): refuse `!` in responsive-object leaves
   with a diagnostic at the extraction boundary.** Honor is ruled out:
   the plan/query grammar is a five-tuple
   `(system, when, prop, value, important)` carrying ONE bool per plan
   (`runtime/serializer.rs:61-72`, neo `plans.ts:53-70`), and the
   builder applies that one flag to EVERY member of a responsive
   object/array (`builder.rs:264-266`, `:303-305`). Per-leaf importance
   therefore has no carrier — this is exactly why the ternary
   precedent (ATM-SITE-64, per-arm `!`) works and this cannot: each
   ternary arm gets its own leaf and its own plan, while responsive
   leaves share one plan. Honoring uniform-all-`!` while refusing
   mixed leaves would build a semantic cliff on a rule that must agree
   across three layers (engine plan capture, neo query, S2
   prediction) — the same three-layer disagreement that produced this
   bug. True per-leaf honor requires splitting responsive objects
   into per-member plans/queries: a redesign of plan granularity,
   key grammar, S2 analysis, and merge — out of scope for fortify.
   Refusal is one rule in one place, matches the diagnosed
   responsive-array precedent (`ATM-W-MISSING-STYLE-PLAN` + dev miss
   warning), and matches Error Correct's boundary-signal philosophy.
   Consequences: runtime strip behavior stays (existing
   `eviction.test.ts` "strips leaf important markers" pin remains
   valid — no neo changes); S2 `nested_shapes_stay_raw` stays (the
   stripped key still hits; now honestly, because compile warned).
   The diagnostic must name the prop and the offending leaf key so the
   author can act. Whether refused leaves still push their important
   want (orphan mint) or skip it is left to fortify + SPEC update,
   with guidance: prefer whatever keeps ATM-LEAF-09's
   "authored `!` sets `Want.important`" contract exception-free unless
   skipping is clearly cleaner — decide, write it down, pin it.

3. **TEST PLACEMENT: new atomic seam station `ATM-LEAF-11`** (LEAF-01
   through LEAF-10 are taken; LEAF is the literal/leaf family that
   owns `!` at ATM-LEAF-09/10). Lower than the finder's /tmp
   compile+neo E2E probe: `tests/cases/ATM-LEAF-11/` asserting the
   refusal diagnostic fires on `css({ width: { base: '50px!' } })`
   (naming prop + leaf), sibling static leaves still extract, and the
   served-plan behavior the fortify crew chose. No neo case (runtime
   untouched), no S2 unit change. SPEC: extend the LEAF section with
   the refusal rule; the five-tuple one-bool-per-plan limit is the
   stated reason.

### Wave 1, find (b) — architecture ruling

Find: `css({ frobnicate: 'red' })` — a complete static literal — mints
no plan, and the real neo runtime queries-and-misses the exact key
`["@reference-ui/lib",[],"frobnicate","red",false]` (`class=""` + dev
miss), yet the default channel is `[]`: the located gate warning
(`ATM-W-UNKNOWN-PROPERTY`) and the `ATM-I-EXPECTED-LOOKUP` telemetry
both ride the opt-in channel only. Finder report:
`.agents/doom/logs/2026-09-20-wave1-diagnostics-unknown-prop-default-silence.md`;
repro `/tmp/doom-t1-unknown-prop/run.mts` (replayed by architect
read-only: red assertion confirmed — 0 default lines, gate warning +
exact expectation channel-only, `miss class: ""`, 1 runtime warning).

1. **IN-BOUNDS.** Complete static literal in a TS compile input on the
   pinned `css()` surface; touches nothing on the will-never-work list
   (no interpolation, no runtime-only values, no external config, no
   spread). Falls under the skill's misdiagnosis clause: silence where
   a diagnostic is owed — `ATM-DIAG-09` (exact absent keys warn
   userspace) plus analysis itself emitting `ExactLookupExpected` for
   the key. Weighed and rejected: (a) "unknown props have no lookup"
   — false firsthand, the runtime queries the verbatim authored key
   and misses; O9-R3's "has no lookup" family covers advisories/hosts,
   not queried-and-missed keys. (b) The F2 deferral (S4, O7-R4
   load-bearing, unit-pinned in `proof/render.rs:315`) — its
   *jurisdiction* assignment stands (extract owns unknown props), but
   its *premise* ("extract already warns located at the gate") was
   true-AND-visible only pre-S5; S5's blanket partition (ALL
   `ExtractOutcome`/`ExtractNote` → compiler, `policy/mod.rs:42-46`)
   moved the gate warning without re-examining F2, so the two halves
   now cite each other. A stale-premise interaction, not a wrong
   deferral. Supporting: O9-R3 COND-17 precedent (a real actionable
   typo stayed default because "moving would silence a real typo" — a
   fortiori here, a total miss with zero plans) and same-mistake
   inconsistency (static/global unknown props stay default via direct
   push — `static_css.rs:30`, `stylesheet/global/value.rs:38` — while
   the identical `css()` mistake is opt-in-only).

2. **FIX DIRECTION (binding): PARTITION CARVE-OUT — `Policy::classify`
   maps extract facts carrying `DiagnosticCode::UnknownProperty` to
   Userspace; proof's F2 exclusion stands untouched.** This restores
   F2's visibility premise (one code, one match arm) instead of
   overturning F2: the restored signal is the located legacy sentence
   (file:line:col + stable code, byte-identical to pre-S5), all three
   unknown-prop surfaces (css/fold/static/global) agree on default,
   and no double-warn is possible (proof still defers). Rejected: (a)
   lifting proof's exclusion — emits an *unlocated* causeless warning
   (F-O9b gap) duplicating the located gate content in worse form,
   overturns F2/O2 jurisdiction; (b) threading the site into causeless
   — larger redesign for an inferior signal, stays future work (F-O9b).
   SCOPE: UnknownProperty extract facts only (`object/mod.rs`,
   `lower.rs`, `call_lower.rs` gates; fortify checks note AND funnel
   arms). The sibling rows (scalar conditions, unknown `r`
   breakpoints) are NOT in this fortify — different query shapes,
   O20 condition jurisdiction unexamined, each needs its own red test
   per "no repro, no break" — carried as next-brief doom fodder.
   Census note: channel's 105 legacy lines contain no UnknownProperty,
   so default-0 should hold — fortify re-runs the census to confirm.

3. **TEST PLACEMENT: extend `ATM-DIAG-05`, no new station** (its input
   already holds the `frobnicate` row at `precise.ts:10:3`). Spec:
   that row asserts back on DEFAULT (code + message + 10:3 position),
   the other ten refusals stay channel-only, default length exactly 1;
   the line-94 rationale ("The refusals prove no exact runtime miss")
   is now false and must be rewritten. Rust unit: `channels/mod.rs`
   partition tests — unknown-prop note keeps default + absent from
   channel (mirror of `userspace_facts_keep_their_lines`). Restoration
   re-points, attested per pair: SITE-49 + SITE-83 (UNKNOWN-PROPERTY
   rows channel→default); SITE-20 adjudicated per line (global stays,
   css-surface returns). Guards staying green:
   `unknown_props_defer_to_extracts_jurisdiction` (no-double-warn),
   lib census default-0, NEO-SYNC-16, `sync.test.ts` staticCss pin. No
   neo case, no analysis change, no `render.rs` change. Ledger C1 +
   SPEC DIAG-05 channel note updated to record the carve-out.

### Wave 1, find (a) — fortify landing

**Status: LANDED (replacement crew; prior crew's zero-write exit re-derived from scratch).** Ruling followed exactly: refuse `!` in responsive-object leaves with a diagnostic at the extraction boundary; no neo changes; S2 `nested_shapes_stay_raw` untouched; no direction re-decided.

**Fix (one rule, extraction boundary).** `responsive.rs::walk_object` now calls `refuse_leaf_important` per entry: when single-value plan capture (`ast_to_json_value`) sees a flag the whole-object capture would drop, it emits default-visible `ATM-W-RESPONSIVE-LEAF-IMPORTANT` (new code) naming prop + leaf key, and the leaf pushes no want (siblings keep extracting). Detection mirrors plan capture by construction, so it fires exactly on the silent set — string + template leaves + transparent wrappers (probe E proved templates were silently broken too) — while branching/dynamic leaves keep proof-level diagnosis and arrays are untouched. Covers `css()` + JSX + conditions in the one place. Regression sweep pre-change: no existing station input or lib source carries responsive-object `!`, so no other golden moves.

**Orphan-mint decision: warn-and-SKIP (documented + pinned).** Warn-and-keep was prototyped and rejected on measurement: the orphan important want resolves to an atom that collides with the served plain class under the single `css.classes` key `width:50px` (keys carry no importance), breaking the injectivity standing gauge — and `INJECTIVITY_QUARANTINE` may only shrink. Skipping is clearly cleaner per the ruling's guidance, so `ATM-LEAF-09` takes a narrow documented exception (SPEC) pointing at LEAF-11. Served behavior pinned: plan still serves plain `__w_50px` as a diagnosed non-important fallback; sheet carries no orphan `!` rule.

**Channel: DEFAULT via direct push (no session fact).** A channel-only note would leave the finder's repro red (`result.diagnostics` empty) and the author blind; default matches the responsive-array `ATM-W-MISSING-STYLE-PLAN` precedent visibility and the static/global direct-push pattern. New `ExpressionWalk::warn_default` helper; `policy/mod.rs` untouched (zero collision with crew b's live carve-out).

**Scope probes** (`/tmp/doom-wave1a-scope-probe.mts`, pre-fix): (A) const-spread `!` misses loudly at runtime — no refusal needed; (B) ternary leaf loud at runtime; (C) array `!` carries default `ATM-W-MISSING-STYLE-PLAN` — precedent confirmed; (D) const-ident leaf is a separate verbatim-value shape, loud; (E) template leaf SILENT like literals — covered by the rule.

**Repro note for chain review.** The finder's `/tmp/doom-wave1-resp-important-repro.mts` no longer reports BREAK (compile is now loud — the diagnosed refusal), but still exits 1 on its two *setup* premises (important want exists, `!` rule minted): those encode pre-fix keep-physics that the ruling left open and this landing decided as skip. Post-fix contract is proved instead by `/tmp/doom-wave1a-fortify-verify.mts` (exit 0: default diagnostic names prop+leaf, no want, no orphan, plain fallback served) + station ATM-LEAF-11. Finder's report untouched.

**Evidence.** Station `tests/cases/ATM-LEAF-11/` (spec: exactly-1 default diagnostic naming `width`+`base`, no important width want, `md`+`color` siblings extract, plain class served, no `50px !important` in sheet; goldens generated scoped `-t ATM-LEAF-11 --update-goldens`, attested per pair: css.json 3 plain classes, diagnostics.json 1 located refusal, styles.css plain utilities). SPEC: LEAF section + LEAF-09 exception + registry + counts 10→11. Suites: `pnpm agentrs c atomic` 458/458 green (incl. 2 new refusal unit tests); `pnpm agentrs v atomic` 279 pass incl. LEAF-11 — 5 failures (DIAG-07/14, SITE-20/49/83) are crew (b)'s in-flight UnknownProperty channel migration (verified: `ATM-W-UNKNOWN-PROPERTY` on default), not this change; left for crew (b). Quality: `agentrs q` on 3 touched files — 0 violations, 2 warnings (pre-existing `walk_fallback` cognitive; `codes.rs` 368 lines soft-limit from the appended row — table grows by design). Shared-tree incident: `walk/mod.rs` was clobbered to HEAD by a sibling full-file rewrite at 06:14 (method lost, compile broke); re-applied identical, rebuilt, re-verified. 306 `styles.css` golden rewrites at 06:11 are another crew's (formatting) — untouched.

**Files (mine only).** `modules/atomic/src/extract/expressions/responsive.rs` (rule + helper + 2 tests), `modules/atomic/src/extract/expressions/walk/mod.rs` (`warn_default`), `modules/atomic/src/diagnostics/codes.rs` (new code + table + test), `modules/atomic/SPEC.md` (LEAF-11 + LEAF-09 exception + registry + counts), `modules/atomic/tests/cases/ATM-LEAF-11/` (input/src/css.ts, spec.ts, README.md, output/css.json, output/diagnostics.json, output/styles.css). No neo, no lib, no goldens outside LEAF-11, no test weakened.

### Wave 1, find (c) — chain review

**Verdict: VERIFIED (commit-ready).** Whole arc re-verified firsthand by
this oracle; no implementation, no fixes, no commits. Tasty files only —
sibling (a)/(b) files never touched or adjudicated (write-set audited via
`git status` paths: exactly 3 `.rs` + `spec.ts` + new `internal-only.ts` +
76 goldens under `modules/tasty/`; `tasty/js`, `atlas/js` generated clean,
zero formatter collateral in tree).

**1. Finder repro** (`/tmp/doom-tasty-scan-boundary.mjs`, unmodified):
shipped script loads the stale Sep-16 `dist/npm/darwin-x64` binding first
→ 1/5 CONTRACT VIOLATED (`Bar, FakeUnrelated, FakeWidget, Other,
OtherUnrelated` — the exact original break; doubles as fail-without-fix
evidence). Per-binding probe (`/tmp/chainrev-tasty-bindings.mjs`): stale
1/5 violated, fresh 06:13 `dist/native/darwin-x64` (built after the 06:09
fix) 5/5 CONTRACT HOLDS, manifest Bar-only. Harness artifact, not code:
the repro's candidate order prefers `dist/npm`, while the repo loader
(`modules/runtime/js/loader.ts:114`) prefers `dist/native` — so the suite
below ran the fresh binding.

**2. Full tasty suites** (repo runners, this session): `pnpm agentrs c
tasty` 62/62 green (all 5 repins visible); `pnpm agentrs v tasty` 81/81
green (5 files: 42 unit + 39 cases); `pnpm agentrs v tasty -t "EXT-01"`
1 passed / 80 skipped (extended station green in isolation); `pnpm
agentrs q` on the 3 touched `.rs` files PASS (0 over-length, 0 complex,
0 clippy allows).

**3. Fail-without-fix / pass-with-fix:** (a) Rust pins — HEAD worktree
(old `policy.rs`, new test files): exactly the 4 behavior pins FAIL, 58
pass; in-tree: 62/62. (b) Station — EXT-01 fixture through the STALE
binding emits `CssNode` + the whole css-tree package, so every new
absence assert fails on old code (`/tmp/chainrev-tasty-stale-station.mjs`);
fresh binding: station green, 0 `CssNode`/`css-tree` occurrences.
Worktree removed after the run.

**4. Repin adjudication (each attested, none a weakening):**
`skips_..._without_reexport_bridge`, `rejects_cross_library_...`,
`rejects_transitive_...` — contract RESTORATION (README sentences 1+2),
each fails-old/passes-new; `leaves_..._without_target` — RESTORATION at
the resolve layer, strengthened with a graph-absence assert;
globbed-node_modules — PRESERVED pin (assertions byte-identical, input
re-bridged to the legitimate path, passes both); bridge-positive
`follows_user_reexports` untouched + green. Goldens independently
attested per pair (`/tmp/chainrev-tasty-goldens.mjs`, parsed as data):
37/38 `manifest.js` IDENTICAL, 37/38 `chunks.json` IDENTICAL; only
EXT-01 differs (+`InternalUsage`, 1 name / 1 id / 1 chunk, zero removals,
zero changed entries) — 37 dialect-only + 1 intended symbol, not a
blanket bless.

**5. Diff review:** `policy.rs` gate exact per ruling
(`is_user_file && !reexport_specifiers.contains(source)`, `None` on
cross-library hops); prefix heuristic + `is_dev_dependency` gone from
tasty src (grep clean); dead plumbing live again (`crawler.rs:64/74`,
real per-file set); no README amendment (`scanner/README.md:11`
untouched); no lib touch; no new case/station (existing TST-EXT-01 only,
glob picks up `internal-only.ts`, no index change needed).
SystemStyleObject proviso HONORED: STY-01/02/03, DSP-01, PRJ-02, INT-01
stations green and zero symbol removals in any golden — no display
regression, no re-loosening, no unrelated scope.

**6. Contract holds:** the finder's violated README scan boundary is now
enforced — plain user imports stay local unless re-export-bridged,
library hops are same-package-only. Captain: commit the 81 tasty paths;
re-check for `agentrs f` formatter collateral at commit time (absent
now); `dist/` is untracked build output, nothing to commit there.

## Useful

### Wave 1, find (c) — fortify landing

Replacement crew (c-fortify-2) on conn. Re-verifying prior crew's partial
state firsthand before building: policy.rs gate matches ruling text on
read (gate = `is_user_file && !reexport_specifiers.contains(source)`,
`next_external_depth` None on cross-library hops); tests.rs + resolve.rs
repins (5) and TST-EXT-01 extension (internal-only.ts + absence asserts)
present in tree. Behavior unverified — cargo + fresh-binding vitest runs
next. Stale-binary adjudication pending firsthand runs.

Fortify (c) interim 2 — stale-binary ADJUDICATED, suite state mapped.
cargo tasty 62/62 green firsthand on the repinned tests. Fresh binding
built (`dist/native/virtual-native.darwin-x64.node`, today); finder
repro re-run against it (candidate order patched to dist/native — the
shipped repro prefers the stale Sep-16 `dist/npm/darwin-x64` copy):
5/5 PASS, manifest = Bar only. The 38 vitest mismatches are NOT
stale-binary: all 42 JS unit tests pass, all 38 spec.verify + gauges
pass (incl. new TST-EXT-01 absence asserts and SystemStyleObject
projection stations — proviso satisfied, no display regression); all
38 failures are the golden-compare step, and per-case semantic
comparison (committed output/ vs fresh .scratch/, parsed as data)
shows 37/38 IDENTICAL with TST-EXT-01 differing by exactly +InternalUsage,
zero removals. Root cause: committed goldens are prettier-dialect
(single quotes) while the serde emitter (stable since c2489a55f,
09-15) emits JSON-dialect; neo voyage commit 08ec87170 (09-17) blessed
prettier-dialect goldens despite the .prettierignore guard — suite red
at HEAD since, independent of this fortify. Path: dialect-restoration
regen with per-case attestation (37 format-only + 1 intended symbol),
then full green re-run.

Fortify (c) FINAL — replacement crew (c-fortify-2). All prior-crew
claims re-verified firsthand; fortify COMPLETE per the architecture
ruling. Nothing below weakens a test, amends the README contract,
touches lib, or touches the finder's report.

FIX (binding ruling, tightened policy.rs to the README boundary):
- `should_skip_user_external_import` =
  `is_user_file && !reexport_specifiers.contains(source_module)` —
  prefix heuristic gone; user-bridged re-exports followed by definition.
- `next_external_depth` returns None on cross-library hops
  (same-package-only; depth-2 allowance gone).
- Finder repro re-run against the FRESH binding (see adjudication):
  5/5 PASS, manifest = Bar only. CONTRACT HOLDS.

PIN EVIDENCE (contract restoration, not weakening):
- Rust unit repins (5): `scan_workspace_skips_user_external_imports_\
  without_reexport_bridge` (was ..._includes_..._for_reference_docs),
  `..._rejects_cross_library_external_imports_...`,
  `..._rejects_transitive_cross_library_external_imports_...`,
  `leaves_cross_library_external_import_reference_without_target`
  (resolve layer), globbed-node_modules pin re-bridged via re-export
  (pin itself unchanged). Bridge-positive test
  (`..._follows_user_reexports_...`) untouched and green.
- Station: EXISTING TST-EXT-01 only — new input
  `internal-only.ts` (plain-imports `css-tree`, never re-exports) +
  absence asserts in spec.ts (manifest has no CssNode,
  findSymbolsByName empty, loadSymbolByName + loadSymbolByScopedName
  reject). No new case/station.

FULL TASTY SUITES (fresh binding, post-fmt re-verified):
- cargo tasty: 62/62 green (x3 runs, incl. post-fmt).
- vitest tasty: 81/81 green (5 files: 42 unit + 38 stations + discovery).
- quality gate on 3 touched .rs files: PASS (0 over-length, 0 complex,
  0 clippy allows).
- Full-workspace runs show failures ONLY outside tasty (typegen cargo
  goldens, virtualrs VRT stations) — crates that do not depend on
  tasty, with sibling crews mid-flight in the shared tree. Not mine;
  captain to adjudicate with sibling landings.

STALE-BINARY ADJUDICATION: prior "stale dist" theory is WRONG twice
over. (1) The shipped repro prefers the Sep-16 `dist/npm/darwin-x64`
copy and never reaches the fresh `dist/native` binding — harness
artifact, not code; fresh binding holds 5/5. (2) The 38 vitest
mismatches are golden-DIALECT drift, binding-independent: committed
goldens are prettier-dialect, the serde emitter (stable since
c2489a55f, 09-15) emits JSON-dialect; 08ec87170 (09-17) blessed
prettier goldens despite the .prettierignore guard — suite red at
HEAD since, on any binding.

GOLDEN REGEN — ATTESTED PER PAIR (not a blanket bless): regen via
`pnpm agentrs v tasty --update-goldens` (CLI flag), then semantic
(HEAD-vs-regen, parsed as data): 37/38 manifest.js IDENTICAL,
37/38 chunks.json IDENTICAL; TST-EXT-01 alone differs by exactly
+InternalUsage (1 name, 1 id, 1 chunk `./chunks/_3500846feb953bc0.js`
matching its export id), zero removals, zero changed entries,
zero css-tree/CssNode occurrences. All other diffs are dialect-only
(quotes/array layout/semicolons). No station lost a symbol to the
tightening — the proviso's feared SystemStyleObject-style display
regression did NOT occur (all projection-station specs green).

FORMATTER-WAR WARNING (captain/HQ — systemic trap, live tonight):
at 06:11 a tree-wide prettier pass re-corrupted all 38 goldens back
to prettier dialect, undoing my regen (recovered: re-regen + 81/81
re-verified). Mechanism: `agentrs f` runs `prettier --write
'modules/*/js/**/*' 'modules/*/tests/**/*'` with cwd
packages/reference-rs and no --ignore-path, so the root
.prettierignore guard never applies — EVERY `agentrs f` by ANY crew
breaks the tasty suite. Recommend: --ignore-path fix in run.mjs:554
or a mirrored packages/reference-rs/.prettierignore; until then,
commit this landing before anyone formats again. The same pass also
prettier-formatted tasty/js/generated (21 files) + atlas/js/generated
(8 files) — formatter collateral, NOT mine, left untouched and
flagged; do not sweep into this cycle's commit without review.

FILE LIST (mine): scanner/workspace/policy.rs (gate),
scanner/workspace/tests.rs (4 repins), tests/resolve.rs (1 repin),
TST-EXT-01/input/internal-only.ts (new), TST-EXT-01/spec.ts (absence
asserts), 38x output/manifest.js + 38x output/chunks.json (attested
regen: 37 dialect-only + EXT-01 +InternalUsage). Untouched as
ordered: lib, finder report, README contract, sibling files
(docs/*, atomic/*, atlas/*, other doom logs).

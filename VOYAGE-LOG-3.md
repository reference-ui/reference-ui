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
- 2026-09-20 watch: W1c COMMITTED (c361dd7c2, 83 files — tasty tighten VERIFIED). Shared-tree incident self-resolved (306 sweep gone, walk/mod.rs holds (a)'s fix). Chain (a) reviewing; fortify (b) building. Watch item for chain (b): ledger userspace 6→9 shift — confirm it matches ruling (b)'s C1-note authorization vs scope drift. Next: chain (a) verdict → commit (a); (b) landing → chain → commit; then wave 2.
- 2026-09-20 06:20 tick: chain (a) reviewing, fortify (b) building (carve-out + DIAG-05 + SITE re-points + ledger in tree, 24 paths); no verdicts/landings yet, both running, no deadlock, no pings sent. Peer files untouched. Next: chain (a) verdict → commit (a); (b) landing → chain → commit; then wave 2.
- 2026-09-20 watch: chain (a) VERIFIED (refusal fires, LEAF-11 green, orphan decision pinned). Commit ORDER ruling: SPEC.md mixes (a)+(b) hunks, so (a)'s commit holds until (b) chain-verifies — then (a) lands (code+station+report+log, no SPEC) immediately followed by (b) (files+SPEC carrying both verified hunks+report+log), messages cross-referenced. No file surgery, no captain implementation. Next: (b) landing → chain (b) → commits (a),(b) → wave 2.
- 2026-09-20 watch: WAVE 1 COMPLETE — 3/3 breaks fortified + verified + committed (W1c tasty tighten c361dd7c2; W1a responsive-! refuse da2232587; W1b unknown-prop carve-out 72268f795). Cycles banked: 3/6 toward the floor. Wave 2 hunting: 3 finders × 3 theories — (d) canon, (e) styletrace, (f) module-graph. Tree holds peer files only. Next: wave-2 verdicts → arcs → commits → wave 3.
- 2026-09-20 watch: wave 2: (d) BREAK-FOUND (canon join OR-bypass) → architect dispatched; (e) BREAK-FOUND (styletrace body-destructure gap) → architect dispatched; (f) module-graph still hunting. Cycles banked: 3/6. Next: rulings → fortify → chain reviews → commits → wave 3.
- 2026-09-20 watch: wave 2: (d) IN-BOUNDS, NAME-only join → fortify on join.ts + join.test.ts; (e) IN-BOUNDS, body-destructure extension → fortify on parser/types.rs + tracing.rs + 2 cases; (f) module-graph still hunting. Cycles banked: 3/6. Next: landings → chain reviews → commits → wave 3.
- 2026-09-20 06:42 tick: W2d COMMITTED (6aeb9c062 — canon NAME-only VERIFIED). W2e fortify building (parser/types.rs + tracing.rs + component.rs in tree); W2f BREAK-FOUND (barreled lookup swallows nested unresolvable hop) → architect dispatched. Cycles banked: 4/6. Live: 2 (+1 spawned). Next: (e) landing → chain → commit; (f) ruling → fortify → chain → commit; then wave 3.
- 2026-09-20 watch: W2e COMMITTED (5b527a0e6 — styletrace body-destructure VERIFIED). W2f ruling IN-BOUNDS (surface nested hop, walk_refused.rs pins) → fortify dispatched. Cycles banked: 5/6. Next: (f) landing → chain → commit (floor hit) → wave 3.
- 2026-09-20 watch: wave 3: (h) IN-BOUNDS, calc-wrap negation → fortify on resolve_negated_token + ATM-TOKEN-17; (g) BREAK-FOUND (negation-only include still extracts) → architect ruling; (i) canon-emit still hunting. Cycles banked: 6/6 (floor held, cycle continues). Next: (h) landing → chain → commit; (g) ruling → fortify → chain → commit; (i) verdict → arc → wave 4.
- 2026-09-20 watch: wave 3 all three broke: (h) calc-wrap → fortify building; (g) IN-BOUNDS scan-all-minus-negatives → fortify on IncludeScope + SCAN-01; (i) BREAK-FOUND (~26 fictional canon css forms served dead) → architect dispatched. Cycles banked: 6/6. Next: landings → chains → commits → wave 4.
- 2026-09-20 watch: wave 3: (h) landed → chain reviewing; (g) landed → chain reviewing; (i) IN-BOUNDS refuse+SKIP over generated set → fortify on resolve fall-through + ATM-EXT-01. Live: 3. Next: chain verdicts → commits → wave 4.
- 2026-09-20 07:01 tick: chain (f) reviewing (~10 min, only live crew, no verdict yet — normal review length). Tree: walk_refused.rs + report + log + peer files. Curiosity for the record: star.rs shows unmodified — chain (f) adjudicates firsthand (fix present vs clobbered vs misattributed). No pings sent. Next: chain (f) verdict → commit (floor) → wave 3.
- 2026-09-20 watch: W2f COMMITTED (95a91a4a3 — star nested-hop VERIFIED). DOOM FLOOR HIT: 6/6 cycles banked, all verified + committed. Cycle continues until HQ wakes (LOG-3 stays IN PROGRESS). Wave 3 hunting: 3 finders × 3 theories — (g) reference-core sync, (h) atomic resolve+plans, (i) canon emit. Tree holds peer files only. Next: wave-3 verdicts → arcs → commits → wave 4.
- 2026-09-20 watch: wave 3: (h) BREAK-FOUND (negation-brace '-{spacing.4}' silently mints invalid CSS) → architect dispatched; (g) sync + (i) canon-emit still hunting. HQ asked about a prettier formatter war — answered: one 06:11 306-file sweep seen, self-reverted, no ongoing churn in watch checks; offered a crew on HQ's word. Next: (h) ruling → fortify → chain → commit; other verdicts → arcs → wave 4.

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

### Wave 1, find (a) — chain review

**Verdict: VERIFIED (commit-ready).** Whole arc re-verified firsthand by
this oracle; no implementation, no fixes, no commits. (a) files only —
sibling (b)/(c) files never touched or adjudicated (write-set audited
via `git status` paths + content grep: the 6 `ResponsiveLeafImportant`
touchpoints are exactly the fortify landing's list; `policy/mod.rs`,
`channels/mod.rs`, DIAG-05/SITE-20/49/83, all of `tasty/`, and the
DIAG-05 SPEC hunk are sibling-owned and were read-only for attribution).

**1. Finder repro** (`/tmp/doom-wave1-resp-important-repro.mts`,
unmodified, fresh 06:16 `dist/native` darwin-x64 binding on this x86_64
box): no longer silent and no longer BREAK — compile now emits exactly
one default `ATM-W-RESPONSIVE-LEAF-IMPORTANT` naming `width`+`base`,
located `src/probe.ts:2:39` (the leaf span), served plain
`@reference-ui/lib__w_50px` as the diagnosed fallback. Exit 1 survives
ONLY on the two setup premises (important want exists, `!` rule
minted) — pre-fix keep-physics the ruling explicitly left open and the
landing decided as skip. Post-fix contract proved instead by
`/tmp/doom-wave1a-fortify-verify.mts` (exit 0 firsthand: 1 default
diagnostic, 0 width wants, no orphan, plain fallback served).

**2. Suites** (repo runners, this session): `pnpm agentrs c atomic`
458/458 green (incl. the 2 new refusal unit tests);
`pnpm agentrs v atomic -t "LEAF-11"` 1 passed / 283 skipped;
FULL `pnpm agentrs v atomic` 284/284 green (11 files, incl. LEAF-09 keep
+ injectivity-quarantine 4/4 + all 237 stations). Zero peer drift at
review time — the 5 (b)-migration failures the landing saw are gone
((b)'s specs+goldens have since landed in-tree); nothing to attribute,
nothing absorbed. Scope probe re-run post-fix: A/B/D still loud at
runtime (correctly untouched), C array precedent (`ATM-W-MISSING-STYLE-PLAN`)
intact, E template leaf now refuses with the new diagnostic + plain
fallback served. Quality: `agentrs q` on the 3 touched `.rs` files —
0 violations, 3 soft warnings (walk_fallback cognitive pre-existing;
codes.rs 368 table-by-design; walk/mod.rs 373 — the +16 helper pushed it
8 over the 365 *soft* limit, gate still passes; splitting the walker
for a soft warning would be scope creep, noted not gap).

**3. Orphan-mint decision: warn-and-SKIP, matches the ruling's
guidance, written down, pinned.** Ruling preferred exception-free
LEAF-09 "unless skipping is clearly cleaner" — fortify measured
warn-and-keep colliding under the single `width:50px` css.classes key
(injectivity gauge) and chose skip. Written in SPEC (LEAF-09 narrow
exception + LEAF-11 rule + registry + 10→11), in code docs
(`responsive.rs`, `codes.rs` variant doc), and pinned three ways:
station spec (no `__w_50px!`, no `50px !important`, plain fallback
served), cargo unit test (no important width want, siblings extract),
goldens (css.json 3 plain classes incl. single `width:50px`→plain key;
diagnostics.json exactly-1 located refusal at 4:18 = the leaf span;
styles.css plain `width: 50px`, zero `!important`) — each attested
firsthand above, not trusted from the landing.

**4. Diff review (line-by-line, (a) write-set):** `responsive.rs` —
one call-site `if refuse_leaf_important { continue }` in `walk_object`
(the sole funnel: only caller is `walk/branch.rs:38`, so css()+JSX+
conditions share the rule; arrays route through `walk_array`, untouched
per the ruling) + 23-line helper + 2 tests. Detection is
mirror-by-construction: it calls the identical `ast_to_json_value`
whose `convert_object` drops nested flags (`(v, _)`, `false`) — refusal
fires definitionally exactly on the silent set, pure/read-only call, no
side effects. `ctx.important` guard verified correct-and-vacuous: all
production constructors pass `false`, and a site-level-important plan
would carry `important=true` anyway (leaf `!` honored, no refusal
owed). Ternary-leaf bypass verified sound: branching leaves route via
`ast_to_json_values` per-arm flags (the ATM-SITE-64 honor path), so no
refusal is owed there either. `codes.rs` — enum variant + doc,
CODE_TABLE 45→46 appended row (both-directions table, no drift),
round-trip test extended. `walk/mod.rs` — `warn_default` only caller is
the new rule; direct-push keeps default without a session fact, so
`policy/mod.rs` stays untouched (zero (b) collision — confirmed by
grep). SPEC (a) hunks only (LEAF count/exception/rule/registry); the
DIAG-05 hunk in the same file is (b)'s, not adjudicated. Untouched as
ordered: neo, lib, core (zero paths in status), `ast_value.rs`,
`runtime/`, S2 `structured.rs` (`nested_shapes_stay_raw` — eviction pin
still valid), finder report. No existing test touched by (a), none
weakened; no existing golden moved by (a) (only new LEAF-11 outputs) —
no blanket bless.

**5. Contract holds in refused form.** The finder's violated pair
(ATM-LEAF-09 `!`→`Want.important` + per-leaf importance silently
resolving to weaker CSS) is now: per-leaf `!` on responsive objects is
impossible-by-grammar (five-tuple one-bool, stated in SPEC), refused
loudly on default naming prop + leaf, leaf skipped, plain served as a
diagnosed fallback. Silence is gone at the layer that owed the signal.
Captain: commit the (a) write-set (3 `.rs` + SPEC (a) hunks + new
ATM-LEAF-11 dir) — SPEC.md is shared with (b), commit jointly or split
by hunk; `dist/` untracked, nothing to commit there.

### Wave 1, find (b) — fortify landing

**Status: LANDED.** Ruling followed exactly: partition carve-out in
`Policy::classify` (extract facts carrying `DiagnosticCode::UnknownProperty`
→ Userspace); proof's F2 exclusion untouched (`proof/render.rs` zero diff);
no sites threaded into causeless; sibling rows (scalar conditions, unknown
`r` breakpoints) untouched — still channel-only, still doom fodder.

**Fix (one code, one verdict path).** All three unknown-prop gates
(`object/mod.rs:185`, `lower.rs:110`, `call_lower.rs:119`) warn through
plain `ctx.warn` → `ExtractNote` (verified: no funnel arm emits this code
today); the carve-out covers note AND funnel arms anyway per the ruling.
Shape note: instead of a nested OR-pattern (which tripped the q cognitive
advisory at 16), the table routes extract facts through
`extract_audience` + `is_unknown_prop_extract`, mirroring the existing
`resolve_audience` + `is_false_refusal` split — same one-code verdict,
baseline q complexity preserved. The restored signal is the pushed
located legacy sentence kept on default (never re-rendered), so
byte-identity to pre-S5 holds by construction (SITE-20 golden diffed
byte-identical to `0eab0bdde`; DIAG-05/49/83 goldens are its
UNKNOWN-PROPERTY elements in pre-S5 order).

**Pins.** (1) ATM-DIAG-05 extended, no new station: default length exactly
1 (frobnicate `ATM-W-UNKNOWN-PROPERTY` + message + `precise.ts:10:3`),
other ten refusals channel-only (length 10 + zero-UnknownProperty assert
+ per-row position loop), five sink infos unchanged, line-94 rationale
rewritten. (2) Rust unit `channels::tests::unknown_prop_notes_keep_the_
default_line` (default kept + channel empty). (3) Re-points attested per
pair: SITE-49 (3 unknown-prop → default, 4 unfoldable-key stay channel),
SITE-83 (`css` → default, channel empty), SITE-20 adjudicated per line
(two literals via O2 + one const spread via O34 return, global G6 stays —
default 4, channel 0). (4) Ledger: O2/O34/O47 moved compiler→userspace
(counts 6/90 → 9/87, C2 50→47, §Notes sentence updated) + SPEC DIAG-05
channel note. FLAG: ruling said "Ledger C1" but the rows live in C2 —
recorded the move there; oracle to confirm the label.

**Ruling-list gap found via suite (not relitigation):** the named four
stations were incomplete — ATM-DIAG-07 (`channel.ts:10:3` frobnicate) and
ATM-DIAG-14 (`unicode.ts:3:29` frobnicate) also drift +1 default line.
Both specs hold AS-WRITTEN (07's `isChannelItem` never covered this code;
14's pins read channel-errors/parse-errors only), so golden-only
restoration, attested per pair. Suite-wide drift census: exactly these 6
stations; all other goldens (styles.css/css.json included) byte-stable.

**Evidence.** Repro `/tmp/doom-t1-unknown-prop/run.mts` flips red→green
(exit 0; default exactly 1 located line, gate warning off-channel,
EXPECTED-LOOKUP stays channel, no double-warn). Census `/tmp/s6-census.mts`
matches S6 exactly: default-0, channel 4100 (3743/252/105), book 253 /
src 3847 / other 0, zero UnknownProperty on channel. Suites: `pnpm agentrs
c atomic` 458/0 (incl. new pin + `unknown_props_defer_to_extracts_
jurisdiction` guard green); `pnpm agentrs v atomic` 284/284 (11 files;
incl. find-a's in-flight LEAF-11, green). Guards: NEO-SYNC-16 PASS,
`pnpm agent vitest reference-neo` 224/224 (sync.test.ts 18/18 + staticCss
pin green); neo fixtures grep-clean of unknown props. `agentrs q`: 0
violations on all touched files; 1 advisory remains (channels/mod.rs 378
lines vs 365 soft limit — the mandated test placement; any test there
trips it, file was 359).

**Must-NOTs honored:** no F2 lift, no causeless threading, no weakened
tests (all re-points equal-or-stricter), no blanket goldens (6 targeted
files, each line attested), no lib touch, finder report untouched.

**Files (mine only, 13 + this section).** `diagnostics/policy/mod.rs`
(carve-out), `diagnostics/channels/mod.rs` (1 unit test), DIAG-05
spec+golden, SITE-49/83/20 spec+golden, DIAG-07/14 golden-only,
`modules/atomic/SPEC.md` (DIAG-05 row), `docs/missions/error-correct-
ledger.md` (O2/O34/O47 move + counts + note).

**Incidents owned.** (1) `pnpm agentrs f` at ~06:11 exploded to 377
modified files (prettier ran with DEFAULT config — double quotes —
ignoring `.prettierrc`, plus aggressive rustfmt reflow; 234 css goldens
hit). Fully reverted same-session (366 files), verified clean; chain
review independently confirms generated dirs clean. Never run again —
captain: the runner's fmt wiring needs a config fix before anyone uses
it. (2) That bulk revert raced find-a's live `walk/mod.rs` edit and
clobbered their just-added `warn_default` (~06:14, broke compile); they
re-applied identical and the tree has been green since. Mine to own —
sorry, crew (a). Future bulk operations on shared files: announce or
scope-check first.

### Wave 1, find (b) — chain review

**Verdict: VERIFIED (commit-ready).** Whole (b) arc re-verified
firsthand by this oracle (3 nested evidence workers + direct reruns of
every claim); no implementation, no fixes, no commits. (b) files only —
the (a) arc (responsive.rs, walk/mod.rs, codes.rs new row, ATM-LEAF-11
dir, SPEC LEAF hunks) was never touched or re-adjudicated; SPEC.md
hunks attributed per arc below. Peer-unrelated paths in the tree
(`docs/ATOMIC.md`, `docs/missions/README.md`, untracked
`docs/missions/operation-seize.md`, 2 untracked doom reports) belong to
neither arc — captain commits them separately, not with (b).

**1. Finder repro** (`/tmp/doom-t1-unknown-prop/run.mts`, unmodified,
3606 bytes, mtime 05:56): exit 0 firsthand — default carries exactly 1
located `ATM-W-UNKNOWN-PROPERTY` naming `frobnicate`
(`typo.ts:4:3`), gate warning off-channel, `ATM-I-EXPECTED-LOOKUP`
stays channel-only, `class=""` + 1 runtime dev warning (separate
runtime layer, expected). Silence closed; no compile-side double-warn.

**2. Suites** (repo runners, this session): `pnpm agentrs c atomic`
458/458; `pnpm agentrs v atomic` 284/284 (11 files, 237 stations);
`DIAG-05 -t` filter 1 passed / 283 skipped. Guard
`unknown_props_defer_to_extracts_jurisdiction` green by name;
channels pin `unknown_prop_notes_keep_the_default_line` green by name.
`pnpm agentneo run NEO-SYNC-16` PASS; `pnpm agent vitest
reference-neo` 224/224 (sync.test.ts incl. staticCss pin). Quality:
`agentrs q` on policy+channels — 0 violations, 1 soft warning
(channels 378 vs 365 soft limit from the mandated test placement;
file was 359, gate passes). Zero failures anywhere — nothing to
attribute, nothing absorbed.

**3. Pins.** DIAG-05: default length exactly 1 (frobnicate code +
message + 10:3 + file), other ten channel-only (length 10 +
zero-UnknownProperty assert + per-row position loop over all ten —
NON-OBJECT-CONDITION + UNKNOWN-BREAKPOINT sibling rows pinned
channel-only, still doom fodder per ruling), five sink infos
unchanged, line-94 rationale rewritten. SITE-49: default 0→3 per-line
(file/line/severity/code/message/col 8), channel 7→4 with the four
unfoldable-key asserts intact. SITE-83: default 0→1 matchObject
(42:30), channel moved→0. SITE-20 adjudicated per line: global G6 line
stays, three css-surface lines return (default 4, channel
UNKNOWN-PROPERTY 0). All re-points equal-or-stricter; inputs
untouched (zero `input/` paths in status).

**4. Census** (`/tmp/s6-census.mts` firsthand): default-0, channel
4100 (3743/252/105 with the 105 = 74+13+9+5+3+1), book 253 / src 3847
/ other 0, zero UnknownProperty on channel — matches S6 exactly.

**5. Ledger watch item — AUTHORIZED, not drift.** Every changed row
examined: counts 6/90→9/87 (total 96), userspace header+prose (six
resolve DROPs + three extract DROPs O2/O34/O47 with witnesses),
3 added O-rows, compiler 90→87, C2 50→47 with move note, 3 removed
C2 O-rows, "one legacy code" notes sentence (extract now userspace,
static/global S1/G6 stay compiler — both rows confirmed unmoved).
The ruling's "Ledger C1" label was a slip: C1 is walk/literal/
responsive dynamic refusals (24, untouched in diff), the O-rows live
in C2 where fortify recorded them. Substance matches the C1-note
authorization exactly; label corrected, no gap.

**6. Diff review.** policy/mod.rs: one code, one route
(`ExtractOutcome|ExtractNote → extract_audience` +
`is_unknown_prop_extract` covering note AND funnel arms; table shape
mirrors the existing resolve split, q complexity preserved). All
three gates warn via the note path (object/mod.rs:185 ctx.warn,
lower.rs:108-112, call_lower.rs:117-121 walk.warn); full-grep audit:
funnel (`warn_dynamic`, 14 sites) emits Dynamic*/MutatedBinding/
TokenCallRefused/PartialObjectProp only — zero UnknownProperty, so
the funnel arm is defensive-but-correct per the ruling. sinks.rs:143
is a test asserting non-sink, not a gate. Zero diff: proof/render.rs
(F2 stands), reference-neo, analysis, resolve/static/global emitters,
channels/render.rs (restored signal is the pushed located sentence,
never re-rendered). DIAG-07/14 golden-only justified as-written:
07's `isChannelItem` never covered this code, 14's pins read errors
only. SITE-20 golden verified byte-identical (order included) to
pre-S5 `0eab0bdde`. No weakened tests, no blanket goldens (6
targeted files), no lib touch, finder report untouched, generated
dirs clean. SPEC.md: 5 hunks — 4×(a) (LEAF count, LEAF-09 exception,
LEAF-11 bullet, registry row), 1×(b) (DIAG-05 carve-out sentence).

**7. Contract holds.** DIAG-09 (exact absent keys warn userspace) +
COND-17 precedent now satisfied for unknown props: the queried-and-
missed exact key warns on default, located, while F2 jurisdiction
(extract owns unknown props) stands un-overturned. Captain: commit
the 13 (b) paths + this log section per the commit-ORDER ruling
((a) first without SPEC, then (b) carrying SPEC with both verified
hunks); keep the operation-seize docs + doom reports out of both.

### Wave 2, find (e) — architecture ruling

Find: styletrace traces the param-destructured wrapper (`ParamCard`,
`({ color })` + `color={color}`) but misses both body-destructured
twins (`BodyCard`, `const { color } = props` + `color={color}`;
`BodyRestCard`, `const { title, ...rest } = props` + `{...rest}`) —
identical boundary (`CardProps extends StyleProps`), identical flow
into `<Div>`. Finder report:
`.agents/doom/logs/2026-09-20-styletrace-body-destructure-miss.md`;
repro `/tmp/doom-styletrace-body-destructure.mjs` (replayed by
architect read-only: `traced: ["ParamCard"]`, exit 1 — failure mode
confirmed). Root cause per report: `parse_prop_bindings`
(`modules/styletrace/src/analysis/parser/types.rs`) reads the first
parameter pattern only, so body-bound names never enter the wrapper
graph.

1. **IN-BOUNDS.** Complete static TSX compile input on the pinned
   surface (style props into `<Div>`, a Reference primitive); touches
   nothing on the will-never-work list — no interpolation, no
   runtime-only values, no external config, no namespace/default value
   imports. The rest-spread bullet ("rest-spreads staying dynamic,
   warned, kept, by design") does not apply: `BodyRestCard`'s
   `{...rest}` is static forwarding of boundary props, the exact shape
   the README claims as traced. This is the skill's misdiagnosis
   clause in substance: same boundary, same flow, different verdict —
   an inconsistent refusal, not a designed one. Corroborated inside
   the codebase: the sibling pipeline detector DOES propagate
   body-destructured signals (`record_pipeline_binding`,
   `parser/pipeline/util.rs`), so the JSX edge path contradicts the
   module's own convention. User-facing: atomic gates JSX extraction
   on the traced host set (ATM-SITE-08), so `<BodyCard color="red" />`
   extracts nothing — silent missing paint on a mainstream authoring
   shape (`const { x } = props` is ordinary code, not an exotic).

2. **FIX DIRECTION (binding): extend the wrapper analysis to body
   destructuring — do NOT narrow the README.** Weighed:
   (a) README authority: the violated sentence is the module's key
   rule ("whether style props exposed at that component boundary
   actually flow into the Reference primitive/style pipeline"), with
   both `color={color}` and `{...rest}` named as traced shapes.
   Narrowing to "param-destructured only" would demote the central
   promise to a syntactic accident and bless silent missing paint.
   (b) Precision/recall: collecting one-hop body bindings (`const
   { x } = props`, `const { a, ...rest } = props`) from the already-
   parsed Oxc AST restores recall while precision holds — names are
   still bound from the props identifier, still gated on the
   StyleProps boundary check and the primitive/pipeline sink check.
   Precision guard (inside the extension, not instead of it): only
   destructures whose source is the props parameter identifier count;
   fortify stops at rebinding/shadowing rather than chasing it.
   (c) Precedent: the pipeline detector already does body-pattern
   propagation — the extension aligns the JSX edge path with existing
   convention; reuse/share the pattern-binding parsing if clean,
   without mandating a refactor. (d) Blast radius is contained and
   additive: binding collection only gains names, sink checks are
   unchanged, so previously-traced hosts stay traced; newly-traced
   hosts are the intended recall gain. Fortify runs the full
   styletrace suites (cargo + vitest) and attests any golden movement
   per pair — traced-to-silent flips are regressions, silent-to-
   traced flips on body-destructure shapes are intended. SCOPE:
   one-hop body destructure from the props identifier (direct AND
   rest — one root cause, one rule, since the README names both);
   deeper indirection (`const p = props` chains, conditional
   destructures) is out of this fortify — future doom fodder.

3. **TEST PLACEMENT: Rust unit primary, existing cases secondary — no
   new case, no new station.** Primary pin at the Rust semantic level
   per the module's design rules ("prefer Rust tests for semantic
   coverage"): `modules/styletrace/src/tests/tracing.rs` — add
   body-destructure direct + body-destructure rest tests mirroring
   the finder's twins (lower than the finder's N-API /tmp probe, no
   native binding needed). Secondary: extend the EXISTING
   `tests/cases/direct_wrapper/` (BodyCard twin) and
   `tests/cases/rest_spread_wrapper/` (BodyRestCard twin) inputs with
   body-destructured variants + trace assertions — those families
   already own these shapes. No README amendment, no lib touch.

### Wave 2, find (d) — architecture ruling

Find: `validateDialectExtJoin`
(`packages/reference-rs/modules/canon/generate/join.ts:106-110`)
passes a canonical property when EITHER its name OR its css is
platform-or-extension, so `{ name: 'foobarProp', css: 'color' }` —
a hallucinated name riding a borrowed legit css form — clears the
gate with zero diagnostics, where the README fail-closed join
("a dialect CSS extension is missing from `EXTENSIONS`" → abort)
and SPEC `CAN-JOIN-02` ("any emitted property not defined in W3C
standards is explicitly registered in the `EXTENSIONS` table")
demand abort. Finder report:
`.agents/doom/logs/2026-09-20-wave2-canon-join-css-or-bypass.md`;
repro `/tmp/doom-wave2-canon-join-or-bypass.mts` (replayed by
architect read-only: baseline 0 errors, poison name
platform-or-extension false, poison css true, poison errors `[]`,
exit 1 — failure mode confirmed).

1. **IN-BOUNDS.** The dispute sits entirely inside the build-time
   generator (webref ingest + overlay + join validator) — no
   will-never-work shape is involved (no interpolation, no
   runtime-only values, no external config, no spread, no
   namespace imports). It is a contract-vs-code dispute of the
   exact shape wave-1(c) ruled IN-BOUNDS, and it falls under the
   skill's misdiagnosis clause: silence where a diagnostic is
   owed. Severity, honestly: a latent build-gate hole, not
   currently shipping bad output (`loadDialect` cannot mint such
   a row today) — but the validator is the ONLY gate between a
   bad overlay row / webref drift and the shipped dictionary,
   and emit consumes both fields of a passed row
   (`Property::new(name, css, ...)` at `emit/css.ts:187`;
   `to_css_declaration_property` returns `p.css` at
   `emit/lib.ts:66`), so an emitted hallucination would make
   `is_known_style_prop` bless author typos and mis-emit them as
   `color`. Real hole, latent user-facing.

2. **FIX DIRECTION (binding): narrow the filter to a NAME-only
   check — remove the css-side OR arm in
   `validateDialectExtJoin`; do NOT amend the contract.**
   Weighed:
   - Contract authority: README + CAN-JOIN-02 pin the NAME as
     the joined identity. The emitted `CANONICAL_PROPERTIES`
     table is keyed by name and every downstream lookup
     (`is_known_style_prop`, `resolve_canonical_prop`,
     `class_prefix_for_prop`) keys on it. The `css` field is an
     emission form, not an identity witness — a borrowed css
     string proves nothing about the name. The OR lets the
     wrong field vouch for the row.
   - Fail-closed philosophy: the join exists to abort on
     anything unverified; disjunctive verification across two
     fields of the same row defeats it.
   - Zero blast radius, measured firsthand: architect probe
     `/tmp/doom-wave2d-arch-probe.mts` shows all 1073
     authoritative rows pass via BOTH arms
     (both=1073, cssOnly=0, nameOnly=0) — no legit row needs
     the css arm, so removing it cannot redden CAN-JOIN-02 on
     clean data. Fortify re-verifies.
   - Generator consumers: the sole consumer of the validator is
     `validateJoin` → the orchestrator abort
     (`generate.ts:83-88`); emit consumes dialect rows, not the
     validator. Narrowing only makes the gate stricter —
     emitted output on clean data is byte-identical.
   - Rejected: (a) amending the contract to bless the OR —
     would ratify hallucinated names riding borrowed css,
     contradicting the fail-closed README and CAN-FAIL-05's
     evident intent; (b) an AND-check (name AND css must both
     verify) — unneeded strictness: extension css forms are
     author-chosen emission strings registered in the same
     allowlist row (e.g. `boxSize`/`box-size`), so the css arm
     vouches for nothing independent, and it would conflate
     two failure modes in one diagnostic. The mirror gap
     (legit name + hallucinated css) has no repro — per Law 2
     it is not a break; carry as doom fodder, not fortify
     scope. The diagnostic keeps naming the property (the
     existing `p.name` join already does).

3. **TEST PLACEMENT: extend the EXISTING join station —
   `packages/reference-rs/modules/canon/tests/join.test.ts`,
   no new station, no Rust unit.** The bug lives in the TS
   generator validator; the Rust side only consumes emitted
   tables and has no gate to pin, so a Rust unit test cannot
   observe it. Exact placement: inside the existing CAN-FAIL-05
   `it` (same case, preserving the SPEC's 1:1 case-to-ID
   alignment), add a second poison block with the borrowed-css
   shape (`{ name: 'foobarProp', css: 'color', ... }`)
   asserting abort naming `foobarProp`, alongside the current
   name+css-together poison. SPEC: extend the CAN-FAIL-05 row
   text with the borrowed-css poison shape (one sentence); no
   new case ID. Guards staying green: CAN-JOIN-02
   (authoritative pass-through), the full `join.test.ts`
   suite, and `pnpm --filter @reference-ui/rust run canon`
   regen byte-stability — emitted `src/` must be unchanged
   (fortify verifies via diff), proving the narrowing only
   bites poison.

### Wave 2, find (d) — fortify landing

**Status: LANDED.** Ruling followed exactly, inside the brief's
SCOPE (OR removal + join-station test only): NAME-only
`validateDialectExtJoin`, no contract amendment, no new station,
no Rust unit. Mirror gap (legit name + hallucinated css) untouched
per ruling Law-2 note — still doom fodder, no repro.

**Fix (one arm removed, `canon/generate/join.ts:106-110`).** The
filter is now `!isPlatformOrExtension(p.name, ...)` — the css-side
OR arm is gone, with a one-line why-comment (NAME is the joined
identity; the css emission form must not vouch for the row).
Diagnostic keeps naming the property via the existing `p.name`
join (post-fix repro shows
`FAIL: Canonical properties not in webref or dialect allowlist:
foobarProp`). Pre-fix break re-confirmed firsthand (repro exit 1,
`poison errors: []`); post-fix the repro flips red→green
(exit 0, gate aborts naming `foobarProp`).

**Pin (existing station only).** Inside the existing CAN-FAIL-05
`it` in `canon/tests/join.test.ts` — same case, SPEC 1:1
alignment preserved — a second poison block pushes
`{ name: 'foobarProp', css: 'color', classPrefix: 'fb' }` and
asserts abort naming `foobarProp`, alongside the untouched
name+css-together poison. Fail-without-fix: the extended
CAN-FAIL-05 goes red on the HEAD validator (vitest exit 1);
pass-with-fix: full join station 15/15 green.

**Zero-blast-radius re-verified firsthand.** (1) Architect probe
`/tmp/doom-wave2d-arch-probe.mts` re-run: total 1073, both=1073,
nameOnly=0, cssOnly=0, neither=0 — no legit row needs the css
arm. (2) CAN-JOIN-02 green on clean data (baseline 0 errors,
join station + repro agree). (3) Emission byte-identity via A/B
regen (`pnpm --filter @reference-ui/rust run canon` under HEAD
join.ts vs fixed join.ts): sha256 of all 10 emitted
`src/**/*.rs` files IDENTICAL (`/tmp/doom-wave2d-emit-HEAD.sums`
vs `/tmp/doom-wave2d-emit-fixed.sums`, diff clean) — the
narrowing only bites poison. NOTE for chain/captain: regen vs
*committed* `src/` drifts heavily (properties.rs ±4708 lines,
lib.rs reflow) under BOTH validators — a pre-existing stale
committed snapshot vs live webref, independent of this change.
`src/` was restored to HEAD; the drift is flagged, not swept in.

**Suites (repo runners, this session).** `pnpm agentrs c canon`
53/53 green; `pnpm agentrs v canon` 15/15 green (join station,
incl. extended CAN-FAIL-05); `pnpm agentrs q` on both touched
files PASS (0 over-length, 0 complex, 0 clippy allows).

**SPEC note (flag, not drift).** Ruling item 3 ordered a
one-sentence CAN-FAIL-05 SPEC row extension; the fortify brief's
explicit SCOPE ("OR removal + join-station test only") and
Must-NOT ("amend the README/SPEC contract") forbid touching
SPEC — skipped, for captain/chain to dispatch if wanted.

**Must-NOTs honored:** no README/SPEC edit, no weakened tests
(new pin is strictly additive inside an existing `it`), no
golden updates (canon has none; regen output restored), no lib
touch, finder report untouched.

**Files (mine only, 2 + this section).**
`modules/canon/generate/join.ts` (OR removal + why-comment),
`modules/canon/tests/join.test.ts` (CAN-FAIL-05 borrowed-css
poison block). Final tree: exactly these 2 paths modified.

### Wave 2, find (e) — fortify landing

**Status: LANDED.** Ruling followed exactly: wrapper analysis extended to
one-hop body destructuring; README untouched; no narrowing, no refactor
mandate taken (pattern parsing already shared via `util.rs`).

**Fix.** `parse_prop_bindings` (`modules/styletrace/src/analysis/parser/
types.rs`) gains `body_statements` (single caller `component.rs`
threads `fl_ctx.body_statements` through). When the first param is a
plain identifier, a top-level-only scan collects `const { x } = props`
(direct) and `const { a, ...rest } = props` (rest) from the
already-parsed Oxc AST, reusing `parse_object_bindings` for style gating
— so the StyleProps-boundary and sink checks are unchanged. Precision
guard: init must be the props identifier modulo transparent wrappers
(parens/`as`/`satisfies`/`!`/assertion); the scan halts at the first
top-level shadowing/reassignment of `props` or a collected local
(declarator patterns via AST `BindingPattern` walk, function ids,
plain-identifier assignment targets). Strictly additive — names gained,
never removed — so previously-traced hosts stay traced by construction.
Conditional/nested destructures and `const p = props` chains are out of
scope per the ruling (future doom fodder); only top-level statements
are scanned. Pass state rides a `BodyBindingScan` struct (no 5-arg soup,
no clippy allows).

**Pins.** (1) PRIMARY Rust unit `tracing.rs`: `traces_body_destructured_
direct_forwarding` (BodyCard twin) + `traces_body_destructured_rest_
forwarding` (BodyRestCard twin), each with the finder's ParamCard
control. Fail-without-fix verified via stash: both FAIL on old code,
both pass with the fix. (2) SECONDARY existing stations only:
`direct_wrapper` input gains BodyCard + spec `['BodyCard','Card']`;
`rest_spread_wrapper` input gains BodyRestCard (mirroring the station's
`id`-peel shape) + spec `['BodyRestCard','Card']`; one-line case README
touch-ups each. No new case, no new station.

**Repro.** `/tmp/doom-styletrace-body-destructure.mjs` flips red→green
on the fresh binding: `traced: ["BodyCard","BodyRestCard","ParamCard"]`,
exit 0, CONTRACT HOLDS. Report untouched.

**Suites (all `pnpm agentrs`, this session).** cargo styletrace 34/34;
vitest styletrace 28/28 (11 fixtures + 17 cases, incl. both extended
stations). Downstream ripple check (atomic + runtime depend on
styletrace): cargo atomic 458/458, vitest atomic 284/284 — zero ripple.
Quality: `agentrs q` on touched files — 0 violations; remaining warnings
are the types.rs file-length soft limit (431 vs 365 — same accepted
category as wave-1 channels/codes/walk; splitting mid-fortify is scope
creep), `unwrap_transparent_expression` cognitive 18 (under the hard
line; the identical chain warns at 34/58 in pre-existing model.rs/
walk/expr.rs, so this matches convention), and pre-existing
component.rs warnings in functions I did not touch. Two self-introduced
cognitive-28/21 warnings were refactored away before landing. Never ran
`agentrs f` (formatter-war trap).

**Goldens — attested per pair, hand-written (no `--update-goldens`
blanket).** Exactly 2 move, both intended silent-to-traced on
body-destructure shapes, zero removals: direct_wrapper
`["Card"]`→`["BodyCard","Card"]`; rest_spread_wrapper
`["Card"]`→`["BodyRestCard","Card"]`. All other 15 station goldens
byte-identical (suite-green proves it). Zero traced-to-silent flips.

**Must-NOTs honored:** no README amendment, no weakened tests (specs
strictly strengthened), no blanket goldens, no lib touch, finder report
untouched, sibling (d) canon files untouched (observed their tree state
change mid-flight — not mine, not touched).

**Files (mine only, 11 + this section).**
`parser/types.rs` (extension + guard + struct), `parser/component.rs`
(call-site threading), `tests/tracing.rs` (2 pins), `direct_wrapper/`
(input + spec + golden + README), `rest_spread_wrapper/` (input + spec
+ golden + README).

### Wave 2, find (d) — chain review

**Verdict: VERIFIED (commit-ready).** Whole arc re-verified firsthand by
this oracle; no implementation, no fixes, no commits. (d) files only —
write-set audited via `git status` paths: exactly
`modules/canon/generate/join.ts` + `modules/canon/tests/join.test.ts`
under canon; sibling (e)'s styletrace paths (live in tree, still
building) were never touched or adjudicated. Peer paths
(`docs/ATOMIC.md`, `docs/missions/README.md`, untracked
`operation-seize.md`, 3 untracked doom reports) belong to neither arc.

**1. Finder repro** (`/tmp/doom-wave2-canon-join-or-bypass.mts`,
unmodified, mtime 06:33): exit 0 firsthand — baseline 0 errors on the
authoritative dialect, poison name platform-or-extension false /
poison css true (the borrowed-css shape is genuinely exercised),
poison errors
`["FAIL: Canonical properties not in webref or dialect allowlist:
foobarProp"]`, HOLDS. The gate aborts and names the property.

**2. Suites** (repo runners, this session): `pnpm agentrs c canon`
53/53 green; `pnpm agentrs v canon` 15/15 green (join station incl.
the extended CAN-FAIL-05); `pnpm agentrs q` on both touched files
PASS (0 over-length, 0 complex, 0 clippy allows). Post-review tree
re-run: 15/15 green — my read-only swaps left no residue
(restores verified byte-identical via `cmp` both times).

**3. Fail-without-fix / pass-with-fix:** HEAD validator + extended
station: exactly CAN-FAIL-05 FAILS (named firsthand: `× CAN-FAIL-05`,
14 pass) — the new borrowed-css block pins the gate; fixed
validator: 15/15. The pin fails-old/passes-new, nothing else moves.

**4. Zero blast radius, re-verified firsthand:** (a) arch probe
re-run: total 1073, both=1073, nameOnly=0, cssOnly=0, neither=0 —
no legit row needs the css arm. (b) CAN-JOIN-02 green on clean
data (baseline 0 errors; join station + repro agree). (c) A/B
regen (`pnpm --filter @reference-ui/rust run canon` under HEAD
vs fixed join.ts): sha256 of all 14 emitted `src/**/*.rs` files
IDENTICAL (`diff` clean) — the narrowing only bites poison.
Committed-vs-regen drift confirmed pre-existing and
validator-independent (8 `src/` files rewrite under BOTH
validators); `src/` restored to HEAD via checkout, final canon
status is exactly the 2 fortify files.

**5. Diff review (line-by-line):** `join.ts` — css-side OR arm gone,
filter now `!isPlatformOrExtension(p.name, ...)` exactly per ruling,
one-line why-comment (NAME is the joined identity); diagnostic keeps
naming the property via the existing `p.name` join. `join.test.ts` —
one hunk: second poison block inside the existing CAN-FAIL-05 `it`
(`{ name: 'foobarProp', css: 'color', classPrefix: 'fb' }`, abort +
naming asserts), original name+css-together poison untouched above
it; SPEC 1:1 case-to-ID alignment preserved, no new station, no Rust
unit (correct per ruling — Rust only consumes emitted tables).
Consumer audit: `validateDialectExtJoin` is called only from
`validateJoin` → orchestrator abort (`generate.ts:83-88`); emit
consumes dialect rows, not the validator. Untouched as ordered:
README, SPEC, lib, finder report; no existing test touched (new pin
strictly additive — no weakening); no goldens (canon has none, no
snapshots); mirror gap (legit name + hallucinated css) verified
still passing with `[]` firsthand (`/tmp/chainrev-d-mirror.mts`) —
untouched per the ruling's Law-2 scope note, still doom fodder.

**6. SPEC flag — adjudicated, not a gap.** The ruling ordered a
one-sentence CAN-FAIL-05 SPEC extension; the fortify brief's SCOPE
forbade SPEC touch. Read the row firsthand (`SPEC.md:161-162`):
"Build abort on unverified canonical properties ... with an
injected unverified property name (`foobarProp`)" — the
borrowed-css poison IS still an injected unverified property name,
so the row remains accurate, only less specific. No false statement
left behind; the sentence is a carried doc nit for the captain, not
a correctness gap and not a reason to hold the commit.

**7. Contract holds.** The finder's violated pair (README fail-closed
join + `CAN-JOIN-02`) is now enforced: any emitted property name
not in W3C standards or `EXTENSIONS` aborts the build naming the
property, regardless of what css form it borrows. Captain: commit
the 2 canon paths + finder report + log sections; keep the
operation-seize docs + peer doom reports out.

### Wave 2, find (f) — architecture ruling

Find: barreled lookup `app → barrel → *lib` where
`lib = export { x } from './typo'` (unresolvable) returns
`MissingExport{barrel, x}`, while the direct import of the same
broken edge is `Unresolved{lib, ./typo}` and
`exported_names(barrel)` lists `x` with zero refused — lookup
refuses as missing a name enumeration promises. Root cause per
report: `poll_star` (`walk/star.rs:92`) skips `MissingExport` AND
`Unresolved` from any depth, but the pin it cites ("missing targets
simply do not declare the name") covers only unusable direct star
targets, which already return `None` from `star_candidate`.
Finder report:
`.agents/doom/logs/2026-09-20-wave2-star-swallows-nested-unresolved.md`;
repro `/tmp/doom-wave2-modulegraph-t1` (replayed by architect
read-only: `cargo test --offline` → 1 red
`star_lookup_surfaces_the_nested_unresolvable_hop` with
`MissingExport{barrel, x}`, 2 green controls — failure mode
confirmed).

1. **IN-BOUNDS.** Fully static TS compile inputs, named-import
   dialect, `export *` + `export {} from` shapes — the pinned
   walk surface. Touches nothing on the will-never-work list (no
   interpolation, no runtime-only values, no external config, no
   spread, no namespace/default value imports). Falls squarely
   under the skill's misdiagnosis clause: the refusal must be
   right, not just present — and here the barreled path returns
   the wrong refusal for an edge the direct path pins as
   `Unresolved`. Forge R-B3's letter (a `Refused`, never stale/
   `None`/panic) is technically met, but its spirit plus the
   walk's own coherence pins are violated: `walk_refused.rs`
   ("silence is not an outcome"), the direct-path pin
   (`unresolvable_specifiers_refuse_as_unresolved`), and
   enumeration listing the refused name. ESM agrees this shape is
   not a miss: whole-graph link fails naming the broken hop.
   User-facing: atomic's `edge_reason` words the two refusals
   differently ("unresolvable import" vs "no export 'x' from
   './barrel'"), so the barreled author hunts the barrel instead
   of the broken hop.

2. **FIX DIRECTION (binding): surface the nested hop — route
   nested `Unresolved` to pending, keep skipping terminal miss.**
   Concretely: in `poll_star`, move `Unresolved` from the skip
   arm to the pending arm (winner-beats-error, like
   Cycle/Ambiguous); keep skipping `MissingExport`; keep the
   `star_candidate → None` skip for unusable direct targets. Do
   NOT touch enumeration. Weighed:
   (a) Coherence: `Unresolved{lib, ./typo}` dissolves the
   contradiction — declared-but-broken-hop agrees with
   enumeration listing the declared name — where `MissingExport`
   contradicts it. The alternative (drop `x` from enumeration)
   would contradict `names_of` and hide a real declaration.
   (b) The pin's own scope: "missing targets simply do not
   declare the name" covers direct targets that fail to
   resolve/load (`None`); a resolvable target whose explicit hop
   dangles is neither a missing target nor a miss.
   (c) Consumer expectations: `resolve_binding` consumers
   (atomic resolver → `ValueRefused::Walk` → `edge_reason`)
   branch on variant; `exported_names` consumers get declared
   names plus refused *star targets* as data — no consumer
   expects nested-hop breakage in the refused vector.
   (d) Pending, not immediate-Err: preserves the pinned
   "one winner beats a pending star error" rule — a declaring
   twin still wins over a broken-hop sibling. Immediate return
   would break that pin; skip keeps the bug.
   (e) Blast radius is one match arm: behavior changes only
   where a star subtree yields nested `Unresolved` with no
   winner (previously misattributed `MissingExport`).
   Multi-star-with-winner is unchanged. Fortify runs the
   module-graph cargo suite + atomic suites and attests golden
   movement per pair — MissingExport→Unresolved flips on
   broken-hop star shapes are intended, all else regressions.
   SCOPE (binding): `MissingExport` skipping stays — a star
   target that genuinely does not declare the name must keep
   skipping (ESM null-skip; `stars_never_carry_default`). The
   MissingExport-beneath-a-hop nuance is indistinguishable from
   terminal miss in the `Refused` value and is OUT — future
   doom fodder, do not expand. Likewise OUT: atomic
   `edge_reason` words `Unresolved` from `RefusalCtx` (the
   top-level authored edge), ignoring the payload's
   from/specifier — a pre-existing systematic gap affecting
   even the direct path, with its own golden churn. The walk
   fix delivers the true payload; rewording atomic is a
   separate consult, never a drive-by in this fortify.

3. **TEST PLACEMENT: Rust crate level —
   `packages/reference-rs/modules/module-graph/tests/walk_refused.rs`
   primary, no station, no new case.** Lower than the finder's
   /tmp path-dep probe: port the red test into the crate's own
   `common` MemoryFs harness asserting `Unresolved{lib, ./typo}`
   for the finder's world, plus a winner-beats guard (nested-
   `Unresolved` sibling + declaring twin → winner wins,
   extending `one_winner_beats_a_pending_star_error` to the
   `Unresolved` arm; place beside it in `walk_refused.rs` or
   `walk_star.rs`, fortify's call). No atomic case (atomic
   untouched), no enumeration test change, no neo case.

### Wave 2, find (e) — chain review

**Verdict: VERIFIED (commit-ready).** Whole arc re-verified firsthand by
this oracle; no implementation, no fixes, no commits. (e) files only —
write-set audited via `git status` paths: exactly the landing's 11
styletrace paths (2 parser + 1 unit-test + 4 direct_wrapper + 4
rest_spread_wrapper); sibling (f) + peer paths (`docs/ATOMIC.md`,
`docs/missions/README.md`, untracked `operation-seize.md`, untracked
wave2-star doom report) were never touched or adjudicated.

**1. Finder repro** (`/tmp/doom-styletrace-body-destructure.mjs`,
unmodified): exit 0 firsthand — `traced:
["BodyCard","BodyRestCard","ParamCard"]`, CONTRACT HOLDS. Both
body-destructured twins now trace alongside the ParamCard control.

**2. Suites** (repo runners, this session): `pnpm agentrs c styletrace`
34/34 green (incl. both new pins by name); `pnpm agentrs v styletrace`
28/28 green (11 fixtures + 17 cases, incl. both extended stations).
Downstream ripple check: `pnpm agentrs c atomic` 458/458,
`pnpm agentrs v atomic` 284/284 (11 files) — zero ripple. Quality:
`agentrs q` on the 3 touched `.rs` files — 0 violations, 6 warnings:
types.rs file-length soft limit (431 vs 365) + `unwrap_transparent_
expression` cognitive 18 are the only self-introduced warns (gate
passes; splitting the parser mid-fortify would be scope creep, noted
not gap); the 4 component.rs warns sit in `component_from_expression`
/ `factory_target_from_expression`, functions the diff does not touch
(pre-existing). Zero clippy allows (grep clean).

**3. Fail-without-fix / pass-with-fix:** HEAD worktree + new `tracing.rs`
(plus the gitignored `.reference-ui` metadata the worktree lacks):
exactly the 2 new pins FAIL with `left: ["ParamCard"]` on both — the
finder's reported behavior reproduced firsthand through the same
`trace_style_jsx_names_with_hint` the NAPI binding calls
(`native.rs:15`; stations reach it via `trace()` → `analyzeStyletrace`,
so no old-binding rebuild was needed in the shared tree); in-tree:
34/34. One worktree-only failure (`styletrace_consumer`, `[]`) also
fails at pure HEAD — environmental (no node_modules linkage), not
caused by the pins. Worktree removed after the run.

**4. Golden attestation (per pair, not a blanket):** exactly 2 goldens
move, both intended silent-to-traced, zero removals: direct_wrapper
`["Card"]`→`["BodyCard","Card"]`; rest_spread_wrapper
`["Card"]`→`["BodyRestCard","Card"]`. All other 15 station goldens
byte-identical (28/28 suite-green proves it). Zero traced-to-silent
flips. Specs strictly strengthened (exact `toEqual` arrays, inputs
additive only); `tracing.rs` diff is pure addition (zero `-` lines).

**5. Diff review (line-by-line):** `types.rs` — `parse_prop_bindings`
gains `body_statements`; the identifier-param arm keeps its existing
gate for the whole-object inserts and adds the body scan. One-hop
only: init must be the props identifier modulo transparent wrappers
(parens/`as`/`satisfies`/assertion/`!`); `const p = props` chains and
conditional/nested destructures are not followed (verified by read —
out of scope per ruling, still doom fodder). Direct + rest via the
shared `parse_object_bindings` (StyleProps gating unchanged).
Precision guard verified sound: the halt check runs before each
statement's own collection (no self-trigger on first bind, halt on
later rebinding), covering declarator patterns (full `BindingPattern`
walk), function ids, and plain-identifier assignment targets.
Additive-only (inserts, no removals); param-pattern path returns early
untouched; sink/edge/boundary checks untouched (`model.rs`, edge loop,
`parse_object_bindings` zero diff). `component.rs` — single call-site
hunk threading `fl_ctx.body_statements` (the already-parsed Oxc AST
the edge loop below reuses; no re-parse); `parse_prop_bindings` has
exactly one caller (grep). Pass state rides `BodyBindingScan` (no arg
soup). Untouched as ordered: module README, pipeline detector, lib,
core, finder report; no new case/station (existing families only).

**6. Contract holds.** The finder's violated README rule (boundary style
props flowing into the primitive via `color={color}` and `{...rest}`
are traced) now holds for body-destructured authorship: same boundary,
same flow, same verdict. Captain: commit the 11 styletrace paths +
finder report + log sections; keep the peer docs + wave2-star report
out.

### Wave 2, find (f) — fortify landing

**Status: LANDED.** Ruling followed exactly: nested `Unresolved`
moved from the skip arm to the pending arm; `MissingExport` still
skips (ESM null-skip); `star_candidate → None` skip untouched;
enumeration untouched. One match arm, two tests, nothing else.

**Fix (`walk/star.rs:92`, one line).** The skip arm is now
`Err(Refused::MissingExport { .. }) => {}` — `Unresolved` falls
through to the existing pending arm, so winner-beats-error is
preserved exactly like Cycle/Ambiguous: a declaring twin still
beats a broken-hop sibling, and only a star subtree yielding
nested `Unresolved` with no winner changes outcome (previously
misattributed `MissingExport`). `stars_never_carry_default` and
the whole `walk_star.rs` file hold untouched.

**Pins (both in `walk_refused.rs`, crate `common` MemoryFs
harness — no station, no new case).** (1)
`star_lookup_surfaces_the_nested_unresolvable_hop`: the finder's
world (`app → barrel → *lib`, `lib = export { x } from
'./typo'`), asserting `Unresolved{lib, ./typo}`. (2)
`one_winner_beats_a_pending_star_unresolved`: nested-`Unresolved`
sibling + declaring twin → winner wins (extends
`one_winner_beats_a_pending_star_error` to the `Unresolved` arm).
Fail-without-fix verified firsthand via brief revert: the ported
test FAILS on old code with the exact finder symptom
(`MissingExport{barrel, x}`), passes with the fix; fix restored,
diff back to the 2 files.

**Repro.** `/tmp/doom-wave2-modulegraph-t1` (`cargo test
--offline`, read-only run): the red test flips red→green,
control 1 stays green, and control 2 now fails — expected, its
final assert pins the OLD incoherent behavior
(`matches!(via_lookup, Refused::MissingExport)`), so that failure
is itself confirmation lookup no longer returns `MissingExport`.
Report untouched.

**Suites (all `pnpm agentrs`, this session).** module_graph cargo
102/102 (`walk_refused` 10/10 incl. both new pins by name,
`walk_star` 9/9); atomic cargo 458/458; atomic vitest 284/284
(11 files, 237 stations) re-run on a FRESH binding
(`ensure-native` rebuilt darwin-x64 post-fix — the first vitest
pass ran against a stale 06:43 binary, discarded as vacuous);
styletrace cargo 34/34 (dependent-crate ripple check; tasty does
not depend on module_graph). Quality: `agentrs q` on both
touched files PASS (0 over-length, 0 complex, 0 clippy allows).

**Goldens — zero movement, attested.** Atomic vitest 284/284 on
the fresh binding = all 237 stations byte-stable; no
MissingExport→Unresolved flips anywhere because no atomic
fixture carries a broken-hop star shape. Zero intended flips,
zero regressions, zero golden files touched (`git status` shows
no golden paths; `--update-goldens` never run).

**Must-NOTs honored:** no weakened tests (both pins strictly
additive), no blanket goldens, no lib touch, no enumeration
change, no atomic `edge_reason` rewording, no
MissingExport-beneath-a-hop expansion (both OUT per ruling, still
doom fodder), finder report untouched, no contracts amended.

**Files (mine only, 2 + this section).**
`modules/module-graph/src/walk/star.rs` (one arm),
`modules/module-graph/tests/walk_refused.rs` (2 pins). Peer paths
in tree (`docs/ATOMIC.md`, `docs/missions/README.md`, untracked
`operation-seize.md`) are not mine, not touched.

### Wave 2, find (f) — chain review

**Verdict: VERIFIED (commit-ready).** Whole arc re-verified firsthand by
this oracle; no implementation, no fixes, no commits. (f) files only —
write-set audited via `git status` paths: exactly
`modules/module-graph/src/walk/star.rs` (1 line) +
`modules/module-graph/tests/walk_refused.rs` (+40) under module-graph;
peer paths (`docs/ATOMIC.md`, `docs/missions/README.md` — both 1-line
operation-seize links, read-only; untracked `operation-seize.md`)
were never touched or adjudicated.

**1. Finder repro** (`/tmp/doom-wave2-modulegraph-t1`, `cargo test
--offline`, unmodified): red test `star_lookup_surfaces_the_nested_
unresolvable_hop` now PASSES with `Unresolved{lib, ./typo}`; control 1
(direct import) still green. Control 2 FAILS — expected and
adjudicated, not a gap: its enumeration half still passes (x listed,
zero refused) and the panic is at its final assert which pins the OLD
incoherent behavior (`matches!(via_lookup, MissingExport)`); the panic
message itself shows lookup now returns `Unresolved{from: lib,
specifier: ./typo}`. The mission brief's "controls still green" is
inaccurate for control 2's final assert — that failure IS the
confirmation. Report untouched.

**2. Suites** (repo runners, this session): module_graph cargo 102/102
green (`walk_refused` 10/10 incl. both new pins by name, `walk_star`
9/9 incl. `stars_never_carry_default` + pre-existing winner-beats
guard); atomic cargo 458/458; atomic vitest 284/284 (11 files, 237
stations) on a sha-verified fresh darwin-x64 binding
(`ensure-native`: binary current, post-fix rebuild per landing);
styletrace cargo 34/34 (dependent-crate ripple check). Quality:
`agentrs q` on both touched files PASS (0 over-length, 0 complex,
0 clippy allows).

**3. Fail-without-fix / pass-with-fix:** HEAD `star.rs` + new tests:
ported test FAILS with the exact finder symptom
(`MissingExport{file: barrel, name: x}`), winner-beats guard passes
(pass-pass, as designed — it guards the pending arm, not the bug);
fixed `star.rs`: 102/102. Swap restored byte-identical (`cmp` clean)
and the full suite re-ran green post-restore. NOTE for the captain:
the 07:01 tick's "star.rs shows unmodified" was my fail-without-fix
swap window — adjudicated: fix present in tree, diff shows the
1-line change, green post-restore.

**4. Golden attestation:** zero movement, confirmed firsthand —
284/284 atomic vitest on the fresh binding = all 237 stations
byte-stable; no MissingExport→Unresolved flips anywhere because no
atomic fixture carries a broken-hop star shape. Zero intended flips,
zero regressions, zero golden files touched, `--update-goldens`
never run.

**5. Diff review (line-by-line):** `star.rs` — one match arm: skip arm
is now `Err(Refused::MissingExport { .. }) => {}`, `Unresolved`
falls through to the existing pending arm (first-error-wins,
winner-beats-error preserved exactly like Cycle/Ambiguous);
`star_candidate → None` skip untouched; `star_step`'s
`pending.unwrap_or_else(missing)` surfacing untouched; enumeration
(`exported_names`/`collect_star`) zero diff. `walk_refused.rs` —
pure addition (40 `+`, zero `-`): ported red test mirrors the
finder's world exactly (app→barrel→\*lib, `export { x } from
'./typo'`, asserts `Unresolved{lib, ./typo}`), winner-beats guard
extends `one_winner_beats_a_pending_star_error` to the Unresolved
arm per the ruling. Untouched as ordered: `walk_star.rs`, atomic
`edge_reason` (OUT per ruling — no files), lib/core/neo (zero
paths), finder report; no existing test touched, none weakened;
no contracts amended; OUT-scope nuances (MissingExport-beneath-a-
hop, atomic rewording) verified absent from the diff, still doom
fodder.

**6. Contract holds.** The finder's violated pair (Forge R-B3 spirit
+ walk coherence: direct path pins `Unresolved`, enumeration lists
the name) is now satisfied — barreled lookup returns
`Unresolved{lib, ./typo}` for the broken hop, agreeing with both.
Captain: commit the 2 module-graph paths + finder report + log
sections (floor hit: 6/6); keep the operation-seize docs + peer
paths out.

### Wave 3, find (h) — architecture ruling

Find: `mt: '-{spacing.4}'` silently mints
`margin-top: -var(--spacing-4)` — invalid CSS, dropped by every
browser — with zero diagnostics, a live plan, and the broken
class served with no runtime miss warning. Root cause per
report: `resolve_negated_token` (`resolve/tokens/mod.rs:262-270`)
strips `-`, looks up the still-braced `{spacing.4}` against the
dictionary, misses, and falls through to brace interpolation,
which pastes the literal `-` in front of the expansion. Finder
report:
`.agents/doom/logs/2026-09-20-wave3-negated-brace-token-invalid-css.md`;
repro `/tmp/doom-wave3-neg-brace-repro.mts` (replayed by
architect read-only: `mints -var(...): true`, `diagnostics: []`,
served `spacing-scale__mt_-{spacing.4}` with zero runtime warns,
both half-spelling controls green — failure mode confirmed).

1. **IN-BOUNDS.** Fully static authorship: a complete string
   literal in a TS compile input, named-import `css()` dialect.
   Touches nothing on the will-never-work list (no
   interpolation, no computed/runtime-only values, no external
   config, no spread, no namespace/default value imports).
   Falls squarely under the skill's misdiagnosis clause — the
   refusal must be right, not just present — and here there is
   neither correct paint nor any refusal at all. Both
   half-spellings are pinned green: ATM-TOKEN-07 (`-4` →
   `calc(-1 * var(--spacing-4))`) and braced-ref resolution
   (`{spacing.4}` → `var(--spacing-4)`), so the composition is
   the natural conjunction of two pinned behaviors, not a
   will-never-work shape. Violated contracts: ATM-TOKEN-07
   composed with braced-ref resolution; the tokens README
   Must-not ("Fail closed: diagnostic + `Raw` / passthrough
   only when the author wrote a raw CSS value" — the author
   wrote neither `-var()` nor raw CSS; braced refs are
   explicit token lookups fenced out of the CSS fence per
   `is_whole_css_value`, and the engine fabricated invalid
   CSS instead of resolving or refusing); ATM-TOKEN-12's
   fail-closed principle (bad refs error + drop so the sheet
   stays valid CSS — here the sheet carries invalid CSS
   silently). User-facing: silent missing paint, visible only
   in DevTools.

2. **FIX DIRECTION (binding): calc-wrap the negation —
   negation distributes over explicit token lookup.** A
   leading `-` on a braced ref must emit
   `calc(-1 * <expansion>)` with zero diagnostics:
   `-{spacing.4}` → `calc(-1 * var(--spacing-4))`, and both
   opacity positions compose (`-{path/opacity}` and
   `-{path}/opacity` → `calc(-1 * color-mix(...))`, mirroring
   bare `-path/opacity` which `split_opacity` already handles).
   The alternative (refuse `-{...}` with a new diagnostic) is
   REJECTED. Weighed:
   (a) ATM-TOKEN-07's contract is "a leading `-` on a scale
   token" — `-{spacing.4}` IS that, braced spelling; the
   station's letter already covers it and the code
   under-implements it.
   (b) Braces are explicit token lookups (module header,
   `is_whole_css_value` fence, ATM-TOKEN-08/12). The token
   resolves, so refusal would be a false refusal on success —
   fail-closed governs unresolvable/ambiguous input, not
   resolvable tokens.
   (c) Author intent is unambiguous; there is no alternative
   reading of `-{spacing.4}` under which refusal is the right
   answer. Refusing would make the explicit spelling strictly
   weaker than the bare spelling — a surprising, undocumented
   asymmetry punishing authors who write `-{spacing.4}` for
   clarity over `-4`.
   (d) Blast radius is one function (`resolve_negated_token`
   + its existing fallthrough): no new diagnostic codes, no
   new modules, no runtime change (the plan follows compile;
   the served class heals when the sheet heals).
   SCOPE (binding): the calc-wrap triggers ONLY when the
   post-`-` remainder is exactly one braced ref plus optional
   opacity in either position. Composite literals keep current
   behavior (`-1px solid {colors.x}` → literal preserved,
   inner expands, no calc-wrap) — fortify pins a control.
   `-{unknown.path}` must NOT calc-wrap and must NOT paste
   raw: it falls through to the existing Missing path →
   `UnknownTokenReference` error + dropped declaration
   (ATM-TOKEN-12 parity). This is the fail-closed half of the
   ruling. OUT: new diagnostic codes for this shape; namer
   redesign (class key follows the existing minus/escape
   convention — fortify pins actual, chain review
   sanity-checks a valid selector); the finder's free-research
   `color: 4` → `4px` observation (warned, not silent —
   future doom fodder, do not expand).

3. **TEST PLACEMENT: new token station `ATM-TOKEN-17` —
   `packages/reference-rs/modules/atomic/tests/cases/ATM-TOKEN-17/`
   primary, no neo case, unit optional.** A seam case, not a
   Rust unit and not a neo case: the break spans sheet +
   diagnostics + plan, and the station harness asserts all
   three (sheet `calc(-1 * var(--spacing-4))`, zero
   diagnostics on valid arms, classes-map entry covering the
   served-class half). The station asserts: `-{spacing.4}`
   calc-wraps silently; both opacity positions calc-wrap with
   `color-mix`; `-{unknown.path}` errors `UnknownTokenReference`
   and drops the declaration with siblings intact; composite
   `-1px solid {colors…}` control unchanged. Fortify adds the
   `ATM-TOKEN-17` row to the SPEC station table (14/15/16
   precedent: table row, no prose bullet) and may add a
   `resolve/tokens/tests.rs` guard beside the fix, but the
   station is the pin chain review verifies. No neo case (no
   runtime code changes; plan-follows-compile), no
   ATM-TOKEN-07 edit (that station pins the bare path; the
   composition gets its own number).

### Wave 3, find (g) — architecture ruling

Find: under negation-only `include: ['!outside/**']`, an
explicitly excluded source's want is STILL extracted — the
negation is silently dropped and the full scan compiles.
Root cause per report: `IncludeScope::is_open()`
(`includes/mod.rs:40-43`) returns true whenever no positive
pattern exists, so `matches`/`matches_file` early-return true
and the negative check never runs. Finder report:
`.agents/doom/logs/2026-09-20-wave3-sync-negation-only-open-scope.md`;
repro `/tmp/doom-wave3-sync-negation-only.mjs` (replayed by
architect read-only: both controls PASS, probe FAILs, exit 1 —
failure mode confirmed).

1. **IN-BOUNDS.** Pure config-level source scoping: which
   static TS compile inputs the engine scans. Touches nothing
   on the will-never-work list (no interpolation, no
   computed/runtime-only values, no external config, no
   spread, no namespace/default value imports) and none of
   the physics boundaries (language, wholesale, seam, style
   surface, one-namer all untouched — this is about the
   scan set, not the dialect). Falls under the skill's
   misdiagnosis-adjacent ground: a silent wrong-scope
   compile, zero signal that the exclusion was dropped.
   Violated contracts: the frozen wire format
   (`contracts/types.ts`: "only matching sources compile
   and the rest are skipped silently. Absent or empty
   preserves the legacy scan-all behavior" — a
   negation-only list is neither absent nor empty, yet the
   scope is open) and the module header
   (`includes/mod.rs:3-6`: "`!` negates… absent or empty…
   open"). User-facing: junk atoms — or error diagnostics
   (build failure) — from explicitly excluded files, plus
   sync incoherence (watch matcher over the SAME config
   field excludes `outside/**`, so excluded styles bake
   into the bundle at baseline sync but never trigger a
   rebuild).

2. **FIX DIRECTION (binding): honor negation-only includes
   as exclude-from-scan-all (scan-all-minus-negatives).**
   A non-empty include list with zero positives must scope
   to everything-minus-negatives: `['!outside/**']`
   compiles `theme/**` and skips `outside/**` silently.
   The two alternatives are REJECTED. Weighed:
   (a) Frozen wire contract: a negation-only list is
   non-empty, so the scope is not open; "matching" is
   matcher semantics over the engine's candidate set.
   Both readings satisfy the letter, but only
   scan-all-minus-negatives satisfies author intent — no
   author writes `include` to compile nothing.
   (b) fast-glob semantics, correctly scoped:
   `fast-glob(['!outside/**'])` returns `[]` (re-verified
   firsthand in-session), but that is a traversal-base
   artifact — the listing function has no positive base
   to walk. `IncludeScope` is a MATCHER over an
   already-enumerated candidate set (the engine walks
   `sourceRoot` itself / takes virtual files), so the
   faithful analog inside fast-glob flavor is matcher
   semantics, not the listing function.
   (c) Matcher parity is unanimous for
   scan-all-minus-negatives, all re-verified firsthand:
   `picomatch(['!outside/**'])` → theme true / outside
   false; `minimatch(path, '!outside/**')` → same;
   `micromatch.isMatch(path, ['!outside/**'])` → same.
   (d) Watch coherence decides it: `sync/watch.ts:288`
   builds `picomatch(config.include)` over the SAME
   field. Scan-all-minus-negatives makes baseline sync
   and watch agree exactly — the reported incoherence
   heals. Empty-scope would merely invert the
   incoherence (watch fires on `theme/**` changes the
   engine compiles nothing from).
   (e) Refusing the shape (new diagnostic / reject
   negation-only) is REJECTED: it needs a new diagnostic
   code plus a wire-contract amendment, punishes a
   meaningful author shape ("everything except
   generated/vendored trees"), and contradicts the
   module's own "`!` negates" promise.
   (f) Blast radius is one struct: `IncludeScope` has
   exactly one consumer (`sources.rs`, both disk-scan
   and virtual-files paths via `matches_file`), and
   `is_open` is used only inside `includes/mod.rs`
   itself. The fix is the open-test plus the two match
   functions (open ⟺ positives AND negatives both
   empty; match ⟺ (no positives OR positive hit) AND
   no negative hit). All existing legs are unaffected:
   positives-only, pos+neg, absent/empty, and the
   `['nowhere/**']` missed leg (positives present, no
   hit → still empty). SCOPE (binding): no new
   diagnostic codes, no wire-format change, no watch
   change (watch already implements the ruled
   semantics — that is the point), no ATM-SCAN-02
   change (discovery entry set follows the same scope
   and heals with it).

3. **TEST PLACEMENT: extend station `ATM-SCAN-01` —
   `packages/reference-rs/modules/atomic/tests/cases/ATM-SCAN-01/spec.ts`
   is the binding pin, no neo case, unit optional.**
   The break lives in the engine's matcher, and
   ATM-SCAN-01 already drives the frozen request over
   BOTH paths (`sourceRoot` disk scan + legacy virtual
   `files`) with the exact `theme/` vs `outside/` world
   and `expectRedOnly` helper the negation-only legs
   need — beside the existing `negated` and `missed`
   legs. Fortify adds: frozen `['!outside/**']` →
   red-only with no errors (this pins the ruled
   direction INCLUDING the theme-in half the repro
   deliberately left unasserted); virtual-files
   `['!outside/**']` leg likewise. Fortify may add
   `includes/mod.rs` unit guards beside the fix
   (`negation_only_excludes`), but the station is the
   pin chain review verifies. No neo sync case:
   `sync/index.ts:105` forwards `config.include`
   verbatim onto the frozen request and NEO-SYNC-09
   already pins that forwarding — semantics live in the
   engine, and a neo case would re-prove forwarding.
   No new station number (this is ATM-SCAN-01's own
   contract completing its third shape, not a new
   behavior — contrast find (h)'s composition station);
   fortify adds one sentence naming negation-only =
   scan-all-minus-negatives to the ATM-SCAN-01 SPEC row
   and case README, and one clause to the
   `includes/mod.rs` header comment so the next reader
   does not re-open the scope.

### Wave 3, find (g) — fortify landing

**Status: LANDED.** Ruling followed exactly: negation-only includes
honor scan-all-minus-negatives; `['!outside/**']` compiles `theme/**`
and skips `outside/**` silently. No new diagnostic codes, no
wire-format change, no watch change, no ATM-SCAN-02 change, no neo
case, no new station.

**Fix (`includes/mod.rs`, matcher only).** `is_open` is now
positives-AND-negatives both empty; `matches`/`matches_file` are
(no positives OR positive hit) AND no negative hit. Single consumer
confirmed firsthand (`sources.rs` disk-scan + virtual-files paths
via `matches_file`; `is_open` used only inside `includes/mod.rs`).
All existing legs unaffected by construction: positives-only,
pos+neg, absent/empty, and the `['nowhere/**']` missed leg
(positives present, no hit → still empty). Header clause added
("negation-only … never open") plus the `is_open` doc update.

**Pins.** (1) STATION (binding): `ATM-SCAN-01/spec.ts` gains two legs
beside the existing `negated`/`missed` legs — frozen
`['!outside/**']` → red-only with no errors (pins BOTH halves,
theme-in + outside-out, including the theme-in half the repro left
unasserted), and the legacy virtual-files `['!outside/**']` leg
likewise; contract-line sentence names negation-only =
scan-all-minus-negatives. (2) Unit guard `negation_only_excludes`
beside the fix (`!is_open`, theme-in/outside-out via both
`matches` and `matches_file`). (3) One sentence each in the
ATM-SCAN-01 SPEC row and case README.

**Evidence.** Repro `/tmp/doom-wave3-sync-negation-only.mjs` flips
red→green on the fresh post-fix binding (exit 0; controls PASS,
probe PASS, `theme compiles under negation-only: true`).
Fail-without-fix: new guard FAILS on surgically reverted matcher
logic (old `is_open` + old match arms, test kept), passes with the
fix; file restored byte-identical (`diff` clean) and includes tests
re-run 8/8. Station-path fail-without-fix is the architect's
read-only pre-fix replay (probe FAIL, exit 1) on the same frozen
request shape the station drives. Suites (all `pnpm agentrs`, this
session): cargo atomic 459/459 (458 + new guard, green by name);
vitest atomic 284/284 (11 files, 237 stations incl. extended
SCAN-01) on the rebuilt darwin binding. Quality: `agentrs q` on
both touched code files PASS (0 over-length, 0 complex, 0 clippy
allows). Goldens: zero movement (no `output/` paths in status,
`--update-goldens` never run) — the station golden is the
unscoped legacy compile, untouched.

**Must-NOTs honored:** no weakened tests (station legs + unit guard
strictly additive), no blanket goldens, no lib touch, no watch
touch, no SCAN-02 touch, no neo case, finder report untouched,
sibling (h) files (`resolve/tokens/*`) and peer docs/logs observed
in tree, never touched.

**Files (mine only, 4 + this section).**
`src/includes/mod.rs` (fix + header clause + guard),
`tests/cases/ATM-SCAN-01/spec.ts` (2 legs + contract sentence),
`tests/cases/ATM-SCAN-01/README.md` (1 sentence), `SPEC.md`
(SCAN-01 row sentence only — sole hunk in file). Captain: SPEC.md
+ VOYAGE-LOG-3.md are shared with crew (h); commit per hunk/section.

### Wave 3, find (i) — architecture ruling

Find: canon-blessed extension props (`translateX`/`boxSize`/`spaceX`
probed, ~26 in family) carry `css` forms absent from `@webref/css`
(`translate-x`, `box-size`, `space-x`, ...) served straight through
`to_css_declaration_property` (`emit/lib.ts:60-69`) into minted
classes + sheet rules no browser honors, with `diagnostics: []`.
Finder report:
`.agents/doom/logs/2026-09-20-wave3-canon-emit-dead-declarations.md`;
repro `/tmp/doom-wave3-canon-emit-dead-decl.mjs` (replayed by
architect read-only: exit 1, 3/3 RED, `diagnostics: []`, controls
green — `translate` real, `borderStartRadius` expands).

1. **IN-BOUNDS.** Complete static literals on the pinned `css()`
   surface; no will-never-work shape (no interpolation, no
   runtime-only values, no external config, no spread, no namespace
   imports). Falls under the skill's misdiagnosis clause: silence
   where a diagnostic is owed. Violated contract: canon SPEC §1
   (canon emits `to_css_declaration_property` as language truth;
   platform truth is living `@webref/css`) + `CAN-PROP-03`
   (promises a "CSS declaration property name" / "standard
   kebab-case declaration") — fictional strings are neither.
   `CAN-JOIN-02` blesses NAMES only (wave-2d ruling: NAME is the
   joined identity, `css` is an emission form, not an identity
   witness) — nothing authorizes fictional `css` forms. Wave-2d
   explicitly carried "legit name + hallucinated css" as doom
   fodder per Law 2 (no repro, no break); this find IS that gap
   with a repro — the deferral is discharged, not relitigated.
   Severity, honestly: user-facing silent wrong paint, broad (26
   props); tempered — zero in-repo consumers measured firsthand
   (no lib style-prop usage, no atomic station inputs, no neo
   cases; prior grep hits were `translateX()` *values* in
   keyframes), so current blast is external authors. Still a
   break, not curiosity: anyone authoring these blessed props
   gets dead paint silently.

2. **FIX DIRECTION (binding): REFUSE with a default-visible
   diagnostic + SKIP the want — at the RESOLVE fall-through over
   a GENERATED unrealizable set in canon. Table correction is
   ruled OUT.** Weighed:
   - SPEC §1 authority: the defect is at the serving layer, not
     the join. The join gate stays NAME-only per wave-2d — an
     AND-check there would abort clean regen (the rows are
     allowlisted by design) and is still rejected. `CAN-PROP-03`
     promises every *served* `css` form is real; refusal stops
     the serving.
   - Table correction ruled out: the single-`css`-string row
     cannot express what these props need — `boxSize` 2 decls,
     `truncate` 3, `srOnly` ~8, `spaceX/Y` a child combinator,
     `hideFrom/Below` media queries, `textStyle` token lookup,
     `gradient*` composition; value-dependent ones cannot be
     name-mapped at all (`translateX`→`translate` would clobber
     y/z atomically; `scrollSnapStrictness` composes into a
     value). Any table edit is a fiction swap. Even the
     closest-to-mappable (`animationState`) stays refused for
     uniformity — unverified, and uniformity beats one clever
     rename.
   - Full expansion ruled out for this cycle: 26 per-prop
     lowering designs is a feature build, not a fortify. Each
     future expansion adds a resolve arm above the refusal with
     its own red test + station per Law 2 (each un-refusal
     carries proof).
   - Layer: RESOLVE fall-through (end of the
     `expand_or_passthrough`/`lower_macro` funnel), NOT
     extraction. Decisive: resolve is where realization happens
     and the exemptions already live *by order* — the
     `textGradient` arm runs first (working, must keep working),
     the shorthand/longhands arm covers
     `borderStart/EndRadius`, platform shadowing covers
     `webkitTextFillColor`. Refusal as the fall-through is
     exemption-free and self-maintaining; extraction placement
     would refuse `textGradient` before resolve sees it unless
     given a split-brain exemption list (or wrong-direction
     generator knowledge of atomic interception) — both
     forbidden by SPEC §1's no-secondary-lists rule. Deliberate
     difference from wave-1a's extraction placement (1a's defect
     was plan capture; this one is realization); the SHAPE
     follows 1a: default-visible, boring-but-clear,
     warn-and-SKIP. Resolve is also downstream of all extract
     paths, so one rule covers `css()` + JSX + conditions.
   - The set MUST be generated into canon (table + lookup fn,
     names TBD by fortify): computed at build from webref truth
     — extension rows with `css` ∉ webref, no longhands, not
     platform-shadowed. A hardcoded 26-name list in atomic is a
     secondary property list — forbidden by SPEC §1 /
     `CAN-PROP-01`–`02` crosswalk. Scope: `EXTENSIONS` only;
     `VENDOR` rows explicitly out of scope (vendor `css` may be
     real-but-absent-from-webref; separate brief if doubted).
   - Warn-and-SKIP bound (not keep): keep would still mint the
     dead rules — the exact break — only diagnosed. The violated
     contract is the emission itself. Zero consumers measured,
     so skip removes output nobody reads; injectivity-safe
     (fewer classes, quarantine can only hold).
   - Diagnostic: DEFAULT-visible (direct push; wave-1a lesson +
     wave-1b channel-only-is-silent lesson), naming the prop.
     Located if want spans reach resolve; if unlocatable, still
     default naming the prop (chain adjudicates). New
     `DiagnosticCode` on the `ATM-W-*` precedent.
   - Fortify-bounded: table/fn/code names + wording; enumerate
     all 26 against live webref firsthand — any member that IS
     in webref is excluded with evidence; runtime plan behavior
     pinned either way (a served class key for a dropped atom
     is an acceptable diagnosed fallback per 1a, silence is
     not — decide, write down, pin).

3. **TEST PLACEMENT: PRIMARY new atomic seam station
   `ATM-EXT-01` (new EXT family: dialect-extension realization —
   refused until expanded; future expansions land as EXT-02+).**
   Lower than the finder's /tmp probe, user-facing: input
   `css({ translateX / boxSize / spaceX / ... })` asserting the
   refusal diagnostic fires default-visible naming each probed
   prop, zero dead rules in the sheet (no `translate-x`,
   `box-size`, `space-x`, ... declarations), sibling platform
   props still extract; one JSX leg if cheap (same funnel).
   SECONDARY (required): extend `CAN-JOIN-02`'s existing `it` in
   `canon/tests/join.test.ts` — assert the generated
   unrealizable set equals the webref-recomputed expectation
   (live oracle; the TS side can query `@webref/css`). One
   sentence added to the `CAN-JOIN-02` SPEC row; no new case ID
   (wave-2d precedent), no count change. Explicitly NOT a canon
   Rust unit as the pin — static tables cannot observe webref
   truth, and a membership unit test would pin a hardcoded list
   (secondary-list smell); a Rust guard is allowed but is not
   proof. SPEC: atomic SPEC gains the EXT family section +
   registry + counts; canon SPEC `JOIN-02` row extended. Guards
   staying green: `textGradient` expansion stations,
   `borderStart/EndRadius` longhand stations, webkit platform
   tests, full atomic suite + census (expect ZERO other golden
   moves — zero usage measured, any drift is attribution or
   scope creep), canon regen determinism (new table byte-stable;
   existing `src/` diff attested additive-only). Chain re-runs
   the repro expecting exit 0 via the diagnosed arm, controls
   still green.

### Wave 3, find (h) — fortify landing

**Status: LANDED.** Ruling followed exactly: calc-wrap the negation in
`resolve_negated_token`; no new diagnostic codes, no runtime change, no
TOKEN-07 edit, class keys pinned actual, `color:4` observation untouched.

**Fix (`resolve/tokens/mod.rs`, one function + two helpers).** A `-`
remainder starting with `{` routes to `resolve_negated_braced`: inner is
trimmed (the `expand_open` convention), the tail must be empty or exactly
`/opacity` (`negated_brace_tail`), inner splits via the same
`split_opacity` the bare path uses, lookup is `lookup_entry` (the same
lookup the non-negated braced twin performs), and the hit emits
`calc(-1 * <expansion>)` silently. Everything else returns None into the
existing fallthrough, so behavior changes ONLY on the ruling's arms:
`-{spacing.4}` → `calc(-1 * var(--spacing-4))`; `-{path/50}` and
`-{path}/50` → `calc(-1 * color-mix(...))`; `-{unknown.path}` → None →
the existing Missing path → `ATM-E-UNKNOWN-TOKEN` error + dropped
declaration (verified firsthand this already failed closed pre-fix, and
still does); composites (`-1px solid {…}`, shorthand-expanded before
resolve) byte-identical. Decisions inside the ruling's scope: (a) inner
trim closes the `-{ spacing.4 }` silent-`-var()` hole too (pre-fix probe:
negated-spaced minted `-var()` silently while non-negated spaced
errored — the non-negated whole-value trim quirk is pre-existing and
untouched); (b) `lookup_entry` (not interpolate's full-path-only
`system.token`) flips `-{4}` from error to calc-wrap — parity with `{4}`
which already resolves, per the ruling's anti-asymmetry clause (c);
(c) opacity in BOTH positions at once falls through unpinned-by-station
(no calc-wrap, asserted once in the unit guard) — outside "optional
opacity (either position)", current behavior preserved; (d) the
non-negated `{p}/50` → `var()/50` wart is untouched (OUT of scope).

**Station `ATM-TOKEN-17`** (seam case: sheet + diagnostics + classes-map
over the ruling's 4 arms). Input: `spacing.4` + `colors.blue.600` dump,
one `App.tsx` (`mt`/`color`/`backgroundColor`/`border` valid,
`ml: '-{unknown.path}'`). Spec asserts the three calc-wraps, no `-var(`
/ `-color-mix(` anywhere, the composite expansion (`border-color` var,
`border-style` solid, `border-width` `-1px`), the dropped `margin-left`,
`atomCount` 6, exactly 2 diagnostics (error `ATM-E-UNKNOWN-TOKEN` naming
`{unknown.path}` at `App.tsx:8:7` + the `ATM-W-MISSING-STYLE-PLAN`
proven-miss warning — TOKEN-12 parity, proving the valid arms silent),
and all 6 classes-map entries pinned actual
(`negated-brace__mt_-{spacing.4}` etc. — braces ride the class key per
the existing minus convention; selectors escape cleanly and the ghost
gauge passes). Goldens generated scoped (`-t TOKEN-17 --update-goldens`)
and attested per pair: styles.css 6 utility rules exactly as predicted,
css.json 6 entries, diagnostics.json the 2 predicted items. Rust unit
guard beside the fix (`tests.rs`: calc-wrap table incl. `-{4}`, unknown
error+drop, composite interpolation, double-opacity no-calc boundary).
SPEC: station-table row only (14/15/16 precedent).

**Evidence.** Finder repro flips red→green firsthand (exit 0: no
`-var()`, `diagnostics []`, served class, no runtime warns); pre-fix
probes documented all 8 baseline shapes on the old binding. Suites:
`pnpm agentrs c atomic` 462/462 (458 + 3 mine + 1 peer crew (g)
in-flight `negation_only_excludes` — read-only attributed, not mine);
`pnpm agentrs v atomic` 285/285 (11 files; 284 + TOKEN-17). Quality:
`agentrs q` on both touched `.rs` files — 0 violations, 1 soft warning
(mod.rs 372 vs 365 soft file-length limit from this change; gate passes,
same accepted category as wave-1 walk/channels/codes and wave-2
types.rs — splitting mid-fortify is scope creep). `rustfmt --check`
clean. Zero other goldens moved (`git status`: no other `output/`
paths); `agentrs f` never run.

**Must-NOTs honored:** no weakened tests (all pins additive or new), no
blanket goldens (3 new files, attested), no lib touch, no TOKEN-07 edit,
no diagnostic codes added, finder report untouched, peer files
(`includes/mod.rs`, SCAN-01, docs, operation-seize) never touched.

**Files (mine only, 8 + this section).**
`resolve/tokens/mod.rs` (fix), `resolve/tokens/tests.rs` (guard),
`SPEC.md` (1 table row), `tests/cases/ATM-TOKEN-17/` (baseSystem.json,
`input/src/App.tsx`, spec.ts, README.md, `output/` × 3).

### Wave 3, find (g) — chain review

**Verdict: VERIFIED (commit-ready).** Whole arc re-verified firsthand by
this oracle; no implementation, no fixes, no commits. (g) files only —
write-set audited via `git status` paths: exactly
`src/includes/mod.rs` + `ATM-SCAN-01/spec.ts` + `ATM-SCAN-01/README.md`
+ the SCAN-01 SPEC sentence under atomic; sibling (h)'s
`resolve/tokens/*` + `ATM-TOKEN-17/` + SPEC TOKEN-17 row and all peer
docs/logs were never touched or adjudicated (read-only for
attribution; SPEC.md shared — commit per hunk).

**1. Finder repro** (`/tmp/doom-wave3-sync-negation-only.mjs`,
unmodified): exit 0 firsthand on the 07:16 post-fix darwin-x64 binding
— all 3 checks PASS (pos+neg controls + negation-only probe), and
`theme compiles under negation-only: true`, pinning the ruled
scan-all-minus-negatives direction including the half the repro left
unasserted. Report untouched.

**2. Suites** (repo runners, this session): `pnpm agentrs c atomic`
462/462 green (458 baseline + (g) `negation_only_excludes` green by
name + 3 in-flight sibling-(h) tests, read-only attributed);
`pnpm agentrs v atomic -t "SCAN-01"` 1 passed / 284 skipped;
FULL `pnpm agentrs v atomic` 285/285 (11 files — 284 + sibling (h)
TOKEN-17, green, attributed). Quality: `agentrs q` on
`includes/mod.rs` PASS (0 over-length, 0 complex, 0 clippy allows).
Zero failures anywhere — nothing to attribute, nothing absorbed.

**3. Fail-without-fix / pass-with-fix:** (a) Rust guard — surgically
reverted matcher (old `is_open` + old match arms, test kept): exactly
`negation_only_excludes` FAILS, other 15 includes tests pass; fix
restored byte-identical (`cmp` clean), 16/16 green post-restore.
(b) Station/frozen-request path — equivalent firsthand proof: old
`is_open()` returns true for any negation-only list (the guard's
first assert is what bites), and `is_open → matches_file`
early-returns true for every file through the single consumer
`sources.rs` (both paths audited), so `outside/**` compiles —
deterministically the architect's logged pre-fix replay (probe FAIL,
exit 1) on the same frozen shape the station drives. A Sep-16
`dist/npm` x64 binding was probed as a stale-code oracle but predates
the frozen `spec` request shape (`missing required baseSystem`) and
cannot drive it — discarded, not counted. Post-fix the station pins
both halves (theme-in via `expectRedOnly`, outside-out) on frozen +
virtual legs.

**4. Existing legs unaffected (all in the green station run):**
positives-only (`theme/**` frozen + virtual), pos+neg (`negated`
leg), absent/empty (open + empty legs), and the `['nowhere/**']`
missed leg still empty (`wants []`, `classes {}` — positives
present, no hit → still empty per the new match formula). Units
`negation_carves_holes`, `open_include_keeps_legacy_files`,
`include_scopes_virtual_files/disk_scan` all green.

**5. Diff review (line-by-line, (g) write-set):** `is_open` now
positives-AND-negatives both empty; `matches`/`matches_file` now (no
positives OR hit) AND no negative hit — exactly the ruling's formula.
Header clause + `is_open` doc updated; unit guard asserts `!is_open`
+ theme-in/outside-out via both `matches` and `matches_file`.
`spec.ts` is pure addition (14 `+`, zero `-`: 2 legs + contract
sentence); README + SPEC one sentence each (SCAN-01 row only — the
TOKEN-17 SPEC row hunk is sibling (h)'s, not adjudicated). Untouched
as ordered: `codes.rs` (no new codes), `contracts/types.ts` (no wire
change), `sync/watch.ts` + `sync/index.ts` (no watch change —
forwarding verbatim + `picomatch(config.include)` confirmed by read),
ATM-SCAN-02, neo (no case), lib, finder report. No existing test
touched, none weakened; zero goldens moved (no `output/` paths in
status, `--update-goldens` never run) — the golden is the unscoped
legacy compile, untouched by design.

**6. Contracts hold.** Frozen wire (`types.ts:131-135`: only matching
sources compile; absent-or-empty scans all) now holds for the
non-empty negation-only list; module header ("`!` negates… absent or
empty… open") holds with the never-open clause; watch coherence
holds — verified firsthand `picomatch(['!outside/**'])` → theme true
/ outside false, exactly the engine's new behavior, so baseline sync
and watch agree. Captain: commit the 4 (g) paths + finder report +
log sections per hunk with (h); keep peer docs + (h)/(i) files out.

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

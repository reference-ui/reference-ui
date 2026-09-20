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
- 2026-09-20 07:22 tick: W3g COMMITTED (negation-only VERIFIED; SPEC excluded — shared with (h)+(i), rides last with all-verified hunks). Chain (h) reviewing; fortify (i) building. Peer active (2 new mission docs: jettison, reaper — hands off). Cycles banked: 7/6. Next: chain (h) verdict → commit (h); (i) landing → chain → commit + SPEC → wave 4.
- 2026-09-20 watch: W3h COMMITTED (4c776b7c2 — negated-brace calc-wrap VERIFIED; SPEC still held). Fortify (i) building (resolve fall-through + canon set in tree). Cycles banked: 8/6. Next: (i) landing → chain → commit + SPEC → wave 4.
- 2026-09-20 07:40 tick: chain (i) reviewing (~15 min, only live crew, no verdict — normal length for webref + full-suite + diff arc). Tree stable (25 paths). No deadlock, no pings sent. Next: chain (i) verdict → commit + SPEC → wave 4.
- 2026-09-20 watch: WAVE 3 COMPLETE — 3/3 breaks fortified + verified + committed (W3g negation-only 305cf4f66; W3h negated-brace 4c776b7c2; W3i unrealizable-refusal 5075ca94f). Cycles banked: 9/6. Wave 4 hunting: 3 finders × 3 theories — (j) tasty emit, (k) styletrace pipeline/JSX, (l) diagnostics proof/adapters. Tree holds peer files only. Next: wave-4 verdicts → arcs → commits → wave 5.
- 2026-09-20 watch: wave 4: (j) BREAK-FOUND (tasty merge drops alpha member) → architect dispatched; (k) BREAK-FOUND (styletrace pipeline misses object form) → architect dispatched; (l) diagnostics proof/adapters still hunting. Cycles banked: 9/6. Next: rulings → fortify → chains → commits → wave 5.
- 2026-09-20 watch: wave 4: (j) IN-BOUNDS, resolve-layer MERGE M1–M3 → fortify on pre-resolution fold + resolve.rs pins + TST-INT-04; (k) IN-BOUNDS, shared-predicate recursion → fortify on util.rs + tracing.rs + direct_style_pipeline; (l) diagnostics proof/adapters still hunting. Cycles banked: 9/6. Next: landings → chains → commits → wave 5.
- 2026-09-20 watch: wave 4: (j) fortify building (MERGE fold + TST-INT-04); (k) landed → chain reviewing; (l) BREAK-FOUND (custom-prop object silent miss) → architect dispatched. Cycles banked: 9/6. Next: verdicts → commits → wave 5.
- 2026-09-20 watch: wave 4: (k) COMMITTED (936a0e961 — pipeline object-arg VERIFIED); (j) landed → chain reviewing; (l) IN-BOUNDS, query-side expansion → fortify on collectEntries + is_style_value_position + ATOM-06. Cycles banked: 10/6. Next: chain (j) verdict → commit; (l) landing → chain → commit → wave 5.
- 2026-09-20 08:01 tick: W4j COMMITTED (tasty MERGE VERIFIED). Fortify (l) the only live crew, building (query-side arms + ATOM-06 in tree). Cycles banked: 11/6. Next: (l) landing → chain → commit → wave 5.
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

### Wave 3, find (h) — chain review

**Verdict: VERIFIED (commit-ready).** Whole arc re-verified firsthand by
this oracle; no implementation, no fixes, no commits. (h) files only —
write-set audited via `git status` paths + sha: exactly
`resolve/tokens/mod.rs` (+39/-0, sha `6ca5d4ac` stable across the
review), `resolve/tokens/tests.rs` (+64/-0), the TOKEN-17 SPEC table
row (1 hunk; the SCAN-01 SPEC sentence is sibling (g)'s, committed
separately per the 07:22 tick plan), and the new `ATM-TOKEN-17/` dir
(5 inputs + 3 goldens). Sibling (g) files (now in HEAD `305cf4f66`),
live sibling (i) canon files, peer docs (`ATOMIC.md`,
`missions/README.md`, `operation-jettison/reaper.md`), and all doom
reports were never touched or adjudicated. NOTE for the log: the (g)
commit landed mid-review (07:22:36) and (i) canon edits arrived
07:26+; all post-restore greens below ran on the current tree
including (i)'s in-flight edits — zero interference observed.

**1. Finder repro** (`/tmp/doom-wave3-neg-brace-repro.mts`,
unmodified): exit 0 firsthand — `mints -var(...): false`,
`diagnostics: []`, served `spacing-scale__mt_-{spacing.4}`, zero
runtime warns. The repro only asserts absence of the break, so this
oracle added `/tmp/chainrev-h-positive.mts` (8/8 PASS): the sheet
positively contains `margin-top: calc(-1 * var(--spacing-4));`, no
`-var(` anywhere, compile silent, served class non-empty with no
runtime warns, the served class's own rule is the healed calc-wrap,
and both half-spelling controls still green (bare `-4` calc-wraps,
bare `{spacing.4}` resolves — TOKEN-07 + braced twin untouched).

**2. Suites** (repo runners, this session, current tree):
`ATM-TOKEN-17 -t` filter 1 passed / 284 skipped; `pnpm agentrs c
atomic` 462/462 (458 baseline + 3 new guards green by name +
(g)'s `negation_only_excludes`, read-only attributed); FULL `pnpm
agentrs v atomic` 285/285 (11 files, 238 stations). Quality:
`agentrs q` on both touched `.rs` files — 0 violations, 1 soft
warning (mod.rs 372 vs the 365 *soft* file-length limit from this
change; gate passes, same accepted category as wave-1
walk/channels/codes and wave-2 types.rs — splitting mid-fortify
would be scope creep, noted not gap). Zero failures anywhere —
nothing to attribute, nothing absorbed. Binding discipline:
`ensure-native` content-hash verified (`b88c...`); the one stale
oracle attempted (Sep-16 `dist/npm` x64) loads but predates waves
1–2 diagnostics — it still mints `-var(` (old shape confirmed) yet
cannot run the station meaningfully, so fail-without-fix was proven
by surgical revert + rebuild instead (below), not counted from stale.

**3. Fail-without-fix / pass-with-fix (surgical revert, restored
byte-identical):** swap window 07:23:52–07:24:33 BST, mod.rs only
(tests + station kept), announced here for sibling attribution.
(a) Cargo: new `test_negated_braced_ref_calc_wraps_silently` FAILS
on old code with the exact finder symptom (`left:
Some("-var(--spacing-4)")`, `right: Some("calc(-1 *
var(--spacing-4))")`); the unknown-errors and composite guards pass
on old code — pass-pass BY DESIGN (TOKEN-12 parity pin + composite
control pin, both disclosed in the landing), guarding arms the fix
must not move. (b) Station: old-code binding rebuilt (8.2s),
TOKEN-17 FAILS 1 failed / 284 skipped (`AssertionError: expected
... to contain 'margin-top: calc(-1 * var(--spacing-4...'`);
finder repro on the old binding exits 1 with the verbatim BREAK
(`mints -var: true`, silent, served). Restored via `/tmp` backup:
`cmp` clean, sha back to `6ca5d4ac`, diff back to +39/+64,
binding rebuilt with stamp back to `b88c...` and size 8260744;
post-restore station + repro + probes + full suites all green
(cargo 462/462, vitest 285/285, re-run again after (i)'s edits
arrived — still green).

**4. Diff review (line-by-line, (h) write-set):**
`resolve_negated_token` gains one early arm — a `-` remainder
starting with `{` routes to `resolve_negated_braced`; everything
else is untouched (single caller at mod.rs:47, the sole funnel for
all values). The trigger is exact per the ruling: inner trimmed
(the `expand_open` convention, `interpolate.rs:89`), tail empty or
exactly `/opacity` (`negated_brace_tail` rejects second brace
pairs, trailing literals, bad opacity), inner split via the same
`split_opacity` the bare path uses, double-opacity (both positions)
rejected, empty/brace-containing inners rejected — all return None
into the EXISTING fallthrough, so behavior changes ONLY on the
ruling's arms. Lookup is `lookup_entry(prop, path, system)` —
identical call to the non-negated braced twin (mod.rs:95), which is
why `-{4}` flips error→calc-wrap in parity with resolving `{4}`
(both verified firsthand: `{4}`→var, `-{4}`→calc silent — the
ruling's anti-asymmetry clause (c)). Missing falls through to the
TOKEN-12 path by construction: None → pathed miss →
`expand_brace_segments` → `keep_raw_segment` pushes
`UnknownTokenReference` (`interpolate.rs:111-115`, message template
byte-identical to the TOKEN-12 path) → `Missing` → atom dropped;
station golden shows `ATM-E-UNKNOWN-TOKEN` + dropped `margin-left`
+ siblings intact. No new codes (`diagnostics/` zero diff; the code
pre-exists at `codes.rs:83/192`); no runtime change (zero neo
paths); class keys follow the existing convention raw
(`mt:-{spacing.4}` → `negated-brace__mt_-{spacing.4}`, cf. TOKEN-07
`mt:-4` → `__mt_-4`) with escaping identical to the TOKEN-08
brace precedent (`\{…\.…\}`, `\/`), and the station's ghost gauge
is green. TOKEN-07 untouched (zero paths), no lib touch, finder
report untouched, no existing test touched (both `.rs` diffs pure
addition, zero `-` lines), no blanket goldens (only the 3 new
TOKEN-17 outputs; zero `output/` paths modified in status).

**5. Contracts hold.** TOKEN-07 composition: `-{spacing.4}` now
calc-wraps exactly like bare `-4`, both opacity positions compose
to `calc(-1 * color-mix(...))` (verified firsthand on the fixed
binding alongside the station asserts). README fail-closed: the
fabricated `-var()` is gone on all ruled arms — resolvable refs
calc-wrap, `-{unknown.path}` errors `UnknownTokenReference` and
drops the declaration with `atomCount` 6 and the exact-2-diagnostics
shape (error + proven-miss warning, proving the valid arms silent).
TOKEN-12 parity: same error code/message shape as TOKEN-12's
`{colors.nope}` golden plus the same `ATM-W-MISSING-STYLE-PLAN`
`has no compiled style plan` warning. SPEC (h) hunk is exactly the
ruled table row, no prose bullet.

**6. Residual carried as doom fodder (NOT a gap):** double-opacity
`-{p/50}/60` is outside the ruling's trigger ("optional opacity in
EITHER position") and keeps its pre-fix fallthrough, which mints
`color: -color-mix(...)/60` silently (observed firsthand; the
fallthrough code path has zero diff — preserved, not introduced).
The landing discloses it and pins no-calc-wrap at unit level, which
is the ruling-consistent conservative reading; refusing it would
have been scope expansion (the token resolves — it wants a
malformed-modifier rule, not UnknownTokenReference). Next brief:
negated double-opacity (and the untouched non-negated `{p}/50` →
`var()/50` wart, likewise disclosed OUT of scope). Captain: commit
the (h) write-set (2 `.rs` + SPEC TOKEN-17 row hunk + new
`ATM-TOKEN-17/` dir + finder report + log sections) per the
hunk-split plan with (g)'s SPEC sentence and (i); `dist/` is
untracked build output, nothing to commit there.

### Wave 3, find (i) — fortify landing

**Status: LANDED.** Ruling followed exactly: refuse with a
default-visible diagnostic + SKIP at the RESOLVE fall-through over a
GENERATED unrealizable set in canon; table correction OUT (no
`EXTENSIONS` row touched, no join-gate change).

**(1) Generated set INTO canon.** New `DialectData.unrealizableExtensions`
(`generate/dialect.ts`, `EXTENSIONS` only — vendor out) computed at
build from live webref truth: rows with `css` ∉ webref kebab names,
no longhands, name not platform-shadowed. Emitted as
`css/unrealizable.rs` (`UNREALIZABLE_EXTENSIONS` + binary-searched
`is_unrealizable_extension`), wired through `css/mod.rs` + `lib.rs`
re-exports. Firsthand enumeration (`/tmp/wave3i-enumerate.mts`, all 30
rows vs live `@webref/css` 821 props): **27 members** — boxSize,
hideFrom, hideBelow, spaceX, spaceY, srOnly, debug, textStyle,
truncate, gradientFrom/To/Via + 3 positions, textGradient,
backgroundGradient/Linear/Radial/Conic, textShadowColor,
fontSmoothing, animationState, translateX/Y/Z, scrollSnapStrictness;
excluded with evidence: borderStart/EndRadius (longhands),
webkitTextFillColor (platform-shadowed), and ZERO rows have `css` in
webref (all 30 checked absent). textGradient is IN the set by rule —
its working arm above the refusal is the exemption, by order.
Regen per README (`pnpm canon` + `cargo fmt -p canon` — raw emitter
chunks need the fmt step; without it the diff is 5k lines of packing
noise): existing `src/` diff attested additive-only (mod.rs +2,
lib.rs re-export reflow, tests.rs +19 guard), new file byte-stable
across double regen+fmt (md5 `d104f94d…` twice),
`generated/platform-names.ts` untouched. Rust guard
`unrealizable_extensions_table_contract` is structural only (sorted +
self-consistent + exemption negatives) — no positive-name pins.

**(2) Resolve fall-through refusal.** `expand_or_passthrough` now takes
the session; after the macro arm (textGradient keeps working) and the
shorthand arm (radius pairs keep working) comes
`refuse_unrealizable_extension`: canonical prop in the generated set
→ `session.emit` keyed `Rejected` with new code
`ATM-W-UNREALIZABLE-EXTENSION` (CODE_TABLE 46→47), sentence `` `{prop}`
has no CSS lowering; the declaration was dropped `` (new
`NameDetail::UnrealizableExtension` arm; all existing sentences
untouched), warn-and-SKIP (no atoms). Located: want spans reach
resolve (`want.location()`), so every line carries file:line:col.
Default-visible by construction: `resolve_audience` keeps non-false
`Rejected` userspace, and proof joins the fact as the resolver cause
(final line keeps code + site, message gains the proof prefix).
Runtime plan decision, written + pinned: NO plan served — there is no
atom to serve, so a served class key would be a ghost class; loudness
comes from the compile warning plus the standard dev miss path, never
silence. Covers `css()` + JSX + conditions + recipes (all route
through `resolve_want_with`); static/global synthesize atoms directly
and are outside the ruled funnel — untouched, zero usage either way.

**(3) PRIMARY station `ATM-EXT-01`** (new EXT family). Input probes 8
direct props + a `&:hover` arm + a JSX leg (10 diagnostics, all new
code, all located, each naming its prop); siblings (`color`,
`translate`) extract; textGradient trio + radius corners prove the
arms above; sheet carries zero fictional declarations (all 10 `css`
forms + `text-gradient` asserted absent), `css.json` has zero refused
keys, and zero runtime plans serve refused props. Goldens scoped
(`-t EXT-01 --update-goldens`) and attested per pair: diagnostics 10
located warnings, css.json 7 entries, utilities layer exactly 7 real
rules. FINDING while probing: `srOnly` never reaches resolve —
extraction claims every `*Only` key as a breakpoint range
(`is_breakpoint_range`) before the known-prop check, so it warns
causeless `MissingStylePlan` instead; pre-existing, separate gap,
carried as doom fodder (probe: `/tmp/wave3i-sronly-probe.mjs`).
Station probes `hideFrom` in its place; `srOnly` stays in the set and
the SPEC/README say why it is unprobable.

**(4) SECONDARY: `CAN-JOIN-02` extended in-place** (no new case ID, no
count change): the same `it` now also asserts
`baseDialect.unrealizableExtensions` equals the live-oracle
recomputation spelled independently from `EXTENSIONS` + webref, so
generator predicate drift fails loudly. One sentence added to the
`CAN-JOIN-02` SPEC row.

**(5) SPEC + suites.** Atomic SPEC: new `EXT` family section +
breakdown row + status counts + proof-map row (all +1 my delta only;
pre-existing count staleness elsewhere untouched). Suites, all
`pnpm agentrs` this session: cargo atomic 464/464 (462 + 2 new
resolve tests), vitest atomic 286/286 (11 files, incl. EXT-01,
SHORT-08/09, webkit pins), cargo canon 54/54 (incl. new guard),
vitest canon 15/15. **Zero other golden moves** (no `output/` paths
outside EXT-01; `--update-goldens` ran once, `-t`-scoped). Census
re-verified firsthand: zero compilable usage of the 27 in lib/neo
(only a `.d.ts` evidence file + one exempt textGradient in a neo
parity world). `agentrs q`: 0 violations everywhere; soft warnings
only in accepted pre-existing categories (codes.rs/facts.rs table
growth, emitCssModRs template length). `cargo fmt -p atomic --check`
shows tree-wide pre-existing drift; my lines match their neighbors
except one assert I reformatted to clean. Repro
`/tmp/doom-wave3-canon-emit-dead-decl.mjs` flips red→green (exit 0:
3 located default diagnostics, no classes minted, controls green).

**Must-NOTs honored:** no hardcoded list in atomic (one
`canon::is_unrealizable_extension` call; test files name probes,
never a lookup table), no weakened tests, no blanket goldens, no lib
touch, no table/join-gate/rewording drive-bys, finder report
untouched, peer files (`resolve/tokens/*`, TOKEN-17, SCAN-01, docs,
operation docs) never touched.

**Files (mine only, 19 + this section).** Canon: `generate/dialect.ts`
(set builder + field), `generate/emit/css.ts` (new emitter + mod
wiring), `generate/emit/index.ts`, `generate/emit/lib.ts`
(re-export), `generate/emit/tests/join.ts` (structural guard),
`generate/generate.ts` (write step), `src/css/unrealizable.rs` (new,
generated), `src/css/mod.rs`, `src/lib.rs`, `src/tests.rs`
(generated), `tests/join.test.ts` (JOIN-02 oracle), `SPEC.md` (JOIN-02
sentence). Atomic: `src/resolve/mod.rs` (fall-through refusal +
header clause), `src/resolve/tests.rs` (2 guards),
`src/diagnostics/codes.rs` (new code), `src/diagnostics/facts.rs`
(new detail), `src/diagnostics/policy/resolve.rs` (new sentence +
pin), `SPEC.md` (EXT section + registry + counts — shared with crew
(h), commit per hunk), `tests/cases/ATM-EXT-01/` (css.ts, App.tsx,
spec.ts, README.md, `output/` × 3). Captain: atomic SPEC.md shared
with (h); canon files + VOYAGE-LOG-3 section are mine.

### Wave 3, find (i) — chain review

**Verdict: VERIFIED (commit-ready).** Whole arc re-verified firsthand by
this oracle; no implementation, no fixes, no commits. (i) files only —
write-set audited via `git status` paths: exactly the landing's 19
(12 canon + 7 atomic incl. new `unrealizable.rs` + new `ATM-EXT-01/`);
peer paths (`docs/ATOMIC.md`, `docs/missions/README.md`, untracked
`operation-jettison/reaper.md`) were never touched or adjudicated.
Atomic SPEC.md is shared with (h) — hunks attributed below; commit per
hunk. Swap windows announced here for sibling attribution: mod.rs
07:37:39–07:38:09 BST, dialect.ts ~07:39 BST; both restored
byte-identical (`cmp` clean, shas match), binding rebuilt after each.

**1. Finder repro** (`/tmp/doom-wave3-canon-emit-dead-decl.mjs`,
unmodified): exit 0 firsthand — 3 located default
`ATM-W-UNREALIZABLE-EXTENSION` warnings naming `translateX`/`boxSize`/
`spaceX` (`src/css.ts:2:37, 3:34, 4:33`), zero classes minted
(`emitted null` × 3, no dead rules in sheet), controls green
(`translate` real, `borderStartRadius` expands to both corners).
`result.diagnostics` is the default channel — refusal is
default-visible naming each prop, exactly as ruled.

**2. Suites** (repo runners, this session, post-restore): `pnpm agentrs
c atomic` 464/464 (462 + 2 new resolve pins, green by name); `pnpm
agentrs v atomic` 286/286 (11 files, 239 stations — 285 + EXT-01);
`pnpm agentrs c canon` 54/54 (53 + structural guard, green by name);
`pnpm agentrs v canon` 15/15 (join station incl. extended CAN-JOIN-02).
EXT-01 isolation: 1 passed / 285 skipped. Zero failures anywhere —
nothing to attribute, nothing absorbed. Zero other golden moves:
no modified `output/` path in status (only the 3 new EXT-01 goldens),
attested per pair below. Quality: `agentrs q` on the 4 touched
atomic `.rs` files — 0 violations, 2 soft warnings (codes.rs 380 /
facts.rs 366 vs the 365 *soft* file-length limit — table growth by
design, same accepted category as wave-1/2; gate passes).

**3. Generated set vs live webref** (independent oracle,
`/tmp/chainrev-i-webref.mts`, tsx + `@webref/css` queried live):
821 webref props; generated table == independently recomputed
expectation EXACTLY (27 members, sorted — binary-search contract
holds). Per-row evidence over all 30 `EXTENSIONS` rows: every `css`
∉ webref (zero webref-present members, so no wrongful inclusion to
exclude); excluded with reason: `borderStart/EndRadius` (longhands),
`webkitTextFillColor` (platform-shadowed — `platformCss.properties`
hit confirmed). `textGradient` is IN the set by rule and keeps
working via the arm above (pinned both sides). VENDOR excluded:
223 `VENDOR_EXTENSIONS` ∩ set = ∅ (vendor aliases are Moz/canonical
pairs, disjoint namespace). Canon `src/` regen determinism:
`pnpm canon` + `cargo fmt -p canon` reproduces the whole tree
`src/` byte-identically (`diff -rq` clean; `unrealizable.rs` md5
`d104f94d…` matches the landing's claim twice). No hardcoded list in
atomic: exactly one call-site (`resolve/mod.rs:183`
`canon::is_unrealizable_extension`); the only name literals are
probes in `tests.rs` + station files, never a lookup table.

**4. Fail-without-fix / pass-with-fix:** (a) resolve refusal
disabled (`false &&`): cargo red pin FAILS (exemption-guard passes —
pass-pass BY DESIGN, it guards arms the fix must not move), EXT-01
FAILS 1 failed / 285 skipped (`expected [] to have a length of 10`),
finder repro exits 1 with the verbatim BREAK (3/3 RED, `space-x`
minted silently). Restored: all green. (b) JOIN-02 oracle
sensitivity (longhands exclusion dropped from the generator
predicate): exactly CAN-JOIN-02 × FAILS, other 14 pass — the live
oracle bites on drift. Restored byte-identical, 15/15.

**5. Diff review (line-by-line, (i) write-set):** `resolve/mod.rs` —
`expand_or_passthrough` takes the session (sole caller
`resolve_want_with:147`, so `css()`+JSX+conditions+recipes share the
funnel); refusal sits AFTER `lower_macro` (textGradient) and the
shorthand arm (radius pairs) — exemption order preserved, 8
minus-lines are the if/else→early-return restructure only;
`lower_macro` untouched. `codes.rs` — appended variant + CODE_TABLE
46→47 row + round-trip test (both-directions table, no drift).
`facts.rs` — one `NameDetail` arm; `policy/resolve.rs` — one
sentence `` `{prop}` has no CSS lowering; the declaration was
dropped `` + one render pin. Default-visible by construction AND
by observation: the detail is `Name(..)`, never
`Value(InvalidValue{false})`, so `resolve_audience` → Userspace
(`policy/mod.rs:73-80`, untouched); every golden line carries
file:line:col (want spans reach resolve). Warn-and-SKIP bound:
refusal returns `Vec::new()` — no atoms, no classes, no plans
(station pins all three absences + `hasWant` true, proving
extraction untouched and resolve the dropping layer). Canon
generator: `buildUnrealizableExtensions` is exactly the ruled
predicate (`EXTENSIONS` only, `css` ∉ webref kebab, no longhands,
not platform-shadowed, sorted); emitter + mod/lib wiring +
`generate.ts` write step additive; Rust guard is structural only
(sorted + self-consistent + 5 exemption negatives) — no
positive-name pins, per the ruling. `join.test.ts` — CAN-JOIN-02
`it` extended in place (import + baseDialect spread + independent
recomputation block), original abort assert untouched above it; no
new case ID, no count change. Untouched as ordered: join gate
(`join.ts` zero diff — NAME-only stands), `EXTENSIONS` table, all
`overlay/`, `diagnostics/policy/mod.rs`, `proof/render.rs`, neo,
lib, core, finder report. No existing test touched (both `.rs`
test diffs pure addition), none weakened; no per-prop expansions;
no blanket goldens. Goldens attested per pair: diagnostics.json 10
located warnings (App.tsx:3 + css.ts:4-12, code+message+position
each); css.json 7 real entries (textGradient trio + 2 corners +
color + translate); styles.css utilities layer exactly 7 real
rules, zero fictional declarations (keyframe `translateX()` hits
are `transform` *values*, and the spec's `deadDecl:` colon-anchored
asserts can't false-hit them).

**6. Contracts hold.** Canon SPEC §1 + `CAN-PROP-03`: no served `css`
form is fictional anymore — the 27 unrealizable extensions refuse
loudly on default naming the prop instead of minting dead rules,
and the generated set tracks live webref truth via the CAN-JOIN-02
oracle. Wave-2d's Law-2 deferral ("legit name + hallucinated css")
is discharged with its repro. SPEC rows: atomic EXT section +
breakdown row + counts + registry + proof-map row are exactly +1
my-delta (the TOKEN-17 count staleness is chain-(h)-verified
pre-existing, correctly untouched); canon JOIN-02 sentence is the
ruled one sentence. Runtime plan decision (no plan served — a
served key would be a ghost class) is written in SPEC + README and
pinned (`planProps not.toContain` per refused prop).

**Findings confirmed, not gaps:** (a) `srOnly` never reaches resolve
— firsthand probe shows causeless unlocated `ATM-W-MISSING-STYLE-
PLAN` (`is_breakpoint_range` claims `*Only` first,
`condition.rs:21-25`); pre-existing extraction gap, correctly kept
in the set and documented in SPEC + README + station (which probes
`hideFrom` in its place) — carried as doom fodder. (b) Zero-usage
census re-verified firsthand: lib hits are all `translateX/Y()`
`transform` values / keyframes / docs prose; neo authored sources
carry only the exempt `textGradient` parity input (census-union
rows are expectation labels, not compiled inputs); zero
key-position usages anywhere; zero station inputs outside EXT-01.
Captain: commit the 19 (i) paths + finder report + log sections
per the hunk-split plan with (h)'s SPEC row; keep the 4 peer doc
paths out. `dist/` is untracked build output, nothing to commit.

### Wave 4, find (k) — architecture ruling

Find: styletrace pipeline detector traces the bare-arg control
(`IdentCard`, `css(color)`) but misses both object-arg twins
(`ObjCard`, `css({ color })`; `MemberObjCard`,
`css({ color: props.color })`) — identical boundary
(`CardProps = StyleProps & { title?: string }`), identical sink
(`css()` into `className` on a lowercase host, so no JSX edge can
rescue the verdict). Finder report:
`.agents/doom/logs/2026-09-20-styletrace-pipeline-object-arg-miss.md`;
repro `/tmp/doom-wave4-styletrace-pipeline` (replayed by architect
read-only: `cargo test --offline` → 1 red, traced `["IdentCard"]`,
`ObjCard` + `MemberObjCard` missing — failure mode confirmed).
Root cause per report: `expression_reads_style_signal`
(`parser/pipeline/util.rs:81-119`) recognizes bare identifiers,
member reads, and transparent wrappers only — object/array
literals fall into the `_ => false` arm, so the `walk_call` arg
test (`parser/pipeline/expr.rs:42-48`) never fires on them.

1. **IN-BOUNDS.** Complete static TSX compile input on the pinned
   `css()` surface, named imports; touches nothing on the
   will-never-work list (no interpolation, no runtime-only values,
   no external config, no spread-staying-dynamic, no
   namespace/default value imports). Falls squarely under the
   skill's misdiagnosis clause: same boundary, same flow,
   different verdict — an inconsistent refusal, not a designed
   one. Corroborated inside the codebase: the detector walks INTO
   object literals for nested calls (`walk_object`,
   `expr.rs:84-95`) yet refuses to see a signal sitting directly
   in one. Severity, honestly user-facing and worse than the
   usual miss: the missed shape (object literal) is the DOMINANT
   `css()` authoring form while the traced shape (bare string
   into a style-object call) is the odd one — atomic gates JSX
   extraction on the traced host set (ATM-SITE-08), so
   `<ObjCard color="red" />` extracts nothing: silent missing
   paint on mainstream code.

2. **FIX DIRECTION (binding): extend pipeline detection to the
   object form — do NOT narrow the README.** Weighed:
   (a) README authority: the violated sentences are the module's
   key rule (:84-86, "whether style props exposed at that
   component boundary actually flow into the Reference
   primitive/style pipeline") plus :76 ("direct style-pipeline
   usage such as `splitCssProps`, `box`, and `css`"). Narrowing
   to "bare-identifier args only" would demote the central
   promise to a syntactic accident and bless silent missing paint
   on the mainstream form.
   (b) Precision/recall: recurse the shared signal predicate into
   object property values (+ spread args) and array elements (+
   spreads). Recall is restored while precision holds —
   recursion only follows values already recognized as signals
   (boundary-bound identifiers, member reads, transparent
   wrappers), still gated on the StyleProps boundary check and
   the pipeline sink check; `css({ color: "red" })` with no
   signal inside still traces nothing. Precision guard (inside
   the extension, not instead of it): object KEYS never count as
   signals (a key is the property being set, not flow from the
   boundary); no computed-key chasing; fortify stops at
   rebinding/shadowing rather than chasing it.
   (c) Placement inside the fix: extend the SHARED predicate
   (`expression_reads_style_signal`, `util.rs`) so `walk_call`
   (`expr.rs:42-48`), `call_has_style_signal_arg`, and
   `record_pipeline_binding` all gain the recursion consistently
   — a `walk_call`-only patch is forbidden (it would leave the
   className-binding/record paths disagreeing with the sink
   test, the same multi-path disagreement class as wave-1(a)).
   Whether object recursion also belongs in
   `expression_directly_derives_from_style_signal` is left to
   fortify + chain, with guidance: keep the two predicates'
   contract split intact — decide, write it down, pin it.
   (d) Blast radius is contained and additive: the arg test only
   gains true verdicts, sink checks are unchanged, so
   previously-traced hosts stay traced by construction;
   newly-traced hosts are the intended recall gain. Fortify runs
   the full styletrace suites (cargo + vitest) plus the
   downstream ripple check (atomic depends on styletrace: cargo
   atomic + vitest atomic, per the wave-2(e) precedent) and
   attests any golden movement per pair — traced-to-silent flips
   are regressions, silent-to-traced flips on object-arg shapes
   are intended. SCOPE: object-literal args (shorthand +
   member-value — the finder's two red twins) and array-literal
   args if they share the one-line recursion (same
   `_ => false` root cause); deeper indirection is out of this
   fortify — future doom fodder. Explicitly OUT: the two unspent
   research-note observations (zero-arg `splitCssProps()` in an
   array pattern panicking the tracer at `util.rs:76`; pipeline
   use inside a nested `function` declaration missed while the
   arrow twin traces) — seen in research, no red test written,
   per Law 2 not breaks; carry as doom fodder, not fortify
   scope.

3. **TEST PLACEMENT: Rust unit primary, existing case secondary —
   no new case, no new station.** Primary pin at the Rust
   semantic level per the module's design rules ("prefer Rust
   tests for semantic coverage"):
   `modules/styletrace/src/tests/tracing.rs` — add a
   pipeline-object-arg test mirroring the finder's twins
   (`IdentCard` control + `ObjCard` + `MemberObjCard`) via
   `workspace_scratch_dir`, lower than the finder's /tmp cargo
   probe, no native binding needed. Secondary: extend the
   EXISTING `tests/cases/direct_style_pipeline/` (the family
   that owns pipeline shapes) input with an object-arg `css()`
   component + trace assertion — the station's `Panel` shape
   stays, the expected list grows additively. No README
   amendment, no lib touch.

### Wave 4, find (k) — fortify landing

**Status: LANDED.** Ruling followed exactly: extended the SHARED
predicate (`expression_reads_style_signal`, `util.rs`) to the object
form; no README amendment, no `walk_call`-only patch, no new
case/station, no lib touch, finder report untouched.

**Fix (shared predicate, `parser/pipeline/util.rs`).**
`expression_reads_style_signal` gains two arms — `ObjectExpression`
(recurse property VALUES + spread args) and `ArrayExpression`
(recurse elements + spreads) — via two small helpers
(`object_reads_style_signal`, `array_reads_style_signal`) so the
function stays near its baseline complexity. Precision guards as
ruled: object KEYS never count (a key is the property being set),
no computed-key chasing, functions in values hit `_ => false` so
rebinding/shadowing stops the walk. Because the extension lives in
the shared predicate, `walk_call` (`expr.rs:42-48`),
`call_has_style_signal_arg`, and `record_pipeline_binding` gain it
consistently by construction — verified by caller audit (those three
are the only consumers; `derives` delegates to `reads` only for its
listed alias variants).

**Predicate-split decision (written down + pinned): object recursion
does NOT belong in `expression_directly_derives_from_style_signal`.**
Contract split kept intact: `reads` = signal flow through an
expression into a sink (use-site flow, now structural);
`derives` = direct aliasing that mints a new style signal
(`const x = <init>`). An object literal is a container, not an
alias — extending `derives` would bless `const obj = { color };
css(obj)`, which is the deeper indirection the ruling puts OUT of
scope. `derives` is untouched (object/array arms stay in its
`_ => false`); the decision is documented in a code comment above
`derives` and pinned by the `IndirectCard` negative control below.

**Pins.** (1) PRIMARY `src/tests/tracing.rs::
traces_pipeline_object_and_array_literal_args` via
`workspace_scratch_dir`, mirroring the finder's twins:
`IdentCard` control + `ObjCard` + `MemberObjCard`, plus `ArrCard`
(`css([color])`, array arm) and `IndirectCard`
(`const obj = { color }; css(obj)`) asserting ABSENT — expected
`["ArrCard","IdentCard","MemberObjCard","ObjCard"]`, exact equality
so the silence is pinned too. (2) SECONDARY: existing
`tests/cases/direct_style_pipeline/` extended — `ObjPanel`
(`css({ color })` on a `StyleProps` boundary) added to input,
`Panel` shape untouched, spec `['Panel']` → `['ObjPanel','Panel']`,
golden `components.json` additively `["Panel"]` →
`["ObjPanel","Panel"]` (scoped `-t` regen, hand-compacted to the
sibling golden dialect; suite re-greened after).

**Evidence.** Finder repro `/tmp/doom-wave4-styletrace-pipeline`
replayed read-only: red → green (`cargo test --offline`, 1 passed).
Suites via `pnpm agentrs`: cargo styletrace 35/35 (incl. new pin,
also green in isolation `-t`), vitest styletrace all pass (28
tests, 2 files); drift census pre-regen showed exactly the one
intended golden move (spec passed on the fresh binding, golden
compare failed — no other case drifted). Ripple: cargo atomic
464/464, vitest atomic all green — zero downstream golden
movement, zero traced-to-silent flips. Quality: `agentrs q` on
touched files 0 violations, 6 warnings — identical warning count
to the HEAD baseline (same functions; the two new arms add +2
cyclomatic to an already-warned matcher, held down via helpers).
Stale-binary note for chain: the first vitest run missed `ObjPanel`
because `dist/native/darwin-x64` (07:38) predated the fix (07:50);
`pnpm agentrs v` does not rebuild — `pnpm agentrs build` first,
then green. OUT as ruled: zero-arg `splitCssProps` panic and
nested-`function` pipeline miss (doom fodder, no red test).

**Files (mine only).**
`modules/styletrace/src/analysis/parser/pipeline/util.rs` (shared
predicate + 2 helpers + derives comment),
`modules/styletrace/src/tests/tracing.rs` (primary pin),
`tests/cases/direct_style_pipeline/` input + spec + golden
(secondary pin). Untouched as ordered: README, lib, finder report,
sibling files (`docs/*`, other doom logs).

### Wave 4, find (k) — chain review

**Verdict: VERIFIED (commit-ready).** Whole arc re-verified firsthand by
this oracle; no implementation, no fixes, no commits. (k) files only —
sibling (j) tasty files, mission-docs peers (`docs/ATOMIC.md`,
`docs/missions/README.md` jettison/reaper rows), and other doom logs
never touched or adjudicated (write-set audited via `git status` paths:
exactly the 5 styletrace paths from the landing — `util.rs`,
`tracing.rs`, `direct_style_pipeline` input + spec + golden).

**1. Finder repro** (`/tmp/doom-wave4-styletrace-pipeline`, unmodified,
`cargo test --offline`): GREEN post-fix, 1 passed. Assertion read
firsthand — non-vacuous exact equality
`["IdentCard","MemberObjCard","ObjCard"]`, so both red twins now trace
alongside the control.

**2. Suites** (repo runners, this session): `pnpm agentrs c styletrace`
35/35 green; new pin green in isolation (1 passed / 34 filtered);
`pnpm agentrs v styletrace` 28/28 (2 files; `direct_style_pipeline`
1 passed / 27 skipped in isolation) on the fresh 07:55 darwin-x64
binding, which postdates the fix — no stale-binary shadow. Ripple:
`pnpm agentrs c atomic` 464/464, `pnpm agentrs v atomic` 286/286.
Golden movement attested per pair: exactly ONE golden moved in the
tree — `direct_style_pipeline/output/components.json`
`["Panel"]` → `["ObjPanel","Panel"]`, a silent-to-traced flip on the
object-arg shape = intended. Zero traced-to-silent flips: the case
runner diffs committed `components.json` for every case
(`cases.test.ts` + `helpers.ts`), all 17 green, and `git status`
shows no other golden touched. Quality: `agentrs q` on both touched
`.rs` files — 0 violations, 6 warnings, and the HEAD-baseline worktree
run shows the identical 6 warnings / 0 violations, so the count is
unchanged (same flagged matchers; helpers held the added arms down).

**3. Fail-without-fix / pass-with-fix, firsthand.** HEAD worktree
(5075ca94f) + new `tracing.rs` only (fix absent): pin FAILS with
`left: ["IdentCard"]`, `right: ["ArrCard","IdentCard","MemberObjCard",
"ObjCard"]` — the exact finder failure mode, plus ArrCard proving the
array arm is also recall gain. Repro copy re-pointed at the worktree
(`/tmp/chaink-repro`, worktree since removed per precedent):
red, `left: ["IdentCard"]`. In-tree (fix): repro green, pin green,
case green. Secondary-pin equivalence stated: ObjPanel's input shape
(`css({ color })` on a StyleProps boundary) is identical to the
ObjCard twin proven red-old/green-new above through the same shared
predicate, and the case asserts exact `['ObjPanel','Panel']` plus the
golden diff — a stale-binding re-probe would re-prove the same arm.
Worktree removed after the run; `/tmp` probes kept.

**4. Diff review (line-by-line, (k) write-set).** `util.rs`: two new
arms on the SHARED `expression_reads_style_signal` — Object recurses
property VALUES + spread args, Array recurses elements + spreads, via
two helpers. Caller audit by grep: the only consumers are `walk_call`
(`expr.rs:42-48`), `call_has_style_signal_arg`, and
`record_pipeline_binding` (2 sites) — all gain the recursion
consistently; no `walk_call`-only patch. Precision guards verified in
code AND by probe (`/tmp/chaink-guards`, green firsthand):
`css({color:"red"})` silent (LitCard absent); computed keys never
chased (`css({[color]:"red"})` silent); functions in values hit
`_ => false` so rebinding stops the walk (`() => color` silent);
spread-signal (`css({...{color}})`) and nested-object
(`css({outer:{color}})`) trace. `derives` decision (object recursion
does NOT belong — container, not alias; `css(obj)` stays untraced):
SOUND as chain — extending it would bless the deeper indirection the
ruling puts OUT of scope; it is written in the code comment above
`derives` and pinned by the IndirectCard negative control inside an
exact-equality assert (absent on old code too, as required).
`tracing.rs`: purely additive (+21, one `#[test]`, existing helpers
only) — no test touched, none weakened. `direct_style_pipeline`:
input gains only the import + ObjPanel (Panel untouched), spec
strengthened `['Panel']` → `['ObjPanel','Panel']`, golden additive.
Untouched as ordered: styletrace README (key-rule sentences verified
in place, :76 + :84-86), `util.rs:76` `.expect` (OUT-scope panic
still present), nested-`function` walker (`expr.rs` zero diff), lib,
core, finder report, sibling files. No blanket goldens.

**5. Contract holds.** The violated README key rule — "whether style
props exposed at that component boundary actually flow into the
Reference primitive/style pipeline" (:84-86) over "direct
style-pipeline usage such as `splitCssProps`, `box`, and `css`" (:76)
— now holds for the dominant `css()` authoring form: all three
boundary-identical probes trace. Captain: commit the (k) write-set
(2 `.rs` + input + spec + golden + finder report + log sections);
`dist/` untracked, nothing to commit there.

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

### Wave 4, find (j) — architecture ruling

Find: same-file `interface Widget { alpha }` + `interface Widget { beta }`
(legal TS declaration merging) emits one Widget chunk with members
`["beta"]` only — `alpha` silently dropped, `warnings []`,
`diagnostics []`. Finder report:
`.agents/doom/logs/2026-09-20-wave4-tasty-merge-member-loss.md`;
repro `/tmp/doom-tasty-merge-repro.mjs` (replayed by architect
read-only: `members=["beta"]`, both channels empty, exit 1 — failure
mode confirmed). Mechanism confirmed firsthand: `symbol_id` =
`sym:{file_id}#{name}` with no span
(`scanner/paths/mod.rs:16-18`), so both shells share one id; then
`resolve_ast` folds them through `symbols.extend(id -> symbol)`
(`ast/resolve/index.rs:36-40`) and `build_symbol_index`'s
`.collect()` — last-wins at every fold, no diagnostic. Note: the id
itself is CORRECT for merged declarations (the two blocks ARE one
type) — the bug is the fold, not the id. That fact decides the fix.

1. **IN-BOUNDS.** Complete static TS in compile inputs; declaration
   merging is legal idiomatic TS (tsc accepts; the stdlib and real
   libraries use split interfaces and augmentation). Touches nothing
   on the will-never-work list (no interpolation, no runtime-only
   values, no external config, no spread, no namespace value
   imports). Falls under the skill's misdiagnosis clause in its
   stronger form: not just silence-where-signal-is-owed, but
   wrong-data-served-as-whole — a half-interface presented as the
   complete type, violating the cited fidelity contract (emitted
   manifest/chunk must faithfully represent authored declarations).
   Internal inconsistency proves non-designed: the cross-file
   same-name path preserves all entries + warns duplicate
   (`generator/bundle/modules/manifest.rs`,
   `duplicate_symbol_name_warnings`) + throws ambiguous at bare-name
   lookup (`js/internal/symbol-resolver.ts`,
   `createAmbiguousSymbolNameError`). The system knows collisions
   need loud handling; the same-file collision escapes it.
   User-facing: reference docs and every member consumer (display,
   flatten, projection) inherit the loss.

2. **FIX DIRECTION (binding): MERGE at the resolve layer — do NOT
   split ids, do NOT refuse the legal shape.** Three rules, one
   layer:
   - **M1 (honor):** same-file same-name shells that are ALL
     `TsSymbolKind::Interface` fold into ONE `TsSymbol` with unioned
     members in declaration order. The kind model has only
     Interface/TypeAlias, so the merge predicate is exact — no tsc
     reimplementation, no scope creep into namespaces/classes.
   - **M2 (member collision):** same member name in two merged blocks
     (tsc demands identical types; the emitter doesn't typecheck) —
     keep FIRST + emit a diagnostic naming file/symbol/member.
     First-wins matches the `or_insert` binding precedent; the
     diagnostic is owed because the merge is then faithful to
     neither declaration. This prevents reproducing the bug one
     level down as silent member last-wins.
   - **M3 (non-mergeable collision):** alias+alias or mixed kinds —
     shapes tsc itself rejects (duplicate identifier). Do NOT merge:
     keep the current survivor (last — zero change to served
     content) + emit a diagnostic naming file/symbol/kinds.
     Determinism + loudness is all that's owed for a tsc-error
     shape.
   Placement: pre-resolution fold over `parsed.exports` in the
   resolve layer (merge shells BEFORE `resolve_symbol_references`,
   so member TypeRefs resolve once against the indices). The
   diagnostic channel already exists end-to-end
   (`ParsedTypeScriptAst.diagnostics` → graph → bundle →
   manifest warnings + `out.diagnostics` — the exact two channels
   the repro asserts). Emit, manifest, and lookup layers stay
   untouched: one id → one chunk already, so downstream consumers
   inherit the correct whole automatically. Blast radius: resolve
   layer + tests.
   Rejected: (a) per-declaration chunks (span-suffixed ids) —
   semantically wrong (manufactures ambiguity tsc doesn't see;
   would make bare-name lookup throw for legal code) + maximal
   blast radius (id-scheme change re-pins every golden, breaks
   id-keyed consumers). (b) refuse-with-diagnostic as primary —
   refusal is for impossible-by-grammar shapes (W1a five-tuple);
   merging is a bounded fold with no structural blocker, and
   refusing idiomatic TS that real libraries use would be a
   capability gap leaving the fidelity contract still violated,
   just loudly. REQUIRED SWEEP: fortify censuses tasty fixtures +
   station inputs for same-file same-name shells; no existing
   golden moves except intended (diagnostic-carrying cases attested
   per pair). A sweep surprise is a re-consult, never a silent
   carve-out.

3. **TEST PLACEMENT: Rust unit primary, NEW emit station
   secondary.** Primary pin in `src/tests/resolve.rs` (lower than
   the finder's N-API probe; in-memory workspace via `extract_ast`,
   no binding needed): (a) merge → one symbol, members
   `[alpha, beta]`, diagnostics empty; (b) member collision →
   diagnostic + first-wins; (c) alias/mixed collision → diagnostic
   + deterministic survivor. Secondary: NEW station TST-INT-04
   (INT is the interface family, INT-01..03 taken; DUP-01's
   preserve-all + ambiguous + warn contract is the semantic
   opposite of merge-fold-to-one-silent, so no extension) — Widget
   input per the repro, spec asserts one manifest entry, chunk
   carries both members, warnings `[]` + diagnostics `[]` (a clean
   merge of legal TS is silent). No `js/` lookup changes. SPEC:
   document M1–M3 in the tasty SPEC interface section.

### Wave 4, find (j) — fortify landing

**Status: LANDED.** Ruling followed exactly: MERGE at the resolve
layer per M1–M3; no id split, no refusal of the legal shape, emit /
manifest / lookup untouched.

**Fix (pre-resolution fold, new `resolve/merge.rs` + 5-line
`index.rs` hook).** `resolve_ast` now folds each file's
`parsed.exports` before any index is built or
`resolve_symbol_references` runs, preserving first-occurrence order;
groups of one pass through untouched. M1: all-Interface shells fold
into ONE shell — members unioned in declaration order,
`extends`/`references` concatenated, docs first-Some, type params
first's, `exported` OR-ed, silent. M2: same nominal (property/method)
member in two blocks keeps FIRST + diagnostic naming
symbol/member (`interface "Widget" declares member "alpha" more than
once; keeping the first`). Call/construct/index signatures
(`[call]`/`[new]`/`[index]`) are tsc overloads, not collisions —
they union additively with no diagnostic (else two call signatures
would false-collide). M3: alias+alias or mixed kinds keep the LAST
shell byte-identical (zero change to served content) + diagnostic
naming symbol/kinds (`duplicate declaration of "Dup" (TypeAlias +
TypeAlias); keeping the last`). File rides `diagnostic.file_id` per
the existing channel convention, so manifest warnings render
`file: message`. Diagnostics flow through the untouched end-to-end
channel (`ParsedTypeScriptAst.diagnostics` → graph → bundle →
manifest warnings + `out.diagnostics`).

**REQUIRED SWEEP (first, clean, no re-consult).** 87 station input
files censused (`/tmp/doom-wave4j-sweep.mjs`): 1 regex hit, RXP-02
`AmbientModule`, attested FALSE POSITIVE (nested inside `declare
module`, never a top-level shell — extract walks `program.body`
only). Rust inline fixtures (extract/resolve/error_paths/type_ref)
hold no same-file same-name declarations; scanner-test
`ButtonProps` repeats are separate single-declaration workspaces
that never reach resolve; js unit tests don't drive the Rust
pipeline. Zero existing golden moves (suite-green proves it).

**Pins.** PRIMARY `src/tests/resolve.rs`, in-memory workspace via
`extract_ast`, no binding: (a)
`merges_same_file_interface_declarations` — one symbol, members
`[alpha, beta]`, diagnostics empty; (b)
`merged_interface_member_collision_keeps_first_with_diagnostic` —
first-wins (`alpha: string`, not `number`) + 1 diagnostic naming
Widget/alpha; (c)
`non_mergeable_same_file_collision_keeps_last_with_diagnostic` —
alias+alias survivor `number` + mixed survivor kind TypeAlias + 2
diagnostics naming Dup/Mix with `TypeAlias + TypeAlias` /
`Interface + TypeAlias`. SECONDARY new station
`TST-INT-04-interface-merging` (Widget input per repro): one
manifest entry, chunk members `[alpha, beta]`, warnings `[]` +
diagnostics `[]`. Repro `/tmp/doom-tasty-merge-repro.mjs` flips
red→green (exit 0, MERGE COMPLETE); M2/M3 channel proved end to end
by `/tmp/doom-wave4j-fortify-verify.mjs` (exit 0: both warnings +
both `out.diagnostics`). Finder report untouched.

**SPEC note (flag, not drift).** No central tasty SPEC.md exists
(TST anchors live in case READMEs) — M1–M3 are documented in the
TST-INT-04 README (interface-family spec section, incl. the DUP-01
semantic-opposite note) + the resolve README (responsibilities +
shape). Nothing else to amend.

**Suites (all `pnpm agentrs`, fresh binding, this session).**
cargo tasty 65/65 (62 + 3 new pins); vitest tasty 82/82 across 5
files (42 unit + 40 stations incl. new INT-04); `agentrs q` on
touched files: merge.rs fully clean after refactor (a
cognitive-19 warning was refactored into the `InterfaceMerge`
accumulator before landing), index.rs shows only 2 pre-existing
5-arg warnings on functions this change didn't touch. INT-04
goldens generated scoped (`-t TST-INT-04 --update-goldens`) and
attested (one Widget entry, warnings `[]`, one chunk). Never ran
`agentrs f`.

**Must-NOTs honored:** no id split, no refusal, no weakened tests
(all pins additive; zero existing tests or goldens touched), no
blanket goldens, no lib/js-lookup touch, finder report untouched,
sibling (k) styletrace + docs paths untouched.

**Files (mine only, 6 + this section).**
`ast/resolve/merge.rs` (new fold), `ast/resolve/index.rs` (hook),
`ast/resolve/mod.rs` (wiring), `ast/resolve/README.md` (M1–M3),
`src/tests/resolve.rs` (3 pins), `tests/cases/
TST-INT-04-interface-merging/` (input + spec + README + 2 goldens).

### Wave 4, find (l) — architecture ruling

Find: `css({ '--x': { base: '1', md: '2' } })` mints a whole-object
`--x` plan nothing can query, while the runtime genuinely misses
both nested queries, with zero default signal. Three layers read
one shape three ways: extraction (`canon::is_known_style_prop`,
any `--*`) mints a whole-object plan with real per-breakpoint
declarations (`--x@base`, `--x@md` — classes exist in the sheet);
analysis (`walk_nested_object` → `is_style_value_position`,
`conditions.rs:51-52`) recurses `--x` as a condition and predicts
nested exacts `base`/`md` under `['--x']` (visible as
`ATM-I-EXPECTED-LOOKUP` on the channel); runtime (`collectEntries`,
`css.ts:157`) mirrors analysis and misses both queries
(`class=""` + 2 dev warnings with unactionable "Add a static call
site" advice). Proof F2 (`render_causeless`, `render.rs:118-132`)
skips the nested exacts (`!is_known_style_prop` on `base`/`md`)
on the premise extract warned at the gate — false here, extraction
warned nowhere. Finder report:
`.agents/doom/logs/2026-09-20-wave4-custom-prop-object-unqueryable-plan.md`;
repro `/tmp/doom-wave4-custom-prop-object/run.mts` (replayed by
architect read-only: 2 channel exacts, ghost `--x` plan, both
controls paint — scalar `@reference-ui/lib__--x_1`, array
`--x_1 + sm:--x_2` — object `""` + 2 runtime misses, 0 default
lines — failure mode confirmed).

1. **IN-BOUNDS.** Complete static literal in a TS compile input on
   the pinned `css()` surface, named import; touches nothing on
   the will-never-work list (no interpolation, no runtime-only
   values, no external config, no spread-staying-dynamic, no
   namespace/default value imports). Falls squarely under the
   skill's misdiagnosis clause: silence where a diagnostic is
   owed, plus an affirmative ghost plan for the shape. The
   controls prove the family supported: scalar AND responsively
   expanded array custom props paint — the object form is the
   explicit-key spelling of the same responsive semantic, not a
   will-never-work shape. Not wave-1 ground (no gate warning at
   any level, not a partition-hidden one) and not the carried
   fodder (those warn channel-only; this warns nowhere).

2. **FIX DIRECTION (binding): expand the query side to the
   custom-prop object form — treat `--*` as style-value positions
   in BOTH mirrored predicates, so runtime queries match the
   plans extraction already mints.** Extraction is already right
   (whole-object plan + per-breakpoint declarations = exactly the
   responsive-prop plan shape); the defect is the query side
   recursing `--x` as a condition. Concretely: `collectEntries`
   (`css.ts:157`) and `is_style_value_position`
   (`conditions.rs:51-52`) each gain the `--` prefix rule for the
   object-value arm, mirroring canon's own open-ended `--*`
   authority (`canon/src/lib.rs:27-30`). Both predicates stay
   mirrored — a one-side patch is forbidden (same multi-path
   disagreement class as wave-1(a): runtime-only would paint but
   leave analysis predicting phantom nested exacts → false
   causeless warnings; analysis-only would silence the channel
   but leave the runtime miss). Post-fix the object form paints
   through the standard responsive path like every other
   responsive prop, and DIAG-09 is satisfied vacuously: no absent
   exacts, no warning owed (warning on working code would be a
   false positive). Extraction untouched, proof untouched — F2's
   premise is never engaged once the readers agree.
   Weighed and rejected: (a) refuse/warn at extraction — rejects
   a shape whose array sibling paints and whose static semantics
   are unambiguous; manufactures a capability gap and deletes
   behavior extraction already gets right. Refusal is for
   impossible-by-grammar shapes, not for a supported family with
   one spelling behind. (b) narrow F2's premise (warn
   unknown-prop/condition keys lacking a gate warning) — treats
   the symptom, leaves the ghost plan unservable and the style
   unpainted, and widens the warning net against O2/O20's
   deliberate jurisdiction split with double-warn risk across
   every unknown-prop/condition case. Whether F2 deserves a
   defense-in-depth guard is future doom fodder, not this
   fortify. Blast radius: two predicate arms + tests. Fortify
   confirms `lowerResponsiveStyles` passes `--*` objects through
   to `collectEntries` unmangled, confirms `split.ts` needs no
   change (key-level split, values opaque — out of scope on that
   showing), and runs the REQUIRED SWEEP: census atomic stations
   + neo cases for `--*` inputs (known: ATM-ATOM-05 scalar,
   ATM-TOKEN-01/07/13, ATM-UNIT-01/03, ATM-LAYER-03) — scalar and
   array custom-prop behavior must not move; any golden movement
   attested per pair, and a sweep surprise is a re-consult, never
   a silent carve-out. Full suites: neo runtime vitest + atomic
   cargo/vitest + downstream ripple per wave-2(e) precedent.

3. **TEST PLACEMENT: two unit pins (primary, one per predicate) +
   one NEW ATOM station (secondary) — no proof unit, no neo
   case.** (a) Neo runtime unit in
   `src/runtime/css/css.test.ts`: register an artifact carrying
   the compiled whole-object `--x` plan (per-breakpoint
   declarations as compiled) and assert `css({ '--x': { base:
   '1', md: '2' } })` resolves to the compiled classes with zero
   misses — red pre-fix (recurses → miss), green post-fix. (b)
   Atomic analysis unit in `diagnostics/analysis` (`object.rs`
   tests via `walk_first_object`): the object custom-prop input
   predicts ONE whole-object exact under `[]` and ZERO nested
   exacts under `['--x']` — red pre-fix (2 nested exacts), green
   post-fix. (c) NEW station ATM-ATOM-06 (ATOM-01..05 taken;
   ATOM family, not DIAG — post-fix nothing warns, so this pins
   a compile shape, not a warning): fixture with scalar + array
   + object custom props; spec asserts the whole-object `--x`
   plan with per-breakpoint declarations, the channel carrying
   the whole-object EXPECTED-LOOKUP (not nested `base`/`md`
   exacts), and default diagnostics empty (it paints → silent).
   No proof unit: proof is untouched by this ruling — a proof
   test would pin unchanged behavior. No neo Playwright case:
   disproportionate for query resolution the runtime unit pins
   directly; chain review replays the finder repro end-to-end
   (compile + runtime) as the e2e proof.

### Wave 4, find (j) — chain review

**Verdict: VERIFIED (commit-ready).** Whole arc re-verified firsthand by
this oracle; no implementation, no fixes, no commits. (j) files only —
sibling (l) fortify paths (`reference-neo/.../css.ts`, `css.test.ts`,
`conditions.rs`, `object.rs`) plus `docs/ATOMIC.md`,
`docs/missions/README.md`, jettison/reaper, and the captain's
cycle-board tick appeared in-tree during this review and were never
touched or adjudicated (write-set audited via `git status` paths at
start and end: the (j) set is exactly the landing's 6 + finder report
+ this section; zero golden modifications anywhere in the tree).

**1. Finder repro** (`/tmp/doom-tasty-merge-repro.mjs`, unmodified,
fresh 07:56 `dist/native/darwin-x64` binding): exit 0, MERGE COMPLETE
— one Widget entry, chunk members `["alpha","beta"]` in declaration
order, `warnings []`, `diagnostics []`. The clean merge of legal TS is
silent, exactly as ruled; the repro's third WARNED check correctly
reports FAIL because no refusal is owed. Pre-fix red is attested twice
independently (finder exit 1, architect read-only replay
`members=["beta"]`, both channels empty).

**2. Suites** (repo runners, this session): `pnpm agentrs c tasty`
65/65 green (62 + 3 new pins); `pnpm agentrs v tasty` 82/82 green (5
files: 42 unit + 40 stations incl. new INT-04); `pnpm agentrs v tasty
-t "TST-INT-04"` 1 passed / 81 skipped. M2/M3 end-to-end via
`/tmp/doom-wave4j-fortify-verify.mjs` (exit 0 firsthand): manifest
warnings carry `input/index.ts: interface "Widget" declares member
"alpha" more than once; keeping the first` and `input/index.ts:
duplicate declaration of "Dup" (TypeAlias + TypeAlias); keeping the
last`, and `out.diagnostics` carries both with `file_id` set — file
rides the existing channel convention, symbol/member/kinds named in
the message per M2/M3. Quality: `agentrs q` on the 4 touched `.rs`
files — 0 violations; 2 warnings are pre-existing 5-arg advisories on
`resolve_file`/`collect_file_exports`, whose signatures this change
never touched; `merge.rs` fully clean (header 4 sentences, no allows).

**3. Fail-without-fix / pass-with-fix:** HEAD worktree (old resolve
code, new `resolve.rs` pins copied in — shared tree untouched): all 3
pins FAIL, 62 filtered — M1 shows the exact original break
(`left: ["beta"]` vs `["alpha","beta"]`), M2/M3 fail on the owed
diagnostic (silence on old code). In-tree: 65/65. Worktree removed
after the run. Sweep re-run (`/tmp/doom-wave4j-sweep.mjs`): 88 input
files, 2 hits — INT-04 itself (intended) and RXP-02 `AmbientModule`,
attested FALSE POSITIVE firsthand (the interface sits nested inside
`declare module 'ambient-module' {`, lines 24–28; only the line-31
type alias is a top-level shell, so the fold passes it through
untouched — and RXP-02's station is green with byte-stable goldens).
Zero existing golden moves, no sweep surprise, no re-consult owed.

**4. Diff review (line-by-line, (j) write-set):** `merge.rs` (new,
174 lines) — `fold_same_file_merges` drains `parsed.exports` per file
into name groups, preserving first-occurrence order via the `order`
vec (BTreeMap iteration never leaks into output); groups of one
return the shell untouched (zero behavior change by construction).
M1: all-Interface groups fold via the `InterfaceMerge` accumulator —
members union in declaration order, nominal (property/method)
collisions first-wins + diagnostic (M2), call/construct/index
signatures union additively (tsc overloads, confirmed not
false-colliding), `extends`/`references` concatenated, docs
first-Some, type params first's, `exported` OR-ed, silent. M3:
alias/mixed groups return `group.into_iter().last()` byte-identical
(zero change to served content) + diagnostic naming symbol/kinds;
kinds joined for N-arity, deterministic in declaration order.
`index.rs` — 5-line hook: fold runs over every file BEFORE
`build_symbol_index`, `build_export_index`, and
`resolve_symbol_references` (via `resolve_file`), so member TypeRefs
resolve once against folded indices, exactly per ruling; export
resolution is unaffected (folded shells keep the shared id).
`mod.rs` — one `mod merge;` wiring line. `resolve.rs` pins — purely
additive (one import line + 3 appended tests, zero existing bodies
touched): M1 asserts one symbol + `[alpha, beta]` + empty
diagnostics; M2 asserts first-wins (`alpha: string`, not `number`) +
1 diagnostic naming Widget/alpha with `file_id`; M3 asserts
alias+alias survivor `number` + mixed survivor kind TypeAlias + 2
diagnostics naming Dup/Mix with `TypeAlias + TypeAlias` /
`Interface + TypeAlias`. Resolve README + INT-04 README document
M1–M3 incl. the DUP-01 semantic-opposite note (no central tasty
SPEC.md exists — TST anchors live in case READMEs, confirmed; the
flag is accurate, not drift). INT-04 goldens attested as data: one
Widget entry (`symbolsByName.Widget = ["_e03d..."]`), `warnings []`,
one chunk module. Untouched as ordered: id scheme
(`scanner/paths/mod.rs` unmodified, no span suffix, no
per-declaration chunks), emit/manifest/lookup layers, all of `js/`,
lib, core, neo, finder report. No test weakened, no blanket goldens
(only 2 new INT-04 outputs).

**5. Contract holds.** The finder's violated emitted-fidelity contract
is now satisfied in merged form: legal same-file declaration merging
emits the whole interface (unioned members, one id, one chunk —
downstream display/flatten/projection inherit the correct whole
automatically), member collisions stay loud with first-wins, and
tsc-error shapes stay loud with a deterministic survivor. Captain:
commit the (j) write-set (4 modified `.rs`/README + new `merge.rs` +
new INT-04 dir + finder report + this log section); `dist/` is
untracked build output, nothing to commit there.

### Wave 4, find (l) — fortify landing

Ruling followed exactly: expand the query side, both mirrored
predicates, extraction + proof untouched.

**1. Fix (2 predicate arms + terse comments, no other prod lines).**
`packages/reference-neo/src/runtime/css/css.ts:159`
(`collectEntries`): the object-value arm now routes `prop !== 'r'
&& (styleProps.has(prop) || prop.startsWith('--'))` to one
responsive query. `diagnostics/analysis/conditions.rs:53`
(`is_style_value_position`): same `--` prefix rule, mirroring
canon's open-ended `--*` authority (`canon/src/lib.rs:27-30`).
`--x` is deliberately NOT added to any style-prop set on either
side — the prefix rule alone carries it, which is the point of an
open-ended family. No one-side patch: both changed in the same
landing, verified mirrored by the pins below.

**2. Confirmations (no-change showings).** `lowerResponsiveStyles`
(`lowerResponsiveStyles.ts:28-56`): only the key `r` is rewritten;
every other key passes through verbatim (values recursed,
keys preserved) — `--*` objects reach `collectEntries` unmangled.
`split.ts` (`primitives/runtime/split.ts:60-63`): key-level split,
values opaque (`resolved[key] = value` verbatim) — the find is the
`css()` query predicate, not the primitive splitter; out of scope
on that showing, untouched. Extraction untouched (whole-object
plan was already right), proof untouched (F2's premise never
engaged once the readers agree), lib untouched, finder report
untouched, F2 not narrowed, no test weakened.

**3. REQUIRED SWEEP (before the fix; no surprise, no re-consult).**
Census of authored `--*` in style positions: atomic inputs hold
exactly 3, all scalar — ATM-ATOM-05 (`'--brand-x': 'red.500'`),
ATM-NAME-06 (`'--brand-x': 'red'`), ATM-UNIT-01 (`'--foo': 42`);
zero `--*` object values in any atomic input (`'--*': {` grep
empty). ATM-TOKEN-01/07/13, ATM-UNIT-03, ATM-LAYER-03 mentions are
theme-token CSS vars in baseSystems/sheet assertions, not authored
style objects. Neo worlds: all authored `--*` scalar (globalCss
`:root` vars, NEO-CSS-04 `'--foo': 42`, NEO-LAYER-01
`'--colors-brand'` scalar). Rust units: no assertions on `--*`
query shapes. Scalar/array arms untouched by construction (leaf
and `isObject`-false paths identical), so scalar/array behavior
cannot move — confirmed by suites: full atomic vitest 287/287
green with zero golden movement (no `--update-goldens`), neo
units 225/225 green, ripple case NEO-CSS-04 PASS.

**4. PRIMARY pins (both red-then-green, firsthand).** (a) Neo
runtime unit (`css.test.ts`): artifact gains the compiled
whole-object `--x` plan (`value {base:'1',md:'2'}`, declarations
`--x@base`/`--x@md`, `--x` absent from `stylePropNames`);
`css({'--x':{base:'1',md:'2'}})` resolves to `test__--x_1
test__md:--x_2` with zero warnings. Red pre-fix (recurse → miss,
1 failed / 23 skipped), green post-fix (24/24). (b) Atomic
analysis unit (`object.rs` tests via `walk_first_object`):
`css({ '--x': { base: '1', md: '2' } })` predicts ONE exact
`["test",[],"--x",{"base":"1","md":"2"},false]` and ZERO dynamics
(`--x` absent from the style set). Red pre-fix (FAILED on the
exact-keys assertion), green post-fix (7/7 object tests). Plus 2
lines in the `conditions.rs` unit pinning `--x` as a style
position incl. under an empty set.

**5. SECONDARY station ATM-ATOM-06 (ATOM family, new dir).**
Fixture mirrors the finder repro (scalar + array + object `--x`).
Spec asserts: sibling wants minted; exactly ONE whole-object plan
with slots `['--x@base','--x@md']`; no plans under a `--x` when;
sheet carries `--x: 1;`/`--x: 2;` (ghost `md:--x_2` class now
served); default diagnostics `[]`; channel carries the
whole-object `EXPECTED-LOOKUP` and ZERO nested exacts under
`["--x"]`. Goldens generated scoped (`-t ATM-ATOM-06
--update-goldens`, `git status` confirms only the new dir):
`styles.css` utilities layer shows `--x_1` + `sm:--x_2` +
`md:--x_2`. Note: the first scoped run exposed a stale N-API
binary (channel still nested); `pnpm agentrs b` rebuilt it and
the channel flipped to whole-object — seam staleness, not a code
issue.

**6. Suites (repo runners, this session).** `pnpm agentrs c atomic`
465/465; `pnpm agentrs v atomic` 287/287 (11 files, incl. new
ATOM-06; zero golden movement); neo vitest 225/225 (31 files);
`pnpm agentneo run NEO-CSS-04` PASS (scalar custom-prop ripple);
`pnpm agentrs q` on both `.rs` files clean; `pnpm agentneo q` on
both neo files 0 errors + 1 non-failing warn (`css.test.ts` 372
lines vs the 365 warn line — tipped over by this pin, warn-only
per the skill, no split churn). Post-fix e2e probe
(`/tmp/doom-wave4-custom-prop-object/probe-postfix.mts`, exit 0):
real compile + real runtime over the finder fixture → object
class `@reference-ui/lib__--x_1 @reference-ui/lib__md:--x_2`
(the finder's exact ghost classes, now served), 0 runtime
warnings, 0 defaults, channel whole-object only.

**7. Write-set (captain: commit as the (l) unit).** Modified:
`packages/reference-neo/src/runtime/css/css.ts`,
`css.test.ts`, `diagnostics/analysis/conditions.rs`,
`diagnostics/analysis/object.rs`. New: `tests/cases/ATM-ATOM-06/`
(input + spec + README + 3 goldens). Plus finder report (not
mine, do not attribute) + this section. `dist/` untracked build
output. Open: F2 defense-in-depth stays future doom fodder per
the ruling, not this fortify.

### Captain tick — 2026-09-20 (post-fortify-l)
Fortify (l) landed: `--` rule in both `collectEntries` and
`is_style_value_position`, pins (css.test.ts, object.rs), ATM-ATOM-06
station (3 goldens). Chain review (l) dispatched, running. On its
VERIFIED: commit (l) named files only + wave-4 close, then wave 5
finders.

### Wave 4, find (l) — chain review

**Verdict: VERIFIED (commit-ready).** Whole arc re-verified firsthand by
this oracle; no implementation, no fixes, no commits. (l) files only —
write-set audited via `git status` paths: exactly the landing's 4
modified (`css.ts`, `css.test.ts`, `conditions.rs`, `object.rs`) + new
`ATM-ATOM-06/` + finder report + log; peer paths (`docs/ATOMIC.md`,
`docs/missions/README.md`, untracked `operation-jettison/reaper.md`)
were never touched or adjudicated. Swap windows announced here (all
restored byte-identical, shas match): css.ts 08:08:59–08:09:09 BST,
conditions.rs full 08:09:13–08:09:31, predicate-only 08:09:36–08:09:47,
conditions.rs + rebuild 08:10:00–08:10:19. Binding discipline:
darwin-x64.node postdates all sources on this x86_64 box; old-code
rebuild md5 `4ef30801…`, restored md5 back to the exact pre-swap
`2eadd191…`.

**1. Finder repro** (`/tmp/doom-wave4-custom-prop-object/run.mts`,
unmodified): no longer reproduces — `default []`, `channel nested
exacts: []`, dies at line 50 (`0 !== 2`). The ghost-plan shape is still
minted, but it is no longer a ghost: independent e2e
(`/tmp/chainl-e2e.mts`, exit 0, real compile + real runtime over the
finder fixture) resolves the object form to exactly
`@reference-ui/lib__--x_1 @reference-ui/lib__md:--x_2` — the finder's
ghost classes, now served — with 0 runtime warns, 0 defaults, channel
whole-object only, exactly 1 whole-object plan, no nested plans, and
both decls in the sheet. Scalar/array controls byte-identical to the
architect's pre-fix log (`__--x_1`, `__--x_1 + sm:--x_2`).

**2. Suites** (repo runners, this session, post-restore): neo pin
isolation 1 passed / 224 skipped; cargo pins green by name
(`custom_prop_objects_predict_one_whole_object_exact`,
`style_position_follows_the_runtime_set_minus_r`, plus pre-existing
`test_custom_property_resolves_unique_token`); ATOM-06 isolation 1
passed / 286 skipped; `pnpm agentrs c atomic` 465/465; `pnpm agentrs v
atomic` 287/287 (11 files); `pnpm agent vitest reference-neo` 225/225
(31 files). Ripple: `pnpm agentneo run NEO-CSS-04` PASS (scalar),
NEO-CSS-11 PASS (casing), NEO-LAYER-01 PASS. Quality: `agentneo q` on
both neo files 0 errors + 1 warn-only (`css.test.ts` 372 vs the 365
*warn* line, non-failing per the skill — tipped over by this pin, no
split churn); `agentrs q` on both `.rs` files clean PASS. Zero failures
anywhere — nothing to attribute, nothing absorbed.

**3. Fail-without-fix / pass-with-fix (all firsthand):** css.ts
reverted → neo pin FAILS with the exact finder symptom (`expected '' to
be 'test__--x_1 test__md:--x_2'`); conditions.rs reverted → object pin
FAILS with the 2 nested exacts as `left`
(`["test",["--x"],"base","1",false]`, `… "md" …`) vs the whole-object
`right`; predicate-only revert → conditions pin FAILS at :111; old
binding → ATOM-06 FAILS (`channel carries the whole-object lookup:
expected false to be true`). In-tree: all green. Sweep re-run
firsthand: exactly 3 authored `--*` in atomic inputs, all scalar
(ATOM-05 `--brand-x`, UNIT-01 `--foo`, NAME-06 `--brand-x` — inline
scalar leaves, arms untouched by construction since `isObject`
excludes arrays and the fix sits only in the object-value arms); zero
`'--*': {` in any atomic input or neo world; TOKEN-07/UNIT-03 hits are
baseSystem theme vars, TOKEN-01/13/LAYER-03 mentions are sheet
assertions. Zero golden movement (no modified `output/` path in
status); the 3 new goldens attested per pair (css.json 3 entries,
diagnostics `[]`, utilities exactly `--x_1 + sm:--x_2 + md:--x_2`).

**4. Diff review (line-by-line, (l) write-set):** BOTH predicates gained
the `--` rule — css.ts:159
(`styleProps.has(prop) || prop.startsWith('--')`) and
conditions.rs:53 (identical) — no one-side patch; canon authority
verified verbatim (`is_known_style_prop` returns true on the `--`
prefix). `lowerResponsiveStyles` read: only key `r` is rewritten, every
other key passes `[key, nextValue]` — `--*` reaches `collectEntries`
unmangled. `split.ts` zero diff; key-level split with values opaque
(line 61) — the out-of-scope justification holds. Extraction, policy,
channels, proof, runtime, canon, primitives, lib: zero diff. F2's
premise never engaged: zero nested exacts predicted (channel-verified),
the whole-object exact is present in plans and served — proof untouched
is correct. Second call-site audit: `is_style_value_position` also
serves block.rs:194 (const objects) — scalar leaves route to the
identical `walk_leaf_class` call either way (behavior-identical),
nested const maps go phantom-nested → honest-dynamic per the documented
S2 rule ("recorded responsive objects stay dynamic"); zero such inputs
in tree, so no prediction moves. No third mirror (neo: only css.ts:159;
atomic: only conditions.rs:53 plus a test-harness coverage assert).
`--x` sits in no style-prop set (`['color','p']` unchanged,
`walk_source` set unchanged) — the prefix rule alone carries it, as
ruled. Test diffs pure addition (3 minus-lines total: 2 predicate lines
+ 1 doc line); no weakened tests; no blanket goldens.

**5. Contracts hold.** DIAG-09 satisfied vacuously: no absent exacts
(the whole-object exact is planned and served), no warning owed and
NONE emitted (`defaults []`, 0 runtime warns); warning on this working
shape would be the false positive the ruling forbids. Scalar, array,
and object custom props all paint silently through one responsive path.
Captain: commit the (l) write-set (4 modified + new `ATM-ATOM-06/` +
finder report + log sections); `dist/` is untracked build output,
nothing to commit there.

### Wave 4 close — captain
All three finds VERIFIED and committed: (k) leaf-object query parity,
(j) same-file interface merge member loss, (l) custom-prop object
unqueryable plan. Captain firsthand: full neo run 168 ok + NEO-SITE-11
FAIL proven pre-existing (fails with the full (l) write-set stashed;
world has zero custom-prop usage; sheet-content assertion orthogonal
to the query-predicate fix) — logged, not absorbed, not (l)'s to fix;
atomic cargo + vitest PASS; neo + rs quality gates clean (1 warn-only
line count). Cycles banked: 12. Wave 5 finders dispatched next.

### Wave 5, find (m) — styletrace-fallback-signal-miss

Finder (styletrace): `break-found`, 1 theory spent. `NullishCard`
(`<Div color={color ?? "red"} />`) and `TernaryCard` (`<Div color={title
? color : "red"} />`) do NOT trace while the bare twin `DirectCard`
(`<Div color={color} />`) does — the JSX-edge signal predicate
(`expression_reads_style_prop`, model.rs) falls through
logical/conditional into `_ => false`. Repro:
`/tmp/doom-wave5-styletrace-fallback.mjs` (exit 1, firsthand;
canary-verified against the current built binding). Report:
`.agents/doom/logs/2026-09-20-wave5-styletrace-fallback-signal-miss.md`.
Contract: styletrace README key rule (boundary style props flowing
into a primitive via direct forwarding); severity user-facing (silent
missing paint at use sites via ATM-SITE-08 gating). Scheduling hints
in the report (unprobed, unspent): sibling pipeline predicate shares
the `_ => false` arm (`css({ color: color ?? "red" })`); pipeline
statement walker still lacks the `FunctionDeclaration` arm the JSX
walker has.

### Wave 5, find (o) — wave5-shared-slice-multibyte-panic

**Verdict: BREAK-FOUND (finder report, needs architect ruling).** Scope: SHARED
module only (`packages/reference-rs/modules/shared`). Theories spent: 1 of 3.

**The break:** `shared::slice_span` (lib.rs:11-19) panics on mid-char spans
instead of clamping per its contract. `slice_span("héllo", Span::new(0, 2))`
→ `panicked at modules/shared/src/lib.rs:15:16: byte index 2 is not a char
boundary`. Violated contract: "safely clamped to bounds" (lib.rs:9) + README
"bounds-checked ... to safely extract raw syntax fragments". In-bounds physics:
non-ASCII TS inputs are ordinary compiler food; Oxc spans are byte offsets.

**Repro:** `/tmp/doom-wave5-shared-slice-panic.sh` (blind-runnable, repo runner
only: stages temp integration test → `pnpm agentrs c shared -t doom_wave5_slice_span`
→ trap-removes temp test; tree left clean, verified via git status).

**Severity honesty:** latent crash, NOT currently user-facing — research found
zero production callers of `shared::slice_span`/`unquote` (every domain crate
vendors its own copy; only `shared::testing::*` is imported). Styletrace's copy
is already panic-free (`.get().unwrap_or_default()`); atlas/tasty/virtualrs
copies index raw and share the flaw but are out of this brief's scope. Review
may rule curiosity-vs-fortify; the shared contract is explicit either way.

**Map for scheduling:** first-ever hunt on the shared module (thin log prior).
Unspent gaps left for future briefs: `ScratchWorkspace::write` swallows all IO
errors (silent fixture loss); `write("../..")` escapes the sandbox and survives
`Drop` ("cleans up all written artifacts" claim). Report:
`.agents/doom/logs/2026-09-20-wave5-shared-slice-multibyte-panic.md`.

### Wave 5, find (o) — architecture ruling

**Verdict: BREAK (small, honest, cheap).** Finder report:
`.agents/doom/logs/2026-09-20-wave5-shared-slice-multibyte-panic.md`;
repro `/tmp/doom-wave5-shared-slice-panic.sh` (replayed by architect
read-only firsthand: red — `panicked at modules/shared/src/lib.rs:15:16:
byte index 2 is not a char boundary; it is inside 'é' (bytes 1..3)`,
temp test removed by trap, `git status` on `modules/shared/` clean
after the run).

1. **IN-BOUNDS, and zero callers does not demote it to curiosity.**
   Contract-vs-code inside the module's own stated physics: doc
   "safely clamped to bounds" (`lib.rs:9`) + README "bounds-checked
   source buffer slicing ... to safely extract raw syntax fragments".
   No will-never-work shape — non-ASCII TS inputs are ordinary
   compiler food, Oxc spans are byte offsets, and a panic on valid
   input is never the correct refusal. Weighed and rejected the
   CURIO reading: (a) the contract explicitly promises safety — a
   documented-safe `pub` helper that panics is a trap, and the
   README positions it as the canonical helper the four vendored
   copies should converge to; leaving it lying poisons exactly
   that consolidation; (b) zero callers means zero blast radius —
   the fix cannot regress anything, and Law's triage law kills
   only physics violations, not latent contract breaks; (c) the
   fix is one line with unit-level pins and no goldens — refusing
   it saves nothing. Severity stays exactly as the finder stated
   it: latent crash in shared infra, NOT user-facing today. The
   live user-facing risk sits in the vendored raw-indexing
   copies, which are out of this scope and carried as fodder
   below — this ruling neither fixes nor excuses them.

2. **FILE OWNERSHIP (verified firsthand, binding).** In scope:
   `shared::slice_span` ONLY (`modules/shared/src/lib.rs:11-19`).
   All six domain crates depend on `shared` (Cargo.tomls), but the
   only external `shared::` uses anywhere are `shared::testing::*`
   (typegen `testing::contracts`, atomic + styletrace
   `testing::ScratchWorkspace`) — zero production callers of
   `shared::slice_span`/`unquote`/`unquote_str`, confirming the
   finder. Vendored copies are OUT of scope (read-only precedent
   or future fodder, do not rule their fortify): atlas
   (`usage/literals.rs:62`, `parser/utils.rs:34`), tasty
   (`ast/extract/util.rs:7`, `shared/type_ref_util.rs:121`),
   virtualrs (`responsive/ast.rs:112`) — all raw-index and share
   the flaw; styletrace (`analysis/util.rs:137-141`,
   `resolver/parser.rs:427-431`) — already panic-free via
   `.get().unwrap_or_default()`, the shape this fortify copies.
   `shared::unquote`/`unquote_str` NOT implicated: their indexing
   is on ASCII quote bytes (`trimmed[1..len-1]` after matching
   1-byte quotes), so both bounds are always char boundaries.

3. **FIX DIRECTION (binding): one line —
   `source.get(start..end).unwrap_or_default()`.** `str::get` with
   a `Range` returns `None` on start>end, out-of-bounds, AND
   mid-char bounds, so the one-liner subsumes both existing guards
   while keeping the `""` fallback contract. Do NOT amend the doc
   comment or README to permit panic — they already describe the
   fixed behavior and become true without edits.

4. **TEST PLACEMENT: unit level in the existing `mod tests` in the
   same file** — lower than the finder's temp integration test, no
   binding, no station. Mid-char end (`"héllo" Span(0,2)` → `""`),
   mid-char start (`Span(1,5)` → `""`); existing ASCII pins
   (`test_slice_span`) stay green both sides. No new station, no
   neo case, no `tests/` dir left behind.

5. **FORTIFY BOUNDARY.** Allowed change: `modules/shared/src/lib.rs`
   only (function body + unit tests). Sweep: none — shared has no
   stations/goldens and zero callers means zero golden movement is
   possible. Suites: `pnpm agentrs c shared` full + `pnpm agentrs q`
   on the file. Golden rules: no `--update-goldens` anywhere; any
   run that moves a golden is scope drift and fails the landing.
   Untouched surfaces: all four crates' vendored copies,
   `shared::testing`, `shared::unquote*`, README/SPEC, finder
   report — and NO consolidation of vendors onto `shared::` (a
   separate refactor with its own blast radius, needs its own
   brief). Fail-without-fix bar: the new unit tests panic on old
   code (demonstrated by the replay above) and pass on new.

**Next-brief doom fodder (unprobed, unspent):** the vendored
raw-indexing copies in atlas/tasty/virtualrs carry the live
user-facing variant of this exact panic — each needs its own
brief, repro, and ruling (consolidation vs local fix is an
architect question for that cycle, not this one). Plus the
finder's `ScratchWorkspace::write` notes (swallowed IO errors,
`../..` escape surviving `Drop`).

### Captain tick — 2026-09-20 (wave 5 all-found)
All 3 wave-5 finders landed BREAK-FOUND, 1 theory each: (m-slug
styletrace-fallback-signal-miss) `??`/conditional forwarding never
signals; (o) `shared::slice_span` multibyte panic (latent, zero
callers); (atlas-drop, section mislabeled (m) — slug disambiguates)
`export default memo(...)` vanishes from discovery. Rulings dispatched
for all three, running. Deadlock test: all crews producing (3 reports
+ 3 sections this window) — no interrupts. No commits this tick
(nothing oracle-VERIFIED); peer files untouched.

### Wave 5, find (m) — atlas-direct-default-call-drop

**Verdict: BREAK-FOUND (atlas discovery).** Direct
`export default <wrapper-call>` components vanish: `export default
React.memo(function DirectDefault ...)` and `export default
React.forwardRef<...>(function DirectRefDefault ...)` are untracked,
their call sites unattributed, `diagnostics: []`. Root cause:
`collect_default_export` (`modules/atlas/src/parser/mod.rs:335-420`)
has no CallExpression arm (`_ => {}`), while the declarator path
already unwraps wrappers. Repro
`/tmp/doom-wave5-atlas-direct-default-call.mjs` (exit 1, fresh
`dist/native` binding): both probes fail, both WRAP-01-shape
controls green (named wrapped export + declare-then-default-export,
`count=1`, interfaces mapped). Violated: ATL-WRAP-01 README ("both
named and default-exported wrapped component forms"), module
invariant 1 (diagnostics over silence), js README scope
(default-exported function components + trustworthy identity).
User-facing, in-bounds (static TSX; namespace React import mirrors
the committed WRAP fixture). Report:
`.agents/doom/logs/2026-09-20-wave5-atlas-direct-default-call-drop.md`.

**Map for scheduling:** first-ever atlas hunt (doom-log `search
"atlas"` was zero matches — thin log is signal). Theories spent:
1 of 3. Unspent fodder (no red test, in report): `memo<Props>`
single type-arg can never resolve (`nth(1)` assumes forwardRef's
slot); `React.FC<Props>` declarator annotations never read;
`| undefined` union members nuke `allowed_values`; symlinked roots
+ `..` imports miss via the canonicalize fallback.

### Wave 5, find (atlas-drop) — architecture ruling

**Verdict: BREAK (user-facing, silent discovery loss).** Cited by
slug — the find section's `(m)` collides with the styletrace find's
`(m)`. Finder report:
`.agents/doom/logs/2026-09-20-wave5-atlas-direct-default-call-drop.md`.

**File ownership verified (atlas only):** the judged code is
`collect_default_export` in
`packages/reference-rs/modules/atlas/src/parser/mod.rs:335-420`,
with the mirror path `component_from_expression` in
`modules/atlas/src/parser/components.rs:122-218`. Nothing outside
`modules/atlas/` is in this ruling's scope.

**Blind repro reproduced firsthand:** ran
`/tmp/doom-wave5-atlas-direct-default-call.mjs` myself against the
fresh binding (`dist/native/virtual-native.darwin-x64.node`, built
Sep-20, newer than the Sep-14 parser sources; `git status` on
`modules/atlas/` clean). Exit 1, exactly as filed: both probes
(`export default React.memo(function DirectDefault ...)` and
`export default React.forwardRef<...>(function DirectRefDefault
...)`) `not tracked at all`, `diagnostics: []`; both WRAP-01-shape
controls green (`count=1`, interfaces mapped).

**Asymmetry verified in source (the core evidence):** the
variable-declarator path unwraps arbitrary call wrappers
(`components.rs:199-215` recurses `Expression::CallExpression`
into its arguments), but `collect_default_export` (`mod.rs:344`)
matches only FunctionDeclaration / Identifier /
ArrowFunctionExpression / FunctionExpression and drops everything
else into `_ => {}` (`mod.rs:418`). oxc 0.115's
`ExportDefaultDeclarationKind` inherits all `Expression` variants
(`@inherit Expression`), so a `CallExpression` arm exists to match
— the drop is an omission, not a grammar limit.

**In-bounds discovery physics.** Fully static TSX; the
`import * as React` namespace import is explicitly inside atlas
scope (`modules/atlas/js/README.md` scope list: "alias tracking
for renamed imports and namespace package imports") and mirrors
the committed WRAP-01 fixture verbatim. The doom skill's
"namespace / default value imports" refusal governs the style
extraction dialect (Forge), not atlas discovery — atlas's own
scope doc governs here and additionally lists "default-exported
function components consumed through default imports", which is
exactly the inner function in each probe. No will-never-work
shape. All three violated contracts re-verified by reading the
cited docs: ATL-WRAP-01 README ("Asserts tracking for both named
and default-exported wrapped component forms" — the direct form
is the missing half), module invariant 1 (Diagnostics Over
Guesses — here neither data nor diagnostic), js README scope.

**CURIO reading weighed and rejected:** (a) `export default
memo(function Card ...)` is a mainstream idiom, not an exotic
shape — silent loss on it is user-facing; (b) the silence itself
violates invariant 1 regardless of shape popularity; (c) the
station README already claims the form, so the break is a
README-to-fixture gap inside pinned territory, not new-territory
curiosity.

**Fortify boundary (implementor crew: stay inside this):**

1. **Allowed change:** ONE new arm,
   `ExportDefaultDeclarationKind::CallExpression`, in
   `collect_default_export` (`mod.rs:335-420`), routing the call
   through the existing wrapper-unwrap logic and registering
   `local_components` + `exported_components` +
   `default_component` exactly like the FunctionExpression arm
   (`mod.rs:394-417`). **Naming rule:** use `default_name`
   (file-derived), mirroring the ArrowFunctionExpression arm —
   outer binding wins, and the direct-default form has no
   binding, so the file-derived default identity is
   authoritative; the inner function id is incidental (same
   principle as FancyButton winning over FancyButtonInner in the
   declarator path). Do NOT plumb the inner id through.
2. **Mirrors that move together:** extend station ATL-WRAP-01
   (no new case id — its README already claims the form): new
   fixture components (one `memo`, one `forwardRef`,
   direct-default-exported) + consuming page call sites +
   `spec.ts` assertions + `analysis.json`/`diagnostics.json`
   goldens regenerated via the `--update-goldens` CLI flag only
   (never the env var).
3. **Sweep obligations:** fresh native binding, then full atlas
   suites via repo runners (`pnpm agentrs v atlas` for the
   seam/case suite incl. standing gauges, `pnpm agentrs c atlas`
   for the Rust unit tests), plus `pnpm agentrs q` on every
   touched file. Quality gate limits (complexity, file length,
   no clippy allows) apply to the new arm.
4. **Golden-movement attestation:** per-pair, no sweeps. The
   existing FancyButton/SearchInput entries must be
   byte-identical; only additive new-component entries (and
   their call-site effects) may appear. `diagnostics.json` must
   stay empty-equivalent — this fortify adds support, not a new
   diagnostic kind; `VALID_DIAGNOSTIC_CODES` unchanged.
5. **Untouched surfaces:** `_ => {}` keeps every other variant
   (no TSAs/paren/non-null arms — separate unproven gaps, fodder
   at most); `parse_wrapper_type_arguments` `nth(1)` untouched
   (the `memo<Props>` single-type-arg gap is unspent fodder,
   explicitly NOT this fortify); the declarator path untouched;
   unspent fodder (a)-(d) from the finder report untouched;
   nothing outside `modules/atlas/`.
6. **Pins / station:** station is ATL-WRAP-01; pins are
   name/count/interface/examples assertions for both new
   components in `spec.ts`.
7. **Fail-without-fix bar:** the extended WRAP-01 spec must be
   RED on current code (new components absent from analysis)
   and GREEN after; the `/tmp` repro must flip from exit 1 to
   exit 0 on the rebuilt binding; zero golden movement outside
   the attested additive entries. If the red step cannot be
   demonstrated, the fortify is not proven.

### Wave 5, find (o) — fortify landing

**Status: LANDED.** Ruling followed: binding one-line fix in
`shared::slice_span` only, unit-level pins in the same file's
`mod tests`, no station, no goldens touched, no consolidation.
One ruling erratum found via suite and corrected (below) — fix
direction itself is untouched and exact.

**Fix (binding one-liner, byte-exact).**
`packages/reference-rs/modules/shared/src/lib.rs:11-15` is now
`source.get(start..end).unwrap_or_default()`. `str::get` with a
`Range` returns `None` on start>end, out-of-bounds, AND mid-char
bounds, so both old guards are subsumed with the `""` fallback
contract kept. Doc comment and README unedited per the ruling —
they describe the fixed behavior and are now true.

**Ruling erratum (test placement §4, corrected with evidence).**
The ruling orders `Span(1,5) → ""` as the "mid-char start" pin,
but byte 1 is the START of 'é' (bytes 1..3) — a char boundary,
not mid-char. The suite proved it: under the binding one-liner,
`(1,5)` returns `"éll"`. Firsthand old-code harness
(`/tmp/old_index_check.rs`, exact old expression via `rustc`):
old `(1,5)` → `Ok("éll")` (no panic, old and new agree), old
`(2,5)` → panic, old `(0,2)` → panic. So the literal `(1,5)→""`
fails on BOTH old and new code — it cannot be a pin. Pins
landed per the ruling's evident intent (mid-char end + genuine
mid-char start), plus a guard on the named span's true behavior:
`test_slice_span_mid_char_end_clamps` (`(0,2)→""`, ruling-literal),
`test_slice_span_mid_char_start_clamps` (`(2,5)→""`, genuine
mid-char start), `test_slice_span_boundary_start_slices`
(`(1,5)→"éll"`, documented boundary). Existing ASCII pins
(`test_slice_span`) green both sides, untouched.

**Fail-without-fix / pass-with-fix (firsthand).** Pre-fix:
finder repro `/tmp/doom-wave5-shared-slice-panic.sh` panics at
`modules/shared/src/lib.rs:15:16` (`byte index 2 is not a char
boundary`), tree clean after trap. Post-fix: same script —
`doom_wave5_slice_span_never_panics_on_multibyte_boundary ... ok`,
temp test removed, `modules/shared/` holds only the `lib.rs`
modification (no `tests/` dir left behind).

**Sweep attestation (ruling ordered none).** Shared has no
stations/goldens (`ls modules/shared/` = `Cargo.toml README.md
src/` only) and zero production callers, so zero golden movement
is possible. No `--update-goldens` run anywhere; `git status`
under `modules/shared/` shows exactly `M src/lib.rs`. No golden
moved because none exist.

**Suites (repo runners, this session).** `pnpm agentrs c shared`
11/11 green (8 pre-existing + 3 new); `pnpm agentrs v shared`
30/30 green (5 files); `pnpm agentrs q` on the file —
0 violations, 0 warnings. No commits (captain commits on
chain-review VERIFIED).

**Boundary honored.** Changed: `modules/shared/src/lib.rs` only
(function body + 3 unit tests) + this log section. Untouched:
all four vendored copies (atlas/tasty/virtualrs raw-index,
styletrace `.get()` precedent — read-only), `shared::testing`,
`shared::unquote*`, README, finder report. No consolidation
attempted — needs its own brief per the ruling.

**Files (mine only).**
`packages/reference-rs/modules/shared/src/lib.rs` + this section.

### Wave 5, find (m) — architecture ruling

Slug: styletrace-fallback-signal-miss (the true find (m); the
atlas section above is captain-noted as mislabeled, slug
disambiguates). Find: `NullishCard`
(`<Div color={color ?? "red"} />`) and `TernaryCard`
(`<Div color={title ? color : "red"} />`) do NOT trace while the
bare twin `DirectCard` (`<Div color={color} />`) does — identical
boundary (`CardProps = StyleProps & { title?: string }`),
identical sink (`Div`). Finder report:
`.agents/doom/logs/2026-09-20-wave5-styletrace-fallback-signal-miss.md`;
repro `/tmp/doom-wave5-styletrace-fallback.mjs` (replayed by
architect firsthand: `traced: ["DirectCard"]`, exit 1 — failure
mode confirmed). Root cause per report: the JSX-edge signal
predicate `expression_reads_style_prop`
(`src/analysis/model.rs:118-155`) falls through
Logical/Conditional into `_ => false`. SCOPE VERIFIED:
every file judged below sits under
`packages/reference-rs/modules/styletrace/`; nothing outside
that module is in this ruling's jurisdiction.

1. **BREAK — IN-BOUNDS, violated contract, not
   working-as-designed.** Complete static TSX compile input on
   the pinned surface, named imports; touches nothing on the
   will-never-work list (fallback branches are static literals,
   the signal is a whole boundary prop — no interpolation,
   no runtime-only values, no external config, no
   spread-staying-dynamic, no namespace/default value
   imports). Falls squarely under the skill's misdiagnosis
   clause: same boundary, same flow, different verdict — an
   inconsistent refusal, not a designed one. On the adjudicated
   question — is `color={color ?? "red"}` in-bounds
   forwarding physics per the README key rule? — YES, four
   ways: (a) the key rule (:84-86) tests FLOW ("whether style
   props exposed at that component boundary actually flow
   into the Reference primitive/style pipeline"), and the
   boundary value flows whenever it exists — the fallback
   substitutes exactly when there is no boundary value to
   flow; (b) :69's `color={color}` is exemplary ("such as"),
   not exhaustive; (c) rest/spread `{...props}` is listed as
   traced and is strictly LESS direct than a `??` fallback
   (may-flow vs definite-flow-when-present) — tracing the
   uncertain while missing the near-certain would be
   perverse; (d) wave-4 (k) already crossed the analogous
   bridge (object containers count as signal positions).
   No comment or doc anywhere states fallback-forwarding is
   out of scope. Severity, honestly user-facing: atomic
   gates JSX extraction on the traced host set (ATM-SITE-08,
   verified verbatim in atomic SPEC:255-257 — tags extract
   only when in `trace_style_jsx_names`), so
   `<NullishCard color="red" />` extracts nothing: silent
   missing paint on a mainstream authoring shape (default
   fallbacks are idiomatic). Doom-log consult confirms zero
   prior coverage of fallback signal flow.

2. **FIX DIRECTION (binding): recurse the shared signal
   predicates into fallback value positions — do NOT narrow
   the README.** (a) README authority: the violated sentence
   is the module's key rule (:84-86); narrowing to
   "bare-identifier attributes only" would demote the central
   promise to a syntactic accident and bless silent missing
   paint on idiomatic code. (b) Precision/recall — VALUE
   POSITIONS ONLY: `LogicalExpression` recurses
   left-OR-right (both operands are value positions under
   JS `??`/`||`/`&&` semantics — the result IS one of the
   operands); `ConditionalExpression` recurses
   consequent-OR-alternate ONLY — the TEST is control, not
   flow (its value is discarded), and must NOT count. This
   mirrors (k)'s keys-don't-count guard (a key names the
   property being set; a test gates the branch taken —
   neither is flow from the boundary). A test-only read
   (`color={color ? "blue" : "red"}`) stays untraced and is
   pinned as a negative control. Over-tracing the test
   would mint dead classes for values the wrapper provably
   discards; under-tracing is impossible here since the
   test value can never reach the sink. (c) Placement:
   the arms live in the TWO shared predicates —
   `expression_reads_style_prop` (`model.rs`) AND its
   pipeline mirror `expression_reads_style_signal`
   (`parser/pipeline/util.rs:81-125`), same arms, same
   value-position shape, the pipeline arms recursing into
   THEMSELVES (so minted `style_signals` inside fallback
   branches count, e.g. `css({ color: sig ?? "red" })`).
   The mirror is REQUIRED, not optional: this architect
   probed it firsthand
   (`/tmp/doom-wave5-m-pipeline-probe.mjs`: `css({ color })`
   traces, `css({ color: color ?? "red" })` and the ternary
   twin MISS) — leaving it would ship the
   same-shape-different-verdict divergence wave-1(a)/(k)
   forbid. All sink-test consumers (JSX attr, createElement
   props, spreads, `walk_call` arg test,
   `record_pipeline_binding`, `call_has_style_signal_arg`)
   gain the arms by construction; per-call-site patches are
   forbidden. (d) `expression_directly_derives_from_style_signal`
   is left to fortify+chain per the (k) precedent, with
   guidance: keep the (k)-landed contract split intact
   (reads = flow-into-sink vs derives = alias-minting);
   the rebinding shape (`const c = color ?? "red"`) has no
   red test in this find, so EITHER decision must be
   written down (code comment, as (k) did) AND pinned as an
   explicit control (traces-card or absent-card); default
   expectation is untouched. (e) The finder's
   "walkers descend but predicates refuse" observation is
   NOT a contradiction to resolve: the walkers descend
   into test positions for NESTED-SINK discovery (a
   `<Div color={color}/>` nested anywhere still creates an
   edge) — a different question from signal-read; walkers
   stay as they are. (f) Blast radius is additive: the
   predicates only gain true verdicts, sink/boundary
   checks unchanged, previously-traced hosts stay traced
   by construction. Explicitly OUT: the
   `walk_pipeline_statement` FunctionDeclaration gap (no
   red test; Law 2; carried as doom fodder — third
   sighting after (k) and this report, still unprobed);
   any deeper indirection (calls, awaits, containers of
   fallbacks beyond compositional recursion).

3. **TEST PLACEMENT: Rust unit primary, existing cases
   secondary — no new case, no new station.** Primary pins
   in `src/tests/tracing.rs` via `workspace_scratch_dir`
   (module design rules: prefer Rust for semantic
   coverage), lower than the finder's N-API probe: (i) JSX
   fallback twins mirroring the finder (`DirectCard`
   control + `NullishCard` + `TernaryCard`, exact-equality
   so absences pin too) PLUS a test-only negative control
   (`color={color ? "blue" : "red"}` asserting ABSENT);
   (ii) pipeline-mirror twins (`PipeObjCard` control +
   `PipeNullishCard` + `PipeTernaryCard`, exact-equality);
   (iii) the derives-decision control (positive or
   negative per fortify's written call). Secondary:
   extend EXISTING `tests/cases/direct_wrapper/` (JSX
   family; `['BodyCard','Card']` grows additively with a
   fallback-forwarding twin) and EXISTING
   `tests/cases/direct_style_pipeline/` (pipeline family;
   additive, Panel/ObjPanel shapes untouched). No README
   amendment, no lib touch.

**Sweep obligations (binding).** Baselines attested green by
this architect pre-fortify: `pnpm agentrs c styletrace`
35/35, `pnpm agentrs v styletrace` 28/28. Fortify runs:
full styletrace suites (cargo + vitest) + downstream
ripple per the (k) precedent (cargo atomic + vitest atomic
— atomic depends on styletrace) + `pnpm agentrs q` on all
touched `.rs` files (0 violations, no new warnings over
the pre-fortify baseline; hold complexity down via
helpers if the matcher tips, as (k) did). `pnpm agentrs
build` BEFORE vitest (stale-binary hazard documented in
(k): `agentrs v` does not rebuild). Golden census:
scoped regen only, every moved pair attested per pair —
silent-to-traced flips on fallback shapes are intended;
ANY traced-to-silent flip is a regression and vetoes the
landing; no blanket bless.

**Stays untouched.** Extraction, policy, channels, proof,
runtime, canon, primitives (no atomic changes expected —
ripple is verification-only); `expression_uses_class_name_binding`
(different family); the walkers (`walk/expr.rs`,
`pipeline/expr.rs` — nested-sink discovery, not
signal-read); README; lib, neo, core; `shared/`
(peer (o) scope with live modifications — hands off);
docs; finder report; sibling files. No weakened tests.

**Fail-without-fix bar.** Finder's
`/tmp/doom-wave5-styletrace-fallback.mjs` fails pre-fix
(architect-attested RED: only `DirectCard`, exit 1) and
passes post-fix; architect's
`/tmp/doom-wave5-m-pipeline-probe.mjs` fails pre-fix
(architect-attested: only `PipeObjCard`, exit 1) and
passes post-fix; every new Rust pin fails on
stashed/reverted code and passes in-tree (fortify proves
per pin); chain replays both /tmp repros read-only and
re-runs all suites firsthand. No implementation, no
fixes, no commits by this architect — repo runners only.

### Wave 5, find (o) — chain review

**Verdict: VERIFIED (commit-ready).** Whole arc re-verified firsthand by
this oracle; no implementation, no fixes, no commits. (o) files only —
write-set audited via `git status` paths before judging any diff:
exactly `M packages/reference-rs/modules/shared/src/lib.rs` (+ log
sections). Peer-owned and read-only for attribution: `docs/ATOMIC.md`
+ `docs/missions/README.md` (jettison/reaper mission-doc links),
`styletrace/{analysis/model.rs, analysis/parser/pipeline/util.rs,
tests/tracing.rs}` (wave-5 (m) fallback fortify, landed mid-review),
3 untracked doom reports, 2 untracked mission docs. Nothing outside
`modules/shared/src/lib.rs` is judged here.

**1. Finder repro** (`/tmp/doom-wave5-shared-slice-panic.sh`,
unmodified, post-fix): `doom_wave5_slice_span_never_panics_on_
multibyte_boundary ... ok`, exit 0, no panic, clamped output.
Temp test removed by trap; `ls modules/shared/` = `Cargo.toml
README.md src/` only, status holds just `M src/lib.rs` — no
`tests/` dir left behind, tree clean.

**2. Suites** (repo runners, this session): `pnpm agentrs c shared`
11/11 green (8 pre-existing + 3 new pins, each named in output);
`pnpm agentrs v shared` 30/30 green (5 files — resolves to the
runtime project; shared has no js seam, same command the landing
ran); `pnpm agentrs q` on the file — 0 violations, 0 warnings.
Peer styletrace writes cannot move these: `c shared` builds
`-p shared` only, and shared is a leaf crate.

**3. Fail-without-fix / pass-with-fix (firsthand, announced swap).**
Pre-swap sha `58983b71` backed to `/tmp/chainrev-o-lib.rs.new`;
swapped HEAD bytes (`52dd425a`, old 5-line guard confirmed in
place), restored after, post-restore sha `58983b71` — bytes
identical. On OLD code: finder repro panics at
`modules/shared/src/lib.rs:15:16` (exit 101); pin-equivalent temp
integration test: `(0,2)` PANIC, `(2,5)` PANIC, `(1,5)→"éll"` ok,
ASCII guards ok. On NEW code: repro ok, 11/11 green, plus a
13-assert edge matrix (temp test, trap-cleaned): landed pins,
OOB `(0,50)/(3,50)→""`, inverted `(5,2)→""`, empty-source
`(0,0)→""` / `(0,1)→""`, `(5,5)→""`, emoji mid-char
`(1,3)/(0,3)→""` + boundary `(1,5)→"🎉"`, full `(0,6)→"a🎉b"` —
all green. Ruling §5 bar met per pin.

**4. Diff review (line-by-line, (o) write-set).** Hunk 1: old guard
→ `source.get(start..end).unwrap_or_default()` — byte-exact vs
ruling §3; `str::get(Range)` returns `None` on start>end, OOB,
AND mid-char bounds, so both old guards are subsumed with the
`""` fallback kept. Doc comment (line 9), README, `unquote(*)`,
`testing/` untouched (no hunks, no diffs); existing
`test_slice_span` / `test_unquote` are context lines only —
nothing weakened. Hunk 2: 3 unit tests in the existing `mod
tests`, same file — ruling §4 placement, no station, no neo
case, no `tests/` dir. **Ruling erratum ADJUDICATED and
accepted:** (1,5)→"" as a "mid-char start" pin fails BOTH sides
(byte 1 is é's start boundary — old code returns "éll", proven
above; new code returns "éll", landed boundary test green), so
it cannot be a pin. Landed `(2,5)→""` is the genuine mid-char
start (byte 2 inside é bytes 1..3: panics old, `""` new) and
`(1,5)→"éll"` pins the named span's true behavior — ruling
intent preserved, fix direction byte-exact, same-file +1 test,
not scope drift. Vendored copies untouched per scope: all 9
`slice_span` sites show zero diff (atlas/tasty/virtualrs still
raw-index, styletrace still `.get()`); zero production callers
of `shared::slice_span`/`shared::unquote` outside shared
(grep NONE). No goldens: shared has none, none exist to move,
no `--update-goldens` run — sweep attestation holds. Fodder
precision for the next brief: tasty carries a THIRD vendored
copy at `scanner/imports.rs:77` (raw-index, unlisted in the
ruling) alongside the two listed ones.

**5. Contract holds.** "Safely clamped to bounds" (lib.rs:9) +
README "bounds-checked ... to safely extract raw syntax
fragments" are now true without edits: mid-char spans (start or
end, 2-byte and 4-byte chars), OOB spans, inverted spans, and
empty-source spans all return `""` instead of panicking, while
boundary spans slice normally. Captain: commit `M
packages/reference-rs/modules/shared/src/lib.rs` + the (o)
finder report + the (o) log sections; `dist/` untracked,
nothing to commit there.

### Wave 5, find (m) — fortify landing

Slug: styletrace-fallback-signal-miss (the true find (m); the
atlas section above is captain-noted as mislabeled, slug
disambiguates).

**Status: LANDED.** Ruling followed exactly: recurse the two
shared signal predicates into fallback value positions; no
README narrowing; all sink-test consumers gain the arms by
construction (zero per-call-site patches); walkers untouched;
`expression_uses_class_name_binding` untouched; deeper
indirection and the `walk_pipeline_statement`
FunctionDeclaration gap untouched (no red test; doom fodder).

**Fix (two predicates, same arms).**
`expression_reads_style_prop` (`src/analysis/model.rs:153-165`)
and `expression_reads_style_signal`
(`src/analysis/parser/pipeline/util.rs:117-126`, recursing
into itself so minted `style_signals` inside fallback
branches count): `LogicalExpression` recurses left-OR-right;
`ConditionalExpression` recurses consequent-OR-alternate
ONLY — the test is control, not flow, and must not count.
Additive by construction: predicates only gain true
verdicts; sink/boundary checks unchanged.

**Derives decision (ruling §2d, written down + pinned).**
`expression_directly_derives_from_style_signal` UNTOUCHED
(the ruling's default expectation): reads = flow-into-sink,
derives = alias-minting, and the rebinding shape
(`const c = color ?? "red"`) has no red test. Documented in
a code comment (`util.rs:169-174`, as (k) did) and pinned as
an absent-card negative control (`RebindCard` below).

**Pins (Rust primary, `src/tests/tracing.rs`, exact-equality
so absences pin too).** (i)
`traces_jsx_fallback_forwarding_but_not_test_only_reads`:
`DirectCard` control + `NullishCard` + `TernaryCard` trace,
`TestOnlyCard` (`color={color ? "blue" : "red"}`) ABSENT.
(ii)
`traces_pipeline_fallback_args_but_not_rebound_fallbacks`:
`PipeObjCard` control + `PipeNullishCard` +
`PipeTernaryCard` trace, `PipeTestOnlyCard` ABSENT
(test-exclusion mirrored on the pipeline predicate),
`RebindCard` ABSENT (the (iii) derives-decision control).
Secondary: extended EXISTING `direct_wrapper`
(`FallbackCard`, spec `['BodyCard','Card','FallbackCard']`)
and EXISTING `direct_style_pipeline` (`FallbackPanel`,
spec `['FallbackPanel','ObjPanel','Panel']`); Panel/ObjPanel
shapes untouched; `direct_wrapper` README enumeration
updated. No new case, no new station.

**Fail-without-fix / pass-with-fix (firsthand).**
Pre-fix: finder's `/tmp/doom-wave5-styletrace-fallback.mjs`
`traced: ["DirectCard"]` exit 1; architect's
`/tmp/doom-wave5-m-pipeline-probe.mjs`
`traced: ["PipeObjCard"]` exit 1. Post-fix on the rebuilt
binding: both exit 0 with all twins traced. Both new Rust
pins FAIL on stashed fix files (2 failed / 35 filtered)
and PASS in-tree — per-pin proven, stash popped, fix
verified restored.

**Sweep attestation (ruling-ordered, repo runners only).**
`pnpm agentrs c styletrace` 37/37 (35 baseline + 2 new);
`pnpm agentrs v styletrace` 28/28 (pre-regen drift was
exactly the 2 extended stations, golden-diff only, specs
already green — no other station moved); downstream ripple
per (k): `pnpm agentrs c atomic` 465/465,
`pnpm agentrs v atomic` 287/287 (11 files), zero atomic
paths modified — verification-only. `pnpm agentrs build`
ran BEFORE vitest (stale-binary hazard). `pnpm agentrs q`
on all 3 touched `.rs` files: 0 violations, 8 warnings —
byte-identical warning SET to the pre-fortify baseline
(same 4 functions; complexity values rose inside
already-warning matchers, no new warning). No helper
extraction: the matchers were already tipped at baseline
and (k) left the same warnings standing; the two-line OR
arms add no new warning, so extraction would be churn.
Golden census: scoped `--update-goldens` CLI-flag regen on
the 2 extended stations only (never the env var); per-pair
attested — `direct_wrapper` `["BodyCard","Card"]` →
`+FallbackCard`, `direct_style_pipeline`
`["ObjPanel","Panel"]` → `+FallbackPanel`; zero removals,
zero traced-to-silent flips, zero other goldens touched
(writer-canonical pretty format, precedented in-tree by
`entry_scope`/`parse_failure_isolated`). No weakened tests.

**Boundary honored.** Changed: 10 styletrace paths only
(2 fix files + 1 Rust test file + 2 station
input/spec/golden pairs + 1 README line) + this section.
Untouched: extraction, policy, channels, proof, runtime,
canon, primitives, walkers, README, lib, neo, core,
`shared/` (peer (o) live scope — hands off), docs, finder
report, sibling files. No commits (captain commits on
chain-review VERIFIED).

### Wave 5, find (m) — chain review

Slug: styletrace-fallback-signal-miss (the true find (m); the
atlas section above is captain-noted as mislabeled, slug
disambiguates).

**Verdict: VERIFIED (commit-ready).** Whole arc re-verified
firsthand by this oracle; no implementation, no fixes, no
commits. (m) files ONLY — write-set audited via `git status`
paths before judging any diff: exactly the 10 styletrace
paths (2 fix + 1 Rust pins + 2 station input/spec/golden
pairs + 1 README line) + log sections. Excluded from
judgment, verified other-crew: `docs/ATOMIC.md` +
`docs/missions/README.md` (Jettison/Reaper mission-table
rows) and the atlas-drop fortify
(`atlas/src/parser/mod.rs`, ATL-WRAP-01 spec/fixtures)
that landed concurrently mid-review — hands off, disjoint
scope. Stash-list remnants (`sim-quarantine-pipeline`,
`Agent Playwright CT`) are pre-existing, untouched.

1. **Blind repros GREEN post-fix (firsthand).** Finder's
   `/tmp/doom-wave5-styletrace-fallback.mjs`: `traced:
   ["DirectCard","NullishCard","TernaryCard"]`, exit 0
   (exact set — no extras, no over-trace). Architect's
   `/tmp/doom-wave5-m-pipeline-probe.mjs`: `traced:
   ["PipeNullishCard","PipeObjCard","PipeTernaryCard"]`,
   exit 0. Binding freshness: `pnpm agentrs build`
   confirms the 08:26 `darwin-x64` binary ready; sources
   mtime 08:27 is fortify's stash-pop retouch (content
   proven current by the passing repros, not mtimes).
2. **Suites green via repo runners (firsthand).** `pnpm
   agentrs c styletrace` 37/37 (35 baseline + 2 new);
   `pnpm agentrs v styletrace` 28/28 (2 files);
   downstream ripple per (k): `pnpm agentrs c atomic`
   465/465, `pnpm agentrs v atomic` 287/287 (11 files),
   zero atomic paths modified (verification-only). `pnpm
   agentrs q` on all 3 touched `.rs` files: 0
   violations, 8 warnings — warning SET byte-identical
   to the pre-fix baseline I re-ran myself in a second
   swap window (same 5 functions, same kinds; values
   rose only inside already-warning matchers:
   14→18/34→42 and 16→20/40→48, all under gate fail
   thresholds; no-helper call stands per (k) precedent
   and the ruling's bar).
3. **Fail-without-fix / pass-with-fix firsthand.**
   Swap window 1 (announced): stashed ONLY the 2 fix
   files, pins in-tree → both new pins FAILED (`0
   passed; 2 failed; 35 filtered out`, assertion at the
   exact-equality lines). Popped → both pins pass
   in-tree (2/2 filtered). Bytes restored: md5
   `93bf7881…` (model.rs) and `c87404ed…` (util.rs)
   identical pre/post across both swap windows; my WIP
   stash dropped, tree scope unchanged after each pop.
4. **Line-by-line diff review.** BOTH predicates gained
   BOTH arms — no one-side gap: `model.rs`
   `expression_reads_style_prop` (Logical left-OR-right;
   Conditional consequent-OR-alternate) and
   `pipeline/util.rs` `expression_reads_style_signal`
   (same arms, recursing into ITSELF so minted signals
   in branches count). Conditional TEST correctly
   excluded on both sides with value-position comments.
   `derives` untouched except the ruling-§2d comment
   (rebinding stays out, pinned absent via `RebindCard`)
   — the (k) contract split intact. Fix inside the
   ruling boundary: no walker/per-call-site patches, no
   README narrowing, FunctionDeclaration gap and deeper
   indirection untouched. No weakened tests — pins and
   specs purely additive, nothing loosened or removed.
   Goldens per-pair attested: `direct_wrapper`
   `["BodyCard","Card"] → +FallbackCard`,
   `direct_style_pipeline` `["ObjPanel","Panel"] →
   +FallbackPanel`; zero removals, zero
   traced-to-silent flips, zero other goldens touched;
   pretty-format rewrite is writer-canonical,
   precedented in-tree (`entry_scope`,
   `parse_failure_isolated` — read firsthand).
5. **Violated contract now holds.** README key rule
   (:84-86, flow-into-sink) + :69 forwarding: fallback
   twins trace on BOTH the JSX edge and the pipeline
   mirror — the wave-1(a)/(k)
   same-shape-different-verdict divergence is closed.
   Negative controls green in-tree via exact-equality:
   `TestOnlyCard` (`color={color ? "blue" : "red"}`)
   ABSENT, `PipeTestOnlyCard` ABSENT, `RebindCard`
   ABSENT — non-flowing shapes still silent, no dead
   classes minted for discarded test values.

Captain: safe to commit the (m) write-set as one cycle
commit (10 styletrace paths + log); keep the concurrent
atlas-drop fortify and Jettison/Reaper docs rows on
their own owners' commits, not this one.

### Wave 5, find (atlas-drop) — fortify landing

**Status: LANDED.** Cited by slug per the ruling (the find section's
`(m)` collides with the styletrace find). Ruling followed exactly:
one new arm in `collect_default_export`, station ATL-WRAP-01
extended (no new case id), goldens via `--update-goldens` CLI flag
only, per-pair attestation, fail-without-fix proven firsthand both
ways. No commits (captain commits on chain-review VERIFIED).

**Fix (one arm + one import, atlas only).**
`packages/reference-rs/modules/atlas/src/parser/mod.rs`:
`ExportDefaultDeclarationKind::CallExpression` arm in
`collect_default_export`, routing through the existing
wrapper-unwrap via `declaration.as_expression()` (oxc 0.115
`inherit_variants!` provides the zero-cost `&Expression` view, so
the declarator path's `component_from_expression` is reused with
zero duplication and zero edits to `components.rs`) and
registering `local_components` + `exported_components` +
`default_component` exactly like the FunctionExpression arm.
Naming rule honored: `default_name` (file-derived) is passed, the
inner function id is incidental. Diff is 27 lines: 1 import
(`component_from_expression`), 1 arm, 1 terse why-comment.

**Pins / station (ATL-WRAP-01).** New fixtures
`components/DirectMemo.tsx` (`export default React.memo(function
DirectMemoInner ...)` — inner id deliberately differs from the
file stem, pinning file-derived naming) and
`components/DirectForwardRef.tsx` (`export default
React.forwardRef<HTMLInputElement, DirectForwardRefProps>(function
DirectForwardRefInner ...)`), consumed from a NEW page
`pages/DirectWrappedPage.tsx` (2 call sites each, one via aliased
default import `DirectRefBox`, pinning alias attribution for the
direct-default form). Separate page keeps existing `usedWith`
untouched. `spec.ts` pins name/count/interface/examples for both
new components.

**Fail-without-fix / pass-with-fix (firsthand).** `/tmp` repro:
exit 1 pre-fix (both probes `not tracked at all`,
`diagnostics: []`, both controls green) → exit 0 post-rebuild
(all four `count=1`, interfaces mapped, `diagnostics: []`).
Extended WRAP-01 spec: RED on pre-fix binding (exactly 1 failure,
`expected undefined to be defined` at the DirectMemo pin, 59/60
pass — proving the rest of the suite was already green) → GREEN
after (60/60).

**Sweep attestation (per-pair, no blanket updates).**
`analysis.json`: FancyButton and SearchInput verified
programmatically identical except `usage` `very common`→`common`
— the unavoidable denominator call-site effect (ratio-scored
against global total: 2/4=0.5 → 2/8=0.25 vs the 0.5 threshold;
counts, props, values, examples, interfaces, `usedWith` all
byte-identical). Only additive entries: `DirectForwardRef` and
`DirectMemo` (`count=2`, interfaces mapped, file-derived names,
`<DirectRefBox ...>` alias examples, `usedWith` each other).
`diagnostics.json` untouched (empty-equivalent);
`VALID_DIAGNOSTIC_CODES` unchanged (helpers.ts untouched). Two
drift findings, both corrected in-tree: (1) the regen writer
reflowed `examples` arrays in 11 uninvolved stations (pure
whitespace; those stations passed pre-regen) — all 11 reverted,
`git status` confirms WRAP-01 is the only golden pair touched;
(2) the same reflow hit SearchInput's `examples` hunk — restored
to committed single-line formatting, verified by deep-equal
against saved writer output (`/tmp/atlas-drop-writer-analysis.json`).

**Suites (repo runners, this session).** `pnpm agentrs v atlas`
60/60 (5 files, incl. standing gauges); `pnpm agentrs c atlas`
16/16; `pnpm agentrs b` rebuilt fresh before the flip proof;
`pnpm agentrs q` on all 8 touched atlas paths — 0 violations, 12
warnings, all 12 pre-existing on `mod.rs` (file 421→444 lines,
fn 86→109 lines, cyclomatic 12→14, cognitive 33→40 — every metric
inside its hard limit; no new warning categories, no clippy
allows). Fixture/spec/golden files contribute 0 warnings.

**Boundary honored.** Changed: `atlas/src/parser/mod.rs` (arm +
import) + WRAP-01 station (3 new fixture files, `spec.ts`,
`analysis.json`) + this section. Untouched: `_ => {}` (every
other variant still drops), `parse_wrapper_type_arguments`
`nth(1)`, the declarator path (textually unedited),
`default_export_name`, unspent fodder (a)-(d), station README
(already claims the form), all other stations' goldens,
everything outside `modules/atlas/`. Other crews' rows
(docs/ATOMIC.md, docs/missions/*, Jettison/Reaper) not touched.

**Files (mine only).**
`packages/reference-rs/modules/atlas/src/parser/mod.rs`,
`tests/cases/ATL-WRAP-01-memo-forwardref/{spec.ts,output/analysis.json,input/app/src/components/{DirectMemo,DirectForwardRef}.tsx,input/app/src/pages/DirectWrappedPage.tsx}`
+ this section.

### Wave 5, find (atlas-drop) — chain review

**Verdict: VERIFIED (commit-ready).** Whole arc re-verified firsthand by
this oracle; no implementation, no fixes, no commits. Cited by slug
per the ruling (letter `(m)` collides with the styletrace find).
Atlas files only — sibling crews' files (`docs/ATOMIC.md`,
`docs/missions/*`, Jettison/Reaper) never touched or adjudicated
(write-set audited via `git status --porcelain` paths before judging
any diff: exactly 3 modified + 3 new under `modules/atlas/`, all
unstaged, nothing staged).

**1. Finder repro** (`/tmp/doom-wave5-atlas-direct-default-call.mjs`,
unmodified, x86_64 box, fresh `dist/native` darwin-x64 binding):
CONTRACT HOLDS, exit 0 — all four components `count=1` with
interfaces mapped (`DirectDefault`, `DirectRefDefault`,
`IdentDefault`, `NamedTwin`), `diagnostics: []`. The direct
`export default memo(...)/forwardRef(...)` probes are tracked, call
sites attributed, zero vanish.

**2. Suites** (repo runners, this session): `pnpm agentrs v atlas`
60/60 green (5 files, incl. standing gauges + extended WRAP-01);
`pnpm agentrs c atlas` 16/16 green; `pnpm agentrs q` on all 5
touched source files — 0 violations, 12 warnings, all on `mod.rs`.
Baseline check firsthand: pre-fix HEAD `mod.rs` carries the SAME 12
warnings (same categories; `collect_default_export` 12→14
cyclomatic, 33→40 cognitive, fn 86→109 lines, file 421→444) — every
metric inside its hard limit, zero new warning categories, zero
clippy allows. Fixture/spec files contribute 0 warnings.

**3. Fail-without-fix / pass-with-fix** (SWAP WINDOW 1, announced):
pre-fix `mod.rs` (HEAD bytes, 0 `CallExpression` mentions) swapped
into the tree, binding rebuilt — repro flips to exit 1 with the
EXACT filed failure mode (both probes `not tracked at all`,
controls green, `diagnostics: []`), and `pnpm agentrs v atlas`
shows exactly 1 failure: WRAP-01 `expected undefined to be defined`
at `spec.ts:27` (DirectMemo pin), 59/60 pass, all 15 other stations
+ all unit files green. Window closed: fix bytes restored
(sha256 `47cd2220…f372` before = after), binding rebuilt, repro
back to exit 0, suite back to 60/60. Index untouched throughout
(no add/checkout); `dist/` untracked build output.

**4. Diff review (line-by-line):** `mod.rs` — ONE new
`ExportDefaultDeclarationKind::CallExpression` arm + ONE import
(`component_from_expression`) + one terse why-comment. The arm
routes via `declaration.as_expression()` into the EXISTING
declarator-path `component_from_expression` (the
`CallExpression` recursion at `components.rs:199-215`) — zero
duplicated unwrap logic, `components.rs` textually unmodified.
Registration mirrors the FunctionExpression arm exactly
(`local_components` + `exported_components` + `default_component`);
naming passes file-derived `default_name`, inner id incidental, per
the ruling's naming rule. Inside the ruling boundary:
`_ => {}` keeps every other variant (no TSAs/paren/non-null arms —
`export default (memo(...))` still drops, per ruling §5, fodder at
most); `parse_wrapper_type_arguments` `nth(1)` untouched; fodder
(a)-(d) untouched; station README untouched; nothing outside
`modules/atlas/`. Spec diff purely additive (2 new pin blocks +
doc line); FancyButton/SearchInput pins byte-identical — no
weakened tests. Goldens attested per pair by parsing HEAD vs
worktree as data (`/tmp/atlas-drop-chainrev-goldens.mjs`, all
PASS): exactly 2 additive entries (`DirectMemo`, `DirectForwardRef`,
`count=2`, interfaces mapped, file-derived names, `<DirectRefBox>`
alias examples), zero removals, no `*Inner` leakage;
FancyButton/SearchInput deep-identical except the `usage`
`very common`→`common` denominator effect (2/4→2/8 vs the 0.5
threshold — counts, props, values, examples, interfaces, `usedWith`
all byte-identical); `diagnostics.json` byte-identical to HEAD and
empty-equivalent; `helpers.ts` (`VALID_DIAGNOSTIC_CODES`)
unmodified; WRAP-01 `analysis.json` the only golden touched (the 11
reflowed stations the landing reported are confirmed reverted —
absent from status).

**5. Contracts hold.** (a) ATL-WRAP-01 README "both named and
default-exported wrapped component forms" — the direct form now
tracked for both `memo` and `forwardRef`, pinned by name/count/
interface/examples assertions. (b) Diagnostics-over-silence — the
silence is gone because the data is now present; per ruling §4 no
new diagnostic kind is owed and none was added. (c) Trustworthy
identity — file-derived naming (`DirectMemo`, not `DirectMemoInner`)
plus alias attribution (`DirectRefBox`) pinned in goldens.
Negative controls firsthand (`/tmp/atlas-drop-chainrev-negatives.mjs`,
NEGATIVES HOLD): `export default (() => 42)()` and
`export default makeConfig()` mint nothing, crash nothing, and the
healthy `Plain` control tracks `count=1`.

Captain: commit the 6 atlas paths (3 modified + 3 new fixtures) +
finder report + ruling/landing/review log sections; keep
concurrent docs/Jettison/Reaper rows on their owners' commits.

### Wave 5 close — captain
All three finds VERIFIED and committed: (m) styletrace fallback
signal miss, (o) shared slice multibyte panic, (atlas-drop)
direct-default wrapper-call discovery drop. Captain firsthand per arc:
suites + quality gates re-run green (warn-only, non-failing).
Note: two sections share the (m) label (styletrace + atlas find);
slug disambiguates. Cycles banked: 15. Wave 6 finders dispatched
next (virtualrs, tasty, neo-fragments — different modules, no lib).

### Wave 6, find (r) — wave6-extends-private-leak
BREAK-FOUND in neo fragments/extends, 1 theory spent. Upstream `_private` tokens leak verbatim across the extends boundary into the downstream `EvaluatedSystemSpec`: neo evaluates upstream fragment bundles in the same script and merges into one spec for a single-spec `compile()`, so the Rust `BAS-EXTEND-03` strip boundary never exists and nothing in TS strips instead. Violates the `tokens.ts` header contract ("stripped from any downstream consumer that pulls in the package via extends"). Repro `/tmp/doom-wave6-r-private-leak.mts` (repo tsx, exit 1): downstream `spec.tokens.colors` contains `_private.upstreamSecret`, provenance advertises it. User-facing: leaks into published `evaluated-system.json`, downstream typegen/autocomplete, and transitively via the portable fragment bundle. Report: `.agents/doom/logs/2026-09-20-wave6-extends-private-leak.md`. Untried theories banked in report (font-weights-vs-tokens precedence; `tokenLeafPaths` under-reporting). No fixes, no commits; repro + report + this section complete.

### Wave 6, find (r) — architecture ruling
Verdict: **BREAK**. Firsthand reproduction: the blind repro
`/tmp/doom-wave6-r-private-leak.mts` run under the repo tsx binary exits
1 — downstream `spec.tokens.colors` contains
`_private.upstreamSecret` verbatim and provenance advertises
`colors._private.upstreamSecret` under the upstream source. Controls
green via the repo runner: `pnpm agentneo run NEO-TOKEN-09` PASS
(owner `_private` resolves in the owning system — the fortify must not
break this) and `pnpm agentneo run NEO-SYNC-10` PASS (extends adoption
baseline). Scope check: all judged files are neo-owned
(`packages/reference-neo/src/fragments/**`, `src/sync/**`); the css
runtime is untouched ground per brief, and no finding here depends on
it.

Why BREAK, not CURIO. The `tokens()` header rule ("`_private`
subtrees ... are stripped from any downstream consumer that pulls in
the package via `extends`" —
`packages/reference-neo/src/fragments/api/tokens.ts:31-34`) plus
BAS-EXTEND-03 intent is genuinely violated by TS-side merging ahead of
the strip boundary. Three legs: (1) Rust implements the strip at the
multi-spec boundary (`BaseSystem::from_specs`,
`strip_private_tokens`, proven by `bas_extend_03_*` and
`bas_extend_05_*` in
`packages/reference-rs/modules/base-system/src/extends/tests.rs`) —
but neo's `evaluatePreparedFragments` evaluates upstream + local
bundles in ONE script and `mergeCollectedSpec`
(`packages/reference-neo/src/fragments/base/index.ts:236-266`) merges
them into ONE `EvaluatedSystemSpec` for a single-spec `compileNative`
(`src/sync/index.ts:87-108`), so the Rust boundary never sees two
specs and nothing in TS strips instead. (2) The core mirror refutes
working-as-designed: core's TS path strips upstream `_private`
per-fragment, source-gated (`applyPrivateScope` in
`resolveColorModeTokens.ts`, `stripPrivate = isUpstreamFragment` in
`tokens/load.ts`) — neo copied the fragments flow ("Neo-owned copy")
and dropped the strip. (3) User-facing: the leak lands in published
`evaluated-system.json`, in typegen `.d.ts` via
`emitDtsSync({ baseSystem: spec })` (autocomplete), and transitively
via the portable fragment bundle (raw upstream code re-evaluated
downstream-of-downstream). Not physics: no will-never-work entry
covers documented `_private` scoping, and two reference
implementations (Rust + core TS) honor it.

Fortify boundary. TS side ONLY — the change lives in
`packages/reference-neo/src/fragments/base/` (strip upstream-sourced
`_private` at merge time, in or beside `mergeCollectedSpec`, plus
`tokenProvenance` must drop the stripped keys — it currently
advertises the leak). Strip shape mirrors Rust `strip_private_tokens`
(drop the `_private` key at any depth, including a top-level category)
and core's `stripPrivateTokensDeep`. Gate trap (exact): core gates on
the literal `source === 'upstream system fragment'` because core tags
ALL upstream bundles with that literal — but neo's
`wrapBundleWithSource` tags upstream bundles with per-system NAMES
(`upstreamNames[index] ?? 'upstream system fragment'`). A verbatim
copy of core's gate re-opens the hole for every named upstream. The
fortify MUST gate on membership in the upstream-names set (keep the
literal as the fallback member), never on literal equality alone. The
non-enumerable `CONFIG_FRAGMENT_SOURCE_PROPERTY` tag survives
single-script evaluation and does not leak through
`mergeFragmentObjects` (entry-based) — the boundary information is
present; use it. Transitivity needs no second fix: the portable bundle
keeps raw upstream code and each downstream strips at its own merge
(BAS-EXTEND-05 semantics), so the merge-time strip composes down the
chain. Sweep: tokens merge + token provenance only (`_private`
scoping is tokens-only per contract; keyframes/fonts paths and
`buildFontWeightTokens` need no action — verify, don't touch).
Golden-movement attestation: any moved golden allowlisted per-file
with before/after diff in the log; NEO-SYNC-10's pins
(`evaluated-system.json` merged tokens, `jsx-elements.json`) must NOT
move (its world has no `_private` — movement means over-strip);
NEO-TOKEN-09 stays green (owner passthrough); no new goldens to paper
red stations. Untouched surfaces: Rust base-system (no `agent-rs`),
all of reference-core (already correct — copy the ~15-line shape,
never import across; the gate forbids it), `EvaluatedSystemSpec`
contracts (frozen), portable bundle format/schema, typegen, sync
publish legs, css runtime.

Pins + station/case. New case under `sync/` as **NEO-SYNC-17**
(next free — NEO-SYNC-16 folder exists; confirm max+1 via the CLI at
cook time; do NOT number into the token group — NEO-TOKEN-15..19 are
reserved by the corpus plan): two-system world, upstream defines a
public token plus `colors._private.upstreamSecret` (and a top-level
`_private` category leg), downstream defines its own `_private`;
assert (a) `evaluated-system.json` tokens contain no upstream
`_private` at any depth, (b) provenance carries no upstream
`_private` paths, (c) upstream public token adopted and paints,
(d) downstream's OWN `_private` kept and paints (boundary-direction
regression leg), (e) generated `.d.ts` lacks the upstream private
path. Unit pin in `fragments/base` (`merge.test.ts` or
`index.test.ts`, whichever owns the helper): strip helper incl.
top-level `_private` category, named-upstream gating (two distinct
upstream names + the literal fallback — the trap above), and
local-source passthrough. Register the case in `sync/TESTS.md` (+
README search terms: extends, private, encapsulation, upstream strip).

Fail-without-fix bar: on current code the new case's (a)/(b)/(e)
assertions MUST fail red (the leak is the red), (c)/(d) pass; after
the fortify the case passes whole, the doom repro flips exit 1 to 0,
and NEO-TOKEN-09 + NEO-SYNC-10 stay green (guardrails against
over-strip and merge-shape drift). No implementation in this ruling;
no fixes, no commits.

### Wave 6, find (p) — virtualrs-cva-dual-binding-drop
BREAK-FOUND in virtualrs/cva import rewrite, 1 theory spent. A single `import { cva, recipe } from '@reference-ui/react'` carrying BOTH canonical CVA bindings comes out with the `recipe` specifier deleted but its call sites untouched — `const b = recipe({})` survives with no binding, so the compiler silently emits code that throws `ReferenceError` at runtime. Aliased variant (`cva as c1, recipe as r1`) breaks identically (only the first binding's calls normalize). Violates the virtualrs README CVA contract ("rewriting both the import declarations and the call sites to ensure canonical `cva` usage") and the VRT-CVA-03 pin (`recipe` call sites become `cva(`). Root cause (read, not fixed): `utils.rs::process_import_specifier` keeps only the first `Matched` local binding while swallowing the second specifier, so one canonical `cva` import is emitted and at most one binding's calls are renamed. VRT-CVA-02 does not cover this — it pins leaving a second *declaration* intact (valid output). Repro `/tmp/doom-wave6-virtualrs-t1-dual-binding.mjs` (plain `node`, exit 1, current x64 binding). User-facing, silent, no diagnostic. Baseline note: `pnpm agentrs v virtualrs` is red at baseline (10/16 fail on a `;` golden drift), pre-existing and unrelated. Thin-log signal: no prior virtualrs hunt in the doom log. Untried gaps banked in report (unbounded `normalize_bound_calls` regex; `f64` breakpoint-width acceptance). No fixes, no commits; repro + report + this section complete.

### Wave 6, find (p) — architecture ruling
**Verdict: BREAK.** Ruled firsthand 2026-09-20; no implementation, no fixes, no commits.

**1. Blind reproduction (firsthand).** Ran `/tmp/doom-wave6-virtualrs-t1-dual-binding.mjs` (plain `node`, current `dist/native/virtual-native.darwin-x64.node`) — exit 1, output exactly as finder reported: `import { cva } from 'src/system/css';` emitted while `const b = recipe({})` survives with no binding. `emits canonical cva import` PASS; `no dangling recipe( call` FAIL; `both call sites use cva(` FAIL. Confirmed: the compiler silently emits code that throws `ReferenceError` at runtime, with no diagnostic.

**2. Baseline (established firsthand, working tree clean of virtualrs edits).** `pnpm agentrs v virtualrs`: RED at baseline, 10 failed / 16 — failures are exactly the 10 transform cases (VRT-CSS-01/02, VRT-CVA-01/02/03, VRT-FN-01/02, VRT-RESP-01/02/05); green are the 5 no-op cases (CSS-03, CVA-04, FN-03, RESP-03/04) + the station-discovery meta-test. Drift anatomy verified: `render_rewritten_imports` emits `;`-terminated imports and the Rust tests assert that shape, while committed Vitest goldens lack `;` (checked VRT-CVA-03 `output/expected.tsx` vs live output). At least one responsive golden shows additional formatting drift — uncharacterized, and explicitly not this fortify's to fix. `pnpm agentrs c virtualrs`: GREEN at baseline, 26 passed / 0 failed. The finder's "10/16 red, pre-existing" warning is accurate; the break reproduces through the same binding the green Rust suite uses, so nothing is attributable to the drift.

**3. Adjudication — BREAK, not curio.** (a) In-bounds CVA physics: plain named imports, complete static literals, no interpolation, no runtime-shaped data — nothing on the will-never-work floor. (b) Violated contracts: virtualrs README §CVA Transformation ("rewriting both the import declarations and the call sites to ensure canonical `cva` usage in the emitted output") — the second binding's call sites are neither rewritten nor preserved; VRT-CVA-03 pin semantics (`recipe` call sites become `cva(`) — violated when `recipe` shares its declaration with `cva`; compiler self-consistency — a transform must never delete an import specifier while leaving references to it. (c) VRT-CVA-02 does not cover this: it pins the second *declaration* left intact (valid output); this deletes within one declaration (invalid output). (d) User-facing and silent: dead-at-runtime output, no signal. All four BREAK bars clear.

**4. File ownership.** Defect sits in virtualrs-owned code: `modules/virtualrs/src/utils.rs::process_import_specifier` (keeps only the first `Matched` local binding via `local_binding_to_normalize: Option<String>`; the second specifier classifies `Matched` so it is swallowed, not kept) + `apply_rewrite`/`normalize_bound_calls` (renames at most one binding's calls). Scope is virtualrs-only; the fortify stays inside `modules/virtualrs/`.

**5. Fortify boundary (allowed change).** `utils.rs` + its two consumers `cva.rs` / `css.rs` only. The fix must make EVERY matched binding's call sites resolve to the emitted canonical import (normalize all matched locals, skipping the already-canonical one) — never delete a specifier whose references survive. Internal shape changes (`ImportParts`/`RewritePlan`/`ImportCollection`, e.g. single `Option<String>` → collection of bindings) are allowed; they are module-internal. Implementation shape is the implementor's choice, constrained by `pnpm agentrs q`.

**6. Mirrors that must move together.** `css.rs` consumes the same `collect_import_parts` → `apply_rewrite` path. Single `CSS_BINDING` does not exempt it: `import { css, css as x }` is legal ESM (distinct locals) and hits the identical drop shape. Any shared-utils signature change must keep `css.rs` compiling and behavior-preserving, with a mirror pin (see §10).

**7. Sweep obligations — none, and a prohibition.** No golden sweeps. The 10 baseline-red Vitest cases must show byte-identical failure sets pre/post fortify (same cases, same diffs) — proven by running `pnpm agentrs v virtualrs` before and after. The Rust suite must stay green throughout (26/26 + new pins).

**8. Golden-movement attestation.** The ONLY golden the fortify may add is its own new pin's `output/expected.tsx`, written fresh to match post-fix code (which emits `;` — the new golden carries `;`, consistent with the Rust assertions). The fortify must NOT run `--update-goldens`, must NOT touch any of the 10 drifted goldens, and must NOT absorb or "fix" the pre-existing `;`/formatting drift as a drive-by. That drift stays red for its owner.

**9. Untouched surfaces.** `responsive/`, `replace_function_name.rs`, `constants.rs` (`CVA_BINDINGS` already correct), `native.rs` N-API boundary (thin/stable per README), N-API dist artifacts, everything outside virtualrs (tasty, atomic, atlas, core, lib, neo). The finder's banked gaps — (a) `normalize_bound_calls` substring-regex without word boundary, (b) `f64` breakpoint-width acceptance — are separate briefs, not this fortify; the fortify must not widen them (per-binding normalization reuses the existing helper as-is).

**10. Pins + stations the fortify must add.** (i) Rust unit tests in `src/tests/imports.rs` — PRIMARY station per README ("The Rust test suite should be the primary place to validate rewrite semantics"): dual-binding `import { cva, recipe }` with both call sites → both `cva(`; aliased dual `import { cva as c1, recipe as r1 }` → both `cva(`; css mirror `import { css, css as x }` → both `css(`. (ii) One Vitest case `VRT-CVA-05-dual-binding` (next free CVA id): `input/`, fresh `output/expected.tsx`, `spec.ts` gauges asserting the canonical import is present, both call sites are `cva(`, and `recipe(` is absent.

**11. Fail-without-fix bar.** New Rust pins + new VRT case must be RED on current code (red-then-green proof required; the blind repro already proves the shape) and GREEN after. `pnpm agentrs c virtualrs` green; `pnpm agentrs v virtualrs` shows the same 10 baseline failures byte-identical plus the new pin green; `pnpm agentrs q` clean on all touched files; blind repro `/tmp/doom-wave6-virtualrs-t1-dual-binding.mjs` exits 0 post-fix. Captain: dispatch a fortify crew disjoint from the finder; one commit on oracle word.

### Captain tick — 2026-09-20 (wave 6 two-found)
Wave 6 finds (r) extends-private-leak and (p) virtualrs dual-binding
drop both landed BREAK-FOUND, 1 theory each; rulings dispatched for
both, running. Finder (q) tasty still hunting. Deadlock test: all
crews producing (2 reports + 2 sections this window) — no interrupts.
Baseline flag from (p): virtualrs vitest red at baseline (10/16 `;`
golden drift, pre-existing) — ruling ordered to baseline first and
fortify must not absorb it. No commits this tick (nothing VERIFIED);
peer files untouched.

### Wave 6, find (q) — tasty-star-ambiguity-first-wins
BREAK-FOUND in tasty/resolve/exports, 1 theory spent. A name provided by two `export *` targets (ambiguous — tsc TS2308, barrel exports nothing) still resolves through the barrel: `collect_file_exports` (ast/resolve/index.rs) folds star targets first-wins, so `import { Widget } from './barrel'` gets a hard local target_id to one arbitrary source, order-dependent (flipping star order flips the bound id `_ef8d…` ↔ `_abb2…`). Violates ESM export semantics and tasty's first-class-symbol identity invariant; `diagnostics` is `[]`, only a generic duplicate-name manifest warning. Repro `/tmp/doom-wave6-tasty-star-ambiguity.mjs` (plain `node`, exit 1, fresh dist/native binding, order-flip control included). User-facing: doc links/display follow a fabricated binding. Report: `.agents/doom/logs/2026-09-20-wave6-tasty-star-ambiguity-first-wins.md`. Untried gaps banked in report (multi-hop reexport drop; star re-exporting default; cross-file typeof; enum/namespace silence). No fixes, no commits; repro + report + this section complete.

### Wave 6, find (p) — fortify landing
**Status: LANDED.** Ruling followed exactly: every matched binding's call sites now resolve to the emitted canonical import; no specifier is deleted while its references survive. Boundary held — `utils.rs` + `cva.rs` / `css.rs` + pins only; `responsive/`, `replace_function_name.rs`, `constants.rs`, `native.rs`, and everything outside virtualrs untouched; banked gaps (a)/(b) not widened (`normalize_bound_calls` reused as-is).

**Fix (module-internal shape change, allowed by §5).** `utils.rs`: `local_binding_to_normalize: Option<String>` → `local_bindings_to_normalize: Vec<String>` on `RewritePlan` / `ImportParts` / `ImportCollectionState`; `process_import_specifier` pushes EVERY matched binding (was: keep-first, swallow-rest); `apply_rewrite` normalizes each binding in turn via the existing helper. `cva.rs` / `css.rs`: `Option::filter` → `into_iter().filter().collect()` skipping the already-canonical local (`cva` / `CSS_BINDING`), so single-binding behavior is byte-identical. `ImportCollection::Matched` per-specifier payload unchanged. Consumer audit: only `cva.rs` / `css.rs` use this path (grep-verified).

**Pins (§10).** (i) Rust `src/tests/imports.rs`: `normalizes_both_bindings_of_a_dual_cva_import` (`{ cva, recipe }` → both `cva(`), `normalizes_both_bindings_of_an_aliased_dual_cva_import` (`{ cva as c1, recipe as r1 }` → both `cva(`), `normalizes_both_locals_of_a_dual_css_import` (`{ css, css as x }` → both `css(`). (ii) Vitest `VRT-CVA-05-dual-binding` (next free CVA id): `case.json` + `input/input.tsx` + fresh `output/expected.tsx` (carries `;`, matching post-fix emitter + Rust assertions) + `spec.ts` gauges (canonical import present, exactly 2 `cva(`, `recipe(` absent) + `README.md`.

**Fail-without-fix / pass-with-fix (firsthand).** Blind repro `/tmp/doom-wave6-virtualrs-t1-dual-binding.mjs`: exit 1 pre-fix (2 FAIL) → exit 0 post-fix (3 PASS, fresh binding). 3 Rust pins: FAILED pre-fix (`0 passed; 3 failed; 26 filtered`) → ok post-fix. VRT-CVA-05: FAILED pre-fix (`1 failed | 16 skipped`) → passed post-fix (`1 passed | 16 skipped`). Aliased + css-mirror probes through the live N-API binding: both GREEN.

**Baseline arithmetic (no drift absorbed).** Baseline established firsthand on a virtualrs-clean tree: `pnpm agentrs c virtualrs` 26/26 GREEN; `pnpm agentrs v virtualrs` RED 10 failed / 16 — failures exactly VRT-CSS-01/02, VRT-CVA-01/02/03, VRT-FN-01/02, VRT-RESP-01/02/05 (matches ruling §2). Post-fix: cargo 29/29 GREEN (26 + 3 pins); vitest 10 failed / 7 passed (17) — same 10 cases, and the normalized full-output diff vs baseline is EMPTY (byte-identical failure sets modulo timings + the new green case). `--update-goldens` never run; zero existing goldens touched; only added golden is the new pin's own `expected.tsx`. 2 cargo warnings are pre-existing unused imports in `responsive/mod.rs` (untouched surface). `pnpm agentrs q`: 0 violations on all touched files + new station; 1 `collect_import_parts` cognitive-17 warning proven pre-existing (identical on HEAD copy).

**Files (mine only, 9 + this section).** `modules/virtualrs/src/utils.rs` (collect-all + normalize-all), `src/cva.rs` + `src/css.rs` (filter-collect), `src/tests/imports.rs` (3 pins), `tests/cases/VRT-CVA-05-dual-binding/` (case.json, input/input.tsx, output/expected.tsx, spec.ts, README.md). No commits (captain commits on chain-review VERIFIED); finder report untouched.

### Wave 6, find (q) — architecture ruling

**Verdict: BREAK (in-bounds).** Tasty scope only — every file judged below
is `packages/reference-rs/modules/tasty/`-owned (ownership verified
firsthand; no other module adjudicated).

**Failure mode, reproduced blind by this architect.** Ran the finder's
`/tmp/doom-wave6-tasty-star-ambiguity.mjs` unmodified: exit 1.
`Use.w` emits `{"id":"_ef8d2136fd30c930","name":"Widget","library":"user"}`
— a hard local binding — where ESM says the barrel exports nothing;
flipping the star order flips the id to `_abb29de16163f27f` (first-wins
order dependence, confirmed); `bundle diagnostics` is `[]`; the only
signal is the manifest's generic duplicate-name warning (about global
name lookup — names no barrel, no export map, no reference).
Independent cross-check, same fixture, repo tsc: `error TS2308: Module
'./a' has already exported a member named 'Widget'` on the barrel, exit
1. Code read confirms the mechanism: `collect_file_exports`
(`ast/resolve/index.rs:196-206`) folds star targets with
`entry().or_insert()`; the folded map feeds `resolve_import_target_id`
(`resolver/resolve.rs:36-48`); the emitter hardens any `target_id` into
a local descriptor (`generator/symbols.rs:247-261`, id `_<16hex>`),
while the unresolved path (`external_reference_descriptor`, id echoes
name) already exists and is the correct shape for an absent binding.

**Violated contracts (stated, not inferred):** (1) tasty README line 3 —
"ESM chunk artifact generation engine": ESM star-ambiguity means the
name is absent from the barrel, yet tasty binds the consumer's import
to one arbitrary source. (2) First-Class Symbols invariant (README:17)
— "identity, module boundaries, and stable canonical IDs": the emitted
`target_id` is fabricated identity, nondeterministic across author
order. CURIO rejected: first-wins is undocumented (no comment at the
fold), unpinned (no test asserts it), and contradicts both contracts;
the generic warning does not cover the barrel/map/reference; modeling
ESM export maps is tasty's core physics, not a type-checker luxury.
In-bounds: complete static TS, no will-never-work shape, idiomatic
index-barrel authorship, user-facing (doc links, display members,
projections all follow the fabricated binding).

**Fix direction (binding): EXCLUDE + DIAGNOSE (refuse-with-diagnostic).**
Keep-first-plus-diagnostic is ruled OUT — any kept binding still serves
a reference ESM says does not exist, preserving the identity violation.
In `collect_file_exports`: track star-provided names per file; when two
star targets provide DIFFERENT symbol ids for the same name, drop the
name from that file's export map (ESM absence — the consumer import
then stays unresolved via the existing external descriptor) and push
one `ScannerDiagnostic` (`{ file_id, message }`, `model.rs:247`) naming
the barrel file, the ambiguous name, and the competing sources. Three
edge rules: (a) same symbol id through multiple stars (diamond
re-export) is NOT a conflict — ESM same-binding rule, must keep
resolving; (b) explicit local and named-re-export bindings (seeded
before the star fold today) keep shadowing stars — seeding order
preserved; (c) single-append — the fold runs twice per file
(`build_export_index` cache + `build_file_exports` cache), so dedupe
keyed by (barrel file_id, export name); exactly one diagnostic lands.
The diagnostic rides `ParsedTypeScriptAst.diagnostics` end to end
(graph → bundle → manifest warnings + `out.diagnostics`), the same
channel as the M1–M3 precedent — no new plumbing. Mirrors: NONE — the
single fold feeds both `export_index` (reference resolution) and
per-file `file_exports` (graph exports); one fix covers both; fortify
must not split the paths.

**Pins + station the fortify must add.** Primary: Rust unit pins in
`src/tests/resolve.rs` (the `workspace()` + `extract_ast` +
`resolve_ast` harness, mirroring the M2/M3 pins): (a) ambiguous star
name absent from the barrel's `graph.exports`, consumer member
`target_id == None`, exactly-1 diagnostic naming barrel + `"Widget"` +
both sources; (b) diamond same-id negative — resolves, zero
diagnostics; (c) explicit-local-shadows-star negative — resolves, zero
diagnostics. Secondary: extend the EXISTING `TST-RXP-02-reexport-edges`
station (its README owns barrels + re-export edges) — add the
ambiguous-barrel + consumer input, assert the unresolved external
descriptor (id == name) via API, barrel-export absence, and the
surfaced diagnostic. No new case. Docs: one line in
`ast/resolve/README.md` Responsibilities recording the star-ambiguity
rule (same style as the M1–M3 line).

**Fail-without-fix bar.** New Rust pins + extended station assertions
must FAIL on current code (name present in the export map; consumer
bound to a local `_<hex>` id; diagnostics empty) and pass after; the
blind repro must flip exit 1 → 0 with non-empty diagnostics as the loud
signal. Chain review re-runs the unmodified repro + both suites.

**Sweep + golden-movement rules.** Baselines green this session:
`pnpm agentrs c tasty` 65/65, `pnpm agentrs v tasty` 82/82 (5 files).
Fortify re-runs both + `pnpm agentrs q` on touched files. Golden
movement: none expected — grep shows zero bare `export * from`
fixtures in any station input (RXP-02 carries only `export * as`,
a named-export path that never enters the star fold) — but the full
suites are still mandatory since the fold feeds every file's map. Any
moved golden attested per pair (intended symbol/diagnostic only, zero
removals); no blanket `--update-goldens`.

**Untouched surfaces.** Scanner/discovery; generator emission shapes;
JS runtime API; the global duplicate-name manifest warning;
`export * as` path; the resolve README boundary lines. The four banked
gaps (multi-hop reexport drop; star re-exporting `default` — note: ESM
star never re-exports default, explicitly OUT of this fortify;
cross-file typeof; enum/namespace silence) each need their own red test
per "no repro, no break" — not absorbed. No implementation by this
oracle; no fixes, no commits; repo runners only.

### Wave 6, find (p) — chain review

**Verdict: VERIFIED (commit-ready).** Whole arc re-verified firsthand by
this oracle; no implementation, no fixes, no commits. (p) files only —
write-set audited via `git status` paths: exactly `utils.rs`, `cva.rs`,
`css.rs`, `tests/imports.rs` modified + new `VRT-CVA-05-dual-binding/`
(all `modules/virtualrs/`-owned, matching the landing's 9-file list);
`docs/ATOMIC.md`, `docs/missions/README.md`, the (q)/(r) doom reports,
and `operation-jettison/reaper.md` are peer-owned (0 `virtualrs`
mentions in the peer doc diffs) — read-only, never adjudicated.

**1. Finder repro** (`/tmp/doom-wave6-virtualrs-t1-dual-binding.mjs`,
unmodified): exit 0, 3/3 PASS on the post-fix binding (`const b =
cva({})`, no dangling `recipe(`) — both bindings' call sites
normalized. Fail-without-fix proven in the swap window below (exit 1,
output byte-identical to the finder's report).

**2. Suites** (repo runners, this session): `pnpm agentrs c virtualrs`
29/29 green (26 + 3 new pins); `pnpm agentrs v virtualrs` 17 tests, 10
failed / 7 passed — failures exactly the ruling-§2 baseline set
(VRT-CSS-01/02, VRT-CVA-01/02/03, VRT-FN-01/02, VRT-RESP-01/02/05),
green are the 5 no-op cases + meta + new VRT-CVA-05 (also green in
isolation: 1 passed / 16 skipped). `pnpm agentrs q` on all touched
files + new station: 0 violations, 1 warning (`collect_import_parts`
cognitive-17) proven pre-existing — byte-identical warning on the
stashed-HEAD copy during the swap window. The 2 cargo warnings are the
landing's noted pre-existing `responsive/mod.rs` unused imports
(untouched surface).

**3. Baseline discipline (established myself, nothing absorbed).**
Swap window announced, fix-only stash (`utils.rs`+`cva.rs`+`css.rs`,
pins+station kept), binding rebuilt per side via `ensure-native`,
bytes restored after (sha256 prefix==restored on all 4 tracked
files): baseline cargo 26 passed + exactly the 3 new pins FAILED;
baseline repro exit 1 with the original dangling `recipe({})`;
baseline vitest 11 failed = the same 10 + VRT-CVA-05 red at its own
gauge (`expected [ 'cva(' ] to have a length of 2 but got 1`). All 10
pre-existing failure bodies are byte-identical baseline-vs-postfix
(normalized only timings + the `[N/11]`-vs-`[N/10]` counter artifact);
every one fails at `assertGoldens` (`;`/formatting drift, gauges
pass). The drift stays red for its owner: zero existing goldens
touched (`git status` clean under `tests/` except the new station),
`--update-goldens` effects absent.

**4. Diff review (line-by-line, (p) write-set):** `utils.rs` —
`Option<String>` → `Vec<String>` on `RewritePlan`/`ImportParts`/
`ImportCollectionState`, `process_import_specifier` pushes EVERY
matched binding (was keep-first/swallow-rest), `apply_rewrite` loops
the existing `normalize_bound_calls` per binding; `cva.rs`/`css.rs` —
`Option::filter` → `into_iter().filter().collect()` skipping the
already-canonical local (`cva`/`CSS_BINDING`), so single-binding
behavior is byte-identical (all 26 old Rust pins green, incl.
`rewrites_only_the_first_matching_runtime_import` = VRT-CVA-02
second-declaration semantics intact). Consumer audit: only
`cva.rs`/`css.rs` touch this path (grep); `ImportCollection::Matched`
payload unchanged; `normalize_bound_calls` byte-untouched (no diff
hunk — banked gap (a) not widened, gap (b) untouched);
`responsive/`, `replace_function_name.rs`, `constants.rs`,
`native.rs`, and everything outside virtualrs untouched — inside the
ruling-§5 boundary. No test weakened: `imports.rs` is a pure +36
addition, no existing spec/golden modified. Golden movement: exactly
one ADDED golden (VRT-CVA-05 `output/expected.tsx`, carries `;`
matching the emitter + Rust assertions, passes golden comparison) —
attested, not swept.

**5. Contracts hold.** README §CVA Transformation ("rewriting both the
import declarations and the call sites to ensure canonical `cva`
usage") now holds for dual bindings; VRT-CVA-03 semantics
(`recipe`→`cva(`) hold when `recipe` shares its declaration (live
single-recipe control green); compiler self-consistency restored — no
specifier deleted while references survive. Controls
(`/tmp/chainrev-p-controls.mjs`, 9/9 green on the live binding):
aliased-dual (`c1`/`r1` → both `cva(`, single canonical import),
css-mirror (`css`+`css as x` → both `css(`), single-`cva` stability,
single-recipe normalization, unrelated-import byte-unchanged
(VRT-CVA-04 semantics), type-only unchanged. Captain: commit the (p)
write-set (4 `.rs` + new VRT-CVA-05 dir + report + log sections);
`dist/` is untracked build output, nothing to commit there.

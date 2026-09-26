# Splitter FEATURES — Cluster B Log

Crew: Splitter FEATURES cluster B (engine). Branch: reference-system (never switch, never commit).
Base: d1d811b3d Splitter FEATURES-A (required value, min/max, DOM order, no root disabled).
Scope: #3 measured CSS-length constraints, #4 CSS-variable geometry, #5 pointer-session frame budget,
#8 drag denominator = Panel-axis sum, #6 collapse restore memory + dynamic panels, #7 disabled/blocked
Handle determinism, #9 strict structural anatomy errors. HOLD #11 untouched.

## Timeline
- START cluster B (base d1d811b3d)

## Cluster B — engine, attempt 2 (2026-09-26)

Branch: reference-system (stay; never switch; never commit). Cluster A committed underneath (required value, min/max, DOM-order, no root disabled).

Scope (IMPLEMENT ONLY): #3 measured CSS-length constraints (SSR unconstrained, resolve post-mount; parse failure = dev diagnostic + ignore), #4 CSS-variable geometry contract (pixel-identical), #5 pointer-session frame budget (SP-PERF-01–07; joint #3/#4), #8 drag denominator = Panel-axis sum (ships with #3), #6 collapse memory (MUST-recover keyed by stable Panel id; draft invalid-tree diagnostic for HQ wording check), #7 Handle determinism (focusable-but-inert), #9 strict structural errors (THROW fail-fast). HOLD #11 untouched.

Plan:
1. Survey Splitter dir (SPEC/DECISIONS/TESTS, Splitter.tsx, splitter-math.ts, contract test, e2e) incrementally with log lines between reads.
2. Implement #9 (throw fail-fast) + #8 (denominator) + #3 (measured constraints) + #4 (CSS vars) + #5 (session frame budget) as one drag/geometry engine delta; then #6 (collapse memory by id) + #7 (focusable-but-inert).
3. Prove: pnpm agentct Splitter (unit+e2e green); SP-PERF-01–07 evidence; geometry pixel-identical (view-story + UX sign-off on any drift, else STOP/flag).
4. UX review via nested ux-designer (or self-review by method + flag if pool-full).

### Checkpoint 1 — brief read, plan filed (attempt 2 start)
- Read: features-triage Splitter section (12 items; #11 HOLD, rest IMPLEMENT-NOW), Splitter/FEATURES.md, docs/MISSIONS/API-STANCE.md.
- Tree state: attempt 1 stalled at startup, zero output, tree clean (per brief; will verify with git status).
- Next: incremental survey of Splitter dir.

### Checkpoint 2 — SPEC read
- SPEC: cluster A landed (#1/#2/#10/#12); cluster B owns #3–#9 engine deltas. Seams named: `toSolverConstraints` (#3), flexBasis→CSS vars (#4), React-per-move drag (#5), SP-PERF-01–07 unproven, SP-DYNAMIC/SP-COLLAPSE remainder open.
- Other crews have uncommitted work (Combobox/NumberField/Tabs) — read-only for me; Splitter dir clean; HEAD d1d811b3d (cluster A).
- Next: read Splitter.tsx.

### Checkpoint 3 — Splitter.tsx read (1097 lines)
- Root: DOM-order registration (panels/handles sorted by compareDocumentPosition), dev-only validateLayout/validatePanelConstraints warnings (#9: escalate to throw), memory keyed by array position (#6: rekey by stable id), keyboard session commits per key (#5 scope: keys? FEATURES says zero commits "until pointerup" — keyboard sessions commit via onChange which is parent-controlled; session architecture is pointer-focused), pointer session: origin capture + origin-relative solve + onChange per move, setState isResizing at down/up only — BUT onChange per move triggers parent re-render → child re-render per move unless parent memoizes; #5 wants CSS-var ref writes + single onChange... FEATURES #5 says "a single onChange" — need TESTS.md SP-PERF-01–07 for exact contract.
- Panel: flex={`0 0 ${size}%`} + flexBasis inline (#4: switch to CSS var).
- Handle: tabIndex -1 when disabled (#7: focusable-but-inert → tabIndex 0 + aria-disabled + inert). No computed-infeasibility detection yet.
- Denominator: containerSize = full rect (#8: Panel-axis sum, Handles excluded).
- Next: read splitter-math.ts.

### Checkpoint 4 — splitter-math.ts + splitterStyles.ts read
- Math: solver ported; parseCssLengthToPx (px/rem/em/r; % handled by caller) + resolveConstraintToPercentage exist, unwired — #3 seam confirmed. validateLayout/validatePanelConstraints return {valid,error} (#9: escalate call sites to throw). validatePanelConstraints already rejects malformed measured strings.
- Next: read TESTS.md (need SP-PERF-01–07, SP-COLLAPSE/SP-DYNAMIC, structural cases).

### Checkpoint 5 — TESTS.md read (788 lines)
Key contracts: freeze #2 (strings vs Panel-axis sum), #6 (Panel var + Root --1..N, flex 1 1 var), #10 (session: capture once, per-move solve+ref writes, zero commit/layout-read/convert/ARIA; ARIA on keyboard/up/idle). SP-DOM-02 throw-before-anything (#9), SP-DOM-08 tabIndex0+aria-disabled incl. infeasible (#7), SP-DOM-09/12/13 vars (#4), SP-KEY-06 blocked keys, SP-COLLAPSE-05/06 id-keyed MUST-recover (#6), SP-DYNAMIC-01/02/03 (RO idle, transient-invalid diagnostic), SP-PERF-01–07 (#5), SP-COMP-02/03/04.
Design sketches: #9 throw post-registration-settle via state+render-throw (boundary-catchable, nothing remains); #3 resolved-constraints state (numbers live, strings captured at down/idle-RO); #8 denominator = Σ panel offset sizes on axis; #4 render vars + session ref writes + up snap-back + ARIA freeze during session; #6 Map<id,size> never cleared on unregister; #7 solver-probe feasibility (±100), always tabIndex 0.
Next: contract test + DECISIONS.md.

### Checkpoint 6 — contract test + DECISIONS read
- Contract test pins SSR `flex-basis:50%` + client `style.flexBasis` + the "until FEATURES #3" fallback diagnostic — all three MUST change with #3/#4 (allowed: inside Splitter dir). Plan: SSR asserts `--reference-splitter-panel-size:50%`, no flex-basis, no warning with measured strings; client asserts vars; fallback test becomes silent-defer (zero-size) + new invalid-string diagnostic test.
- DECISIONS is context/provenance only; no new decisions needed there. Walkthrough notes are stale (cluster A landed) — leave; SPEC status is the live record.
- Next: read CT spec (fixtures/helpers + what's pinned).

### Checkpoint 7 — CT spec read (1440 lines)
- Fixtures mount from Splitter.story.tsx (`components/Splitter/Splitter/<Name>`). Drag math pinned: 40px = 10pt (400px container box) across ~10 tests — #8 changes denominator to panel-axis sum, so fixture geometry + display formatting (next read) decide whether distances or fixtures change.
- Pinned-vs-decided conflicts to update in-spec: A11y sweep asserts disabled tabIndex -1 (→ 0 + aria-disabled per #7).
- snap() screenshots: resting/hover/focus/resized/vertical — flex-recipe change may drift ≤1px; run first, then view-story + UX sign-off if drift.
- Next: read Splitter.story.tsx (fixtures, widths, display formatting).

### Checkpoint 8 — story read (798 lines)
- Frames: 100r=400px (1r=4px), raw-value Layout displays. #8 denominator = 400-1 = 399 (1 handle) / 398 (ThreePanel) / inner-vertical 239 → exact legacy drag assertions break UNLESS displays round. DECISION (option F): Math.round the Layout instrument lines (pane labels already round; snapped states are keyboard-exact so no snapshot text change); prove #8 by a dedicated exact-fractional test via raw request logs. Verified every legacy drag assertion still rounds green (incl. the DirToggle .025 cancellation and clamp-exact cases).
- CONFLICT FOUND: Lifecycle fixture removes the Handle mid-drag (consecutive Panels) and expects clean cancel — under #9 THROW this becomes a structural error. Resolution: throw + boundary catches + session cleanup on unmount still satisfies "no stranded resources"; update that slice to assert diagnostic + cleanup + boundary-reset recovery. Same flow serves SP-DYNAMIC-03 (diagnostic = throw message; recovery = reset).
- #9 design (refined): validate in Root layout effect AFTER child registrations (child-first ordering) → structureError state → throw during next render (pre-paint; boundary-catchable; terminal for that mount). Handles atomic dynamic updates (effects see final state). No settled flag needed.
- Next: book + Splitter.md + PATCHES + math tests + index + snapshots inventory.

### Checkpoint 9 — survey complete (Splitter.md + math tests)
- Splitter.md IS the freeze narrative and matches the plan (session rules, RO idle, id-keyed memory, focusable handles). Math unit tests already pin SP-MATH-01–12 pure.
- Full implementation + test plan filed in working notes (see next checkpoints for execution). Fixture plan: round Layout instruments; new Measured/MeasuredVertical/Dynamic/Blocked/StructureErrors/PerfRejected/DelayedEcho/InnerGrid fixtures; Lifecycle boundary rework for handle-removal-throw. Out of scope (left [ ]): SP-DOM-04/06/07/10/11, SP-KEY-01/03 titles, SP-ENV-02/03/04 (no matrix home).
- Next: verify Div style/custom-prop passthrough + CT mount signature (read-only outside Splitter dir).

### Checkpoint 10 — implementation plan locked, starting engine work
- mount(story, props) + update() supported → prop-driven fixtures possible. No custom-prop precedent in lib; will use a small cast helper.
- #8 denominator DECISION: container content box minus handle flex footprints (offset + computed margins). Equals panel-axis sum in the no-overlap model (SP-MATH-11: 516-16=500 ✓); exact under sub-pixel rounding where Σ panel offsetWidths is not (engine-dependent .5 rounding). Fixture math: 400-1=399, 400-2=398, inner-vertical 240-1=239.
- Validator alignment: allow unitless "0" + case-insensitive units (resolver already accepts); sanitize non-finite/negative numerics to default bounds in the #3 seam (diagnostic still via validator).
- Constraint validation switches from resolved-numerics to RAW props (single call) so invalid string formats actually warn.
- Order: math → Splitter.tsx → unit → contract → story → CT → agentct → view-story/UX → SPEC.

### Checkpoint 11 — engine implementation complete (Splitter.tsx + splitter-math.ts)
- Math: isMeasuredLength (unitless-0 + case-insensitive alignment), validateSplitterStructure (pure, HQ-draft messages), isHandleBlocked (solver probe), measureAvailableGroupSize (content box minus handle footprints); resolver ignores negative lengths.
- Splitter.tsx: #3 measured pipeline (idle/resize/capture resolution, silent SSR+zero-size defer, parse-failure diagnostic via raw-prop validator, live numerics + captured strings in session); #4 panel var + flex 1 1 var + root indexed vars + session ref writes + snap-back; #5 one-capture session, ARIA/blocked freeze, zero per-move commit/read/convert/ARIA; #8 denominator; #6 id-keyed memory surviving unregister; #7 focusable-but-inert (tabIndex 0 always, aria-disabled explicit+probed, inert keys/drag, focus visuals kept); #9 layout-effect validation + render throw (terminal per mount).
- Next: typecheck, then unit tests.

### Checkpoint 12 — tests written, running full proof
- Unit green 31/31. Story: 13 displays rounded + Lifecycle boundary + Nested memo/sibling + CollapsibleDemo raw log + Rejecting echo + 9 new fixtures (StructureErrors, Dynamic, Blocked, Measured, MeasuredVertical, MeasuredR, PerfRejected, DelayedEcho, InnerGrid).
- CT: A11y sweep → focusable-but-inert; Lifecycle removal slice → throw+recover; 19 new tests (SP-DOM-02/08/09/12/13, SP-KEY-06, SP-DYNAMIC-01/02/03, SP-COMP-02/03/04, SP-DRAG-03, SP-COLLAPSE-04-drag/05/06, SP-PERF-01–07, SP-CTRL-01/02/04/05).
- Next: pnpm agentct Splitter full.

## Cluster B — engine, attempt 3 (finisher, 2026-09-26)

Verified attempt-2 dirt intact (6 Splitter files; HEAD moved on with other crews' FEATURES-A commits; Calendar/Combobox dirt is other crews' — read-only). Continued, no redo.

### Checkpoint 13 — full proof: 57/64, 7 failures triaged
- `pnpm agentct Splitter`: unit 31/31 green; e2e 57/64. Failures: SP-DRAG-09 (removal slice), SP-DRAG-03, SP-COLLAPSE-06, SP-DYNAMIC-03, SP-PERF-04, SP-CTRL-02, SP-CTRL-04.
- Triage: 1 engine bug (COLLAPSE-06 restore memory), 6 test bugs (helper artifacts + wrong expectations). Engine up-resolve behavior KEPT (re-solve at lift = true final position under move coalescing; identical to last-candidate for real pointers via dedupe).

### Checkpoint 14 — COLLAPSE-06 root cause (engine bug, #6)
- Probe (temporary window buffer + focused `-g` run, then removed): the reorder commit runs the restore-memory effect with a STALE registry ([a,b,c] × fresh value [60,5,35]), poisoning mem[A]=60; a later commit re-sorts but too late. Enter then targets 60, C clamps at default min 5 → [60,35,5] instead of [60,30,10].
- Fix in Splitter.tsx: (1) new Root layout effect syncs DOM order every commit (sort + conditional partsRevision bump, pre-paint) BEFORE the memory effect; (2) memory effect reads entry-owned collapsible/collapsedSize instead of positional render-time tables.
- Key-preserving reorder moved parts without (un)registering, so nothing ever re-sorted — this closes the class, not just the symptom.

### Checkpoint 15 — test fixes (6)
- SP-DRAG-09: after the #9 throw the boundary unmounts the tree → `resizing: undefined` (doc lock still asserted clean).
- SP-DRAG-03: same-story `mount()` reconciles and keeps state → `unmount()` between runs for fresh [70,30].
- SP-DYNAMIC-03: hide-B also leaves 3 values over 2 Panels; validator reports the value/Panel mismatch first → expect that diagnostic (still local fail + restore).
- SP-CTRL-02 / SP-PERF-04: synthetic gestures must lift where they finished — `dispatchPointer` recomputes from the live (moved) handle rect, so the up landed +100 (CTRL-02) / at origin (PERF-04, real mouse never moved). Absolute-xy lift + real-mouse move to the finish point.
- SP-CTRL-04: keyboard setup key ends its own session → snapshot end-count, assert the no-op drag adds none (engine already silent: changes assertion was green).

### Checkpoint 16 — FULL GREEN + bookkeeping + UX sign-off
- `pnpm agentct Splitter`: E2E 64/64, unit 31/31. 7 visual baselines byte-unmodified → zero pixel drift → per rule, NO view-story pixel check (flagged, not run by me; the UX reviewer independently captured live Book states as its own method).
- SPEC.md: status 72/83 (was 47), CT 64 (was 37), unit 31 (was 18); cluster-B landed section; case index updated; remaining 11 = SP-DOM-04/06/07/10/11, SP-CTRL-03, SP-KEY-01/03, SP-ENV-02/03/04 (out of scope, no matrix home). HOLD #11 recorded untouched.
- Nested ux-designer review: APPROVE — look PASS (pixel-identical baselines + live captures), all 7 feel changes approved (#7 an enhancement: disabled separators now discoverable), no blocking a11y findings (mid-drag ARIA freeze noted acceptable). Artifacts: `.reference-ui/captures/Splitter_*` + CT test-results.
- Scope held: Splitter dir + this log only. No branch switch, no commit.

DONE: cluster B #3–#9 landed. Items: 7/7 engine items proven. Blocked: none. Flagged: (1) view-story pixel check skipped per no-drift rule; (2) 11 TESTS.md IDs remain for a future crew (env/composition need a matrix home).

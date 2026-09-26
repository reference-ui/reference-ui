IN PROGRESS — Combobox reconciliation (quarantine-landing mission)
Crew: Combobox crew lead | Branch: reference-system (never switch; quarantine tip 89850d1c8 via git show/diff/log only; never commit)

## Scope
- Touch ONLY: packages/reference-lib/src/components/Combobox/ + this log.
- Confirmed dir name: `Combobox` (capital C) under packages/reference-lib/src/components/.
- Accordion crew concurrently editing ONLY Accordion dir — no overlap.
- Context: Overlay (Objective B) verified NO-OP — build on Overlay/useOverlay/OverlayContentProps/OverlayDismissHandlers/overlayStackStore as-is.
- Mission law: port ONLY stability + test-case wins from quarantine; look-and-feel/visual changes are SUSPECT; preserve current visuals AND current API (no controlled-only rewrites, no API removals, no uncontrolled-mode deletions).

## Sibling handoffs (inbound)
- Listbox crew: LB-CB-01/02/04 browser proof + CB-04 highlight-timing pixels.
- RovingFocus crew: CB bridge + TR-CB cases + COMP-03 (Combobox territory, not ported by them).
- Field crew: COMP-02 publish + COMP-04 commit/remove flows (Combobox-owned per TESTS.md).

## Progress
- Baseline `pnpm agentct Combobox` BEFORE changes: Unit 5/5, E2E 2/2 (react19). Green.
- Current `Combobox.tsx` is 1 line off quarantine base `7aea45265` (prototype + story/CT added since). TESTS.md (847 lines, 96 IDs) unchanged base→quarantine→HEAD: stable contract.
- Quarantine `c6fae977a` source (1553 lines) is a controlled-only rewrite (`defaultOpen` deleted, book/tests re-targeted to `open`+`onOpen`/`onDismiss`) + new props (`autocomplete`, `allowCustomValue`, `closeOnBlur`, `loading`, `virtualFocus`/grid/`VirtualItem`, Tree bridge, `onEscape`) — the rewrite is SUSPECT per mission law (controlled-only rewrites forbidden; an Accordion arc was rejected for exactly this). NOT porting the rewrite.
- Nested digest workers (2, read-only): Q-unit 47 its → 23 PORTABLE / 12 NEEDS-FIX / 12 BLOCKED; Q-e2e 50 tests → 29 PORTABLE (9 vacuous-as-written, will strengthen or skip) / 12 NEEDS-FIX / 9 BLOCKED. Full digests in /tmp/cbq/DIGEST-{UNIT,E2E}.md (child session logs, kept out of repo).

## Port plan (stability + test-case wins only; API + visuals preserved)
Source (all in-dir, no API/visual touch):
1. Stale/fabricated activedescendant: drop `ref-opt-` fallback → mounted-only ID (CB-DOM-05/NAV-07).
2. Spread-order clobbering: rest-first + compose user refs + strip type-forbidden value/defaultValue with dev diagnostic (CB-DOM-07/11).
3. IME composition guard in Input keydown (CB-EDIT-05/09).
4. Stable popoverId + aria-controls on Input/Trigger + activedescendant on Trigger (CB-DOM-03/06, SELECT-01 linkage).
5. Dev-only anatomy diagnostics: exactly-one focus source, at-most-one Popover (CB-DOM-08; also the "existing XOR diagnostic" FI-COMP-04 names).
6. Closed-Escape untouched (CB-REVERT-04); open-Escape reverts to committed text + dismisses (CB-REVERT-01).
7. Home/End/PageUp/PageDown native in editable Input (CB-EDIT-03/CB-NAV-04; rewrites colocated t4 which pins prototype nav).
8. readOnly/per-element-disabled sources never request open (CB-OPEN-08).
Tests: ~35 new colocated its (incl. uncontrolled-mode pins + SSR/StrictMode/bounded-registry) + ~24 new CT specs over ~13 new stories (handoff proofs: LB-CB-01/04+pixels, FI-COMP-04 token flows) + 1 new snapshot (LB-CB-04 highlight, human-gated).
SPEC.md: honest [x] accounting (in-dir proof only).

## Deliberately NOT ported (SUSPECT / feature / cross-crew)
- Controlled-only rewrite, autocomplete/allowCustomValue/closeOnBlur/loading props, virtualFocus/grid/VirtualItem, Tree bridge, onEscape/cancelable-request API, Trigger keyboard/typeahead (needs activeSource+typeahead machinery), blur-close (naive version breaks pointer commit; needs closeOnBlur machinery), OPEN-03 content gate (incompatible with Overlay unmount-when-closed), COMMIT-02/05/07 match-aware Enter/Tab revert (needs custom-value decision semantics), NAV-05 leave-clears (Listbox-owned `handleMouseLeave`, Listbox crew COMPLETE), vacuous e2e titles (CLOSE-03/05, ENV-03/04, COMP-01/02/03/04 as-written assert nothing — will not enshrine).
- Handoff gaps: LB-CB-02 windowed (needs virtualFocus); TR-CB-01..06 + CB-COMP-03 (need Tree bridge; Tree crew IN PROGRESS, RF "CB bridge" handoff never materialized — RF log COMPLETE with no such item); CB-COMP-02 (needs autocomplete modes).

## Surprises
- Unit 41/41 green after 3 fix rounds (12 → 6 → 0 failures).
- (1) First-render registration gap: options register in effects after first render, and `setActiveValue(value)` with unchanged value bails out — so nothing re-rendered the input and the fabricated `ref-opt-` fallback was masking the gap. Ported Q's `optionsVersion` bump in register/unregister (essential, not optional). Verified no render loop (memoized context identity settles).
- (2) React listens to `focusin`, not `focus` — synthetic `FocusEvent('focus')` never reaches `onFocus`; tests dispatch `focusin`. (Also caught OPEN-08 passing vacuously before the switch.)
- (3) Q's bare-return IME guard has a hole: Escape during composition bubbles to Overlay's document-level dismiss listener. My port adds `stopPropagation()` (no `preventDefault` — the IME keeps its native cancel) per CB-EDIT-05/09.
- (4) Probe-verified the Neo `Input` primitive forwards `onCompositionStart` (scratch test, deleted after).
- (5) DOM-01 transparency needs a Field-less fixture — the Field bezel is expected chrome, not a Combobox host.
- (6) CT round 1: 19/25. OPEN-08 caught a real gap in my own fix (ArrowDown ignored readOnly — now matches Q's `isDisabled || isReadOnly` guard; colocated test strengthened too).
- (7) NAV-08 traced a hover-during-open race (+2 arrow drift): an unconstrained 1078px popover overlapped the input so the resting cursor hover-activated opt-01/02 nondeterministically. Fixed with a real `style` maxHeight (Listbox ignored the `maxH` style prop — `maxHeight: none` computed) + parking the cursor off-fixture + asserting null-start. Also explains a racy close (page scroll under a giant popover hits closeOnScroll).
- (8) CLOSE-02 traced a modal-parent auto-focus at mount (child already open) + click-toggle churn. CB-CLOSE-02 only needs branch registration, not modality (modal+shadow is blocked CB-COMP-04) — story parent is now `isolation={false}`, deterministic.
- (9) CLOSE-01: open popover covers the log display — outside clicks target fixture padding (6,6).
- (10) ControlledLog story now applies the committed label to controlled input on onChange (book pattern) — required for EDIT-08 fill.
- (11) `--react all`: 17/18 failed FI-COMP-04 focus — ref-as-prop is React 19-only, so user refs silently died on 17/18. Converted Input/Trigger to `forwardRef` (Field + quarantine pattern). 75/75 green; tsc clean.
- (12) `toHaveAttribute(name, string|null)` fails tsc overloads — added `expectActiveDescendant` helper in CT.

## Visual check (view-story via pnpm capture fallback — MCP pipe broken)
- Searchable: resting bezel correct; open shows React highlighted+checked; ArrowDown moves solid highlight to Vue (React keeps check); Escape closes. Focus ring visible throughout.
- SelectOnly: trigger button w/ ring; open popover correct; click Vue commits ("Selected framework: vue"), closes.
- Captures: `.reference-ui/captures/Combobox_{Searchable,SelectOnly}_*.png`. Note: default capture crops to story root and cuts the portalled popover — used `page.locator('body')` framing.
- 6 frozen CT snapshots green unmodified; 1 new baseline (`combobox-lb-cb-04-highlight.png`) eyeballed: input "alpha", Alpha checked, Bravo solid-highlight — correct LB-CB-04 pixels.

## Proof (final, this session)
- `pnpm agentct Combobox`: Unit 41/41, E2E 25/25 (react19, snapshots green).
- `pnpm agentct Combobox --e2e --react all`: 75/75 (17/18/19 behavioral).
- `tsc --noEmit -p packages/reference-lib`: zero Combobox errors.
- 6 frozen snapshots byte-unmodified per git status; 1 new baseline (human-gated).

## UX review (nested ux-designer, subagent 01a0daba) — SIGN OFF
- Look: PASS, nothing moved (6 frozen baselines viewed + fresh captures + source diff has zero style-path changes).
- Feel: all 9 behavior changes APPROVED (mounted-only IDs; rest-first+forwardRef+strip; IME guard; additive ARIA; dev diagnostics; Escape revert/untouched; native Home/End/PageUp/PageDown per CB-EDIT-03/CB-NAV-04; readonly/disabled guards; mounted-only Enter/Tab commit).
- A11y: strictly improved (no dangling IDs, controls linkage, Trigger active state); remaining gaps pre-existing + SPEC-documented. Minor note: open-Escape revert has no live-region announcement (acceptable — lands in focused input).
- Reviewer judged from captures, all 7 snapshots, CT end-state PNGs, diffs. NOT from CT videos (no ffmpeg; disclosed) or live Book (MCP pipe broken; read-only, no re-capture).
- New baseline: reviewer RECOMMENDS committing (human confirms).
- Reviewer imprecision (mine to note, verdict unaffected): item 2 claims user onKeyDown/onChange previously "replaced" internals via last-spread-wins — they were already composed pre-change; what was clobberable was ref/value/defaultValue/role/aria.

## Commit-ready arc (for the landing captain; this crew never commits)
- M `Combobox.tsx` (stability fixes 1–9, ~+150/−60), M `combobox-context.ts` (+4 additive fields), M `Combobox.test.tsx` (5→41), M `Combobox.story.tsx` (+12 stories), M `__e2e__/Combobox.ct.spec.ts` (2→25 specs), M `SPEC.md` (49[x]+6[~]/96), A `__snapshots__/combobox-lb-cb-04-highlight.png`, A this log.
- Suggested commit: `test(combobox): land quarantine stability + 55-case suite, freeze visuals` (one commit per component per LANDING.md).
- Needs: human confirm on the 1 new baseline at commit review.
- Branch reference-system throughout; never switched, never committed; sibling crews' files untouched (Accordion/DateField/Menu/neo dirt in worktree is theirs).

COMPLETE

## Handoffs (inbound status)
- Listbox LB-CB-01/02/04 + CB-04 pixels: 01/04 in plan (CT+pixels); 02 blocked (virtualFocus). Listbox already landed CB-03 throw + activeOptionId styling; its `setActiveValue(v)` 1-arg calls constrain my context shape (no activeSource param — kept).
- RovingFocus CB bridge + TR-CB + COMP-03: no such handoff in RF log (COMPLETE) — treated as not-received; TR-CB/COMP-03 blocked on Tree bridge.
- Field FI-COMP-04 commit/remove: in plan (TokenPicker story + CT). FI-COMP-02 is DateField-owned, not Combobox.

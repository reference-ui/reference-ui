# Combobox FEATURES — IN PROGRESS

Crew started. Working through IMPLEMENT-NOW items #1,3,5,6,7,8,9,10,11,12,13 (HOLD #2,#4 untouched).

## Design notes (from TESTS.md + joint docs, landed as I go)
- #9 joint seam: `setActiveValue(val, source?)`, source ∈ keyboard|pointer|null, default pointer (Listbox hover/focus call sites pass none). Leave-restore (`val === committed value` while keyboard-active) is ignored so keyboard survives Listbox root leave; Listbox crew replaces with explicit `clearPointerActive()` when they land their half. Both leave paths target committed value (no contradiction).
- #7 joint: Overlay #3 vocabulary = real KeyboardEvent, granular-first, preventDefault stops all. Combobox owns the Escape path (does NOT forward to Overlay layer, avoiding double-fire).
- #6: TreeContext is module-private + has no collection registry → expect verify-block.
- #10: gate = authored Popover present + ≥1 authored item element (Option/VirtualItem/TreeItem) or mounted registration.

## Progress
- [x] Setup: log created, triage/FEATURES/TESTS/API-STANCE/test-component/ux-designer read
- [ ] #11 focus-open removal
- [ ] #9 activeSource + leave-clears + Tab eligibility
- [ ] #3 closeOnBlur + blur policy
- [ ] #13 select-only commit/revert mirror
- [ ] #8 select-only Trigger keys
- [ ] #10 CB-OPEN-03 content gate
- [ ] #7 onEscape granular API
- [ ] #1 autocomplete modes
- [ ] #12 touch outside-dismiss + harness
- [ ] #5 virtualFocus grid adapter + 100+ fixture
- [ ] #6 Tree bridge (expect verify-block)
- [ ] pnpm agentct Combobox green (unit+e2e), React 17/18 behavior pass
- [ ] ux-designer nested review

## Cluster A run (2026-09-26)
- [x] Setup: triage/FEATURES/TESTS/API-STANCE/test-component/ux-designer read; Listbox call sites (hover/focus→setActiveValue, root-leave→setActiveValue(committed)), Overlay deferred-click dismiss, TypeaheadModel seam mapped
- [ ] #11 focus-open removal — STARTED
- [x] #11 focus-open removal — LANDED (handleFocus no longer requests open; click-open untouched; test updates batched at the end)
- [ ] #9 activeSource + leave-clears + Tab eligibility — STARTED
- Decision: partial #9 diff REDONE cleanly — it also staged cluster-B context fields (autocomplete/completion/virtualAdapter/hasPopoverContent/onEscapeProp) with no providers (typecheck red). Trimmed to cluster-A-only fields; cluster B re-adds its own.
- [x] #9 activeSource + leave-clears + Tab eligibility — LANDED (source-tagged setActiveValue + leave-restore ignore + clearPointerActive + Popover leave; Tab commits keyboard-only, else revert+close)
- [ ] #3 closeOnBlur + blur policy — STARTED
- Design notes locked: blur does revert-before-dismiss (Overlay dismisses on deferred click, after blur); mousedown-preventDefault on Popover so inside-chrome press doesn't read as outside blur; idempotent setIsOpen via last-request ref (collapses blur+click double-dismiss, re-arms per render for CB-OPEN-06); typing-derived active is keyboard-eligible; initial-on-open active is source-null (Tab needs fresh keyboard intent per CB-COMMIT-04).
- [x] #3 closeOnBlur + blur policy — CODE-LANDED (no #2 table needed: without allowCustomValue, blur = revert + dismiss; default-true/false policy complete; custom-text-commit-on-blur CB-CUSTOM-02 stays held with #2)
- [x] #13 select-only commit/revert mirror — CODE-LANDED (selectOnly from focus-source registration; Trigger Escape/Tab/blur mirror with zero text callbacks via revert+handleSelect guards; no #2 table needed — no text exists)
- [x] #8 select-only Trigger keys — CODE-LANDED (arrows open/navigate w/ direction-pending shared with Input for CB-OPEN-02, TypeaheadModel 500ms cycling, Home/End, Enter/Space keydown-decided commit vs pointer-toggle reconciliation for CB-OPEN-04 vs CB-SELECT-04)
- Reconciliation note: CB-OPEN-04 (pointer click toggles) vs CB-SELECT-04 (Enter/Space commits when open+active) resolved by modality — click always toggles, Enter/Space keydown preventDefaults the native click and decides open/commit/close. Existing CB-SELECT-04 CT encodes old toggle; updating to spec (commit+dismiss).
- [ ] Test updates + new tests (unit + story + CT) — STARTED
- [x] Test updates + new tests — WRITTEN (unit: 2 updated + 15 new; stories: SelectOnlyTabOrder + BlurPersist; CT: 4 updated + 8 new)
- [ ] pnpm agentct Combobox green (unit+e2e) — BEFORE unit run
- [x] pnpm agentct Combobox unit — GREEN 57/57 (after: deferred open-resolver fix — Overlay mounts content a commit late so validity must resolve post-registration; CB-DOM-07/CB-ENV-02 updated for #11; COMMIT-05 fallback-label fix; one sync-race flake retried)
- [ ] pnpm agentct Combobox e2e — BEFORE e2e run
- [x] E2E fixes: onOutsidePress revert-first (Overlay non-inert dismisses on pointerdown, pre-blur); blur-path revert unconditional; covered-click → programmatic focus; content-mount waits before arrows/typeahead (Overlay mounts content a commit after open state)
- [ ] pnpm agentct Combobox e2e — BEFORE full re-run
- [x] Blur-unmount phantom fix: blur reverts only while open (registry mounted); pointerdown reverts via onOutsidePress; unit 57/57 re-green; ENV-03/REVERT-03/CLOSE-01 CT green
- [ ] pnpm agentct Combobox (full unit+e2e) — BEFORE final run
- [x] pnpm agentct Combobox (full unit+e2e) — GREEN: unit 57/57, e2e 36/36 react19, zero snapshot drift
- [ ] React 17/18 behavior pass — BEFORE run
- [x] React 17/18 behavior pass — 17: 36/36; 18: 36/36 alone (combined 17+18 run showed one unidentified react18 flake under parallel slots; clean on isolated re-run; snapshots N/A off 19)
- [ ] Artifact inspection (videos) — STARTED
- [x] Artifact inspection — end-state screenshots verified (SELECT-05 log order + zero text callbacks; SELECT-03 anchor/highlight/focus); snapshots drift-free on 19; videos unviewable (no working webm decoder; exit code paths untouched)
- [x] SPEC.md case index updated (58 [x], 5 [~]; gaps cleared for #3/#8/#9/#11)
- [ ] ux-designer nested review — STARTED
- [x] ux-designer nested review — PASS (look frozen/no drift; all five feel changes approved; zero a11y findings; one non-blocking observation: closed-Trigger typeahead consumes first keystroke to open, spec-sanctioned by CB-SELECT-03)
- [x] #11, #9, #3, #13, #8 — ALL LANDED + PROVEN. No verify-blocks needed (#3/#13 needed no held-#2 table). Cluster B (#1,#5,#6,#7,#10,#12) + HOLD (#2,#4) untouched.

## Cluster B run (2026-09-26)
Scope: #1, #5, #6, #7, #10, #12. HOLD #2/#4 untouched. Cluster-A tree as base (725982442).
Joint survey (all read-only, before any edit):
- #7 PINNABLE: Overlay #3 = onEscape/onOutsidePress first, onDismiss unless preventDefault, real DOM events; Overlay types pin onEscape(event: KeyboardEvent); Combobox.md root extends OverlayDismissHandlers; CB-REVERT-02 pins order. Combobox owns path (React keydown runs before Overlay doc listener; preventDefault shields layer).
- #10 PINNABLE: triage Overlay #4 non-goal (b) → gate from authored children + collection metadata. Single-entry bundle (dist/index.mjs) → Tree/Listbox type-refs free, no cycle (Tree imports react/react-primitives/RovingFocus only).
- #1 PINNABLE: FEATURES + CB-MODE-01..07 fully specify; Combobox.md maps aria-autocomplete + fill-on-arrow.
- #5 GRID PINNABLE: Listbox exports VirtualFocusItem/VirtualFocusAdapter precedent (items + scrollToIndex); Combobox.md pins ComboboxGridAdapter extends VirtualFocusAdapter { role:'grid'; getNextIndex({key,currentIndex,direction}) } + VirtualItem slotting + mount-timing/scroll/stale rules. VIRT (windowed Listbox) needs Listbox upward registry — ABSENT (ListboxContext module-private, no adapter publication) → expect verify-block VIRT-01/02/03 + COMP-01, prove mount-timing via grid + 100-cell fixture instead.
- #6 EXPECT VERIFY-BLOCK: TreeContext module-private; no collection registry (only registerItemInstance dup-detection + registerBranchOrder); Tree #1 waits on Combobox-owned contract while triage sequences Combobox #6 on Tree publishing — circular, HQ must sequence. Attempt = survey + report.
- #12: no touch harness exists in CT (zero hasTouch/touchscreen hits); build CDP Input.dispatchTouchEvent harness (real trusted sequence) in new spec file.
- ADAPTER-02 valid-half holds by construction (press shielded when combobox; click → combobox.handleSelect only); option-Enter prefers context.selectOption (unreachable: tabIndex -1 in Combobox) — Listbox-owned wart for their #2 requeue. ADAPTER-03 scalar-safe by construction (click → handleSelect scalar).
Order: #5-types → #10 → #7 → #1 → #5-full → #12 → #6 → full verify → UX → SPEC index.
- [ ] #5-types + #10 + #7 plumbing — STARTED

## Cluster B2 run (2026-09-26, attempt 2)
Base: cluster-A tree + attempt-1 partial plumbing (context fields + Input/Trigger consumer refs + authored.ts/autocomplete.ts/virtual-focus.ts; provider side ABSENT — typecheck red). Continuing attempt-1 files (no redo: survey + helpers sound).
Order: #5-types → #10 → #7 → #1 → #5-full → #12 → #6-attempt. HOLD #2/#4 untouched.
- [ ] #5-types verify + provider wiring — STARTED
- [x] #5-types verify + provider wiring — LANDED (attempt-1 context/helper/consumer files kept; added popupRole + collectionConflict; tsc clean for Combobox, other-component errors pre-existing)
- [ ] #10 CB-OPEN-03 content gate — STARTED
- [x] #10 CB-OPEN-03 content gate — CODE-LANDED (authored scan + hasPopoverContent gate on edit-open; metadata counts grid virtualFocus + Listbox virtual; ADAPTER-02/03 authored diagnostics)
- [ ] #7 onEscape granular API — STARTED
- [x] #7 onEscape granular API — CODE-LANDED (root prop → context; Input/Trigger fire with native event first, preventDefault stops revert+callbacks+dismiss; Overlay layer shielded, never forwarded; ComboboxProps deliberately NOT extending OverlayDismissHandlers — that would add onOutsidePress/onInteractOutside to the public contract)
- [ ] #1 autocomplete modes — STARTED
- [x] #1 autocomplete modes — CODE-LANDED (root autocomplete default list → context + aria-autocomplete; attempt-1 Input completion effect + IME clear kept; mode-switch clearing falls out of the effect)
- [ ] #5-full grid adapter + VirtualItem — STARTED
- Design: activeValue tracks the logical target immediately (mounted or pending); activeOptionId publishes only after mount (optionsMap lookup). Pending identity = index+value; metadata replace (items identity) cancels; same-index requests dedupe scrollToIndex. VirtualItem mounts mirror into optionsMap (with index) for ID/label/revert resolution. Conflict (ADAPTER-08) gates setActiveValue(non-null) + handleSelect + resolver + typing-active at the root — zero consumer edits, Listbox hover covered.
- [x] #5-full grid adapter + VirtualItem — CODE-LANDED (Popover virtualFocus prop + grid role; effective-adapter validation incl. dup-values→ignored; navigateVirtual/searchVirtual/requestVirtualIndex/registerVirtualItem/previewVirtualItem/commitVirtualItem; grid open-resolver branch; popupRole listbox/tree/grid; ADAPTER-08 conflict gates + diagnostics)
- [ ] Test updates + new tests (unit + story + CT) — STARTED
- [x] Stories — WRITTEN (BothLog, NoneLog, ModeSwitchLog, EscapeLog, GridLog 100-cell windowed, GridSelectOnly, SlottedCellLog, ConflictLog, MultipleLog, NestedChangeLog, TreePopupLog, TreeTriggerLog, EmptyPopoverLog, NoPopoverLog, TouchLog, GridInvalidLog 6-way)
- [x] Unit tests — WRITTEN (completion matrix 2, virtual helpers 6, authored scan 4, SSR mapping 2, happy-dom interactive 6)
- [ ] pnpm agentct Combobox unit — BEFORE run
- [x] pnpm agentct Combobox unit — GREEN 77/77 (20 new: completion 2, helpers 6, scan 4, SSR 2, happy-dom 6; one happy-dom computed-style fix)
- [x] CT specs — WRITTEN (22 in Combobox.ct.spec.ts: MODE-01..07, OPEN-03 x2, REVERT-02, DOM-02/03/04, ADAPTER-01..08 incl. invalid+recovery, SELECT-08-virtual, tree survey, COMP-02)
- [ ] #12 touch outside-dismiss + harness — STARTED
- [x] #12 CDP harness — WRITTEN (__e2e__/Combobox.touch.ct.spec.ts: dispatchTouchEvent tap helper, CLOSE-05 outside/inside, EDIT-08 touch commit)
- [ ] pnpm agentct Combobox e2e — BEFORE run
- [x] pnpm agentct Combobox e2e — 58/65 react19 (fails: MODE-04, ADAPTER-04/05/07, COMP-02, CLOSE-05 x2, EDIT-08-touch)
- E2E fixes round 1: VirtualItem composedRef stabilized (inline identity detached/re-attached child refs every commit → setState loop → blank page, ADAPTER-04); deferred typing-active resolution via pendingTypingRef (closed typing raced the mount — MODE-04/COMP-02 determinism; grids re-apply search post-wipe, armed only when closed so mounts never clobber arrows)
- [ ] pnpm agentct Combobox e2e — BEFORE re-run (round 1 fixes)
- E2E fixes round 2: MODE-05 rewritten deterministically (completion display is commit-dependent — toHaveValue waits; same hardening for MODE-03/04/06/COMP-02); ADAPTER-05 dup-mount check fixed (presence, not id-compare); ADAPTER-07 story → sliding window + select-all typing (faithful 37→12 stale narrative, no empty-text scroll); revert label cache (filtered-out committed options restore labels, never-mounted still raw per COMMIT-05); TouchLog outside button moved clear of the popover; EDIT-08-touch assertion corrected (focus correctly never leaves)
- [ ] pnpm agentct Combobox e2e — BEFORE re-run (round 2 fixes)
- E2E fixes round 3: MODE-05 fill-based determinism (single-commit completion establishment, caret fail-fast, retrying log reads); ADAPTER-05 + COMP-02 test.setTimeout(60000) (longest specs under parallel-slot load; Showcase precedent)
- [ ] pnpm agentct Combobox e2e — BEFORE re-run (round 3 fixes)
- E2E fixes round 4: ADAPTER-05 nav-input focus() (stacked popovers intercept pointer clicks); COMP-02 case fix (suffix preserves capital) + delay-100 deterministic typing
- [ ] pnpm agentct Combobox e2e — BEFORE re-run (round 4 fixes)
- E2E fixes round 5: FilterBothLog spacer (open popover intercepted fb-outside clicks)
- [ ] pnpm agentct Combobox (full unit+e2e) — BEFORE final run
- [x] pnpm agentct Combobox (full unit+e2e) — GREEN: unit 77/77, e2e 65/65 react19, zero snapshot drift
- [x] #12 touch outside-dismiss + harness — LANDED (no product change needed: outside touch → single revert-before-dismiss via onOutsidePress idempotency; compat-mouse flush adds nothing (Overlay pending is inert-path-only); CDP dispatchTouchEvent harness in Combobox.touch.ct.spec.ts proves outside-once, inside-stays, tap-commit-once)
- [x] #1 autocomplete modes — LANDED (MODE-01..07 CT + COMP-02 + unit matrix; label-cache revert improvement)
- [x] #10 CB-OPEN-03 content gate — LANDED (CT populated/empty/bare + unit gate matrix)
- [x] #7 onEscape granular API — LANDED (CT REVERT-02 both halves + unit)
- [x] #5 virtualFocus grid adapter + 100-cell fixture — LANDED (grid CT ADAPTER-01/04/05/06/07/08, DOM-02/03/04, SELECT-08-virtual; VIRT windowed-Listbox verify-blocked below)
- [ ] #6 Tree bridge — STARTED (survey + attempt)
- [x] #6 Tree bridge — VERIFY-BLOCKED (survey complete, no invention; report below)

## #6 verify-block report (Tree bridge)
Attempted: mapped what a Combobox-side bridge needs (visible enabled Tree items in order, expansion delegation, virtual-active publication, scalar commit routing) against Tree's published surface.
Findings (all read-only):
- `TreeContext` is module-private (`const`, no export in Tree/Tree.tsx:128); nothing publishes visible items, expansion, or selection upward.
- `registerItemInstance` is id dup-detection only; `registerBranchOrder` (branches only, id+el) is context-internal — no disabled/textValue/active/commit wiring. Not a navigable collection registry.
- Tree FEATURES #1 is DEFERRED with "Revisit when: Combobox owns the bridge contract", while Combobox FEATURES #6 sequences on "Tree publishes its registry contract" — circular. Tree TESTS TR-CB-01..06 are specified but unowned while the circle stands.
- HQ must sequence: either Tree publishes a registry contract first, or HQ assigns the shared-bridge contract (adapter shape, data-active reconciliation, commit proof) to one crew.
Delivered toward the unblock: `popupRole` tree mapping (aria-haspopup=tree, CB-DOM-02/03 CT), TreePopupLog/TreeTriggerLog fixtures, and a survey CT pinning current behavior (open works, arrows publish no active descendant). No half-bridge invented.

## #5-VIRT verify-block report (windowed Listbox)
CB-VIRT-01/02/03 + CB-COMP-01 (+LB-CB-02 handoff) need Listbox to publish its windowed adapter/registry upward: `ListboxContext` is module-private (Listbox.tsx:201), the `virtual` prop is consumed internally only (navigateVirtual/scrollToIndex behind Listbox-owned focus), and no scroll/mount/resolve surface reaches Combobox. Inventing a parallel drive would fork Listbox virtualization semantics. Mount-timing (pend + scrollToIndex + publish-after-mount + stale-cancel) is proven instead via the grid adapter + 100-cell windowed fixture (CB-ADAPTER-01/07, CB-SELECT-08-virtual). Unblocks when Listbox publishes its virtual registry upward.
- Migration sweep (breaking-NOW rule): all cluster-B API is additive (autocomplete, onEscape, Popover virtualFocus, VirtualItem + types); behavior deltas are the #10 gate (edits open only with content), deferred typing-active (closed typing deterministically activates first match on open), and revert label cache. Consumers inspected: Listbox.tsx (context reader, additive-safe), Listbox.test.ts (fake-context cast unaffected), Field.story x3 (two Popover-less visual embeds — untyped; token picker has options + click-opens — gate passes), Field.spec (no typing flows), Showcase.book + Icon.book (option-backed visual demos, untyped), Showcase.spec (heading only), index barrel. ZERO migration edits required; no consumer call sites touched.
- [ ] React 17/18 behavior pass — BEFORE run
- [x] React 17/18 behavior pass — 124/130 (17: 60/65, 18: 64/65; all both-mode completion)
- Cross-version fixes: live typing consumes needsResolve (open-resolver must not wipe fresher intent — the 18 race, latent everywhere); setNativeInputValue via the prototype setter so the completion write survives controlled-input restoration (the 17 failure; tracker stays prop-synced, user edits still dispatch)
- [ ] React 17/18 behavior pass — BEFORE re-run (cross-version fixes)
- [ ] React 17/18 behavior pass — BEFORE re-run (prop-driven completion rewrite)
- Cross-version fixes round 2: suffix-selection effect re-selects when React 17/18 rewrites collapse the caret to end (same-pair + collapsed-end only; user caret moves preserved)
- [ ] React 17 e2e — BEFORE isolated re-run
- [x] React 17 e2e — GREEN 65/65 isolated (earlier fetch-failure + timeouts were parallel-slot contention, not product)
- [ ] React 18 e2e — BEFORE isolated re-run
- [x] React 18 e2e — 64/65 suite + SELECT-04 green isolated (parallel-slot flake, same as cluster A's unidentified react18 flake; earlier fetch-failures were gallery alias contention)
- [ ] pnpm agentct Combobox (full unit+e2e 19) — BEFORE regression run (completion rewrite)
- [x] pnpm agentct Combobox (full unit+e2e 19) — GREEN: unit 77/77, e2e 65/65 (after daemon restart; prior run's 5 failures were all gallery fetch-wedge, zero product assertions)
- [ ] Artifact inspection (videos) — STARTED
- [x] Artifact inspection (videos) — DONE via end-state screenshots (no webm decoder in env, same as cluster A): grid commit end-state (Cell 1 + open/scroll/change/dismiss), touch revert end-state (Alpha, closed), both-mode completion (Alpha + pha selected + active option). Zero snapshot drift (suite green).
- [x] UX review (nested ux-designer) — PASS (behavior-only; look unchanged; inline-completion, slotting transparency, focus/keyboard/motion approved)
- [x] Test updates + new tests (unit + story + CT) — DONE (unit 77, CT 65 incl. touch harness file)
- [x] SPEC.md case index — UPDATED (DOM-02/03/04, OPEN-03, REVERT-02, MODE-01..07, ADAPTER-01..08, SELECT-08 full, CLOSE-05, COMP-02 → [x]; VIRT/TREE/COMP-01/COMP-03 verify-blocked; COMMIT-02/CUSTOM/ENV holds untouched)
## Cluster B2 DONE (2026-09-26): landed #1, #5-types, #5-full, #7, #10, #12; verify-blocked #5-VIRT + #6 with reports; HOLD #2/#4 untouched.

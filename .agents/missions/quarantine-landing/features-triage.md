# FEATURES triage — IN PROGRESS (completed in same pass; see COMPLETE at end)

Scope: every `FEATURES.md` item under `packages/reference-lib/src/components/*/` →
`IMPLEMENT-NOW` (obvious, low-risk, fits API-STANCE + controllability/customization themes;
decided directions recorded inline) or `HOLD-FOR-HQ` (genuinely needs HQ's eye).
Stance inputs: `docs/MISSIONS/API-STANCE.md` (no V2, breaking happens NOW pre-release,
simplest forever-contract wins, controlled-only leaning, no deprecation shims for
never-released API); precedents: Tabs keepMounted OPT-IN ONLY, Switch onChange(checked,
event) approved, Switch thumb-ref HELD, Splitter doc HQ-agreed.
No prior partial file existed — triaged fresh from all docs. Toast + Tooltip have no
FEATURES.md/PATCHES.md (nothing to triage). Slot's only item already shipped.

## Accordion (1)
1. Find beforematch — IMPLEMENT-NOW: single-mode swap is forced by the mode invariant, no new surface; blocked on Collapsible #1 primitives.

## Announcer (3)
1. Book story — IMPLEMENT-NOW: no API surface; cheap manual-AT click target + readout.
2. Public export freeze — IMPLEMENT-NOW: simplest contract (announce + options only); breaking is free pre-release; consumer audit in same change.
3. Multi-document topology — IMPLEMENT-NOW decided (a): document ReferenceLibrary-per-document; direct host mount test-only.

## Button / Icon / Field / Popover — no FEATURES items.

## Calendar (14)
1. Discriminated mode props + required value — IMPLEMENT-NOW: stance-aligned (required controlled, mode-typed onChange); ships as v1, "v2" framing void.
2. Fail-closed invalid props — IMPLEMENT-NOW decided blank: fail-closed means render null + one dev diagnostic; a degraded grid contradicts the title.
3. Required locale + firstDayOfWeek + CLDR — IMPLEMENT-NOW: table-stakes correctness; paint re-approval at proof per visuals rule.
4. Padded outside-day grid — IMPLEMENT-NOW: the standard month-grid look; frozen-baseline re-approval at proof.
5. Weekdays/Days/Day parts + 10-field renderer — HOLD-FOR-HQ: exact 10-field render state too big to freeze without a named consumer.
6. isDateUnavailable + min/max — IMPLEMENT-NOW: unavoidable surface; controllability theme; specified.
7. 2D keyboard nav + unavailable skip — IMPLEMENT-NOW: grid unshippable for keyboard users without it; specified.
8. Today marker — IMPLEMENT-NOW: land the data-today hook; painted treatment (not color-alone) signed at proof.
9. Range preview machine + Tab-commit — HOLD-FOR-HQ: Tab-commit vs abandon is a genuine UX fork I cannot resolve.
10. Month/year modes + Months/Years parts — HOLD-FOR-HQ: parked; maintainer gates on a picker requirement that hasn't arrived.
11. Localized Heading + announcements — IMPLEMENT-NOW: right shape (one atomic mutation, no global announcer); lands with locale work.
12. Controlled-month machine — IMPLEMENT-NOW: remount reseeds from value/today (remount = fresh state); rest specified.
13. Single-mode selection semantics — IMPLEMENT-NOW decided uniform-request: every activation requests its ISO once; no no-op-vs-toggle special branch.
14. Whole-calendar disabled — IMPLEMENT-NOW decided remove: per-day disable covers it; simplest contract.

## Collapsible (2)
1. hiddenUntilFound / beforematch — HOLD-FOR-HQ: prop shape (root vs root+Content), aria-controls target, GSAP interplay, SSR story all open.
2. forceMount — HOLD-FOR-HQ: parked; maintainer requires real consumer demand, none filed.

## Combobox (13)
1. autocomplete modes — IMPLEMENT-NOW: flagship UX gap; fully specified incl. suffix-only selection.
2. allowCustomValue + commit semantics — HOLD-FOR-HQ: maintainer gates all branches on HQ's full commit/revert decision table.
3. closeOnBlur + blur policy — IMPLEMENT-NOW: specified (default true); sequenced after #2.
4. loading + announce() empty/no-results — HOLD-FOR-HQ: parked; prose + busy timing need the first async consumer, must not freeze speculatively.
5. virtualFocus grid adapter — IMPLEMENT-NOW: specified; gated on mount-timing proof + 100+-item fixture at proof.
6. Tree bridge — IMPLEMENT-NOW: no new props; sequenced on Tree publishing its registry contract (joint with Tree #1).
7. onEscape granular API — IMPLEMENT-NOW: lands only inside the joint Overlay/Popover/Combobox dismiss design (Overlay #3 vocabulary).
8. Select-only Trigger keys — IMPLEMENT-NOW: specified; sequenced after #9 source gating.
9. activeSource + leave-clears + Tab eligibility — IMPLEMENT-NOW: joint with Listbox leave-clearing so the two can't contradict.
10. CB-OPEN-03 content gate — IMPLEMENT-NOW: follows Overlay #4 (non-goal) → gate from authored children + collection metadata.
11. Focus-open removal — IMPLEMENT-NOW: quarantine-flagged APG violation; pure behavior fix.
12. Touch outside-dismiss — IMPLEMENT-NOW: real bug class; crew builds the touch CT harness at proof.
13. Select-only commit/revert mirror — IMPLEMENT-NOW: conformance half of the #2/#3 gate; specified.

## DateField (5)
1. Required explicit locale — IMPLEMENT-NOW decided throw-for-all: matches the sketch; simplest contract; settled same pass as the engine.
2. Range namespace — HOLD-FOR-HQ: Apply-on-selection vs explicit Apply (+ whether canApply=false blocks close) is a genuine fork.
3. Constraint API — IMPLEMENT-NOW decided throw: min>max / non-canonical bounds fail loudly via throw (fail-closed, consistent with Calendar #2).
4. Click-to-open vs caret — IMPLEMENT-NOW decided (b): first click opens, click-while-open positions caret (platform text-input feel).
5. Label-less accessible name — IMPLEMENT-NOW decided docs-only (a): cheapest a11y close-out; placeholder-as-name declined.

## FocusLock (2)
1. crossFrame trapping — HOLD-FOR-HQ: parked; deliberate boundary, revisit only with a same-origin-iframe-dialog consumer.
2. TalkBack virtual-modality skip — HOLD-FOR-HQ: parked; do not implement without a repro naming a concrete failure.

## Listbox (4)
1. Typed onChange — IMPLEMENT-NOW decided discriminated overloads keyed on `selection` (single→T|null, multiple→T[], Calendar #1 precedent); generic shared incl. virtual items.
2. RovingFocus re-convergence — IMPLEMENT-NOW: internal, zero public API change; sequenced on RovingFocus exporting the seams.
3. Section/Header/Empty fate — IMPLEMENT-NOW decided remove outright: zero consumers + zero cases; stance voids deprecate-first (no shims for never-released API).
4. isInsideCombobox dead field — IMPLEMENT-NOW decided delete: dead either way; Combobox crew may claim it during the campaign, else cut.

## Menu (8)
1. Nested submenu model — IMPLEMENT-NOW: the missing ~60 cases; designed arc (anatomy→keys→intent→layers); sequenced after #4.
2. CheckboxItem + RadioGroup/RadioItem — HOLD-FOR-HQ: parked; maintainer requires a named settings-menu consumer.
3. LinkItem — IMPLEMENT-NOW: owned arc with MN-COMP-05 gate; navigation-vs-dismissal interleave specified.
4. Popover-root anatomy — IMPLEMENT-NOW decided Popover-root: stance voids the major/codemod cost objection; one overlay runtime, not two; unblocks #1.
5. Horizontal root orientation — HOLD-FOR-HQ: parked; skip unless a Menubar composition names it.
6. Press-drag-select — HOLD-FOR-HQ: recommend decline in base Menu (MenuButton-composition policy) pending a demonstrating consumer.
7. CLOSE-08 strict (rejected Tab-close focus) — HOLD-FOR-HQ: joint Overlay/Popover/Menu Tab-reject handshake; latency shape (prevent-then-restore vs sync predicate) needs HQ.
8. Configurable intent timing — HOLD-FOR-HQ: recommend decline; frozen 100/300/5px stands unless motor-a11y research reopens.

## NumberField (2)
1. Controlled-only + required locale — IMPLEMENT-NOW: stance-aligned on both axes; in-repo uncontrolled consumers migrate in the same change.
2. Redundant onChange suppression — IMPLEMENT-NOW decided any-no-change: uniform "no change → no event" beats a bounds-only special case.

## Overlay (6)
1. Shadow destination rule — IMPLEMENT-NOW decided automatic: getRootNode() default + documented rule; unblocks 4 parked sibling cases.
2. Layer/dismissal accounting — IMPLEMENT-NOW decided coordinator-logs + prose/CT audit: one entry per pair; dev diagnostic only if double-registration bites.
3. Granular dismiss vocabulary canonical — IMPLEMENT-NOW decided real-events-everywhere: proven OV-ESC/OUT shape; no new verb without a consumer.
4. Closed-content observability — IMPLEMENT-NOW decided non-goal (b): unmount-when-closed stays absolute; coordinators read authored children + metadata.
5. Trigger-toggle focus retention — HOLD-FOR-HQ: keep-vs-return × all-triggers-vs-named is a feel-critical fork with direct DateField payoff.
6. Tab-bridge reject semantics — HOLD-FOR-HQ: same joint handshake as Menu #7; needs the HQ latency-shape call, never a solo pin.

## Portal (1)
1. Shadow-portal event contract — IMPLEMENT-NOW decided Portal-owns: placement is already Portal's; a shadow-root listener/retargeting shim completes its own contract (no per-consumer forks).

## Presence (1)
1. GSAP completion wait — IMPLEMENT-NOW decided delete: no proven in-repo consumer; a third-party lib has no place in the exit contract.

## RovingFocus (7)
1. Visual 2D grid nav — HOLD-FOR-HQ: parked; needs a real grid consumer to prove row-grouping heuristics against.
2. Transparent slot contract — HOLD-FOR-HQ: catalog-wide primitive-shape call; only on top of the real Slot/PART conformance story.
3. Single-element anatomy error — IMPLEMENT-NOW decided throw: pre-release is the breaking window; same-change consumer audit replaces warn-while-migrating.
4. Pointer press sets current — IMPLEMENT-NOW decided currentness-only: no focus steal; Menu click-open policy reconciles at composition.
5. Controlled current-id keep vs strip — IMPLEMENT-NOW decided strip: no consumer named a use; SPEC freeze stands.
6. Shadow-DOM navigation — IMPLEMENT-NOW decided cut RF-ENV-02: no consumer/harness; revisit with a web-components story (Tabs PATCHES #2 stays Tabs-local).
7. Consumer forks (Tabs arrows, Listbox typeahead) — IMPLEMENT-NOW sequenced Listbox-first: fixes a live IME bug; Tabs dedup second.

## Slider (6)
1. Controlled-only value — IMPLEMENT-NOW: stance-aligned; all four Book stories already controlled, strip cost near-zero.
2. Thumb identity auto vs explicit — IMPLEMENT-NOW decided auto mount-order: matches the Proposed API + Radix; silent index=0 default dies either way.
3. Modified-key policy — IMPLEMENT-NOW decided strip: freeze-aligned (Page keys own large steps); no modifier large-step without HQ blessing.
4. dragging data hooks — IMPLEMENT-NOW decided Root + active Thumb get data-dragging; data-active coexists (no rename churn).
5. Single-thumb default name — HOLD-FOR-HQ: catalog-wide unlabeled-control policy; Slider must not diverge (cf. NumberField PATCHES #6, DateField #5).
6. Thumb target size — IMPLEMENT-NOW decided invisible hit-area: preserves signed fader-cap visuals; vertical growth has no click-strip issue.

## Slot — no open items (reactive useSlots(filter) shipped per HQ no-scan redesign).

## Splitter (12 — HQ-agreed doc; v2-framing void, breaking ships as v1)
1. Required controlled value + Root contract — IMPLEMENT-NOW: HQ-agreed; the stance's headline example.
2. Panel min/max + DOM-order registration — IMPLEMENT-NOW: same breaking release + codemod as #1.
3. Measured CSS-length constraints — IMPLEMENT-NOW: SSR emits unconstrained, resolve post-mount; parse failure = dev diagnostic + ignore.
4. CSS-variable geometry contract — IMPLEMENT-NOW: HQ's blanket doc agreement covers the observable-DOM sign-off.
5. Pointer-session frame budget — IMPLEMENT-NOW: joint with #3/#4; proven by SP-PERF-01–07.
6. Collapse memory + dynamic panels — IMPLEMENT-NOW decided must-recover keyed by stable id; crew drafts the invalid-tree diagnostic, HQ verifies wording at proof.
7. Disabled/blocked Handle determinism — IMPLEMENT-NOW decided focusable-but-inert: follows from the chosen aria-disabled semantics.
8. Drag denominator = Panel-axis sum — IMPLEMENT-NOW: ships with #3; definitionally correct.
9. Strict structural anatomy errors — IMPLEMENT-NOW decided throw: fail-fast, consistent with Slider PATCHES #5 / RovingFocus #3.
10. Default min floor — IMPLEMENT-NOW decided keep 5%: status quo stands; pin with a test and close (no disappearing-by-drag SR story needed).
11. 9px Handle vs 24px target — HOLD-FOR-HQ: invisible-hit-area click-strip trade-off across panels is a genuine product call.
12. Root-level disabled — IMPLEMENT-NOW decided remove: per-Handle + host aria-disabled covers it; no whole-group case shown.

## Switch (5)
1. data-state-only thumb styling — HOLD-FOR-HQ: needs a designed restyle arc + HQ snapshot sign-off; never a silent strip of the shipped slide.
2. Managed-prop type Omit — IMPLEMENT-NOW: silent Omit incl. aria + data-state/data-disabled as one breaking-type pass; pre-release is that pass.
3. Clipped extra children vs name — IMPLEMENT-NOW decided doc note: build the guard only on proven harm.
4. Thumb ref/handle — HOLD-FOR-HQ: HQ hold stands (weird-use-case smell); do not implement.
5. onChange event access — IMPLEMENT-NOW: HQ-approved widened onChange(checked, event).

## Tabs (9)
1. Required value + removals — IMPLEMENT-NOW: stance-aligned; Book owns the line/pill migration in the same change.
2. RovingFocus composition — IMPLEMENT-NOW: internal, no API change; sequenced on kernel stability.
3. keepMounted panels — IMPLEMENT-NOW: HQ-approved per-panel OPT-IN; global always-mounted law declined.
4. Focus rescue on hide — IMPLEMENT-NOW: genuine a11y hole; sequenced on PATCHES #1 registry.
5. Pointerdown-early activation — HOLD-FOR-HQ: parked; needs a forcing bug + UX-signed press timing.
6. Disabled/removed-tab handoff — IMPLEMENT-NOW: sequenced on registry; TESTS tie-break confirmed.
7. Ref forwarding on parts — HOLD-FOR-HQ: parked; maintainer gates on first consumer demand (forwardRef when it lands, for 17/18 compat).
8. Tab-stop policy on disabled selection — IMPLEMENT-NOW decided first-enabled fallback: less surprising; maintainer-leaned.
9. Link-navigation Tabs — IMPLEMENT-NOW decided Book recipe: no kernel change; anchor semantics stay out of the tab pattern.

## Tree (4)
1. Combobox virtual-focus bridge — IMPLEMENT-NOW: joint with Combobox #6; Combobox owns the contract; no Tree-side data-active fork.
2. Shadow-root traversal — IMPLEMENT-NOW: owning-root reads only, riding the Portal-owned event shim (Portal #1); no Tree event fork.
3. Slot/part registration — IMPLEMENT-NOW: follow the shipped Slot context; zero behavioral delta; hydration proof required.
4. Shared RovingFocus — HOLD-FOR-HQ: parked; engine lacks visible-set support and a pure-dedup swap has no forcing need.

## PATCHES sanity scan (52 items across 13 components)
Verdict: 51 mechanical, 1 flagged non-mechanical.
- FLAG — Slider PATCHES #6 (proof-only backlog): embeds "SD-ENV-03 (ShadowRoot) green OR CUT BY EXPLICIT HQ SCOPE DECISION" — contains a genuine HQ call. Recommendation: crew attempts green; cut requires HQ sign-off at proof.
- Notes (still mechanical): Slider PATCHES #4's conditional ("if FEATURES #3 blesses Shift+Arrow…") is moot — triage decided strip; DateField PATCHES #9's "confirm the picker ID generator first" is crew-trivial; NumberField PATCHES #8's "HQ-verified snapshot rebaseline" is normal proof process, not a design gap; Calendar/Field/Menu PATCHES blocked-on-other-landings are sequencing, not design.
- Empty PATCHES (all items design-gated, correctly placed): Accordion, Collapsible, FocusLock, Overlay, Portal, Presence, Tree (+ Button/Icon/Popover/Slot with nothing open).

## Counts
- FEATURES items triaged: 105 across 24 components (Button, Field, Icon, Popover: none; Slot: shipped; Toast, Tooltip: no docs).
- IMPLEMENT-NOW: 79 (incl. all HQ-precedented items: Switch #5, Tabs #3, Splitter x11).
- HOLD-FOR-HQ: 26 — 12 parked pending consumer/evidence/requirement, 2 recommend-decline, 12 genuine HQ design calls.
- PATCHES: 52 scanned, 1 flagged (Slider #6).

COMPLETE

## Captain amendments (field corrections — triage verdicts updated)
- Listbox #3 (Section/Header/Empty remove) → HOLD-FOR-HQ (joint
  Listbox+Combobox design): premise stale — Combobox re-exports
  Section/Empty as public API (book/tests), listbox-sections snapshot
  exists. (Listbox-F flag 1, Tick 22.)
- Listbox #2 (RovingFocus re-convergence) → REQUEUE: blocked only on
  RF #7 seams, which have since committed (0163ca7df); needs
  TypeaheadModel semantic reconciliation (empty-buffer cycle, repeat
  detection). Micro-crew after Combobox-F lands. (Listbox-F flag 2.)
- Listbox #4 (isInsideCombobox dead field) → pending post-Combobox-F
  sweep (untouched per orders).
- DateField PATCHES #1 (locale display engine) → HELD for HQ visual
  re-pin (renders locale text over ISO in all 8 snapshots); unblocks
  PATCHES #2/#4/#5/#8 when scheduled. (DateField-P, Tick 25.)
- NumberField PATCHES §1-§5 → HOLD (await HQ: §8 visual re-pin +
  ICU-matrix handshake + SPEC work-order step 1; F-#1 landed but the
  gates stand). §8 already HQ-held. (NumberField-P2, Tick 35.)
- Tabs #1 DEVIATION (accepted, reversible): `variant` RETAINED in
  kernel (triage: delete, Book owns line/pill). Crew proved Book-side
  recipes uncollectible under concurrent tree churn (15+ probes;
  const-spread/inline-on-custom flips with unrelated files' states;
  only kernel-inline-on-primitive held green). 22 snapshots
  byte-identical; full matrix green. HQ note: variant strip deferred
  pending collector story + quiet-tree repro. (Tabs-F v4, Tick 40.)
- Tabs #2 ↔ RovingFocus #5 CONTRADICTION → HOLD-FOR-HQ: RF#5
  stripped controlled currentness; Tabs composition NEEDS a
  currentness input (selection→stop sync can't survive without it).
  HQ picks: RovingFocus re-adds currentness input, or Tabs stays
  forked permanently. (Tabs-F v4, Tick 40.)
- Combobox #6 + Tree #1 CIRCULAR → HOLD-FOR-HQ (HQ sequences):
  Combobox #6 waits on Tree publishing a registry contract while
  Tree #1 waits on the Combobox-owned contract. Neither crew can
  move first. (Combobox-F-B2, Tick 47.)
- Listbox #2-model → HOLD (kernel gap): TypeaheadModel needs an
  empty-buffer cycle branch (LB-KEY-04 semantics) + collator-based
  repeat detection before Listbox converges; proven twice (probe +
  swap experiment). RF-side change. (Listbox-F2, Tick 50.)
- Presence #1 (GSAP completion wait) → HOLD-FOR-HQ (premise
  refuted): triage said DELETE ("no proven in-repo consumer") but
  Collapsible IS a proven load-bearing consumer (motion/collapse.ts
  contract). HQ picks: GSAP stays in the exit contract, or
  Collapsible migrates off it first. (Presence-F, Tick 57.)
- Tree #3 (Slot registration) → HOLD-FOR-HQ (SSR wall, proven
  with real kernel): a registering child is invisible to the
  parent's renderToString render (effect-timed registration);
  TR-ENV-01 pins branch-path SSR HTML. Scan-replacement +
  zero-delta + hydration-proof jointly unsatisfiable. HQ picks:
  keep child-scan or accept the SSR cost. (Tree-F, Tick 65.)

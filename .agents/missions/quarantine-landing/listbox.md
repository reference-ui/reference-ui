IN PROGRESS — Listbox reconciliation (quarantine-landing mission)
Crew lead: Listbox. Branch: reference-system (never switch; quarantine read via git show/diff only).
Dir: packages/reference-lib/src/components/Listbox/

## Baseline (pre-change, 2026-09-25)
- `pnpm agentct Listbox`: unit 0 tests (no colocated file); e2e 4/4 React19 green (8 snapshots).
- Current `Listbox.tsx` (463 lines) is byte-identical to quarantine base `7aea45265` (clean port target;
  only story/CT/snapshots added since). `TESTS.md` unchanged base→quarantine (stable contract).

## Quarantine analysis (commit dcefd8d85; nested spawn rejected, root 8/8 full — triaged inline)
- Q `Listbox.tsx` (1250 lines) is a **behavior-only rewrite: zero visual delta**. Verified by diff:
  Option style props (display…_hover/_focus/_focusVisible/css/className/style) semantically
  identical; root style props identical (+2 non-paint attrs: `aria-multiselectable`, empty-root
  `tabIndex`); Section/Header/Empty byte-identical. RovingFocus Root/Item render no DOM
  (Provider + cloneElement), so their removal cannot move paint — snapshots are the proof.
- Recon §4 mangling does NOT apply here the way it does to Switch/Slider: `defaultValue` removal
  is SPEC-mandated (SPEC.md:24 + work order #1; TESTS.md Freeze defaults), no motion/focus strip
  exists (styles identical), no probing scaffolding (`Symbol.for`/`__referencePart` absent).
- Q behaviors ported as stability wins (all SPEC-directed per TESTS.md): controlled-only value;
  option registry + DOM-order flattening + duplicate throw (LB-DOM-06); roving tab stop
  (LB-DOM-08 — fixes real bug: base sets `tabIndex=0` on ALL options); `aria-multiselectable` /
  explicit `aria-selected="false"` / `data-selected` / setsize-posinset (LB-DOM-02/03, LB-VIRT-02);
  disabled skip (LB-DOM-04); single re-activation no-op (LB-SINGLE-05); ordered multi algorithm
  (LB-MULTI-03); consumer `preventDefault` cancel (LB-SINGLE-08); press-down select + dedup
  (LB-POINTER-01); Space-vs-buffer, PageUp/Down+Escape+Tab passthrough, interactive-descendant
  guard (LB-KEY-05/06/07); live-DOM orientation/RTL navigation replacing RovingFocus composition;
  Intl.Collator typeahead (LB-DOM-09, LB-KEY-04); virtual adapter + pending-focus + scroll
  coalescing (LB-VIRT-*); dynamic focus recovery (LB-DYNAMIC-02/04); empty-root tabIndex
  (LB-DOM-07); CB-03 two-authority throw + CB-04 activeOptionId styling (both TESTS.md-mandated).
- Port adaptations (2, both flagged): (a) Q imports `{ RovingFocus, TypeaheadModel, getDirection }`
  but uses only `getDirection`, which current RovingFocus does NOT export (private fn) — port uses
  a tiny local `getComputedDirection` in the Listbox dir instead of touching RovingFocus crew's
  files. (b) Dead `RovingFocus`/`TypeaheadModel` imports dropped.
- Compat verified (read-only): no in-repo `Listbox defaultValue` consumers (stories/book/Field all
  controlled or bare); Field story + Combobox.book inner `<Listbox>` pass no `onChange` → CB-03
  throw safe; ComboboxContext (HEAD) provides `activeOptionId`/`setActiveValue`/`registerOption`.
- Gaps noted, NOT invented: `validateVirtualAdapter` is exported but never called internally in Q
  (kept faithfully as standalone export for LB-VIRT-01/09); `isInsideCombobox` provided but
  unconsumed. Wiring either would exceed the quarantine brief.
- Matrix wins re-targeted, not copied: Q-unit 5 its → colocated `Listbox.test.ts` (+2 new:
  LB-DOM-06 duplicate throw, LB-CB-03 invalid-shape throw); Q-e2e 65 → 20 new CT specs over new
  stories (no `snap()` in new specs — no baseline writes without human yes). LB-CB-01/02/04 need
  full Combobox → handoff to Combobox crew; LB-ENV-03 ShadowRoot → matrix crews.

## Port
- `Listbox.tsx`: 463 → 1256 lines. Quarantine `dcefd8d85` source verbatim except the 2
  flagged adaptations (dropped dead `RovingFocus`/`TypeaheadModel` imports; local
  `getComputedDirection` for the non-exported `getDirection`). Verified: `diff` vs Q shows
  only those hunks; `tsc --noEmit` zero Listbox errors; style props semantically identical.
- `Listbox.test.ts` ADDED (7 its): Q-unit 5 ported 1:1 (type freeze, LB-VIRT-01, LB-MULTI-03,
  LB-ENV-01, LB-ENV-02; imports re-targeted `./index`) + 2 new (LB-DOM-06 duplicate throw with
  distinct ids, LB-CB-03 invalid-shape throw + valid-shape render).
- `Listbox.story.tsx`: +14 stories (Modes, ControlledMirror, RequestLog, RovingTab, Horizontal,
  HorizontalRTL, Typeahead, Cancel, Defaults, MultiUnknown, ZeroValues, DynamicOrder,
  DynamicRemove, Virtual). Existing 3 untouched.
- `__e2e__/Listbox.ct.spec.ts`: 4 → 25 specs. Re-ID'd `LB-DOM-02`→`LB-MULTI-01` (honest ID, same
  steps/snapshots), extended `LB-DOM-03`→`LB-COMP-04` (+group roles, +cross-section nav),
  extended `LB-KEY-01` (+End/Home, +disabled wrap-skip); 21 new (DOM-02/03/06/08/10, SINGLE-01/
  04/05/08, MULTI-03, KEY-02/03/04/05, POINTER-01, DYNAMIC-01/02, VIRT-02/03/05/07). No `snap()`
  in new specs — zero baseline writes.
- `SPEC.md`: minimal bookkeeping — 1/73 → 29/73 (in-dir proof only; did NOT copy Q's 73/73
  matrix claim), remaining gaps enumerated.
- Visual touch: NONE. 8 frozen snapshots pass unmodified; `git status` confirms
  `__snapshots__/` untouched. One paint-adjacent behavior change (combobox active-highlight
  timing via `activeOptionId`, TESTS.md LB-CB-04-mandated) flagged for UX review.

## Progress
- Baseline green (4/4 e2e, 0 unit). Triage done — see analysis.
- Port staged Q-identical + adaptations; existing 4 CT green on frozen snapshots (zero drift).
- Unit 7/7 green (after re-targeting my LB-DOM-06 dup assertion to Q's actual distinct-id
  semantics — see Surprises).
- CT 25/25 React19 green; `--react all` 75/75 (17/18/19). First full-file run showed 10
  timeouts in the opening batch; clean re-run green — transient shared-daemon contention
  with sibling crews, not a code signal (all 10 passed on retry with zero edits).

## view-story visual check (2026-09-25, pnpm capture fallback — shared MCP browser was mid-use by a sibling crew)
- Book `Listbox → SingleSelection` (own browser): resting shows React selected (white pill),
  clean dark list; click 2nd → Vue selected + "Selected: vue"; ArrowDown → Svelte focus ring,
  selection stays Vue (focus ≠ selection); End → Solid ring, selection still Vue. Focus ring
  clearly visible in all keyboard states; spacing/chrome unchanged.
- Captures: `.reference-ui/captures/Listbox_SingleSelection_{resting,clicked-second,arrow-moved,end-key}.png`.

## UX review (ux-designer skill method; SELF-performed — nested spawn rejected, root 8/8 full)
- Brief: LANDING.md Objective B — visuals FROZEN (any drift fails), interactions reviewable.
- LOOK: PASS. 8 frozen CT snapshots green on unmodified baselines (`__snapshots__/` untouched
  per git status); style-prop diff base→port semantically identical; removed RovingFocus
  wrappers emitted no DOM. Standalone paint provably unchanged (isActive===isSelected as before).
  One paint-adjacent change lives only in combobox context (active-highlight timing now keyed to
  `activeOptionId` per TESTS.md LB-CB-04) — approved below, visual proof deferred to Combobox crew.
- FEEL (each behavior change ruled): (1) controlled-only / `defaultValue` removal — APPROVE,
  SPEC work-order #1 + TESTS.md Freeze defaults, zero in-repo consumers, type-test pins it;
  (2) press-down select + exactly-once dedup — APPROVE, TESTS.md POINTER-01 vendor regression;
  (3) single re-activation no-op — APPROVE, SINGLE-05 idempotence kills redundant requests;
  (4) consumer `preventDefault` cancel — APPROVE, SINGLE-08 restores consumer authority;
  (5) single roving tab stop (base made EVERY option tabbable) — APPROVE, DOM-08 keyboard fix;
  (6) disabled skip + `tabindex=-1` — APPROVE, DOM-04; (7) orientation-aware + RTL-mirrored nav —
  APPROVE, KEY-02/03, no prior capability lost; (8) collator typeahead + Space-buffer rule —
  APPROVE, KEY-04/05 + DOM-09, wrap without select proven; (9) virtual adapter — APPROVE, new
  SPEC-mandated surface, additive, default off; (10) dynamic focus recovery — APPROVE, fixes
  stranded focus on removal (DYNAMIC-02/04); (11) duplicate-value throw — APPROVE, fail-fast
  diagnostic better than base's silent ambiguity (distinct-id caveat logged, not a regression);
  (12) CB-03 two-authority throw — APPROVE, TESTS.md-mandated, no-op for in-repo CB usages;
  (13) combobox active timing — APPROVE per LB-CB-04 (data-active only on activedescendant-named
  option), caveat: combobox-context pixels belong to Combobox crew's snapshots.
- ACCESSIBILITY: roving-tabindex fix is a major a11y win (one tab stop); explicit
  `aria-selected="false"`, `aria-multiselectable`, virtual setsize/posinset, disabled never
  focusable; focus ring visible in captures. No new issues. KEY-07 interactive-descendant guard
  ported but unproven in-dir (no CT) — handoff, not a finding.
- Artifacts judged: 4 Book captures; 8 frozen snapshots (green, unmodified); 75/75 CT +
  7/7 unit in-session output; Listbox dir diff vs HEAD. CT videos were pruned from
  test-results/ by sibling crews' later runs before review (same as Presence crew).
- Verdict: SIGN OFF. Caveat: reviewer = crew lead (capacity exhaustion); recommend a blind
  re-review only if mission rules require strict nesting.

## Surprises / handoffs
- Q's duplicate diagnostic only fires when same-value options carry DISTINCT ids (derived-id
  collisions slip through); Q-e2e never clicks its own `dom06-trigger-duplicate` button for
  this reason. Port kept faithful; my unit test pins the implemented semantics. A future freeze
  could throw on any same-pass re-registration (safe: the render map clears per Listbox render).
- Q imports `RovingFocus`/`TypeaheadModel` dead and a non-exported `getDirection` — port drops
  the dead imports and carries a 4-line local direction helper (no coupling to RovingFocus crew).
- `validateVirtualAdapter` is exported but never invoked internally in Q (kept faithfully);
  wiring it into registration is future freeze work (LB-VIRT-09).
- Infra noise (not findings): first full-file CT run timed out 10 opening specs under shared-
  daemon contention; clean re-run 25/25 with zero edits. Shared MCP browser was hijacked
  mid-view by a sibling crew → `pnpm capture` fallback with own browser.
- Self typo caught pre-run: a story testid briefly read `re госпodin-root`; fixed to `req-root`
  before any CT executed (grep-clean).
- Handoff to Combobox crew: LB-CB-01/02/04 browser proof + CB-04 active-highlight pixel
  confirmation in combobox context (my CB-03 unit covers only the invalid-shape diagnostic).
- Handoff to matrix crews: re-target remaining Q matrix cases (DOM-04/05/07/09/11/12, GROUP-*,
  SINGLE-02/03/06/07, MULTI-02/04/05/06/07/08, KEY-06/07, POINTER-02/03/04, DYNAMIC-03/04/05/06,
  VIRT-04/06/08/09/10, ENV-03, A11Y-01, COMP-01/02/03) — my 29/73 is the in-dir floor.

## Commit-ready arc (for captain — NOT committed)
- Files: `M Listbox.tsx` (463→1256), `M SPEC.md` (29/73 index), `M Listbox.story.tsx` (+14
  stories), `M __e2e__/Listbox.ct.spec.ts` (4→25 specs), `?? Listbox.test.ts` (7 its),
  `?? .agents/missions/quarantine-landing/listbox.md`. `__snapshots__/` untouched. Branch
  reference-system; never switched, never committed; other crews' files (Collapsible, Field,
  RovingFocus, Switch) visibly dirty in worktree — untouched.
- Suggested commit: `test(listbox): land quarantine stability + 29-case suite, freeze visuals`
  (one commit per component per LANDING.md).

COMPLETE

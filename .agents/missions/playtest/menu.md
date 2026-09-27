# Playtest menu-crew log

Status: COMPLETE
Branch: reference-system (no switches, no commits — captain commits)
Scope: `packages/reference-lib/src/components/Menu` (+ colocated tests/stories).
RovingFocus and Overlay are READ-ONLY unless root cause is provably there
(then flag and stop).

## Task list (from PLAYTEST-REQUIREMENTS.md Part 1 + W-28 + HQ extra)

- [x] B-27 (P0): FIXED-in-src, proven — root Menu owns RovingFocus.Root; no crash
- [x] B-32 (P2): FIXED-in-src, proven — roving trigger + 100ms hover + ArrowRight/Enter/Space
- [x] B-33 (P3): FIXED by this crew — container-level edge navigation (root + submenu)
- [x] B-04 via W-28: FIXED by this crew — built CheckboxItem + RadioGroup/RadioItem
- [x] HQ extra: PROVEN — adjacent File/Edit composes via baseline dismiss, no Menubar

## Findings

- Playtest ran on dist Sep 24 + older src (diary: root Menu rendered bare
  Overlay; Trigger was a `<button>`). Current src (Sep 26 FEATURES-A/B)
  restructured Menu: root renders Div+RovingFocus.Root; nested Trigger is
  `div[role=menuitem]` in the parent roving set with 100/300ms hover intent
  and ArrowRight/Enter/Space open. B-27/B-32 structural causes look already
  gone — must prove with repro tests, not assume.
- B-33 mechanism in current src: RovingFocus keys are item-level only; the
  menu container (tabIndex=-1, mouse-open focus target) handles Tab/Escape
  only → ArrowDown/Home/End on content are dead. Fixable in Menu scope
  (container-level key handling, root + submenu content). No RovingFocus
  change needed.
- B-04/W-28: CheckboxItem/RadioGroup/RadioItem genuinely absent
  (dispatcher exports Item/Separator/Trigger/Content/LinkItem only).
  Menu.md + TESTS.md (MN-CHOICE-*) specify `onChange`; W-28 text names
  `onCheckedChange`/`onValueChange`. Plan: canonical `onChange` + aliases.
- HQ extra: Overlay dismiss is top-layer outside-pointerdown; adjacent
  File/Edit should compose via baseline. Needs a CT repro to prove.

## Changes

`packages/reference-lib/src/components/Menu/Menu.tsx`
- B-33: `handleContentContainerKey` + `focusEdgeEnabledItem` + `levelItems`
  helpers; wired into `RootMenu` and `MenuContent` key handlers (gated on
  `e.target === e.currentTarget`, after Tab/Escape/close-key handling).
  ArrowDown/Home/PageUp → first enabled item; ArrowUp/End/PageDown → last.
- W-28: `Menu.CheckboxItem` (`checked`, `onChange` + `onCheckedChange`
  alias), `Menu.RadioGroup` (`value`, `onChange` + `onValueChange` alias),
  `Menu.RadioItem` (`value`); full RovingFocus/typeahead participation,
  `menuitemcheckbox`/`menuitemradio` roles, `aria-checked`, `data-state`,
  built-in aria-hidden indicators (✓/–/●), `closeOnSelect` default false,
  activation order native → onSelect → onChange → dismiss; exported on
  the `Menu` namespace.
- Extended `ENABLED_MENUITEM_SELECTOR` to checkbox/radio roles so trigger-key
  entry, directional open, and keyboard-open entry land on choice items too.

`packages/reference-lib/src/components/Menu/Menu.story.tsx`
- New `Choice` fixture (controlled toggles, mixed-reject, sort group with
  disabled radio, close-policy/cancel/alias satellite menus + log displays).
- New `Adjacent` fixture (File/Edit triggers, baseline-dismiss composition).

`packages/reference-lib/src/components/Menu/Menu.test.tsx` (+4)
- `MN-DOM-B27` (Menu.md composition opens, no RovingFocus throw),
  `MN-CHOICE-03` (controlled-checked authority), `MN-CHOICE-05`
  (group value authority/reorder/absent), `MN-CHOICE-06` (order
  native→select→change→dismiss).

`packages/reference-lib/src/components/Menu/__e2e__/Menu.ct.spec.ts` (+10)
- `MN-FOCUS-07` (B-33 root), `MN-FOCUS-07-sub` (B-33 submenu),
  `MN-CLOSE-11` (HQ adjacent dismiss), `MN-CHOICE-01/02/04/07/08/09`,
  `MN-CHOICE-02-alias`.

No changes to RovingFocus or Overlay (scope held — both fixes live in Menu).

## Verification (test-component skill, React 19)

- Baseline before changes: unit 18/18, e2e 50/50 (React 19).
- After changes: `pnpm agentct Menu --unit` → 22 passed, 0 failed.
- After changes: `pnpm agentct Menu --e2e` → 60 passed, 0 failed
  (react19: 60/60). One interim failure was a test bug (typeahead buffer
  needed the 1500ms reset between distinct searches, per MN-TYPE-04
  pattern) — fixed in the spec, not the component.
- Snapshots: existing `snap()` gates passed, no drift; no baselines touched.
- Artifacts: CLOSE-11 end-state screenshot verified (both closed, logs
  `File true,false,true,false / Edit true,false`, focus on File);
  CHOICE-01 screenshot verified (✓/–/● indicators, aligned slots, dimmed
  disabled radio, separators). Videos unviewable in this environment
  (webm not supported by file viewer); behavior is state/focus-asserted.
- `tsc --noEmit`: zero errors in touched files (only pre-existing
  `Menu.book.tsx` icons-resolution error, untouched file needing
  generated deps).

## Flags for HQ

- None blocking. Notes: (1) B-27/B-32/HQ-extra root causes are absent in
  current src (Sep 26 FEATURES-A/B refactor + Overlay top-layer dismiss);
  proven by passing repro/coverage tests, zero src changes for those paths.
  (2) `Menu.LinkItem` clears its bar (implemented, tested MN-LINK-*,
  documented) — kept as-is. (3) Plain `Menu.Item` has no indicator slot
  so its label sits left of choice labels when mixed in one menu (matches
  Radix convention; cosmetic, not filed). (4) Container-level typeahead
  (typing with focus on the menu container) remains item-level-only —
  outside B-33's ArrowDown/Home/End scope; APG does not require it.

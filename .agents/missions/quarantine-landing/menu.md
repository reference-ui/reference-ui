IN PROGRESS — Menu crew lead (quarantine-landing), 2026-09-25
Crew lead for Menu. Branch: reference-system (never switch; quarantine tip 89850d1c8 read-only).
Dir: packages/reference-lib/src/components/Menu/ (confirmed: Menu)
Context: Overlay Objective-B NO-OP (build on Overlay/useOverlay/OverlayContentProps as-is); RovingFocus consumer-green (typeahead+textValue landed); Slot kernel (Overlay.Trigger already registerPart).

## Baseline (BEFORE changes)
- `pnpm agentct Menu`: unit 5/5, e2e 2/2 (react19) GREEN. 8 frozen snapshots.

## Triage (quarantine 42b1a2c35 + matrix corpus, all read)
SALVAGE (source, all zero-paint):
1. onSelect receives cancelable native event; dismissal honors defaultPrevented (ACT-01/02/03; Menu.md:75/132 already documents `(event: Event) => void` — alignment, not violation). Param widening is backward-compat for `() => void` consumers. FLAG.
2. Disabled item click adds e.preventDefault (ACT-06).
3. Enter/Space activation adds stopPropagation (quarantine parity).
4. onClick preventDefault also skips onSelect (ACT-03 ordering); onSelect called BEFORE preventDefault so it observes defaultPrevented=false (ACT-01/02). FLAG (subtle behavior change).
5. RovingFocus.Root `typeahead` + MenuItem `textValue` pass-through (TYPE-01/04, DOM-05, DYNAMIC-01). textValue additive per Menu.md:74. FLAG (behavior addition).
6. Tab/Shift+Tab: preventDefault + close + trigger-relative continuation via ported findNextTabbable (CLOSE-05; current loses focus to body). FLAG (TESTS.md-mandated feel change).
7. Port restoreFocusToTrigger (isConnected/disabled guards + fallback) for Escape/click/Tab paths (CLOSE-06 root portion).
8. Stable content id (useId, authored wins) carried over MenuContext; Trigger sets aria-controls only while open (DOM-03/07 root portion). FLAG (DOM attr addition).
9. forwardRef on Trigger/Content/Item/Separator (Tree precedent; DOM-04 ref portion).
10. menu-intent.ts VERBATIM + colocated menu-intent.test.ts (INTENT-09); NOT exported from index (internal; submenu follow-up fuel). FLAG unwired.
SALVAGE (tests): ~28 CT re-targets (Parity story; Basic byte-identical) + INTENT-09/ENV-01/ENV-02 colocated unit.
SUSPECT (do not port): nested submenu model, Popover-root rewrite, controlled-only state (keep defaultOpen/onOpenChange), CheckboxItem/RadioGroup/LinkItem parts, intent timer wiring, global lastRootOpenKey tracker (current focusStrategy cleaner), Menu.book changes, p=2r content padding (visual), weakened colocated tests, SPEC Production-Yes claims.
SKIP with reason: TYPE-02 (Space gate needs RovingFocus order change — child-first runs MenuItem activation before typeahead sees Space; handoff), TYPE-03/SUBKEY-/INTENT-01..08/CHOICE-/LINK-/COMP- (need missing parts/submenus), FOCUS-04 (no horizontal prop), FOCUS-02 quarantine form (CONTRADICTS pinned no-focus-on-pointer-open — adapt to current), CLOSE-02/03/07/10/ACT-04/05/DYNAMIC-02/04 (submenu/layer model), ACT-07 (press-drag), CLOSE-09 (dup of CLOSE-01 single-level), CLOSE-08 strict form (optimistic focus move; assert request+retention only... decide in impl), ENV-03 (shadow precedent-skip), DOM-08/10 (Popover engine), aria-orientation attr (ARIA-validity risk, no axe in repo — DOM-09 behavioral), ENV-01 if Overlay SSR-unsafe (test will tell).

## Progress
- Source ports implemented (11): cancelable onSelect(event) + defaultPrevented dismissal gate; disabled-click preventDefault; Enter/Space stopPropagation; onClick-cancel skips onSelect; RovingFocus typeahead + textValue; Tab/Shift+Tab trigger-relative continuation; restoreFocusToTrigger guards; close-transition focus restore; stable content id + aria-controls; forwardRef all parts; menu-intent.ts verbatim (unwired, unexported).
- Parity story added (Basic byte-identical); CT 2 -> 30; colocated 5 -> 7 + menu-intent.test.ts (INTENT-09).
- Proof: `pnpm agentct Menu` unit 8/8 + e2e 30/30 (react19); `--e2e --react all` 90/90 (17/18/19). 8 frozen snapshots unmodified, all green. tsc: Menu clean (7 remaining errors all other crews: Listbox/Slot/Tabs tests + ct.ts).

## Surprises
- Quarantine FOCUS-02 (focus first item on pointer open) contradicts pinned colocated test (no item focus on click) — adapted to current, flagged.
- keyboard.type('é') emits ZERO keydown in Chromium (text-insertion path); unicode typeahead step drives the real handler via dispatchEvent (commented).
- React 17 useId shim returns a fresh id EVERY render -> infinite setState loop via content-id effect (0/30). Fixed with first-render ref capture (no-op on real useId).
- RovingFocus.Item reads child.props.ref (19-only); on 17/18 consumer item refs are swallowed by cloneElement. DOM-04 gates item/trigger/content ref asserts to 19; separator ref universal. Handoff to RovingFocus crew.
- One isolated ACT-02 failure on 18 in a full-all run passed alone -> daemon-contention flake per brief.
- `CSS` is not defined in CT spec (Node-side) -> attribute selector for id-uniqueness check.
- view-story: Playwright MCP pipe broken (Broken pipe — shared-env infra, same as Tree/Calendar crews); fell back to `pnpm capture` per skill. StandardDropdown resting/opened/keyboard-entry/escape-closed all render correctly (trigger, Cut/Copy/Paste/Delete-disabled menu, focus-ring on trigger after Escape close). Zero paint drift; 8 frozen CT baselines green unmodified.

## Handoff: UX verdict (nested)
PASS (spawn accepted; verdict envelope truncated in delivery, full text recovered from reviewer session log). Look: PASS frozen (behavior/attrs/refs only, 8 snapshots byte-unmodified, 4 captures correct, quarantine p=2r correctly rejected). Feel: all 9 APPROVED — (1) cancelable onSelect(event)+dismissal gate+onClick-cancel ordering, (2) disabled preventDefault + Enter/Space stopPropagation, (3) typeahead+textValue with Space-activates preserved (TYPE-02 gap = deferred enhancement, not regression), (4) Tab trigger-relative continuation (biggest win), (5) guarded + close-transition focus restore, (6) stable id + aria-controls, (7) forwardRef all parts, (8) menu-intent unwired NO-OP, (9) FOCUS-02 adaptation over quarantine (APG-correct); uncontrolled API verified untouched. A11y: improvements (aria-controls, typeahead reach, 2.4.3 focus order, disabled guards); no new problems; aria-orientation omission endorsed; post-Escape focus ring visible. Artifacts: full Menu.tsx diff + stat, this log, SPEC adaptations, captures, CT result dirs present.

## Commit-ready arc
Files: `Menu.tsx` (11 hardening ports, zero paint), `menu-intent.ts` (new, verbatim quarantine, unwired/unexported), `menu-intent.test.ts` (new, INTENT-09), `Menu.test.tsx` (+ENV-01/02, 5 originals kept), `Menu.story.tsx` (+Parity story; Basic byte-identical), `__e2e__/Menu.ct.spec.ts` (2 originals kept + 28 parity cases), `SPEC.md` (status/index/landing note; 31/91 [x]). No snapshot changes, no book changes, no public API removals (widened onSelect param is backward-compat; textValue/refs additive). Branch: reference-system throughout; no commits made (captain lands one commit per component).

COMPLETE

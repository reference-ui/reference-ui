# PATCHES DateField — crew log

Branch: reference-system (never switch; never commit).
Scope: packages/reference-lib/src/components/DateField/* + this log only. Read-only elsewhere.
Contract: PATCHES.md EXACTLY (10 items), nothing else. Breaking changes ONLY as written in PATCHES. Visuals frozen (snapshots pass unmodified; else STOP+flag).
Proof: pnpm agentct DateField (unit+e2e green). UX: nested ux-designer review of delta.

## Timeline
- START header written
- RECON done (DateField.tsx/parse/TESTS/SPEC/DECISIONS/DateField.md/FEATURES/quarantine 1150c8e6e Slot-merge L139-1100/Slot kernel/Overlay Trigger+Content/Portal/NumberField/API-STANCE)
- VERDICT #1 STOP+FLAG: locale display (8/15/2026) replaces ISO text (2026-08-15) in all 8 snapshots = visual change, forbidden by guardrail
- VERDICT #2 BLOCKED on #1 (PATCHES: needs #1 display first); pure fns staged+unit-covered, no remainder
- VERDICT #3 START: Slot-registration Part-Resolution Law (quarantine pattern, scan->useSlot adaption)
- VERDICT #4 BLOCKED on #1 + FEATURES #3 (no isDateUnavailable; min/max dropped); no remainder
- VERDICT #5 BLOCKED on #1 (no dirty session; NumberField mirror rules absent in-tree); no remainder
- VERDICT #6 START: required passthrough both hosts + DF-FRM-04
- VERDICT #7 BLOCKED on Overlay shadow-portal contract (Overlay has zero shadow code; Overlay PATCHES empty); no remainder
- VERDICT #8 BLOCKED on #1 (needs locale segment display); no remainder
- VERDICT #9 START: aria-controls wiring (useId pickerId; Overlay.Content forwards id)
- VERDICT #10 START: trigger focus-return DateField-side (quarantine inputRef.focus; Overlay has no retention semantics anywhere)
- BEFORE baseline pnpm agentct DateField (pre-change green proof)
- AFTER baseline: E2E 15/15 + Unit 23/23 green (daemon warm)
- LAND #3 code: Slot-registration compound rewrite (law merge, conditional combobox, synthesized trigger iff picker)
- LAND #6 code: required both hosts (explicit ?? root)
- LAND #9 code: useId pickerId + input aria-controls + picker id
- LAND #10 code: trigger onClick focus-return (authored-first, disabled-guarded)
- LAND tests: DF-DOM-03 + DF-FRM-04 new; DF-CAL-01 +aria-controls; DF-CAL-03 +focus
- BEFORE post-change pnpm agentct DateField
- AFTER post-change: E2E 17/17 + Unit 23/23 green FIRST RUN (8 frozen snapshots unmodified)
- LAND #3 tests: DF-DOM-03 green
- LAND #6 tests: DF-FRM-04 green
- LAND #9 tests: DF-CAL-01 extended green (aria-controls linked)
- LAND #10 tests: DF-CAL-03 extended green (input focus retained)
- START SPEC.md honest accounting + tsc
- LAND SPEC.md: 14/64 [x]; DOM-03/FRM-04 [x]; CAL-01/CAL-03 scope caveats removed; tsc zero DateField errors; setCustomValidity code-absent (docs-only)
- ARTIFACTS: CAL-03 end-state PNG viewed (input focused w/ caret, chrome intact); webm viewing unsupported in env; test-results cleaned by concurrent crews after run; 8 snapshots green = pixel-compare drift proof; no motion code touched
- START nested ux-designer review (subagent 01a0ddc6, read-only)
- LAND UX review: APPROVED — Look PASS (live Book = frozen baselines); Feel #3/#6/#9/#10 all approved (live-verified aria-controls link + focus retention on WithPicker AND FoldedPicker); A11y: 1 pre-existing finding (unnamed default trigger, follow-up), 2 observations (aria-controls-while-closed contracted; no required * indicator, trio follow-up)
- SCOPE CHECK: touched DateField.tsx + story + spec + SPEC.md + this log ONLY (other dirty files are sibling crews'); snapshots/book/parse/index untouched; never switched branch; never committed
- COMPLETE: landed #3/#6/#9/#10 w/ proof; #1 STOP+flagged (visual); #2/#4/#5/#8 + #7 blocked w/ verified no-remainder

## Flags for the landing captain
- PATCHES #1 (controlled-locale engine) NOT implemented: rendering locale text (8/15/2026) over ISO (2026-08-15) changes all 8 snapshots — guardrail says STOP+flag, done. Unblocks #2/#4/#5/#8 when HQ schedules the visual re-pin.
- Dropped the untested `hasField` child-sniffing passthrough with #3 (quarantine has none; freeze never documented Field-authored composition). No test covers it; calling it out.
- Trigger now synthesized whenever Picker present without explicit Trigger (was: only when no explicit Input) — freeze-conformant (DF-DOM-02), unpinned edge, no existing test affected.
- UX follow-up (pre-existing): default icon-only trigger has no accessible name; suggest default aria-label in a future item.

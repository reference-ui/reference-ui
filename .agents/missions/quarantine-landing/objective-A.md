COMPLETE — Objective A (tooltip focus preset), crew lead log, 2026-09-25

# Objective A log — tooltip focus preset

Branch: `reference-system` (stay; never switch, never commit).
Work doc: `docs/MISSIONS/TOOLTIP_FOCUS_PRESET.md` (option 1).
Proof: SPEC TT-FOCUS-01/03, `pnpm agentct Tooltip` before + after.

## Blocker check (LOG-4/5 repin)
- Mission docs live at `docs/MISSIONS/`, NOT `.agents/missions/` (dispatch
  said `.agents/missions/`; that dir holds only cleanup/doom/seam missions).
  Surprise #1, non-blocking.
- LANDING.md header says PARKED 2026-09-24 ("No crews, no action. Resume on
  HQ call"). This dispatch is the resume call relayed via the mission
  captain; proceeding. Surprise #2, logged not blocked.
- Repin: no explicit suite-wide-repin commit found in history, BUT the
  oracle is present in-tree — `Tooltip/__e2e__/__snapshots__/` holds 19
  baseline PNGs and the CT spec + source are intact. Hard-block test:
  baseline `pnpm agentct Tooltip` must pass unmodified. If green → not
  blocked. If red on pristine tree → log + report, no implement.

## Progress
- [x] Read LANDING.md, TOOLTIP_FOCUS_PRESET.md, LOG-4.md, LOG-5.md, QUARANTINE_RECON.md
- [x] Read test-component skill
- [x] Baseline `pnpm agentct Tooltip` (pristine tree): 12/12 + unit 3/3
- [x] Checklist 1-3: isFocusVisible gate in onTriggerFocus (tracker already
  wired via ReferenceLibrary.setupFocusVisible; Slider.tsx:261 precedent)
- [x] Checklist 4: migrate 4 CT tests to Tab (S3 adaptation for dialog tests)
- [x] Checklist 5: add TT-FOCUS-03 regression test
- [x] Checklist 6: mark TT-FOCUS-01/03 [x] in SPEC.md
- [x] Checklist 7: `pnpm agentct Tooltip` green after — 13/13 + unit 3/3,
  all snapshots on UNMODIFIED baselines; R18 13/13; R17 9/13 with 4
  pre-existing hover-path failures (stash-A/B proven, S5)
- [x] view-story visual check (Book FocusVisible story: resting clean,
  click→no immediate tip, Tab→ring+tip live; only pre-existing css()
  warnings + favicon 404 in console)
- [x] ux-designer review worker verdict: **APPROVE** (genuine enhancement,
  not behavior loss; all 4 brief points PASS; no blocking a11y findings;
  one SR-modality observation for awareness — see Handoffs)

## Surprises
- S1: mission docs path mismatch (docs/MISSIONS vs .agents/missions).
- S2: LANDING PARKED header vs active dispatch — treating dispatch as resume.
- S3: doc's literal "Tab until focused" cannot work in NestedOverlay: the
  dialog has ONE tabbable + FocusLock trap wraps Tab to self, and safeFocus
  no-ops when already focused (FocusLock.tsx:84) → no focus event, tip never
  opens. Adaptation: blur() (focus leaves to body; trap allows it) then real
  Tab (trap re-enters via safeFocus with keyboard modality). Open step stays
  an honest keyboard Tab; documented in-test.
- S5: React 17 shows 4 failures (TT-GROUP-01/02/03, TT-CLOSE-03 — all
  hover-path, untouched by this objective). Proven PRE-EXISTING via stash
  A/B: pristine tree fails the identical 4 (8 passed); my tree fails the
  same 4 (9 passed, +1 = new TT-FOCUS-03). React 18: 13/13. React 19:
  13/13 incl. all snapshots on unmodified baselines.
- S4 (predicted, to verify): nested-dialog-tooltip-open.png baseline shows NO
  ring (script .focus() after click → :focus-visible unmatched). Honest Tab
  re-entry matches :focus-visible → UA ring WILL render → possible ring-only
  snapshot drift. focus-open-btn-a/anchored-top baselines already carry the
  ring (fresh-page script focus matches) → Tab reproduces identically. If S4
  materializes: component paint did not move for any real user (Tab always
  rang); baseline encoded the buggy impossible state. Re-pin needs HUMAN yes
  per test-component law — escalate with diff evidence, do not re-pin.

## Handoffs
- UX sign-off: APPROVE (nested worker objA-ux-review). Awareness note (not
  blocking): SR virtual-cursor focus arriving in pointer modality no longer
  pops the tip until a keypress flips modality — matches the chosen
  :focus-visible direction; captain may note in commit message.
- React 17: 4 pre-existing hover-path failures (TT-GROUP-01/02/03,
  TT-CLOSE-03), stash-A/B proven identical on pristine tree. Not this
  objective's scope; Objective B lib crew will inherit.
- Commit-ready arc (single checklist commit per landing law): 3 modified
  files (Tooltip.tsx +2 lines, Tooltip.ct.spec.ts 4 migrations + 1 new
  test, SPEC.md 2 checkbox flips) + this log. No re-pins, no new props,
  FocusLock/Overlay/focus-visible untouched.

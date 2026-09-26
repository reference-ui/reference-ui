# Tooltip decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

Thin Overlay policy: hover/focus descriptions via `aria-describedby` (Gate 5).

## Landed (context, 2-4 lines)

Tooltip had no quarantine freeze, so its landing arc was Objective A: the
tooltip focus preset — an `isFocusVisible()` gate in `onTriggerFocus`
(Tooltip.tsx:212), 4 CT tests migrated to honest keyboard Tab, and new
regression `TT-FOCUS-03`. Proof: `.agents/missions/quarantine-landing/objective-A.md`,
landing commit `4cdee7af7` (13/13 CT + 3/3 unit, R18/R19 green, UX APPROVE).

## Candidate features (quarantine-sourced)

None — quarantine never touched Tooltip: no freeze commit exists, and the
`7aea45265..components-quarantine` diffstat on `Tooltip/`, the tooltip
matrix e2e/unit specs, and the tooltip fixture is empty (confirmed by the
Overlay crew log's untouched list).

## Suspected gaps (no quarantine source)

### 1. Dev-only non-interactive-Content diagnostic — verdict: OPEN

- **Evidence:** SPEC.md "API freeze decisions" mandates it: "development
  builds should diagnose focusable descendants" (SPEC.md:78-81), and
  `TT-DOM-10` specifies the warning. `TooltipContent` (Tooltip.tsx:399-438)
  renders children with no descendant scan and no `console.warn`/`__DEV__`
  branch anywhere in Tooltip.tsx — `grep` for both is empty.
- **API sketch:** no new props. Dev-only effect in `TooltipContent` that
  queries for `a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])`
  and warns once per mount identifying the offending element. Zero runtime
  cost in production.
- **Why not landed:** Objective A froze scope to the focus preset (3 files,
  no new behavior); Gate 5 declared remaining `[ ]` IDs non-production
  (SPEC.md:71-74), and the Content contract ("non-interactive", Popover
  owns interactive hover) was deemed enforceable by docs alone.
- **Revisit when:** a crew is assigned any Tooltip correctness pass — no
  product trigger needed; the freeze decision already orders it.
- **Open questions:** warning channel (console.warn vs shared diagnostics
  helper?) and copy; whether to warn once per Content type per session to
  avoid console spam in icon-button-heavy pages.

### 2. Disabled-while-open close request — verdict: OPEN

- **Evidence:** Tooltip.md:65-67 documents it as shipped behavior: "if an
  already described Trigger becomes disabled, Tooltip requests one
  controlled close". Source has zero `disabled` handling (`grep` on
  Tooltip.tsx/tooltipGroup.ts is empty) — no prop watch, no
  MutationObserver, no effect. `TT-FOCUS-07` (Base UI port) is `[ ]`.
- **API sketch:** no new props. When the open Trigger's resolved native
  node becomes disabled, fire one `onDismiss()`; on acceptance remove
  Content + owned descriptor without moving focus back to the disabled
  node (per TT-FOCUS-07).
- **Why not landed:** same scoping as item 1 — Objective A was the focus
  preset only, and Gate 5 stopped Tooltip before the focus/modality tail.
  Native disabled buttons also swallow most pointer events, so the gap
  bites mainly for ARIA-disabled or dynamically-disabled triggers.
- **Revisit when:** HQ schedules the TT-FOCUS tail, or a consumer reports
  a stale tip on a dynamically-disabled trigger.
- **Open questions:** native `disabled` only, or also `aria-disabled`
  triggers (which still fire events)? Poll via effect on rerender vs
  MutationObserver on the `disabled` attribute?

### 3. SR virtual-cursor focus arriving in pointer modality — verdict: DECLINED

- **Evidence:** Objective A UX-review handoff (objective-A.md:65-68):
  screen-reader virtual-cursor focus arriving while modality is pointer
  no longer pops the tip until a keypress flips modality to keyboard.
- **API sketch:** would require a modality bypass (e.g. treat AT-driven
  focus as keyboard, or an `openOnAnyFocus` escape hatch) — new API for
  an unproven need.
- **Why not landed:** matches the chosen `:focus-visible` direction the
  preset deliberately implements; the ux-designer worker returned
  APPROVE with this as awareness-only, not a finding.
- **Revisit when:** a real SR-user report shows descriptions being missed
  because of the gate — not on theoretical modality analysis.
- **Open questions:** none — killer reason: bypassing the gate would
  reintroduce the pointer-focus pop the preset was built to kill.

## Non-decisions (rejected outright)

- Public `Tooltip.Provider` — left as API per Tooltip.md:93-95; document
  group lives on ReferenceLibrary (`tooltip.skipDelay`).
- Interactive Content / HoverCard-as-Tooltip — Popover `openOnHover`
  owns it (SPEC.md:21, Tooltip.md:100-102).
- FocusLock, inert, trap, safe-polygon, Presence exit, flip/shift
  catalog — explicitly do-not-add (SPEC.md:23-24); collision math is
  Overlay's (`OV-POS-*`/`OV-SCRL-*`).
- Quarantine mangling classes (controlled-only rewrites, renames, chrome
  removal) — n/a: no Tooltip quarantine diff exists to reject.

## Walkthrough notes for HQ

- Most important: item 1 (dev diagnostic) — the freeze mandates it, the
  source lacks it; in Book `Tooltip → Top`, drop a `<button>` inside
  Content and note the silence. Cheapest real gap in the file.
- Second: item 2 (disabled close) — documented in Tooltip.md:65-67 but
  unimplemented; walkthrough question is just native-vs-ARIA scope.
- Third: item 3 is already decided (DECLINED) — ratify by trying Book
  `Tooltip → FocusVisible`: click the trigger (no tip), then Tab to it
  (ring + tip). That contrast IS the Objective A behavior to keep.

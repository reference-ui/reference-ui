# Overlay decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

One line: one React kernel for layered content — geometry, isolation, dismissal.

## Landed (context, 2-4 lines)

Objective B verified a NO-OP: quarantine never froze Overlay (no freeze
commit; the sole 1-line drive-by was ruled do-not-lift), so zero source
files changed and the green baseline IS the proof — E2E 117/117 +
unit 30/30 on unmodified baselines, plus nested UX SIGN-OFF.
Log: `.agents/missions/quarantine-landing/objective-B-overlay.md`;
record commit `931feb84c` (verified via `git log`).

## Landed (features campaign 2026-09-26)

1. Shadow destination rule — AUTOMATIC: omitted container follows
   `trigger.getRootNode()` into a ShadowRoot; explicit wins.
   `parts/portal-container.ts` + `OV-ENV-05`.
2. Layer/dismissal accounting — coordinator-logs + prose/CT audit: one
   entry per pair, branch via `parentId`, one sequence per modality.
   `Overlay.md` + `OV-LAYER-11`. No dev diagnostic.
3. Dismiss vocabulary — canonical real-events-everywhere; no new verb
   without a consumer. `Overlay.md` + `OV-ESC-08` / `OV-OUT-12`.
4. Closed-content observability — NON-GOAL (b): unmount-when-closed
   absolute; coordinators read authored children + metadata
   (Combobox `authored.ts`). `Overlay.md` + SPEC Out of scope.
5. Trigger-toggle focus retention — still HOLD-FOR-HQ (untouched).
6. Tab-bridge reject semantics — still HOLD-FOR-HQ (untouched).

## Candidate features (quarantine-sourced)

None — quarantine surfaced no Overlay API or functionality. The entire
quarantine diff on `Overlay/` is one type annotation on
`parts/Backdrop.tsx` (tip `89850d1c8`), ruled do-not-lift per
`docs/MISSIONS/QUARANTINE_RECON.md` §6 (see Non-decisions); dependent
rewrites (Menu/Combobox/DateField) consume unchanged Overlay contracts,
so there is zero quarantine-sourced backlog to decide.

## Suspected gaps (no quarantine source)

Moved — every item below now lives in `FEATURES.md` (all 6 need an HQ
design call) or `PATCHES.md` (empty: zero test-pinnable gaps). Titles kept
for traceability; full text, evidence, and API sketches moved with them.

1. Documented shadow destination rule for overlay consumers — moved to `FEATURES.md` #1 (needs the HQ destination call: consumer-authored vs automatic).
2. Layer/dismissal accounting audit for composed consumers — moved to `FEATURES.md` #2 (needs the HQ accounting-shape call before Combobox can assert).
3. Granular dismiss-handler vocabulary as the shared contract — moved to `FEATURES.md` #3 (needs the HQ canonical-vocabulary call).
4. Closed-content observability for coordinators — moved to `FEATURES.md` #4 (needs the HQ architectural call on unmount-when-closed).
5. Trigger-toggle focus retention — moved to `FEATURES.md` #5 (needs the HQ toggle-focus choreography call).
6. Tab-bridge reject semantics — moved to `FEATURES.md` #6 (needs the joint controlled-accept handshake design with Menu/Popover).

## Non-decisions (rejected outright)

- Backdrop 1-line type annotation (quarantine tip `89850d1c8`): explicit-parameter drive-by on sound contextual typing, ruled do-not-lift — recon §6 + `objective-B-overlay.md` "Quarantine inspection log".
- Native `<dialog>` second runtime, semantic Dialog/Drawer/Popover components, visual styles, snap points, iOS scale-behind, public Provider, drag-anywhere on Content, `@floating-ui/react` as runtime: out of scope per SPEC.md "Out of scope".
- react-remove-scroll's independent `isDisabled` convenience path: no second scroll switch — SPEC.md "Out of scope" (open Overlay with isolation `scroll` always owns its lock through Presence exit).
- FloatingArrow chrome, hover grace / impatient click / skip-delay, Spectrum positioner, Radix popper, Toast queue, `as` prop, styles: leave/other-owner per `Overlay.md` "Leave" + "Convergence".
- TalkBack virtual-modality skip: FocusLock-owned — SPEC.md "Owned elsewhere" ("Do not copy FocusLock / Portal / Popover catalogs into Overlay").
- Quarantine dependent-rewrite pressure on Overlay contracts (Menu/Combobox/DateField rewrites): none — same `Overlay` / `useOverlay` / `OverlayContentProps` / `OverlayDismissHandlers` / `overlayStackStore` surface, recorded in `objective-B-overlay.md`.

## Walkthrough notes for HQ

- Most important #1: the shadow destination rule is **open** — see `FEATURES.md` #1. In Book, open the Overlay dialog story and ask "where would this portal if the trigger lived in a ShadowRoot?" — today there is no answer; decide consumer-authored vs automatic before any shadow consumer ships. (Portal owns the event half — decide the destination half here.)
- Most important #2: layer/dismissal accounting audit is **open** — see `FEATURES.md` #2. In Book, open a Combobox popover inside a modal dialog story, press Escape, and ask "who logged that layer, and where is the once-only proof?" — that proof surface is this decision.
- Most important #3: closed-content observability is **open** — see `FEATURES.md` #4. In Book, open any closed Combobox and ask "can the coordinator know popover content exists without mounting it?" — a yes means a new Overlay metadata surface; a no keeps the kernel absolute and pushes the answer to authored-children inspection.
- Bonus feel: trigger-toggle focus (see `FEATURES.md` #5) is the cheapest open item to feel — in Book's DateField picker story, click the trigger to toggle closed and watch focus land on the button instead of staying in the text; the fix shape is one Overlay choreography call.
- Rounding out the set: handler vocabulary (`FEATURES.md` #3) and Tab-bridge reject (`FEATURES.md` #6, joint with Menu/Popover). `PATCHES.md` is empty — no gap is test-pinnable today, so every walkthrough stop lives in `FEATURES.md`.

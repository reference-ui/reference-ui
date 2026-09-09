# Popover SPEC

Current freeze, cases, and proof. Design narrative: [Popover.md](./Popover.md).
System orchestration: [OVERLAYS.md](../../../OVERLAYS.md).
Kernel cases: [Overlay SPEC](../Overlay/SPEC.md).

Playwright: `matrix/lib/tests/e2e/popover.spec.ts`
Page: `/popover`
Unit: `safe-polygon.test.ts` · `hover.test.ts` · `ssr.test.tsx`

---

## Next agent — Tooltip Gate 5

**Popover Gate 4 is shipped.** Overlay is the kernel. Popover is Overlay with
`isolation` frozen **off**, plus hover policy Overlay must not own.

Do not add a second `computePosition`, dismiss stack, Tab-order bridge,
Presence, `edge`/`Handle`, or FocusLock. Do not copy Overlay `OV-POS-*` /
`OV-LAYER-*` / `OV-TRG-05` / `OV-SCRL-*` / `OV-PRES-*` / `OV-ESC-*` /
`OV-OUT-*` onto Popover. HoverCard is this composition, not a primitive.
Interactive hover is Popover; non-interactive description is Tooltip.

### What Popover supports (the surface)

| Axis | Public surface | Overlay seam |
| :--- | :--- | :--- |
| Policy | `openOnHover`, delays, impatient click, hover vs keyboard | Overlay does not own hover grace |
| Geometry | Trigger-as-default-anchor; optional virtual `anchor` | One `computePosition` on Overlay.Content |
| Isolation | Frozen off; no Handle | Isolating content uses Overlay directly |
| Layer | Registers as a modeless Overlay layer | Stack, Escape, outside, Tab bridge are Overlay |

### Do not duplicate

| If you are about to write… | Stop. It lives here |
| :--- | :--- |
| Flip / shift / offset / arrow / size / hide / autoUpdate / virtual rects | Overlay `OV-POS-*` |
| Portal element vs ref vs function | Portal; Overlay smokes one container `OV-DOM-04` |
| Escape / outside / cascade / same-tick opener | Overlay `OV-ESC-*` / `OV-OUT-*` |
| Tab bridge Trigger → portalled Content | Overlay `OV-TRG-05` |
| Restore after Presence, proximity walk, shards | Overlay `OV-RESTORE-*` + FocusLock `FL-OV-04` |
| `closeOnScroll` ancestor discovery | Overlay `OV-SCRL-01` / `02` |
| Presence exit / reduced motion | Overlay `OV-PRES-*` |
| `[react:all]` / `[browser:all]` as extra fixtures | Matrix runner / Playwright projects |
| Skip-delay / `aria-describedby` | Tooltip |
| `useDismiss`, `FloatingTree`, modal Popover, cursor-follow | Out of scope |

Do not add `PO-*` titles unless a production bug names a hole in **hover
policy**. Overlay-port smokes already here (`PO-FLIP-01`, `PO-SHIFT-01`,
`PO-ARROW-01`, `PO-LAYER-01`) stay; do not grow that matrix.

### Status (2026-09-09)

| | |
| :--- | :--- |
| Engine | Shipped (`isolation={false}` Overlay + safe polygon + impatient click + keyboard hover) |
| Production | **Gate 4 done.** Owned hover Must/Should proven. Overlay catalogs are Won't do. |
| Named proven | `PO-DOM-01` / `02`, `PO-FLIP-01`, `PO-SHIFT-01`, `PO-ARROW-01`, `PO-HOVER-01`–`05` / `07`–`11`, `PO-LAYER-01`, `PO-ENV-01` |
| Playwright | `popover.spec.ts` (18) · unit polygon / pointer / SSR |

### Work order (Gate 4) — DONE

1. Safe polygon (Floating UI / Aria hull). Leave `FloatingTree`.
2. `PO-HOVER-02` is a **diagonal through empty space**, not delay coverage.
3. `PO-HOVER-03` / `04` / `05` — leave, return through gap, abandon slow/reverse
   / opposite-side.
4. `PO-HOVER-07` / `08` — impatient vs patient Trigger click.
5. `PO-HOVER-09` — touch must not start mouse hover timers.
6. `PO-HOVER-10` / `11` — focus inside Content keeps hover-open; keyboard focus
   opens without delay.
7. `PO-LAYER-01` smoke — Popover registers on Overlay's stack.
8. `PO-ENV-01` — closed SSR.

**Stop Popover.** Next family gate is Tooltip skip-delay (`TT-SKIP-01`,
`TT-ESC-01`, `TT-SCROLL-01`).

### Done when

- Owned hover rows in this file are `[x]` with prose-level asserts.
- Overlay-owned IDs are Won't do (below), not homework.
- No new Overlay SPEC cases. No second geometry engine on Popover.

**This file is at that bar.** Remaining IDs are Won't do (below), not homework.

---

## Freeze

Omitted positioning is Overlay's: `placement="bottom-start"`, `offset=8`,
collision padding 8, flip/shift on, absolute, body portal. Hover opening is
opt-in. Trigger click / Enter / Space stay Overlay activation.

Hover defaults: 700ms open, 300ms close, 300ms impatient-click, 5px safe-area
padding. Polygon uses live `data-side`, not the preferred placement token.
`closeOnScroll` is Overlay's, default `false` here.

Isolation cannot be turned on. `edge` / Handle are not Popover. `Popover` and
`Popover.Portal` render no host. `Popover.Trigger` is `Overlay.Trigger`.
`Popover.Content` / `Arrow` wrap Overlay parts.

Unprevented native Trigger activation requests open/dismiss after the consumer
handler. `openOnHover` adds hover intent and keyboard-focus open (no delay).
Pointer-down focus does not use the keyboard-open path (click still toggles).

## Legend

- `[x]` Playwright title contains this case ID **and** the test asserts the
  prose, **or** the case is Won't do with a reason in the row and the table.
- `[ ]` Specified; not proven. Engine may still exist in source.

## Source evidence

- Floating UI `safePolygon.ts` — cursor triangle, trough, `requireIntent`.
- Base UI `safePolygon.test.ts` — trough stay / opposite-side leave.
- React Aria `useSafeArea.ts` — padded hull.
- Overlay SPEC — geometry, dismiss, Tab bridge, Presence, scroll-close.
- Radix popover e2e — nested registration; combined cases live on Overlay.

## Part contract

`Popover.Trigger` is a fixed `ReferencePartProps<"button">` part;
`Popover.Content` and `Popover.Arrow` are fixed
`ReferencePartProps<"div">` parts. `Popover` and `Popover.Portal` are
transparent. Shared `PART-*` checks live in `TESTING.md`. Cases below add only
Popover-specific anatomy and hover policy.

## Required cases

### DOM, trigger state, and portal

- [x] `PO-DOM-01` `[reference]` `[browser]` —
  **Popover should render only its documented native parts when it uses the
  default body portal.**
  Mount an open Popover with Trigger, Content, Arrow, and transparent Portal
  configuration. Assert Popover and Portal add no host, Trigger is the one
  authored `button`, Content and Arrow are `div` elements, and the Content
  subtree is under `document.body`.
- [x] `PO-DOM-02` `[reference]` `[browser]` —
  **Popover should expose controlled trigger state when its Content mounts and
  unmounts.**
  Toggle controlled `open` while retaining the same Trigger and Content
  instances across rerenders. Assert `aria-expanded` reflects the prop,
  `aria-controls` stably names mounted Content, and open/closed data hooks
  update atomically; generic native-prop coverage belongs to `PART-PROP-01`.
- [x] `PO-DOM-03` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Authored vs generated IDs are `PART-PROP-01`.
  `PO-DOM-02` already asserts `aria-controls` tracks mounted Content.
- [x] `PO-DOM-04` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Positioning attributes and
  `--reference-overlay-*` are Overlay `OV-POS-02`.
- [x] `PO-DOM-05` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Arrow `edgePadding` is Overlay `OV-POS-05`.
  `PO-ARROW-01` is the one Overlay-port smoke.
- [x] `PO-DOM-06` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Portal destinations are Portal;
  Overlay smokes one container in `OV-DOM-04`.
- [x] `PO-DOM-07` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Triggerless virtual `anchor` is Overlay
  `OV-POS-09` + `OV-TRG-06`. Popover does not invent a hidden Trigger.
- [x] `PO-DOM-08` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Visual Arrow `padding` vs `edgePadding`
  is Overlay `OV-POS-05`.
- [x] `PO-DOM-09` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Consumer transforms stay opaque in
  Overlay `OV-POS-04`.
- [x] `PO-DOM-10` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Positioning defaults are Overlay
  `OV-POS-02`. Hover opening disabled by default is the `PO-HOVER-01`
  control (HoverCard opts in; click fixture does not hover-open).
- [x] `PO-DOM-11` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** `button[type="button"]` is Overlay
  `OV-TRG-02`.

### Controlled open and dismissal

- [x] `PO-CTRL-01` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Trigger activation order is Overlay
  `OV-TRG-03`. Unnamed click/Escape/outside tests already exercise the
  Popover composition.
- [x] `PO-CTRL-02` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Programmatic `open` is Overlay
  `useOverlayOpenState`. `PO-DOM-02` toggles controlled state.
- [x] `PO-CTRL-03` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Controlled reject is Overlay open-state.
  Hover emits one `onOpen` per intent (`PO-HOVER-01`); leave cancels the timer.
- [x] `PO-CTRL-04` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** `preventDefault` on Trigger click is
  Overlay Law 4 / `OV-TRG-03`.
- [x] `PO-CLOSE-01` `[vendor]` `[browser:all]` —
  **Won't do as a Popover fixture.** Escape order is Overlay `OV-ESC-01`.
  Unnamed Popover Escape test is the composition smoke.
- [x] `PO-CLOSE-02` `[vendor]` `[browser]` —
  **Won't do as a Popover fixture.** Inside vs outside is Overlay `OV-OUT-02`.
  Unnamed Popover outside-press test is the composition smoke.
- [x] `PO-CLOSE-03` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Granular `preventDefault` is Overlay
  `OV-ESC-02` / `OV-OUT-03`.
- [x] `PO-CLOSE-04` `[vendor]` `[touch]` —
  **Won't do as a Popover fixture.** Nested touch defer is Overlay `OV-OUT-06`.
- [x] `PO-CLOSE-05` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Same-tick opener ignore is Overlay
  `OV-OUT-04`.
- [x] `PO-CLOSE-06` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Non-modal is Overlay `OV-ISO-02`.
  Popover freezes `isolation={false}`; `PO-LAYER-01` is the stack smoke.
- [x] `PO-CLOSE-07` `[vendor]` `[browser]` —
  **Won't do as a Popover fixture.** Password-manager overlay is Overlay
  `OV-OUT-07` (parked for modal). Modeless geometric outside is `OV-OUT-11`.

### Focus restore

- [x] `PO-FOCUS-01` `[convergence]` `[browser]` —
  **Won't do as a Popover fixture.** Restore **when** is Overlay Presence;
  restore **where** is FocusLock. Popover mounts no FocusLock.
- [x] `PO-FOCUS-02` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Unconditional Trigger restore is FocusLock
  `FL-RESTORE-*` / Overlay `OV-RESTORE-04`.
- [x] `PO-FOCUS-03` `[vendor]` `[browser]` —
  **Won't do as a Popover fixture.** Deleted-opener walk is FocusLock
  `FL-OV-05` / `FL-RESTORE-03`.
- [x] `PO-FOCUS-04` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Portalled modeless shard is Overlay
  `OV-FOCUS-07` + FocusLock `FL-OV-04`. `PO-LAYER-01` is the registration smoke.
- [x] `PO-FOCUS-05` `[convergence]` `[browser]` —
  **Won't do as a Popover fixture.** Tab bridge is Overlay `OV-TRG-05`.
- [x] `PO-FOCUS-06` `[convergence]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay `OV-TRG-05`.
- [x] `PO-FOCUS-07` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay `OV-TRG-05` (empty tabbables).
- [x] `PO-FOCUS-08` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Consumer `preventDefault` on Tab is Overlay
  Law 4 + `OV-TRG-05`.
- [x] `PO-FOCUS-09` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Controlled reject of focus-leave is Overlay
  open-state. Popover does not reclaim (isolation off).

### Base placement, flip, shift, arrow, size, virtual, scroll, auto-update, Presence

- [x] `PO-POS-01` `[vendor]` `[unit]` —
  **Won't do as a Popover fixture.** Overlay geometry unit tests / `OV-POS-*`.
- [x] `PO-POS-02` `[vendor]` `[unit]` —
  **Won't do as a Popover fixture.** Overlay `OV-POS-04`.
- [x] `PO-POS-03` `[vendor]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay `OV-POS-10` (RTL).
- [x] `PO-POS-04` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay finite-geometry / zoom cases.
- [x] `PO-POS-05` `[vendor]` `[unit]` —
  **Won't do as a Popover fixture.** Overlay middleware reset bound.
- [x] `PO-FLIP-01` `[vendor]` `[browser:all]` —
  **Popover should flip to the opposite side when its preferred side overflows
  and the opposite side fits.** Overlay-port smoke. Do not grow `PO-FLIP-02+`.
- [x] `PO-FLIP-02` `[vendor]` `[unit]` —
  **Won't do as a Popover fixture.** Overlay flip `bestFit`.
- [x] `PO-FLIP-03` `[vendor]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay alignment-only flip.
- [x] `PO-SHIFT-01` `[vendor]` `[browser:all]` —
  **Popover should shift within collision padding when Content partially
  overflows the viewport.** Overlay-port smoke. Do not grow `PO-SHIFT-02+`.
- [x] `PO-SHIFT-02` `[vendor]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay nested clip ancestors.
- [x] `PO-SHIFT-03` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay `collisionPadding={0}`.
- [x] `PO-HIDE-01` `[vendor]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay `data-anchor-hidden`.
- [x] `PO-HIDE-02` `[vendor]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay `data-escaped`.
- [x] `PO-ARROW-01` `[vendor]` `[browser:all]` —
  **Popover should center Arrow on its anchor when Content has enough usable
  cross-axis space.** Overlay-port smoke. Do not grow `PO-ARROW-02+`.
- [x] `PO-ARROW-02` `[vendor]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay arrow `edgePadding` clamp.
- [x] `PO-ARROW-03` `[vendor]` `[unit]` —
  **Won't do as a Popover fixture.** Overlay arrow/flip reset.
- [x] `PO-ARROW-04` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay non-finite arrow coords.
- [x] `PO-SIZE-01` `[vendor]` `[unit]` —
  **Won't do as a Popover fixture.** Overlay size middleware.
- [x] `PO-SIZE-02` `[vendor]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay available-size CSS vars.
- [x] `PO-SIZE-03` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Menu/Listbox consume Overlay vars;
  composition, not a Popover engine.
- [x] `PO-SIZE-04` `[vendor]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay observer-loop settle.
- [x] `PO-VIRTUAL-01` `[vendor]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay `OV-POS-09`.
- [x] `PO-VIRTUAL-02` `[vendor]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay `OV-POS-09`.
- [x] `PO-VIRTUAL-03` `[vendor]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay auto-update of virtual rects.
- [x] `PO-VIRTUAL-04` `[vendor]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay owner-window geometry.
- [x] `PO-VIRTUAL-05` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Trigger vs `anchor` split is Overlay
  `OV-TRG-06` + `OV-POS-09`.
- [x] `PO-VIRTUAL-06` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay stale-anchor observers.
- [x] `PO-SCROLL-01` `[reference]` `[browser:all]` —
  **Won't do as a Popover fixture.** Overlay `OV-SCRL-01` (omitted / false).
- [x] `PO-SCROLL-02` `[vendor]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay `OV-SCRL-02`.
- [x] `PO-SCROLL-03` `[vendor]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay `OV-SCRL-01` unrelated / field scroll.
- [x] `PO-SCROLL-04` `[vendor]` `[shadow]` —
  **Won't do as a Popover fixture.** Overlay composed overflow ancestors.
- [x] `PO-AUTO-01` `[vendor]` `[browser:all]` —
  **Won't do as a Popover fixture.** Overlay autoUpdate ancestor scroll.
- [x] `PO-AUTO-02` `[vendor]` `[browser:all]` —
  **Won't do as a Popover fixture.** Overlay resize / ResizeObserver.
- [x] `PO-AUTO-03` `[vendor]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay layoutShift while live.
- [x] `PO-AUTO-04` `[vendor]` `[browser:all]` —
  **Won't do as a Popover fixture.** Overlay visualViewport / zoom.
- [x] `PO-AUTO-05` `[vendor]` `[shadow]` —
  **Won't do as a Popover fixture.** Overlay `OV-POS-12`.
- [x] `PO-AUTO-06` `[vendor]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay iframe coordinate space.
- [x] `PO-AUTO-07` `[vendor]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay top-layer containing block.
- [x] `PO-AUTO-08` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay listener teardown on close.
- [x] `PO-AUTO-09` `[vendor]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay fixed-in-dialog containing block.
- [x] `PO-PRES-01` `[reference]` `[browser:all]` —
  **Won't do as a Popover fixture.** Overlay `OV-PRES-01`.
- [x] `PO-PRES-02` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay `OV-PRES-05`.
- [x] `PO-PRES-03` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay `OV-PRES-04`.
- [x] `PO-PRES-04` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay layer vs Presence restore timing.
- [x] `PO-PRES-05` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Overlay exiting-content inerting.

### Interactive hover (`openOnHover`)

- [x] `PO-HOVER-01` `[convergence]` `[browser]` —
  **Popover should issue one delayed open request when a mouse remains over an
  `openOnHover` Trigger.**
  Enter Trigger with a real mouse, sample before and at concrete `openDelay`,
  and repeat while leaving before the deadline. Assert the sustained path
  mounts Content only after the delay and the early leave permanently cancels
  its pending timer.
- [x] `PO-HOVER-02` `[convergence]` `[browser]` —
  **Popover should stay open when the pointer travels diagonally from Trigger
  toward interactive Content.**
  With controlled open Content separated from Trigger, sample a diagonal mouse
  path through the documented padded safe polygon and end inside Content.
  Assert no close timer or `onDismiss` starts at any point, preserving access
  across the physical portal gap.
- [x] `PO-HOVER-03` `[convergence]` `[browser]` —
  **Popover should request delayed close when the pointer leaves the safe
  region and should cancel it on reentry.**
  Move from an open Trigger along a path outside the Trigger/Content polygon,
  sample before and after `closeDelay`, and repeat with reentry before expiry.
  Assert the sustained-away path calls `onDismiss` once after the delay while
  reentry cancels the timer without reopening or another callback.
- [x] `PO-HOVER-04` `[vendor]` `[browser]` —
  **Popover should preserve one open interaction when the pointer moves from
  Content back to Trigger through their padded gap.**
  Traverse Content → padded corridor → Trigger and sample node identity,
  callback logs, and coordinates throughout. Assert no close/open request,
  remount, or positioning restart occurs while the pointer remains inside the
  combined interactive region.
- [x] `PO-HOVER-05` `[vendor]` `[browser]` —
  **Popover should leave hover grace when pointer travel is slow, reversed, or
  crosses the side opposite Content.**
  From Trigger, sample each away-intent path while Content is open and advance
  the close timer. Assert every path exits grace and requests one delayed close
  rather than indefinitely treating arbitrary space as safe, matching the
  away-corridor cases in Base UI `safePolygon.test.ts`.
- [x] `PO-HOVER-06` `[reference]` `[rtl]` —
  **Won't do as a 12-placement / RTL e2e matrix.** Polygon math is physical
  `data-side` (four-side trough / opposite-leave proven in
  `safe-polygon.test.ts`). RTL alignment is Overlay `OV-POS-10`. Collision
  flip is Overlay-port `PO-FLIP-01`; grace reads live `data-side`, not the
  preferred token.
- [x] `PO-HOVER-07` `[vendor]` `[browser]` —
  **Popover should remain open when Trigger is clicked within the
  300-millisecond impatient window after hover-open.**
  Hover through `openDelay`, accept controlled open, and click Trigger before
  the frozen impatient-click threshold elapses. Assert native consumer click
  still runs but no `onDismiss` request toggles the just-opened Popover.
- [x] `PO-HOVER-08` `[reference]` `[browser]` —
  **Popover should use normal Trigger dismissal when a deliberate click occurs
  after the patient threshold.**
  Hover-open and keep controlled Content open beyond 300 milliseconds, then
  click Trigger. Assert consumer click runs first followed by exactly one
  `onDismiss`.
- [x] `PO-HOVER-09` `[reference]` `[touch]` —
  **Popover should avoid mouse-intent timers when touch or non-hover pen input
  synthesizes pointer entry.**
  Send touch pointer enter and contacting-pen sequences over a closed
  `openOnHover` Trigger, then advance all delays. Assert no `onOpen`.
- [x] `PO-HOVER-10` `[reference]` `[browser]` —
  **Popover should stay open when pointer or focus remains in interactive hover
  Content.**
  Put a control in Content, hover-open, move keyboard focus into that control,
  then move the pointer outside. Assert no hover dismissal while focus remains
  inside Trigger/Content.
- [x] `PO-HOVER-11` `[convergence]` `[browser]` —
  **Popover should share one open intent when keyboard focus drives an
  `openOnHover` instance.**
  Tab to Trigger without mouse entry, accept its immediate open request, move
  focus into Content, then move focus outside both. Assert focus opens without
  hover delay, Content focus keeps it open, and leaving both requests one close.

### Layer smoke and SSR

- [x] `PO-LAYER-01` `[reference]` `[browser]` —
  **Popover should register once when it is a child layer of Overlay.**
  Open Overlay, then a nested Popover, inspect live layer count, press one
  Escape, and exit. Assert one child layer on Overlay's stack and that Escape
  closes only the Popover. Full ordering / FocusLock shard solving stay Overlay
  `OV-LAYER-*` / `FL-OV-04`.
- [x] `PO-ENV-01` `[reference]` `[ssr]` —
  **Popover should server-render safely when closed.**
  Render a closed Trigger/Content declaration without layout globals. Assert
  no Content host, one authored Trigger button, and no hydration-only overlay
  markup. Positioning/observers start only after client open (Overlay
  `OV-POS-11` for the engine).
- [x] `PO-ENV-02` `[reference]` `[react:all]` —
  **Won't do as a Popover fixture.** `[react:all]` is the matrix runner axis
  (`pnpm agent test --packages=@matrix/lib`). Same reason as FocusLock
  `FL-ENV-02`.
- [x] `PO-ENV-03` `[reference]` `[browser:all]` —
  **Won't do as a fourth copy of the same smokes.** `[browser:all]` is the
  Playwright project matrix. Core IDs already tagged on `PO-FLIP-01`,
  `PO-SHIFT-01`, `PO-ARROW-01`, `PO-HOVER-01`–`05`.
- [x] `PO-A11Y-01` `[reference]` `[browser]` —
  **Won't do as a separate axe suite.** `PO-DOM-01` / `02` prove native parts
  and Trigger ARIA. Overlay owns the a11y snapshot for isolating layers.

## Composition gates

- [x] `PO-COMP-01` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Filters popup is Overlay.md's modeless
  example: `OV-ISO-02` + `OV-TRG-05` + living position.
- [x] `PO-COMP-02` `[reference]` `[browser]` —
  **Won't do as a Popover fixture.** Context/selection `anchor` is Overlay
  `OV-POS-09` + `OV-TRG-06`.
- [x] `PO-COMP-03` `[reference]` `[browser]` —
  **Won't do as a second hover+flip matrix.** `PO-FLIP-01` proves resolved
  `data-side`; `PO-HOVER-02` / `05` prove grace against that side. Polygon
  reads live `data-side` (see `PO-HOVER-06`).

## Owned elsewhere

- Shared layer Escape/outside/cascade: Overlay.
- Trigger activation, Tab-order bridge, `closeOnScroll`: Overlay `OV-TRG-*` /
  `OV-SCRL-*`.
- Geometry engine: Overlay `OV-POS-*`.
- Portal destinations: Portal.
- Exit detection: Presence.
- Containment / restore walk / shards: FocusLock (`FL-OV-04` for portalled
  Popover inside a modal).
- Non-interactive hover description: Tooltip.

## Won't do

Parked with a technical reason. Not leftover homework.

| ID / item | Why |
| :--- | :--- |
| `PO-DOM-03`–`11` | PART / Overlay Trigger / Portal / `OV-POS-*`. |
| `PO-CTRL-*` / `PO-CLOSE-*` | Overlay open-state, Escape, outside, isolation. |
| `PO-FOCUS-*` | Overlay Tab bridge + FocusLock restore. Popover mounts no lock. |
| `PO-POS-*` / `PO-FLIP-02+` / `PO-SHIFT-02+` / `PO-HIDE-*` / `PO-ARROW-02+` / `PO-SIZE-*` / `PO-VIRTUAL-*` / `PO-SCROLL-*` / `PO-AUTO-*` / `PO-PRES-*` | Overlay geometry / autoUpdate / Presence. Keep `PO-FLIP-01` / `PO-SHIFT-01` / `PO-ARROW-01` as port smokes. |
| `PO-HOVER-06` | Four-side unit polygon + live `data-side`. RTL is `OV-POS-10`. |
| `PO-ENV-02` / `PO-ENV-03` | Matrix runner / Playwright projects, not Popover fixtures. |
| `PO-A11Y-01` | Covered by `PO-DOM-01` / `02`. |
| `PO-COMP-01`–`03` | Overlay.md examples + existing hover/flip smokes. |

## Out of scope

- Floating UI React's `useDismiss`, `FloatingTree`, or focus manager; modal
  Popover; focus trap/inert/scroll lock; cursor-follow APIs; visual snapshots.

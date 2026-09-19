# Tooltip focus preset: modality-gated focus open

## Problem statement

Opening a modal Overlay with the **mouse** autofocuses the first tabbable
inside the dialog. When that element is a Tooltip trigger, the tooltip pops
instantly with **no focus ring**, looking random. Keyboard-open is fine: the
focus ring explains the tooltip.

Question: what SHOULD the defaults be?

## Current behavior map

### Tooltip: open on ANY focus

`Tooltip.tsx:208-216` (`onTriggerFocus`): any `focus` event opens immediately
unless `fromPointer`/`suppressHover` is set. The `fromPointer` guard only covers
pointerdown **on the trigger itself** (Radix-style, reset on document
`pointerup`, `Tooltip.tsx:274-281`). Dialog autofocus bypasses it: the
pointerdown happened on the dialog trigger, not the tooltip trigger.

This contradicts the documented contract:

- `Tooltip.md:122`: "focus opens when focus-visible".
- `SPEC.md` `TT-FOCUS-01` (unproven `[ ]`): Tab-focus requests open immediately.
- `SPEC.md` `TT-FOCUS-03` (unproven `[ ]`): pointer-caused focus must NOT
  produce the immediate keyboard-focus request; opening follows the hover timer.

So the docs already promise modality gating; the implementation never shipped it.

### FocusLock: unconditional autofocus to first tabbable

`FocusLock.tsx:308-347`: unless `initialFocus={false}`, mount moves focus to
the explicit target or the **first tabbable** (`:329-332`), else the container
with `tabindex=-1`. No modality check — mouse-opened dialogs move focus exactly
like keyboard-opened ones. `Overlay.md:285-286` documents this as the default.

### The 4 CT tests encoding open-on-programmatic-focus

`packages/reference-lib/src/components/Tooltip/__e2e__/Tooltip.ct.spec.ts`:

| # | Line | Test | What it proves |
|---|------|------|----------------|
| 1 | 35 | TT-DOM-01/02 | `btnA.focus()` opens Content, sets `role`, links stable `aria-describedby`; blur removes it |
| 2 | 78 | TT-POS | Focus-opened tooltip is anchored to the trigger (computed `top`/`left` px, above trigger) |
| 3 | 185 | TT-CLOSE-01 | `trigger.focus()` inside a dialog opens tip; Escape closes tip only, dialog stays |
| 4 | 283 | KeyboardFocus story | `button.focus()` shows "Appears on keyboard focus" (despite the name, uses programmatic focus, not Tab) |

Playwright `locator.focus()` is programmatic: no key event, so the repo's
modality tracker (`focus-visible.ts`) stays on its `'pointer'` default and
`isFocusVisible()` (`:121-123`) returns false. Gating focus-open on
`isFocusVisible()` breaks all 4 tests' open step as written (blur/Escape/anchor
assertions are unaffected once open is achieved via keyboard).

## Vendor behavior (real sources in `vendor/`)

- **React Aria** `useTooltipTrigger.ts:118-124`: `onFocus` checks
  `isFocusVisible()` and ignores non-visible focus. Hover-start also checks
  `getInteractionModality() === 'pointer'` (`:89`). Focus-visible gating is the
  documented Reference UI lift (`Tooltip.md:124`).
- **Floating UI** `useFocus.ts:26-39,132-142`: `visibleOnly` defaults to
  `true` — focus opens only if the target matches native `:focus-visible`.
  Programmatic `.focus()` after a mouse click does not open.
- **Radix Tooltip** `tooltip.tsx:321-323`: opens on focus unless a pointerdown
  is in flight (`isPointerDownRef`). **No focus-visible gate** — Radix has this
  same gap; dialog autofocus opens the tooltip. Not the model to copy.
- **Radix FocusScope** (Dialog) `focus-scope.tsx:172-176`: autofocus on mount
  focuses the first tabbable unconditionally; cancellable via
  `onMountAutoFocus` `preventDefault`. No modality check.
- **React Aria FocusScope** `FocusScope.tsx:564-578` (`useAutoFocus`): `autoFocus`
  focuses first in scope whenever active element is outside; no modality check.

Convergent answer: **dialogs always move focus on open (unconditional,
modality-blind); tooltips gate focus-open on focus-visible.** The bug is in
Tooltip, not FocusLock. (APG modal pattern requires focus move for SR/keyboard
users; making mouse-opened dialogs leave focus outside would be the real a11y
violation.)

## Options considered

1. **Gate `onTriggerFocus` on `isFocusVisible()` (repo tracker).**
   One-line-class fix at the documented contract point. Mouse-opened dialog
   autofocus (pointer modality) no longer pops the tooltip; Tab-focus still
   opens immediately with a ring. Matches Aria + Floating UI. Cost: migrate
   the 4 CT tests to real Tab presses (below).
2. **Gate on native `matches(':focus-visible')` instead of the repo tracker.**
   Matches Floating UI exactly, but splits modality authority: the repo already
   ships and documents its own tracker as the Aria lift, and native
   `:focus-visible` has known Safari programmatic-focus quirks (Floating UI
   carries a `keyboardModalityRef` workaround for exactly this). Rejected:
   duplicate source of truth.
3. **Change FocusLock: don't move focus on mouse-open, or focus container first.**
   Rejected. Breaks APG modal focus requirements and diverges from every
   vendor (Radix + Aria both autofocus unconditionally). The focus move is
   correct; the tooltip pop is the bug.
4. **New Tooltip prop (e.g. `openOnFocus`, `focusModality`).**
   Rejected for the default fix. Tooltip is Gate 5 done with a frozen API;
   the documented default is already "focus opens when focus-visible" — this
   is a conformance fix, not a new feature. A prop can be added later if a
   consumer needs open-on-any-focus, but no known caller does.

## Recommended sensible defaults

Implement option 1. Explicit matrix after the fix:

| Input | Tooltip opens? | Why |
|---|---|---|
| Mouse hover (through `openDelay`) | Yes, delayed | Unchanged hover path |
| Mouse click / pointerdown on trigger | No (closes if open) | Unchanged: `fromPointer` + `suppressHover` |
| **Tab onto trigger** | **Yes, immediately** | `keydown` Tab sets keyboard modality before focus lands; ring + tooltip together (TT-FOCUS-01) |
| **Dialog autofocus, mouse-opened** | **No** | Modality is pointer; focus still moves (correct), tooltip stays shut. Fixes the reported bug |
| Dialog autofocus, keyboard-opened (Enter) | Yes, immediately | Modality is keyboard; ring explains the tooltip |
| Programmatic `.focus()` in pointer modality | No | Matches Floating UI `visibleOnly` default |
| Programmatic `.focus()` in keyboard modality | Yes | Consistent with Aria: modality, not event source, decides |
| Touch tap | No | Unchanged: touch is pointer modality (TT-FOCUS-04); hover path already touch-guarded |

FocusLock: **no change**. Unconditional move to explicit target / first
tabbable / container stays. `initialFocus={false}` remains the escape hatch.

## Exact test-migration list (4 CT tests)

Pattern for all: replace `locator.focus()` with a real keyboard Tab from a
known preceding control. `keydown` Tab flips the tracker to keyboard modality
before focus lands, so `isFocusVisible()` is true. Keep every downstream
assertion (role, text, `aria-describedby`, anchoring, Escape, snapshots).

1. **TT-DOM-01/02 (line 35):** Tab from page start (or click `btn-outside`,
   then Shift+Tab/Tab) onto `btn-tooltip-a`; assert open + `aria-describedby`
   as today. Blur step (line 47, `btn-outside.focus()`) still works — blur
   closes unconditionally — but prefer Tab for realism.
2. **TT-POS (line 78):** same Tab-onto-`btn-tooltip-a` preamble; keep all
   anchoring assertions untouched.
3. **TT-CLOSE-01 (line 185):** after dialog opens via click, `Tab` (possibly
   multiple) until `nested-tooltip-trigger` is focused — or set the fixture so
   the tooltip trigger is reachable by Tab order — then keep the open + Escape
   assertions. Bonus: this test then also proves the mouse-open path no longer
   auto-pops the tip before Tab (assert `toHaveCount(0)` right after dialog
   open — the regression test for this exact bug).
4. **KeyboardFocus story (line 283):** replace `button.focus()` with
   `page.keyboard.press('Tab')` (focus `body`/preceding control first if Tab
   order requires). The story is literally named KeyboardFocus; this makes it
   honest.

Additionally add one new CT case (TT-FOCUS-03 proof): mouse-click dialog open
with a tooltip trigger as first tabbable → assert tooltip closed + focus inside
dialog; then Tab away and back → assert tooltip opens with
`[data-focus-visible]` on the trigger.

## Implementation checklist (executable blind)

- [ ] 1. In `packages/reference-lib/src/components/Tooltip/Tooltip.tsx`,
  import `isFocusVisible` from
  `../../core/theme/primitives/forms/focus-visible` (verify relative path:
  `Tooltip/` → `components/` → `src/` → `core/…` = `../../core/…`).
- [ ] 2. In `onTriggerFocus` (`:208-216`), after the `defaultPrevented` check,
  add: `if (!isFocusVisible()) return`. Keep the `fromPointer`/`suppressHover`
  guard as-is (defense in depth, preserves TT-CLOSE-03 semantics).
- [ ] 3. Confirm `setupFocusVisible` auto-initializes in the CT/browser env
  (it self-registers when `document` exists, `focus-visible.ts:130-132`); no
  wiring needed unless CT mounts an isolated document — if so, call
  `setupFocusVisible(doc)` in the fixture setup.
- [ ] 4. Migrate the 4 CT tests per the list above (Tab instead of `.focus()`).
- [ ] 5. Add the TT-FOCUS-03 regression test (mouse-open dialog → no pop).
- [ ] 6. Mark `TT-FOCUS-01` and `TT-FOCUS-03` `[x]` in
  `packages/reference-lib/src/components/Tooltip/SPEC.md` once proven; leave
  FocusLock/SPEC untouched.
- [ ] 7. Verify with the component loop: `pnpm agentct` for Tooltip
  (per `tweak-component`/`test-component` skills); no core/matrix changes, so
  no `pnpm agent` needed.
- [ ] 8. Do NOT touch `FocusLock.tsx`, `Overlay`, `focus-visible.ts`, or any
  other component. Do NOT add props.

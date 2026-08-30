# Vendor → Reference UI

These clones are **references**, not dependencies. Nothing here is imported at runtime. We own the public APIs in `packages/reference-lib/src/components/*/`.

Lift: algorithms, edge cases, tests. Leave: visual CSS, public React context
contracts, `as` props, semantic variants, framework glue. Shared internal
state uses Zustand as a direct dependency, not a vendored clone.

```bash
bash vendor/clone.sh
```

## Surveyed revisions

The behavioral design pass is pinned to these default-branch snapshots
(2026-08-30). Case provenance refers to these revisions unless a case names
another commit:

- `a11y-dialog` — `7c96a6e2cc51cf2db93bbb7d63a7b78325893833`
- `aria-hidden` — `720e8a8e1cfa047bd299a929d95d47ac860a5c1a`
- `ariakit` — `74f9792898dfd35e4494bb98f34e183cfa35463a`
- `base-ui` — `3cb844bb0a772fb6621b4279308ca39a324a5a9c`
- `cmdk` — `dd2250ed608443e8f32bafc5fa2d1d07a3746aa3`
- `downshift` — `1bb8b75e506fe807a5c5201a103d1bd128e5a5e2`
- `floating-ui` — `27629b74ba36ab8ceb2a968051927b9b69511a3b`
- `focus-lock` — `ab0a54559ab3db3ce53fbe82fe73abe3475027d1`
- `focus-trap` — `735f04708aa26f5038d47ac44164186bd093a072`
- `headlessui` — `eea57cf46fd6767ed1059012f7073b88eb159fba`
- `inert` — `1cf31ea7b5bba1d77295b8aeb03243cc5ec11c9e`
- `radix-primitives` — `f7ecd5ab16f5e1e820eb5786a1419a98a2d594ae`
- `react-day-picker` — `19033b454689bc761d9847301de429bbbb53eed4`
- `react-focus-lock` — `17a94779df79de2fad5bf9df6cde4393c13f2ec9`
- `react-remove-scroll` — `ef5c312e4c1c6bc5d4cd60b03261d686b8cb165f`
- `react-resizable-panels` — `f9c422714a66e14f671a17f340a3560d8032fcdc`
- `react-spectrum` — `5129b30d8cf5a0791ea528b99c115c8d9dae0f9e`
- `sonner` — `8e4662b39255120b62138312058f5d77c0139a5e`
- `tabbable` — `cb17c5606f82b5264187e99ed3d833537f56f8f3`
- `tanstack-virtual` — `e9874f033c74afd3251eeb9f3e60b2530cc7ae88`
- `vaul` — `3e97aac6a38e4481bade71d7233ed6002e80f9b0`
- `zag` — `d9db0e98241d043f2d8853766033a8b7a98c816e`

---

## What Reference UI actually needs

| Kernel | Public surface | Job |
| --- | --- | --- |
| Shared store | Zustand (direct dep) | Cross-tree state; no public Provider |
| Layer stack | Overlay | Nesting, Escape, outside-press |
| Focus lock | `FocusLock`, Overlay | Trap, restore, shards |
| Scroll lock | Overlay | Body scroll, iOS, scrollbar gap |
| Inert / hide | Overlay | Rest of page not reachable |
| Portal | `Portal` | Move DOM, no extra node |
| Presence | `Presence` | `data-state` exit before unmount |
| Position | Overlay | Flip, shift, arrow, size, hide, virtual anchors, autoUpdate |
| Tabbables | Overlay `initialFocus`, FocusLock | What Tab lands on |
| Roving tabindex | `RovingFocus` | Listbox, Menu, Tabs, Tree |
| Toast queue | `toast.*` | Identity, update-in-place, limit — **not** Overlay |
| Calendar grid | `Calendar` | ISO dates, locale week start, range |
| Numeric editor | `NumberField` | localized partial text, Intl round-trip, step/form math |
| Virtual focus | Listbox, Tree, Combobox | logical metadata, mounted active IDs, scroll-to-index |
| Splitter math | `Splitter` | Drag, min/max, keyboard |

---

## Lift vs leave (every package)

**Lift**

- Dismiss branch checking (outside-press that hits a nested popup)
- Focus trap + restore after Presence exit
- iOS / visualViewport scroll lock
- `computePosition` middleware and its Playwright tests
- Toast queue (`id`, `update`, `dismiss`, pause)
- Combobox state (input focus stays in the field)
- Calendar grid construction and 2D keyboard
- NumberField partial-edit parsing, Intl formatting, and decimal step regressions
- Tests that encode edge cases

**Leave**

- Stylesheets, icons, iOS “scale the page behind the drawer”
- `<Provider>` / context as a public API. Zustand is the cross-tree store;
  Context is allowed only as internal subtree scoping.
- `as` / polymorphic roots
- Toast `success` / `error` / `loading`
- Second overlay runtimes (`@floating-ui/react` tree, FloatingPortal, useDismiss)

---

## Per package

### `floating-ui`

**Useful for:** Overlay geometry — the public frontend of this port.

**Lift**

- `packages/core/src/computePosition.ts` plus middleware: `flip`, `shift`, `offset`, `arrow`, `size`, `hide`
- `packages/dom/src/autoUpdate.ts` (scroll/resize while open)
- `packages/dom/test/functional/*.ts` (the tests, not the PNG snapshots)

**Leave:** `packages/react` as an overlay runtime (`useDismiss`, `FloatingTree`, `FloatingFocusManager`). Positioning engine only.

### `radix-primitives`

**Useful for:** The overlay kernel, almost 1:1 with our authoring primitives.

**Lift**

- `packages/react/dismissable-layer` — nested layers, outside press, Escape
- `packages/react/focus-scope` + `focus-guards` — trap, loop, `branches` (our `shards`)
- `packages/react/presence` — animation-exit lifecycle/ref regressions; extend
  with Base UI/Headless UI transition completion
- `packages/react/portal`
- `packages/react/roving-focus`
- `packages/react/slot` — merge rules vs our Slot contract
- `packages/react/switch` — button host, Thumb child, controlled checked
- `e2e/*.spec.ts` — dialog, popover, menu nesting

**Leave:** `popper` (use floating-ui), `scroll-area` (deliberate omission), visual examples in apps.

### `base-ui`

**Useful for:** Current unstyled system that already unifies dialog, popover,
menu, tooltip, toast, drawer, and localized NumberField behavior.

**Lift**

- `packages/react/src/dialog`, `popover`, `menu`, `tooltip`, `toast`
- `packages/react/src/collapsible` (Accordion)
- `packages/react/src/switch` — button + Thumb anatomy; leave form-field wiring
- `packages/react/src/number-field` — partial parsing, precision, stepping,
  repeat, forms, and mobile-input regressions
- How they nest Menu inside Dialog on one layer stack
- `test/e2e`

**Leave:** `floating-ui-react` vendored inside Base UI — same “don’t take the React overlay runtime” rule. Their public context anatomy.

### `react-spectrum` (React Aria)

**Useful for:** APG behaviour for every ARIA primitive. First-class for
Listbox, Combobox, Menu, Tabs, Slider, NumberField, Calendar, Tooltip, and
overlays. Switch is a compact button+thumb owner; Aria `input` Switch tests
are host contrast, while Radix/Base UI Switch tests inform anatomy.

**Lift**

- `packages/react-aria/src/overlays` — prevent-scroll (iOS), interact-outside
- `packages/react-aria/src/focus` — FocusScope
- Per-widget: `listbox`, `combobox`, `menu`, `tabs`, `slider`, `numberfield`,
  `calendar`, `disclosure`, `toast`, `tooltip`
- `packages/@internationalized` — week start/locale for Calendar and
  NumberParser vectors for NumberField
- Tests under `packages/react-aria/test` and `react-aria-components/test`

**Leave:** Spectrum visual components, locale JSON catalogs we already trimmed, their hook-soup as a public API.

### `ariakit`

**Useful for:** Nested dialog/popover and disclosure without Radix’s context style.

**Lift**

- `packages/ariakit-react/src/dialog.ts`, `popover.ts`, `focus-trap.ts`, `disclosure.ts`
- Combobox + composite (roving) if it beats Aria on a specific edge case

**Leave:** Solid packages (already not cloned), store as a public contract.

### `sonner`

**Useful for:** Toast infrastructure only.

**Lift**

- `src/state.ts` — stable `id`, update in place, dismiss all, and replay;
  Sonner's visible-limit behavior is contrast, not the waiting FIFO contract
- Pause timers on hover / across updates

Spectrum and Zag supply the waiting-FIFO contract. Base UI supplies
remaining-time and pause/update timer-race evidence.

**Leave:** Sonner's mounted/timed visible limit, `src/styles.css`,
`src/assets.tsx` (icons), and success/error/loading visuals. Toasts are not
Overlay (no trap, no inert).

### `zag`

**Useful for:** State-machine descriptions of the same widgets, framework-agnostic. Contrast with Radix/Aria when behaviour disagrees.

**Lift**

- `packages/machines/{dialog,popover,menu,combobox,listbox,tabs,slider,number-input,calendar,toast,tooltip,collapsible,accordion,splitter}`
- `packages/utilities/dismissable`, `focus-trap`, `aria-hidden`

**Leave:** The machine runtime as our public API. We still ship React components + controlled props.

### `headlessui`

**Useful for:** Contrast. Known weaker APG in places (menu/listbox).

**Lift:** Almost nothing unless a specific Dialog/Transition detail is clearer here than Radix Presence.

**Leave:** Default copy source.

### `downshift`

**Useful for:** Combobox / Select. Not an overlay library.

**Lift**

- `src/hooks/useCombobox`, `useSelect`, `useMultipleSelection`
- Keeping DOM focus on the input while the list is active (active-descendant)

**Leave:** Their render-prop API.

### `cmdk`

**Useful for:** CommandPalette = Overlay + Combobox.

**Lift:** CommandPalette composition evidence from `cmdk/src/index.tsx`. The
dialog itself should be our Overlay.

**Leave:** `command-score.ts`, filtering/ranking helpers, Radix Dialog wrapping,
and styling. Filtering and ranking are application-owned for this freeze.

### `vaul`

**Useful for:** Drawer / Sheet as **Overlay at a screen edge**, not a new primitive.

**Lift**

- `src/use-prevent-scroll.ts` — note it is already copied from React Aria; prefer Aria/Kashey as canonical
- `src/use-position-fixed.ts` — iOS `position: fixed` while the sheet is open
- `src/use-snap-points.ts` — only if we ever document snap drawers; not in the freeze API

**Leave:** `src/style.css`, `src/use-scale-background.ts` (iOS “shrink the app behind the drawer”). That is product chrome, not Overlay.

### `focus-lock` + `react-focus-lock`

**Useful for:** `FocusLock` — the core containment engine.

**Lift**

- `focus-lock/src/focusSolver.ts`, `moveFocusInside.ts`, `return-focus.ts`, `focusables.ts`, `utils/tabOrder.ts`
- `react-focus-lock` — shards (nested portalled popover), focus guards, portal-safe activation
- Pair with Radix `focus-scope` `branches` (same idea as our `shards`)

**Leave:** `as` container, sidecar bundling tricks, `group` / `whiteList` as public props until a freeze gate needs them.

### `tabbable` + `focus-trap`

**Useful for:** Second opinion on “what is tabbable” and a vanilla trap.

**Lift**

- `tabbable/src` — radio groups, `contenteditable`, inert/disabled, positive tabindex
- `focus-trap/index.js` + `test` — compare with `focus-lock` when they disagree

**Leave:** Cypress fixtures as product code. Use one solver in production (likely `focus-lock`); keep tabbable’s test cases.

### `react-remove-scroll`

**Useful for:** Overlay scroll lock.

**Lift:** `src` — nested scrollables, portal-safe wheel/touch, scrollbar gap compensation.

**Leave:** `inert` pointer-events mode as default (their own docs call it dangerous with portals).

### `aria-hidden` + `inert`

**Useful for:** Overlay “rest of the page is gone.”

**Lift**

- `aria-hidden` — hide siblings from AT without marking the overlay
- `inert/src` — edge cases native `inert` still gets wrong; prefer native `inert` in Overlay, steal tests

**Leave:** Polyfilling `inert` in evergreen browsers.

### `a11y-dialog`

**Useful for:** Overlay kernel with **zero React**.

**Lift:** `src/a11y-dialog.ts` — open/close, focus, labelledby, nested dialogs, no `as` soup.

**Leave:** Their markup conventions if they fight our Overlay.Backdrop / Overlay.Content split.

### `react-day-picker`

**Useful for:** `Calendar` contrast with React Aria.

**Lift:** `packages/react-day-picker/src` — month grid, range preview, locale. Freeze gate: week not starting Sunday.

**Leave:** Their extra calendars (`buddhist`, `hijri`, …) unless we explicitly take non-Gregorian. We do not take a `Date` library; values stay `YYYY-MM-DD`.

### `tanstack-virtual`

**Useful for:** Listbox freeze-gate (windowed options).

**Lift:** `packages/virtual-core` — `scrollToIndex`, overscan. Listbox still owns `aria-setsize` / `aria-posinset`.

**Leave:** A public Virtualizer component. Virtualization is a composition, not a primitive.

### `react-resizable-panels`

**Useful for:** `Splitter`.

**Lift:** `lib` — pointer/keyboard resize, min/max, collapse. Map to `role="separator"`.

**Leave:** Demo `src/` (already not cloned), VS Code skin.

---

## Suggested read order (when implementing)

1. **Overlay kernel:** radix dismissable-layer + presence + portal → focus-lock → react-remove-scroll → aria-hidden → a11y-dialog
2. **FocusLock:** focus-lock `src` → react-focus-lock shards → radix focus-scope
3. **Popover:** floating-ui `computePosition` + tests → radix popover e2e (behaviour, not popper)
4. **Toast:** Sonner identity/update/replay → Spectrum/Zag waiting FIFO → Base
   UI timer-race tests; use Sonner's mounted/timed limit only as contrast
5. **ARIA widgets:** react-aria first, zag machines when Aria and Radix disagree, downshift for Combobox
6. **Calendar:** react-aria calendar + react-day-picker grid
7. **Splitter:** react-resizable-panels `lib`
8. **Drawer:** Overlay + CSS `data-state`; vaul only for iOS position-fixed, not the scale trick

When two vendors disagree, write the freeze-gate test first, then pick the behaviour that matches `components.md`.

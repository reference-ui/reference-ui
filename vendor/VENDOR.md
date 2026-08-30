# Vendor → Reference UI

These clones are **references**, not dependencies. Nothing here is imported at runtime. We own the public APIs in `packages/reference-lib/src/components/*/`.

Lift: algorithms, edge cases, tests. Leave: visual CSS, React context contracts, `as` props, semantic variants, framework glue.

```bash
bash vendor/clone.sh
```

---

## What Reference UI actually needs

| Kernel | Public surface | Job |
| --- | --- | --- |
| Layer stack | Overlay, Popover, Menu | Nesting, Escape, outside-press |
| Focus lock | `FocusLock`, Overlay | Trap, restore, shards |
| Scroll lock | Overlay | Body scroll, iOS, scrollbar gap |
| Inert / hide | Overlay | Rest of page not reachable |
| Portal | `Portal` | Move DOM, no extra node |
| Presence | `Presence` | `data-state` exit before unmount |
| Position | Popover, Tooltip | Flip, shift, arrow, virtual anchors |
| Tabbables | Overlay `initialFocus`, FocusLock | What Tab lands on |
| Roving tabindex | `RovingFocus` | Listbox, Menu, Tabs |
| Toast queue | `toast.*` | Identity, update-in-place, limit — **not** Overlay |
| Calendar grid | `Calendar` | ISO dates, locale week start, range |
| Virtualization | Listbox freeze-gate | `aria-setsize` / scroll-to-index |
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
- Tests that encode edge cases

**Leave**

- Stylesheets, icons, iOS “scale the page behind the drawer”
- `<Provider>` / context as a public API
- `as` / polymorphic roots
- Toast `success` / `error` / `loading`
- Second overlay runtimes (`@floating-ui/react` tree, FloatingPortal, useDismiss)

---

## Per package

### `floating-ui`

**Useful for:** Popover and Tooltip positioning.

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
- `packages/react/presence` — keep mounted until transition end
- `packages/react/portal`
- `packages/react/roving-focus`
- `packages/react/slot` — merge rules vs our Slot contract
- `e2e/*.spec.ts` — dialog, popover, menu nesting

**Leave:** `popper` (use floating-ui), `scroll-area` (deliberate omission), visual examples in apps.

### `base-ui`

**Useful for:** Current unstyled system that already unifies dialog, popover, menu, tooltip, toast, drawer.

**Lift**

- `packages/react/src/dialog`, `popover`, `menu`, `tooltip`, `toast`
- `packages/react/src/collapsible` (Accordion)
- How they nest Menu inside Dialog on one layer stack
- `test/e2e`

**Leave:** `floating-ui-react` vendored inside Base UI — same “don’t take the React overlay runtime” rule. Their public context anatomy.

### `react-spectrum` (React Aria)

**Useful for:** APG behaviour for every ARIA primitive. First-class for Listbox, Combobox, Menu, Tabs, Slider, Switch, Calendar, Tooltip, overlays.

**Lift**

- `packages/react-aria/src/overlays` — prevent-scroll (iOS), interact-outside
- `packages/react-aria/src/focus` — FocusScope
- Per-widget: `listbox`, `combobox`, `menu`, `tabs`, `slider`, `switch`, `calendar`, `disclosure`, `toast`, `tooltip`
- `packages/@internationalized` — week start / locale for Calendar (we still ship ISO strings, not their date objects)
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

- `src/state.ts` — queue, stable `id`, `update` in place, dismiss all, limit
- Pause timers on hover / across updates

**Leave:** `src/styles.css`, `src/assets.tsx` (icons), success/error/loading visuals. Toasts are not Overlay (no trap, no inert).

### `zag`

**Useful for:** State-machine descriptions of the same widgets, framework-agnostic. Contrast with Radix/Aria when behaviour disagrees.

**Lift**

- `packages/machines/{dialog,popover,menu,combobox,listbox,tabs,slider,switch,calendar,toast,tooltip,collapsible,accordion,splitter}`
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

**Lift:** `cmdk/src/index.tsx` filtering + `command-score.ts` only if we want an optional filter helper. The dialog itself should be our Overlay.

**Leave:** Radix Dialog wrapping, styling.

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
4. **Toast:** sonner `state.ts` only
5. **ARIA widgets:** react-aria first, zag machines when Aria and Radix disagree, downshift for Combobox
6. **Calendar:** react-aria calendar + react-day-picker grid
7. **Splitter:** react-resizable-panels `lib`
8. **Drawer:** Overlay + CSS `data-state`; vaul only for iOS position-fixed, not the scale trick

When two vendors disagree, write the freeze-gate test first, then pick the behaviour that matches `components.md`.

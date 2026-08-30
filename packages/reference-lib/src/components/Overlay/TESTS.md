# Overlay tests

Playwright: `matrix/lib/tests/e2e/overlay.spec.ts`  
Page: `/overlay`  
Compositions: dialog, alertdialog, drawer (`data-state` slide). Nested Overlay (two dialogs) freezes the layer stack **without** waiting for Popover or Menu.

Vendors copy nest, Escape, outside-press, and “extension overlay” into Dialog, Popover, Menu, Select, ContextMenu, Menubar. We run those **once**, here. Later primitives add only what is unique (see their `TESTS.md`).

## Combined: layer stack

These are the same contract. One spec, one demo with a nested Overlay.

| Our case | Vendor (do not re-copy) |
| --- | --- |
| Escape dismisses only the topmost layer | radix `e2e/dialog.spec.ts` “pressing Escape closes only the dropdown”; same idea in `dropdown-menu.spec.ts`, `select.spec.ts`, `context-menu.spec.ts` |
| Outside-press on a nested layer does not dismiss the parent | radix `dialog.spec.ts` “dismissing the dropdown does not close the dialog”; `popover.spec.ts` modal popover in dialog; `dropdown-menu` / `context-menu` / `select` “dismisses only the … when clicking inside dialog outside …” |
| Deferred outside-press: extension overlay that `stopPropagation`s later mouse events does not dismiss | radix `dialog.spec.ts` “keeps the dialog open when an outside overlay stops later mouse events”; **identical** cases in `popover.spec.ts`, `dropdown-menu.spec.ts`, `context-menu.spec.ts`, `select.spec.ts`, `menubar.spec.ts` |
| Shadow tree inside content is not “outside” | radix `dialog.spec.ts` “keeps the dialog open when interacting with a shadow tree inside the dialog” |
| Same-tick open does not immediately dismiss | radix `usePointerDownOutside` `setTimeout(0)` — prove by opening on pointerdown |

When Popover exists, add **one** describe on **this** page (or skip until then — do not put Escape-topmost in `popover.spec.ts`):

- Non-modal popover in dialog, click outside both → both dismiss (radix `popover.spec.ts` “dismisses both the popover and the dialog”)
- Modal popover in dialog, click outside popover → only popover dismisses (radix “dismisses only the popover”)

When Menu exists, same: Menu-in-dialog Escape/outside lives here, not a third copy. Submenu pointer geometry stays in `Menu/TESTS.md`.

## Unique to Overlay

| Our case | Vendor |
| --- | --- |
| Keyboard open/close; Escape; focus restore to trigger | radix `dialog.spec.ts` modal + non-modal keyboard/pointer; a11y-dialog `src/a11y-dialog.ts` tests |
| Modal: outside pointer does not reach the page; after close, pointer-events restored (including after **animated** close / Presence) | radix `dialog.spec.ts` `shouldNotAllowOutsideInteraction` + “ensure that pointer-events have been reset” after animated close |
| Non-modal: outside interaction allowed and dismisses | radix non-modal describe |
| Focus trap; Tab loops; **focused node removed** still traps | radix “keeps focus trapped even if focused element is removed” |
| `initialFocus` omitted / ref / `false` | focus-trap `initialFocus === false`; Overlay.Content API |
| AlertDialog: Escape does not dismiss | a11y-dialog skip Escape for `alertdialog`; Zag `alertDialog` |
| Drawer: `open={false}` keeps content mounted until transition ends; `data-state` |
| Scroll lock: page does not scroll; nested scrollable still scrolls until edge | `vendor/react-remove-scroll`; Aria `usePreventScroll` |
| Background not reachable to AT (`inert` / hideOthers); live region / toast still reachable | `vendor/aria-hidden`; Aria `ariaHideOutside` |
| Restore focus **after** Presence exit, not on unmount | none of the vendors — our contract |

## Triple composition (freeze gate)

Dialog (`role="dialog"`), AlertDialog (`role="alertdialog"`), Drawer (edge + CSS `data-state`). No extra Overlay API.

## Not here

| Goes to | Why |
| --- | --- |
| `Popover/TESTS.md` | flip/shift/arrow/size, virtual anchor, `openOnHover` polygon |
| `Menu/TESTS.md` | submenu intent, typeahead scoped to active menu |
| `FocusLock/TESTS.md` | tabbable catalog, shards unit, radio groups |
| `Presence/TESTS.md` | animation vs transition detection without Overlay chrome |
| `Toast/TESTS.md` | pause while this Overlay is top layer — toast owns the assertion, Overlay is the fixture |
| radix `e2e/scroll-area.spec.ts`, `form.spec.ts`, `popper.spec.ts` | omissions / wrong kernel |

## Vitest

None to start Overlay. Slot/Calendar/toast queue are the later unit exceptions (`TESTING.md`).

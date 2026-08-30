# Listbox tests

Playwright: `matrix/lib/tests/e2e/listbox.spec.ts`  
Page: `/listbox`

Built on RovingFocus (typeahead on). Popup chrome is Combobox/Popover — not this spec. Headless Listbox (focus moves into the list) is **contrast**, not the bar for Combobox reuse.

## Unique to Listbox

| Our case | Vendor |
| --- | --- |
| Single select; Space/Enter commit; arrows skip disabled | Aria `useListBox` / `ListKeyboardDelegate` |
| Multiple select | Aria selection manager; Zag `multiple` |
| Typeahead wrap; Space during search does not select | Aria `useTypeSelect.ts` (capture Space); Zag `CONTENT.TYPEAHEAD` |
| Standalone: roving tabindex (DOM focus on option) | Aria non-virtual |
| **Virtualized freeze-gate:** windowed options, `aria-setsize` / `aria-posinset`, scroll-to-index | Aria `useOption.ts` `isVirtualized`; Zag `scrollToIndexFn`; `vendor/tanstack-virtual` `scrollToIndex` |
| `role="listbox"` / `option`; `aria-selected` | APG |

## Combined

Combobox virtual focus (activedescendant, focus stays on input) is `Combobox/TESTS.md`. Available height of a list popup is `Popover/TESTS.md` `size`.

## Triple composition

Standalone list, multi-select, **virtualized** list (required freeze gate).

## Not here

Radix Select as the Listbox kernel. Public Virtualizer. Headless focus-in-list as default.

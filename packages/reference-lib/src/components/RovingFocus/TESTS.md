# RovingFocus tests

Playwright: `matrix/lib/tests/e2e/roving-focus.spec.ts`  
Page: `/roving-focus`  
Compositions: toolbar (horizontal, loop), picker grid (`orientation="both"`). Listbox/Menu/Tabs **turn this on**; they do not re-prove arrow/tabIndex.

## Unique to RovingFocus

| Our case | Vendor |
| --- | --- |
| Only one tab stop; arrows move; Home/End | radix `packages/react/roving-focus` |
| `loop`; disabled items skipped | radix filter `focusable` |
| RTL: horizontal arrows swap | radix |
| Typeahead optional; off by default; Space during buffer does not activate | Aria `useTypeSelect.ts`; Ariakit `composite-typeahead.tsx`; Headless 350ms — **leave** timing |
| `orientation="both"`: up/down rows, left/right columns | Ariakit `rowId`; Aria `ListKeyboardDelegate` `layout: 'grid'`. Radix RF is 1D — insufficient |
| No extra DOM node; Item slots `tabindex` onto child | our API |

## Combined

Listbox/Menu/Tabs e2e assume this kernel. If arrows fail there, fix here first unless the failure is selection/activation policy.

## Not here

Toolbar/ToggleGroup as primitives. Selection manager (Aria). Virtual focus public mode (Combobox owns activedescendant).

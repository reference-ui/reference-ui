# Combobox tests

Playwright: `matrix/lib/tests/e2e/combobox.spec.ts`  
Page: `/combobox`

Not an overlay library. Dismiss/nest with Overlay → Overlay. List keyboard → Listbox. This spec is **focus in the field** + commit/revert + select-only trigger.

## Unique to Combobox

| Our case | Vendor |
| --- | --- |
| DOM focus stays on `input` while arrows move `aria-activedescendant` | downshift `useCombobox`; Aria `useComboBox.ts`; Zag `combobox.connect.ts` |
| Native text editing (type, caret) while popup open | downshift `getInputProps.test.js` |
| `autocomplete` none / list / both | Zag `inputBehavior` matrix; Aria hardcodes `list` and TODOs `both` — freeze `both` |
| Enter commits; Escape restores previous `value` / `inputValue` | Aria `commit()` / `revert()` (`useComboBoxState`) |
| Select-only: `Combobox.Trigger` button, typeahead on button, still virtual list | downshift `useSelect` |
| Open/dismiss controlled; outside/Escape via Overlay handlers | our API; do not take Zag’s baked-in layer |

## Combined

| Composition | Where |
| --- | --- |
| Select (button + Listbox popup) | this page |
| Autocomplete (input + Listbox) | this page |
| CommandPalette | Overlay page or this page with Overlay chrome — Overlay owns trap; Combobox owns the field |
| Nested in dialog | Overlay nest (like Select in dialog: radix `select.spec.ts` “dismisses only the select when clicking inside dialog outside select”) — **Overlay owns**, one case when Combobox exists |
| Filtering | optional helper; cmdk `command-score.ts` only if we ship it — not Combobox core |
| Virtualized options | Listbox freeze-gate, used as popup content |

## Not here

cmdk Radix Dialog wrap. Downshift render-prop API. Headless moving focus into the list. Zag positioning runtime.

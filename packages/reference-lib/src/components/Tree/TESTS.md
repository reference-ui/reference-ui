# Tree tests

Playwright: `matrix/lib/tests/e2e/tree.spec.ts`  
Page: `/tree`

Aria `useTree` is **treegrid** — contrast only. Zag tree-view is the APG `tree`.

## Unique to Tree

| Our case | Vendor |
| --- | --- |
| **Collapsed descendants are not in the roving set** (freeze gate) | Zag `visibleNodes`; Aria `TreeCollection` expansion filter |
| Nested ≥ two levels (freeze gate) | our composition |
| Up/Down visible items; Right expand or enter; Left collapse or parent; RTL swap | Zag tree-view key map |
| Home/End first/last **visible** | APG |
| Enter/Space select focused; single select only | Zag default single |
| Typeahead on visible set | RovingFocus + visibleNodes |
| `aria-level` from nesting; `aria-expanded` only if children | APG |

## Combined

Combobox-with-Tree popup: Combobox owns focus-in-input; this spec still proves visible-only roving when used standalone.

## Not here

Multi-select, virtualization, file-explorer DnD, Aria treegrid.

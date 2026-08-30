# Splitter tests

Playwright: `matrix/lib/tests/e2e/splitter.spec.ts`  
Page: `/splitter`

## Unique to Splitter

| Our case | Vendor |
| --- | --- |
| Pointer drag resizes; min/max clamp | `vendor/react-resizable-panels/lib` constraints / `adjustLayoutByDelta` |
| Keyboard: arrows nudge; Home/End to min/max; **Enter collapses** | Zag splitter keyboard; RRP `onDocumentKeyDown` |
| `role="separator"` + `aria-valuenow` / min / max | RRP `Separator.tsx`; Zag aria helpers |
| Drag does not select page text | Zag `userSelect: none`; RRP `preventDefault` |
| Horizontal and vertical | both |
| Controlled `value` / `onChange` sizes | our API; `min="10r"` is a constraint, not a layout system |

## Triple composition

Sidebar + main, vertical stack, collapse via keyboard.

## Not here

RRP demo skins / VS Code chrome. Nested group hit-region public API. Persist layout to localStorage unless we add it later.

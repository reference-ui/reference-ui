# Splitter SPEC

Current freeze, cases, and proof. Design narrative: [Splitter.md](./Splitter.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `matrix/lib/tests/e2e/splitter.spec.ts`
Unit: `matrix/lib/tests/unit/splitter.test.ts` (missing)
Page: `/splitter`

## Legend

- `[x]` A passing Playwright or Vitest title contains this case ID.
- `[ ]` Specified in TESTS.md; not proven by a passing test title.
- `[~]` A title exists but asserts the prototype, not the freeze.

TESTS.md checkboxes mean **specified**, not proven.

## Next agent

**API and TESTS.md are the contract.** Controlled `%[]` summing to 100.
Pointer session writes CSS vars on refs — **no React commit per move**.

Visual polish is not this gate. No grid mode. No `SplitterThumb` dots.

### Surface

| Axis | Freeze |
| :--- | :--- |
| Parts | Root flex; Panel; Handle `role="separator"` |
| State | required `value: number[]`; `onChange` / interaction-end |
| Panel | `min` / `max` / `collapsible` / `collapsedSize`; DOM order, not `index` |
| Hot path | `--reference-splitter-panel-size` (and indexed vars); ARIA off the 60fps path |
| Keys | 1% / 10%, Home/End, Enter collapse/restore |

### Status (2026-09-10)

| | |
| :--- | :--- |
| Engine | Prototype. Keyboard smoke only. |
| Production | **No.** |
| Named `[x]` | 1 / 83 (`SP-DOM-01`) |
| Playwright | 1 |
| Vitest | 0 |

### Gaps & incoherence

- `defaultValue`, optional `value`. Freeze: required controlled `value`.
- Panel props `minSize` / `maxSize` / `index` vs freeze `min` / `max` + DOM
  order registration.
- Writes `flexBasis: ${size}%` instead of `--reference-splitter-panel-size`
  / `--reference-splitter-N`.
- Drag calls `setInternalValue` / `onChange` per move — React commit on the
  hot path (`SP-PERF-*`).
- Extra `SplitterThumb` chrome; Handle `aria-valuemin/max` hardcoded 0/100.
- Collapse / Enter / CSS-length constraints largely absent.

### Vendor

**Lift:** `vendor/react-resizable-panels/lib` (`adjustLayoutByDelta`,
constraints, separator ARIA). `vendor/design-system/resizable` (direct DOM
writes, capture-at-down, ARIA isolated from polling). Zag splitter
collapse/utils.

**Leave:** grid / BYO width; `position: fixed` + rAF Handle; RRP
re-render-every-move as the model; auto-save; `defaultSize`.

### Case index

- `[x]` `SP-DOM-01`
- `[ ]` `SP-TYPE-01`, remaining `SP-DOM-*`, `SP-A11Y-01`, `SP-MATH-*`,
  `SP-CTRL-*`, `SP-END-*`, `SP-DRAG-*`, `SP-KEY-*`, `SP-COLLAPSE-*`,
  `SP-DYNAMIC-*`, `SP-ENV-*`, `SP-PERF-*`, `SP-COMP-*`

### Work order

1. Align public API (`min` / `max`, required `value`, drop `defaultValue` /
   `index` / Thumb).
2. Port percentage solver + idle constraint conversion (`SP-MATH-*`).
3. Pointer session: origin capture, ref CSS vars, ARIA off the hot path.
4. Collapse/Enter + keyboard matrix; then `SP-PERF` frame-budget tests.

### Won't do

Grid mode. Visual thumb dots as kernel. Overlay duplication.

### Done when

Public API matches Splitter.md. Every TESTS.md ID is `[x]` here. Drag does
not commit React per `pointermove`.

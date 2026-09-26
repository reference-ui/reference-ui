# Splitter SPEC

Current freeze, cases, and proof. Design narrative: [Splitter.md](./Splitter.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `__e2e__/Splitter.ct.spec.ts` (colocated CT; `matrix/lib/tests/e2e/splitter.spec.ts` does not exist on this branch)
Unit: `splitter-math.test.ts` + `Splitter.contract.test.tsx` (colocated; `matrix/lib/tests/unit/splitter.test.ts` does not exist on this branch)
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
| Engine | Constraint solver wired; keyboard + drag + collapse-snap proven. |
| Production | **Partial.** Uncontrolled retained; freeze API deltas open. |
| Named `[x]` | 24 / 83 |
| Playwright CT | 8 |
| Vitest | 16 |

### Gaps & incoherence

Resolved by the quarantine-landing salvage (solver port + minimal wire):

- Panel `minSize` / `maxSize` / `collapsible` / `collapsedSize` were dead
  props; they now drive keyboard, drag, Home/End, and collapse snapping.
- Handle `aria-valuemin/max` hardcoded 0/100; now honest feasible bounds
  (`calculateSeparatorAriaValues`).
- `onChange` / `onChangeEnd` fired on no-op resizes and press-without-move;
  exact no-ops are now silent, and a moved drag closes with exactly one
  `onChangeEnd`.

Still open (quarantine behavior deliberately not ported):

- `defaultValue`, optional `value`. Freeze: required controlled `value`.
- Panel props `minSize` / `maxSize` / `index` vs freeze `min` / `max` + DOM
  order registration. Numeric constraints only; no CSS-length `min`/`max`.
- Writes `flexBasis: ${size}%` instead of `--reference-splitter-panel-size`
  / `--reference-splitter-N`.
- Drag commits React per move (`SP-PERF-*` hot path untouched).
- `SplitterThumb` chrome retained; no RTL direction wiring (`SP-KEY-05`);
  no Enter collapse (`SP-COLLAPSE-01..03`); default min floor stays 5%,
  not the freeze 0.

### Vendor

**Lift:** `vendor/react-resizable-panels/lib` (`adjustLayoutByDelta`,
constraints, separator ARIA). `vendor/design-system/resizable` (direct DOM
writes, capture-at-down, ARIA isolated from polling). Zag splitter
collapse/utils.

**Leave:** grid / BYO width; `position: fixed` + rAF Handle; RRP
re-render-every-move as the model; auto-save; `defaultSize`.

### Case index

- `[x]` `SP-TYPE-01` (re-targeted to the current uncontrolled API), `SP-DOM-01`,
  `SP-DOM-02`, `SP-DOM-03`, `SP-MATH-01`–`SP-MATH-12`, `SP-CTRL-06`,
  `SP-END-01`, `SP-END-03`, `SP-KEY-04`, `SP-COLLAPSE-04`, `SP-COLLAPSE-07`,
  `SP-COLLAPSE-08`, `SP-ENV-01` (SSR)
- `[ ]` remaining `SP-DOM-*`, `SP-A11Y-01`, remaining `SP-CTRL-*`,
  `SP-END-02`, `SP-END-04`, `SP-DRAG-*`, remaining `SP-KEY-*`, remaining
  `SP-COLLAPSE-*`, `SP-DYNAMIC-*`, remaining `SP-ENV-*`, `SP-PERF-*`,
  `SP-COMP-*`

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

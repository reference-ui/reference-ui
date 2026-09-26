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

### Status (2026-09-10; PATCHES items 1–4, 6–7 landed 2026-09-26; FEATURES cluster A #1/#2/#10/#12 landed 2026-09-26)

| | |
| :--- | :--- |
| Engine | Constraint solver wired; keyboard + drag + collapse-snap proven. |
| Production | **Partial.** Controlled-only v1 API landed (required `value`, `min`/`max`, DOM order, no Root `disabled`); engine deltas (#3–#9) open for cluster B. |
| Named `[x]` | 47 / 83 |
| Playwright CT | 37 |
| Vitest | 18 |

### Gaps & incoherence

Resolved by the quarantine-landing salvage (solver port + minimal wire):

- Panel `minSize` / `maxSize` / `collapsible` / `collapsedSize` were dead
  props; they now drive keyboard, drag, Home/End, and collapse snapping.
- Handle `aria-valuemin/max` hardcoded 0/100; now honest feasible bounds
  (`calculateSeparatorAriaValues`).
- `onChange` / `onChangeEnd` fired on no-op resizes and press-without-move;
  exact no-ops are now silent, and a moved drag closes with exactly one
  `onChangeEnd`.

Still open (cluster B owns the engine items):

- Panel `min`/`max` accept `number | string`; strings fall back to the
  default bound with a dev diagnostic until measured resolution lands
  (FEATURES #3 seam: `toSolverConstraints` in `Splitter.tsx`).
- Writes `flexBasis: ${size}%` instead of `--reference-splitter-panel-size`
  / `--reference-splitter-N`.
- Drag commits React per move (`SP-PERF-*` hot path untouched).
- `SplitterThumb` chrome retained. Pointer robustness, keyboard sessions,
  Enter collapse/restore, RTL wiring, reduced-motion guard, and the a11y
  sweep landed via PATCHES (matrix-only env/composition proofs excluded —
  no matrix home on branch).

Landed by FEATURES cluster A (2026-09-26):

- Required controlled `value`; `defaultValue`, Root `disabled`/`display`/
  `flexDirection` deleted (FEATURES #1, #12).
- Panel `min`/`max` + DOM-order registration; `index` deleted; flex
  overrides omitted from the Panel/Handle style surface (FEATURES #2).
- Default min floor decided: KEEP 5%, pinned by the SP-DOM-03 CT slices
  (FEATURES #10).

### Vendor

**Lift:** `vendor/react-resizable-panels/lib` (`adjustLayoutByDelta`,
constraints, separator ARIA). `vendor/design-system/resizable` (direct DOM
writes, capture-at-down, ARIA isolated from polling). Zag splitter
collapse/utils.

**Leave:** grid / BYO width; `position: fixed` + rAF Handle; RRP
re-render-every-move as the model; auto-save; `defaultSize`.

### Case index

- `[x]` `SP-TYPE-01` (re-targeted to the v1 controlled API), `SP-DOM-01`,
  `SP-DOM-02`, `SP-DOM-03`, `SP-DOM-05`, `SP-MATH-01`–`SP-MATH-12`, `SP-CTRL-06`,
  `SP-END-01`, `SP-END-02`, `SP-END-03`, `SP-END-04`, `SP-KEY-02`, `SP-KEY-04`,
  `SP-KEY-05`, `SP-KEY-07`, `SP-KEY-08`, `SP-DRAG-01`, `SP-DRAG-02`, `SP-DRAG-04`,
  `SP-DRAG-05` (first slice), `SP-DRAG-06`, `SP-DRAG-07`, `SP-DRAG-08`,
  `SP-DRAG-09`, `SP-DRAG-10`, `SP-DRAG-11` (first slice), `SP-DRAG-12`,
  `SP-COLLAPSE-01`, `SP-COLLAPSE-02`, `SP-COLLAPSE-03`, `SP-COLLAPSE-04`,
  `SP-COLLAPSE-07`, `SP-COLLAPSE-08`, `SP-COMP-01`, `SP-A11Y-01` (explicit-assertion
  sweep; full green awaits FEATURES per-Handle disable), `SP-ENV-01` (SSR)
- `[ ]` remaining `SP-DOM-*`, remaining `SP-CTRL-*`, `SP-DRAG-03`,
  remaining `SP-KEY-*`, remaining `SP-COLLAPSE-*`, `SP-DYNAMIC-*`,
  remaining `SP-ENV-*`, `SP-PERF-*`, remaining `SP-COMP-*`

### Work order

1. Align public API (`min` / `max`, required `value`, drop `defaultValue` /
   `index`) — DONE by cluster A (Thumb retained per DECISIONS).
2. Port percentage solver + idle constraint conversion (`SP-MATH-*`).
3. Pointer session: origin capture, ref CSS vars, ARIA off the hot path.
4. Collapse/Enter + keyboard matrix; then `SP-PERF` frame-budget tests.

### Won't do

Grid mode. Visual thumb dots as kernel. Overlay duplication.

### Done when

Public API matches Splitter.md. Every TESTS.md ID is `[x]` here. Drag does
not commit React per `pointermove`.

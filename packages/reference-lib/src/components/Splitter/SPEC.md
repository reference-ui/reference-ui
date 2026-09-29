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

### Status (2026-09-10; PATCHES items 1–4, 6–7 landed 2026-09-26; FEATURES cluster A #1/#2/#10/#12 and cluster B #3–#9 landed 2026-09-26; P2F tails + FEATURES #11 landed 2026-09-28)

| | |
| :--- | :--- |
| Engine | Constraint solver wired; keyboard + drag + collapse-snap proven. |
| Production | Controlled v1 API + engine (#3 measured constraints, #4 CSS-var geometry, #5 session frame budget, #6 id-keyed collapse memory, #7 focusable-but-inert Handles, #8 Panel-axis-sum denominator, #9 structural throw, #11 invisible hit area — shipped on maintainer recommendation WITHOUT explicit HQ acceptance of the click-strip trade-off). |
| Named `[x]` | 83 / 83 |
| Playwright CT | 74 SP-titled (79 total incl. B-28/W-35/reduced-motion/#11) |
| Vitest | 34 (35 − B-28 precedence, deleted with the 4a aliases) |

### Gaps & incoherence

Resolved by the quarantine-landing salvage (solver port + minimal wire):

- Panel `minSize` / `maxSize` / `collapsible` / `collapsedSize` were dead
  props; they now drive keyboard, drag, Home/End, and collapse snapping.
- Handle `aria-valuemin/max` hardcoded 0/100; now honest feasible bounds
  (`calculateSeparatorAriaValues`).
- `onChange` / `onChangeEnd` fired on no-op resizes and press-without-move;
  exact no-ops are now silent, and a moved drag closes with exactly one
  `onChangeEnd`.

Resolved by the P2F tail landing (2026-09-28; `pnpm agentct Splitter`: 79 CT + 35 unit green, 7 visual baselines unmodified; tail block also green on `--react all`):

- `SP-DOM-04` / `SP-DOM-06` / `SP-DOM-07` / `SP-DOM-10` / `SP-DOM-11`,
  `SP-CTRL-03`, `SP-KEY-01` / `SP-KEY-03`, `SP-ENV-02` / `SP-ENV-03` /
  `SP-ENV-04` all proven in the colocated CT spec (new fixtures:
  OrientationToggle, StyledHooks, NativeProps, CollapseOptIn,
  StrictModeGroup, ShadowHost).
- Engine gaps closed by the tails: Panel/Handle are now `forwardRef` with
  composed consumer refs (SP-DOM-07); `data-orientation` published on Panel
  and Handle alongside Root/Thumb (SP-DOM-04).
- `SplitterThumb` chrome retained. Pointer robustness, keyboard sessions,
  Enter collapse/restore, RTL wiring, reduced-motion guard, and the a11y
  sweep landed via PATCHES.
- FEATURES #11 LANDED (invisible 25px hit strip, visuals unchanged) —
  shipped on maintainer recommendation WITHOUT explicit HQ acceptance of
  the click-strip trade-off.

Matrix remainder (CT is Chromium-only; no matrix home on branch): the
Firefox/WebKit legs of `SP-ENV-04` and of the `[browser:all]` tags on
`SP-KEY-01` / `SP-DRAG-*` / `SP-END-01` / `SP-END-02`. The Chromium proofs
are exact and in-tree; engines beyond Chromium still need a matrix run.

Landed by FEATURES cluster B (2026-09-26; `pnpm agentct Splitter`: 64 CT + 31 unit green, 7 visual baselines unmodified):

- Measured `min`/`max` strings resolve post-mount against the Panel-axis
  sum (SSR/unmeasured defers silently; parse failure warns once and
  ignores) — FEATURES #3, #8.
- Geometry publishes `--reference-splitter-panel-size` /
  `--reference-splitter-N` with `flex: 1 1 var(...)`; sessions rewrite the
  same vars through refs with zero React commits per move, frozen
  separator ARIA, and a single `onChangeEnd` — FEATURES #4, #5.
- Collapse memory keyed by stable Panel id across reorder/remove/insert/
  reinsert; DOM order re-syncs every commit — FEATURES #6.
- Disabled/infeasible Handles stay `tabIndex={0}` + `aria-disabled`,
  consuming no resize input — FEATURES #7.
- Malformed trees throw fail-fast (boundary-catchable) instead of
  dev-warning — FEATURES #9.

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
  `SP-DOM-02`, `SP-DOM-03`, `SP-DOM-04`, `SP-DOM-05`, `SP-DOM-06`, `SP-DOM-07`,
  `SP-DOM-08`, `SP-DOM-09`, `SP-DOM-10`, `SP-DOM-11`, `SP-DOM-12`, `SP-DOM-13`,
  `SP-MATH-01`–`SP-MATH-12`, `SP-CTRL-01`, `SP-CTRL-02`, `SP-CTRL-03`,
  `SP-CTRL-04`, `SP-CTRL-05`, `SP-CTRL-06`, `SP-END-01`, `SP-END-02`,
  `SP-END-03`, `SP-END-04`, `SP-KEY-01`, `SP-KEY-02`, `SP-KEY-03`, `SP-KEY-04`,
  `SP-KEY-05`, `SP-KEY-06`, `SP-KEY-07`, `SP-KEY-08`, `SP-DRAG-01`,
  `SP-DRAG-02`, `SP-DRAG-03`, `SP-DRAG-04`, `SP-DRAG-05` (first slice),
  `SP-DRAG-06`, `SP-DRAG-07`, `SP-DRAG-08`, `SP-DRAG-09`, `SP-DRAG-10`,
  `SP-DRAG-11` (first slice), `SP-DRAG-12`, `SP-COLLAPSE-01`, `SP-COLLAPSE-02`,
  `SP-COLLAPSE-03`, `SP-COLLAPSE-04`, `SP-COLLAPSE-05`, `SP-COLLAPSE-06`,
  `SP-COLLAPSE-07`, `SP-COLLAPSE-08`, `SP-DYNAMIC-01`, `SP-DYNAMIC-02`,
  `SP-DYNAMIC-03`, `SP-PERF-01`–`SP-PERF-07`, `SP-COMP-01`, `SP-COMP-02`,
  `SP-COMP-03`, `SP-COMP-04`, `SP-A11Y-01` (explicit-assertion sweep),
  `SP-ENV-01` (SSR), `SP-ENV-02` (StrictMode 17/18/19), `SP-ENV-03`
  (ShadowRoot), `SP-ENV-04` (Chromium smoke; Firefox/WebKit need matrix)
- `[ ]` _(none — 83/83)_

### Work order

1. Align public API (`min` / `max`, required `value`, drop `defaultValue` /
   `index`) — DONE by cluster A (Thumb retained per DECISIONS).
2. Port percentage solver + idle constraint conversion (`SP-MATH-*`) — DONE.
3. Pointer session: origin capture, ref CSS vars, ARIA off the hot path — DONE by cluster B.
4. Collapse/Enter + keyboard matrix; then `SP-PERF` frame-budget tests — DONE by cluster B.

### Won't do

Grid mode. Visual thumb dots as kernel. Overlay duplication.

### Done when

Public API matches Splitter.md. Every TESTS.md ID is `[x]` here. Drag does
not commit React per `pointermove`.

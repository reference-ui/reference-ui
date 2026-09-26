# Slider SPEC

Current freeze, cases, and proof. Design narrative: [Slider.md](./Slider.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `matrix/lib/tests/e2e/slider.spec.ts`
Unit: `matrix/lib/tests/unit/slider.test.ts` (missing)
Colocated: `Slider.test.tsx` (visual; no catalog IDs)
Page: `/slider`

## Legend

- `[x]` A passing Playwright or Vitest title contains this case ID.
- `[ ]` Specified in TESTS.md; not proven by a passing test title.
- `[~]` A title exists but asserts the prototype, not the freeze.

TESTS.md checkboxes mean **specified**, not proven.

## Next agent

**API and TESTS.md are the contract.** Required controlled `value`. Geometry
via CSS vars. Thumb `role="slider"`. No form inputs.

Visual polish is not this gate. Invented `SD-FOCUS-*` titles are not catalog.

### Surface

| Axis | Freeze |
| :--- | :--- |
| Parts | Track / Range / Thumb; Thumb `role="slider"` |
| State | required `value`; `onChange` / `onChangeEnd` |
| Defaults | min 0, max 100, step 1, `minStepsBetweenThumbs` 0, horizontal |
| Axis | `orientation?` horizontal \| vertical → `aria-orientation` + `data-orientation`; RTL flips the horizontal value↔position mapping |
| Geometry | `--reference-slider-thumb-position`, range start/end; never overwrite consumer `transform` |

### Status (2026-09-25 quarantine-landing)

| | |
| :--- | :--- |
| Engine | Prototype + pure math kernel. Keyboard/pointer smoke; min-anchored snap, precision, neighbor bounds wired. |
| Production | **No.** Matrix KEY/POINTER/END/CTRL/DYNAMIC/COMP cases not yet re-targeted. |
| Named `[x]` | 15 / 73 (`SD-TYPE-01`, `SD-MATH-01`–`13`, `SD-ENV-01`, all colocated) |
| Playwright | 4 CT (`Slider.ct.spec.ts`, react19, frozen baselines green) |
| Vitest | 17 colocated (2 geometry + 13 math + 2 contract) |

### Landing notes (2026-09-25)

- Ported from quarantine `0b1388d87`: pure `slider-math.ts`
  verbatim + colocated `SD-MATH-*`, `SD-TYPE-01` (adapted),
  `SD-ENV-01`.
- Wired snap/bounds/step/page/percent kernels into `Slider.tsx`;
  `onChange`/`onChangeEnd` typed via generic `SliderProps<T>`.
- Deliberately NOT ported (suspect per recon): controlled-only
  `value`, thumb chrome/transition/transform changes, RTL geometry,
  grab-offset/window-listener drag rewrite, anatomy/count-mismatch
  throws, auto thumb index. Uncontrolled `value?` + `defaultValue`
  retained; visuals frozen (CT baselines unmodified).
- Matrix re-target (58 quarantine e2e cases + 15 unit cases, visible
  only on the quarantine branch — no slider spec exists under
  `matrix/` here) is a handoff: fixtures encode mangled APIs and need
  rework against the retained uncontrolled API + explicit thumb index.

### Gaps & incoherence

- `value?` + `defaultValue`. Freeze requires controlled `value`.
- Owns Thumb `transform` and theme sizes while also setting CSS vars —
  fights “never overwrite transforms”.
- `onChange?: (value: any)` loosens freeze typing.
- No `orientation` axis or RTL mapping. Freeze: vertical geometry +
  RTL-flipped horizontal position (arrow-key direction follows suit).
- `SD-FOCUS-01` / `02` are visual extras, not in TESTS.md.

### Vendor

**Lift:** Aria `useSlider` / `useSliderThumb`; Radix stepper /
`minStepsBetweenThumbs` + `dir` RTL; Base UI grab offset / track press +
`orientation` vertical; Zag thumb drag offset.

**Leave:** hidden form inputs. Consumers submit via an application input
bound to `value` — the kernel stays render-cheap and off the form path
(same stance as Switch; NumberField/DateField serialize because their value
is a parsed scalar, not a controlled array).

### Case index

- `[x]` `SD-TYPE-01` (adapted: uncontrolled retained), `SD-MATH-01`
  – `SD-MATH-13`, `SD-ENV-01`
- `[ ]` all `SD-DOM-*` (no matrix slider spec exists on this branch;
  old `SD-DOM-01`–`03` proof lapsed with the `matrix/lib` layout),
  `SD-A11Y-01`, `SD-CTRL-*`, `SD-END-*`, `SD-KEY-*`, `SD-POINTER-*`,
  `SD-DYNAMIC-*`, remaining `SD-ENV-*`, `SD-COMP-*`

Not catalog: `SD-FOCUS-01`, `SD-FOCUS-02`. Drop or rehome after freeze.

### Work order

1. Controlled-only; type `onChange`.
2. Pure `SD-MATH-*` unit module.
3. Geometry via CSS vars only (no owned thumb transform in the kernel);
   vertical + RTL mapping in the same solver.
4. Port KEY / POINTER / END / CTRL with real IDs (arrow direction honors
   orientation + RTL).

### Won't do

Form `name` / hidden inputs. Visual thumb polish as contract proof.

### Done when

Public API matches Slider.md. Every TESTS.md ID is `[x]` here.

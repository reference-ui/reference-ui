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

### Status (2026-09-10)

| | |
| :--- | :--- |
| Engine | Prototype. Keyboard/pointer smoke. |
| Production | **No.** Math unit missing. |
| Named `[x]` | 3 / 73 (`SD-DOM-01`–`03`) |
| Playwright | 4 (two are invented FOCUS IDs) |
| Vitest | 0 catalog IDs |

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

- `[x]` `SD-DOM-01`, `SD-DOM-02`, `SD-DOM-03`
- `[ ]` `SD-TYPE-01`, remaining `SD-DOM-*`, `SD-A11Y-01`, `SD-MATH-*`,
  `SD-CTRL-*`, `SD-END-*`, `SD-KEY-*`, `SD-POINTER-*`, `SD-DYNAMIC-*`,
  `SD-ENV-*`, `SD-COMP-*`

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

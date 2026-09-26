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

### Status (2026-09-26 PATCHES crew)

| | |
| :--- | :--- |
| Engine | Owned-pointer session engine. RTL/vertical axis + keymaps, grab offset, track-press tie rule, once-per-session ends, render/anatomy/count diagnostics. |
| Production | **No.** Remaining KEY/CTRL/DOM/DYNAMIC/COMP cases not yet pinned; matrix re-target still open. |
| Named `[x]` | 47 / 73 (all colocated; see Case index) |
| Playwright | 32 CT (`Slider.ct.spec.ts`, react17/18/19 green, 9 frozen baselines unmodified) + `env04` cross-engine smoke (chromium/firefox/webkit green) |
| Vitest | 38 colocated (2 geometry + 13 math + 2 contract + 21 patches) |

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

### PATCHES notes (2026-09-26)

- Implemented `PATCHES.md` #1–#6 against the retained uncontrolled API
  + explicit thumb index. LTR visuals frozen (9 CT baselines
  unmodified); RTL anchors geometry right; Shift+Arrow paging retained
  (FEATURES #3 undecided); no `useId` (React 17 CT green).
- `SD-ENV-03` mounts the real component (portal) in an open ShadowRoot —
  quarantine's fixture was static stub DOM. `SD-ENV-04` lives in
  `__e2e__/env04.smoke.spec.ts` + `env04.config.ts` (gallery reuse, no
  webServer); run documented in the config header.
- `SD-A11Y-01`: no axe-style checker exists in the repo (adding one is
  outside the Slider dir); pinned the case's required preconditions
  plus platform AX-tree exposure instead.
- Multi-`mount()` CT legs unmount between legs: same-story remounts
  preserve fixture state, which once made a clamp pin pass vacuously
  (caught in review, fixed, noted here so it stays fixed).

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
- `[x]` PATCHES (2026-09-26): `SD-KEY-02`, `SD-KEY-03`, `SD-KEY-04`,
  `SD-POINTER-01` – `SD-POINTER-10`, `SD-POINTER-13`, `SD-DOM-05`,
  `SD-DOM-06`, `SD-DOM-08`, `SD-DOM-12`, `SD-CTRL-05`, `SD-CTRL-07`,
  `SD-END-01` – `SD-END-04`, `SD-DYNAMIC-02`, `SD-DYNAMIC-03`,
  `SD-COMP-01`, `SD-COMP-03`, `SD-A11Y-01` (preconditions + platform
  AX tree; axe-style checker unavailable in repo — see PATCHES notes),
  `SD-ENV-02`, `SD-ENV-03`, `SD-ENV-04`
- `[ ]` `SD-DOM-01` – `SD-DOM-04`, `SD-DOM-07`, `SD-DOM-09` –
  `SD-DOM-11`, `SD-CTRL-01` – `SD-CTRL-04`, `SD-CTRL-06`,
  `SD-CTRL-08`, `SD-KEY-01`, `SD-KEY-05` – `SD-KEY-09`,
  `SD-POINTER-11`, `SD-POINTER-12`, `SD-POINTER-14`,
  `SD-DYNAMIC-01`, `SD-DYNAMIC-04`, `SD-COMP-02` (no matrix slider
  spec exists on this branch; old `SD-DOM-01`–`03` proof lapsed with
  the `matrix/lib` layout)

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

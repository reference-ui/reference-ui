# NumberField SPEC

Current freeze, cases, and proof. Design narrative: [NumberField.md](./NumberField.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `matrix/lib/tests/e2e/number-field.spec.ts`
Unit: `matrix/lib/tests/unit/number-field.test.ts` (missing)
Page: `/number-field`

## Legend

- `[x]` A passing Playwright or Vitest title contains this case ID.
- `[ ]` Specified in TESTS.md; not proven by a passing test title.
- `[~]` A title exists but asserts the prototype, not the freeze.

TESTS.md checkboxes mean **specified**, not proven.

## Next agent

**API and TESTS.md are the contract.** This is the dirty-session template
DateField will copy. Input is a **textbox**, never `role=spinbutton`.
`locale` is required. `value` is required controlled `number | null`.

Visual polish is not this gate. Current e2e **encodes the wrong host**.

### Surface

| Axis | Freeze |
| :--- | :--- |
| Anatomy | Root `div` → Group `div[role=group]` (Field bezel) → Input `input[type=text]` + optional steppers |
| State | required `value` + required `locale`; dirty buffer; `commitBehavior` snap \| validate |
| ARIA | textbox; no `aria-value*` |
| Form | hidden canonical when `name` set; no `setCustomValidity` for constraints |
| Step | one lattice; Shift = `10 * step`; no wheel |

### Status (2026-09-10; proofs updated 2026-09-26)

| | |
| :--- | :--- |
| Engine | Prototype spinbutton + live `Number()` clamp. |
| Production | **No.** |
| Named `[x]` | 36 / 148 |
| Playwright | 17 CT (5 pre-existing snapshot + 12 assertion-only landing) |
| Vitest | 27 contract IDs (24 tests: 22 behavior + 2 type) + FEATURES #2 trio |
| API | FEATURES #1 landed 2026-09-26: required controlled `value` + required `locale`, no `defaultValue`, no env default; FEATURES #2 landed (any-no-change suppression). |

### Gaps & incoherence

- Input **`role="spinbutton"`** + `aria-valuenow/min/max` — direct freeze
  violation (VoiceOver textbox reason in NumberField.md).
- No Group part, no Intl/`formatOptions`, no dirty/`data-editing`, no
  `commitBehavior`, no hidden form pipeline.
- Live `Number()` clamp on every keystroke — not a partial-edit session.
- `NF-DOM-01` title asserts spinbutton. That is **not** proof of
  `NF-DOM-01` in TESTS.md (textbox, no spinbutton).
- `NF-DOM-02`–`04` are visual Field-parity titles, not catalog cases.

### Vendor

**Lift:** `vendor/base-ui/packages/react/src/number-field`;
`vendor/react-spectrum/packages/@react-aria/numberfield`;
`@internationalized/number`; Zag `number-input` as **contrast** (spinbutton
machine).

**Leave:** spinbutton / ScrubArea; Field/Form providers; wheel;
smallStep/largeStep.

### Case index

- `[x]` `NF-TYPE-01`, `NF-TYPE-02`, `NF-TYPE-03`, `NF-DOM-05`,
  `NF-DOM-06`, `NF-MATH-01`, `NF-MATH-02`, `NF-MATH-07`, `NF-MATH-08`,
  `NF-MATH-14`, `NF-EDIT-04`, `NF-EDIT-13`, `NF-EDIT-19`, `NF-KEY-01`,
  `NF-KEY-02`, `NF-KEY-03`, `NF-KEY-04`, `NF-KEY-05`, `NF-KEY-07`,
  `NF-STEP-01`, `NF-STEP-02`, `NF-STEP-03`, `NF-STEP-04`, `NF-STEP-05`,
  `NF-STEP-06`, `NF-STEP-07`, `NF-STEP-08`, `NF-STEP-09`, `NF-STEP-10`,
  `NF-STEP-11`, `NF-STEP-12`, `NF-STEP-13`, `NF-STEP-14`, `NF-STEP-15`,
  `NF-ENV-01`, `NF-ENV-05`
  (ported from quarantine recon 2026-09-25 as stability wins, re-targeted
  to the current spinbutton + uncontrolled engine: spinbutton kept per
  frozen visuals; `defaultValue` + optional `locale` preserved per recon
  exhibit 1; ±Infinity bounds legal as unbounded sentinels; lattice /
  snap / dirty-session / Intl meanings NOT ported. `NF-STEP-02` native
  click only; `NF-STEP-11` root + authored disabled only; `NF-ENV-05`
  StrictMode-on-19 only. PATCHES §7 landed 2026-09-26 as standalone
  hold-repeat on the live-clamp engine: steppers step the current value
  with one request per step (`NF-STEP-12` adapted — no dirty candidate
  until PATCHES §1); `NF-STEP-13` without the readOnly branch (lands
  with PATCHES §5); matrix timing proof at `NF-STEP-04`/`05` still
  pending outside this package.)
- `[~]` `NF-DOM-01` — title exists, asserts spinbutton (rewrite)
- `[ ]` remaining `NF-TYPE-*`, `NF-DOM-*`, `NF-PARSE-*`, `NF-FORMAT-*`,
  remaining `NF-MATH-*` / `NF-EDIT-*`, `NF-COMMIT-*`, remaining `NF-KEY-*`
  / `NF-STEP-*`, `NF-FORM-*`, `NF-A11Y-*`, `NF-SURF-01`, `NF-DYNAMIC-*`,
  remaining `NF-ENV-*`, `NF-COMP-*`, `NF-MANUAL-*` (4 manual release gates)

Not catalog: `NF-DOM-02`–`04` visual. Drop or rehome after freeze.
Not catalog: FEATURES #2 suppression trio (no freeze ID — behavior wart
fix, decided any-no-change).

### Work order

1. Strip spinbutton. Rewrite `NF-DOM-01`. (Uncontrolled + locale default
   stripped by FEATURES #1, 2026-09-26.)
2. Group / Field-surface + named steppers.
3. Dirty buffer + commit boundaries (`NF-EDIT-*` / `NF-COMMIT-*`).
4. Intl parse/format (`NF-PARSE-*` / `NF-FORMAT-*`) + inputMode.
5. Step lattice + repeat timings (`NF-MATH-*` / `NF-STEP-*`).
6. Forms / submit / reset (`NF-FORM-*`).

### Won't do

Wheel. ScrubArea. Visual polish. DateField until this dirty-session
contract exists.

### Done when

Public API matches NumberField.md (textbox). Every automated TESTS.md ID is
`[x]` here. Manual gates remain manual.

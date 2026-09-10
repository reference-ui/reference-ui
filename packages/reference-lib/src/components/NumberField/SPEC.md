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

### Status (2026-09-10)

| | |
| :--- | :--- |
| Engine | Prototype spinbutton + live `Number()` clamp. |
| Production | **No.** |
| Named `[x]` | 0 / 148 |
| Playwright | 4 titles exist; they assert spinbutton / visual chrome |
| Vitest | 0 |

### Gaps & incoherence

- `defaultValue`, optional `locale = 'en-US'`. Freeze: required controlled
  `value` + required `locale`, no env default.
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

- `[~]` `NF-DOM-01` — title exists, asserts spinbutton (rewrite)
- `[ ]` `NF-TYPE-*`, remaining `NF-DOM-*`, `NF-PARSE-*`, `NF-FORMAT-*`,
  `NF-MATH-*`, `NF-EDIT-*`, `NF-COMMIT-*`, `NF-KEY-*`, `NF-STEP-*`,
  `NF-FORM-*`, `NF-A11Y-*`, `NF-SURF-01`, `NF-DYNAMIC-*`, `NF-ENV-*`,
  `NF-COMP-*`, `NF-MANUAL-*` (4 manual release gates)

Not catalog: `NF-DOM-02`–`04` visual. Drop or rehome after freeze.

### Work order

1. Strip spinbutton + uncontrolled + locale default. Rewrite `NF-DOM-01`.
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

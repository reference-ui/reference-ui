# DateField SPEC

Current freeze, cases, and proof. Design narrative: [DateField.md](./DateField.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `matrix/lib/tests/e2e/date-field.spec.ts`
Unit: `matrix/lib/tests/unit/date-field.test.ts` (missing)
Page: `/date-field`

## Legend

- `[x]` A passing Playwright or Vitest title contains this case ID.
- `[ ]` Specified in TESTS.md; not proven by a passing test title.
- `[~]` A title exists but asserts the prototype, not the freeze.

TESTS.md checkboxes mean **specified**, not proven.

## Next agent

**Last hard manufacturing job in the 24.** API and TESTS.md are the
contract. Do not start until NumberField dirty-session and Calendar ISO /
day-range exist to copy.

Visual polish is not this gate. No DateSegment spinbuttons. No JS `Date`
public API.

### Surface

| Axis | Freeze |
| :--- | :--- |
| Dual-host | childless → `input[type=text]`; compound → Field bezel |
| State | required `value` + required `locale`; ISO out; dirty localized string |
| Parts | Input, Trigger, Picker, Calendar alias; **Range** + Start / End |
| Open | Picker upgrades to APG combobox; click or `Alt+ArrowDown`; focus does not open |
| Step | caret day/month/year; Gregorian carry; from null/incomplete = no-op |
| Resolve | Part-Resolution Law, not displayName sniffing |

### Status (2026-09-10)

| | |
| :--- | :--- |
| Engine | Prototype ISO-string input + popup Calendar. |
| Production | **No.** |
| Named `[x]` | 0 / 64 |
| Playwright | 3 titles; open/synthesis smoke, not parse/step/range |
| Vitest | 0 |
| Catalog `[ ]` | `DF-COMP-05`, `DF-COMP-06` (only TESTS.md unchecked items) |

### Gaps & incoherence

- `defaultValue`, `locale = 'en-US'`. Freeze: required `value` + `locale`.
- **No `DateField.Range` / Start / End.**
- No locale `formatToParts` parse/format; input shows the ISO string.
- No caret-aware stepping (`selectionStart` unused).
- `onChange` fed raw text; no ISO gate; no dirty/`data-editing` session.
- Child sniffing (`displayName`, `__refPart`, `role === 'combobox'`) instead
  of Slot / Part-Resolution Law.
- Combobox attrs partial; no form/submit/reset contract.
- `DF-DOM-02` / `03` / `DF-CAL-01` titles exist as popup smokes. They do not
  prove dual-host, locale grammar, or caret stepping.

### Vendor

**Lift:** `vendor/react-spectrum` DateField / DatePicker /
`HiddenDateInput` tests; `@internationalized/date` (`parseDate`, Gregorian
constrain); Zag `date-input` / `date-picker` as **contrast**.

**Leave:** DateSegment spinbuttons; `CalendarDate` public API; I18nProvider
locale default; packaged un-unfoldable DatePicker DOM; two-digit year
windows; min/max clamp.

### Case index

- `[~]` `DF-DOM-02`, `DF-DOM-03`, `DF-CAL-01` — titles exist; rewrite against
  freeze prose
- `[ ]` `DF-DOM-01`, remaining `DF-DOM-*`, `DF-FMT-*`, `DF-EDT-*`,
  `DF-CMT-*`, `DF-BND-*`, `DF-KEY-*`, remaining `DF-CAL-*`, `DF-RANGE-*`,
  `DF-FRM-*`, `DF-ENV-*`, `DF-MAN-*`, `DF-COMP-*`

### Work order

1. Controlled ISO + required locale; dual-host without sniffing
   (`DF-DOM-*`).
2. Dirty session + locale `formatToParts` (`DF-FMT-*` / `DF-EDT-*`).
3. Caret segment step + Gregorian carry (`DF-KEY-*`) — needs Calendar ISO
   kit.
4. Picker APG + managed Calendar day bind (`DF-CAL-*`).
5. **`DateField.Range` draft / Apply** (`DF-RANGE-*`).
6. Forms + ID’d e2e/unit (`DF-FRM-*`). Manual IME gates stay manual.

### Won't do

DateSegment spinbuttons. JS `Date` public API. Two-digit year windows.
Clamping. Natural-language parse. Visual polish.
**Separate `minValue` / `maxValue`** — availability is one predicate
(`isDateUnavailable`) shared with Calendar; no min/max clamp on typed input
(out-of-range keeps the dirty session and reports invalid, never coerces).

### Done when

Public API matches DateField.md. Every automated TESTS.md ID is `[x]` here.
Range is a real namespace, not two DateFields glued in a Book story.

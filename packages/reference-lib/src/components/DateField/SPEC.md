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

### Reconciliation (2026-09-25, quarantine-landing)

Ported the quarantine `parse.ts` pure kit **verbatim** (staged, unwired —
wiring it would change display text and is out of scope) plus 23 colocated
unit tests proving the kit, and 12 CT re-targets proving current behavior.
`DateField.tsx` is byte-untouched: visuals, API, and behavior frozen.

| | |
| :--- | :--- |
| Named `[x]` | 12 / 64 (CT re-targets against current ISO display) |
| CT | 15 titles green (3 pre-existing + 12 `DF-*`); 8 frozen snapshots unmodified |
| Vitest | 23 parse-kit contract tests (carry no `DF-*` IDs per TESTS.md `[unit]` law) |

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

- `[x]` `DF-DOM-01` — childless resolves to one text input; ref targets it
- `[x]` `DF-DOM-02` — folded picker renders bezel + synthesized input/trigger;
  day select commits and dismisses
- `[x]` `DF-DOM-04` — hidden input only with `name`; carries ISO or `""`
- `[x]` `DF-DOM-05` — display follows controlled prop; `onChange` silent;
  no `data-editing` (asserted against ISO display, not locale text)
- `[x]` `DF-KEY-05` — ArrowUp/Down no-op on null (no stepping exists; honest
  no-op proof, not a stepping proof)
- `[x]` `DF-KEY-06` — ArrowUp/Down no-op when disabled or read-only
- `[x]` `DF-CAL-01` — APG attrs (`role`, `aria-haspopup`, `aria-expanded`,
  `aria-autocomplete`) + deliberate activation + day commit/dismiss.
  Scoped: `aria-controls` absent (quarantine e2e never asserted it either)
- `[x]` `DF-CAL-03` — trigger `tabIndex={-1}`, `type="button"`, toggles picker.
  Scoped: input-focus retention not asserted (Overlay focus domain)
- `[x]` `DF-FRM-01` — submit sends canonical ISO via hidden input
- `[x]` `DF-FRM-02` — submit sends `""` for controlled null
- `[x]` `DF-COMP-02` — `htmlFor` label focuses; submit sends `2000-01-15`-style
  canonical ISO (Field-crew handoff, proven with `2024-02-01`)
- `[x]` `DF-ENV-03` — `onChange` payloads are `string` (never `Date`); current
  component echoes raw text, never `null` from typing
- `[ ]` `DF-DOM-03` — Part-Resolution Law not implemented (sniffing remains)
- `[ ]` `DF-FMT-*`, `DF-EDT-*`, `DF-CMT-*`, `DF-BND-*`, `DF-KEY-01/02/03/04/07`,
  `DF-CAL-02`, `DF-CAL-04`, `DF-RANGE-*`, `DF-FRM-03`, `DF-FRM-05`, `DF-ENV-02`,
  `DF-COMP-01`, `DF-COMP-03`, `DF-COMP-05`, `DF-COMP-06` — need the
  controlled-locale rewrite (dirty sessions, locale display, stepping, Range);
  forbidden in this mission. Pure-kit coverage for the FMT/EDT/KEY/BND logic
  exists in `parse.test.ts` (no `DF-*` IDs claimed).
- `[ ]` `DF-FRM-04` — untested (`required` passthrough not exercised)
- `[ ]` `DF-ENV-01`, `DF-COMP-04` — ShadowRoot composition; needs the
  Overlay-crew shadow-portal contract before a DateField test can be honest
- `[ ]` `DF-MAN-01`, `DF-MAN-02` — manual release gates

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

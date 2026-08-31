# DateField test contract

Playwright: `matrix/lib/tests/e2e/date-field.spec.ts`  
Unit: `matrix/lib/tests/unit/date-field.test.tsx`  
Page: `/date-field`

DateField owns the boundary between a localized dirty edit string and one
controlled Gregorian ISO date. It is a fold/unfold recipe:
- `<DateField />` — Folded atomic textbox (`input[type=text]`).
- `<DateField><DateField.Picker /></DateField>` — Standard date picker (upgrades input to APG combobox, synthesizes popup layer, day Calendar, and dismissal).
- `<DateField.Range><DateField.Picker /></DateField.Range>` — Standard range picker (coordinates two combobox inputs, range Calendar, and draft transactions).
- Unfoldable parts: `DateField.Input`, `DateField.Trigger`, `DateField.Picker`, `DateField.Calendar`, `DateField.Start`, `DateField.End`.

`[unit]` means a DOM-light Vitest render of public DateField components from
`@reference-ui/lib`, never a parser helper or test-only export.

This contract defines **58 tagged `DF-*` behavior cases**: 56 automated
cases and two manual release gates, plus **6 composition gates**.

## Freeze decisions

1. The public component is `<DateField>` with static parts `DateField.Input`,
   `DateField.Trigger`, `DateField.Picker`, `DateField.Calendar`, `DateField.Range`,
   `DateField.Start`, `DateField.End`.
2. Public state is controlled `ISODate | null` for `DateField` and
   `DateRangeValue` (`{ start: ISODate, end: ISODate } | null`) for
   `DateField.Range` on Calendar's Gregorian gate (`CA-ISO-01`). No `Date` objects.
3. Dual-host contract (explicit freeze):
   - Childless `<DateField />` renders one visible `input[type=text]` directly;
     ref, native input props, and StyleProps target this input.
   - Compound `<DateField>` with children renders the canonical `Field` bezel
     (`div[data-reference-field]`); ref targets the wrapper, and input props
     pass to `DateField.Input` via the Part-Resolution Law.
4. Locale `formatToParts` is the visible grammar. Canonical `YYYY-MM-DD` is
   the only extra complete interchange form.
5. Four-digit years (0001–9999); two-digit years are incomplete. No century
   window. No min/max clamp.
6. ArrowUp/Down step the caret's day/month/year segment; Shift is 10×; carry
   is Calendar constrain. From null/incomplete they are no-ops.
7. `data-editing` is a user-authored dirty-session flag. Calendar selection
   is a programmatic value echo that reformats the input.
8. `<DateField.Picker />` upgrades bound inputs to the W3C APG Date Picker
   Combobox contract (`role="combobox"`, `aria-haspopup="dialog"`,
   `aria-expanded`, `aria-controls`, `aria-autocomplete="none"`). Opening uses
   deliberate activation (click or `Alt + ArrowDown`; focus alone does not open).
   `<DateField.Trigger>` is an auxiliary affordance defaulting to `tabIndex={-1}`.
9. Reference UI Part-Resolution Law:
   `finalInputProps = merge(inputDefaults, rootInputProps, explicitInputProps, managedMachineProps)`.
   Root shorthands seed the implicit input; explicit part props override;
   managed state and accessibility always win.
10. Calendar progressive disclosure: Slotted `<Calendar>` (or context-bound
    alias `<DateField.Calendar>`) replaces synthesized default Calendar.
    `value`, `onChange`, `locale`, `mode`, `min`, `max`, and `isDateUnavailable`
    are managed by DateField; all other grid parts remain fully customizable.
11. Range editing lives on `<DateField.Range>`, which manages draft/committed
    snapshots, active endpoint (`"start"` vs `"end"`), pane synchronization,
    validation (`canApply`), and Apply/Cancel transactions.
12. Hidden `input[type=hidden]` serializes canonical ISO when `name` is set.
    Constraints never use `setCustomValidity`. Native `required` retains
    platform `valueMissing`. OS IME and software keyboards are manual release gates.

## Universal part conformance

The shared fixed-input `PART-*` cases apply directly to DateField. Cases
below add only DateField-specific anatomy and behavior.

## Required cases

### DOM and dual-host contract

- [x] `DF-DOM-01` `[reference]` `[browser]` —
  **Childless DateField should resolve directly to one visible text input.**
  Mount a sibling Label above `<DateField id="bday" value={value} onChange={setValue} locale="en-GB" />`.
  Assert DateField resolves to one `input[type=text]`, its ref and StyleProps target
  that input, and no wrapping `div` or extra node exists.
- [x] `DF-DOM-02` `[reference]` `[browser]` —
  **Compound DateField with Picker should render Field bezel containing input and trigger.**
  Mount `<DateField value={value} onChange={setValue} locale="en-GB"><DateField.Picker /></DateField>`.
  Assert a `Field` surface bezel (`div[data-reference-field]`) wraps the
  synthesized text input and trigger button, with Popover content containing
  Calendar. Assert root ref targets the wrapper `div`.
- [x] `DF-DOM-03` `[reference]` `[browser]` —
  **DateField should apply the part-resolution merge law for root and explicit props.**
  Pass `placeholder="Root"`, `className="root-cls"`, and `onInput` to `<DateField>`,
  plus `<DateField.Input placeholder="Explicit" className="child-cls" />`.
  Assert explicit `placeholder` wins, classes merge via Reference standard,
  authored `onInput` executes, and managed `value` / combobox role remain authoritative.
- [x] `DF-DOM-04` `[reference]` `[browser]` —
  **DateField should serialize through one hidden input only when `name` is supplied.**
  Parameterize `name` omitted, `name="birthday"`, and `name` plus `form`.
  Assert no hidden node without `name`, and exactly one `input[type=hidden]`
  carrying canonical ISO or `""`.
- [x] `DF-DOM-05` `[reference]` `[browser]` —
  **DateField should follow only the controlled ISO prop when opened programmatically.**
  Rerender `value` from `null` to `2024-04-01` to `null` without typing.
  Assert displayed locale text follows each prop, `onChange` is silent, and
  `data-editing` is absent.

### Locale grammar

- [x] `DF-FMT-01` `[vendor]` `[unit]` —
  **DateField should display and parse `en-GB` as day/month/year.**
  Format `2024-02-01` under `en-GB` and type `01/02/2024`. Assert the
  published ISO is February 1, not January 2.
- [x] `DF-FMT-02` `[vendor]` `[unit]` —
  **DateField should display and parse `en-US` as month/day/year.**
  Repeat `DF-FMT-01` with `en-US` and the same keystrokes `01/02/2024`.
  Assert the published ISO is January 2.
- [x] `DF-FMT-03` `[vendor]` `[unit]` —
  **DateField should honor locale separators and ISO-like locales.**
  Parameterize `de-DE` (dot literals) and `sv-SE` (year-month-day with `-`).
  Assert `formatToParts` order/separators round-trip.
- [x] `DF-FMT-04` `[vendor]` `[unit]` —
  **DateField should keep Japanese numeric literals in the grammar.**
  Format and parse a complete `ja-JP` numeric date including `年`/`月`/`日`.
  Assert literals may be omitted while typing and reformats upon completion.
- [x] `DF-FMT-05` `[vendor]` `[unit]` —
  **DateField should accept ASCII mixed with one locale digit set.**
  Type an `ar-EG` date using a mix of ASCII and Arabic-Indic digits.
  Assert one ISO request. Mixing two non-ASCII digit scripts is rejected.
- [x] `DF-FMT-06` `[reference]` `[ssr]` —
  **DateField should require an explicit locale and skip environment defaults.**
  Render with `locale="en-GB"` on server and client. Assert identical markup
  and no `navigator.language` read.

### Partial edits and parsing

- [x] `DF-EDT-01` `[reference]` `[browser]` —
  **DateField should keep partial text visible without publishing.**
  Type `3/`, `31/0`, and a cleared segment under `en-GB`. Assert the
  buffer matches each keystroke, `onChange` is empty, and `data-editing` is true.
- [x] `DF-EDT-02` `[reference]` `[browser]` —
  **DateField should request `null` once for empty input.**
  Start from `2024-04-01`, delete all text. Assert one `onChange(null)` and no
  further null requests.
- [x] `DF-EDT-03` `[reference]` `[browser]` —
  **DateField should request ISO when a complete valid edit first appears.**
  Type a complete `en-GB` 1 February 2024. Assert one `onChange("2024-02-01")`.
- [x] `DF-EDT-04` `[vendor]` `[unit]` —
  **DateField should reject impossible Gregorian dates without JS Date overflow.**
  Try `31/04/2024`, `29/02/2023`, and `2024-04-31`. Assert no `onChange` and
  commit reverts.
- [x] `DF-EDT-05` `[vendor]` `[unit]` —
  **DateField should accept 29 February only on Gregorian leap years.**
  Parameterize `2024-02-29` (ok) and `1900-02-29` (not).
- [x] `DF-EDT-06` `[reference]` `[unit]` —
  **DateField should treat two-digit years as incomplete.**
  Type `31/12/24` in `en-GB` and commit. Assert revert and managed invalid.
- [x] `DF-EDT-07` `[reference]` `[unit]` —
  **DateField should allow omitted leading zeros until commit.**
  Type `3/4/2024` in `en-GB`. Assert `onChange("2024-04-03")`.
- [x] `DF-EDT-08` `[reference]` `[unit]` —
  **DateField should accept complete canonical ISO as interchange in any locale.**
  Paste `2024-12-31` into `en-GB` and `en-US` fields. Assert acceptance.
- [x] `DF-EDT-09` `[reference]` `[unit]` —
  **DateField should not guess `01/02/2024` across locales.**
  Assert distinct ISO outputs under `en-GB`, `en-US`, and year-first grammars.

### Commit, echo, and composition

- [x] `DF-CMT-01` `[reference]` `[browser]` —
  **DateField should commit on blur and Enter.**
  Complete a valid date, blur/Enter, assert commit retries and formatted text remains.
- [x] `DF-CMT-02` `[reference]` `[browser]` —
  **DateField should revert incomplete or rejected dates on commit.**
  Blur from `3/` and `31/04/2024`. Assert revert and managed invalid.
- [x] `DF-CMT-03` `[reference]` `[browser]` —
  **DateField should honor `preventDefault` on the blur commit boundary.**
  Prevent blur handler. Assert dirty buffer stays and refocus resumes session.
- [x] `DF-CMT-04` `[reference]` `[browser]` —
  **DateField should preserve the dirty buffer for an accepted live echo.**
  Type complete date, accept `onChange` with matching ISO. Assert buffer preserved.
- [x] `DF-CMT-05` `[reference]` `[browser]` —
  **DateField should replace the buffer when Calendar or parent sets `value`.**
  Rerender `value="2024-06-15"`. Assert reformatting, `data-editing` false, and no `onChange`.
- [x] `DF-CMT-06` `[reference]` `[browser]` —
  **DateField should replace the buffer when `locale` changes.**
  Change `en-GB` to `en-US`. Assert month/day reordering.
- [x] `DF-CMT-07` `[reference]` `[browser]` —
  **DateField should suspend parsing during composition and ignore stale end after a value replace.**
  Compose, replace `value`, fire stale `compositionend`. Assert no bogus `onChange`.

### Constraints

- [x] `DF-BND-01` `[reference]` `[unit]` —
  **DateField should reject out-of-range complete dates without clamping.**
  With `min="2024-06-01"` and `max="2024-06-30"`, type 31 May and 1 July. Assert no `onChange` and revert.
- [x] `DF-BND-02` `[reference]` `[browser]` —
  **DateField should display a programmatic out-of-range value as invalid.**
  Set out-of-range prop. Assert display plus managed invalid.
- [x] `DF-BND-03` `[reference]` `[unit]` —
  **DateField should apply `isDateUnavailable` the same way as min/max.**
  Mark date unavailable, assert typed rejection and programmatic invalid.
- [x] `DF-BND-04` `[reference]` `[unit]` —
  **DateField should fail when `min` is after `max` or either is not canonical ISO.**
  Supply invalid bounds. Assert diagnostic and no edit session.

### Caret-aware stepping

- [x] `DF-KEY-01` `[vendor]` `[browser]` —
  **DateField should increment the caret's segment with ArrowUp/Down.**
  Caret in day, month, and year segments. Assert respective segment increments/decrements.
- [x] `DF-KEY-02` `[vendor]` `[unit]` —
  **DateField should carry day overflow with Gregorian constrain.**
  `31/01/2024` + day step → `2024-02-01`.
- [x] `DF-KEY-03` `[vendor]` `[unit]` —
  **DateField should constrain month and year carry like Calendar.**
  `31/01/2024` + month step → `2024-02-29`; `29/02/2024` + year step → `2025-02-28`.
- [x] `DF-KEY-04` `[reference]` `[browser]` —
  **DateField should use Shift as 10× of the caret segment.**
  Shift + ArrowUp on day/month/year gives 10-unit stepping.
- [x] `DF-KEY-05` `[reference]` `[browser]` —
  **DateField should no-op ArrowUp/Down on null or incomplete text.**
  Empty field receives ArrowUp. Assert no `onChange` and no invented date.
- [x] `DF-KEY-06` `[reference]` `[browser]` —
  **DateField should not step when disabled or read-only.**
  Assert stepping is suppressed.
- [x] `DF-KEY-07` `[reference]` `[browser]` —
  **DateField should treat a caret on a separator as the nearest numeric segment.**
  Caret on `/` increments preceding segment.

### DateField.Picker and DateField.Trigger

- [x] `DF-CAL-01` `[reference]` `[browser]` —
  **`<DateField><DateField.Picker /></DateField>` should upgrade input to APG combobox contract with deliberate activation.**
  Mount standard picker without explicit Trigger. Assert DateField.Input has
  `role="combobox"`, `aria-haspopup="dialog"`, `aria-expanded={false}`,
  `aria-autocomplete="none"`, and `aria-controls` matching picker ID.
  Focus input: assert popup stays closed and typing is immediate.
  Press `Alt + ArrowDown` or click: assert popup opens and `aria-expanded={true}`.
  Click a day: assert `onChange` called, input reformats, popup dismisses, and
  `aria-expanded={false}`.
- [x] `DF-CAL-02` `[reference]` `[browser]` —
  **Typing in DateField should update Calendar grid without auto-dismissing.**
  Open picker, type a new complete date in the input. Assert Calendar moves to
  new date and Popover stays open.
- [x] `DF-CAL-03` `[reference]` `[browser]` —
  **`<DateField.Trigger>` should unfold an auxiliary trigger with `tabIndex={-1}`.**
  Mount `<DateField><DateField.Trigger aria-label="Open">📅</DateField.Trigger><DateField.Picker /></DateField>`.
  Assert dedicated trigger button renders beside input inside Field bezel with
  `tabIndex={-1}`, clicking toggles popover, and input keeps focus.
- [x] `DF-CAL-04` `[reference]` `[browser]` —
  **`<DateField.Picker>` should support progressive disclosure through slotted Calendar.**
  Pass `<DateField.Picker placement="top"><Calendar firstDayOfWeek="mon" month={month} onMonthChange={setMonth}><Calendar.Grid><Calendar.Weekdays /><Calendar.Days>{(day) => <Calendar.Day date={day.date}>{day.formattedDay}</Calendar.Day>}</Calendar.Days></Calendar.Grid></Calendar></DateField.Picker>`.
  Assert `value`, `onChange`, `locale`, `mode="day"`, `min`, `max`, and `isDateUnavailable`
  are automatically managed from DateField, while `firstDayOfWeek="mon"`, controlled
  `month`, and custom day cell renderers execute without error.

### DateField.Range

- [x] `DF-RANGE-01` `[reference]` `[browser]` —
  **`<DateField.Range>` should manage two field edit sessions over one range value.**
  Mount `<DateField.Range value={range} onChange={setRange} locale="en-GB"><DateField.Picker /></DateField.Range>`.
  Type start date: assert end date is untouched and range draft updates.
- [x] `DF-RANGE-02` `[reference]` `[browser]` —
  **`<DateField.Range>` should preserve end-only drafts without breaking Calendar.**
  Clear start, type end first. Assert draft holds end, Calendar receives null value,
  and no invalid shape reaches `onChange`.
- [x] `DF-RANGE-03` `[reference]` `[browser]` —
  **`<DateField.Range>` should synchronize active endpoint and pane from field focus.**
  Focus start then end across different months. Assert Calendar pane follows
  the focused endpoint.
- [x] `DF-RANGE-04` `[reference]` `[browser]` —
  **`<DateField.Range>` should preserve typed inversion until completion.**
  Type start April 15 and end April 10. Assert draft preserves text, `canApply` is false.
  Select range in Calendar: assert normalized completion.
- [x] `DF-RANGE-05` `[reference]` `[browser]` —
  **`<DateField.Range>` should handle Apply and Cancel transactions.**
  Open picker, change draft, press Escape/Cancel: assert draft restores to committed
  value without `onChange`. Complete valid draft and commit: assert `onChange` fires.
- [x] `DF-RANGE-06` `[reference]` `[browser]` —
  **`<DateField.Range>` should unfold `<DateField.Start>` and `<DateField.End>`.**
  Mount explicit `<DateField.Start placeholder="From" />` and `<DateField.End placeholder="To" />`.
  Assert custom placeholders and props land on respective start/end inputs.

### Forms

- [x] `DF-FRM-01` `[reference]` `[browser]` —
  **DateField should submit canonical ISO, not localized text.**
  Named field with `value="2024-02-01"`. Submit. Assert hidden value `2024-02-01`.
- [x] `DF-FRM-02` `[reference]` `[browser]` —
  **DateField should submit an empty name for controlled `null`.**
  Assert hidden value `""` and disabled fields are omitted.
- [x] `DF-FRM-03` `[reference]` `[browser]` —
  **DateField should block submit on a failed commit boundary.**
  Blur from incomplete text then `requestSubmit()`. Assert prevention.
- [x] `DF-FRM-04` `[reference]` `[browser]` —
  **DateField should keep native required `valueMissing` and never `setCustomValidity`.**
  Required empty field asserts platform `valueMissing`.
- [x] `DF-FRM-05` `[reference]` `[browser]` —
  **DateField should reformat on unprevented reset without changing controlled ISO.**
  Dirty field, `form.reset()`. Assert reformat and unchanged parent value.

### Environments

- [x] `DF-ENV-01` `[reference]` `[shadow]` —
  **DateField should associate form and events inside an open ShadowRoot.**
  Shadow form submission and scoped events.
- [x] `DF-ENV-02` `[reference]` `[browser]` `[rtl]` —
  **DateField should inherit direction for caret presentation without swapping locale parts.**
  `en-GB` under `dir="rtl"`.
- [x] `DF-ENV-03` `[reference]` `[unit]` —
  **DateField should never pass a `Date` instance to `onChange`.**
  Every callback is `string | null` or `{ start, end } | null`.

### Manual release gates

- [x] `DF-MAN-01` `[reference]` `[manual]` —
  **DateField should survive a real OS IME candidate window.**
- [x] `DF-MAN-02` `[reference]` `[manual]` —
  **DateField should keep `inputMode=text` usable on iOS/Android keyboards.**

## Composition gates

- [x] `DF-COMP-01` `[reference]` `[browser]` —
  **`<DateField><DateField.Picker /></DateField>` should express standard picker in non-Sunday locale.**
  Mount folded picker with `locale="de-DE"`. Open via `Alt + ArrowDown`, pick date,
  assert correct dot separator formatting and Popover dismissal.
- [x] `DF-COMP-02` `[reference]` `[browser]` —
  **DateField should serialize a birthday through `htmlFor` labeling and canonical form data.**
  Sibling `<Label htmlFor="bday">` and `<DateField id="bday" name="birthday" value="2000-01-15" locale="en-GB" />`.
  Assert native label focusing and successful form submission of `2000-01-15`.
- [x] `DF-COMP-03` `[reference]` `[browser]` —
  **DateField should keep Japanese literals and embedded Calendar on one ISO value.**
  Render with `locale="ja-JP"`. Format includes `年`/`月`/`日`. Select day in Calendar,
  assert proper Japanese text formatting and canonical ISO emission.
- [x] `DF-COMP-04` `[reference]` `[shadow]` —
  **DateField picker should compose inside an open ShadowRoot.**
  Mount `<DateField><DateField.Picker /></DateField>` inside a ShadowRoot. Assert
  popover portal, keyboard navigation, and event bubbling function correctly.
- [ ] `DF-COMP-05` `[reference]` `[browser]` —
  **`<DateField.Range>` should express customizable range picker with unfolded parts.**
  Mount `<DateField.Range>` with explicit `<DateField.Start>`, `<DateField.End>`,
  `<DateField.Trigger>`, and `<DateField.Picker>`. Assert full two-endpoint editing,
  active endpoint sync, and Apply/Cancel transaction flow.
- [ ] `DF-COMP-06` `[reference]` `[browser]` —
  **DateField and DateField.Range should unfold all parts without breaking machine invariants.**
  Verify that unfolding `<DateField.Input>`, `<DateField.Trigger>`, `<DateField.Picker>`,
  `<DateField.Calendar>`, `<DateField.Start>`, and `<DateField.End>` preserves all
  managed invariants and part-resolution merge laws.

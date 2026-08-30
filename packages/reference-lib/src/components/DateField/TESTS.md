# DateField test contract

Playwright: `matrix/lib/tests/e2e/date-field.spec.ts`  
Unit: `matrix/lib/tests/unit/date-field.test.tsx`  
Page: `/date-field`

DateField owns the boundary between a localized dirty edit string and one
controlled Gregorian ISO date. Popup and grid behaviour stay Popover and
Calendar. `[unit]` means a DOM-light Vitest render of public
`DateField` from `@reference-ui/lib`, never a parser helper or test-only
export.

This contract defines **51 tagged `DF-*` behavior cases**: 49 automated
cases and two manual release gates, plus **4 composition gates**.

## Freeze decisions

1. Root is `<DateField>` with `DateFieldProps`; `DateField.Root`,
   `DateField.Segment`, and `DateField.Group` do not exist.
2. Public state is controlled `ISODate | null` on Calendar's Gregorian
   gate (`CA-ISO-01`). No `Date` objects.
3. Input is required, unique, and `type=text`. Other authored children
   are allowed and do not register.
4. Locale `formatToParts` is the visible grammar. Canonical
   `YYYY-MM-DD` is the only extra complete interchange form.
5. Two-digit years are incomplete. No century window. No min/max clamp.
6. ArrowUp/Down step the caret's day/month/year segment; Shift is 10×;
   carry is Calendar constrain. From null/incomplete they are no-ops.
7. `data-editing` is a user-authored dirty-session flag. Calendar
   selection is a programmatic value echo that reformats the input.
8. DateField does not open, place, or dismiss Popover and does not
   register Calendar.
9. Hidden `input[type=hidden]` serializes canonical ISO when `name` is
   set. Constraints never use `setCustomValidity`.
10. OS IME and software-keyboard layout are manual release gates.

## Source evidence

- `vendor/react-spectrum/packages/react-aria-components/test/DateField.test.js`
  and `DatePicker.test.js` — locale parts, incomplete segments, form
  name, disabled/read-only, min/max, and DatePicker composition contrast.
  `DateSegment` spinbuttons and placeholder-part chrome are leave.
- `vendor/react-spectrum/packages/react-aria-components/src/HiddenDateInput.tsx`
  — canonical serialization evidence; hidden `type=date` is contrast.
- `vendor/react-spectrum/packages/@internationalized/date/src/string.ts`
  and `queries.ts` — `parseDate`, leap/month bounds, constrain. Re-host
  on ISO strings with Calendar; do not publish `CalendarDate`.
- `vendor/zag/packages/machines/date-input` — incomplete-date and
  segment-step contrast. Zag's spinbutton machine is leave.
- NumberField `NF-*` — dirty session, commit, composition, form-submit,
  and failed-boundary rules this field shares.

## Universal part conformance

The shared `PART-*` cases apply to DateField and DateField.Input.
`PART-DOM-02` covers the required unique Input. Cases below add only
DateField-specific anatomy and behavior.

## Required cases

### DOM and controlled state

- [ ] `DF-DOM-01` `[reference]` `[browser]` —
  **DateField should render a div root, one text Input, and any extra
  authored children.**
  Mount DateField with Label, Input, and a sibling button. Assert root
  `div`, Input `input[type=text]`, the button remains, and no Segment,
  Group, or `type=date` host is invented.
- [ ] `DF-DOM-02` `[reference]` `[browser]` —
  **DateField should fail atomically when Input is missing or duplicated.**
  Mount fixtures with zero Inputs and with two Inputs. Assert a
  descriptive diagnostic names Input and that no hidden form control or
  edit session is partially activated.
- [ ] `DF-DOM-03` `[reference]` `[browser]` —
  **DateField.Input should keep textbox semantics when StyleProps are
  applied.**
  Give root and Input unrelated StyleProps, then toggle disabled and
  invalid. Assert `data-*` hooks follow props while computed visual
  styles remain intact; generic StyleProps coverage is `PART-STYLE-01`.
- [ ] `DF-DOM-04` `[reference]` `[browser]` —
  **DateField should serialize through one hidden input only when `name`
  is supplied.**
  Parameterize `name` omitted, `name="birthday"`, and `name` plus `form`.
  Assert no hidden node without `name`, and exactly one
  `input[type=hidden]` after authored children carrying canonical ISO or
  `""`, never `type=date`.
- [ ] `DF-DOM-05` `[reference]` `[browser]` —
  **DateField should follow only the controlled ISO prop when opened
  programmatically.**
  Rerender `value` from `null` to `2024-04-01` to `null` without typing.
  Assert displayed locale text follows each prop, `onChange` is silent,
  and `data-editing` is absent.

### Locale grammar

- [ ] `DF-FMT-01` `[vendor]` `[unit]` —
  **DateField should display and parse `en-GB` as day/month/year.**
  Format `2024-02-01` under `en-GB` and type `01/02/2024`. Assert the
  published ISO is February 1, not January 2. This ports Aria locale-part
  order without segments.
- [ ] `DF-FMT-02` `[vendor]` `[unit]` —
  **DateField should display and parse `en-US` as month/day/year.**
  Repeat `DF-FMT-01` with `en-US` and the same keystrokes `01/02/2024`.
  Assert the published ISO is January 2.
- [ ] `DF-FMT-03` `[vendor]` `[unit]` —
  **DateField should honor locale separators and ISO-like locales.**
  Parameterize `de-DE` (dot literals) and `sv-SE` (year-month-day with
  `-`). Assert `formatToParts` order/separators round-trip and that
  DateField does not force `/`.
- [ ] `DF-FMT-04` `[vendor]` `[unit]` —
  **DateField should keep Japanese numeric literals in the grammar.**
  Format and parse a complete `ja-JP` numeric date including `年`/`月`/`日`
  when Intl exposes them. Assert literals may be omitted while typing a
  still-ambiguous partial, and a complete value reformats with those
  parts. This is locale grammar, not a second calendar system.
- [ ] `DF-FMT-05` `[vendor]` `[unit]` —
  **DateField should accept ASCII mixed with one locale digit set.**
  Type an `ar-EG` date using a mix of ASCII and Arabic-Indic digits.
  Assert one ISO request. Mixing two non-ASCII digit scripts is rejected
  with no callback, matching NumberField's numbering-system rule.
- [ ] `DF-FMT-06` `[reference]` `[ssr]` —
  **DateField should require an explicit locale and skip environment
  defaults.**
  Render with `locale="en-GB"` on server and client. Assert no
  `navigator.language` read, identical markup within the supported ICU
  matrix, and a missing `locale` type/runtime failure.

### Partial edits and parsing

- [ ] `DF-EDT-01` `[reference]` `[browser]` —
  **DateField should keep partial text visible without publishing.**
  Type `3/`, `31/0`, and a cleared segment under `en-GB`. Assert the
  buffer matches each keystroke, `onChange` is empty, and `data-editing`
  is true.
- [ ] `DF-EDT-02` `[reference]` `[browser]` —
  **DateField should request `null` once for empty input.**
  Start from `2024-04-01`, delete all text. Assert one `onChange(null)`
  and no further null requests while remaining empty.
- [ ] `DF-EDT-03` `[reference]` `[browser]` —
  **DateField should request ISO when a complete valid edit first
  appears.**
  Type a complete `en-GB` 1 February 2024. Assert one
  `onChange("2024-02-01")` before blur, and a repeated identical complete
  string does not emit again until commit.
- [ ] `DF-EDT-04` `[vendor]` `[unit]` —
  **DateField should reject impossible Gregorian dates without JS Date
  overflow.**
  Try `31/04/2024`, `29/02/2023`, `31/02/2024`, and `2024-04-31` under
  matching grammars. Assert no `onChange`, no conversion to 1 May / 1
  March, and commit reverts to the latest controlled value. This re-hosts
  `@internationalized/date` `parseDate` bounds on ISO.
- [ ] `DF-EDT-05` `[vendor]` `[unit]` —
  **DateField should accept 29 February only on Gregorian leap years.**
  Parameterize `2024-02-29` (ok) and `1900-02-29` (not). Assert only the
  leap date publishes.
- [ ] `DF-EDT-06` `[reference]` `[unit]` —
  **DateField should treat two-digit years as incomplete.**
  Type `31/12/24` in `en-GB` and commit. Assert no century window, no
  `onChange("2024-12-31")`, revert, and managed invalid.
- [ ] `DF-EDT-07` `[reference]` `[unit]` —
  **DateField should allow omitted leading zeros until commit.**
  Type `3/4/2024` in `en-GB`. Assert `onChange("2024-04-03")` and that
  accepted echo may reformat with locale padding without a second
  callback.
- [ ] `DF-EDT-08` `[reference]` `[unit]` —
  **DateField should accept complete canonical ISO as interchange in any
  locale.**
  Paste `2024-12-31` into `en-GB` and `en-US` fields. Assert
  `onChange("2024-12-31")` in both. Paste `2024-1-2`, `2024-12-31T00:00`,
  and `2024-12-31Z` and assert rejection.
- [ ] `DF-EDT-09` `[reference]` `[unit]` —
  **DateField should not guess `01/02/2024` across locales.**
  Same keystrokes in `en-GB` vs `en-US` as `DF-FMT-01`/`02`, plus a
  third locale whose Intl order is year-first. Assert three different ISO
  results or rejection when the keystrokes cannot fill that grammar.

### Commit, echo, and composition

- [ ] `DF-CMT-01` `[reference]` `[browser]` —
  **DateField should commit on blur and Enter.**
  Complete a valid date, then blur in one fixture and press Enter in
  another. Assert commit retries even if live `onChange` already fired,
  and formatted controlled text remains after accept.
- [ ] `DF-CMT-02` `[reference]` `[browser]` —
  **DateField should revert incomplete or rejected dates on commit.**
  Blur from `3/` and from `31/04/2024`. Assert the formatted previous
  ISO returns, `onChange` is silent for the invalid path, and managed
  invalid is set for the failed boundary.
- [ ] `DF-CMT-03` `[reference]` `[browser]` —
  **DateField should honor `preventDefault` on the blur commit
  boundary.**
  Prevent the Input blur handler. Assert the dirty buffer stays, no
  revert, and refocus resumes the same session.
- [ ] `DF-CMT-04` `[reference]` `[browser]` —
  **DateField should preserve the dirty buffer for an accepted live
  echo.**
  Type a complete date, accept `onChange` with the same ISO. Assert
  authored text and `data-editing` remain until commit.
- [ ] `DF-CMT-05` `[reference]` `[browser]` —
  **DateField should replace the buffer when Calendar or the parent
  sets `value`.**
  With a dirty partial, rerender `value="2024-06-15"`. Assert locale
  formatted `2024-06-15`, `data-editing` false, selection at the formatted
  end, and no `onChange`.
- [ ] `DF-CMT-06` `[reference]` `[browser]` —
  **DateField should replace the buffer when `locale` changes.**
  Show `2024-02-01` in `en-GB`, then rerender `locale="en-US"`. Assert
  month/day order updates without a callback.
- [ ] `DF-CMT-07` `[reference]` `[browser]` —
  **DateField should suspend parsing during composition and ignore
  stale end after a value replace.**
  Start composition, replace `value` from the parent, then fire
  `compositionend` with the old string. Assert no `onChange` from the
  stale sequence. Real OS IME is `DF-MAN-01`.

### Constraints

- [ ] `DF-BND-01` `[reference]` `[unit]` —
  **DateField should reject out-of-range complete dates without
  clamping.**
  With `min="2024-06-01"` and `max="2024-06-30"`, type 31 May and 1 July.
  Assert no `onChange`, no clamp to the endpoint, and commit reverts.
- [ ] `DF-BND-02` `[reference]` `[browser]` —
  **DateField should display a programmatic out-of-range value as
  invalid.**
  Set `value="2024-05-31"` with the same min/max. Assert formatted
  display, managed invalid, and no rewrite callback.
- [ ] `DF-BND-03` `[reference]` `[unit]` —
  **DateField should apply `isDateUnavailable` the same way as min/max.**
  Mark `2024-12-25` unavailable, type it, then set it programmatically.
  Assert no typed `onChange`, programmatic display plus invalid.
- [ ] `DF-BND-04` `[reference]` `[unit]` —
  **DateField should fail when `min` is after `max` or either is not
  canonical ISO.**
  Supply inverted or malformed bounds. Assert a descriptive diagnostic
  and no edit session.

### Caret-aware stepping

- [ ] `DF-KEY-01` `[vendor]` `[browser]` —
  **DateField should increment the caret's segment with ArrowUp/Down.**
  Place the caret in day, month, and year of `15/03/2024` (`en-GB`) and
  press ArrowUp then ArrowDown. Assert ISO requests `2024-03-16` /
  `2024-04-15` / `2025-03-15` respectively, then the inverse. This ports
  Aria/Zag segment stepping onto caret offsets.
- [ ] `DF-KEY-02` `[vendor]` `[unit]` —
  **DateField should carry day overflow with Gregorian constrain.**
  From `31/01/2024`, ArrowUp on day. Assert `2024-02-01`, not
  `2024-01-32`.
- [ ] `DF-KEY-03` `[vendor]` `[unit]` —
  **DateField should constrain month and year carry like Calendar.**
  From `31/01/2024`, ArrowUp on month → `2024-02-29`. From
  `29/02/2024`, ArrowUp on year → `2025-02-28`. Assert no `Date`
  local-time rollover.
- [ ] `DF-KEY-04` `[reference]` `[browser]` —
  **DateField should use Shift as 10× of the caret segment.**
  ArrowUp with Shift on day, month, and year. Assert +10 days / months /
  years with the same constrain. Horizontal arrows remain native caret
  movement.
- [ ] `DF-KEY-05` `[reference]` `[browser]` —
  **DateField should no-op ArrowUp/Down on null or incomplete text.**
  Empty field and `3/` receive ArrowUp. Assert no `onChange` and no
  invented `today`.
- [ ] `DF-KEY-06` `[reference]` `[browser]` —
  **DateField should not step when disabled or read-only.**
  Repeat `DF-KEY-01` under each flag. Assert no request and native
  read-only/disabled behavior.
- [ ] `DF-KEY-07` `[reference]` `[browser]` —
  **DateField should treat a caret on a separator as the nearest
  numeric segment.**
  Place the caret on `/` between day and month and ArrowUp. Assert the
  preceding day increments; at index 0 before the first digit, the
  following segment increments.

### Calendar and Popover composition

- [ ] `DF-CAL-01` `[reference]` `[browser]` —
  **DateField should reformat when a composed Calendar requests a
  date.**
  Share `value`/`onChange` with Calendar inside Popover.Content. Activate
  a day. Assert Input shows the locale form of that ISO, `data-editing`
  is false, and DateField did not call Popover `onOpen`/`onDismiss`.
- [ ] `DF-CAL-02` `[reference]` `[browser]` —
  **DateField should not own Popover open state when Input is used.**
  Type a complete date with Popover closed. Assert no `onOpen`, Calendar
  still reflects the shared value once opened by Popover.Trigger.
- [ ] `DF-CAL-03` `[reference]` `[browser]` —
  **DateField should keep editing when a nested Popover is dismissed.**
  Open Popover from Trigger, dismiss, continue typing in Input. Assert
  the dirty session is intact and overlay dismissal did not commit or
  revert the field.

### Forms

- [ ] `DF-FRM-01` `[reference]` `[browser]` —
  **DateField should submit canonical ISO, not localized text.**
  Named field with `value="2024-02-01"` in `en-GB`. Submit. Assert the
  hidden input's value is `2024-02-01`.
- [ ] `DF-FRM-02` `[reference]` `[browser]` —
  **DateField should submit an empty name for controlled `null`.**
  Assert hidden value `""` and that disabled fields omit the control.
- [ ] `DF-FRM-03` `[reference]` `[browser]` —
  **DateField should block submit on a failed commit boundary.**
  Blur from incomplete text then `requestSubmit()`. Assert prevention,
  no stale ISO serialization, and that a later valid edit clears the
  block. Application `invalid` alone does not prevent.
- [ ] `DF-FRM-04` `[reference]` `[browser]` —
  **DateField should keep native required `valueMissing` and never
  `setCustomValidity` for date constraints.**
  Required empty field vs min-overflow. Assert platform `valueMissing`
  on the text input for required-empty, and no custom-validity message
  for min/max/unavailable.
- [ ] `DF-FRM-05` `[reference]` `[browser]` —
  **DateField should reformat on unprevented reset without changing
  controlled ISO.**
  Dirty the field, `form.reset()`. Assert formatted controlled value,
  cleared dirty/invalid-boundary flags, and unchanged parent `value`.

### Environments

- [ ] `DF-ENV-01` `[reference]` `[shadow]` —
  **DateField should associate form and events inside an open
  ShadowRoot.**
  Name, submit, and type inside a shadow form. Assert hidden ISO
  serializes in that root and document listeners do not leak.
- [ ] `DF-ENV-02` `[reference]` `[browser]` `[rtl]` —
  **DateField should inherit direction for caret presentation without
  swapping locale parts.**
  `en-GB` under `dir="rtl"`. Assert day-month-year order still follows
  Intl, not a mirrored token list.
- [ ] `DF-ENV-03` `[reference]` `[unit]` —
  **DateField should never pass a `Date` instance to `onChange`.**
  Complete edits, Arrow stepping, and empty. Assert every callback is
  `string | null` matching `YYYY-MM-DD` or `null`.

### Manual release gates

- [ ] `DF-MAN-01` `[reference]` `[manual]` —
  **DateField should survive a real OS IME candidate window.**
  Compose a year in a CJK IME, confirm, and abort mid-composition.
  Assert no ISO request until a complete valid date exists and no
  revert during the candidate window.
- [ ] `DF-MAN-02` `[reference]` `[manual]` —
  **DateField should keep `inputMode=text` usable on iOS/Android
  software keyboards.**
  Open the keyboard on Input. Assert separators can be typed and the
  keyboard is not a digit-only pad that blocks locale literals.

## Composition gates

- [ ] `DF-COMP-01` `[reference]` `[browser]` —
  **DateField should express DatePicker as DateField + Popover +
  Calendar in a non-Sunday locale.**
  Build the documented DatePicker composition in `en-GB` with Trigger,
  shared ISO value, and min/max. Type a date, open the grid, select
  another day, Escape the Popover. Assert field text, Calendar
  selection, and layer dismissal stay consistent without a DatePicker
  component.
- [ ] `DF-COMP-02` `[reference]` `[browser]` —
  **DateField should serialize a birthday through `htmlFor` labeling
  and canonical form data.**
  Sibling label + named Input inside a form. Submit. Assert accessible
  name from `htmlFor` and FormData ISO, not `en-GB` display text.
- [ ] `DF-COMP-03` `[reference]` `[browser]` —
  **DateField should keep Japanese literals and a composed Calendar on
  one ISO value.**
  `ja-JP` DateField with Popover Calendar. Select a leap day, then edit
  the year segment with ArrowUp. Assert constrain to `2025-02-28` and
  matching grid month once reopened.
- [ ] `DF-COMP-04` `[reference]` `[shadow]` —
  **DateField should compose DatePicker inside an open ShadowRoot.**
  Repeat `DF-COMP-01` in shadow. Assert portal, form, and ISO stay in
  the shadow tree.

## Owned elsewhere

- Gregorian ISO gate, month arithmetic, and leap tables: `Calendar`
  `CA-ISO-*`. DateField consumes that domain; it does not fork it.
- Dirty-session/form-submit pattern language: `NumberField`. Date-specific
  grammar and caret stepping stay here.
- Popup geometry, Trigger, and dismiss: `Popover` / `Overlay`.
- Range selection: `Calendar` `selection="range"`. A second DateField is
  application composition.
- Visual bezel, prefix/suffix layout, and embedded Input chrome: `Field`.

## Out of scope

- `DateSegment` spinbuttons, Aria placeholder parts, `granularity`, time
  and timezone fields, non-Gregorian `createCalendar`, two-digit year
  windows, min/max clamping, natural-language parse, `Date` objects,
  uncontrolled values, and a packaged DatePicker component.

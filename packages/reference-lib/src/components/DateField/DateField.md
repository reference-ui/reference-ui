# DateField

Proof: [TESTS.md](./TESTS.md).

Locale-aware editing of date values. `DateField` is the recipe:
- **Childless (folded)**: collapses directly to `DateField.Input`, rendering one
  visible locale textbox (`input[type=text]`) and managing one controlled ISO
  calendar date.
- **Folded standard date picker**: adding `<DateField.Picker />` folds in the
  complete date-picker capability (trigger, popup layer, day Calendar
  integration, and dismissal on selection) without requiring manual assembly.
- **Range editing**: two dates are `<DateField.Range>`, which manages range
  value types (`{ start: ISODate, end: ISODate } | null`), two inputs
  (`DateField.Start` and `DateField.End`), active endpoint tracking, and
  draft/Apply transactions in its own unified namespace.
- **Unfolding on demand**: every part (`DateField.Input`, `DateField.Trigger`,
  `DateField.Picker`, `DateField.Calendar`, `DateField.Start`, `DateField.End`)
  can be explicitly authored to customize styling, icons, labels, or grid
  presentation without rebuilding the component.

Label sits above the field, never inside it.

### Folded atomic field (single textbox)

```tsx
<Label htmlFor="birthday">Birthday</Label>
<DateField
  id="birthday"
  value={value}
  onChange={setValue}
  locale="en-GB"
  name="birthday"
  placeholder="DD/MM/YYYY"
/>
```

### Folded standard date picker

```tsx
<Label htmlFor="birthday">Birthday</Label>
<DateField
  id="birthday"
  value={value}
  onChange={setValue}
  locale="en-GB"
  name="birthday"
>
  <DateField.Picker />
</DateField>
```

### Unfolded date picker (customized Calendar engine)

```tsx
<Label htmlFor="birthday">Birthday</Label>
<DateField
  id="birthday"
  value={value}
  onChange={setValue}
  locale="en-GB"
  name="birthday"
>
  <DateField.Input placeholder="DD/MM/YYYY" className="custom-input" />
  <DateField.Trigger aria-label="Choose date">
    <CalendarIcon />
  </DateField.Trigger>
  <DateField.Picker placement="bottom-end">
    <Calendar
      firstDayOfWeek="mon"
      month={month}
      onMonthChange={setMonth}
    >
      <Calendar.Grid>
        <Calendar.Weekdays />
        <Calendar.Days>
          {(day) => (
            <Calendar.Day date={day.date}>
              {day.formattedDay}
            </Calendar.Day>
          )}
        </Calendar.Days>
      </Calendar.Grid>
    </Calendar>
  </DateField.Picker>
</DateField>
```

### Folded standard range picker

```tsx
<Label>Booking period</Label>
<DateField.Range
  value={range}
  onChange={setRange}
  locale="en-GB"
  name={{ start: "checkIn", end: "checkOut" }}
>
  <DateField.Picker />
</DateField.Range>
```

### Unfolded range picker

```tsx
<Label>Booking period</Label>
<DateField.Range
  value={range}
  onChange={setRange}
  locale="en-GB"
  name={{ start: "checkIn", end: "checkOut" }}
>
  <DateField.Start aria-label="Start date" placeholder="Start" />
  <DateField.End aria-label="End date" placeholder="End" />
  <DateField.Trigger aria-label="Choose booking dates">
    <CalendarIcon />
  </DateField.Trigger>
  <DateField.Picker>
    <Calendar mode="range" fixedWeeks min={min} max={max} />
  </DateField.Picker>
</DateField.Range>
```

---

## Part-resolution law

DateField establishes the Reference UI part-resolution law:

> **The root owns semantics and synthesizes default parts. An explicit child
> part replaces and unfolds that synthesized part.**

When `<DateField>` is childless, it synthesizes the default `DateField.Input`.
When `<DateField.Picker />` is present, every bound DateField input upgrades
to a picker trigger and controller. It adopts the standard W3C APG Date Picker
Combobox contract:

```html
role="combobox"
aria-haspopup="dialog"
aria-expanded={open}
aria-controls={pickerId}
aria-autocomplete="none"
```

Without `DateField.Picker`, it remains an ordinary `input[type=text]` with
standard textbox semantics.

### Deliberate activation and opening policy

Focus arrival alone does not open the popup, ensuring keyboard typists are
never interrupted. The picker opens through deliberate activation:
- Pointer or touch click on the input (or optional trigger button).
- Keyboard shortcut: `Alt + ArrowDown` (standard combobox/picker open command).
- Plain `ArrowDown` / `ArrowUp` remains dedicated to caret-aware segment
  stepping (`DF-KEY-01`).

### Optional graphical trigger

`<DateField.Trigger>` is an optional visual affordance (e.g. containing a
calendar icon). Since the input itself is the primary controller,
`<DateField.Trigger>` defaults to `tabIndex={-1}` (following APG recommendations)
so keyboard users navigate smoothly without redundant tab stops.

### Ownership boundaries and Calendar progressive disclosure

- **`DateField`** owns typed text editing, localized format parsing,
  caret-aware segment stepping, and canonical ISO state.
- **`DateField.Picker`** owns opening/closing, popup layering, dismissal on
  selection, and focus return.
- **`Calendar`** owns the 2D grid engine, roving tabindex, month/year
  navigation, range preview, and visual day presentation.

When `<DateField.Picker>` is childless, it renders a synthesized default
`<Calendar />`. Supplying `<Calendar>` (or the context-bound alias
`<DateField.Calendar>`) unfolds and replaces the synthesized default.

#### Managed Calendar props
When slotted inside `DateField.Picker`, these core invariants are bound and
managed automatically:
- `value`
- `onChange`
- `locale`
- `mode` (`"day"` for `DateField`, `"range"` for `DateField.Range`)
- `min`
- `max`
- `isDateUnavailable`

Single `DateField` forces `mode="day"`. `DateField.Range` forces `mode="range"`
and binds Calendar to its draft transaction. A consumer cannot accidentally
put a month-value Calendar behind a day-text field.

#### Fully customizable Calendar features
Everything else on `<Calendar>` remains directly configurable without
cluttering `DateField` with duplicate props:
- `firstDayOfWeek`
- `today`
- `month` / `onMonthChange` (to control visible pane independently of value)
- Custom day rendering via `<Calendar.Grid>`, `<Calendar.Weekdays>`, `<Calendar.Days>`, `<Calendar.Day>`
- Navigation parts: `<Calendar.Header>`, `<Calendar.PrevButton>`, `<Calendar.NextButton>`, `<Calendar.Heading>`
- Alternative drill-down views: `<Calendar.Months>`, `<Calendar.Years>`
- StyleProps and CSS classes.

#### TypeScript and bound alias
Standalone `<Calendar>` strictly requires `value` and `locale`. Inside
`<DateField.Picker>`, those props are inherited from the parent DateField.
Consumers can slot literal `<Calendar>` using Reference's bound part mechanism,
or use the thin alias `<DateField.Calendar>` where `value` and `locale` are
omitted from required props.

Prop resolution is completely deterministic:

```ts
finalInputProps = merge(
  inputDefaults,
  rootInputProps,
  explicitInputProps,
  managedMachineProps,
)
```

1. Root shorthand props (`placeholder`, `className`, `id`, `onInput`, etc.)
   seed the implicit input.
2. Explicit `DateField.Input` (or `DateField.Start` / `DateField.End`) props
   override root shorthand props.
3. Classes, styles, and refs use Reference's standard merge.
4. Authored event handlers compose and execute before internal state machine
   observations.
5. Managed value, combobox/textbox semantics, and accessibility always win.

---

## Proposed API

```ts
type ISODate = `${number}-${number}-${number}`
type ISOMonth = `${number}-${number}`

type DateRangeValue = {
  start: ISODate
  end: ISODate
} | null

type DateRangeDraft = {
  start: ISODate | null
  end: ISODate | null
}

type DateFieldManagedProp =
  | "type"
  | "role"
  | "value"
  | "defaultValue"
  | "onChange"
  | "inputMode"
  | "aria-invalid"
  | "aria-disabled"
  | "aria-readonly"
  | "aria-required"
  | "aria-valuemin"
  | "aria-valuemax"
  | "aria-valuenow"
  | "aria-valuetext"

interface DateFieldProps
  extends Omit<
    ReferencePartProps<"div">,
    DateFieldManagedProp | "children"
  > {
  children?: React.ReactNode
  value: ISODate | null
  onChange?: (value: ISODate | null) => void
  locale: string
  min?: ISODate
  max?: ISODate
  isDateUnavailable?: (date: ISODate) => boolean
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  invalid?: boolean
  name?: string
  form?: string
  placeholder?: string
}

interface DateFieldInputProps
  extends Omit<
    ReferencePartProps<"input">,
    DateFieldManagedProp
  > {}

interface DateFieldTriggerProps
  extends ReferencePartProps<"button"> {}

interface DateFieldPickerProps
  extends PopoverContentProps {
  children?: React.ReactNode
}

interface DateFieldCalendarProps
  extends Omit<
    CalendarProps,
    | "value"
    | "onChange"
    | "locale"
    | "mode"
    | "min"
    | "max"
    | "isDateUnavailable"
  > {
  min?: ISODate
  max?: ISODate
  isDateUnavailable?: (date: ISODate) => boolean
}

interface DateFieldRangeProps
  extends Omit<
    ReferencePartProps<"div">,
    DateFieldManagedProp | "children"
  > {
  children?: React.ReactNode
  value: DateRangeValue
  onChange?: (value: DateRangeValue) => void
  locale: string
  min?: ISODate
  max?: ISODate
  isDateUnavailable?: (date: ISODate) => boolean
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  invalid?: boolean
  name?: string | { start?: string; end?: string }
  form?: string
}

interface DateFieldStartProps
  extends Omit<
    ReferencePartProps<"input">,
    DateFieldManagedProp
  > {}

interface DateFieldEndProps
  extends Omit<
    ReferencePartProps<"input">,
    DateFieldManagedProp
  > {}
```

There is no `defaultValue`, uncontrolled mode, controlled text prop,
raw-text callback, parser/formatter override function, granularity,
placeholder-parts API, or polymorphic `as` prop. `DateField.onChange` is
the only date request authority. Input retains native edit, clipboard,
composition, selection, focus, and keyboard handlers so applications can
observe text without creating another store.

`ISODate` is Calendar's Gregorian domain: canonical zero-padded
`YYYY-MM-DD` in years 0001–9999. Runtime validation is the same gate as
Calendar (`CA-ISO-01`). DateField never accepts or publishes JavaScript
`Date`. Time, timezone, and instant semantics are outside its domain.

---

## Defaults

- `locale` and `value` are required. Locale has no environment-dependent
  default. `null` is the controlled empty value.
- `min` and `max` are absent. Supplied bounds must be canonical ISO dates
  and `min <= max`.
- `isDateUnavailable` is absent; every valid date in the domain is
  available.
- `disabled`, `readOnly`, `required`, and `invalid` default to `false`.
- Input defaults to `autoComplete="off"`, `autoCorrect="off"`,
  `spellCheck={false}`, and managed `inputMode="text"`. Explicit native
  `autoComplete` / `autoCorrect` / `spellCheck` win. Birthday and booking
  forms pass `autoComplete="bday"` themselves.
- `<DateField.Picker>` defaults to `placement="bottom-start"`.
- `<DateField.Trigger>` defaults to `tabIndex={-1}` and `type="button"`.

---

## Exact anatomy and managed authority

### The dual-host contract (explicit freeze)

Reference UI components generally maintain stable host element types. DateField
defines an explicit, frozen dual-host exception to deliver a brutally simple
default without trapping consumers when unfolding:

1. **Childless `<DateField />` (folded)**:
   Renders the visible `input[type=text]` directly. It has ordinary textbox
   semantics (never `role=spinbutton`, `role=combobox`, or `type=date`).
   Component ref, native input props (`placeholder`, `name`, `form`, `id`),
   and StyleProps target this `HTMLInputElement` directly. If `name` is
   supplied, it renders one managed sibling `input[type=hidden]` via Fragment.
2. **Compound `<DateField>` (with children)**:
   Renders the canonical `Field` bezel (`div[data-reference-field]`),
   coordinating:
   - `DateField.Input` (explicit or synthesized). Upgrades to `role="combobox"`
     with `aria-haspopup="dialog"`, `aria-expanded={open}`,
     `aria-controls={pickerId}`, and `aria-autocomplete="none"`. It serves as
     the primary keyboard and pointer controller.
   - `DateField.Trigger` (optional; when authored, renders an auxiliary
     `button[type=button]` opener with default `tabIndex={-1}`).
   - An anchored `Popover` layer containing `DateField.Picker` (wrapped
     `Popover.Content` with `placement="bottom-start"` by default) and an
     embedded `<Calendar>` (explicit child or synthesized day Calendar).
   Component ref and container StyleProps target the wrapper `div[data-reference-field]`,
   while input props pass to `DateField.Input` via the Part-Resolution Law.

Selecting an enabled date on the Calendar commits the value and dismisses the
popover. Typing in the field updates the shared value and grid without
auto-dismissing.

### 3. Range `<DateField.Range>`
Renders the shared `Field` bezel containing:
1. `DateField.Start` (explicit or synthesized). Combobox controller for the
   start date endpoint.
2. `DateField.End` (explicit or synthesized). Combobox controller for the
   end date endpoint.
3. `DateField.Trigger` (optional; auxiliary opener button with default `tabIndex={-1}`).
4. `DateField.Picker` containing `<Calendar mode="range">`. Deliberate
   activation of either endpoint sets `activeEndpoint` and opens the picker
   anchored to that field.

`<DateField.Range>` internally coordinates:
- Independent draft editing for start and end text buffers.
- `activeEndpoint` tracking (`start` vs `end`) with focused-field month
  synchronization (`calendarMonth`).
- Safe Calendar range mapping (`calendarValue` passes `null` when an end-only
  draft is active).
- `canApply` validity checking (chronological, in-bounds, contiguous
  availability).
- Apply / Cancel / Escape transactions on popup close and commit.

---

## Controlled value and dirty edit session

`value: ISODate | null` is durable application state. Each text input owns a
transient text buffer and a separate dirty-session flag. A user edit starts the
dirty session even when the resulting string equals formatted controlled text.
`data-editing` reflects that flag, not string inequality.

Partial values such as `3/`, `31/0`, `2024-`, a temporarily empty segment, or
a missing locale literal remain visible without publishing an invalid date. A
complete valid edit requests `onChange`. Empty input requests `null`. Invalid
or incomplete text emits no date request.

Blur and Enter are commit boundaries. Complete candidates retry if different
from current prop; incomplete or invalid entries revert to the formatted
controlled value.

Input consumer handlers run before matching edit, key, paste, and blur
defaults. `preventDefault()` on the composed blur boundary cancels commit and
leaves the dirty buffer intact while unfocused; refocusing resumes the same
session. Noncancelable native `input` events are observations, not retroactive
vetoes.

Starting composition suspends parsing, stepping, and commit. A programmatic
`value` or `locale` change during composition invalidates that session,
replaces text from latest controlled state, and ignores stale
`compositionend` fallout. Synthetic DOM composition is automated; real OS IME
is a manual release gate.

---

## Parsing and formatting

`Intl.DateTimeFormat(locale, { year: "numeric", month: "numeric", day: "numeric" })`
and `formatToParts` define segment **order**, separators, and optional
literals. DateField does not guess between `en-GB` day/month/year and
`en-US` month/day/year. `01/02/2024` is 1 February in `en-GB` and January
2 in `en-US`.

Display after an accepted value uses that locale grammar, including
literals such as Japanese `年` / `月` / `日`. While typing, literals and
leading zeros may be absent. Conflicting literals, a second decimal
numbering system, time/zone suffixes, and malformed internal punctuation
are rejected.

ASCII digits may mix with the active locale's one supported decimal digit
set, same rule as NumberField. Mixing two non-ASCII digit scripts is
rejected.

Two-digit years are incomplete. There is no 100-year window and no
`24 → 2024` guess. Year must be four digits in 0001–9999 before a value
is complete.

A complete canonical `YYYY-MM-DD` string is accepted as unambiguous
interchange regardless of locale. Unpadded, spaced, or timed ISO-like
text is not that interchange form; it either matches the active locale
grammar or is rejected. JS `Date` overflow is not used: `2024-04-31` and
`31/04/2024` are impossible, not 1 May.

Out-of-range and unavailable complete dates do not clamp. They stay in
the buffer until commit, then revert, and they never request `onChange`.
A programmatic value outside min/max or marked unavailable still displays
and exposes managed invalid; DateField does not rewrite parent state.

---

## Caret-aware segment stepping

Unprevented ArrowUp / ArrowDown increment or decrement the numeric
segment that contains the caret (day, month, or year) by one. Shift uses
a fixed coarse delta of 10 of that same segment. Horizontal arrows,
Home/End, and editing shortcuts remain native.

Carry uses Calendar's Gregorian constrain, not JavaScript `Date`:

- day overflow moves to the next/previous month
- month overflow preserves day when possible, otherwise clamps to the
  last valid day (`2024-01-31` + 1 month → `2024-02-29`)
- year overflow preserves month/day with the same leap constrain
  (`2024-02-29` + 1 year → `2025-02-28`)
- underflow below `0001-01-01` or overflow above `9999-12-31` is a no-op

Stepping is a commit boundary: it requests only the final ISO date and
ends the dirty session by formatting accepted or rejected controlled
state. From `null` or incomplete text, ArrowUp/Down are no-ops — DateField
does not invent `today` (that would be timezone-dependent and SSR-unsafe).
Disabled and read-only DateFields do not step.

Caret on a literal/separator uses the nearest preceding numeric segment,
or the following one at the start of the field.

This is why DateField is a component rather than application parse code:
locale parts, caret mapping, and Gregorian carry are one invariant.
Segment spinbuttons stay leave.

---

## Validity, forms, submit, and reset

The visible host is text, so native `rangeUnderflow` / `rangeOverflow`
always remain false. DateField represents date constraints through
managed `aria-invalid` / `data-invalid` and form-submit prevention. It
never calls `setCustomValidity` for those constraints.

Native `required` retains platform `valueMissing`. An application message
set with `input.setCustomValidity()` is wholly application-owned.
`invalid` is an ARIA/style signal and does not block submission by
itself.

The hidden form value is `""` for `null` and the canonical ISO string
otherwise. Disabled fields are omitted. Read-only fields suppress
interaction and date-constraint submit blocking but serialize controlled
canonical state.

Submit, failed-boundary, and reset rules match NumberField: every dirty
DateField observes each `requestSubmit()`, a failed blur/Enter boundary
blocks until a documented resolution, and `HTMLFormElement.submit()` is
outside the guarantee. Reset never changes the controlled ISO value.

---

## Observable state and environments

The visible DateField input exposes `data-disabled`, `data-readonly`,
`data-required`, `data-invalid`, `data-empty`, and `data-editing` when
true. `data-empty` follows visible text during a dirty session and
controlled `null` otherwise. Managed invalid is the union of application
`invalid`, constraint failures, and failed boundary state. An uncommitted
partial is not invalid until a commit/submit boundary.

Direction is inherited from DOM and changes caret presentation, not
segment order. Segment order is locale `formatToParts`. Lookup, listeners,
and same-tree form work are scoped to the owning root/document or open
ShadowRoot.

Localized SSR text is byte-identical only within the supported
server/client Intl/ICU matrix. Generated IDs are unique within one React
root.

The dirty buffer is local interaction state, not a Zustand store.

---

## Problems we own

### Brutally simple defaults that unfold cleanly

The consumer should never have to reconstruct `Popover + Field + Trigger + Calendar`
just to put a date picker on screen. Folded `<DateField><DateField.Picker /></DateField>`
is the complete standard picker. Unfolding `<DateField.Input>`,
`<DateField.Trigger>`, or `<DateField.Picker>` provides full control over
every part without leaving the DateField system.

### Range without discriminated union pollution

Range requires two inputs, `{ start, end }` value objects, draft transactions,
and start/end form names. Placing range on `<DateField.Range>` isolates those
types cleanly and keeps scalar `<DateField>` atomic and focused.

### Caret-aware Gregorian stepping

Single textboxes understand which segment the caret is in (day, month, year)
and apply Gregorian leap/month carry without JS `Date` rollover bugs.

### APG Date Picker Combobox contract without runtime lock-in

Slotted `<DateField.Picker>` upgrades the input to `role="combobox"` and handles
dialog placement and dismissal, while `<Calendar>` retains its full 2D roving
grid engine. Neither layer locks out the other.

---

## Ecosystem comparison

**Vendor.** React Aria `DateField` / `DatePicker` / `HiddenDateInput`
(`vendor/react-spectrum/packages/react-aria-components`). Stately
`useDateFieldState`. `@internationalized/date` `parseDate` / Gregorian
queries. Zag `date-input` / `date-picker` (segment machines, ISO parse).
react-day-picker has no field.

**Lift** locale `formatToParts` order, partial/incomplete segments,
Gregorian constrain, hidden canonical serialization, form/required
evidence, APG combobox contract, and DatePicker-as-fold. **Leave**
`DateSegment` spinbuttons, `CalendarDate` objects, `granularity`, time
fields, `createCalendar` non-Gregorian, placeholder-part chrome, `Date`
parsing, I18nProvider locale default, and a packaged monolithic DatePicker.

---

## Deliberately left

- Segment spinbuttons (`DateField.Segment`). DateField is one textbox per date.
- `JavaScript Date` objects. Public state is Gregorian ISO strings.
- Time, timezone, granularity, and `input[type=datetime-local]`.
- Non-Gregorian calendar systems.
- Natural-language parsing ("next Tuesday").
- Two-digit year century windows (`24 → 2024`).
- Clamping to min/max.
- Aria placeholder-part chrome.
- Packaged visual dropdowns with fixed, un-unfoldable DOM.

---

## Convergence

Reference UI converges on:
1. `<DateField />` — one atomic textbox (childless).
2. `<DateField><DateField.Picker /></DateField>` — standard date picker (compound).
3. `<DateField.Range><DateField.Picker /></DateField.Range>` — standard range picker.
4. Part-resolution law for deterministic prop merge across folded and unfolded parts.
5. Slotted `<Calendar>` progressive disclosure with managed invariants and full grid customization.

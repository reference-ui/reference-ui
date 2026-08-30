# DateField

Proof: [TESTS.md](./TESTS.md).

Locale-aware editing of one date-only value. DateField owns the boundary
between an ephemeral localized edit string and one controlled ISO calendar
date.

It does not own popup behaviour or calendar presentation. A Calendar is
composed by sharing the same controlled value. Popover remains the layer.
Native `input[type=date]` is not the host: its chrome, locale display,
partial-edit, and popup behaviour vary by browser and cannot share an ISO
value with Calendar without fighting the picker.

```tsx
<DateField
  value={date}
  onChange={setDate}
  locale="en-GB"
  name="birthday"
>
  <Label htmlFor="birthday-input">Birthday</Label>
  <DateField.Input id="birthday-input" />
</DateField>
```

DatePicker is the composition, not a primitive:

```tsx
<DateField
  value={date}
  onChange={setDate}
  locale="en-GB"
  min={min}
  max={max}
  isDateUnavailable={isUnavailable}
>
  <Label htmlFor="start-input">Start date</Label>
  <DateField.Input id="start-input" />
  <Popover
    open={open}
    onOpen={() => setOpen(true)}
    onDismiss={() => setOpen(false)}
  >
    <Popover.Trigger aria-label="Open calendar">
      Open
    </Popover.Trigger>
    <Popover.Content>
      <Calendar
        month={month}
        onMonthChange={setMonth}
        value={date}
        onChange={setDate}
        locale="en-GB"
        min={min}
        max={max}
        isDateUnavailable={isUnavailable}
      />
    </Popover.Content>
  </Popover>
</DateField>
```

Calendar does not register with DateField. DateField does not open, place,
or dismiss Popover. Shared `value` / `onChange` / `locale` / bounds /
availability is the entire integration contract.

## Proposed API

```ts
type ISODate = `${number}-${number}-${number}`

interface DateFieldProps
  extends Omit<
    ReferencePartProps<"div">,
    "onChange" | "defaultValue"
  > {
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
}

type DateFieldManagedInputProp =
  | "type"
  | "value"
  | "defaultValue"
  | "inputMode"
  | "name"
  | "form"
  | "min"
  | "max"
  | "disabled"
  | "readOnly"
  | "required"
  | "aria-invalid"
  | "aria-disabled"
  | "aria-readonly"
  | "aria-required"

interface DateFieldInputProps
  extends Omit<
    ReferencePartProps<"input">,
    DateFieldManagedInputProp
  > {}
```

There is no `DateField.Root`, `DateField.Segment`, `DateField.Group`,
`defaultValue`, uncontrolled mode, controlled text prop, raw-text callback,
parser/formatter function, granularity, placeholder-parts API, or
polymorphic `as` prop. `DateField.onChange` is the only date request
authority. Input retains native edit, clipboard, composition, selection,
focus, and keyboard handlers so applications can observe text without
creating another store.

`ISODate` is Calendar's Gregorian domain: canonical zero-padded
`YYYY-MM-DD` in years 0001–9999. Runtime validation is the same gate as
Calendar (`CA-ISO-01`). DateField never accepts or publishes JavaScript
`Date`. Time, timezone, and instant semantics are outside its domain.

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

## Exact anatomy and managed authority

`DateField` renders `div`. It requires exactly one `DateField.Input`.
Other authored children are allowed, including labels, Popover, and
Calendar. Only the named Input part registers for editing behaviour.
DateField adds no visible wrapper around authored children.

Visual `Field` may wrap `DateField.Input` for prefixes, suffixes, or a
calendar `Popover.Trigger`. DateField still owns the dirty session; Field
owns chrome. That bezel is the same recipe NumberField.Group consumes.

`DateField.Input` renders the one visible and focusable
`input[type=text]` with ordinary textbox semantics. It never receives
`role=spinbutton`, `type=date`, or date `aria-value*`. React Aria and Zag
DateField expose per-segment spinbuttons; that APG is leave. One textbox
matches NumberField's VoiceOver contract and keeps DatePicker chrome in
application JSX.

Input owns a stable ID unless an explicit `id` is supplied. DateField and
Input are fixed-host generated primitives with their documented native
props, complete StyleProps, and matching refs. Managed props listed above
are absent from public part types and win against runtime spreads or casts.

When `name` is supplied, DateField generates exactly one direct
`input[type=hidden]` after its authored children. It has no public part or
ref. It carries `name`, `form`, canonical ISO or `""` for `null`, and
disabled state. No hidden `input[type=date]` exists; Aria's autofill host
is contrast. Visible `autoComplete` remains the autofill seam.

## Controlled value and dirty edit session

`value: ISODate | null` is durable application state. Input owns a
transient text buffer and a separate dirty-session flag. A user edit
starts the dirty session even when the resulting string equals formatted
controlled text. `data-editing` reflects that flag, not string inequality.

Partial values such as `3/`, `31/0`, `2024-`, a temporarily empty
segment, or a missing locale literal remain visible without publishing an
invalid date. A complete valid edit requests `onChange` unless it repeats
the latest live candidate. Empty input requests `null` once. Invalid or
incomplete text emits no date request.

An echo matching the latest requested ISO or null candidate is accepted
without replacing the authored buffer or clearing `data-editing`.
Out-of-order echoes and unrelated programmatic `value` changes replace
text and selection from the latest controlled prop, end the dirty
session, and clear any failed boundary. Calendar selection is this
programmatic path: it reformats the input and does not go through the
parser. Authoritative locale or constraint changes also clear a failed
boundary after recomputing state. Programmatic changes emit no callback.

Blur and Enter are commit boundaries. A complete candidate retries
whenever it differs from the current controlled prop, even if it was
already requested while typing. Empty commits `null`. Impossible,
incomplete, out-of-range, unavailable, or otherwise rejected dates revert
to the formatted controlled value without a date request and expose
managed invalid state.

Input consumer handlers run before matching edit, key, paste, and blur
defaults. `preventDefault()` on the composed blur boundary cancels commit
and leaves the dirty buffer intact while unfocused; refocusing resumes
the same session. Noncancelable native `input` events are observations,
not retroactive vetoes.

Starting composition suspends parsing, stepping, and commit. A
programmatic `value` or `locale` change during composition invalidates
that session, replaces text from latest controlled state, and ignores
stale `compositionend` fallout. Synthetic DOM composition is automated;
real OS IME is a manual release gate.

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
Disabled and read-only Inputs do not step.

Caret on a literal/separator uses the nearest preceding numeric segment,
or the following one at the start of the field.

This is why DateField is a component rather than application parse code:
locale parts, caret mapping, and Gregorian carry are one invariant.
Segment spinbuttons stay leave.

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

## Observable state and environments

DateField and Input expose `data-disabled`, `data-readonly`,
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

### Localized partial editing without a second date value

The dirty buffer is short-lived interaction state. Public Input events
expose it; only `DateField.onChange` requests durable ISO state.

### Locale order without guessing

`01/02/2024` is not a universal date. Intl parts are the grammar. Dual
acceptance of locale text and canonical ISO interchange is explicit, not
heuristic.

### Impossible dates without `Date` overflow

April 31, 29 February on a non-leap year, and JS local-time rollover are
the usual bugs. The Calendar ISO gate is the only calendar math.

### Caret-aware Gregorian stepping

Aria/Zag own this by focusing spinbutton segments. A single textbox still
has to know which part the caret is in and how month/leap carry works.

### Calendar composition without a DatePicker runtime

Selecting a day must reformat the field. Typing a day must update the
grid. Neither owner may wrap the other.

**Vendor.** React Aria `DateField` / `DatePicker` / `HiddenDateInput`
(`vendor/react-spectrum/packages/react-aria-components`). Stately
`useDateFieldState`. `@internationalized/date` `parseDate` / Gregorian
queries. Zag `date-input` / `date-picker` (segment machines, ISO parse).
react-day-picker has no field.

**Lift** locale `formatToParts` order, partial/incomplete segments,
Gregorian constrain, hidden canonical serialization, form/required
evidence, and DatePicker-as-composition. **Leave** `DateSegment`
spinbuttons, `CalendarDate` objects, `granularity`, time fields,
`createCalendar` non-Gregorian, placeholder-part chrome, `Date` parsing,
I18nProvider locale default, and a packaged DatePicker.

---

## Deliberately left

- Date ranges. DateRangePicker is two DateFields plus Calendar
  `selection="range"`, or application state. Not this primitive.
- Time, timezone, granularity, and `input[type=datetime-local]`.
- Non-Gregorian calendar systems.
- Natural-language parsing ("next Tuesday").
- Two-digit year windows.
- Clamping to min/max.
- Segment spinbuttons, `DateField.Segment`, and Aria placeholder parts.
- Popup and Calendar lifecycle.
- Uncontrolled values, `JavaScript Date`, parser/formatter overrides.
- A packaged `DatePicker` component.

DatePicker remains a tested composition of DateField, Popover, and
Calendar.

## Convergence

NumberField supplies the dirty-buffer / commit / form / composition
contract. Calendar supplies the ISO/Gregorian gate and constrain math.
React Aria DateField supplies locale-part and hidden-input evidence as
contrast for segments. Zag date-input supplies incomplete-segment
contrast. Reference UI converges on one controlled textbox, locale-ordered
numeric grammar, caret-aware stepping, and ISO out.

# Field

Proof: [TESTS.md](./TESTS.md).

The visual bezel around a form control. Field owns chrome: background,
radius, spacing, prefix/suffix layout, and the visible focus ring.
The enclosed control owns semantics: label, `aria-invalid`, descriptions,
disabled, and read-only.

Field is a wrapping `div` because wrapping inputs in a box is an
unavoidable layout tradition. It is not a form provider, not a label, and
not a second validity owner. Generated Input, Textarea, and Select recipes
recognize a Field ancestor and surrender standalone chrome through CSS.
Field then reacts to state that already exists on the control.
`NumberField.Group` consumes this same recipe on `div[role="group"]`.

```tsx
<Label htmlFor="amount">Amount</Label>

<Field>
  <span aria-hidden="true">£</span>

  <Input
    id="amount"
    aria-invalid={invalid}
    aria-describedby={invalid ? "amount-error" : undefined}
  />

  <Button type="button" aria-label="Clear amount">
    ×
  </Button>
</Field>

{invalid ? <P id="amount-error">Enter an amount.</P> : null}
```

DateField uses the same bezel around `DateField.Input` and a calendar trigger.
`Popover.Trigger` is a named Button inside Field; `Popover.Content` portals
and is not bezel content.

```tsx
<DateField value={date} onChange={setDate} locale="en-GB">
  <Label htmlFor="start-input">Start date</Label>
  <Popover
    open={open}
    onOpen={() => setOpen(true)}
    onDismiss={() => setOpen(false)}
  >
    <Field>
      <DateField.Input id="start-input" />
      <Popover.Trigger aria-label="Open calendar">
        Open
      </Popover.Trigger>
    </Field>
    <Popover.Content>
      <Calendar
        month={month}
        onMonthChange={setMonth}
        value={date}
        onChange={setDate}
        locale="en-GB"
      />
    </Popover.Content>
  </Popover>
</DateField>
```

A Combobox token picker is the same bezel with more siblings. Combobox still
renders no node, so Field is a Combobox child wrapping `Combobox.Input`.
`Combobox.Popover` stays a sibling of Field — the list is not bezel content.
The chevron is an application `Button`, not `Combobox.Trigger`: Input XOR
Trigger still holds. Chips are named Buttons from application token state;
Combobox `onChange` stays one scalar commit.

```tsx
<Label htmlFor="people">People</Label>

<Combobox
  open={open}
  onOpen={() => setOpen(true)}
  onDismiss={() => setOpen(false)}
  value={value}
  onChange={commitPerson}
  inputValue={query}
  onInputValueChange={setQuery}
>
  <Field>
    <Combobox.Input id="people" />

    <Button
      type="button"
      aria-label="Open suggestions"
      onClick={openSuggestions}
    >
      <ChevronDownIcon />
    </Button>

    <Div>
      {selectedPeople.map((person) => (
        <Button
          key={person.id}
          type="button"
          onClick={() => remove(person.id)}
          aria-label={`Remove ${person.name}`}
        >
          {person.name}
          <Span aria-hidden="true">×</Span>
        </Button>
      ))}
    </Div>
  </Field>

  <Combobox.Popover>
    <Listbox>{/* options */}</Listbox>
  </Combobox.Popover>
</Combobox>
```

`openSuggestions` focuses `Combobox.Input` and requests `onOpen`. Combobox
does not listen to sibling buttons. `commitPerson` appends into
`selectedPeople`; removal never goes through Combobox. `RovingFocus` on the
chip `Div` is optional when the token row should be one tab stop.

`<Label htmlFor>` targets the labelable input, as HTML defines. `aria-invalid`
and descriptions belong on the input. The clear button, chevron, and chips
keep native button semantics and their own accessible names. Decorative
prefixes and the chip × may be `aria-hidden`; if the prefix is information,
put it in the label or description instead.

## Proposed API

```ts
type FieldStatus = "warning"

interface FieldProps
  extends Omit<
    ReferencePartProps<"div">,
    | "role"
    | "aria-invalid"
    | "aria-disabled"
    | "aria-readonly"
    | "aria-required"
    | "aria-errormessage"
  > {
  status?: FieldStatus
}
```

`Field` renders `div`. There is no Field.Label, Field.Control, Field.Addon,
Field.Chip, or Field.Error. Children are ordinary layout: prefixes, the
control, suffixes, action buttons, chip rows.

Omitted `status` is unset. `status="warning"` is the only Field-owned visual
state, because warning has no native ARIA equivalent. Error, disabled, and
read-only are never props on Field.

`role` is omitted from the public type and absent at runtime. `role="group"`
belongs on specialized compositions that genuinely group controls
(`NumberField.Group`), not on every bezel. Group is a Field-surface host:
it consumes this recipe on its own `div[role="group"]` rather than nesting
`<Field>`. See [NumberField.md](../NumberField/NumberField.md).

Field has no Zustand store, no React context, and no subscription to the
enclosed control. The generated `div` plus CSS is the whole runtime.

## Field-surface recipe

Field defines the canonical input bezel. Any Field-surface host sets
`data-reference-field` and uses this recipe once. There are not two
copied defaults.

Hosts today:

- `Field` — wrapping `div`, no `role`. State from `:has()` against the
  enclosed control. `status="warning"` is the only host-owned visual state.
- `NumberField.Group` — wrapping `div[role="group"]`. State from Group's
  managed `data-focus-visible`, `data-disabled`, `data-readonly`, and
  `data-invalid`. `status="warning"` is the same visual prop as Field.

NumberField.Input is therefore embedded because it is a descendant of a
Field-surface host, not because an application wraps NumberField in Field.
Local StyleProps on the host override the shared baseline (padding, radius,
gap, background) without forking the recipe.

```css
[data-reference-field] {
  /* shared bezel: background, radius, spacing, gap */
}

[data-reference-field] :is(input, textarea, select) {
  /* embedded / bare: no standalone border, background, shadow, or focus ring */
}

[data-reference-field]:has(:is(input, textarea, select):focus-visible),
[data-reference-field][data-focus-visible] {
  /* bezel focus indicator — same declarations */
}

[data-reference-field]:has([aria-invalid="true"]),
[data-reference-field][data-invalid] {
  /* invalid bezel — same declarations */
}

[data-reference-field]:has(:is(input, textarea, select):disabled),
[data-reference-field][data-disabled] {
  /* disabled bezel — same declarations */
}

[data-reference-field]:has(:is(input, textarea)[readonly]),
[data-reference-field][data-readonly] {
  /* read-only bezel — same declarations */
}

[data-reference-field][data-status="warning"] {
  /* warning bezel; does not set aria-invalid */
}
```

Field does **not** copy `aria-invalid`, `disabled`, or `readOnly` onto
itself. Group does publish managed `data-*` because NumberField already
owns those states. Both paths must paint the same tokens. Group
`data-focused` (pointer focus without `:focus-visible`) must not apply the
focus-visible ring; that keeps mouse-focus on Group identical to Field.

Embedded mode targets descendant `input`, `textarea`, and `select` — the
hosts of generated `Input` / `Textarea` / `Select` and of
`NumberField.Input`, `DateField.Input`, and `Combobox.Input`. A sibling
`Button` is not a form control: it keeps its own chrome and focus ring.
A disabled clear button or stepper must not make the bezel look disabled.

Author Field around `Input` / `Textarea` / `Select`, or around
`DateField.Input` / `Combobox.Input` as children of those widgets.
`Combobox.Popover` is not a Field child. Do not wrap `NumberField.Group`
in Field and do not insert Field between Group and Input. Group already
is the bezel.

`:has(:focus-visible)` on the field is too broad (it would ring when a
clear button, chip, or stepper is focused). Focus chrome follows
`:has(:is(input, textarea, select):focus-visible)` on Field and
`[data-focus-visible]` on Group.

An `Input` that is not a descendant of a Field-surface host keeps its
standalone recipe. Do not nest Field inside Field.

Default layout is a horizontal flex row with aligned children and gap.
A wrapping chip row is StyleProps (`flexWrap`) on Field or a nested
`Div`, not a Field.Tokens part. StyleProps on a Field-surface host
override padding, radius, gap, and background. They do not restyle the
enclosed control's typography; that stays on the control.

## What Field does not do

- Associate labels. Use `htmlFor` / wrapping `<label>`.
- Publish or sync `aria-invalid`.
- Own `onChange`, values, or form serialization.
- Wrap NumberField.Group. Group is the grouping owner; wrapping both
  produces two bezels.
- Provide a public Form/Field React context.
- Own tokens, Combobox open state, or a chevron Trigger. Those stay
  Combobox + application Buttons.

---

## Problems we own

### Double chrome

Agents wrap `Input` in a `Div` for prefixes and keep the Input border.
Field exists so the descendant recipe turns off that chrome exactly when
the ancestor is Field. The selector is the invariant; a Context flag
would let bezel and input disagree if the flag drifted.

**Vendor.** Base UI / React Aria `Field` are form-wiring providers
(label, description, error context). **Leave.** This component is visual
only.

### Bezel vs control state disagreement

If Field took `invalid` as a prop, the bezel could show error while the
input did not, or the reverse. `:has([aria-invalid="true"])` makes
disagreement a CSS impossibility without a second state owner.

### Warning

`aria-invalid` is boolean. Warning is product chrome. `status="warning"`
is the explicit exception and never implies invalid for AT.

### NumberField.Group

Group is a Field-surface host, not a nested `<Field>`. It renders
`div[role="group"][data-reference-field]` and consumes this recipe.
NumberField.Input embeds because of that ancestor. Wrapping Group in
Field produces two bezels. Inserting Field between Group and Input
breaks Group's direct-Input rule. Prefixes and extra buttons may be
Group siblings, the same as Field children. StyleProps on Group override
the shared baseline; they must not fork a second recipe.

### Token picker

Field, Combobox, and chips meet in one tree without a new primitive.
Field owns the bezel. `Combobox.Input` is the labelable focus source.
Sibling Buttons (opener, remove) keep native names and their own rings —
that is why bezel focus is `:has(input:focus-visible)`, not
`:focus-within`. Combobox stays scalar; the chip array is application
state. Promoting the chevron to `Combobox.Trigger` would violate Input
XOR Trigger. A `Field.Chip` part would copy Button for no new invariant.

---

## Deliberately left

- `Field.Label`, `Field.Error`, implicit `aria-describedby` wiring.
- A public Form/Field provider.
- `role="group"` on Field.
- Copying control state into `data-invalid` / `data-disabled` on Field.
- Checkbox, radio, and Switch as embedded Field controls. Those are not
  text-field bezels.
- `Field.Chip`, `Combobox.Chips`, or treating a sibling opener as
  `Combobox.Trigger`.

## Convergence

HTML labeling and ARIA on the control. One Field-surface recipe for Field
and NumberField.Group. Token pickers compose Field + Combobox + Buttons.
No vendor Field provider. No CurrencyField / TagField / SearchField
catalogue.

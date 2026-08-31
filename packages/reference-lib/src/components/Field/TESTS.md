# Field test contract

Playwright: `matrix/lib/tests/e2e/field.spec.ts`  
Page: `/field`

Field owns the visual bezel. Enclosed `input` / `textarea` / `select`
nodes own semantics. Proof is public DOM plus computed chrome: Field
must not become a React state owner for invalid, disabled, or focus.

This contract defines **16 tagged `FI-*` behavior cases** plus **4
composition gates**.

## Freeze decisions

1. Field renders `div` with `data-reference-field` and no `role`.
2. `role`, `aria-invalid`, `aria-disabled`, `aria-readonly`,
   `aria-required`, and `aria-errormessage` are not public props.
3. `status="warning"` is the only Field-owned visual state
   (`data-status="warning"`). Error/disabled/read-only/focus are CSS
   `:has()` against the enclosed control.
4. Descendant `input, textarea, select` enter embedded mode (no
   standalone border, background, shadow, or focus ring). Sibling
   buttons do not.
5. Bezel focus uses
   `:has(:is(input, textarea, select):focus-visible)`, not
   `:focus-within`.
6. Disabled bezel uses `:has(:is(input, textarea, select):disabled)`,
   not `:has(:disabled)`.
7. Labels stay `htmlFor` on the control. Field does not wire ARIA.
8. `NumberField.Group` is a Field-surface host: same
   `data-reference-field` recipe, own `role="group"`, no nested
   `<Field>`. Group state attributes paint the same bezel tokens Field
   reaches through `:has()`.

## Source evidence

- HTML labelable elements / `htmlFor` — the control is the label target.
- WAI-ARIA: `aria-invalid` and descriptions on the input; buttons keep
  their own accessible name; `role="group"` only when grouping is real.
- Base UI / React Aria Field providers — **contrast / leave**. They own
  label and error context; this Field does not.

## Universal part conformance

Shared `PART-*` cases apply to the single `div` host. Field-specific
cases cover the omitted ARIA surface, `status`, and descendant chrome.

## Required cases

### DOM and types

- [ ] `FI-DOM-01` `[reference]` `[browser]` —
  **Field should render a wrapping div with no role and
  `data-reference-field`.**
  Mount Field around an Input. Assert one `div[data-reference-field]`,
  no `role`, and that authored children stay in order.
- [ ] `FI-DOM-02` `[reference]` `[browser]` —
  **Field should not receive ARIA validity when the enclosed input is
  invalid.**
  Set `aria-invalid="true"` on Input. Assert Field has no `aria-invalid`,
  `aria-errormessage`, or copied `data-invalid`.
- [ ] `FI-DOM-03` `[reference]` `[browser]` —
  **Field should set `data-status="warning"` only when `status` is
  warning.**
  Parameterize omitted `status` and `status="warning"`. Assert the
  attribute is absent, then exactly `warning`. Field still has no
  `aria-invalid`.
- [ ] `FI-TYPE-01` `[reference]` `[unit]` —
  **Field should omit role and validity ARIA from its public type.**
  Compile Field with StyleProps and `status="warning"`. Assert
  `@ts-expect-error` for `role="group"`, `aria-invalid`,
  `aria-disabled`, `aria-readonly`, `aria-required`,
  `aria-errormessage`, and `status="error"`.

### Embedded chrome

- [ ] `FI-CSS-01` `[reference]` `[browser]` —
  **Field should put a descendant Input into embedded mode.**
  Compare a standalone `Input` with the same `Input` inside Field.
  Assert the nested control loses standalone border, background,
  box-shadow, and outline/focus ring, while the Field bezel carries
  those surfaces.
- [ ] `FI-CSS-02` `[reference]` `[browser]` —
  **Field should leave a sibling Input outside Field fully chromed.**
  Mount Field+Input and a second Input as a sibling of Field. Assert
  only the descendant is embedded.
- [ ] `FI-CSS-03` `[reference]` `[browser]` —
  **Field should embed Textarea and Select with the same descendant
  selector.**
  Repeat `FI-CSS-01` for `Textarea` and `Select`. Assert tag-based
  embedding, not a React context flag.
- [ ] `FI-CSS-04` `[reference]` `[browser]` —
  **Field-surface hosts should embed DateField, Combobox.Input,
  and NumberField.Input.**
  Wrap Field around atomic DateField and around `Combobox.Input` as a
  Combobox child. Mount NumberField with Group and Input and no Field.
  Assert each named Input is a descendant `input` in embedded mode.
  NumberField.Input embeds because Group is a Field-surface host.

### Bezel state from the control

- [ ] `FI-CSS-05` `[reference]` `[browser]` —
  **Field should show the focus indicator when the enclosed control is
  `:focus-visible`.**
  Tab to Input inside Field. Assert the visible ring is on Field, not
  on Input.
- [ ] `FI-CSS-06` `[reference]` `[browser]` —
  **Field should not take the bezel focus ring when a nested Button is
  focused.**
  Tab to a clear `Button` inside Field while Input is not focused.
  Assert the button keeps its own focus chrome and Field does not
  apply the input-focus bezel.
- [ ] `FI-CSS-07` `[reference]` `[browser]` —
  **Field should match invalid chrome through
  `:has([aria-invalid="true"])`.**
  Toggle `aria-invalid` on Input only. Assert Field's invalid border
  follows the attribute with no Field re-render contract beyond the
  input prop change.
- [ ] `FI-CSS-08` `[reference]` `[browser]` —
  **Field should match disabled chrome from the enclosed control, not a
  nested Button.**
  Disable Input in one fixture and only the clear Button in another.
  Assert the bezel looks disabled only when the input is disabled.
- [ ] `FI-CSS-09` `[reference]` `[browser]` —
  **Field should match read-only chrome from `[readonly]` on the
  enclosed input.**
  Set `readOnly` on Input. Assert the bezel read-only surface. A
  button with `aria-readonly` must not trigger it.
- [ ] `FI-CSS-10` `[reference]` `[browser]` —
  **Field should show warning chrome from `data-status` without
  implying invalid.**
  `status="warning"` with a valid Input. Assert warning bezel, no
  `aria-invalid` on Field or Input, and that adding `aria-invalid` on
  Input can stack invalid chrome without clearing warning.

### Shared surface

- [ ] `FI-SURF-01` `[reference]` `[browser]` —
  **Field-surface hosts should share one bezel recipe across the
  documented compositions.**
  Mount four fixtures and compare computed host chrome (border, radius,
  background, gap, box-shadow/outline) in default, `:focus-visible` /
  `data-focus-visible`, invalid, `status="warning"`, disabled, and
  read-only: (1) Field + currency prefix + Input + clear Button;
  (2) Field + DateField + calendar `Popover.Trigger`;
  (3) Field + Combobox.Input + opener/chip Buttons on another row;
  (4) NumberField.Group + Decrement + Input + Increment, no `<Field>`.
  Assert identical presentation per state, one `data-reference-field`
  host each, no extra wrapper on Group, Group keeps `role="group"`,
  and StyleProps on Group change padding/radius without changing role
  or forking tokens for the other states.

### Layout

- [ ] `FI-LAY-01` `[reference]` `[browser]` —
  **Field should arrange prefix, control, and action in authored
  order.**
  Mount the amount example (decorative £, Input, clear Button). Assert
  one row, source order, and that the button remains a native
  `button` with its accessible name.

## Composition gates

- [ ] `FI-COMP-01` `[reference]` `[browser]` —
  **Field should keep Label `htmlFor` on the input in the amount
  composition.**
  The documented Amount example plus an error `P` referenced by
  `aria-describedby`. Assert the label's `htmlFor` matches Input `id`,
  Field has no role, and AT-relevant attributes live on Input.
- [ ] `FI-COMP-02` `[reference]` `[browser]` —
  **Field should embed atomic DateField or host DateField bezel without owning its state.**
  Mount `<DateField><DateField.Trigger aria-label="Open">📅</DateField.Trigger><DateField.Picker /></DateField>`.
  Assert the Field surface bezel wraps the input and trigger button, Calendar stays
  inside the portalled Popover layer, typing and picking work seamlessly, and
  ISO `onChange` is published without Field adding state.
- [ ] `FI-COMP-03` `[reference]` `[browser]` —
  **NumberField.Group should consume the Field recipe without a nested
  Field.**
  NumberField with Group, steppers, and Input, no Field. Assert Group is
  `div[role="group"][data-reference-field]`, Input is embedded, and no
  `Field` node exists. A second fixture wrapping Group in Field is
  allowed to look like two bezels; that is application error, not a
  Field API to merge them. Visual identity with Field is `FI-SURF-01`.
- [ ] `FI-COMP-04` `[reference]` `[browser]` —
  **Field should host a Combobox token picker without owning Combobox
  or chips.**
  Mount the documented People composition: Label `htmlFor="people"`,
  Combobox wrapping Field (`Combobox.Input`, opener `Button`, chip
  `Button`s) plus a sibling `Combobox.Popover` / Listbox. Assert Input
  is embedded and the labelable control; Field has no role; the opener
  is `button[type=button]`, not `Combobox.Trigger`; chips are named
  native buttons. Click the opener after the documented
  focus-then-`onOpen` handler: Input is `document.activeElement`,
  Combobox opens, and the list is not a Field descendant in the
  document (Popover portals). Tab to the opener and a chip: Field does
  not take the input-focus bezel. Commit an option: one scalar
  Combobox `onChange`, application chips update, Combobox renders no
  token nodes. Remove a chip: Combobox `onChange` is not called.
  `aria-invalid` on Input still drives the bezel; a chip Button must
  not. Input plus `Combobox.Trigger` in the same Combobox remains the
  existing XOR diagnostic.

## Owned elsewhere

- NumberField.Group `role="group"`, stepper naming, and managed
  `data-*` state: `NumberField`. This file owns the shared recipe and
  `FI-SURF-01` / `FI-COMP-03`.
- Date/number dirty sessions: `DateField` / `NumberField`. `DateField.Range`
  coordinates two inputs in one Field surface bezel (`DF-COMP-05`); this file
  owns only the shared bezel.
- Combobox Input XOR Trigger, scalar commit, focus-in-input, Popover
  portal: `Combobox`. This file proves only the Field bezel around that
  tree (`FI-COMP-04`).
- Form submit/hidden inputs: those field components, not Field.
- Transparent-part merge: `ReferenceSlotPartProps` in `components.md`.
- Chip-row composite keyboard: `RovingFocus`, optional.

## Out of scope

- Field.Label / Field.Error parts, Form provider, implicit label
  association, `role="group"` on Field, checkbox/radio/Switch bezels,
  copying control state into Field data attributes, nested Field,
  `Field.Chip`, Combobox.Chips, opener-as-Trigger.

# NumberField

Proof: [TESTS.md](./TESTS.md).

Locale-aware numeric text editing and discrete stepping. NumberField owns the
hard boundary between an ephemeral localized edit string and one controlled
application value. It accepts partial input without publishing `NaN`, parses
supported decimal numbering systems and configured formats, performs
drift-resistant step math, and exposes styleable increment/decrement buttons.

`input[type=number]` is not the host. Its parsing, display, partial-edit,
mobile-keyboard, and spinner behavior vary by browser and cannot represent
currency, percent, unit, or many localized strings. `NumberField.Input`
therefore renders `input[type=text]`; applications own labels, descriptions,
error content, and stepper names through ordinary HTML and ARIA. Label sits
above the field, never inside NumberField. Group is the chrome.

```tsx
<Label htmlFor="quantity-input">Quantity</Label>
<NumberField
  value={quantity}
  onChange={setQuantity}
  locale="en-GB"
  min={0}
  max={100}
  step={1}
  name="quantity"
>
  <NumberField.Group>
    <NumberField.Decrement aria-label="Decrease quantity">
      −
    </NumberField.Decrement>
    <NumberField.Input id="quantity-input" />
    <NumberField.Increment aria-label="Increase quantity">
      +
    </NumberField.Increment>
  </NumberField.Group>
</NumberField>
```

Formatting changes presentation and parsing without changing the public
numeric value domain:

```tsx
<NumberField
  value={price}
  onChange={setPrice}
  locale="de-DE"
  min={0}
  step={0.05}
  formatOptions={{
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }}
>
  <NumberField.Group>
    <NumberField.Input aria-label="Price" />
    <NumberField.Decrement aria-label="Preis verringern">
      −
    </NumberField.Decrement>
    <NumberField.Increment aria-label="Preis erhöhen">
      +
    </NumberField.Increment>
  </NumberField.Group>
</NumberField>
```

## Proposed API

```ts
type NumberFieldCommitBehavior = "snap" | "validate"

interface NumberFieldProps
  extends Omit<ReferencePartProps<"div">, "onChange" | "defaultValue"> {
  value: number | null
  onChange?: (value: number | null) => void
  locale: string
  formatOptions?: Intl.NumberFormatOptions
  min?: number
  max?: number
  step?: number
  commitBehavior?: NumberFieldCommitBehavior
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  invalid?: boolean
  name?: string
  form?: string
}

interface NumberFieldGroupProps
  extends Omit<
    ReferencePartProps<"div">,
    | "role"
    | "aria-disabled"
    | "aria-readonly"
    | "aria-required"
    | "aria-invalid"
  > {
  status?: "warning"
}

type NumberFieldManagedInputProp =
  | "type"
  | "role"
  | "value"
  | "defaultValue"
  | "inputMode"
  | "name"
  | "form"
  | "min"
  | "max"
  | "step"
  | "disabled"
  | "readOnly"
  | "required"
  | "aria-disabled"
  | "aria-readonly"
  | "aria-required"
  | "aria-invalid"
  | "aria-valuemin"
  | "aria-valuemax"
  | "aria-valuenow"
  | "aria-valuetext"

interface NumberFieldInputProps
  extends Omit<
    ReferencePartProps<"input">,
    NumberFieldManagedInputProp
  > {}

type NumberFieldManagedStepperProp =
  | "type"
  | "tabIndex"
  | "role"
  | "aria-controls"
  | "aria-disabled"
  | "aria-readonly"
  | "aria-required"
  | "aria-checked"
  | "aria-pressed"
  | "aria-valuemin"
  | "aria-valuemax"
  | "aria-valuenow"
  | "aria-valuetext"

type NumberFieldStepperName =
  | {
      "aria-label": string
      "aria-labelledby"?: string
    }
  | {
      "aria-label"?: string
      "aria-labelledby": string
    }

type NumberFieldIncrementProps =
  Omit<
    ReferencePartProps<"button">,
    NumberFieldManagedStepperProp
  > &
    NumberFieldStepperName

type NumberFieldDecrementProps =
  Omit<
    ReferencePartProps<"button">,
    NumberFieldManagedStepperProp
  > &
    NumberFieldStepperName
```

There is no `NumberField.Root`, `defaultValue`, uncontrolled mode, controlled
text prop, raw-text callback, commit callback, parser/formatter function,
configurable fine/coarse step, wheel option, or polymorphic `as` prop.
`NumberField.onChange` is the only numeric request authority. Input retains
native edit, clipboard, composition, selection, focus, keyboard, and wheel
handlers so applications can observe text and native wheel behavior without
creating another store.

TypeScript's `number` includes `NaN` and infinities. The public type is
therefore a controlled-number boundary, not a finite-number type boundary.
Runtime validation rejects nonfinite `value`, bounds, step, and interaction
results before publishing DOM state or callbacks.

## Defaults

- `locale` and `value` are required. Locale has no environment-dependent
  default; `null` is the controlled empty value.
- `formatOptions` defaults to `{}`.
- `min` and `max` are absent. Supplied bounds must be finite and `min <= max`.
- `step` defaults to `0.01` for `style: "percent"` and `1` otherwise. It must
  be finite and greater than zero.
- `commitBehavior` defaults to `"snap"`.
- `disabled`, `readOnly`, `required`, and `invalid` default to `false`.
- Increment and Decrement are optional. Each renders
  `button[type=button][tabindex=-1]` and requires a nonempty authored
  `aria-label` or `aria-labelledby`; NumberField has no English fallback or
  translation bundle.
- Input defaults to `autoComplete="off"`, `autoCorrect="off"`, and
  `spellCheck={false}`. Explicit native values for these props win.
- Input's managed `inputMode` is derived from the accepted grammar and commit
  policy as specified below.
- Group `status` is omitted. `status="warning"` is Field's visual exception
  and never implies invalid.

## Exact anatomy and managed authority

`NumberField` renders `div`. It requires exactly one direct
`NumberField.Group`, which renders `div[role=group]`. Group requires exactly
one direct `NumberField.Input` and accepts at most one direct Increment and one
direct Decrement in any authored order. Any other authored siblings or
controls are allowed; only named NumberField parts register for behavior.
NumberField adds no visible wrapper around authored children. Label is a
sibling above NumberField, never a child. That is the same rule as
DateField and Field.

Group is a Field-surface host. It sets `data-reference-field` on that same
`div[role="group"]` and consumes Field's canonical bezel recipe — not a
nested `<Field>`, not a copied second stylesheet. NumberField.Input uses
embedded input styling because it is a descendant of Group. Group's
managed `data-focus-visible`, `data-disabled`, `data-readonly`, and
`data-invalid` paint the same bezel tokens Field reaches through `:has()`.
`status="warning"` is Field's visual exception on Group (`data-status`);
it never implies invalid. Local StyleProps on Group override that shared
baseline. Do not wrap Group in Field (two bezels). Do not insert Field
between Group and Input. Prefixes and extra buttons may be Group siblings,
the same as Field children. Exact selectors: [Field.md](../Field/Field.md).

Input renders the one visible and focusable `input[type=text]` with ordinary
textbox semantics. It never receives `role=spinbutton` or numeric
`aria-value*`; React Aria and Base UI retain textbox exposure because
VoiceOver can fail to focus a text input recast as a spinbutton. Zag's
spinbutton contract is deliberate contrast.

Input owns a stable ID unless an explicit `id` is supplied. Increment and
Decrement reference it with `aria-controls`. Each stepper's authored naming
prop must be nonempty and resolve to a nonempty accessible name at runtime.
Missing, empty, or unresolved naming produces a descriptive development
diagnostic and the invalid part does not register or activate. Locale changes
never translate or replace authored names.

NumberField, Group, Input, Increment, and Decrement are fixed-host generated
primitives with their documented native props, complete StyleProps, and
matching refs. Managed props listed above are absent from public part types and
win against runtime spreads or casts:

- Group owns `role`, `aria-disabled`, and `aria-invalid`.
  `aria-readonly`/`aria-required` are always absent because `group` does not
  support them; `data-readonly`/`data-required` carry styling state instead.
  Group always sets `data-reference-field`. `status="warning"` sets
  `data-status="warning"`; omitted `status` leaves it unset.
- Input owns host/value/form/input-mode attributes, native
  `disabled`/`readOnly`/`required`, managed state ARIA, and the absence of
  numeric value ARIA. Authored naming, descriptions, and error relationships
  survive.
- Steppers own button role/type/tab order, `aria-controls`, disabled state,
  and the absence of read-only/required/checked/pressed/value ARIA. Authored
  accessible-name props survive.

When `name` is supplied, NumberField generates exactly one direct
`input[type=hidden]` after its authored children. It has no public part or ref.
It carries `name`, `form`, canonical unformatted controlled value, and disabled
state. No hidden `input[type=number]` or validation proxy exists.

## Controlled value and dirty edit session

`value: number | null` is durable application state. Input owns a transient
text buffer and a separate dirty-session flag. A user edit starts the dirty
session even when the resulting string equals formatted controlled text.
`data-editing` reflects that flag, not string inequality.

Partial strings such as `""`, `"-"`, `"1,"`, `"١٫"`, an incomplete exponent,
or a partly deleted affix can remain visible without publishing an invalid
number. A parseable edit requests its finite number unless it repeats the
latest live candidate. Empty input requests `null` once. Invalid or incomplete
text emits no numeric request.

An echo matching the latest requested numeric or null candidate is accepted
without replacing the authored buffer or clearing `data-editing`. Out-of-order
echoes and unrelated programmatic `value` changes replace text and selection
from the latest controlled prop, end the dirty session, and clear any failed
boundary. Authoritative constraint or effective format changes also clear a
failed boundary after recomputing state. Programmatic changes emit no callback.

Blur and Enter are commit boundaries. A complete candidate runs the selected
commit pipeline. Live deduplication does not suppress commit: commit retries
whenever its final candidate differs from the current controlled prop, even if
that candidate was already requested while typing. Empty commits `null`.
Invalid/incomplete text reverts to formatted controlled value without a
numeric request.

A handled Arrow/Home/End or stepper value action is also a commit boundary. It
uses a complete dirty candidate as its base and controlled value otherwise,
requests only the final stepped/endpoint candidate, and ends the dirty session
by formatting accepted or rejected controlled state. Its echo is therefore not
a live-edit echo that preserves authored text.

Input consumer handlers run before matching edit, key, paste, and blur
defaults. `preventDefault()` on the composed blur boundary cancels commit and
leaves the dirty buffer intact while unfocused; refocusing resumes the same
session and selection without a formatter reset. Noncancelable native `input`
events are observations, not retroactive vetoes.

Starting composition suspends parsing, filtering, stepping, and commit. A
programmatic `value`, `locale`, or effective `formatOptions` change during
composition invalidates that session, replaces text/selection from latest
controlled state, and causes stale `compositionend` and matching `input`
fallout to be ignored without callbacks. Synthetic DOM composition sequences
are automated; real OS IME behavior is a manual release gate.

## Parsing, formatting, and input mode

`Intl.NumberFormat(locale, formatOptions)` and `formatToParts` define decimal,
group, sign, currency, percent, unit, exponent, literal, numbering-system, and
display tokens. Supported decimal numbering systems must expose ten stable,
distinct positional digits through Intl parts. ASCII, active-locale,
Arabic-Indic, Extended Arabic-Indic, Devanagari, Bengali, fullwidth, and
supported `hanidec` digits are normalized by that public rule. Requested
algorithmic systems, unsupported numbering-system fallbacks, compact notation,
and hidden-sign formats are rejected as non-invertible.

Current-locale punctuation wins. Grouping validates the locale's actual
pattern, including `3-2-2` grouping in `en-IN`/`hi-IN`, equivalent
space/apostrophe separators, and locale plural currency/unit affixes exposed
by Intl. Ambiguous foreign punctuation, foreign affixes, malformed internal
groups, duplicate decimals/signs, nonfinite text, and overflow are rejected.
A single orphan edge group created by deletion may remain partial and is
discarded on commit when the remaining digits are unambiguous.

ASCII plus/minus are accepted wherever the active grammar permits a sign.
Non-ASCII sign characters are accepted only when active Intl parts expose that
sign or it is a documented width variant of the active sign. For example,
Finnish U+2212 is accepted while the same character is rejected in `en-US`;
sign-like punctuation is never normalized globally.

ASCII digits may mix with the active locale's one supported decimal digit set.
Mixing two non-ASCII digit scripts, or using any inactive locale digit set, is
rejected even when each script is independently supported elsewhere.

- `style: "percent"` maps displayed `12%` to public `0.12` and `12‰` to
  `0.012`.
- `style: "unit", unit: "percent"` maps displayed `12%` to public `12`.
- Currency/unit affixes may be temporarily absent, but conflicting affixes do
  not choose another format.
- Accounting parentheses are negative only with
  `currencySign: "accounting"`.
- Standard, scientific, and engineering notation round-trip localized
  exponent parts.

Formatting may visually round without changing the controlled number.
Numeric precision changes at commit only when authored Intl options explicitly
request rounding/precision. A no-edit focus/blur cycle never reparses rounded
display text.

Input mode follows the actual accepted grammar:

- `"text"` for `commitBehavior="validate"`, because negative underflow remains
  editable even when `min >= 0`.
- `"text"` for snap mode when negatives are accepted, or when
  scientific/engineering or another accepted token requires non-numeric
  characters.
- In snap mode with `min >= 0`, minus input is rejected. The mode is
  `"decimal"` only when authored fraction options or the configured step at
  display scale make a decimal token part of the accepted grammar; otherwise
  it is `"numeric"`.

Resolved display rounding alone never makes decimal input editable. The
attribute is deterministic from props/Intl during SSR. Automated tests assert
only `inputMode`; real keyboard keys, visibility, and reopening are manual
iOS/Android release checks.

## Snap, validate, and the one step lattice

The step lattice is `…, -2*step, -step, 0, step, 2*step, …`; bounds do not
re-anchor it. This keeps keyboard and button interactions on one lattice.

`commitBehavior="snap"` applies this order:

1. Preserve an exact supplied min/max endpoint. A candidate beyond a supplied
   endpoint also selects that endpoint, including when it is off lattice.
2. Otherwise snap to the nearest lattice point before ordinary clamping.
   Exact midpoint ties move away from zero.
3. Apply explicitly authored Intl rounding/precision.
4. Clamp once to finite min/max.

Thus `min=0,max=10,step=3` commits both exact `10` and beyond-bound `13` to
the non-grid maximum `10`; an exact or exceeded non-grid minimum is preserved
the same way. `commitBehavior="validate"` applies explicit Intl rounding but
never snaps or clamps. It retains finite underflow, overflow, and off-step
values while exposing managed invalid state. A preserved non-grid endpoint is
step-valid in snap mode; the same raw endpoint remains step-invalid in validate
mode because validate has no endpoint exception. Snap-mode step validity also
accepts the explicitly rounded image of a lattice point, so the required
post-snap rounding order cannot make a successful snap commit immediately
step-invalid. A programmatic value that is neither an endpoint nor such an
image remains invalid.

Programmatic controlled values are never normalized in either mode. Step
interactions move directionally to the next point on the one lattice and clamp
to endpoints. From an off-grid endpoint they move inward to the adjacent grid
point; outward actions are no-ops. From `null`, the first action selects the
in-range value nearest zero without adding another step. Decimal/scientific
coefficient math removes ordinary floating drift without inventing precision
beyond JavaScript numbers.

ArrowUp/ArrowDown and unmodified stepper activation use `step`. Shift-modified
arrows or stepper activation use the fixed coarse delta `10 * step`, which
remains on the same lattice; a pointer hold keeps the initiating modifier for
that repeat session. Alt-modified arrows, PageUp/PageDown, modified Home/End,
horizontal arrows, and editing shortcuts remain native. Alt on a button does
not create another step amount. Home/End target supplied min/max. Recognized
outward boundary keys stay handled but emit no request.

NumberField never handles wheel input. Native wheel events and consumer
handlers remain untouched.

## Steppers and repeat

An unprevented primary pointerdown performs one step immediately. The first
repeat occurs exactly 400ms later and subsequent repeats every 60ms: no repeat
at 399ms, one at 400ms, none additional at 459ms, and the next at 460ms.

Pointer leave stops that repeat session. Re-entry while the same primary
pointer remains pressed performs one immediate step and starts a fresh 400ms
delay; it does not resume a 60ms cadence. Pointerup, pointercancel, lost
capture, touch/pen movement greater than 8 CSS pixels from pointerdown, scroll
intent, a second pointer/pinch, owner-window blur, unmount, part removal,
disabling, read-only state, or reaching the bound cleans up timers and pressed
state. Movement at exactly 8 pixels does not cancel. Compatibility click never
adds a duplicate.

Keyboard, assistive-technology, and programmatic `button.click()` activation
without an owned pointerdown performs one step through native click. Mouse
activation focuses or retains Input and places a programmatically moved caret
at the end. Automated tests assert DOM focus/events only; touch keyboard and
assistive-technology behavior belong to manual release gates.

## Validity, forms, submit, and reset

The visible host is text, so native `rangeUnderflow`, `rangeOverflow`, and
`stepMismatch` always remain false. NumberField represents numeric constraints
only through managed `aria-invalid`/`data-invalid`, stepper capability, and
form-submit prevention. It never calls, clears, proxies, or composes
`setCustomValidity` for numeric constraints.

Native `required` retains platform `valueMissing` behavior. An application
message set with `input.setCustomValidity()` is wholly application-owned and
survives NumberField edits, prop changes, validation changes, commits, and
resets until the application clears it. `invalid` is an ARIA/style signal and
does not change native validity or block form submission by itself.

The hidden form value is `""` for `null` and `String(value)` otherwise.
Disabled fields are omitted. Read-only fields suppress interaction and numeric
submit blocking but serialize controlled canonical state.

Every associated NumberField observes each form submit independently, even
when another field or an application handler already called
`preventDefault()`. A clean, accepted field adds no prevention. A dirty,
incomplete, numeric-constraint-invalid, pending, rejected, or failed-boundary
state prevents serialization of stale state and processes its own commit once.
Application `invalid` alone adds no prevention; native required or application
custom validity remains platform-owned. All dirty fields receive the same
submit attempt. NumberField never auto-submits after an accepted echo; the
application explicitly retries.

A click-submit blur or implicit Enter commit that is incomplete, rejected, or
not yet accepted records a failed/pending boundary. The ensuing submit is
blocked even if the buffer already reverted, so old controlled state cannot
escape. A failed, incomplete, or rejected boundary sets managed invalid state
and blocks every later submit; prevention never consumes it. It clears only
after a subsequent valid user edit, an accepted commit, an authoritative
programmatic value/constraint/effective-format change, or an unprevented reset.
Without one of those resolutions, the restored old controlled value remains
unsubmittable. Legacy `HTMLFormElement.submit()` bypasses submit events and is
deliberately outside this guarantee; use `requestSubmit()`.

Programmatic `form.reset()` while focused does not blur. An unprevented reset
reformats latest controlled value, clears dirty/interaction/failed-boundary
state, keeps native focus, and restores selection to the formatted end. A
clicked reset button blurs first; its blur commit/revert happens before reset.
Canceling that reset preserves the post-blur result and cannot resurrect the
pre-blur buffer or clear a failed boundary.
Canceling a programmatic reset before any blur leaves the active dirty session
untouched. Reset never changes the controlled number or application custom
validity.

## Observable state and environments

NumberField, Group, and Input expose `data-disabled`, `data-readonly`,
`data-required`, `data-invalid`, `data-empty`, and `data-editing` when true.
Group also exposes `data-focused` and `data-focus-visible`, and is a
Field-surface host (`data-reference-field`). `data-focus-visible` drives
the shared bezel focus ring; `data-focused` must not apply that ring.
Steppers expose
`data-disabled` and `data-pressed`. `data-empty` follows visible text during a
dirty session and controlled `null` otherwise. Managed invalid state is the
union of application `invalid`, finite/bound/step constraints, and failed
boundary state; only the latter two NumberField-owned branches block submit.
An uncommitted partial is not invalid until a commit/submit boundary.

Direction is inherited from DOM and changes text/caret presentation, not
increase/decrease direction. Lookup, listeners, active element, and same-tree
form work are scoped to the owning root/document or open ShadowRoot.

Localized SSR text is byte-identical only within the supported server/client
Intl/ICU matrix. Different CLDR/ICU data may legitimately produce different
glyphs or spacing and is a deployment compatibility failure, not a component
promise. Generated IDs are stable and unique within one React root.
Independent SSR roots must use distinct React `identifierPrefix` values or
explicit Input IDs; NumberField does not promise impossible document-global
coordination across independently rendered roots.

---

## Problems we own

### Localized partial editing without duplicate authority

The dirty buffer is short-lived interaction state, not another application
value. Public Input events expose it; only `NumberField.onChange` requests
durable numeric state.

### Round-trippable Intl formats through the public component

Parser, formatter, and math are implementation details. Their proof imports
`NumberField` from `@reference-ui/lib`, drives public Input and props in a
DOM-light Vitest harness, and observes text, callback, state, ARIA, or form
output. No helper or test-only export is part of the contract.

### One precise interaction lattice

One `step` shared by normal keys and buttons, with fixed Shift coarse stepping,
avoids interaction-created step-invalid values and competing fine/coarse
lattices.

### Styleable repeatable steppers

Fixed named button parts own activation, repeat timing, cleanup, bound state,
and focus policy while leaving stepper visual chrome and product labels to the
application. Group consumes Field's bezel recipe rather than a second NumberField
skin.

## Deliberately left

- `smallStep`, `largeStep`, configurable coarse/fine steps, and Alt stepping.
  One lattice is easier to inspect and cannot create a value invalid under a
  different interaction step.
- Wheel stepping. Wheel changes are easy to trigger accidentally, and React's
  passive wheel delegation cannot provide the promised consumer-first
  cancellation plus reliable scroll prevention without a second event system.
- `NumberField.ScrubArea`, pointer lock, acceleration, and virtual cursors.
  These duplicate Slider's continuous-pointer territory and are not needed by
  the frozen compositions.
- Uncontrolled/default values, raw-text or commit callbacks, reason/detail
  objects, imperative methods, parser/formatter functions, render props,
  Provider/Field *context* contracts (Base UI / Aria form wiring), and
  polymorphic hosts. Visual `Field` is the bezel recipe Group consumes;
  do not nest `<Field>` in Group or wrap Group in Field.
- Arbitrary precision, bigint, expressions, compact/hidden-sign editing,
  unsupported algorithmic numbering systems, locale guessing, permissive
  malformed separators, and cross-ShadowRoot form association.
- Product labels/errors, translated stepper names, genuine autofill control,
  AT speech, OS IME candidate-window behavior, and software-keyboard layout.
  The latter behaviors are manual release gates where applicable.

## Convergence

React Aria/React Stately supply localized partial editing, controlled buffer,
textbox, mobile, and form evidence. Base UI strengthens Unicode parsing,
precision, paste/caret, rejected-control, validity, and repeat cleanup. Zag
supplies cursor vectors and contrast for spinbutton/ScrubArea behavior.
Reference UI converges on a controlled `<NumberField>` with four named parts,
one public step lattice, managed numeric validity without native-number
proxies, Group as a Field-surface host, and no hidden interaction authority.

# NumberField test contract

Playwright: `matrix/lib/tests/e2e/number-field.spec.ts`
Unit: `matrix/lib/tests/unit/number-field.test.tsx`
Page: `/number-field`

Every case exercises only public exports from `@reference-ui/lib`; automated
cases import `NumberField` and type tests may also import `NumberFieldProps`,
while manual gates use the built public fixture. `[unit]` means a DOM-light
Vitest render, never a parser/math helper, internal module, or test-only export.
Cases drive public props and Input events and observe rendered text, callbacks,
managed DOM/ARIA/data, focus, or form output. Browser event-order, selection,
pointer, validation, and form behavior remains Playwright-owned.

This contract defines **148 tagged `NF-*` cases**: 144 automated cases and four
manual release gates.

## Freeze decisions

1. The root is `<NumberField>` with `NumberFieldProps`; `NumberField.Root` and
   `NumberFieldRootProps` do not exist.
2. Public state is controlled `number | null`. TypeScript cannot express
   finiteness, so runtime rejects NaN and infinities.
3. Group, Input, Increment, and Decrement are fixed-host generated parts.
   Group and Input are required; steppers are optional and uniquely direct.
4. Input is `type=text`, owns a private dirty edit session, and exposes no raw
   text callback or controlled text prop.
5. Numeric constraints never use `setCustomValidity`; native text-input
   range/step validity flags remain false. Application `invalid` is ARIA/style
   state and does not block submission by itself.
6. One `step` lattice serves normal keys and steppers. Shift uses fixed
   `10 * step`; Alt remains native. Wheel stepping is absent.
7. Snap preserves exact/exceeded non-grid bounds, otherwise snaps before
   ordinary clamp, uses away-from-zero midpoint ties, applies explicit Intl
   rounding, then final-clamps. Validate mode never snaps or clamps.
8. `data-editing` is a user-authored dirty-session flag. Accepted latest
   echoes preserve it; unrelated/out-of-order controlled changes end it.
9. Every dirty field processes the same submit even if another participant
   already prevented it. Failed blur/Enter boundaries block every submit until
   a documented authoritative resolution clears them.
10. Composition invalidated by value/locale/format replacement ignores stale
    end/input fallout. True OS IME remains a manual gate.
11. Input mode follows accepted grammar and commit policy, not UA detection or
    resolved display rounding alone.
12. Every stepper requires an authored nonempty accessible-name prop. There is
    no English fallback or locale translation.
13. Localized SSR equality is scoped to the supported Intl/ICU matrix. IDs are
    unique within a React root; independent roots need identifier prefixes or
    explicit IDs.
14. Repeat is immediate, then 400ms, then every 60ms. Leave ends the session;
    pressed re-entry steps immediately and starts a new 400ms delay.
15. Real AT speech, OS IME, software-keyboard behavior, and genuine autofill
    are manual release gates, not Playwright claims.
16. Group is a Field-surface host: `data-reference-field` on the same
    `div[role="group"]`, Field's bezel recipe, no nested `<Field>`.
    `status="warning"` is the shared visual exception. Visual identity
    with Field is `FI-SURF-01`.

## Source evidence

### React Spectrum

- `vendor/react-spectrum/packages/react-aria-components/test/NumberField.test.js`
- `vendor/react-spectrum/packages/react-aria/test/numberfield/useNumberField.test.ts`
- `vendor/react-spectrum/packages/react-stately/test/numberfield/useNumberFieldState.test.ts`
- `vendor/react-spectrum/packages/react-aria-components/src/NumberField.tsx`
- `vendor/react-spectrum/packages/react-aria/src/numberfield/useNumberField.ts`
- `vendor/react-spectrum/packages/react-aria/src/spinbutton/useSpinButton.ts`
- `vendor/react-spectrum/packages/react-stately/src/numberfield/useNumberFieldState.ts`
- `vendor/react-spectrum/packages/@internationalized/number/test/NumberParser.test.js`
- `vendor/react-spectrum/packages/@internationalized/number/src/NumberParser.ts`

These supply textbox/form anatomy, localized parser/formatter behavior,
controlled dirty text, format-option stability, non-Latin paste, stepping,
required state, and mobile-input evidence. Private hooks/state, Provider/slot
contracts, uncontrolled values, and hidden-number validation are contrast.

### Base UI

- `vendor/base-ui/packages/react/src/number-field/root/NumberFieldRoot.spec.tsx`
- `vendor/base-ui/packages/react/src/number-field/root/NumberFieldRoot.test.tsx`
- `vendor/base-ui/packages/react/src/number-field/root/NumberFieldRoot.iOS.test.tsx`
- `vendor/base-ui/packages/react/src/number-field/input/NumberFieldInput.test.tsx`
- `vendor/base-ui/packages/react/src/number-field/input/NumberFieldInput.spec.tsx`
- `vendor/base-ui/packages/react/src/number-field/group/NumberFieldGroup.test.tsx`
- `vendor/base-ui/packages/react/src/number-field/increment/NumberFieldIncrement.test.tsx`
- `vendor/base-ui/packages/react/src/number-field/decrement/NumberFieldDecrement.test.tsx`
- `vendor/base-ui/packages/react/src/number-field/utils/parse.test.ts`
- `vendor/base-ui/packages/react/src/number-field/utils/validate.test.ts`
- `vendor/base-ui/packages/react/src/number-field/root/NumberFieldRoot.tsx`
- `vendor/base-ui/packages/react/src/number-field/input/NumberFieldInput.tsx`
- `vendor/base-ui/packages/react/src/number-field/group/NumberFieldGroup.tsx`
- `vendor/base-ui/packages/react/src/number-field/increment/NumberFieldIncrement.tsx`
- `vendor/base-ui/packages/react/src/number-field/decrement/NumberFieldDecrement.tsx`
- `vendor/base-ui/packages/react/src/number-field/root/useNumberFieldStepperButton.ts`
- `vendor/base-ui/packages/react/src/number-field/utils/parse.ts`
- `vendor/base-ui/packages/react/src/number-field/utils/validate.ts`
- `vendor/base-ui/packages/react/src/number-field/utils/constants.ts`
- `vendor/base-ui/packages/react/src/internals/usePressAndHold.ts`

These strengthen input filtering, Unicode digits/signs, Indian and localized
grouping, percent/unit/currency/exponent parsing, explicit rounding, decimal
cleanup, dirty stepping, controlled rejection, caret/paste/composition,
inputMode contrast, and repeat cleanup. Reasons/details, uncontrolled modes,
wheel/scrub options, custom step families, Base UI Field provider
integration, polymorphism, and hidden-number validation are deliberately
not copied.

### Zag

- `vendor/zag/packages/machines/number-input/tests/cursor.test.ts`
- `vendor/zag/packages/machines/number-input/src/cursor.ts`
- `vendor/zag/packages/machines/number-input/src/number-input.machine.ts`
- `vendor/zag/packages/machines/number-input/src/number-input.connect.ts`

Cursor vectors are ported through public focused Input rerenders. Zag's string
machine, spinbutton role, service methods, wheel, and ScrubArea remain
contrast/deferred behavior.

## Universal part conformance

The shared `PART-TYPE-01`, `PART-DOM-01`, `PART-PROP-01`,
`PART-STYLE-01`, `PART-REF-01`, `PART-REF-02`, `PART-EVENT-01`,
`PART-STATE-01`, `PART-ID-01`, `PART-CONTROL-01`, and
`PART-DEFAULT-01` cases apply to the root and four parts. `PART-DOM-02` and
`PART-DYNAMIC-01` are inapplicable because there is no Slot part or collection.

## Required automated cases

### Public type and export contract

- [ ] `NF-TYPE-01` `[reference]` `[unit]` —
  **NumberField should export the conventional root and no Root alias.**
  Compile `<NumberField value={null} locale="en-US">` with public parts and
  assert `NumberFieldProps` is exported while `NumberField.Root`,
  `NumberFieldRootProps`, omitted value/locale, `defaultValue`, and
  uncontrolled usage fail. This matches every other Reference UI root.
- [ ] `NF-TYPE-02` `[reference]` `[unit]` —
  **NumberField should type one controlled numeric request authority without
  claiming compile-time finiteness.** Compile `number | null` value/callback
  pairs and reject strings, bigint, arrays, raw-text callbacks, commit
  callbacks, parser functions, and reason/detail callback parameters. Runtime
  finiteness is intentionally proved separately because TypeScript `number`
  includes NaN and infinity.
- [ ] `NF-TYPE-03` `[reference]` `[unit]` —
  **NumberField parts should omit every behavior-owned native and ARIA prop.**
  Compile native props, StyleProps, `r`, `css`, and matching refs; reject
  Group role/disabled/read-only/required/invalid ARIA, every documented managed
  Input prop, every documented managed stepper semantic prop, root
  `allowWheel`/`smallStep`/`largeStep`, `as`, and wrong refs. Assert unrelated
  naming/description/event props remain available while Group read-only/
  required styling remains data-only. Compile Group `status="warning"` and
  StyleProps; `@ts-expect-error` `status="error"`.
- [ ] `NF-TYPE-04` `[reference]` `[unit]` —
  **Each stepper should require an authored accessible-name prop at the type
  boundary.** Compile nonempty-shaped `aria-label`, `aria-labelledby`, and both
  together on Increment/Decrement; reject neither prop while retaining native
  button handlers/children. Runtime emptiness remains separately diagnosed.

### Anatomy, native props, IDs, and state

- [ ] `NF-DOM-01` `[reference]` `[browser]` —
  **NumberField should render exactly one root div, group div, text input, and
  authored stepper buttons.** Render the complete composition and assert fixed
  tags, `role=group`, `type=text`, `type=button`, authored order, no visible
  wrapper, no spinbutton role, and no implicit native-number input. Group
  is `data-reference-field` on that same group node.
- [ ] `NF-DOM-02` `[reference]` `[browser]` —
  **A name should add only one direct canonical hidden form input.** Toggle
  `name` and `form` around controlled null/finite values and assert exactly one
  root-direct `input[type=hidden]`, canonical text, current association,
  disabled mirroring, and no public part/ref or number validation proxy.
- [ ] `NF-DOM-03` `[reference]` `[browser]` —
  **NumberField should diagnose missing, duplicate, or misplaced named parts
  without choosing an accidental authority.** Render each invalid anatomy in
  an error boundary and assert a part-specific diagnostic, no partial
  listener/timer/hidden host/callback, and no DOM-order authority.
- [ ] `NF-DOM-04` `[reference]` `[browser]` —
  **Group should allow arbitrary authored siblings while only named parts join
  behavior.** Place labels, links, buttons, icons, status content, and inputs
  around the unique NumberField Input and steppers. Assert all siblings retain
  native behavior/refs/order and only named parts receive managed state,
  registration, focus, and stepping.
- [ ] `NF-DOM-05` `[reference]` `[browser]` —
  **All fixed hosts should preserve unrelated native props, StyleProps,
  handlers, and refs.** Exercise IDs, titles, placeholder, enterKeyHint, data,
  descriptions, classes, CSS variables, responsive styles, object/callback
  refs, and unrelated events through rerenders. Assert node identity, exact
  consumer presentation, event order, and ref cleanup.
- [ ] `NF-DOM-06` `[reference]` `[browser]` —
  **Managed part authority should defeat every conflicting runtime cast.**
  Spread forged managed role/type/value/form/state/value-ARIA props onto Group,
  Input, and steppers, then toggle root state. Assert Group keeps
  `role=group`, managed aria-disabled/invalid, data-readonly/data-required, and
  always omits aria-readonly/aria-required; Input alone carries native
  readOnly/required semantics. Assert all other documented values/absences win
  atomically while unrelated authored ARIA survives.
- [ ] `NF-DOM-07` `[reference]` `[browser]` —
  **Input IDs and stepper controls should stay stable within one React root.**
  Render two fields, change one explicit Input ID, and remove/reinsert a
  stepper. Assert root-local uniqueness, hydration stability, same-commit
  `aria-controls` retargeting, explicit-ID priority, and no stale registration.
- [ ] `NF-DOM-08` `[reference]` `[browser]` —
  **Managed data should distinguish dirty editing, visible emptiness, validity,
  focus, disabled state, and pointer press.** Traverse clean null, dirty empty,
  sign-only, accepted echo, failed commit, disabled/read-only, focused, and
  pressed states. Assert each documented data attribute appears only on its
  documented parts and cannot be forged.
- [ ] `NF-DOM-09` `[reference]` `[browser]` —
  **Missing, empty, or unresolved stepper names should fail at runtime instead
  of receiving English fallback text.** Bypass types with absent/blank labels
  and empty/missing `aria-labelledby` targets. Assert one descriptive
  development diagnostic per part, no registration/activation, no invented
  label, and recovery after a valid authored name appears.

### Localized parsing through public Input

- [ ] `NF-PARSE-01` `[convergence]` `[unit]` —
  **NumberField should derive active tokens by rendering the public component
  for the requested locale and format.** Render decimal, currency, percent,
  unit, scientific, and engineering fixtures, edit their Input, and assert
  visible parts and callback values match `Intl.NumberFormat`/`formatToParts`
  for that fixture without importing parser state.
- [ ] `NF-PARSE-02` `[vendor]` `[unit]` —
  **NumberField should accept ASCII, Arabic-Indic, Extended Arabic-Indic,
  Devanagari, Bengali, fullwidth, and supported hanidec digits.** Input
  equivalent localized representations of `1024.5`, then mix ASCII with the
  active non-ASCII set, two non-ASCII scripts, and inactive-locale digits.
  Assert the same callback/canonical display for one active set plus ASCII,
  but no request for mixed non-ASCII or inactive sets. This extends Base UI
  numeral vectors through deterministic public policy.
- [ ] `NF-PARSE-03` `[vendor]` `[unit]` —
  **NumberField should accept only active-locale or documented width sign
  variants without discarding duplicate or embedded signs.** Type ASCII,
  mathematical, fullwidth, small, figure-dash, en-dash, and em-dash variants
  around `123.5`, including Finnish U+2212 acceptance and US rejection; under
  `min=0` prove validate accepts negative underflow while snap rejects minus.
  Assert one finite signed request only where locale/grammar permits, while
  duplicate, embedded, or sign-like punctuation yields no numeric callback.
- [ ] `NF-PARSE-04` `[convergence]` `[unit]` —
  **NumberField should preserve incomplete localized grammar as dirty text
  without publishing a substitute value.** Enter empty, sign-only,
  decimal-only, trailing decimal/group, affix partial, and incomplete exponent
  strings. Assert visible authored text/data-editing, no NaN/zero callback,
  controlled hidden value unchanged, and commit reversion where incomplete.
- [ ] `NF-PARSE-05` `[convergence]` `[unit]` —
  **Current-locale decimal and group meaning should win over ambiguous foreign
  punctuation.** Drive US, German, and French valid forms plus cross-locale,
  duplicate-decimal, and malformed-group forms. Assert exact locale-valid
  requests and deterministic rejection rather than punctuation guessing.
- [ ] `NF-PARSE-06` `[vendor]` `[unit]` —
  **Locale-equivalent space and apostrophe groups should parse only in valid
  group positions.** Input French regular/no-break/narrow/thin/figure spaces
  and Swiss straight/right apostrophes in grouped numbers. Assert equal finite
  requests and reject arbitrary leading/internal whitespace.
- [ ] `NF-PARSE-07` `[vendor]` `[browser]` —
  **Disabling grouping should remove pasted group tokens without changing the
  number or caret model.** Render `useGrouping:false`, paste grouped US/German
  forms, and assert ungrouped visible text, exact request, adjusted selection,
  and ungrouped committed display.
- [ ] `NF-PARSE-08` `[vendor]` `[unit]` —
  **Configured currency affixes should parse in locale order while conflicting
  currency stays invalid.** Edit USD, EUR, JPY, and BRL symbol/code/name forms
  with affix present or temporarily absent. Assert equal numeric requests and
  no request for foreign currency or currency text in decimal style.
- [ ] `NF-PARSE-09` `[convergence]` `[unit]` —
  **Percent style and the percent unit should expose different public scales.**
  Input localized `12%` and `12‰` into percent, percent-unit, and decimal
  fixtures. Assert `0.12`/`0.012` only for percent style, `12` for percent
  unit, and deterministic rejection of unsupported symbols.
- [ ] `NF-PARSE-10` `[vendor]` `[unit]` —
  **Configured unit affixes should round-trip without treating unit letters as
  exponent syntax.** Edit short/long `kg`, `km/h`, and localized day forms,
  then commit. Assert exact numeric callback/display and reject another unit or
  stray exponent letters.
- [ ] `NF-PARSE-11` `[vendor]` `[unit]` —
  **Scientific and engineering notation should accept localized exponent
  parts and reject incomplete exponents at commit.** Input signed exponents,
  locale digits/signs, and formatter exponent separators. Assert finite
  requests/round-trip text for complete forms and no request plus reversion for
  incomplete/overflow forms.
- [ ] `NF-PARSE-12` `[convergence]` `[unit]` —
  **Accounting parentheses should mean negative only in configured accounting
  currency.** Edit localized parenthesized currency and equivalent standard
  fixtures. Assert a negative callback only for accounting configuration and
  no silent sign stripping elsewhere.
- [ ] `NF-PARSE-13` `[vendor]` `[unit]` —
  **Formatter-inserted bidi controls should be ignored without accepting
  unrelated invisible text.** Edit RTL currency/percent strings with expected
  bidi marks, then add unrelated zero-width/control characters. Assert exact
  numeric callbacks for formatter output and no callback for foreign controls.
- [ ] `NF-PARSE-14` `[convergence]` `[unit]` —
  **Empty, nonnumeric, overflowing, and nonfinite text should never cross the
  numeric callback.** Drive whitespace, words, lone affixes, NaN/Infinity
  spellings, extreme exponents, and mixed invalid tokens. Assert no nonfinite
  callback, no hidden contamination, and deterministic commit recovery.
- [ ] `NF-PARSE-15` `[reference]` `[unit]` —
  **Every supported decimal numbering system should satisfy a public
  format-edit-commit vector rule.** Enumerate the supported Intl/ICU matrix,
  derive ten distinct positional glyphs with `formatToParts`, render
  NumberField, edit vectors for 0–9 and `1024.5`, and assert numeric callbacks
  plus locale round-trip display. Skip only systems absent from the declared
  matrix, never by implementation-private allowlist.
- [ ] `NF-PARSE-16` `[reference]` `[unit]` —
  **Unsupported algorithmic or non-invertible numbering systems should fail
  before accepting edits.** Request systems whose resolved Intl output does
  not expose ten stable positional digits, plus compact and hidden-sign
  formats. Assert a prop-specific diagnostic, no fallback editor/callback, and
  no claim of universal locale support.
- [ ] `NF-PARSE-17` `[convergence]` `[unit]` —
  **Indian grouping should honor the 3-2-2 pattern exposed by en-IN and hi-IN.**
  Input `1,23,45,678.9` with Latin and Devanagari digits, then malformed
  western/Indian group sizes. Assert the correct finite request/display only
  for active-locale grouping and stable rejection of malformed groups.
- [ ] `NF-PARSE-18` `[vendor]` `[unit]` —
  **Plural currency and unit affix forms exposed by Intl should remain
  parseable without guessing prose.** Render values selecting singular,
  dual/few where supported, and plural long names; edit each formatter output
  back through Input. Assert identical numeric requests and reject unattested
  noun forms or another configured unit/currency.
- [ ] `NF-PARSE-19` `[vendor]` `[unit]` —
  **A seeded public formatter/parser matrix should round-trip at least 2,000
  deterministic values across the supported Intl surface.** Reuse and rerender
  one public NumberField fixture across supported locales, numbering systems,
  decimal/currency/percent/unit/scientific styles, and precision options using
  a recorded seed; feed each rendered string back through Input and commit.
  Assert at least 2,000 expected callback/display round trips plus named
  upstream counterexamples: Finnish U+2212 versus US rejection, invalid
  no-grouping separators, SAR symbol punctuation, accounting code
  parentheses, unknown/partial currency code/name, and narrow-inch prime.
  Record reproducible failure seed/vector and import no private helper.

### Formatting and precision through public rendering

- [ ] `NF-FORMAT-01` `[vendor]` `[unit]` —
  **NumberField should render controlled values with the exact requested Intl
  format through public Input.** Render positive, negative, zero, tiny, large,
  currency, percent, unit, scientific, engineering, and accounting values.
  Assert Input text equals `Intl.NumberFormat` in the supported matrix and no
  callback fires on mount.
- [ ] `NF-FORMAT-02` `[reference]` `[unit]` —
  **Controlled null should be the only clean empty display.** Render null, zero,
  negative zero, and values formatting visually to zero. Assert only null has
  empty text/data, hidden canonical state follows controlled value, and mount
  emits no request.
- [ ] `NF-FORMAT-03` `[vendor]` `[browser]` —
  **Referentially new but effectively equal format options should preserve a
  dirty session.** Type an uncommitted localized buffer, rerender equal option
  objects, and assert text/selection/data-editing/node identity and callback
  log stay unchanged. This ports React Stately option-stability evidence.
- [ ] `NF-FORMAT-04` `[vendor]` `[browser]` —
  **An effective format change should replace dirty text from controlled
  state.** Change currency, unit, fraction, notation, or numbering system while
  dirty outside composition. Assert latest controlled formatting replaces
  text/selection, editing clears, hidden state stays canonical, and no request
  is synthesized.
- [ ] `NF-FORMAT-05` `[vendor]` `[unit]` —
  **Omitted Intl precision defaults should remain display-only.** Render a
  higher-precision controlled value whose text is visually rounded, focus and
  blur without editing, and assert the original callback/hidden numeric value
  is never reparsed or truncated.
- [ ] `NF-FORMAT-06` `[vendor]` `[unit]` —
  **Authored fraction rounding should apply only at a dirty commit boundary.**
  Enter positive/negative midpoint vectors under explicit rounding modes,
  commit, and assert one public rounded request plus accepted display. Clean
  rerenders keep the unmodified controlled number.
- [ ] `NF-FORMAT-07` `[vendor]` `[unit]` —
  **Authored significant digits, priority, and rounding increments should
  produce observable public commit results.** Drive valid option combinations
  through Input and assert exact callback/display; invalid combinations
  diagnose before interaction without exposing a helper model.
- [ ] `NF-FORMAT-08` `[vendor]` `[unit]` —
  **Percent rounding should occur at display scale while currency and units
  retain numeric scale.** Commit the same precision vectors in percent,
  percent-unit, and currency fixtures. Assert fractional percent callbacks,
  unscaled unit/currency callbacks, and round-trip accepted text.

### Bounds, snap, and decimal math through public interaction

- [ ] `NF-MATH-01` `[reference]` `[unit]` —
  **NumberField should resolve public numeric defaults without truthiness
  coercion.** Render omitted/undefined options across decimal and percent
  styles and drive arrows/commit. Assert unbounded range, step `1` or percent
  `0.01`, snap default, and preserved controlled zero/false flags.
- [ ] `NF-MATH-02` `[convergence]` `[unit]` —
  **Runtime should reject every nonfinite or unusable numeric prop.** Render
  NaN/infinity value/min/max/step, zero/negative step, and reversed bounds in
  isolated error boundaries, then drive a finite value/step whose interaction
  overflows. Assert property-specific diagnostics, no nonfinite callback, and
  no formatted NaN, hidden contamination, or managed mixed state.
- [ ] `NF-MATH-03` `[reference]` `[unit]` —
  **All interaction should use one zero-anchored step lattice.** With steps
  `2`, `0.25`, and `1e-7`, use arrows, Shift arrows, and steppers from aligned
  and off-grid controlled values. Assert candidates land on the same
  zero-anchored lattice and no interaction-specific step validity appears.
- [ ] `NF-MATH-04` `[vendor]` `[unit]` —
  **Directional stepping from an off-grid value should choose the next lattice
  point in the requested direction.** Step both ways from positive/negative
  off-grid values and accepted dirty candidates. Assert strict directional
  movement rather than nearest backward rounding or hidden accumulation.
- [ ] `NF-MATH-05` `[convergence]` `[unit]` —
  **The first step from null should select the in-range value nearest zero
  without adding another step.** Exercise unbounded, positive-only,
  negative-only, and zero-containing bounds. Assert `0`, min, max, or `0`
  respectively, then normal lattice movement after acceptance.
- [ ] `NF-MATH-06` `[reference]` `[unit]` —
  **Exact non-grid bounds should remain reachable and stable under stepping.**
  Render zero-anchored lattices with off-grid min/max, reach each endpoint,
  then step outward/inward. Assert outward no-op, inward adjacent grid point,
  exact managed capability, and no value beyond bounds.
- [ ] `NF-MATH-07` `[vendor]` `[unit]` —
  **Decimal and scientific stepping should remove ordinary floating drift.**
  Drive repeated arrow/button steps for `0.1`, `0.01`, and `1e-7`. Assert exact
  callback/hidden strings such as `0.8`, never binary-noise tails, through only
  the public component.
- [ ] `NF-MATH-08` `[vendor]` `[unit]` —
  **Cleanup should not erase meaningful representable precision.** Step large
  fractional magnitudes, high-significance deltas, and safe-integer edges.
  Assert public callbacks match safer representable JavaScript values and no
  broad decimal truncation occurs.
- [ ] `NF-MATH-09` `[reference]` `[unit]` —
  **Snap midpoint ties should move away from zero.** Commit values immediately
  below, above, and exactly halfway between positive/negative lattice points.
  Assert nearest results and away-from-zero exact ties through callbacks and
  accepted display.
- [ ] `NF-MATH-10` `[reference]` `[unit]` —
  **Snap should preserve exact and exceeded non-grid maximum endpoints.**
  With `min=0,max=10,step=3`, commit exact `10`, candidate `13`, and nearby
  in-range vectors. Assert exact `10` for the first two, ordinary nearest
  lattice results for in-range values, and final canonical form state.
- [ ] `NF-MATH-11` `[reference]` `[unit]` —
  **Snap should preserve exact and exceeded non-grid minimum endpoints.**
  With a positive or negative off-lattice min, commit the exact min, a lower
  candidate, and nearby in-range vectors. Assert endpoint preservation,
  ordinary lattice snapping above it, and no pre-clamp anchor mutation.
- [ ] `NF-MATH-12` `[reference]` `[unit]` —
  **Snap should apply endpoint preservation or nearest lattice, then authored
  rounding, then final clamp in that order.** Choose rounding vectors that
  cross an off-grid bound and distinguish alternative orders. Assert only the
  documented final callback/display, snap-mode validity accepts the rounded
  image of its lattice source, and no intermediate request or immediately
  step-invalid successful snap result appears.
- [ ] `NF-MATH-13` `[reference]` `[unit]` —
  **Validate mode should apply authored rounding without snapping or
  clamping.** Commit finite underflow, overflow, and off-step values. Assert the
  rounded raw candidate is requested, accepted text remains controlled, and
  managed invalid state reports each applicable numeric constraint.
- [ ] `NF-MATH-14` `[reference]` `[unit]` —
  **Interaction-produced negative zero should canonicalize to zero without
  rewriting a programmatic prop.** Commit/step negative-zero vectors and
  separately render controlled `-0`. Assert interaction callbacks/hidden text
  use zero while clean programmatic formatting remains prop-authoritative.
- [ ] `NF-MATH-15` `[reference]` `[unit]` —
  **Off-grid bound validity should distinguish an allowed endpoint from an
  ordinary step mismatch.** In validate mode render exact off-grid min/max,
  interior off-grid, and out-of-range values, then render the same endpoints
  in snap mode. Assert validate endpoints are bound-valid but step-invalid,
  snap endpoints are step-valid by endpoint exception, interior mismatch is
  invalid, native range/step flags stay false, and no prop is normalized.

### Native editing, caret, paste, and synthetic composition

- [ ] `NF-EDIT-01` `[reference]` `[browser]` —
  **Focusing clean Input should not start a dirty session.** Focus null,
  numeric, and formatted values by keyboard/pointer/programmatically. Assert
  exact text, native focus selection, no `data-editing`, no callback, and
  controlled/hidden state unchanged.
- [ ] `NF-EDIT-02` `[convergence]` `[browser]` —
  **Valid partial edits should remain visible while impossible ordinary
  insertions are canceled.** Enter localized partials, then letters, duplicate
  decimal, and second sign outside composition. Assert partial text/caret and
  dirty data persist, impossible mutations do not land, and no invalid numeric
  callback appears.
- [ ] `NF-EDIT-03` `[vendor]` `[browser]` —
  **Newly parseable live edits should request numbers while preserving authored
  text.** Type locale digits through integer, trailing decimal, and fraction
  states while accepting callbacks. Assert ordered deduped numeric requests,
  exact typed buffer/caret, dirty state, and no commit-only callback.
- [ ] `NF-EDIT-04` `[vendor]` `[browser]` —
  **Clearing should request null once as a live candidate.** Clear nonempty
  Input by selection/delete and repeated empty events. Assert one live null
  request, accepted echo preserving dirty empty state, canonical hidden value,
  and no duplicate from equivalent empty input.
- [ ] `NF-EDIT-05` `[reference]` `[browser]` —
  **Live edits with repeated numeric meaning should dedupe without ending the
  dirty session.** Move through `1`, `1.`, `1.0`, grouping, and equivalent
  locale digits. Assert native handlers see every mutation, one numeric
  meaning request, exact visible text, and `data-editing=true`.
- [ ] `NF-EDIT-06` `[vendor]` `[browser:all]` —
  **Horizontal navigation and selection should remain native around localized
  tokens.** Exercise Left/Right, Shift selection, word movement, Home/End
  without bounds, collapsed/ranged selections, and RTL text. Assert native
  selection/default behavior and no numeric request from navigation alone.
- [ ] `NF-EDIT-07` `[vendor]` `[browser]` —
  **Formatting replacements should preserve the caret by logical digit when
  possible.** Port Zag start/middle/end, prefix/suffix, insertion/deletion, and
  grouping vectors through focused public rerenders. Assert clamped logical
  selection and documented end fallback without importing cursor code.
- [ ] `NF-EDIT-08` `[vendor]` `[browser]` —
  **Valid paste should splice at the current selection and retain the resulting
  caret.** Paste ASCII and supported localized digits at start/middle/end and
  over ranges. Assert native-equivalent splice text, caret after payload, one
  parseable request, and locale formatting only at commit.
- [ ] `NF-EDIT-09` `[convergence]` `[browser]` —
  **Invalid paste should leave text, selection, controlled state, and callbacks
  unchanged.** Paste letters, conflicting affixes, malformed grouping,
  ambiguous punctuation, and overflow. Assert consumer paste observation
  precedes prevention and no partial mutation escapes.
- [ ] `NF-EDIT-10` `[reference]` `[browser]` —
  **Unreadable clipboard data should fail open without fabricating an edit.**
  Remove clipboardData and make text reads throw in separate fixtures. Assert
  no crash/synthetic text/caret/callback, at most one diagnostic, and original
  browser policy remains authoritative.
- [ ] `NF-EDIT-11` `[vendor]` `[browser:all]` —
  **Synthetic composition should suspend filtering, stepping, and commit until
  its final event.** Dispatch composition start/update with Pinyin/Kana/Indic
  intermediate text plus Enter/arrows. Assert DOM composition events and
  temporary text, no callback/prevented key/formatter replacement, and no
  claim about real OS candidate windows.
- [ ] `NF-EDIT-12` `[vendor]` `[browser]` —
  **A valid synthetic composition result should parse once and an invalid
  result should restore pre-composition text.** End with localized digits and
  prose in reset fixtures. Assert one finite request for valid final text, no
  duplicate from matching input, and no request/stale text for invalid final.
- [ ] `NF-EDIT-13` `[reference]` `[browser]` —
  **Consumer edit handlers should run in native order with cancellation only
  at cancelable boundaries.** Log beforeinput/input/change/paste/composition
  and callback order. Assert prevented beforeinput/paste stops mutation,
  noncancelable input cannot retroactively veto, and NumberField callback is
  last.
- [ ] `NF-EDIT-14` `[reference]` `[browser]` —
  **Rejected live requests should not create a hidden numeric store.** Ignore
  a sequence of parseable requests while continuing edits and cursor moves.
  Assert text/caret remain authored until commit, controlled/hidden/state stay
  prop-based, and later requests derive from current buffer.
- [ ] `NF-EDIT-15` `[vendor]` `[browser:all]` —
  **Deletion around grouping and affixes should preserve a correct editable
  buffer.** Delete individual group/decimal/currency/unit tokens, including
  first digit of `1,024` to `,024`. Assert native caret/text, no spurious
  request for orphan partial, and commit of the unambiguous remainder to `24`.
- [ ] `NF-EDIT-16` `[vendor]` `[browser:all]` —
  **Cut, undo, redo, and ranged replacement should remain browser-native while
  numeric requests follow resulting text.** Exercise each history path around
  localized tokens. Assert native text/selection/history behavior, no canceled
  commands, and callbacks only for newly parseable meanings.
- [ ] `NF-EDIT-17` `[reference]` `[browser]` —
  **A controlled value change during active composition should invalidate the
  session and ignore stale fallout.** Start composition with a selected range,
  rerender a different value, then dispatch old compositionend/input. Assert
  latest formatted text, selection at formatted end, editing cleared, stale
  events ignored, and zero callback.
- [ ] `NF-EDIT-18` `[reference]` `[browser]` —
  **A locale or effective format change during active composition should
  replace from latest controlled state and ignore stale fallout.** Repeat with
  locale, currency, notation, and numbering-system replacements. Assert
  coherent new text/inputMode/selection, no old grammar restoration, editing
  cleared, and zero callback.
- [ ] `NF-EDIT-19` `[reference]` `[browser]` —
  **Focused NumberField Input should leave wheel behavior entirely native.**
  Focus Input inside a scrollable ancestor, attach consumer wheel logs, and
  dispatch vertical, horizontal, Shift, Ctrl/pinch-like, and boundary wheel
  events. Assert Input/consumer receives each native event, defaultPrevented
  remains false, ancestor/page scrolling stays available, and value, callback,
  text, selection, and managed data remain unchanged.

### Commit and controlled request semantics

- [ ] `NF-COMMIT-01` `[convergence]` `[browser:all]` —
  **Blur should commit after the consumer handler and retry a candidate that
  differs from controlled value.** Accept a live candidate but delay its prop
  echo through blur. Assert Input handler first, one commit retry, controlled
  acceptance formatting, focus movement, and no optimistic hidden state.
- [ ] `NF-COMMIT-02` `[vendor]` `[browser:all]` —
  **Enter should commit without moving focus or synthesizing form submission.**
  Type a complete localized value and press Enter. Assert consumer key handler,
  one needed commit request, formatted accepted text, retained focus, and only
  the browser's separate implicit-submit path.
- [ ] `NF-COMMIT-03` `[convergence]` `[browser]` —
  **Invalid or incomplete commit should revert without substituting a numeric
  value.** Commit sign, decimal, exponent, malformed-group, and bad-affix
  partials. Assert zero callback, controlled formatted text/hidden state,
  editing cleared, managed invalid/failed-boundary state set, and repeated
  submits remain blocked. Then make a valid user edit and assert the failed
  boundary clears before a later valid commit/submission.
- [ ] `NF-COMMIT-04` `[reference]` `[browser]` —
  **Empty commit should retry null when controlled value is still non-null.**
  Clear and reject/accept the live null request, then blur/Enter. Assert commit
  retries only while prop differs, acceptance ends dirty state, and rejection
  restores controlled display without duplicate hidden null.
- [ ] `NF-COMMIT-05` `[vendor]` `[browser]` —
  **Snap commit should publish only its final documented candidate.** Commit
  clamp, endpoint, midpoint, lattice, and explicit-rounding vectors. Assert one
  final request when it differs from controlled value and no intermediate
  clamp/snap/round callback.
- [ ] `NF-COMMIT-06` `[reference]` `[browser]` —
  **Validate commit should retain accepted invalid numbers without touching
  native text-input range/step validity.** Commit accepted underflow, overflow,
  and mismatch values. Assert controlled text/hidden value plus managed
  invalid ARIA/data, native rangeUnderflow/rangeOverflow/stepMismatch false,
  and no NumberField customError/message.
- [ ] `NF-COMMIT-07` `[reference]` `[browser]` —
  **Rejected commits should restore controlled state while retaining a failed
  boundary until authoritative resolution.** Reject snap/validate/null
  candidates. Assert formatted controlled text, hidden canonical prop, dirty
  clearing, managed invalid state, and every submit blocked without consuming
  the failure. Resolve in separate runs by accepted commit and authoritative
  value/constraint/format changes; assert only those changes clear it.
- [ ] `NF-COMMIT-08` `[reference]` `[browser]` —
  **Accepted latest echoes should preserve dirty text until an explicit
  commit/revert.** Type alternate textual representations whose callback is
  accepted. Assert exact text/caret/data-editing remains through rerender, then
  canonical formatting and editing clear at commit.
- [ ] `NF-COMMIT-09` `[vendor]` `[browser]` —
  **A no-edit focus/blur cycle should preserve full controlled precision.**
  Render visually rounded high-precision values, focus, and blur. Assert no
  callback, no dirty flag, original hidden number, and unchanged prop-derived
  display.
- [ ] `NF-COMMIT-10` `[reference]` `[browser]` —
  **Canceling blur should retain a dirty session while unfocused and resume it
  on refocus.** Prevent the composed blur default after editing, move focus
  outside, then return. Assert exact dirty text/selection/data-editing survives
  unfocused time, no callback/format reset occurs, and editing resumes.
- [ ] `NF-COMMIT-11` `[reference]` `[browser]` —
  **Out-of-order controlled echoes should never be mistaken for acceptance of
  the latest request.** Issue candidates A then B, rerender A after B, then B
  and an unrelated C in separate schedules. Assert each stale/unrelated prop
  replaces text from actual controlled state, ends the dirty session, ignores
  late events, and emits no programmatic callback.

### Keyboard stepping

- [ ] `NF-KEY-01` `[vendor]` `[browser:all]` —
  **Unmodified Up and Down should request one `step` from current controlled
  state per keydown.** Exercise normal and repeat events with acceptance and
  rejection. Assert exact lattice candidates, prevention, focus retention, no
  hidden accumulation, and outward-boundary no-op.
- [ ] `NF-KEY-02` `[reference]` `[browser:all]` —
  **Shift+Arrow should use the fixed coarse delta `10 * step` on the same
  lattice.** Exercise positive/negative fractional steps from aligned/off-grid
  values. Assert exact directional candidates, drift cleanup, one request, and
  no configurable large-step surface.
- [ ] `NF-KEY-03` `[reference]` `[browser:all]` —
  **Alt-modified arrows should remain completely native and unhandled.** Place
  caret/selections in Input and send Alt+Up/Down. Assert no prevention,
  callback, formatting, hidden/data change, or small-step behavior.
- [ ] `NF-KEY-04` `[convergence]` `[browser]` —
  **Home and End should target supplied bounds only when unmodified and
  present.** Exercise each missing/present bound plus modified keys. Assert
  exact endpoint requests for handled cases and native caret/default behavior
  otherwise.
- [ ] `NF-KEY-05` `[vendor]` `[browser]` —
  **Unsupported and editing keys should remain native.** Exercise horizontal
  arrows, Page keys, Escape, Tab, insert, copy/cut/undo, and shortcuts. Assert
  defaultPrevented false and no callback except a real resulting text edit.
- [ ] `NF-KEY-06` `[vendor]` `[browser]` —
  **A complete dirty candidate should be the base for keyboard stepping.**
  Reject its live request, then Arrow step; repeat from an incomplete partial.
  Assert one stepped dirty candidate with no intermediate raw commit, partial
  fallback to controlled value, dirty-session completion, and controlled
  acceptance/rejection authority.
- [ ] `NF-KEY-07` `[reference]` `[browser]` —
  **Consumer cancellation and noninteractive state should suppress handled
  keyboard work.** Prevent normal/Shift/Home/End/Enter, then repeat while
  disabled/read-only/composing. Assert consumer-first order, no request/state
  mutation, disabled focus rules, and native composition behavior.

### Increment, Decrement, repeat, and touch cancellation

- [ ] `NF-STEP-01` `[reference]` `[browser]` —
  **Named steppers should control the real Input without adding a tab stop.**
  Render label/labelledby variants with explicit/generated IDs. Assert exact
  accessible names, resolving `aria-controls`, native button role/type,
  `tabIndex=-1`, and no locale-driven name mutation.
- [ ] `NF-STEP-02` `[vendor]` `[browser:all]` —
  **Native, keyboard, virtual, and programmatic click should perform exactly
  one step.** Activate each button without owned pointerdown using unmodified,
  Shift, and Alt events and accept. Assert one current `step` callback normally
  and with Alt, one `10 * step` callback with Shift, canonical display, and no
  pointer-only dependency, extra lattice, or form submission.
- [ ] `NF-STEP-03` `[vendor]` `[browser:all]` —
  **Primary pointerdown should step immediately without a compatibility-click
  duplicate.** Press/release each button with and without Shift and let click
  fire. Assert one immediate `step`/`10 * step` request respectively, exact
  direction, pressed lifetime, initiating modifier retained for hold, focus
  policy, and no second callback.
- [ ] `NF-STEP-04` `[vendor]` `[browser]` —
  **The first hold repeat should occur exactly at 400ms.** After immediate
  step, advance fake/browser time to 399ms and then 400ms. Assert no repeat at
  399, exactly one at 400, current controlled base, and no timer drift.
- [ ] `NF-STEP-05` `[vendor]` `[browser]` —
  **Subsequent hold repeats should occur exactly every 60ms.** Continue the
  same hold from 400 to 459 and 460ms, then later intervals. Assert no new
  callback at 459, one at 460, one per 60ms thereafter, and cleanup on release.
- [ ] `NF-STEP-06` `[reference]` `[browser]` —
  **Pointer cancel and lost capture should terminate repeat independently.**
  Trigger each after immediate/first repeat. Assert timer and pressed state
  clear, compatibility click is suppressed, and late ticks/events do nothing.
- [ ] `NF-STEP-07` `[reference]` `[browser]` —
  **Pointer leave should end the repeat session rather than pause it.** Leave
  before and after the first repeat and wait. Assert pressed/timer cleanup and
  no outside callback.
- [ ] `NF-STEP-08` `[reference]` `[browser]` —
  **Pressed re-entry should step immediately and start a fresh 400ms delay.**
  Re-enter with the same primary pointer down after leave, then inspect 399,
  400, 459, and 460ms from re-entry. Assert immediate step, first new repeat at
  400, next at 460, and no resumed old 60ms cadence.
- [ ] `NF-STEP-09` `[vendor]` `[browser]` —
  **Secondary and auxiliary pointer buttons should remain native and never
  start stepping.** Send each pointer button/context path. Assert no
  prevention, pressed data, timer, focus move, or numeric callback.
- [ ] `NF-STEP-10` `[convergence]` `[touch]` —
  **A stationary quick touch or pen activation should produce one step without
  compatibility duplication.** Dispatch pointer/touch/click sequences and
  assert one callback, no post-release timer, and that NumberField itself
  issues no forced Input/button focus call or focus event. Actual device focus
  and software-keyboard outcomes remain exclusively `NF-MANUAL-03`.
- [ ] `NF-STEP-11` `[vendor]` `[browser]` —
  **Stepper capability should follow controlled or complete dirty state,
  bounds, root state, and authored disabled.** Traverse null/middle/endpoints,
  off-range, dirty complete/partial, disabled/read-only, and part-disabled
  states. Assert exact native/ARIA/data disabled state and atomic recovery.
- [ ] `NF-STEP-12` `[vendor]` `[browser]` —
  **A stepper should step a complete dirty candidate without an intermediate
  commit.** Reject the live edit, activate each direction, and assert one
  stepped candidate, no raw candidate callback, and controlled formatting.
- [ ] `NF-STEP-13` `[reference]` `[browser]` —
  **NumberField state changes and bounds should terminate active repeat as
  independent cleanup branches.** During separate holds toggle
  disabled/read-only, change value to the bound, and disable the pressed part.
  Assert immediate timer/pressed cleanup, no late callback, and fresh action
  required after recovery.
- [ ] `NF-STEP-14` `[reference]` `[browser]` —
  **Removal, unmount, and owner-window blur should terminate active repeat as
  independent cleanup branches.** Remove the pressed part/Input, unmount root,
  blur/replace the owner window in reset fixtures. Assert listener/capture/
  timer cleanup, no stale callback, and no cross-document leak.
- [ ] `NF-STEP-15` `[reference]` `[touch]` —
  **Touch movement, scroll intent, and pinch should cancel repeat without
  suppressing the platform gesture.** After the immediate touch/pen step, move
  exactly 8 CSS pixels and then greater than 8, start scrolling, or add a
  second pointer. Assert exactly 8 retains the session, each larger/scroll/
  pinch branch clears repeat/pressed state while suppressing any compatibility
  click, no further value request occurs, and movement/scroll/pinch events
  remain uncanceled.

### Form serialization, managed numeric validity, submit, and reset

- [ ] `NF-FORM-01` `[convergence]` `[browser]` —
  **Visible localized text and canonical hidden form value should remain
  separate.** Render named decimal/currency/percent/unit/scientific/null
  fields. Assert visible Input has no name, one hidden canonical string exists,
  and no raw dirty/localized text or hidden number proxy is serialized.
- [ ] `NF-FORM-02` `[vendor]` `[browser:all]` —
  **Clean forms should submit only accepted controlled numeric state.** Submit
  supported formats and inspect real FormData. Assert one canonical pair per
  name, identical numeric serialization across engines, and no formatting
  affix/group/digit leakage.
- [ ] `NF-FORM-03` `[reference]` `[browser]` —
  **Disabled, read-only, dynamic name, and external same-root form association
  should follow the frozen policy.** Toggle each state/association. Assert
  disabled omission, read-only canonical submission without numeric blocking,
  current form/name only, managed validity inspection, and no callback.
- [ ] `NF-FORM-04` `[vendor]` `[browser]` —
  **Native required should retain platform valueMissing behavior.** Submit
  clean/dirty null and then accepted nonempty values. Assert native `required`,
  valueMissing/focus/invalid event and blocked empty submission, then one valid
  payload without NumberField custom validity.
- [ ] `NF-FORM-05` `[reference]` `[browser:all]` —
  **Managed numeric constraint failures should block submit without changing
  native text-input validity flags.** Submit accepted underflow, overflow, and
  off-step values in validate mode, then submit a numerically valid field with
  application `invalid={true}`. Assert only numeric-constraint failures add
  NumberField prevention and managed invalid data/ARIA; application invalid
  alone submits normally. Native rangeUnderflow/rangeOverflow/stepMismatch/
  customError stay false and no validation proxy exists.
- [ ] `NF-FORM-06` `[reference]` `[browser]` —
  **Programmatic requestSubmit should process a still-dirty complete candidate
  and require explicit retry.** Keep a snap candidate dirty/not accepted and
  call `requestSubmit()`. Assert one final commit request, prevented first
  submit, controlled hidden value, no auto-resubmit, then accepted canonical
  payload only after explicit retry.
- [ ] `NF-FORM-07` `[reference]` `[browser]` —
  **Programmatic requestSubmit should block incomplete dirty text without a
  numeric substitute.** Leave sign/exponent/group/overflow partials and call
  `requestSubmit()` repeatedly. Assert the field processes once per attempt,
  submission remains prevented, managed invalid/failed-boundary state and
  focus target correction persist without consumption, no numeric callback
  fires, and hidden state remains controlled.
- [ ] `NF-FORM-08` `[reference]` `[browser]` —
  **Programmatic reset while focused should clear transient state without
  blurring or changing controlled value.** Call `form.reset()` during dirty
  valid/partial/failed states, then repeat with reset prevented in application
  capture. Assert unprevented reset shows latest controlled formatted text,
  retains focus with caret at formatted end, clears editing/owned-invalid/
  failed-boundary/pressed state, keeps hidden state, and emits no callback;
  canceled reset leaves the focused dirty or failed session exactly intact.
- [ ] `NF-FORM-09` `[convergence]` `[browser]` —
  **Autofill-equivalent input/change events should follow ordinary public edit
  and commit rules.** Dispatch canonical/localized event sequences to Input and
  accept/reject callbacks. Assert visible parsing, callback order, controlled
  hidden updates, and no hidden-input focus; this is not a genuine autofill
  claim.
- [ ] `NF-FORM-10` `[reference]` `[browser]` —
  **Application custom validity should survive every NumberField update
  untouched.** Set a message through Input ref, then edit, commit, change
  bounds/format/value, submit numeric-invalid state, and reset. Assert exact
  customError/message remains until the application clears it and NumberField
  never calls, composes, replaces, or clears it.
- [ ] `NF-FORM-11` `[reference]` `[browser]` —
  **Clicking submit after an incomplete or unaccepted blur commit should block
  stale controlled serialization.** Click a submit button from focused dirty
  partial and complete fixtures. Assert blur runs first, failed/pending commit
  records its boundary, ensuing submit is prevented, old hidden value does not
  escape, and repeated click/requestSubmit attempts remain blocked without
  consuming failed state. Assert submission succeeds only after a subsequent
  valid user edit/accepted commit, an authoritative programmatic
  value/constraint/effective-format change, or an unprevented reset clears the
  boundary.
- [ ] `NF-FORM-12` `[reference]` `[browser]` —
  **Implicit Enter after an incomplete or unaccepted key commit should block
  stale controlled serialization.** Press Enter in focused dirty fixtures.
  Assert key commit precedes native implicit submit, failed/pending status
  blocks it and sets managed invalid state, repeated Enter/submit attempts
  remain blocked without consumption, no stale FormData appears, and
  NumberField synthesizes no second submit. Resolve with a valid accepted edit
  and assert the boundary/invalid state clears before successful submit.
- [ ] `NF-FORM-13` `[reference]` `[browser]` —
  **All dirty NumberFields should process the same submit even when it is
  already prevented.** Put two dirty fields in one form, let the first field
  and then an application capture handler prevent in separate runs. Assert
  both fields independently commit/mark invalid once, callback order is
  deterministic, no short-circuit on defaultPrevented occurs, and no payload
  escapes.
- [ ] `NF-FORM-14` `[reference]` `[browser]` —
  **Clicked reset should apply blur before reset and cancellation should not
  resurrect the pre-blur buffer.** Click reset from dirty Input under accepted,
  rejected, incomplete, and canceled reset runs. Assert blur commit/revert
  first, unprevented reset clears remaining transient/failed-boundary state,
  canceled reset preserves post-blur failed state, and no old dirty text
  returns.

### Accessibility and managed semantics

- [ ] `NF-A11Y-01` `[convergence]` `[browser:all]` —
  **Input should expose an accessible named textbox rather than a spinbutton.**
  Name via label/aria-label/labelledby and inspect DOM/accessibility tree.
  Assert textbox role/name/focus/text value and absence of spinbutton/numeric
  value ARIA without claiming spoken output.
- [ ] `NF-A11Y-02` `[reference]` `[browser]` —
  **An unnamed Input should diagnose without inventing application label
  markup.** Render unnamed then repair with external label. Assert one
  descriptive diagnostic, no hidden label, Group name not substituted, and
  repaired public accessible name.
- [ ] `NF-A11Y-03` `[vendor]` `[browser]` —
  **Disabled, read-only, required, and invalid semantics should appear only on
  supported roles.** Toggle each state and runtime-cast conflicts. Assert
  Input alone exposes native readOnly/required, Group always omits unsupported
  aria-readonly/aria-required while exposing data-readonly/data-required plus
  managed aria-disabled/invalid, and steppers expose native/ARIA-disabled but
  no read-only/required/checked/pressed/value ARIA.
- [ ] `NF-A11Y-04` `[reference]` `[browser]` —
  **Authored descriptions and error relationships should survive managed
  validity changes.** Replace multiple described/error IDs through valid and
  invalid states. Assert exact relationships, no stale/duplicate token,
  managed aria-invalid changes, and no generated product error content.
- [ ] `NF-A11Y-05` `[reference]` `[browser]` —
  **Group focus state should track the single Input tab stop without adding
  stepper tab stops.** Enter by keyboard/pointer/programmatic focus and
  activate steppers. Assert actual focus-within/focus-visible data, one tab
  stop, `tabIndex=-1` steppers, and DOM focus behavior only.
- [ ] `NF-A11Y-06` `[reference]` `[browser]` —
  **The invalid prop should remain an ARIA/style signal without altering
  native validity or form policy.** Toggle it around valid/managed-invalid
  numbers. Assert unioned data/ARIA, false cannot hide owned failure, no
  customError/message/range flag, and a numerically valid field submits with
  `invalid={true}`. Assert only independent numeric/required/application
  custom-validity/dirty/pending/rejected/failed branches block, with preserved
  styling/descriptions.

### Field surface

- [ ] `NF-SURF-01` `[reference]` `[browser]` —
  **Group should consume the Field recipe on its own group node.**
  Mount NumberField with Group, Input, and steppers, no `<Field>`. Assert
  exactly one `div[role="group"][data-reference-field]`, no nested Field,
  Input in embedded mode, `status="warning"` sets `data-status="warning"`
  without `aria-invalid`, omitted status leaves the attribute unset, and
  StyleProps on Group change padding/radius while role and the marker
  remain. Matching default/focus/invalid/warning/disabled/read-only
  chrome against Field is `FI-SURF-01`; this case owns Group's host
  contract.

### Dynamic props and interaction replacement

- [ ] `NF-DYNAMIC-01` `[reference]` `[browser]` —
  **Latest accepted echo, stale echo, and unrelated value replacement should
  have distinct dirty-session outcomes.** Schedule each during editing and
  assert latest echo preserves text/editing, stale/unrelated props replace
  text/end selection and clear editing, and no programmatic callback fires.
- [ ] `NF-DYNAMIC-02` `[vendor]` `[browser]` —
  **Locale and effective format changes should atomically replace parser,
  formatter, grammar, and inputMode.** Rerender decimal/currency/percent/RTL/
  scientific formats. Assert same-node coherent text, accepted tokens,
  inputMode, hidden value, validity, and no stale callback.
- [ ] `NF-DYNAMIC-03` `[reference]` `[browser]` —
  **Bounds, step, and commit-policy changes should atomically revalidate
  controlled state and stepper capability.** Change valid then invalid
  configurations. Assert exact managed state/directions with no normalization
  callback and property-specific failure before mixed output.
- [ ] `NF-DYNAMIC-04` `[reference]` `[browser]` —
  **Optional steppers and arbitrary siblings should insert, remove, and reorder
  without replacing Input.** Mutate keyed children around focused dirty Input.
  Assert Input/caret identity, current controls/ref cleanup/order, sibling
  independence, and no stale listener/request.
- [ ] `NF-DYNAMIC-05` `[reference]` `[browser]` —
  **Interactive replacement should cancel pending key, repeat, composition,
  and failed-submit work.** Disable/read-only, remove parts, change owner root,
  or replace controlled state during each interaction. Assert cleanup, stale
  event suppression, native focus rules, and a fresh action requirement.

### SSR, React, direction, Shadow DOM, and browser engines

- [ ] `NF-ENV-01` `[reference]` `[ssr]` —
  **Supported matching Intl/ICU server and client environments should hydrate
  byte-identical text and managed attributes.** Server-render matrix locales/
  formats then hydrate with matching data. Assert no warning/node replacement,
  exact value/inputMode/data/hidden state, and no callback.
- [ ] `NF-ENV-02` `[reference]` `[ssr]` —
  **Different Intl/CLDR data should be reported as an unsupported deployment
  mismatch rather than promised identical.** Stub a known spacing/glyph
  difference across server/client. Assert compatibility diagnostic and no
  contract claim that arbitrary ICU versions produce equal bytes.
- [ ] `NF-ENV-03` `[reference]` `[ssr]` —
  **Generated IDs should be stable and unique within one React root.** Render/
  hydrate multiple fields in one root and assert unique stable Input IDs plus
  exact stepper controls with no callback.
- [ ] `NF-ENV-04` `[reference]` `[ssr]` —
  **Independent SSR roots should require distinct identifierPrefix values or
  explicit Input IDs.** Hydrate roots with/without those protections. Assert
  protected relationships are unique/stable and unprotected collision gets a
  diagnostic rather than impossible global-uniqueness promise.
- [ ] `NF-ENV-05` `[reference]` `[browser]` —
  **React 17, 18, 19, and StrictMode should not duplicate edits, callbacks,
  listeners, diagnostics, or timers.** Run representative mount/edit/hold/
  unmount flows per supported harness and assert one observable action and
  complete cleanup.
- [ ] `NF-ENV-06` `[reference]` `[shadow]` —
  **Open ShadowRoot operation should scope focus, IDs, listeners, and same-root
  forms to the owner root.** Edit/step/submit/reset two fields inside a shadow
  form. Assert shadow activeElement, local relationships, canonical payload,
  and no document-global lookup.
- [ ] `NF-ENV-07` `[convergence]` `[browser:all]` —
  **Automated mobile coverage should assert only grammar-derived inputMode
  attributes.** Render validate min-zero, snap negative, snap nonnegative
  integer, snap nonnegative fraction, and scientific/engineering fixtures.
  Assert exact `text`, `text`, `numeric`, `decimal`, and `text` attributes
  respectively from public grammar, stable SSR markup, and no assertion about
  keyboard keys, visibility, or reopening.

## Composition gates

- [ ] `NF-COMP-01` `[reference]` `[browser]` —
  **A quantity NumberField should compose integer bounds, named steppers,
  controlled rejection, reset, and forms without extra state.** Build
  `0..100,step=1`, type/step/hold to bounds, reject one request, reset, and
  submit. Assert one numeric authority, exact labels, lattice, cleanup, and
  canonical payload.
- [ ] `NF-COMP-02` `[reference]` `[browser]` —
  **A localized currency NumberField should compose precision, non-Latin
  input, dirty submit, and authored labels.** Build two-digit currency with
  `step=0.05`, edit/paste/step, change locale, and submit. Assert public
  round-trip text, exact numeric requests, stable labels, and canonical form.
- [ ] `NF-COMP-03` `[reference]` `[browser]` —
  **A percent NumberField should type `12.5%` only with explicit fractional
  grammar and compatible step.** Configure percent with fraction digits and
  `step=0.005`, type localized `12.5%`, accept `0.125`, Shift-step, reject/
  accept, and submit. Assert decimal inputMode where applicable, one lattice,
  canonical fractional payload, and no display-rounding inference.
- [ ] `NF-COMP-04` `[reference]` `[shadow]` —
  **A scientific unit NumberField should compose validate mode, RTL, Shadow
  DOM, and programmatic replacement without custom parsing.** Edit exponent
  partials, accept off-step invalid value, replace locale/value during
  composition, reset, and submit. Assert public formatting, stale-event
  suppression, managed validity, local relationships, and no internal import.

## Manual release gates

- [ ] `NF-MANUAL-01` `[reference]` `[manual]` `[release]` —
  **Real VoiceOver and NVDA should reach, name, edit, and activate the frozen
  textbox/button anatomy without a spinbutton recast.** On supported macOS/
  iOS VoiceOver and Windows NVDA/browser pairs, verify navigation, focus,
  authored names, edit feedback, and stepper activation. Record platform/
  version results; automated DOM/accessibility-tree checks do not substitute.
- [ ] `NF-MANUAL-02` `[reference]` `[manual]` `[release]` —
  **Real OS IMEs should preserve candidate composition and commit localized
  numeric results without premature filtering.** Verify supported Pinyin,
  Japanese, Korean, and Indic IMEs, including prop replacement mid-composition.
  Record candidate-window, selection, final text, callback, and stale-event
  outcomes separately from synthetic composition automation.
- [ ] `NF-MANUAL-03` `[reference]` `[manual]` `[release]` —
  **Real iOS and Android keyboards should expose usable characters for each
  inputMode grammar and retain expected focus around touch steppers.** Check
  validate negatives, snap integer/fraction, and exponent fixtures on supported
  devices. Record actual keys/layout/open/close behavior; automation asserts
  attributes only.
- [ ] `NF-MANUAL-04` `[reference]` `[manual]` `[release]` —
  **Genuine browser autofill should enter visible Input and follow controlled
  commit/form authority without targeting the hidden canonical input.** Run
  supported browser/profile autofill with saved numeric data and record target,
  event order, visible text, callback, commit, and payload. Synthetic
  input/change coverage remains only an autofill-equivalent regression.

## Vendor coverage closure

- React Spectrum component tests are ported/merged across `NF-DOM-*`,
  `NF-EDIT-*`, `NF-FORMAT-*`, `NF-KEY-*`, `NF-STEP-*`, `NF-FORM-*`, and
  compositions. Slots, render props, Provider/Field anatomy, uncontrolled
  values, exact announcer/validation prose, and hidden-number validation are
  deliberately left or owned elsewhere.
- React Aria hook tests are ported through public anatomy/event/accessibility
  cases; hook return objects and direct hook invocation are deliberately left.
- React Stately format-option stability is ported by `NF-FORMAT-03..04`;
  state setters and uncontrolled defaults are deliberately left.
- Base UI root/type/input suites are ported across public type, parser, edit,
  commit, key, form, dynamic, and environment cases. Reason objects,
  `cancel()`, polymorphism, uncontrolled values, Field validation framework,
  hidden-number proxy, wheel, custom step families, and ScrubArea are
  deliberately left.
- Base UI increment/decrement suites are ported across `NF-MATH-*`,
  `NF-KEY-*`, and `NF-STEP-*`. Release callbacks, custom repeat options,
  uncontrolled mirrors, and render-state functions are deliberately left.
- Base UI parse/validate utility suites are ported as public-component vectors
  in `NF-PARSE-*`, `NF-FORMAT-*`, and `NF-MATH-*`; no helper import or
  test-only export survives.
- Zag cursor tests are ported through `NF-EDIT-06..07` and replacements.
  Spinbutton, machine/service getters, wheel, and ScrubArea are deliberately
  left/deferred.

## Owned elsewhere

- Generic native prop/StyleProps/ref merge and callback-ref cleanup: generated
  primitives plus applicable universal `PART-*` cases.
- Labels, descriptions, product error content, translations, and application
  custom validity: application HTML/ARIA/form APIs.
- Generic focus-visible detection: shared interaction kernel; NumberField
  proves only Group integration.
- Native text selection/history, clipboard dispatch, form event order, and
  browser accessibility-tree computation: platform behavior at the documented
  NumberField boundary.
- Continuous value dragging and geometry: Slider, not NumberField.
- Shared announcements: ReferenceLibrary/announce(), not a private live region.
- Visual bezel recipe: `Field` (`FI-SURF-01`). Group consumes it as a
  Field-surface host (`NF-SURF-01` / `FI-COMP-03`); wrapping Group in
  Field is application double chrome.

## Deliberately left and out of scope

- `smallStep`, `largeStep`, configurable coarse/fine steps, and Alt stepping:
  one public lattice prevents interactions from creating values invalid under
  another step.
- Wheel stepping: accidental changes are high risk, and consumer-first
  cancellation cannot be reconciled with reliable scroll prevention through
  React's passive delegated wheel listener.
- ScrubArea, pointer lock, acceleration, virtual cursor graphics, and global
  selection suppression.
- Uncontrolled/default values, raw text/commit callbacks, reason details,
  imperative methods, parser/formatter functions, Provider/Field contracts,
  render props, and polymorphic hosts.
- Native number inputs/proxies, native range/step validity flags, NumberField
  custom validity, `step="any"`, and interception of legacy `form.submit()`.
- Unsupported algorithmic numbering systems, arbitrary precision/bigint,
  expressions, compact/hidden-sign editing, locale guessing, malformed-input
  recovery, and cross-ShadowRoot form association.
- Automatic label translation and English fallback stepper names.
- Automated claims about AT speech, OS IME candidate windows, software
  keyboards, touch keyboard visibility, or genuine autofill; manual gates own
  them.

## Revision ID map

- Added: `NF-DOM-09`, `NF-PARSE-16..19`, `NF-MATH-15`,
  `NF-EDIT-15..19`, `NF-COMMIT-11`, `NF-STEP-13..15`,
  `NF-FORM-11..14`, `NF-MANUAL-01..04`, and `NF-SURF-01`.
- Removed: `NF-FORMAT-09..10`, `NF-KEY-08`, `NF-WHEEL-01..06`, and
  `NF-A11Y-07`.
- Renamed IDs: none. Existing retained IDs were rewritten where settled
  behavior changed; the public root itself was renamed from
  `NumberField.Root`/`NumberFieldRootProps` to
  `NumberField`/`NumberFieldProps`.

## Manufacturing gate

1. All 144 automated cases import only required public exports from
   `@reference-ui/lib`; repository search finds no NumberField helper/test-only
   import.
2. All public type/runtime managed-prop, accessible-name, and anatomy cases
   pass for the root and four parts.
3. Public DOM-light parser/format/math vectors pass for the supported Intl/ICU
   matrix, including Devanagari/Bengali, Indian grouping, plural affixes,
   non-grid endpoints, and the seeded 2,000-plus public round-trip matrix.
4. Browser cases pass for event order, selection, pointer timing/cleanup,
   composition replacement, submit/reset, validity, forms, and accessibility
   semantics in Chromium, Firefox, and WebKit where tagged.
5. Numeric constraints never mutate custom validity, native text-input
   range/step flags remain false, and application `invalid` alone never blocks
   form submission.
6. No public wheel, small/large-step, Root-alias, fallback-name, hidden-number,
   or impossible cross-root/ICU surface remains in declarations, fixtures, or
   generated output; `NF-EDIT-19` proves native wheel pass-through and
   deliberate omissions remain documented as rationale.
7. The four manual release gates have recorded results for supported release
   platforms; they are not silently replaced by automation.
8. Duplicate-ID and whitespace/diff checks pass before manufacture.

There is no unresolved API decision in this revision. Any contradiction between
the snap order, dirty-session authority, managed validity, multi-field submit,
composition replacement, repeat timing, inputMode grammar, or SSR scope is a
manufacturing blocker and must reopen this contract rather than be waived.

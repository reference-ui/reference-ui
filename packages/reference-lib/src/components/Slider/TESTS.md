# Slider test contract

Playwright: `matrix/lib/tests/e2e/slider.spec.ts`  
Unit: `matrix/lib/tests/unit/slider.test.ts`
Page: `/slider`

Slider owns scalar/range value geometry, controlled changes, pointer capture,
keyboard stepping, neighbor clamping, interaction-end requests, and slider
ARIA. It renders no form inputs.

## Freeze decisions

- Defaults are `min=0`, `max=100`, `step=1`,
  `minStepsBetweenThumbs=0`, horizontal orientation, and enabled interaction.
- Page step is the smallest whole number of normal steps greater than or equal
  to one tenth of the range (and therefore at least one step).
- Thumb order and identity are preserved. `minStepsBetweenThumbs` is a
  nonnegative integer multiplied by `step`; its default zero lets neighboring
  Thumbs meet, but Thumbs never cross, swap, or push one another.
- Track press moves the nearest movable thumb; ties choose the most recently
  active thumb, then the lower DOM index.
- `onChange` requests each changed candidate. `onChangeEnd` receives the last
  requested candidate once after a successful pointer release or keyboard
  keyup. Repeated keydowns are one interaction; canceled sessions,
  programmatic updates, and no-op input emit no end request.

## Geometry styling contract

Each Thumb exposes `--reference-slider-thumb-position`; Range exposes
`--reference-slider-range-start`/`-end`. Values are clamped percentages with a
`%` unit. Root/parts expose exact orientation/disabled/dragging data state.
Internal geometry never overwrites consumer transforms or other native styles.

## Source evidence

- `vendor/react-spectrum/packages/react-aria/test/slider/{useSlider,useSliderThumb}.test.js`
  — labels/ARIA, drag geometry, vertical/RTL keys, bounds, and multiple thumbs.
- `vendor/radix-primitives/packages/react/slider/src/slider.test.tsx` and
  `slider.tsx` — aligned stepping, scientific/fractional precision, Page keys,
  preserve-order collision, `minStepsBetweenThumbs * step`, stable refs, and
  commit contrast.
- `vendor/base-ui/packages/react/src/slider/{root,thumb,control,utils}/*.test.*`
  — pointer grab offset, track press, controlled out-of-range values, stacked
  thumb choice, pointer release, cancellation, and collision algorithms.
- Zag Slider — thumb drag offset and orientation/direction geometry.

Universal `PART-TYPE-01` and `PART-STYLE-01` cover the complete
`ReferencePartProps` native/StyleProps intersection for Root, Track, Range, and
Thumb. Slider-specific type cases below cover only behavior-prop conflicts and
validation, without repeating the universal StyleProps matrix.

## Required cases

### Public type and part integration

- [x] `SD-TYPE-01` `[reference]` `[unit]` —
  **Slider should preserve behavior-prop types when ReferencePartProps also supplies StyleProps.**
  Compile Root with `min={0}`, `max={100}`, `step={0.25}`,
  `minStepsBetweenThumbs={3}`, `orientation="vertical"`, `disabled={false}`,
  `onChangeEnd={(value: number | number[]) => void value}`,
  `minWidth="20r"`, `css={{ opacity: 0.5 }}`, and
  `r={{ 320: { minWidth: "30r" } }}`; assert each behavior key retains its
  documented number, union, or boolean type without an impossible intersection
  or duplicate JSX property.
  Add `@ts-expect-error` fixtures for `minStepsBetweenThumbs="3"`, an array,
  and a bigint, while leaving generic native, ref, responsive, and computed
  StyleProps coverage to the universal PART cases.

### DOM, parts, state, and ARIA

- [x] `SD-DOM-01` `[reference]` `[browser]` —
  **Slider should render only documented non-form parts when mounted inside a form.**
  Render a scalar Slider in a named form and assert Root, Track, and Range are
  `div`, its only Thumb is `div[role="slider"]`, and no wrapper, extra Thumb,
  `input`, or other hidden control exists.
  Submit and reset the form and assert its `FormData` contains no Slider value,
  the controlled value remains unchanged, and no Slider callback fires because
  form wiring is deliberately application-owned.
- [x] `SD-DOM-02` `[vendor]` `[browser]` —
  **Slider should publish global and neighbor ARIA bounds when multiple Thumbs render.**
  Render `min=0`, `max=100`, and `value={[20, 70]}`; assert the first Thumb has
  `aria-valuenow="20"`, min `0`, max `70`, and the second has value `70`, min
  `20`, max `100`, then update to `[0, 70]` and prove the zero neighbor remains
  the second Thumb's real minimum.
  This ports `vendor/react-spectrum/packages/react-aria/test/slider/useSliderThumb.test.js`
  “should have the right labels with Slider thumb aria-label” and the zero
  regression in Base UI `getSliderValue.test.ts`.
- [x] `SD-DOM-03` `[reference]` `[browser]` —
  **Slider should preserve consumer DOM props when interaction state changes.**
  Add native `data-owner`, classes, transforms, colors, event handlers, and
  refs to Root, Track, Range, and Thumb, then start/end a drag and toggle
  `disabled`; assert authoritative orientation/disabled/dragging data
  attributes update on their documented parts while every unrelated prop,
  style, handler, and native-element ref survives.
  Internal state hooks must augment rather than replace application geometry
  or cause a ref-driven render loop.
- [x] `SD-DOM-04` `[vendor]` `[browser]` —
  **Slider should preserve application-provided accessible names and value text when Thumbs render.**
  Give separate Thumbs `aria-label="Minimum price"` and
  `aria-labelledby="maximum-label"`, add `aria-valuetext="$20"`/`"$70"`, and
  assert those exact attributes stay on the matching `div[role="slider"]`
  before and after values change.
  This ports the ARIA forwarding matrix in
  `vendor/base-ui/packages/react/src/slider/thumb/SliderThumb.test.tsx`
  “forwards aria-label/aria-labelledby/aria-valuetext to the input,” adapted to
  Reference UI's fixed div host without guessing text from visual children.
- [x] `SD-DOM-05` `[reference]` `[browser]` —
  **Slider should diagnose a value-to-Thumb count mismatch when interaction would otherwise begin.**
  Render a scalar with zero or two Thumbs, an array `[20, 80]` with one or
  three Thumbs, and then press the unmatched Thumb; assert a descriptive
  scalar/array count-and-order error, no `onChange`, and no ARIA or CSS property
  ever contains `NaN`.
  This makes executable the regression
  `vendor/base-ui/packages/react/src/slider/thumb/SliderThumb.test.tsx` “does
  not commit NaN when more thumbs are rendered than values.”
- [x] `SD-DOM-06` `[vendor]` `[browser]` —
  **Slider should span the Range between the correct controlled endpoints when axis direction varies.**
  With `min=0`, `max=100`, assert scalar `value=30` publishes Range endpoints
  from min to `30%`, and `[20, 70]` publishes first-to-last endpoints; repeat
  horizontal LTR, horizontal RTL, and vertical fixtures and verify computed
  Range geometry follows the documented axis direction.
  This ports the scalar/range positioning checks in Base UI
  `SliderRoot.test.tsx` and React Aria `useSlider.test.js` without taking their
  hidden input or styling anatomy.
- [x] `SD-DOM-07` `[reference]` `[browser]` —
  **Slider should remain value-stable when the whole control is disabled.**
  Render `disabled` with controlled `[20, 80]`, assert both Thumbs expose
  `aria-disabled="true"` and the documented `data-disabled`, then try focus,
  handled keys, Track press, and Thumb drag and assert no `onChange` while ARIA
  values and geometry remain `[20, 80]`.
  This freezes a single Root-level disabled policy rather than Base UI's
  additional per-thumb disabled surface.
- [x] `SD-DOM-08` `[reference]` `[browser]` —
  **Slider should keep every Thumb reachable when keyboard focus and overlapping pointer order are exercised.**
  Tab through `[20, 20, 70]` and assert focus visits all three Thumbs in
  DOM/value order, then activate the second overlapping Thumb, move focus
  outside, and pointer-press the stack to assert the same logical Thumb is
  chosen without changing DOM order, labels, or refs.
  This adapts `vendor/base-ui/packages/react/src/slider/thumb/SliderThumb.test.tsx`
  “keeps the most recently active thumb on top after focus moves away” to the
  frozen active/index tie rule.
- [x] `SD-DOM-09` `[reference]` `[browser]` —
  **Slider should update frozen percentage hooks when controlled values change.**
  With `min=10`, `max=110`, render scalar `value=60` and range
  `value={[30, 90]}`; assert Thumb positions are exactly `50%`, `20%`, and
  `80%` and Range start/end match, then rerender new values and assert all
  properties change in one frame while consumer `position`, `transform`, and
  custom properties remain untouched.
  Percentage-only output is the public geometry contract, so tests must not
  infer private `left`, `top`, or transform styles.
- [x] `SD-DOM-10` `[vendor]` `[browser]` —
  **Slider should synchronize Thumb orientation ARIA when Root orientation changes.**
  Render `[25, 75]` horizontally, then rerender vertically and assert every
  Thumb changes `aria-orientation` exactly from `horizontal` to `vertical`,
  Root/part orientation hooks agree, values and labels remain paired, and no
  `onChange` fires.
  This ports `vendor/base-ui/packages/react/src/slider/root/SliderRoot.test.tsx`
  “sets the aria-orientation attribute.”
- [x] `SD-DOM-11` `[reference]` `[browser]` —
  **Slider should apply deterministic enabled horizontal defaults when optional behavior props are omitted.**
  Render `value=50` without `min`, `max`, `step`, `orientation`, or `disabled`
  and assert ARIA bounds `0`/`100`, horizontal hooks, enabled interaction, and
  ArrowRight requesting `51`; repeat explicit `undefined` and assert identical
  observables.
  Concrete defaults prevent `0`, `false`, and `undefined` from being conflated
  by truthiness.
- [x] `SD-DOM-12` `[reference]` `[browser]` —
  **Slider should reject incomplete structural anatomy when required parts are missing or duplicated.**
  Try zero/two Tracks, two Ranges, a Thumb outside the value-matched sequence,
  and missing Track with otherwise valid `value`; assert a descriptive anatomy
  error and no partial pointer surface, capture, document listener, or ARIA
  slider remains.
  A malformed visible composition must fail before it can initiate a drag
  against an undefined rectangle.
- [x] `SD-A11Y-01` `[reference]` `[browser]` —
  **Slider should pass accessibility checks when labeled scalar and range variants are rendered.**
  Run the checker on labeled scalar, separately labeled two-Thumb range,
  disabled, vertical, and inherited-RTL fixtures, first asserting each Thumb's
  exact role, name, orientation, value, and neighbor bounds.
  Automated checks supplement the real keyboard/pointer assertions and must
  not substitute for platform assistive-technology activation.

### Numeric model

- [x] `SD-MATH-01` `[reference]` `[unit]` —
  **Slider should reject invalid numeric configuration when its model is created or updated.**
  Apply omitted defaults, then separately pass `NaN`, infinities, non-finite
  values, `min=10,max=10`, `min=20,max=10`, `step=0`, and `step=-1`; assert a
  descriptive property-specific diagnostic and no returned percentage or
  request containing `NaN`.
  Early validation keeps malformed controlled input from reaching browser
  geometry or ARIA.
- [x] `SD-MATH-02` `[vendor]` `[unit]` —
  **Slider should clamp and snap interaction results when the step grid is anchored at min.**
  For `min=6`, `max=108`, and `step=10`, map proposed values `-20`, `55`, `103`,
  and `200` and assert results `6`, `56`, `106`, and `106` according to the
  frozen bound rule, never a grid anchored at zero.
  This ports Base UI `SliderRoot.test.tsx` “should reach right edge value” and
  “should use min as the step origin.”
- [x] `SD-MATH-03` `[vendor]` `[unit]` —
  **Slider should move to the adjacent aligned value when a controlled value starts off grid.**
  With `min=1000`, `max=100000`, `step=5000`, and value `49000`, assert one
  increase produces `51000`, a second `56000`, and a fresh one-step decrease
  produces `46000`.
  This exactly ports the two
  `vendor/radix-primitives/packages/react/slider/src/slider.test.tsx`
  “when the value is off the step grid” cases and prevents a skipped step.
- [x] `SD-MATH-04` `[vendor]` `[unit]` —
  **Slider should preserve decimal precision when fractional and scientific steps are applied.**
  Step `0.2` by `0.1` to exactly `0.3`, step `0` by `1e-7` twice to `1e-7` and
  `2e-7`, and step by `1.5e-7`; assert serialized values and callbacks contain
  no binary tails.
  This ports Radix “steps correctly when step is serialized in scientific
  notation” and “preserves precision for fractional scientific-notation
  steps,” plus Base UI “should round value to step precision.”
- [x] `SD-MATH-05` `[reference]` `[unit]` —
  **Slider should derive and bound Page stepping when range and step do not divide evenly.**
  For `min=0`, `max=96`, and `step=6`, assert the Page step is `12` (two whole
  normal steps covering at least one tenth), PageUp/PageDown snap by that
  amount, and proposals beyond either end clamp to `0` or `96`; for a
  `0..10,step=10` range assert one normal Page step before clamping.
  These boundaries freeze the formula instead of inheriting a browser- or
  vendor-specific `largeStep`.
- [x] `SD-MATH-06` `[convergence]` `[unit]` —
  **Slider should expose safe clamped observables when controlled values are outside global bounds.**
  Evaluate controlled `119.9` and `-7.31` with `min=0,max=100`; assert ARIA and
  geometry resolve to `100`/`100%` and `0`/`0%`, the original supplied values
  are not mutated, and no `onChange` is requested merely to correct them.
  This ports `vendor/base-ui/packages/react/src/slider/thumb/SliderThumb.test.tsx`
  “thumb should not go out of bounds when the controlled value goes out of
  bounds” while retaining controlled authority.
- [x] `SD-MATH-07` `[vendor]` `[unit]` —
  **Slider should use real adjacent values as each Thumb's clamp even when a neighbor is zero.**
  Assert proposed `5` for index `0` in `[-10,0]` yields `[0,0]`, proposed `-5`
  for index `1` in `[0,10]` yields `[0,0]`, middle proposals `10`/`90` in
  `[20,40,80]` clamp to `20`/`80`, and absent outer neighbors use global
  `-50`/`50`.
  This exactly ports Base UI
  `slider/utils/getSliderValue.test.ts` “does not let a thumb cross a neighbour
  whose value is 0,” “bounds a thumb between its real neighbours,” and “leaves
  the outer edges unbounded by missing neighbours.”
- [x] `SD-MATH-08` `[vendor]` `[unit]` —
  **Slider should stop at equality when either Thumb attempts to cross its neighbor.**
  Starting from `[20,70]`, propose `90` for the first and `10` for the second;
  assert `[70,70]` and `[20,20]` respectively, with the same two value indices
  and no swap or pushed neighbor.
  This freezes preserve-order behavior from React Aria's multi-thumb drag test
  and Radix “prevents a thumb from crossing its neighbour when set.”
- [x] `SD-MATH-09` `[reference]` `[unit]` —
  **Slider should reject invalid multi-Thumb arrays when order or cardinality is unusable.**
  Validate `[]`, `[30,20]`, arrays containing `NaN`/infinity, and a runtime
  non-array shape as descriptive errors, while accepting `[20,20,70]` and
  preserving all three indices at equality.
  Equal values are a supported overlap state; empty or decreasing values cannot
  satisfy the frozen value-to-Thumb identity contract.
- [x] `SD-MATH-10` `[reference]` `[unit]` —
  **Slider should reject invalid minimum-step distances when numeric configuration is validated.**
  Accept omitted, explicit `undefined`, `0`, `1`, and `3`, then separately pass
  `-1`, `0.5`, `NaN`, and positive infinity as
  `minStepsBetweenThumbs`; assert a property-specific nonnegative-integer
  diagnostic and no callback, percentage, or ARIA bound from an invalid model.
  Integer validation occurs before multiplication so fractional counts cannot
  become apparently valid distances under a fractional `step`.
- [x] `SD-MATH-11` `[vendor]` `[unit]` —
  **Slider should let neighboring Thumbs meet when the minimum-step distance is zero or omitted.**
  With `min=0,max=100,step=10,value={[20,80]}`, propose `90` for index `0`
  and `10` for index `1` in separate models using omitted and explicit
  `minStepsBetweenThumbs={0}`; assert `[80,80]` and `[20,20]`, respectively,
  with the changed index and original Thumb identity preserved.
  This retains Radix's preserve-order equality behavior while proving that the
  new option's default does not silently require one step of separation.
- [x] `SD-MATH-12` `[vendor]` `[unit]` —
  **Slider should multiply minimum steps without precision loss when step is non-unit or decimal.**
  Assert `step=5,minStepsBetweenThumbs=2` produces distance `10`, then use
  `step=0.25,minStepsBetweenThumbs=3,value={[1,2]}` and prove lower proposal
  `1.9` clamps to `1.25` while upper proposal `1.1` clamps to `1.75`, with no
  binary tails in values or bounds.
  This applies Radix's `minStepsBetweenThumbs * step` algorithm through the
  existing fractional/scientific precision model.
- [x] `SD-MATH-13` `[convergence]` `[unit]` —
  **Slider should recognize an exact minimum-distance boundary when no inward step remains.**
  With `min=0,max=40,step=5,minStepsBetweenThumbs=4,value={[10,30]}`, assert
  the lower Thumb's feasible maximum is exactly `10` and the upper Thumb's
  feasible minimum exactly `30`; inward proposals are no-ops, while outward
  proposals to `5` and `35` remain valid.
  Equality is accepted at exactly four steps, matching Radix's inclusive
  distance check and React Aria's neighbor-bound clamp.

### Controlled change semantics

- [x] `SD-CTRL-01` `[reference]` `[browser]` —
  **Slider should preserve the public value shape when any interaction requests a change.**
  Exercise key, Track press, and Thumb drag on scalar `20` and array `[20,80]`;
  assert every scalar callback receives a number and every range callback the
  complete two-entry array in DOM/value order, never a private tuple or only
  the changed entry.
  Stable shape lets controlled parents use one reducer regardless of modality.
- [x] `SD-CTRL-02` `[reference]` `[browser]` —
  **Slider should retain rendered controlled state when the parent rejects a request.**
  Keep `value=20`, press a 100px Track at x=`60`, then drag toward x=`80`
  without rerendering; assert callbacks request current snapped pointer values
  but Thumb ARIA, `--reference-slider-thumb-position`, and Range remain at
  `20`, and release does not commit an optimistic value.
  This separates request calculations from rendered authority throughout a
  pointer session.
- [x] `SD-CTRL-03` `[vendor]` `[browser]` —
  **Slider should update geometry without synthetic events when controlled values change programmatically.**
  Focus the first Thumb of `[20,50]`, rerender `[33,72]`, and assert both ARIA
  values, Thumb hooks, and Range hooks update on the same nodes while focus
  remains on index `0` and no `onChange`, pointer, or key handler is invoked.
  This ports Base UI `SliderThumb.test.tsx` “positions the thumb when the
  controlled value changes externally.”
- [x] `SD-CTRL-04` `[reference]` `[browser]` —
  **Slider should emit no request when clamping or snapping leaves the value unchanged.**
  At scalar `100` press ArrowRight and press the Track at its max, then at
  `[50,50]` move the first Thumb right; assert no callback for any no-op and no
  ARIA, focus, data-state, or geometry change.
  This incorporates Radix “does not call onValueCommit when the value is
  unchanged” through the public interaction-end callback.
- [x] `SD-CTRL-05` `[reference]` `[browser]` —
  **Slider should use current controlled props when configuration changes during an active drag.**
  Begin dragging value `20` under `min=0,max=100,step=1`, rerender during
  capture with value `30`, `max=60`, `step=5`, vertical orientation, and a new
  handler, then move again; assert only the new handler receives a value
  computed from the current rect/axis and clamped to `60`, with no stale
  callback or jump from cached controlled state.
  Active sessions must refresh behavior props without losing their owned
  pointer or mutating the parent value.
- [x] `SD-CTRL-06` `[reference]` `[browser]` —
  **Slider should let consumer event handlers cancel matching internal changes when they prevent default.**
  In separate fixtures, make Track/Thumb `onPointerDown` and Thumb `onKeyDown`
  log then call `preventDefault()`; press at x=`70`, drag, and press ArrowRight,
  asserting each consumer log comes first, no capture/change starts, and
  controlled ARIA/geometry remain at `20`.
  Consumer-first composition is the public cancellation mechanism, not a
  vendor-specific event-details API.
- [x] `SD-CTRL-07` `[reference]` `[browser]` —
  **Slider should reject a programmatic controlled array when it violates the configured minimum distance.**
  Mount valid `[20,80]` with `step=10,minStepsBetweenThumbs=3`, then rerender
  `[40,60]`; assert a descriptive controlled-distance diagnostic is raised
  atomically before the invalid array publishes Thumb ARIA, Range/Thumb
  percentages, focus reassignment, or `onChange`.
  Rerendering exact-boundary `[50,80]` must succeed, proving validation rejects
  only gaps below `minStepsBetweenThumbs * step`.
- [x] `SD-CTRL-08` `[reference]` `[browser]` —
  **Slider should publish geometry and ARIA from accepted controlled values when a distance-clamped request is rejected or accepted.**
  Keep controlled `[20,80]` with `step=10,minStepsBetweenThumbs=3`, drag the
  lower Thumb toward `70`, and assert one request for `[50,80]` while rendered
  values, positions `20%`/`80%`, Range endpoints, first `aria-valuemax="50"`,
  and second `aria-valuemin="50"` remain based on `[20,80]`.
  After the parent accepts `[50,80]`, assert the same Thumb nodes publish
  `50%`/`80%`, first `aria-valuemax="50"`, second
  `aria-valuemin="80"`, and no extra callback; rejected proposals must never
  leak optimistic CSS or accessibility state.

### Interaction completion

- [x] `SD-END-01` `[vendor]` `[browser:all]` —
  **Slider should summarize a changed pointer interaction once when its owned
  pointer is successfully released.**
  Drag scalar `20` through requests `30`, `45`, and `60`, accept each in the
  parent, and release over and outside the Track in separate runs. Assert
  `onChange` receives every changed candidate, `onChangeEnd(60)` runs once
  after the final request and before capture cleanup completes, and the
  compatibility mouse/click path adds no second end. Repeat with a range and
  assert the complete ordered array is delivered. This exposes Radix
  `onValueCommit` and React Aria/Base UI drag-end knowledge without an
  optimistic value store.
- [x] `SD-END-02` `[vendor]` `[browser:all]` —
  **Slider should treat native key repeats as one interaction ending on the
  matching keyup.**
  Focus a Thumb, dispatch one ArrowRight keydown and three `repeat=true`
  keydowns while accepting each request, then release ArrowRight. Assert four
  `onChange` requests and exactly one `onChangeEnd` carrying the last accepted
  candidate; a second keyup and modifier release do nothing. Repeat PageDown
  at a bound and assert keydowns that produce no changed candidate do not
  create a completion request.
- [x] `SD-END-03` `[reference]` `[browser]` —
  **Slider should not report successful completion when an active interaction
  is canceled or invalidated.**
  In separate changed pointer sessions trigger `pointercancel`,
  `lostpointercapture`, `buttons=0`, window blur, Thumb removal, Root disable,
  and unmount before release; in changed keyboard sessions remove focus,
  disable, or unmount before matching keyup. Assert ordinary `onChange`
  history remains observable but no `onChangeEnd` runs and every listener,
  capture, pressed/dragging state, and pending key session clears once.
- [x] `SD-END-04` `[reference]` `[browser]` —
  **Slider should keep interaction-end reporting controlled and current when
  parents reject requests or replace props during a session.**
  Drag from controlled `20`, reject requests `40` and `60`, replace the end
  handler and range/step props before release, and assert rendered
  ARIA/geometry remain controlled while only the latest handler receives the
  last requested candidate `60` once. Then rerender the value
  programmatically and perform a bound no-op, asserting neither operation
  emits `onChange` or `onChangeEnd`. Completion reports user intent, not an
  invented accepted state or a stale callback.

### Keyboard

- [x] `SD-KEY-01` `[vendor]` `[browser:all]` —
  **Slider should map horizontal LTR arrows to one normal step when a Thumb is focused.**
  With `value=20,step=2`, press ArrowRight, ArrowUp, ArrowLeft, and ArrowDown
  in fresh accepted runs; assert requests `22`, `22`, `18`, and `18`, focus
  remains on the Thumb, and each action emits once in all engines.
  This ports the arrow-key matrix in React Aria `useSliderThumb.test.js`.
- [x] `SD-KEY-02` `[vendor]` `[rtl]` —
  **Slider should reverse only horizontal Left and Right arrows when direction is RTL.**
  Under inherited `dir="rtl"` with `value=20`, assert ArrowRight requests `19`,
  ArrowLeft requests `21`, ArrowUp still requests `21`, and ArrowDown `19`,
  with one callback and stable focus each time.
  This freezes the React Aria/Radix horizontal RTL policy and deliberately does
  not inherit Base UI's vertical horizontal-key reversal.
- [x] `SD-KEY-03` `[vendor]` `[browser:all]` —
  **Slider should keep vertical arrow semantics independent of RTL when direction varies.**
  For vertical LTR and RTL fixtures at `20`, assert ArrowUp and ArrowRight each
  request `21`, while ArrowDown and ArrowLeft each request `19`; accepted
  rerenders update vertical ARIA/geometry without moving focus.
  This ports React Aria `useSliderThumb.test.js` “can be moved with keys
  (vertical)” and resolves the Base UI key-map disagreement in favor of the
  frozen contract.
- [x] `SD-KEY-04` `[vendor]` `[browser:all]` —
  **Slider should apply one computed Page step for every initial and native
  key-repeat event.**
  With `min=0,max=100,step=6,value=48`, dispatch PageUp keydown once with
  `repeat=false` and again in an OS-style stream with `repeat=true`, accepting
  requests `60` then `72`; repeat PageDown to request `60` and continue until
  the bound. Assert snapping, clamping, exactly one callback per keydown
  including each repeat event, no callback after the bound, and focus retention
  in every engine. This ports React Spectrum's held PageUp/PageDown regression
  and Radix's Page-key coverage while using Reference UI's deterministic
  computed step rather than configurable `largeStep`.
- [x] `SD-KEY-05` `[vendor]` `[browser:all]` —
  **Slider should send Home and End to feasible neighbor bounds when a range Thumb is focused.**
  For `[20,70]`, focus index `0` and assert Home/End request `[0,70]` and
  `[70,70]`; focus index `1` and assert Home/End request `[20,20]` and
  `[20,100]`, preserving identities and all untouched values.
  This applies the APG bound keys to the neighbor ARIA limits proved above.
- [x] `SD-KEY-06` `[reference]` `[browser]` —
  **Slider should change only the focused logical Thumb when a range key is handled.**
  Focus the middle Thumb of `[10,40,80]`, press ArrowRight, and assert the
  callback is `[10,41,80]`, only index `1` ARIA/CSS changes after acceptance,
  and labels, refs, focus, and indices `0`/`2` remain unchanged.
  Keyboard focus is the unambiguous active-Thumb selector even when values
  overlap.
- [x] `SD-KEY-07` `[reference]` `[browser]` —
  **Slider should preserve application keyboard defaults when a key is unsupported or modified.**
  Press Enter, Escape, printable `x`, and Ctrl/Alt/Meta/Shift-modified Arrow
  keys on an enabled Thumb, then handled keys on a disabled Slider; assert no
  `preventDefault`, no `onChange`, and no ARIA/geometry movement while the
  consumer key handler still receives each event.
  This keeps browser/application shortcuts available and freezes Page keys—not
  modifiers—as the only large-step input.
- [x] `SD-KEY-08` `[reference]` `[browser]` —
  **Slider should keep focus without duplicate requests when a handled key hits a bound.**
  At scalar `0` press ArrowLeft and PageDown, and at `100` press ArrowRight,
  PageUp, and End; assert each event is handled consistently but `onChange`
  remains empty, focus stays on the Thumb, and ARIA/CSS values do not flicker.
  Bound keys are no-ops, not repeated controlled requests.
- [x] `SD-KEY-09` `[vendor]` `[browser:all]` —
  **Slider should clamp keyboard movement from either Thumb when the minimum-distance boundary is reached.**
  With `step=10,minStepsBetweenThumbs=3`, accept the lower Thumb's ArrowRight
  request from `[20,60]` to `[30,60]`, then press ArrowRight again and assert no
  callback; in a fresh run accept the upper Thumb's ArrowLeft request to
  `[20,50]`, then prove the next ArrowLeft is likewise a focused no-op.
  Each run must preserve the focused Thumb's label, ref, index, and DOM order,
  porting Radix's keyboard minimum-step clamp without its optional swap mode.

### Track press and pointer drag

- [x] `SD-POINTER-01` `[vendor]` `[browser:all]` —
  **Slider should choose and focus the nearest movable Thumb when the primary pointer presses the Track.**
  Give a 100px horizontal Track values `[10,80]`, press x=`20` then x=`90` in
  fresh runs, and assert requests `[20,80]` and `[10,90]`, the chosen Thumb is
  focused, and pointer capture begins once in all engines.
  This ports React Aria `useSlider.test.js` “should allow you to set value of
  closest thumb by clicking on track.”
- [x] `SD-POINTER-02` `[reference]` `[browser]` —
  **Slider should resolve equal-distance and stacked Track presses when the frozen active/index rule applies.**
  With `[40,40]`, press x=`40` before any Thumb is active and assert index `0`
  is focused; activate index `1`, press the same tie again, and assert index
  `1` remains chosen, while presses below/above the stack select only a Thumb
  that can move within neighbor clamps.
  This makes deterministic the stacked-thumb cases in React Aria
  `useSlider.test.js` rather than relying on paint order.
- [x] `SD-POINTER-03` `[vendor]` `[browser:all]` —
  **Slider should preserve the grab offset when a Thumb is pressed away from its center.**
  On a 100px vertical Track with a 20px Thumb centered at value `50`, press its
  lower edge at y=`60` and move to y=`80`; assert the requested value is `30`,
  not the center-mapped `20`, with no request on the initial Thumb press.
  This exactly ports Base UI
  `slider/thumb/SliderThumb.test.tsx` “preserves the grab offset when dragging
  a vertical thumb.”
- [x] `SD-POINTER-04` `[vendor]` `[browser:all]` —
  **Slider should retain pointer ownership when a drag leaves the Track and viewport.**
  Start pointer `7` on a Thumb, assert Track calls
  `setPointerCapture(7)`, then move beyond both ends and outside the viewport;
  assert continued requests clamp to min/max and only pointer `7` can drive
  the session until release.
  This protects the real-browser capture path that React Aria and Base UI test
  with document-level movement.
- [x] `SD-POINTER-05` `[vendor]` `[touch]` —
  **Slider should resize from one owned touchpoint when unrelated touches and scrolling occur.**
  Drag touch identifier `1` along a horizontal Track while identifier `2`
  moves elsewhere; assert only identifier `1` requests values, active-axis
  scrolling is prevented only during that gesture, perpendicular/outside
  scrolling remains available, and no compatibility mouse sequence adds a
  callback.
  This ports Base UI `SliderRoot.test.tsx` “should only listen to changes from
  the same touchpoint.”
- [x] `SD-POINTER-06` `[reference]` `[browser]` —
  **Slider should accept only primary input when pen and non-primary pointer buttons are tried.**
  Use a primary pen pointer to press x=`60` and drag to x=`70`, then try mouse
  button `2` and a non-primary pointer; assert only pen requests/focus/capture
  occur and the ignored inputs leave callbacks, ARIA, and dragging state
  unchanged.
  This adapts Base UI `SliderRoot.test.tsx` “should not react to right clicks”
  to the complete Pointer Events policy.
- [x] `SD-POINTER-07` `[vendor]` `[browser]` —
  **Slider should release the captured pointer and end dragging when pointerup occurs.**
  Start pointer `7`, move from x=`20` to `40`, release over `document.body`,
  and assert `releasePointerCapture(7)` is called, every documented dragging
  hook clears, focus stays on the active Thumb, and later moves from pointer
  `7` emit nothing.
  This exactly ports Base UI
  `slider/control/SliderControl.test.tsx` “releases pointer capture when the
  interaction ends.”
- [x] `SD-POINTER-08` `[vendor]` `[browser]` —
  **Slider should clean every drag resource when a pointer session is canceled or invalidated.**
  In separate active drags trigger `pointercancel`, `lostpointercapture`, a
  move with `buttons=0`, window blur, Thumb unmount, and Root becoming disabled;
  assert capture/listeners/touch suppression and dragging hooks clear once,
  no later movement requests a value, and unmount logs no error.
  This includes Base UI `SliderRoot.test.tsx` “should hedge against a dropped
  mouseup event” and its disabled-during-drag regression.
- [x] `SD-POINTER-09` `[reference]` `[browser]` —
  **Slider should defer pointer geometry when the Track is zero-sized and resume when it becomes measurable.**
  Hide the Track so its rect is `0×0`, press and move, and assert no capture,
  callback, or `NaN`; reveal it as `100×10`, press x=`60`, and assert one valid
  snapped request while the value-derived CSS hooks never changed to a bogus
  percentage during hiding.
  This separates layout-dependent input math from layout-independent public
  geometry output.
- [x] `SD-POINTER-10` `[vendor]` `[browser]` —
  **Slider should map physical pointer positions to values when orientation and direction vary.**
  On a `0..100` Track assert horizontal LTR x=`0/100` requests `0/100`,
  horizontal RTL requests `100/0`, and vertical y=`100/0` requests `0/100`,
  including inherited direction rather than a private provider.
  This ports Base UI `SliderRoot.test.tsx` “should handle RTL” and “should
  report the right position,” converged with React Aria's vertical mapping.
- [x] `SD-POINTER-11` `[reference]` `[browser]` —
  **Slider should clamp without swapping logical identity when a dragged range Thumb reaches its neighbor.**
  Drag index `1` of `[40,80]` past index `0` to the min side and assert the last
  request is `[40,40]`; after acceptance assert focus, accessible label, ref,
  DOM order, and active styling still belong to index `1`.
  This adopts React Aria `useSliderThumb.test.js` “can be moved by dragging”
  while explicitly rejecting Radix/Base UI's optional swap behavior.
- [x] `SD-POINTER-12` `[vendor]` `[browser:all]` —
  **Slider should clamp pointer movement from either Thumb when a positive minimum distance applies.**
  On a 100px `0..100` Track with `step=10,minStepsBetweenThumbs=3`, drag the
  lower Thumb of `[20,80]` toward value `90` and assert `[50,80]`; in a fresh
  run drag the upper Thumb toward `10` and assert `[20,50]`, with one final
  clamped request and no pushed neighbor.
  This extends Radix's `minStepsBetweenThumbs={5}` preserve-order regression to
  both indices and the real pointer-capture path.
- [x] `SD-POINTER-13` `[convergence]` `[rtl]` —
  **Slider should enforce the same value-space distance when pointer and keyboard directions change in RTL or vertical layouts.**
  With `[20,80]`, `step=10`, and `minStepsBetweenThumbs=3`, drag the physically
  right lower Thumb leftward in horizontal RTL and the physically lower Thumb
  upward vertically; assert both increasing-value gestures stop at `50`, while
  the opposite Thumb stops at `50` when moved in the decreasing direction.
  Repeat the corresponding RTL/vertical Arrow keys and assert identical
  clamps, proving React Aria/Zag axis mapping changes physical direction but
  not Radix-derived value-space distance or Thumb identity.

### Dynamic anatomy and environments

- [x] `SD-DYNAMIC-01` `[reference]` `[browser]` —
  **Slider should preserve surviving Thumb identity when controlled values and keyed parts change together.**
  Change `[20,50,80]` and matching keyed Thumbs to `[20,80]`, then insert
  `50` and reorder the keyed parts with their value entries; assert surviving
  labels/refs/ARIA remain paired, the active index is recalculated, CSS hooks
  match current order, and no unsolicited request fires.
  Arrays are positional, so the fixture must update value entries and keyed
  parts atomically rather than asking React keys to map values.
- [x] `SD-DYNAMIC-02` `[vendor]` `[browser]` —
  **Slider should use updated constraints and axis metadata when interaction resumes after rerender.**
  Rerender a mounted `0..100,step=1` horizontal LTR Slider as
  `min=10,max=60,step=5`, vertical, and RTL; assert ARIA and CSS geometry update
  immediately without `onChange`, then one key and pointer action use the new
  bounds, step, rect, orientation, and direction.
  This consolidates Base UI's min/max/orientation/RTL update tests and catches
  stale model closures.
- [x] `SD-DYNAMIC-03` `[vendor]` `[browser]` —
  **Slider should discard stale drag state when the controlled range cardinality changes mid-gesture.**
  Begin dragging index `2` of `[10,20,30]`, rerender `[10,20]` with two
  matching Thumbs, then move/release and assert no out-of-range write or stale
  request; repeat by growing `[10,20]` to `[10,20,30]`, assert the old release
  commits nothing, and verify a new index-2 drag can request
  `[10,20,100]`.
  This ports Base UI `SliderControl.test.tsx` “does not resurrect a removed
  thumb value when the range shrinks mid-drag,” “does not commit a stale value
  when the range shrinks,” and “clears cached interaction state when the
  controlled range grows mid-drag.”
- [x] `SD-DYNAMIC-04` `[reference]` `[browser]` —
  **Slider should recompute minimum distance when minStepsBetweenThumbs or step changes dynamically.**
  Mount `[20,80]` with `step=5,minStepsBetweenThumbs=2`, rerender first with
  `minStepsBetweenThumbs=6` and then with
  `step=10,minStepsBetweenThumbs=6`; assert effective distance changes from
  `10` to `30` to the exact `60` gap and the first-max/second-min ARIA pair
  changes from `70`/`30` to `50`/`50` to `20`/`80` on the same Thumbs, with no
  callback or focus/identity change, then reject `minStepsBetweenThumbs=7`
  atomically because its `70`-unit distance exceeds the controlled gap.
  After each accepted rerender, one inward key and pointer action must clamp
  against the current product rather than stale step or minimum-count closures,
  and the rejected configuration must publish no new CSS or ARIA state.
- [x] `SD-ENV-01` `[reference]` `[ssr]` —
  **Slider should server-render value-derived ARIA and percentages when layout cannot be read.**
  Server-render scalar `30` and range `[20,70]`, assert exact ARIA and frozen
  percentage properties in the HTML, then hydrate against zero-sized and later
  measurable Tracks with no warning, first-frame attribute/style mismatch, or
  `onChange`.
  Pointer rects are client-only inputs; controlled percentages do not need a
  pre-hydration measurement script.
- [x] `SD-ENV-02` `[reference]` `[react:all]` —
  **Slider should keep refs and pointer sessions singular when run across supported React versions.**
  Under StrictMode in React 17, 18, and 19, mount a two-Thumb Slider, rerender
  it during a captured drag, and unmount; assert stable object/callback refs,
  one listener/capture session, one request per physical event, and the
  version-appropriate callback-ref cleanup.
  This incorporates Radix's “keeps a stable composed ref on the root/thumb”
  regressions.
- [x] `SD-ENV-03` `[reference]` `[shadow]` —
  **Slider should preserve focus, capture, RTL, and geometry when rendered in a ShadowRoot.**
  Mount a horizontal RTL range in an open ShadowRoot, keyboard-step the first
  Thumb and drag the second beyond the Track; assert
  `shadowRoot.activeElement`, neighbor ARIA, callbacks, percentage hooks,
  capture release, and cleanup all remain local and correct.
  Event retargeting must not switch the active Thumb or query the document for
  geometry.
- [x] `SD-ENV-04` `[reference]` `[browser:all]` —
  **Slider should retain its scalar and range contract when run across all browser engines.**
  In Chromium, Firefox, and WebKit run one scalar keyboard sequence and one
  two-Thumb Track-press/outside-drag sequence; assert identical requested
  values, active focus, neighbor bounds, capture lifecycle, and CSS
  percentages.
  The smoke matrix catches native Pointer Events and key-timing differences
  without multiplying every case by every engine.

## Composition gates

- [x] `SD-COMP-01` `[reference]` `[browser]` —
  **Slider should preserve fractional precision when a horizontal scalar volume composition is used.**
  Build a labeled `0..1` volume Slider at `0.2` with `step=0.1`, press
  ArrowRight and then drag its edge to `0.8`; assert callbacks `0.3` and `0.8`,
  matching ARIA/value text and percentage hooks, stable focus, and no
  floating-point tail or form field.
  This proves keyboard, grab-offset pointer math, and application chrome share
  one scalar model.
- [x] `SD-COMP-02` `[reference]` `[browser]` `[rtl]` —
  **Slider should preserve Thumb identities when an RTL range composition meets at one value.**
  Build an RTL price range `[20,80]` with distinct Minimum/Maximum labels,
  arrow and drag each toward the other until `[50,50]`, and assert they cannot
  cross, both remain tabbable in DOM order, the most recently active Thumb is
  pointer reachable, and Range geometry collapses to zero.
  This composition jointly proves RTL mapping, neighbor ARIA, equality, and
  controlled rejection without enabling swap behavior.
- [x] `SD-COMP-03` `[reference]` `[touch]` —
  **Slider should retain a vertical touch gesture when a media control is dragged beyond its Track.**
  Build a vertical brightness Slider in a scrollable page, start touch
  identifier `1` off-center on its Thumb, drag above and below the Track, and
  assert clamped max/min requests, preserved grab offset, active-only scroll
  suppression, dragging hooks, focus, and complete cleanup on touchend.
  This adversarial composition proves the touch/capture lifecycle without
  duplicating unrelated page scroll ownership.

## Out of scope

- Hidden form inputs/name/reset/validation, uncontrolled values, thumb
  swap/push behavior, visual marks, labels, or tooltips.

# Switch test contract

Playwright: `matrix/lib/tests/e2e/switch.spec.ts`  
Page: `/switch`

Switch owns one controlled `role="switch"` button. A thumb is always
present: Switch renders a default thumb, or an authored `Switch.Thumb`
replaces it. It does not own labels, form serialization, thumb geometry, or
checkbox mixed state.

## Freeze defaults

`checked` is required. Omitted `onChange` is a silent controlled readout.
Omitted `disabled` is enabled. Root is always `button[type=button]`.
Omitted `Switch.Thumb` still yields exactly one default thumb `span`.
Authoring `Switch.Thumb` replaces that default; at most one thumb exists.

## Source evidence

- `vendor/radix-primitives/packages/react/switch/src/switch.test.tsx` —
  controlled checked, `onCheckedChange`, disabled, `data-state` on root and
  thumb, and native button activation.
- `vendor/base-ui/packages/react/src/switch` — button host, Thumb child,
  disabled, and form-control contrast (Reference UI leaves form wiring).
- `vendor/react-spectrum/packages/react-aria-components/test/Switch.test.js`
  — labelled activation, keyboard Space, disabled, and read-only contrast.
  React Aria's `input` host is deliberate contrast, not the freeze anatomy.
- APG Switch pattern — `role="switch"` with `aria-checked` true/false, not
  `aria-pressed` and not mixed.

Universal `PART-TYPE-01` and `PART-STYLE-01` cover the complete
`ReferencePartProps` native/StyleProps intersection for Root and Thumb.
Switch-specific type cases cover only managed-prop omissions.

## Required cases

### Public type and part integration

- [x] `SW-TYPE-01` `[reference]` `[unit]` —
  **Switch should preserve behavior-prop types when ReferencePartProps also
  supplies StyleProps.** Compile a Thumb-less Root with `checked={false}`,
  `onChange={(checked: boolean) => void checked}`, `disabled={false}`,
  `width="6r"`, `css={{ opacity: 0.5 }}`, and
  `r={{ 320: { width: "7r" } }}`, then compile `Switch.Thumb` with
  `width="2r"` and `bg="bg"`. Assert `onChange` remains
  `(checked: boolean) => void`, Thumb accepts the shared StyleProps surface,
  and that `type`, `role`, `aria-checked`, `aria-pressed`, and native button
  `onChange` are not public on Root. Add `@ts-expect-error` fixtures for
  `checked="true"`, `defaultChecked`, and `aria-checked="mixed"`.

### DOM, parts, and state

- [x] `SW-DOM-01` `[reference]` `[browser]` —
  **Switch should be a complete control when mounted with only StyleProps.**
  Render a labelled `<Switch width="6r" padding="0.25r" />` with no children
  between identifiable siblings. Assert Switch is that
  `button[type=button][role=switch]`, it contains exactly one direct default
  thumb `span`, StyleProps land on the button and not the thumb, no
  track/input/wrapper nodes exist, and the siblings stay adjacent.
- [x] `SW-DOM-02` `[vendor]` `[browser]` —
  **Switch should expose authoritative checked state on both parts.** Render
  a Thumb-less `checked={false}`, then rerender `checked={true}`, while also
  supplying conflicting consumer `data-state` and `aria-checked` values.
  Assert Root has `aria-checked="false"` then `"true"`, both the button and
  default thumb report matching `data-state="unchecked"` then `"checked"`,
  `aria-pressed` is absent, and consumer data attributes other than
  `data-state` remain. This ports Radix Switch checked/`data-state` while
  keeping props authoritative.
- [x] `SW-DOM-03` `[vendor]` `[browser]` —
  **Switch should expose disabled state natively without remaining
  activatable.** Render `disabled` on an unchecked Thumb-less Switch and
  inspect both parts. Assert the button is natively `disabled`, both the
  button and default thumb expose `data-disabled`, and the control is not
  the document active element after a click attempt.
- [x] `SW-DOM-04` `[reference]` `[browser]` —
  **Switch should replace the default thumb when `Switch.Thumb` is
  authored.** Render Thumb-less, then rerender with `Switch.Thumb` plus a
  decorative sibling `span`, then back to Thumb-less. Assert exactly one
  thumb `span` in every shape, the authored Thumb receives its ref and
  StyleProps, the default thumb is absent while Thumb is authored, extra
  visual children remain ordinary descendants, and restoring Thumb-less
  brings back one default thumb without leftover authored nodes.
- [x] `SW-DOM-05` `[reference]` `[browser]` —
  **Switch should forward native props and refs to the button and an
  authored Thumb.** Give both parts native attributes, `aria-*` other than
  managed keys, `data-*`, classes, styles, handlers, object refs, and
  callback refs, then click Root and rerender once. Assert every
  non-managed prop lands on the documented element, handlers run once, refs
  receive that element with supported React cleanup, and managed ARIA/state
  coexist with unrelated consumer styling. The default thumb is not
  referenced in this fixture.
- [x] `SW-DOM-06` `[reference]` `[browser]` —
  **Switch should not participate in form serialization.** Put a named form
  around a checked Switch with no application hidden input, then submit and
  reset. Assert `FormData` contains no Switch value, `checked` is unchanged,
  and `onChange` does not fire.
- [x] `SW-DOM-07` `[reference]` `[browser]` —
  **Switch should keep its button non-submitting.** Put an enabled
  Thumb-less Switch inside a form with a submit spy and activate it. Assert
  `type="button"` and that toggling does not submit.
- [x] `SW-DOM-08` `[reference]` `[browser]` —
  **Switch should isolate StyleProps between the track and an authored
  Thumb.** Render `width="6r"` `bg="accent"` on Switch and `width="2r"`
  `bg="bg"` on `Switch.Thumb`, including a responsive `r` override on each.
  Assert each declaration lands only on its own element, Root styles do not
  copy onto Thumb, Thumb styles do not copy onto Root, and swapping back to
  a default thumb drops authored Thumb styles without leaving them on the
  default span.

### Controlled activation

- [x] `SW-ACT-01` `[vendor]` `[browser:all]` —
  **Switch should request on once when an enabled unchecked control is
  clicked.** Render `checked={false}` with an `onChange` log and perform one
  primary click on Root. Assert the log is exactly `[true]` and the DOM
  remains unchecked until the parent supplies `checked={true}`. This ports
  Radix `onCheckedChange` as a request.
- [x] `SW-ACT-02` `[vendor]` `[browser:all]` —
  **Switch should request off once when an enabled checked control is
  clicked.** Render `checked={true}`, click Root once, and leave the prop
  unchanged. Assert `onChange` receives exactly `false` once and the DOM
  stays checked because the parent rejected the request.
- [x] `SW-ACT-03` `[vendor]` `[browser:all]` —
  **Switch should request once from native Space or Enter activation.**
  Focus an enabled unchecked Switch and press Space, then rerender checked
  and press Enter. Assert each key produces exactly one opposite-boolean
  request through the native click path, with no second request from a
  composed keydown handler. This ports Aria Switch keyboard activation onto
  the button host.
- [x] `SW-ACT-04` `[reference]` `[browser]` —
  **Switch should request once when the click target is the thumb.** Click
  the default thumb of a checked Thumb-less Switch, then rerender with
  `Switch.Thumb` and click that Thumb, rejecting both requests. Assert
  `onChange` receives `[false, false]` and no duplicate Root click request
  is added for either specificity.
- [x] `SW-ACT-05` `[reference]` `[browser]` —
  **Switch should skip its request when the consumer click is canceled.**
  Attach a Root `onClick` that calls `preventDefault()`, then click. Assert
  `onChange` is not called and `aria-checked` stays on the controlled prop.
- [x] `SW-ACT-06` `[vendor]` `[browser]` —
  **Switch should ignore activation when disabled.** Click and send Space to
  a disabled Switch in both checked states. Assert no `onChange` call and
  unchanged `aria-checked` / `data-state`.
- [x] `SW-ACT-07` `[reference]` `[browser]` —
  **Switch should not emit `onChange` for programmatic checked updates.**
  Rerender `checked` from `false` to `true` without pointer or keyboard
  input. Assert the log is empty while ARIA and `data-state` follow the new
  prop.
- [x] `SW-ACT-08` `[reference]` `[browser]` —
  **Switch should remain inert when `onChange` is omitted.** Click and press
  Space on a required `checked={false}` Switch with no `onChange`. Assert no
  exception, no local toggle, and `aria-checked="false"` throughout.

### Naming

- [x] `SW-NAME-01` `[vendor]` `[browser]` —
  **Switch should toggle from an associated `label htmlFor`.** Give Root
  `id="airplane"` and a sibling label `htmlFor="airplane"`, then click the
  label text. Assert one `onChange(true)` request and that the button keeps
  that exact ID. This ports Aria labelled Switch activation.
- [x] `SW-NAME-02` `[vendor]` `[browser]` —
  **Switch should toggle from a wrapping label.** Wrap Switch in
  `<label>Notifications</label>` with no `id`, then click the label text
  outside the button. Assert one request and that Switch does not inject a
  generated accessible name.

### Environments

- [x] `SW-ENV-01` `[reference]` `[ssr]` —
  **Switch should hydrate checked and unchecked markup without mismatch.**
  Server-render one `checked={true}` and one `checked={false}` Thumb-less
  fixture, plus one authored-Thumb fixture, capture markup, and hydrate
  before interaction. Assert no hydration warning, `aria-checked` /
  `data-state` match the server props on both the button and the one thumb,
  and the first click still issues exactly one request.
- [x] `SW-ENV-02` `[reference]` `[react:all]` —
  **Switch should keep one registration and request across supported React
  versions and StrictMode replay.** In React 17, 18, and 19 fixtures, mount
  under each available StrictMode behavior, attach object and callback refs
  to Root and an authored Thumb, and perform one primary click. Assert
  exactly one `onChange` request, one current button/thumb pair, and
  version-appropriate ref cleanup only on removal. A parallel Thumb-less
  fixture keeps one default thumb with no authored Thumb ref.
- [x] `SW-ENV-03` `[reference]` `[shadow]` —
  **Switch should keep activation and labeling local to an open ShadowRoot.**
  Mount a labelled Switch in an open ShadowRoot, click the shadow label,
  and assert `shadowRoot.activeElement` is the button, the request stays on
  that instance, and a light-DOM Switch is unaffected.
- [x] `SW-ENV-04` `[reference]` `[browser]` `[rtl]` —
  **Switch should keep checked state physical when direction is RTL.**
  Render a checked Switch under `dir="rtl"` with consumer thumb-transform
  CSS. Assert `aria-checked="true"` and `data-state="checked"` with no
  extra Switch transform/custom property, and that a click still requests
  `false` once. Direction is CSS, not a second state machine.
- [x] `SW-A11Y-01` `[vendor]` `[browser]` —
  **Switch should remain accessibility-clean in named, disabled, and
  wrapping-label shapes.** Run the configured accessibility checker on
  labelled checked/unchecked, disabled, wrapping-label, Thumb-less, and
  authored-Thumb fixtures. Assert no violations, `role="switch"`, boolean
  `aria-checked`, no `aria-pressed`, and exactly one thumb in each fixture.

## Composition gates

- [x] `SW-COMP-01` `[reference]` `[browser]` —
  **A settings row should use a low-specificity labelled Switch.** Build
  `Airplane mode` with sibling `htmlFor` / `id` and StyleProps only on
  Switch, accept each request, and exercise pointer, Space, Enter, and Tab.
  Assert one tab stop, boolean ARIA, a default thumb whose `data-state`
  follows the parent, and no `Switch.Thumb`, form, or Field wrapper.
- [x] `SW-COMP-02` `[reference]` `[browser]` —
  **A wrapping-label Switch should sit in a form without serializing.** Put
  `Notifications` as a wrapping label around a Thumb-less Switch beside an
  application-owned hidden checkbox that mirrors accepted state. Toggle via
  label click, submit, and reset. Assert Switch requests only booleans,
  `FormData` contains the hidden checkbox rather than the button, and reset
  does not alter Switch until the parent changes `checked`.
- [x] `SW-COMP-03` `[reference]` `[browser]` —
  **Switch should keep independent authority at both specificities inside a
  dialog settings list.** Place one Thumb-less Switch and one Switch with
  an authored `Switch.Thumb` inside Overlay Content with a RovingFocus
  toolbar of unrelated buttons. Toggle each Switch, including clicks on
  both thumbs, move toolbar focus, and dismiss the Overlay. Assert each
  Switch logs only its own requests, Overlay dismissal does not change
  `checked`, StyleProps stay on the authored Thumb only, and neither
  control steals toolbar roving.

## Owned elsewhere

- Form-field wiring and implicit label association: application HTML.
- Mixed/indeterminate boolean: native checkbox, not Switch.
- Menu on/off commands: `Menu.CheckboxItem`.
- Continuous value: `Slider`.

## Out of scope

- Uncontrolled / `defaultChecked`.
- Hidden form inputs, `name` / `value` / `required` / `readOnly`.
- `aria-checked="mixed"`, `aria-pressed`, or checkbox `role`.
- Orientation props, geometry custom properties, Presence, Slot/`as`, a
  public Provider, or a required Thumb in JSX.

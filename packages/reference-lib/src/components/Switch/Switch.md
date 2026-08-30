# Switch

Proof: [TESTS.md](./TESTS.md).

A compact on/off control with variable specificity. Mount `Switch` alone and
it is a complete control: StyleProps land on the track, and a default thumb
is rendered for you. Author `Switch.Thumb` only when the thumb itself needs
props, refs, or children.

Native `<input type="checkbox" role="switch">` already owns boolean state,
but an input cannot contain a thumb. Switch owns the two-part anatomy,
controlled requests, and shared checked styling hooks. Labels, form
serialization, and thumb-travel CSS stay in application code.

Low specificity — StyleProps on the control, default thumb:

```tsx
<label htmlFor="airplane">Airplane mode</label>
<Switch
  id="airplane"
  checked={enabled}
  onChange={setEnabled}
  width="6r"
  padding="0.25r"
/>
```

High specificity — own the thumb:

```tsx
<label htmlFor="airplane">Airplane mode</label>
<Switch
  id="airplane"
  checked={enabled}
  onChange={setEnabled}
  width="6r"
>
  <Switch.Thumb width="2r" bg="bg" />
</Switch>
```

A wrapping label is also valid at either specificity:

```tsx
<label>
  Airplane mode
  <Switch checked={enabled} onChange={setEnabled} />
</label>
```

## Proposed API

```ts
interface SwitchProps
  extends Omit<
    ReferencePartProps<"button">,
    "onChange" | "type" | "role" | "aria-checked" | "aria-pressed"
  > {
  checked: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
}

interface SwitchThumbProps
  extends ReferencePartProps<"span"> {}
```

`Switch` renders `button[type=button][role=switch]`. `Switch.Thumb` renders
`span`. There is no Track, Control, Input, or Root alias.

`checked` is required and controlled. There is no `defaultChecked`, mixed
state, or local toggle store. `onChange` requests the opposite boolean; the
DOM flips only after the parent accepts. Omitted `onChange` still renders
the current `checked` and does not invent an internal handler. Omitted
`disabled` is enabled.

When no `Switch.Thumb` is authored, Switch renders one default thumb `span`
as a direct child. StyleProps, class, style, and ref on `Switch` never
land on that thumb. Authoring `Switch.Thumb` replaces the default thumb;
exactly one thumb exists. Other authored children are visual chrome and do
not become extra thumbs.

Root owns `type`, `role`, `aria-checked`, and the absence of `aria-pressed`.
`aria-checked` is `"true"` or `"false"`. Both parts publish
`data-state="checked" | "unchecked"` and `data-disabled` when disabled.
Applications style thumb travel against `data-state`; Switch does not set
transforms or publish geometry custom properties.

Unprevented native `click` — including Space, Enter, and a click that lands
on Thumb — requests the opposite boolean once. Consumer handlers run first;
`preventDefault()` cancels the request. Disabled Switch does not request.
Programmatic `checked` changes emit no callback.

Switch does not render a form control. `name`, `value`, reset, and submit
are application-owned, the same as Slider. Accessible names come from
`htmlFor`, a wrapping `label`, or authored `aria-label` /
`aria-labelledby`. Switch has no English fallback.

## Internal state

Switch has no Zustand store and no document-scoped runtime. An authored
Thumb finds its owner through internal subtree context. The default thumb
is owned entirely by Switch. Two instances never share checked state.
StrictMode replay must not duplicate the click request.

---

## Problems we own

Checkbox and radio stay native. Switch exists only because a sliding thumb
has to be a child of the control.

### Variable specificity

The common case is a styled track. Forcing `Switch.Thumb` in every tree
makes a compact control noisy. Omitting the thumb in the DOM makes CSS
thumb travel impossible. Default thumb on the low-specificity mount, and
an authored `Switch.Thumb` that replaces it, is the one anatomy.

**Leave** separate Track/Control parts. Two levels is enough.

### Button host, not a void input

A native checkbox cannot host a thumb. Recasting the input with sibling
spans forces a wrapping label and a hidden control. The button host keeps
anatomy visible: the track is the control, the thumb is a child, and `id` /
`htmlFor` still work.

**Vendor.** Radix and Base UI Switch render a `button` with a Thumb child.
React Aria Switch is an `input` — **leave** that host.

**Lift** the two-part button anatomy. Do not add a hidden checkbox.

### Controlled request, not native checked

A button has no durable checked state. Native checkbox would. Switch must
not smuggle an uncontrolled toggle: omitted `onChange` does not flip local
DOM, and a rejected request leaves `aria-checked` / `data-state` on the last
accepted prop.

**Lift** the Collapsible/Slider request contract. **Leave** Radix
uncontrolled `defaultChecked`.

### Styling hooks without geometry authority

Thumb animation is CSS. Publishing `--reference-switch-*` offsets would make
Switch a tiny layout engine. `data-state` on both parts is enough for
`translate` / logical inset CSS, including RTL. Low-specificity StyleProps
style the button; high-specificity StyleProps style the authored Thumb.

**Leave** Slider-style custom properties, Presence, and orientation props.

---

## Convergence

**Anatomy:** radix/base-ui `Switch` + `Thumb`, with a default thumb so the
root is a complete control. **State:** Reference controlled requests.
**Leave:** input host, hidden form control, mixed state, `asChild`,
Provider, required Thumb JSX.

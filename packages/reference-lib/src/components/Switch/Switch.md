# Switch

Proof: [TESTS.md](./TESTS.md).

A two-state control that is not a native HTML element. Renders a `button` with `role="switch"` and keeps `aria-checked` aligned with controlled `checked`. Owns Space/Enter activation. Track, thumb, and labels are application markup.

Included because there is no native switch. Checkbox and radio stay native — do not wrap them (`components.md` omissions).

```tsx
<Switch
  checked={notifications}
  onChange={setNotifications}
  aria-labelledby="notifications-label"
>
  <Span />
</Switch>
```

## Proposed API

```ts
interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean
  onChange?: (checked: boolean) => void
}
```

`Switch` renders `button`.

---

## Problems we own

This is deliberately small. The nasty part is using the wrong DOM.

### Button + `aria-checked`, not a hidden checkbox

Aria `useSwitch` sits on a **hidden checkbox** plus `role="switch"`. That is the wrong element for Reference UI (stable native element, no `as`, no form bubble). Radix Switch is a `button` with `aria-checked`.

**Lift** Radix’s button model. Space/Enter come with the button. Controlled `checked` is the only state.

### Form `name` / reset

Radix/Zag hidden `input` + `form` attribute + form reset. Fights the no-form-field-wiring omission.

**Leave.**

---

## Convergence

**radix-primitives switch**, strip form glue. Do not take Aria’s checkbox base.

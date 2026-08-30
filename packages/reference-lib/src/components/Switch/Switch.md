# Switch

A two-state control that is not a native HTML element. Renders a `button` with `role="switch"` and keeps `aria-checked` aligned with controlled `checked`. Owns Space/Enter activation. Track, thumb, and labels are application markup.

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

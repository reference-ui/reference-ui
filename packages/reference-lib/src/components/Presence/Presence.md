# Presence

Keeps unmounting elements in the DOM until CSS animations or transitions complete. Overlay and Popover use it internally for the `data-state` exit contract.

```tsx
<Presence present={open}>
  <Div data-state={open ? "open" : "closed"}>{children}</Div>
</Presence>
```

## Proposed API

```ts
interface PresenceProps {
  children?: React.ReactNode
  present: boolean
}
```

Presence renders no extra node.

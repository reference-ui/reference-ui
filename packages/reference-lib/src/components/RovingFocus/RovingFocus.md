# RovingFocus

Composite-widget keyboard kernel: roving `tabindex`, arrow movement, Home/End, disabled skipping, optional looping, optional typeahead, optional two-dimensional movement.

Does not add a wrapper node. Slots keyboard behaviour onto a single composite child. Each `RovingFocus.Item` slots `tabindex` onto its child.

```tsx
<RovingFocus orientation="horizontal" loop>
  <Div role="toolbar" aria-label="Formatting">
    <RovingFocus.Item>
      <Button>Bold</Button>
    </RovingFocus.Item>
    <RovingFocus.Item>
      <Button>Italic</Button>
    </RovingFocus.Item>
    <RovingFocus.Item disabled>
      <Button>Underline</Button>
    </RovingFocus.Item>
  </Div>
</RovingFocus>
```

```tsx
<RovingFocus orientation="both" typeahead>
  <Div role="grid" aria-label="Emoji">
    {cells.map((cell) => (
      <RovingFocus.Item key={cell.id}>
        <Button>{cell.label}</Button>
      </RovingFocus.Item>
    ))}
  </Div>
</RovingFocus>
```

`orientation="both"` moves in two dimensions. Typeahead is off by default; Listbox and Menu turn it on. Tabs leave it off.

## Proposed API

```ts
interface RovingFocusProps {
  children?: React.ReactNode
  orientation?: "horizontal" | "vertical" | "both"
  loop?: boolean
  typeahead?: boolean
}

interface RovingFocusItemProps {
  children?: React.ReactNode
  disabled?: boolean
}
```

RovingFocus and `RovingFocus.Item` render no extra nodes.

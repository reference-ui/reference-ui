# Splitter

Accessible resizable panel partitions (`role="separator"`). Pointer/touch drag, min/max clamping, keyboard resize (Arrow, Home/End, Enter to collapse), selection prevention during resize.

```tsx
<Splitter
  orientation="horizontal"
  value={sizes}
  onChange={setSizes}
>
  <Splitter.Panel min="10r">{sidebar}</Splitter.Panel>
  <Splitter.Handle aria-label="Resize sidebar" />
  <Splitter.Panel>{main}</Splitter.Panel>
</Splitter>
```

## Proposed API

```ts
interface SplitterProps {
  children?: React.ReactNode
  orientation?: "horizontal" | "vertical"
  value: number[]
  onChange?: (value: number[]) => void
}

interface SplitterPanelProps
  extends React.HTMLAttributes<HTMLDivElement> {
  min?: number | string
  max?: number | string
}

interface SplitterHandleProps
  extends React.HTMLAttributes<HTMLDivElement> {}
```

`Splitter` and `Splitter.Panel` render `div`. `Splitter.Handle` renders `div` with `role="separator"`.

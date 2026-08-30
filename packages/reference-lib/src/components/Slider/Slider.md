# Slider

Pointer drag math, multi-thumb collision, keyboard stepping (arrows, PageUp/PageDown, Home/End), ARIA value ranges.

```tsx
<Slider value={value} onChange={setValue} min={0} max={100} step={1}>
  <Slider.Track>
    <Slider.Range />
    <Slider.Thumb aria-label="Volume" />
  </Slider.Track>
</Slider>
```

```tsx
<Slider value={range} onChange={setRange} min={0} max={100}>
  <Slider.Track>
    <Slider.Range />
    <Slider.Thumb aria-label="Minimum" />
    <Slider.Thumb aria-label="Maximum" />
  </Slider.Track>
</Slider>
```

## Proposed API

```ts
type SliderValue = number | number[]

interface SliderProps {
  children?: React.ReactNode
  value: SliderValue
  onChange?: (value: SliderValue) => void
  min?: number
  max?: number
  step?: number
  orientation?: "horizontal" | "vertical"
  disabled?: boolean
}

interface SliderTrackProps
  extends React.HTMLAttributes<HTMLDivElement> {}

interface SliderRangeProps
  extends React.HTMLAttributes<HTMLDivElement> {}

interface SliderThumbProps
  extends React.HTMLAttributes<HTMLDivElement> {}
```

`Slider` renders `div`. `Slider.Track` and `Slider.Range` render `div`. `Slider.Thumb` renders `div` with `role="slider"`.

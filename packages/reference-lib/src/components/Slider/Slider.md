# Slider

Proof: [TESTS.md](./TESTS.md).

Pointer drag math, multi-thumb collision, keyboard stepping (arrows, PageUp/PageDown, Home/End), ARIA value ranges (`aria-valuenow`, `aria-valuemin`, `aria-valuemax`).

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

---

## Problems we own

Native `<input type="range">` is one thumb and poor for dual handles. This primitive is the drag + keyboard + ARIA kernel. Track/thumb chrome is application markup.

### Multi-thumb collision

Thumbs must not cross (or must swap deliberately). Aria clamps each thumb to its neighbours (`getThumbMinValue` / `Max`). Radix `minStepsBetweenThumbs` + `preserveThumbOrder` (order vs swap). Zag `thumbCollisionBehavior`.

**Lift** neighbour clamp as default. Freeze preserve-vs-swap if a composition needs swap.

### Keyboard + RTL

Arrows step; PageUp/Down large step (~(max−min)/10 in Aria, explicit `largeStep` in Zag); Home/End to bounds. Horizontal RTL reverses increase direction. Vertical is independent of RTL.

**Vendor.** Aria `useSliderThumb`. Radix `PAGE_KEYS` + dir-keyed maps.

**Lift** Aria/Radix key maps. RTL is a freeze-gate, not an afterthought.

### Pointer drag offset

Grabbing the thumb edge vs center jumps the value. Zag `thumbDragOffset` / `thumbAlignment: contain` — measure thumb size, keep the grab point.

**Lift** Zag offset. Pointer capture so drag continues outside the track.

### Form `name` / hidden inputs

Vendors often bubble a hidden input for forms. Reference UI does not wrap form-field wiring (`components.md`). Application owns the form.

**Leave.**

---

## Convergence

**Keyboard/ARIA:** react-aria `useSlider` / `useSliderState`. **Multi-thumb order option:** radix. **Drag offset:** zag. Anatomy stays visible; no `as`.

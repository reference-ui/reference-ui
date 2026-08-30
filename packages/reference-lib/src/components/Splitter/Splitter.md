# Splitter

Proof: [TESTS.md](./TESTS.md).

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
interface SplitterProps
  extends Omit<ReferencePartProps<"div">, "onChange"> {
  orientation?: "horizontal" | "vertical"
  value: number[]
  onChange?: (value: number[]) => void
  onChangeEnd?: (value: number[]) => void
}

interface SplitterPanelProps
  extends ReferencePartProps<"div"> {
  min?: number | string
  max?: number | string
  collapsible?: boolean
  collapsedSize?: number
}

interface SplitterHandleProps
  extends ReferencePartProps<"div"> {
  disabled?: boolean
}
```

`Splitter` and `Splitter.Panel` render `div`. `Splitter.Handle` renders `div` with `role="separator"`.

`value` entries are percentages in current Panel order and sum to 100.
Numbers on `min`, `max`, and `collapsedSize` are percentage points; CSS strings
are measured lengths. Omitted orientation is horizontal. An opted-in
collapsible Panel defaults to `collapsedSize=0` and restores its last feasible
expanded size. `onChange` requests each changed drag/keyboard candidate;
`onChangeEnd` receives the last requested layout once on successful pointer
release or keyboard keyup. Repeated keydowns form one interaction, pointer
cancellation emits no end, and programmatic value changes emit neither
callback. Every Panel exposes its resolved percentage as
`--reference-splitter-panel-size`; Splitter never overwrites application
flex/grid/transform styles.

Each Handle's primary pane is the preceding logical Panel: left in LTR, right
in RTL, and above for vertical groups. Splitter assigns that Panel a stable ID
when needed and sets the Handle's `aria-controls` to it. Controlled size arrays
remain positional in current Panel order; the ID stabilizes only ARIA,
constraints, and remembered collapse size, not value-to-Panel mapping.

---

## Problems we own

Layout is CSS; this primitive is the separator behaviour. Controlled `value` is panel sizes. `r` units on `min`/`max` are StyleProps-friendly constraints, not a second layout system.

### Drag + min/max clamp

Pixel and percentage constraints, nested groups, hit regions that are larger than the visible bar.

**Vendor.** `vendor/react-resizable-panels/lib` — `calculatePanelConstraints`, pointer handlers, `adjustLayoutByDelta`. Zag splitter machine.

**Lift** RRP math as primary. Map to controlled sizes; **leave** RRP’s public group/hit-region API and demo skins.

### Keyboard + Enter collapse

Arrows nudge; Home/End to min/max; Enter collapses (Zag is clearer here). `aria-valuenow` / `valuemin` / `valuemax` on `role="separator"`.

**Vendor.** RRP `onDocumentKeyDown`. Zag collapse/expand on keyboard.

**Lift** both; freeze Enter→collapse.

### Selection prevention

Dragging a handle selects page text. `user-select: none` and `preventDefault` on pointer for the drag session.

**Lift** Zag `userSelect` / RRP `preventDefault`.

### Nested scroll / iframe

RRP has a lot of global event machinery. Steal tests; do not take VS Code chrome.

---

## Convergence

**react-resizable-panels `lib`** for drag/constraints. **zag splitter** for keyboard collapse and ARIA value helpers. Public API stays orientation + controlled sizes + visible Panel/Handle anatomy.

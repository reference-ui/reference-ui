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

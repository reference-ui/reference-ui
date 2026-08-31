# Splitter

Proof: [TESTS.md](./TESTS.md).

A 1D flex partition with a window-splitter Handle. Splitter owns layout
along one axis, the pointer drag loop (direct DOM writes, no React commit
per move), min/max clamping, keyboard, collapse/restore, and ARIA.
It is a small animation-style kernel sitting on flexbox, not a layout-mode
switch.

Root is `display: flex`. `orientation` sets `flex-direction`. Panels are
flex children. Handles are flex children between them. Size is a CSS
variable written onto each Panel; flex-basis follows it. That is the whole
layout contract.

There is no grid mode, no block mode, no “drop this box into someone else’s
tracks.” Resizable tried that and could not get width, `flex-grow`, and
`grid-template-columns` to mean the same thing. Flex can do the job of a
1D split. Grid’s unique power is 2D (named areas, spanning, rows *and*
columns). That belongs in page chrome, or **inside** a Panel, where the
grid simply receives a new container size.

```tsx
<Splitter
  orientation="horizontal"
  value={sizes}
  onChange={setSizes}
  height="100%"
>
  <Splitter.Panel min="12r" collapsible>
    {sidebar}
  </Splitter.Panel>
  <Splitter.Handle aria-label="Resize sidebar" />
  <Splitter.Panel>{main}</Splitter.Panel>
</Splitter>
```

Two axes are nested Splitters, not a 2D grid:

```tsx
<Splitter value={cols} onChange={setCols} height="100%">
  <Splitter.Panel min="12r">{nav}</Splitter.Panel>
  <Splitter.Handle aria-label="Resize navigation" />
  <Splitter.Panel min="0">
    <Splitter
      orientation="vertical"
      value={rows}
      onChange={setRows}
      height="100%"
    >
      <Splitter.Panel min="12r">{editor}</Splitter.Panel>
      <Splitter.Handle aria-label="Resize console" />
      <Splitter.Panel min="8r">{console}</Splitter.Panel>
    </Splitter>
  </Splitter.Panel>
</Splitter>
```

A page grid wraps a Splitter, or a grid lives inside a Panel. Neither is a
Splitter API. When the Panel’s used size changes, the inner grid reflows
on its own.

## Proposed API

```ts
interface SplitterProps
  extends Omit<
    ReferencePartProps<"div">,
    "onChange" | "display" | "flexDirection"
  > {
  orientation?: "horizontal" | "vertical"
  value: number[]
  onChange?: (value: number[]) => void
  onChangeEnd?: (value: number[]) => void
}

interface SplitterPanelProps
  extends Omit<
    ReferencePartProps<"div">,
    "flexGrow" | "flexShrink" | "flexBasis" | "flex"
  > {
  min?: number | string
  max?: number | string
  collapsible?: boolean
  collapsedSize?: number
}

interface SplitterHandleProps
  extends Omit<
    ReferencePartProps<"div">,
    "flexGrow" | "flexShrink" | "flexBasis" | "flex"
  > {
  disabled?: boolean
}
```

`Splitter` and `Splitter.Panel` render `div`. `Splitter.Handle` renders `div`
with `role="separator"`.

Anatomy is `Panel (Handle Panel)+`. Leading, trailing, or consecutive
Handles, consecutive Panels without a Handle, and a `value` length that
does not match the Panel count are errors. A one-Panel tree is not a
mode; “the rest of the page” is another Panel.

Omitted orientation is horizontal (`flex-direction: row`). Vertical is
`column`. Omitted `collapsible` is false. An opted-in collapsible Panel
defaults to `collapsedSize=0`. Omitted Handle `disabled` is false.

`value` entries are percentages in current Panel order and sum to 100.
Numbers on `min`, `max`, and `collapsedSize` are percentage points. CSS
strings (`12r`, `120px`, `10rem`, `20%`) are measured lengths resolved
against the **available group size**: the sum of Panel sizes on the layout
axis, excluding Handles. `%` strings are of that available size. `r`
resolves through the same spacing root as StyleProps. Constraint props do
not write CSS `min-width` / `max-width`.

Each Panel publishes `--reference-splitter-panel-size` as its percentage
(unit included, e.g. `30%`). Splitter sets Panel `flex-grow: 1`,
`flex-shrink: 1`, `flex-basis: var(--reference-splitter-panel-size)`, and
`min-width: 0` / `min-height: 0` on the layout axis so flex items can
shrink. Handle is `flex: 0 0 auto`. Root `display` and `flex-direction` are
owned. Those flex properties are omitted from the public StyleProps
surface so applications cannot fight the kernel. Cross-axis StyleProps,
gap, padding, colors, and Handle hit size remain authored.

Root also publishes `--reference-splitter-1` … `--reference-splitter-N` in
Panel order for inner CSS that wants to read the partition (an inner grid
can use them; Splitter itself does not).

Each Handle’s primary pane is the preceding logical Panel: left in LTR,
right in RTL, above for vertical. Splitter assigns that Panel a stable ID
when needed and sets the Handle’s `aria-controls` to it.
`aria-orientation` is perpendicular to the layout axis. `aria-valuenow` is
the primary Panel’s percentage; `aria-valuemin` / `aria-valuemax` are its
feasible bounds. The application supplies the accessible name.

`onChange` requests each changed candidate as one complete array.
`onChangeEnd` receives the last requested layout once on successful
pointer release or keyboard keyup. Repeated keydowns form one interaction,
cancellation emits no end, and programmatic value changes emit neither
callback.

Keyboard: Arrow along the axis nudges 1 percentage point; Shift+Arrow
nudges 10; Home/End go to feasible min/max; Enter collapses or restores an
opted-in primary Panel. Cross-axis Arrows are left to the application.

---

## Why flex, not grid, not “any layout”

Resizable wrote `width` onto a box and hoped grid, flex, and block would
all honour it. They do not. Grid tracks ignore or fight item `width`.
Flex items ignore `width` when `flex-grow` is set. Block `width` does not
redistribute a neighbour. Direct DOM writes then disagree with the
stylesheet, which is the consistency hole.

A window splitter is one axis. Flex is the 1D tool. Nested Splitters give
the IDE ‘grid’ (column | (editor / terminal)) without a second layout
engine or a 2D handle graph.

CSS Grid’s unique work is **2D page chrome**: named areas, spanning
header, nav full-height vs content-height. That is PageLayout’s
`LayoutGrid`, not this primitive. Those regions do not resize *against
each other* by rewriting `grid-template-columns` from a pointer. They
either wrap a Splitter (the content row is one flex partition) or put a
grid *inside* a Panel. When the Panel’s flex-basis changes, the inner grid
gets a new containing block and `fr` / `minmax` do their job. Splitter
does not need a grid mode for that.

Direct DOM writes still cause flex layout, not compositor-only updates.
The animation-style win is **skipping React**, not skipping layout. Panel
content has to reflow. `style.setProperty` on a CSS variable that already
drives `flex-basis` is the cheapest honest path.

---

## While the pointer is down

React cannot paint a flex change until the parent accepts `onChange` and
commits. Splitter writes `--reference-splitter-panel-size` on the Panel
elements from the pointer handler, the same idea as Resizable’s
`el.style.width`. Flex-basis follows the variable on the next browser
layout, with no React render.

- The panes follow the pointer immediately.
- `onChange` still fires so application state can catch up.
- ARIA attributes do not update per move.
- Splitter does not `setState` per move.

If the parent applies each request, the later commit matches what is
already on screen. If it ignores `onChange`, the panes still track the
pointer, then return to `value` on release. `value` is authoritative
whenever the pointer is up.

On primary pointerdown of an enabled Handle, Splitter captures in one
layout read: origin pointer, origin layout, available group size, and the
constraint table already converted to percentages. It takes pointer
capture immediately, focuses the Handle, sets `data-resizing`, and
installs document selection-lock and the resize cursor.

Each pointermove:

1. `delta = (pointer - origin) / groupSize * 100` (axis + RTL aware).
2. Solver runs on **origin layout + total delta**, not last-frame + increment.
3. CSS variables are written through element refs.
4. `onChange` fires if the candidate changed.

It does **not**, on that path: `setState`, read layout, convert CSS/`r`
lengths, write ARIA, start a rAF loop, rebase the origin, or write
`flex-grow` / `width` as competing signals.

On successful pointerup: write ARIA, emit `onChangeEnd`, clear capture /
document lock / cursor / `data-resizing`, return visual authority to
`value`. Cancellation emits no end and restores the same way.

Keyboard is not a hot path: it writes variables, ARIA, and `onChange` on
the same turn.

Idle measurement is ResizeObserver on Root. It re-resolves string/`r`
constraints and ARIA bounds. It never mutates `value` and never runs while
the pointer is down. Group size for an in-flight gesture stays the
captured value.

---

## Frame budget

The pointermove handler is the product.

**Per move, allowed:** pointer delta arithmetic, the pure percentage
solver, `style.setProperty` on already-known Panel/Root elements, one
`onChange` call.

**Per move, forbidden:** React commit of Splitter parts or descendants,
`getBoundingClientRect` / `offsetWidth` / `getComputedStyle`, CSS-length
or `r` conversion, ARIA attribute writes, rAF scheduling, document
listener attach/detach, constraint re-derivation.

Handle is in-flow. As flex-basis changes, it moves with layout. No overlay
chase, no `position: fixed`, no rAF rect polling.

Document `user-select` and the axis resize cursor are owned for the
gesture. `touch-action: none` is a Handle default. `will-change` /
`contain` are application CSS against `data-resizing`.

---

## Store and hooks

Per [hooks.md](../../core/hooks/hooks.md). No public Provider, no public store.

**Store shape (per Splitter instance).** Controlled `value`, orientation,
and callbacks stay props. The store holds part registration (Panel/Handle
order, ids, constraint props, element refs), idle derived constraints and
available group size, remembered collapse sizes keyed by Panel id, and an
optional pointer-down record (origin pointer/layout/group size/
constraints, last candidate, pointer id). Those fields are not a second
public value.

**Actions.** Register/unregister parts; recompute idle constraints;
begin/move/end/cancel pointer gesture; apply a keyboard delta or
collapse/restore; request `onChange` / `onChangeEnd`.

**Selectors.** Parts subscribe to orientation, disabled/collapsed/resizing
flags, and idle ARIA values. They do **not** subscribe to per-move
candidates. CSS variables are ref writes, not selector outputs.

**Hooks.** Owner Context is allowed so Panel/Handle find this Splitter.
Document cursor/selection lock is per active gesture.

**Lifecycle.** One store per mounted Root. StrictMode replay must not leak
listeners or capture. Unmount cancels an active gesture.

**Isolation.** Two Splitters do not share a gesture. Nested: only the
Handle that received pointerdown owns it.

**Multi-root / MFE.** Store is per instance. Document lock attaches to the
Handle’s `Document`.

Rejected `value` stays authoritative after the pointer is up.

---

## Problems we own

### One layout engine

**Lift** flex as the kernel layout (RRP’s actual runtime). **Leave**
Resizable’s layout-agnostic `width` writes, grid-template driving, block
mode, and a one-Panel “BYO parent” form.

### Drag loop without React

**Lift** Resizable `Handle/domHelpers.ts` / `initializeDragState` /
WcagContext isolation: write the size signal from the pointer handler,
keep ARIA off that path. **Leave** RRP `useSyncExternalStore` re-render of
every Panel on every move; always-on document pointermove hit-testing.

### Handle is a flex child

In-flow between Panels. Hit size is StyleProps. **Leave** `position: fixed`
+ rAF chase, public hit-region APIs, Handle-as-child-of-Panel overlay.

### Constraint conversion is idle work

Convert CSS/`r` at pointerdown and on idle resize. Bare numbers are
percentage points of the group.

### Neighbour transfer

RRP `adjustLayoutByDelta` in percentages. Nested Splitter for the second
axis.

### Keyboard, Enter collapse, ARIA

1 / 10 points; Home/End; Enter collapse/restore keyed by Panel id.
**Leave** baked `aria-label`, extra collapse/hover/drag callbacks,
unmounting the Handle when disabled.

### Selection, cursor, capture

Immediate `setPointerCapture`, document `user-select`, `col-resize` /
`row-resize`.

### Collapse animation

**Leave** transform/opacity animation and forced `offsetWidth` reflow.

---

## Convergence

| Piece | Own | Leave |
| --- | --- | --- |
| Layout | Flex on Root; nested Splitter for 2D | Grid mode; block mode; BYO parent tracks |
| Public value | `%[]` summing to 100 | Pixel width on a foreign box; RRP object maps |
| Visuals during drag | Ref-owned CSS variables → flex-basis | React commit per move; inline `width` fighting flex |
| Handle | In-flow `role="separator"` flex child | `position: fixed`; overlay-in-Panel; public hit regions |
| Solver | RRP `adjustLayoutByDelta` | One-box clamp as the public form |
| Constraints | `%` numbers + measured CSS/`r`, convert off the hot path | Convert per pointermove |
| Inner 2D | Application grid/flex inside a Panel | Splitter rewriting `grid-template-*` |
| State | Per-instance Zustand | Public Provider; RRP global group registry |

Primary ports: **react-resizable-panels flex partition + transfer math**,
**design-system/resizable direct-DOM drag loop**, **zag collapse/restore**.
PageLayout grid stays page chrome; it may wrap a Splitter or sit inside a
Panel.

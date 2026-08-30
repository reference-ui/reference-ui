# Components

Yesterday's component patterns were optimized for human convenience. Monolithic meant "batteries included"—a quick drop-in that saved human keystrokes. Even classic atomic design was structured around human visual hierarchies rather than composable systems.

Today, those patterns often create more hurdles than they solve:

- **Monoliths create friction:** Rigid widgets require endless overrides, fight custom requirements, and add maintenance overhead.
- **Atomic design needs a rethink:** Fixed hierarchies of atoms and molecules do not fit modern composability or AI-assisted workflows.
- **AI-era bottlenecks:** Opaque abstractions and proprietary prop soup force heavy prompt engineering and make generated code less reliable.

Reference UI takes a primitive-first approach:

- **Primitives over monoliths:** Composable foundations instead of rigid, all-in-one widgets.
- **AI-native ergonomics:** Predictable, transparent APIs that code-generation models can reason about and compose reliably.
- **Zero friction:** Full control over structure, styling, and behaviour without fighting unnecessary abstraction.

Reference UI centralizes difficult, invariant behaviour. Product semantics, application state, markup, and visual design remain in application code.

## API principles

- **Explicit composition:** Component anatomy is visible in JSX rather than hidden behind configuration objects.
- **Controlled application state:** Application state is passed directly through props. Components do not invent parallel state models.
- **No React context contract:** Reference UI does not require React context or expose provider-dependent component APIs.
- **Stable DOM semantics:** Components render a defined native element. They do not provide an `as` prop.
- **Native props remain available:** Parts accept the attributes and events of the element they render.
- **Patterns are not necessarily components:** A named interface pattern may be a documented composition of lower-level primitives rather than another runtime abstraction.

## Reference UI Core

Reference UI replaces legacy component abstractions with a lean, compiler-backed system that mirrors the web platform directly.

### Typed HTML primitives

In earlier component eras, design systems introduced polymorphic `as` props and generic layout wrappers (`<Box>`, `<Flex>`, `<Grid>`, `<Stack>`) to save keystrokes. Over time, this created significant friction: TypeScript union explosions, prop drift, inaccessible `<div>` soup, and unpredictable runtime overrides.

Reference UI eliminates polymorphic `as` props entirely. Instead, it generates statically typed native HTML primitives that map directly 1:1 to the DOM:

- `<Div>` renders `<div>`
- `<Section>` renders `<section>`
- `<Nav>` renders `<nav>`
- `<Header>` renders `<header>`
- `<Main>` renders `<main>`
- `<Button>` renders `<button>`
- `<A>` renders `<a>`

### Layout and rhythm units (`r`)

Layout is not a component abstraction—the browser is the layout engine. Layout and spacing are authored directly through compile-time style props on native elements, powered by Reference UI's typographic baseline rhythm system (`r`):

- **Whole multiples:** `1r`, `2r`, `3r`, `4r`
- **Decimals & fractions:** `0.5r`, `1/2r`, `1/3r`, `1/4r`

```tsx
<Section display="flex" flexDirection="column" gap="2r" padding="1r">
  <Nav display="flex" alignItems="center" gap="1r">
    <A href="/home">Home</A>
    <A href="/docs">Docs</A>
  </Nav>

  <Div display="grid" gridTemplateColumns="repeat(3, 1fr)" gap="1r">
    {children}
  </Div>
</Section>
```

This guarantees pristine TypeScript type safety, zero DOM wrapper overhead, mathematical layout harmony, and complete transparency for developers and AI models.

## Foundation components

Reference UI only provides a runtime component when it centralizes behaviour that should not be repeatedly rebuilt by developers or AI agents.

Working API files for primitives that will be implemented live in sibling folders (`Overlay/Overlay.md`, `Popover/Popover.md`, and so on). This document remains the freeze-gate overview. Names under Documented compositions do not get folders — they are not runtime components.

Foundation components solve application-wide mechanics:

- `ReferenceLibrary`
- `Portal`
- `Overlay`
- `Popover`
- `Toast`

`Dialog`, `Modal`, `AlertDialog`, `Drawer`, `Sheet`, and `Lightbox` are not separate foundational components. They are semantic and visual compositions of `Overlay`.

---

### ReferenceLibrary

Mounts Reference UI's application-level runtime systems.

`ReferenceLibrary` is not a React context provider. It does not inject values into its descendants or require components to remain beneath a particular context boundary. It provides a stable React-level mount for systems that operate across the application, including Toast and `announce()`.

```tsx
<ReferenceLibrary
  toaster={{
    defaultPosition: "bottom-end",
    defaultDuration: 5000,
    limit: 4,
  }}
>
  <App />
</ReferenceLibrary>
```

Approximate API:

```ts
interface ReferenceLibraryProps {
  children?: React.ReactNode
  toaster?: {
    defaultPosition?: ToastPosition
    defaultDuration?: number | false
    limit?: number
  }
}
```

---

### Portal

Moves content to another location in the DOM while preserving its position in the React tree. Portal does not add a wrapper element or manage stacking, focus, dismissal, or modality.

The default container is `document.body`. Consumers may provide another container when required by scoped themes, microfrontends, Shadow DOM, fullscreen interfaces, tests, or application-specific overlay roots.

```tsx
<Portal>{children}</Portal>
```

```tsx
<Portal container={portalContainer}>
  {children}
</Portal>
```

The container may be supplied directly, through a ref, or through a function when it is resolved later in the application lifecycle.

Approximate API:

```ts
type PortalContainer = Element | DocumentFragment

type PortalContainerRef = {
  current: PortalContainer | null
}

interface PortalProps {
  children?: React.ReactNode
  container?:
    | PortalContainer
    | PortalContainerRef
    | (() => PortalContainer | null)
    | null
}
```

---

### Overlay

A controlled foundation for temporary content displayed above and isolated from the application.

Overlay handles the shared mechanics: portal rendering, layer-stack registration, nesting, dismissal ordering, focus containment (`FocusLock`), background inerting, scroll locking, and focus restoration.

It does not provide a trigger or prescribe the content's semantic role, structure, placement, dimensions, animation, or appearance. Whether the resulting interface is a dialog, alert dialog, drawer, sheet, or lightbox is determined by the content composed inside it.

```tsx
<Overlay open={open} onDismiss={close}>
  <Overlay.Backdrop />

  <Overlay.Content
    role="dialog"
    aria-modal="true"
    aria-labelledby="overlay-title"
  >
    <h2 id="overlay-title">Delete project?</h2>
    {children}

    <button type="button" onClick={close}>
      Cancel
    </button>
  </Overlay.Content>
</Overlay>
```

Overlay portals internally by default. `Overlay.Portal` is an optional configuration part; it does not wrap or own the overlay content.

```tsx
<Overlay open={open} onDismiss={close}>
  <Overlay.Portal container={portalContainer} />
  <Overlay.Backdrop />
  <Overlay.Content>{children}</Overlay.Content>
</Overlay>
```

Because Overlay is controlled, dismissal requests do not change application state themselves. Applications can handle high-level dismissal with `onDismiss` or target specific interactions with granular handlers (`onEscape`, `onOutsidePress`).

When both granular and high-level handlers are present, granular handlers execute first. If the granular handler does not cancel the interaction via `event.preventDefault()`, `onDismiss` fires:

```text
onEscape(event)       → if (!event.defaultPrevented) → onDismiss()
onOutsidePress(event) → if (!event.defaultPrevented) → onDismiss()
```

```tsx
<Overlay
  open={open}
  onEscape={close}
  onOutsidePress={close}
>
  {children}
</Overlay>
```

#### Initial focus

Real dialogs constantly need to focus a specific control — the first input, or the destructive action — rather than whichever element happens to be first in tab order.

`Overlay.Content` accepts `initialFocus`. When omitted, Overlay focuses the first tabbable descendant. A ref focuses that element. `false` skips the move and leaves focus management to the application.

```tsx
<Overlay.Content
  role="dialog"
  aria-modal="true"
  initialFocus={nameInputRef}
>
  <input ref={nameInputRef} />
</Overlay.Content>
```

```tsx
<Overlay.Content
  role="alertdialog"
  aria-modal="true"
  initialFocus={confirmRef}
>
  <button type="button" ref={confirmRef}>
    Delete
  </button>
</Overlay.Content>
```

#### Presence and `data-state`

`open={false}` is a state change, not an immediate unmount. Overlay keeps Backdrop and Content mounted through the exit cycle via `Presence`, and sets `data-state="open" | "closed"` on both so CSS transitions can finish — including drawer and sheet slide-out.

Focus restoration, inerting teardown, and scroll unlock run after Presence reports the exit complete. Applications style against `data-state`; they do not set it, wrap Overlay in Presence, or delay `open={false}` in order to animate.

```css
[data-state="open"] {
  transform: translateX(0);
}

[data-state="closed"] {
  transform: translateX(100%);
}
```

#### Layer stack

Overlay, Popover, and Menu share one layer stack.

- Escape dismisses only the topmost layer.
- An outside-press whose target is inside a nested popup does not dismiss the parent.
- A menu opened from a dialog is a child layer: Escape closes the menu first; a second Escape closes the dialog.
- Popover and Overlay nest in either direction under the same rules.

This contract is not Overlay-specific. Popover and Menu register on the same stack; they do not keep private dismissal worlds.

Approximate API:

```ts
interface OverlayDismissHandlers {
  onDismiss?: () => void
  onEscape?: (event: KeyboardEvent) => void
  onOutsidePress?: (event: PointerEvent) => void
}

interface OverlayProps extends OverlayDismissHandlers {
  children?: React.ReactNode
  open: boolean
}

interface OverlayPortalProps {
  container?: PortalProps["container"]
}

interface OverlayBackdropProps
  extends React.HTMLAttributes<HTMLDivElement> {}

interface OverlayContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  initialFocus?: React.RefObject<HTMLElement | null> | false
}
```

---

### Popover

Controlled, anchored floating content.

Popover owns positioning, collision handling, keyboard and pointer interaction, accessible state, outside dismissal, focus restoration, and registration on the shared layer stack with Overlay and Menu.

By default, `Popover.Trigger` is both the interaction source and the positioning anchor. That default does not cover every real case. A context menu anchors to pointer coordinates; a selection menu anchors to a text range; a canvas or table-cell menu anchors to a shape or cell rect. An optional virtual `anchor` (element, rect, or point) is the positioning reference in those cases. The trigger may be omitted when the application already owns the interaction — right-click, selection, or a hit-tested canvas object.

Virtual anchors are positioning math. They stay inside Popover.

```tsx
<Popover open={open} onDismiss={close}>
  <Popover.Trigger onClick={() => setOpen((prev) => !prev)}>
    Open filters
  </Popover.Trigger>

  <Popover.Content placement="bottom-start" offset={8}>
    {children}
  </Popover.Content>
</Popover>
```

```tsx
<Popover
  open={open}
  onDismiss={close}
  anchor={{ x: pointerX, y: pointerY }}
>
  <Popover.Content placement="bottom-start">
    {children}
  </Popover.Content>
</Popover>
```

When both a trigger and an `anchor` are present, the trigger remains the interaction and accessibility source; `anchor` wins for positioning.

`Popover.Trigger` renders a native `button`. `Popover.Content` renders a native `div`.

Popover portals internally by default. `Popover.Portal` optionally configures the destination and does not wrap the content.

```tsx
<Popover open={open} onDismiss={close}>
  <Popover.Trigger onClick={() => setOpen((prev) => !prev)}>
    Open filters
  </Popover.Trigger>
  <Popover.Portal container={portalContainer} />
  <Popover.Content>{children}</Popover.Content>
</Popover>
```

An optional arrow participates in the same positioning calculation. Collision handling includes flipping and shifting in view; list-style popups (Select, Combobox, Menu) also need available-height so the popup can scroll instead of overflowing the viewport. That is positioning math on `Popover.Content`, not a second primitive.

```tsx
<Popover open={open} onDismiss={close}>
  <Popover.Trigger onClick={() => setOpen((prev) => !prev)}>
    More information
  </Popover.Trigger>

  <Popover.Content placement="top">
    <Popover.Arrow />
    {children}
  </Popover.Content>
</Popover>
```

Popover uses the same Presence / `data-state` contract as Overlay: `open={false}` does not unmount Content until exit animations complete.

#### Hover interaction

Tooltip owns hover intent and is explicitly non-interactive. Interactive floating content is a Popover.

The hard part of hover-opened interactive content is not the open delay — it is pointer travel from the trigger into the content without dismissing (grace area / safe-polygon tracking). Popover owns that machinery when `openOnHover` is set. Open remains controlled: Popover requests open through `onOpen` after hover intent, and close through `onDismiss` after the pointer leaves the trigger, the content, and the safe polygon.

HoverCard is that composition, not a separate primitive.

```tsx
<Popover
  open={open}
  onOpen={() => setOpen(true)}
  onDismiss={close}
  openOnHover
>
  <Popover.Trigger>Preview</Popover.Trigger>
  <Popover.Content>{children}</Popover.Content>
</Popover>
```

Approximate API:

```ts
type PopoverPlacement =
  | "top"
  | "top-start"
  | "top-end"
  | "right"
  | "right-start"
  | "right-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end"

type VirtualAnchor =
  | Element
  | DOMRect
  | { getBoundingClientRect(): DOMRect }
  | { x: number; y: number; width?: number; height?: number }

interface PopoverProps extends OverlayDismissHandlers {
  children?: React.ReactNode
  open: boolean
  onOpen?: () => void
  anchor?: VirtualAnchor
  openOnHover?: boolean
  openDelay?: number
  closeDelay?: number
}

interface PopoverTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

interface PopoverPortalProps {
  container?: PortalProps["container"]
}

interface PopoverContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  placement?: PopoverPlacement
  offset?: number
  collisionPadding?: number
}
```

---

### Toast

Toast provides the infrastructure for transient application content without prescribing its appearance or meaning.

Reference UI manages mounting, queueing, stacking, timing, dismissal, accessible announcements, and coordination with other interface elements. It does not include semantic variants such as `success`, `error`, or `loading`. Applications define those concepts themselves.

Timers pause while the pointer is over a toast and while a modal Overlay is the top layer. That is queue behaviour, not Overlay.

The toaster is mounted internally by `ReferenceLibrary`. It renders directly at the React root without a portal or React context.

```tsx
<ReferenceLibrary
  toaster={{
    defaultPosition: "bottom-end",
    defaultDuration: 5000,
    limit: 4,
  }}
>
  <App />
</ReferenceLibrary>
```

Custom toast types are created with `toast.define()`. Each definition owns its rendered content and default behaviour.

```tsx
const ProjectSavedToast = toast.define({
  duration: 4000,

  render({ project }, { close }) {
    return (
      <div>
        <span>{project.name} was saved</span>

        <button type="button" onClick={close}>
          Dismiss
        </button>
      </div>
    )
  },
})
```

```tsx
toast.show(
  ProjectSavedToast,
  { project },
  { announce: `${project.name} was saved` }
)
```

The second argument passed to `render` contains explicit controls for the current toast instance:

```ts
interface ToastControls {
  id: ToastId
  close(): void
}
```

Definitions can replace one another while preserving the identity of an existing toast. This allows applications to model any lifecycle without Reference UI defining concepts such as loading or success.

```tsx
const UploadingToast = toast.define({
  duration: false,

  render({ file }, { close }) {
    return (
      <div>
        <span>Uploading {file.name}…</span>

        <button type="button" onClick={close}>
          Cancel
        </button>
      </div>
    )
  },
})

const UploadCompleteToast = toast.define({
  duration: 4000,

  render({ file }, { close }) {
    return (
      <div>
        <span>{file.name} was uploaded</span>

        <button type="button" onClick={close}>
          Dismiss
        </button>
      </div>
    )
  },
})
```

```tsx
const id = `upload:${file.id}`

toast.show(
  UploadingToast,
  { file },
  { id, announce: `Uploading ${file.name}` }
)
toast.update(
  id,
  UploadCompleteToast,
  { file },
  { announce: `${file.name} was uploaded` }
)
toast.dismiss(id)
```

Configuration resolves from the most specific value to the system default:

```text
Invocation options → toast definition → toaster defaults
```

Approximate API:

```ts
type ToastId = string

type ToastPosition =
  | "top-start"
  | "top-center"
  | "top-end"
  | "bottom-start"
  | "bottom-center"
  | "bottom-end"

interface ToastDefinition<Props> {
  render(
    props: Props,
    controls: ToastControls
  ): React.ReactNode

  duration?: number | false
  position?: ToastPosition
}

interface ToastOptions {
  id?: ToastId
  duration?: number | false
  position?: ToastPosition
  announce?: string
}

toast.define<Props>(
  definition: ToastDefinition<Props>
): ToastDefinition<Props>

toast.show<Props>(
  definition: ToastDefinition<Props>,
  props: Props,
  options?: ToastOptions
): ToastId

toast.update<Props>(
  id: ToastId,
  definition: ToastDefinition<Props>,
  props: Props,
  options?: Omit<ToastOptions, "id">
): void

toast.dismiss(id?: ToastId): void

announce(
  message: string,
  options?: { politeness?: "polite" | "assertive" }
): void
```

Calling `toast.dismiss()` without an ID dismisses every active toast.

`announce()` is the same live-region path without a toast, mounted by `ReferenceLibrary`. Use it for non-toast status that still needs to reach assistive technology. Toast `announce` options go through this path.

A toast definition is ordinary, visible application code. AI agents can create exactly the notification requested without reverse-engineering proprietary variants, fixed layouts, or hidden component state.

---

## ARIA primitives

Beyond foundational layer management (`Overlay`, `Popover`, `Portal`, `Toast`), certain interface patterns require strict adherence to the **WAI-ARIA Authoring Practices Guide (APG)**. These patterns involve complex state machines, roving tabindex, active-descendant tracking, typeahead searching, and keyboard traversal contracts that should not be repeatedly rebuilt on the fly.

Proposed APIs for these primitives live in sibling folders (`Listbox/Listbox.md`, `Menu/Menu.md`, and so on).

Following the same primitive-first philosophy, these components remain decoupled, unstyled, and highly composable:

- **`Listbox`**  
  The core selection and option-management engine. Handles single/multi selection, disabled item skipping, typeahead matching, and keyboard navigation. Built on `RovingFocus`.  
  - Composed with `<button>` and `Popover` $\rightarrow$ `Select`
  - Reused internally by list-based `Combobox` popups

- **`Combobox`**  
  Coordinates an input with an associated popup while preserving DOM focus and native text editing behaviour. Handles active-descendant tracking, autocomplete modes, suggestion navigation, value commitment, dismissal, and restoration of the previous value. Reference UI provides `Listbox` for list-based popups and `Tree` for nested popups; applications may integrate their own grid or dialog implementations when required by the product.

- **`Menu`**  
  Owns `role="menu"` keyboard navigation, item activation, typeahead, and nested submenu orchestration. Built on `RovingFocus`. Composes with `Popover` for dropdown and context menus. Registers on the shared layer stack with Overlay and Popover.

- **`Tabs`**  
  Coordinates directional keyboard cycling (horizontal/vertical), automatic vs. manual activation, and `aria-controls` / `aria-labelledby` linking between tabs and panels. Built on `RovingFocus`.

- **`Slider`**  
  Encapsulates pointer drag math, multi-thumb collision constraints, keyboard stepping (arrows, PageUp/PageDown, Home/End), and ARIA value ranges (`aria-valuenow`, `aria-valuemin`, `aria-valuemax`).

- **`Tree`**  
  A minimal APG tree: nested expand/collapse, roving focus among visible items, single selection, typeahead. Built on `RovingFocus`. Not virtualized, not multi-select, not a file explorer. Combobox may use it as a nested popup.

- **`Switch`**  
  A two-state control that is not a native HTML element. Renders a `button` with `role="switch"` and keeps `aria-checked` aligned with controlled `checked`. Owns Space/Enter activation. Track, thumb, and labels are application markup.

- **`Calendar`**  
  The date-grid engine. This is genuinely hard: locale-aware week start and weekday headings, construction of padded month grids, 2D keyboard movement (day, week, Home/End, PageUp/PageDown for months), disabled/unavailable skipping, min/max clamping, today vs selected vs focused, and range selection (start, end, in-range). Values are ISO calendar dates (`YYYY-MM-DD`), not `Date` objects and not a third-party date library. Locale is an explicit prop; `Intl` supplies labels and week-start. Calendar does not parse typed input, format field values, or own time-of-day.

- **`Collapsible`**  
  Coordinates a single disclosure trigger and content region, including `aria-expanded`, `aria-controls`, and controlled visibility.

- **`Accordion`**  
  Coordinates a collection of Collapsibles, including single/multiple expansion policies and optional keyboard traversal between headers.

- **`Splitter`**  
  Provides accessible, resizable panel partitions (`role="separator"`) in horizontal and vertical orientations. Handles pointer/touch drag calculations, minimum/maximum size clamping, keyboard-driven resizing (Arrow keys, Home/End, Enter to collapse), and selection prevention during resize.

- **`Tooltip`**  
  Transient informative descriptions linked from its trigger using `aria-describedby`. Tooltip content is non-interactive. Handles hover intent delays, warm-up skip delays across neighbouring tooltips, keyboard focus display, and non-modal Escape dismissal per WCAG 2.1 SC 1.4.13 (dismissible, hoverable, and persistent). Skip-delay across neighbours is a module-level delay group mounted with `ReferenceLibrary`, not a `Tooltip.Provider`. Interactive hover content is a `Popover` with `openOnHover`, not a Tooltip.

### Switch

```tsx
<Switch
  checked={notifications}
  onChange={setNotifications}
  aria-labelledby="notifications-label"
>
  <Span />
</Switch>
```

Approximate API:

```ts
interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean
  onChange?: (checked: boolean) => void
}
```

### Calendar

Anatomy stays visible. Calendar owns grid math, keyboard, and selection; the application owns chrome around it.

`Calendar.Grid` renders a `table`. `Calendar.Previous` and `Calendar.Next` render `button` with locale-derived accessible names. Weekday headers render `th`. Each day is a `td` containing a `button`. `Calendar.Heading` renders the visible month and year and announces it when the month changes. `Calendar` does not invent a date library: values are ISO calendar dates (`YYYY-MM-DD`).

```tsx
<Calendar
  value={value}
  onChange={setValue}
  locale="en-GB"
  min={min}
  max={max}
>
  <Calendar.Header>
    <Calendar.Previous />
    <Calendar.Heading />
    <Calendar.Next />
  </Calendar.Header>

  <Calendar.Grid>
    <Calendar.Weekdays />
    <Calendar.Days />
  </Calendar.Grid>
</Calendar>
```

Range selection is the same grid with `selection="range"` and a controlled `{ start, end }` value. Hovering a day while a start date is set previews the in-range interval; that preview is not application state.

Approximate API:

```ts
type ISODate = `${number}-${number}-${number}`

type CalendarValue =
  | ISODate
  | { start: ISODate; end: ISODate | null }

interface CalendarProps {
  children?: React.ReactNode
  selection?: "single" | "range"
  value?: CalendarValue | null
  onChange?: (value: CalendarValue | null) => void
  locale?: string
  min?: ISODate
  max?: ISODate
  isDateUnavailable?: (date: ISODate) => boolean
}
```

Cells rendered by `Calendar.Days` expose `data-today`, `data-selected`, `data-disabled`, `data-outside-month`, and for ranges `data-range-start`, `data-range-end`, `data-in-range`. Keyboard movement and selection do not require those attributes to be set by the application.

---

## Authoring primitives

Authoring primitives are the underlying composition and lifecycle machinery used to construct design-system components from Reference UI primitives without adding wrapper DOM nodes.

Proposed APIs: `Slot/Slot.md`, `Presence/Presence.md`, `RovingFocus/RovingFocus.md`, `FocusLock/FocusLock.md`.

> [!NOTE]
> `Slot` is available to user-authored design-system components. It does not make Reference UI primitives polymorphic or alter their documented native elements.

- **`Slot`**  
  Merges props, event handlers, and refs onto a single child element without wrapping DOM layers.
- **`Presence`**  
  Manages entry and exit animation lifecycles, keeping unmounting elements in the DOM until CSS animations or transitions complete. Overlay and Popover use Presence internally for the `data-state` exit contract.
- **`RovingFocus`**  
  The composite-widget keyboard kernel: roving `tabindex`, arrow movement, Home/End, disabled skipping, optional looping, optional typeahead, and optional two-dimensional movement. Listbox, Menu, and Tabs use it internally. Toolbar, ToggleGroup, tag lists, and picker grids are documented patterns on top of it — they are not reasons to rebuild the same machinery.
- **`FocusLock`**  
  Contains Tab and programmatic focus inside a subtree, restores focus on deactivation, and allows portalled shards (nested popovers) to remain inside the lock. Overlay uses it internally. Distinct from `RovingFocus`.

`visuallyHidden` is a style prop on typed HTML primitives (clip/absolute/1px), not a component. Every pattern that needs an accessible name without visible text uses it instead of inventing `srOnly`.

### RovingFocus

RovingFocus does not add a wrapper DOM node. It slots keyboard behaviour onto a single composite child. Each `RovingFocus.Item` slots `tabindex` and item registration onto its child.

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

Approximate API:

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

`orientation="both"` is the picker-grid case: arrows move in two dimensions. Typeahead is off by default; Listbox and Menu turn it on. Tabs leave it off.

### Slot merge rules contract

The `Slot` API is defined by its strict merge precedence:

- **Native props:** Child props take precedence over Slot props, except for styles, classes, and handlers.
- **Event handlers:** Composed in sequence: child handler executes first; Slot handler executes second.
  ```ts
  childHandler(event)
  if (!event.defaultPrevented) {
    slotHandler(event)
  }
  ```
- **Event cancellation:** If a child handler calls `event.preventDefault()`, the Slot handler will not run (`!event.defaultPrevented`).
- **className:** Combined into a single merged class string.
- **style:** Merged shallowly; child style properties override Slot style properties.
- **Refs:** Composed into a merged ref callback that updates both Slot and child refs.
- **IDs & ARIA attributes:** Merged deterministically; composite attributes like `aria-describedby` concatenate valid ID tokens.
- **Missing / duplicate slots:** Enforces a single-child invariant when active; passes through cleanly when transparent.
- **Nested slots:** Merges props recursively through nested slot hierarchies.

---

## Documented compositions

Complex interface patterns are documented compositions of foundational and ARIA primitives rather than rigid standalone components:

- **`Dialog`** $\rightarrow$ `Overlay` + `Overlay.Backdrop` + `Overlay.Content` (`role="dialog"`)
- **`AlertDialog`** $\rightarrow$ `Overlay` + `Overlay.Backdrop` + `Overlay.Content` (`role="alertdialog"`)
- **`Drawer` / `Sheet`** $\rightarrow$ `Overlay` positioned at screen edge; slide-out is CSS against Overlay's `data-state` / Presence contract
- **`Lightbox`** $\rightarrow$ `Overlay` with media preview presentation
- **`Select`** $\rightarrow$ select-only `Combobox` with a `Listbox` popup
- **`Autocomplete`** $\rightarrow$ editable `Combobox` with a `Listbox` popup
- **`MenuButton`** $\rightarrow$ `<button>` + `Popover` + `Menu`
- **`ContextMenu`** $\rightarrow$ `Popover` with a virtual pointer `anchor` + `Menu` (no trigger button)
- **`HoverCard`** $\rightarrow$ `Popover` with `openOnHover`
- **`DatePicker`** $\rightarrow$ text input + `Popover` + `Calendar` (parsing and display formatting stay in application code)
- **`DateRangePicker`** $\rightarrow$ text input(s) + `Popover` + `Calendar` with `{ start, end }`
- **`CommandPalette`** $\rightarrow$ `Overlay` + `Combobox`
- **`Menubar`** $\rightarrow$ `RovingFocus` (`orientation="horizontal"`) over always-visible `Menu` triggers; submenus are child layers via `Popover`
- **`Toolbar` / `ToggleGroup`** $\rightarrow$ `RovingFocus` over application-authored buttons

---

## Deliberate omissions

These are decisions, not unfinished list items.

- **`Checkbox` / `RadioGroup`** — the native platform already provides state, grouping, and keyboard behaviour. Do not wrap `<input type="checkbox">` or `<input type="radio">`. Switch is included because it is not a native element.
- **`NumberField` / `SpinButton`** — APG-hard and tempting because native `type="number"` is poor. Not in this freeze. Prefer `input` plus application parsing, or `Slider` when the value is a range.
- **`Progress` / `Meter`** — native elements. Do not wrap them.
- **Native `<dialog>`** — Overlay is the stacking, nesting, and Presence contract. Do not swap in HTML dialog as a second modal runtime.
- **`Carousel`** — CSS scroll-snap plus optional `RovingFocus`. Not a primitive.
- **Form-field wiring** (`Field`, `Form`, implicit label association) — explicit IDs are the agent-friendly answer given the no-context stance.
- **`ScrollArea`** — modern CSS (`overflow`, overlay scrollbars, `scrollbar-gutter`) covers it.
- **`DataGrid`** — an ecosystem problem (virtualization, editing, column models, selection), not a primitive this library can freeze honestly.
- **Virtualized or multi-select `Tree`** — the freeze Tree is APG keyboard + collapse + single selection only. Windowed rows and multi-select stay application-owned.
- **`NavigationMenu` / mega-menu** — Popover + Menu + hover intent. A documented pattern later if needed; not a freeze primitive.
- **Drawer snap points / iOS scale-behind** — Overlay at a screen edge plus CSS. iOS `position: fixed` belongs in Overlay scroll-lock, not a Vaul-shaped primitive.

Time-of-day widgets are outside Calendar. Calendar is calendar dates.

---

## Internal state & signals

Reference UI uses fine-grained signals internally for reactive state management, event coordination, and collision tracking.

However, raw signal primitives are intentionally not exposed as a public API:
- Exposing raw signals commits the public contract to specific subscription semantics, update batching, equality models, React version integration quirks, SSR serialization, and microfrontend lifecycles.
- Keeping signals internal allows the library to optimize runtime performance freely while presenting a standard, robust React/TypeScript component surface.

---

## Freeze gate criteria

Before any primitive's API is locked into the permanent public surface, it must satisfy the following freeze gate checklist:

1. **Exact DOM output is documented:** Element hierarchy and tag names are fixed.
2. **Every native element is fixed:** Every rendered part corresponds to a definite native HTML tag without an `as` prop.
3. **Controlled-state contract is settled:** Props for controlled state, open/close, and dismissal handlers are consistent across the library.
4. **Event ordering and cancellation are settled:** Event propagation, bubbling order, and `defaultPrevented` behavior are fully defined.
5. **Styling hooks and state attributes are settled:** Data attributes (e.g. `data-state="open"`, `data-orientation="vertical"`) and style props are finalized.
6. **Triple composition verification:** At least three substantially different compositions work seamlessly without escape-hatch props. For `Listbox` and `Combobox`, one of those compositions must be virtualized: windowed options that preserve `aria-setsize` / `aria-posinset` and support scroll-to-index. For `Calendar`, one composition must use a locale whose week does not start on Sunday, and one must be a range picker. For `Tree`, one composition must be nested at least two levels, and one must prove collapsed descendants are absent from the roving set.
7. **Cross-cutting environment safety:** Nested usage, RTL directionality, SSR hydration, and multi-root/Shadow DOM usage require no API adjustments.
8. **AI agent verification:** An AI model or agent can implement custom, non-standard user requirements without bypassing or fighting the primitive.



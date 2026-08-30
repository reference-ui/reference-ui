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
- **Zustand, not a context contract:** Shared state that would otherwise need
  React Context uses Zustand as a direct dependency. Stores stay internal;
  consumers get props, parts, and any Reference-owned domain hooks or actions
  named in the component spec. Native Context is allowed only for genuine
  subtree scoping (a part finding its owner). Applications are not required
  to wrap trees in a Provider. See [hooks.md](../core/hooks/hooks.md).
- **Stable DOM semantics:** Components render a defined native element. They do not provide an `as` prop.
- **Native props remain available:** Parts accept the attributes and events of the element they render.
- **Style props remain available:** Every fixed, style-bearing part accepts the
  same token-aware `StyleProps`, `css`, responsive `r`, color-mode, and ref
  surface as its matching generated HTML primitive.
- **Patterns are not necessarily components:** A named interface pattern may be a documented composition of lower-level primitives rather than another runtime abstraction.

Public fixed-part APIs use one shared type:

```ts
import type {
  PrimitiveElement,
  PrimitiveProps,
  PrimitiveTag,
} from "@reference-ui/react"

type ReferencePartProps<Tag extends PrimitiveTag> =
  PrimitiveProps<Tag> & React.RefAttributes<PrimitiveElement<Tag>>

type ReferenceSlotPartProps = Omit<
  ReferencePartProps<"div">,
  "children" | "ref"
> & {
  children: React.ReactElement
  ref?: React.Ref<HTMLElement>
}
```

Behavior-specific props omit any colliding native/style prop before redefining
it. `ReferenceSlotPartProps` provides common DOM events/ARIA plus the shared
StyleProps surface to transparent parts; child-specific attributes such as
`href` or `type` remain on the authored child. Slot-like parts never claim a
native tag and explicitly type their one ref-capable child.

## Current component inventory

The current top-level runtime candidate is **22 components**:

- **Foundation:** `ReferenceLibrary`, `Portal`, `Overlay`, `Popover`, `Toast`
- **ARIA widgets:** `Listbox`, `Combobox`, `Menu`, `Tabs`, `Slider`, `Switch`,
  `Tree`, `NumberField`, `Calendar`, `Collapsible`, `Accordion`, `Splitter`,
  `Tooltip`
- **Authoring machinery:** `Slot`, `Presence`, `RovingFocus`, `FocusLock`

Current evidence says this set is complete for the intended layer; that is a
review conclusion, not an axiom. It does not mean every named UI pattern
becomes a component. It means ordinary HTML/CSS plus these behavior owners can
express the product patterns listed below without an application or agent
having to rebuild focus containment, layering, positioning, collection
navigation, disclosure, range math, or date-grid logic. A counterexample that
cannot do so reopens this inventory.

Vendor coverage may require a new part, callback, option, internal helper, or
documented composition. It does **not** by itself justify a new top-level
component. Add one only when all of these are true:

1. the web platform does not already own the behavior;
2. no current primitive can own it without mixing unrelated state machines;
3. composition would force applications to recreate a difficult invariant; and
4. at least three materially different products need the same public contract.

Internal kernels such as the layer registry, scroll lock, inert manager,
announcer, tabbable solver, typeahead matcher, safe polygon, constraint
solver, and calendar arithmetic remain implementation details unless
independent application use proves a stable public contract. Floating
middleware is the Overlay geometry engine: `placement` / `anchor` /
`--reference-overlay-*` are public; `computePosition` internals are not.

The completeness argument is behavioral rather than pattern-count based:

- `Slot`, `Portal`, and `Presence` cover wrapper-free authoring, relocation,
  and visual lifetime.
- `FocusLock` and `RovingFocus` cover contained and composite focus movement.
- `Overlay` and `Popover` cover document layers, dismissal, modality, and
  anchored geometry. Overlay is the Floating UI port frontend; Popover is
  non-modal trigger policy on that engine.
- `ReferenceLibrary` and `Toast` cover document-scoped global lifetime,
  announcement, and queued work.
- `Listbox`, `Menu`, `Tree`, `Combobox`, and `Tabs` cover flat, hierarchical,
  popup-coordinated, and activated collections.
- `Slider`, `Switch`, `NumberField`, `Collapsible`, `Accordion`, `Splitter`,
  `Tooltip`, and `Calendar` own the remaining difficult value, on/off thumb
  anatomy, localized numeric editing, disclosure, description, resize, and
  date-grid state machines.

The final vendor pass changed membership without treating the count as
sacred. NumberField passed all four admission criteria: quantities, localized
currency/percent fields, and scientific/unit inputs otherwise recreate the
same partial-edit, parsing, precision, stepping, and form invariants.
Switch passed on anatomy, not on a second boolean state machine: a sliding
thumb has to be a real child, and a native checkbox cannot host one.
Checkbox and radio stay native.

Adding a pattern name without introducing a new invariant would make the API
larger without making an agent more capable. Conversely, a vendor regression
that cannot be expressed by these owners is evidence for an API correction
inside the relevant owner before it is evidence for component 23.

Generated typed HTML primitives are a separate platform-mirroring surface.
Existing `Reference`/`ReferenceView` browser documentation UI is also outside
this behavioral-primitive freeze; neither changes the 22-component inventory
above.

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

Behavioral parts with fixed hosts are implemented on these same generated
primitives. An `Overlay.Content` is still a style-bearing `Div`, a
`Popover.Trigger` is still a style-bearing `Button`, and a `Tabs.Tab` is
still a style-bearing `Button`; behavior augments rather than replaces the
platform/style surface.

## Foundation components

Reference UI only provides a runtime component when it centralizes behaviour that should not be repeatedly rebuilt by developers or AI agents.

Working design lives in sibling folders: `Overlay/Overlay.md` (API + problems), `Overlay/TESTS.md` (contracts to prove, including how vendor e2e suites combine). Implementation substrate is [hooks.md](../core/hooks/hooks.md): Zustand plus adapters in `src/core/hooks`. This document remains the freeze-gate overview. Names under Documented compositions do not get folders — they are not runtime components. The `vendor/` clones are **port sources**, not runtime dependencies: Overlay is the public frontend of the Floating UI core/DOM port; `@floating-ui/react` stays leave. See `vendor/VENDOR.md`. How to run Playwright is `packages/reference-lib/TESTING.md`.

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

`ReferenceLibrary` is a document-scoped runtime mount, not a React context
provider. Overlay, Popover, and Menu do not need to sit beneath it. Toast,
`announce()`, and Tooltip skip-delay are Zustand stores keyed by `Document`,
mounted here. See [hooks.md](../core/hooks/hooks.md).

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
  tooltip?: {
    skipDelay?: number
  }
}
```

Omitted Tooltip configuration uses a 300ms document-level skip-delay window.

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

The container may be supplied directly, through a ref, or through a function
when it is resolved later in the application lifecycle. Direct `null` means
the default body; an explicitly supplied ref/function resolving null waits
without flashing a temporary body portal.

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

A controlled foundation for temporary content displayed above the application.

Overlay is the public frontend of the Floating UI port. `vendor/floating-ui`
core + DOM (`computePosition`, middleware, `autoUpdate`) is source material
to lift into this component — not a runtime dependency, and not
`@floating-ui/react`. That React tree (`useDismiss`, `FloatingTree`,
`FloatingFocusManager`) is a second overlay runtime and stays leave.

Floating and overlay are the same job: a layer, isolation, and optional
anchored geometry. Overlay owns all three. There is no `modal` flag —
Overlay is always isolating. Popover is the non-modal trigger policy on
this same engine: Trigger as the default reference, isolation off.

It does not provide a trigger or prescribe the content's semantic role,
structure, animation, or appearance. Unanchored Overlay is a dialog, drawer,
sheet, or lightbox placed with CSS — placement props are no-ops. Anchored
Overlay (`anchor`) is a floating layer: Content is the floating element.

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

```tsx
<Overlay open={open} onDismiss={close} anchor={buttonRef}>
  <Overlay.Content placement="bottom-start" offset={8}>
    {children}
  </Overlay.Content>
</Overlay>
```

```tsx
<Overlay
  open={open}
  onDismiss={close}
  anchor={{ x: pointerX, y: pointerY }}
>
  <Overlay.Content placement="bottom-start">
    <Overlay.Arrow />
    {children}
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

`Overlay.Content` accepts `initialFocus`. When omitted, Overlay focuses the
first tabbable descendant. A target ref/resolver focuses that element; `false`
skips the move. Omitted `restoreFocus` returns to the pre-open target after
Presence exit, an explicit target redirects that return, and `false` leaves
focus where the application placed it.

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

Overlay, Popover, and Menu share one layer stack. `Combobox.Popover` is
wrapped `Overlay.Content`, so it is the same stack.

- Escape dismisses only the topmost layer.
- An outside-press whose target is inside a nested popup does not dismiss the parent.
- A menu opened from a dialog is a child layer: Escape closes the menu first; a second Escape closes the dialog.
- Popover and Overlay nest in either direction under the same rules.

This contract is not Overlay-specific. Popover and Menu register on the same
stack; they do not keep private dismissal worlds. The stack is a
document-scoped Zustand store, not a React context
([hooks.md](../core/hooks/hooks.md)).

Approximate API:

```ts
type OverlayPlacement =
  | "top" | "top-start" | "top-end"
  | "right" | "right-start" | "right-end"
  | "bottom" | "bottom-start" | "bottom-end"
  | "left" | "left-start" | "left-end"

type VirtualAnchor =
  | Element
  | DOMRect
  | { getBoundingClientRect(): DOMRect }
  | { x: number; y: number; width?: number; height?: number }

type FocusTarget =
  | React.RefObject<HTMLElement | null>
  | (() => HTMLElement | null)

interface OverlayDismissHandlers {
  onDismiss?: () => void
  onEscape?: (event: KeyboardEvent) => void
  onOutsidePress?: (event: PointerEvent) => void
}

interface OverlayProps extends OverlayDismissHandlers {
  children?: React.ReactNode
  open: boolean
  anchor?: VirtualAnchor
}

interface OverlayPortalProps {
  container?: PortalProps["container"]
}

interface OverlayBackdropProps
  extends ReferencePartProps<"div"> {}

interface OverlayContentProps
  extends ReferencePartProps<"div"> {
  initialFocus?: FocusTarget | false
  restoreFocus?: boolean | FocusTarget
  placement?: OverlayPlacement
  offset?: number
  collisionPadding?: number
  strategy?: "absolute" | "fixed"
  flip?: boolean
  shift?: boolean
}

interface OverlayArrowProps
  extends ReferencePartProps<"div"> {
  edgePadding?: number
}
```

`Overlay` renders no node. `Overlay.Backdrop`, `Overlay.Content`, and
`Overlay.Arrow` render `div`. `Overlay.Portal` renders nothing.

Without `anchor`, Overlay writes no `position` / `top` / `left`. Placement,
offset, collision, strategy, flip, shift, and Arrow are inert. With
`anchor`, Content is the floating element. Defaults are
`placement="bottom-start"`, `offset=8`, `collisionPadding=8`, absolute
strategy, and flip/shift enabled. Positioning owns `position` / `top` /
`left` but never consumer `transform`. Content publishes
`--reference-overlay-available-width`,
`--reference-overlay-available-height`,
`--reference-overlay-anchor-width`,
`--reference-overlay-anchor-height`, and
`--reference-overlay-transform-origin`, plus `data-anchor-hidden` and
`data-escaped`. Arrow `edgePadding` defaults to 4px. While open, Overlay
runs the ported `autoUpdate`.

Popover, Tooltip, `Combobox.Popover`, and `Menu.Content` consume this
geometry API. They do not own a second `computePosition` runtime.

---

### Popover

Controlled, anchored, non-modal floating content.

Geometry is Overlay's Floating UI port. Popover consumes `Overlay.Content` /
`Overlay.Arrow` / `anchor` and adds Trigger, `onOpen`, hover grace, the
Tab-order bridge, and `closeOnScroll`. Overlay still owns dismiss ordering
and the layer stack. Virtual anchors are Overlay positioning math; Popover
forwards `anchor` and uses Trigger as the default reference.

By default, `Popover.Trigger` is both the interaction source and the positioning anchor. That default does not cover every real case. A context menu anchors to pointer coordinates; a selection menu anchors to a text range; a canvas or table-cell menu anchors to a shape or cell rect. An optional virtual `anchor` (element, rect, or point) is the positioning reference in those cases. The trigger may be omitted when the application already owns the interaction — right-click, selection, or a hit-tested canvas object.

```tsx
<Popover
  open={open}
  onOpen={() => setOpen(true)}
  onDismiss={close}
>
  <Popover.Trigger>Open filters</Popover.Trigger>

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

When both a trigger and an `anchor` are present, the trigger remains the interaction and accessibility source; `anchor` wins for Overlay geometry.

`Popover.Trigger` renders a native `button`. `Popover.Content` is wrapped
`Overlay.Content`. `Popover.Arrow` is wrapped `Overlay.Arrow`.

Popover portals internally by default. `Popover.Portal` optionally configures the destination and does not wrap the content.

```tsx
<Popover
  open={open}
  onOpen={() => setOpen(true)}
  onDismiss={close}
>
  <Popover.Trigger>Open filters</Popover.Trigger>
  <Popover.Portal container={portalContainer} />
  <Popover.Content>{children}</Popover.Content>
</Popover>
```

An optional arrow participates in the same Overlay positioning calculation. Collision handling includes flipping and shifting in view; list-style popups (Select, Combobox, Menu) also need available-height so the popup can scroll instead of overflowing the viewport. That is Overlay geometry, not a second primitive.

Content defaults and `--reference-overlay-*` CSS properties are Overlay's.
`Popover.Arrow` `edgePadding` defaults to 4px while ordinary `padding`
remains available for visual styling.

```tsx
<Popover
  open={open}
  onOpen={() => setOpen(true)}
  onDismiss={close}
>
  <Popover.Trigger>More information</Popover.Trigger>

  <Popover.Content placement="top">
    <Popover.Arrow />
    {children}
  </Popover.Content>
</Popover>
```

Popover uses Presence / `data-state`, but unlike modal Overlay its logically
closed exiting Content is inert and leaves the active dismissal stack
immediately. Positioning and any parent FocusLock branch remain until the exit
and focus restoration complete.

Unprevented native click, Enter, or Space activation on `Popover.Trigger`
requests open through `onOpen` when closed and dismissal through `onDismiss`
when open. Consumer Trigger handlers run first; `preventDefault()` cancels the
internal request, so applications do not add a duplicate toggle handler.

Portalling must not break keyboard order: Tab from an open Trigger enters the
first Content control; leaving the final control advances relative to the
Trigger's source position and requests dismissal. This is a minimal logical
order bridge, not a focus trap.

`closeOnScroll` defaults to false, so ordinary interactive Popovers reposition
with their anchors. Setting it requests one controlled dismissal when a
composed overflow ancestor moves the anchor; unrelated scrolling and an
overflowing text field's own scroll are ignored.

#### Hover interaction

Tooltip owns hover intent and is explicitly non-interactive. Interactive floating content is a Popover.

The hard part of hover-opened interactive content is not the open delay — it is pointer travel from the trigger into the content without dismissing (grace area / safe-polygon tracking). Popover owns that machinery when `openOnHover` is set. Open remains controlled: Popover requests open through `onOpen` after pointer intent or keyboard focus, and close through `onDismiss` after pointer/focus leaves the trigger, the content, and the safe polygon.

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
type PopoverPlacement = OverlayPlacement

interface PopoverProps extends OverlayDismissHandlers {
  children?: React.ReactNode
  open: boolean
  onOpen?: () => void
  anchor?: VirtualAnchor
  openOnHover?: boolean
  openDelay?: number
  closeDelay?: number
  closeOnScroll?: boolean
}

interface PopoverTriggerProps
  extends ReferencePartProps<"button"> {}

interface PopoverPortalProps {
  container?: PortalProps["container"]
}

interface PopoverContentProps extends OverlayContentProps {}

interface PopoverArrowProps extends OverlayArrowProps {}
```

---

### Toast

Toast provides the infrastructure for transient application content without prescribing its appearance or meaning.

Reference UI manages mounting, queueing, stacking, timing, dismissal, accessible announcements, and coordination with other interface elements. It does not include semantic variants such as `success`, `error`, or `loading`. Applications define those concepts themselves.

Timers pause while pointer or keyboard focus is inside a toast and while a
modal Overlay is the top layer. Focused toast content restores the prior safe
outside focus target when it dismisses. That is queue/focus lifecycle behavior,
not Overlay modality.

Library defaults are 5000ms, `bottom-end`, and a global visible limit of 4.
Excess records wait unmounted in a document-local FIFO and do not age until a
slot promotes them.
The runtime DOM is one `div[data-reference-toast-host]`, occupied
`div[data-reference-toast-position]` stacks, and Presence-managed
`div[data-reference-toast-id][data-state]` item wrappers. Items expose
`--reference-toast-index`/`--reference-toast-count`; custom render output stays
untouched inside.

The toaster is mounted internally by `ReferenceLibrary`. It renders directly at the React root without a portal or a required React context. The queue is a document-scoped Zustand store.

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
  document?: Document
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

toast.dismiss(
  id?: ToastId,
  options?: { document?: Document }
): void

announce(
  message: string,
  options?: {
    politeness?: "polite" | "assertive"
    document?: Document
  }
): void
```

Calling `toast.dismiss()` without an ID dismisses every active toast.

`announce()` is the same live-region path without a toast, mounted by `ReferenceLibrary`. Use it for non-toast status that still needs to reach assistive technology. Toast `announce` options go through this path.

A toast definition is ordinary, visible application code. AI agents can create exactly the notification requested without reverse-engineering proprietary variants, fixed layouts, or hidden component state.

---

## ARIA primitives

Beyond foundational layer and geometry (`Overlay`, `Popover`, `Portal`,
`Toast`), certain interface patterns require strict adherence to the
**WAI-ARIA Authoring Practices Guide (APG)**. These patterns involve complex
state machines, roving tabindex, active-descendant tracking, typeahead
searching, and keyboard traversal contracts that should not be repeatedly
rebuilt on the fly.

Proposed APIs for these primitives live in sibling folders (`Listbox/Listbox.md`, `Menu/Menu.md`, and so on).

Following the same primitive-first philosophy, these components remain decoupled, unstyled, and highly composable:

Listbox virtualization and Combobox active-descendant popups share one
`VirtualFocusAdapter` metadata/scroll contract. Nested Listbox and Tree expose
their registries automatically. A custom grid adds
`ComboboxGridAdapter.getNextIndex()` for its topology and slots each mounted
gridcell through `Combobox.VirtualItem`; Combobox then owns stable active IDs,
mount waiting, input ARIA, and the sole commit callback. Applications do not
rebuild active-descendant timing or add a second collection state machine.

- **`Listbox`**  
  The core selection and option-management engine. Handles single/multi selection, disabled item skipping, typeahead matching, and keyboard navigation. Built on `RovingFocus`.  
  - Composed with select-only `Combobox` (`Combobox.Trigger` +
    `Combobox.Popover`) $\rightarrow$ `Select`
  - Reused internally by list-based `Combobox` popups

- **`Combobox`**  
  Coordinates an input with an associated popup while preserving DOM focus and native text editing behaviour. Handles active-descendant tracking, autocomplete modes, suggestion navigation, value commitment, dismissal, and restoration of the previous value. `Combobox.Popover` is wrapped `Overlay.Content`: same Floating UI port, Overlay layer stack, and Presence exit, plus Combobox focus-in-field policy (`virtualFocus` for custom grids). Input or Trigger remains the focus source; there is no `Popover.Trigger` and no Tab bridge. Do not nest a `Popover` root. Reference UI provides `Listbox` for list popups and `Tree` for nested popups. A dialog popup moves DOM focus and is an input + Popover/Overlay composition instead.

- **`Menu`**  
  Owns `role="menu"` keyboard navigation, command/link activation, controlled
  checkbox/radio items, typeahead, and nested submenu orchestration. Built on
  `RovingFocus`. Composes with `Popover` for dropdown and context-menu open
  policy. Geometry is Overlay's. A submenu is a nested `Menu` (renders no
  node): `Menu.Trigger` is `div[role=menuitem]` and `Menu.Content` is wrapped
  `Overlay.Content` (default `right-start`, RTL `left-start`). Nested Menu
  owns `open` / `onOpen` / `onDismiss`; omitted nested `open` is controlled
  false. Root trigger stays `Popover.Trigger`. `Menu.LinkItem` keeps native
  anchor behavior. Keep `Menu.CheckboxItem` / `Menu.RadioItem`; there is
  no standalone RadioGroup primitive.

- **`Tabs`**  
  Coordinates directional keyboard cycling (horizontal/vertical), automatic
  vs. manual activation, and `aria-controls` / `aria-labelledby` linking
  between tabs and panels. Every declared Panel stays mounted and inactive
  Panels use native `hidden`; programmatic selection evacuates focus before
  hiding its current Panel. Built on `RovingFocus`.

- **`Slider`**  
  Encapsulates pointer drag math, ordered multi-thumb collision and optional
  minimum-step constraints, keyboard stepping (arrows, PageUp/PageDown,
  Home/End), per-step requests plus one interaction-end callback, and ARIA
  value ranges (`aria-valuenow`, `aria-valuemin`, `aria-valuemax`).

- **`Switch`**  
  A compact `role="switch"` button. StyleProps on `Switch` are enough for a
  complete control; Switch renders a default thumb. Author `Switch.Thumb`
  only to specify the thumb. Owns controlled boolean requests and shared
  `data-state` on both parts so thumb travel can be CSS. Labels and form
  serialization stay application HTML. Not a checkbox, not mixed, and not a
  second form runtime.

- **`Tree`**  
  A minimal APG tree: nested expand/collapse, roving focus among visible items, single selection, typeahead. Built on `RovingFocus`. Not virtualized, not multi-select, not a file explorer. Combobox may use it as a nested popup.

- **`NumberField`**
  Owns localized numeric text editing where native `input[type=number]` is not
  deterministic enough: partial edit strings, invertible Intl
  parsing/formatting, controlled numeric requests, drift-resistant stepping,
  named increment/decrement buttons, and canonical form serialization. The
  visible host remains `input[type=text]`; labels and error prose are
  application markup.

- **`Calendar`**  
  The date-grid engine. This is genuinely hard: locale-aware week start and weekday headings, construction of padded month grids, 2D keyboard movement (day, week, Home/End, PageUp/PageDown for months), disabled/unavailable skipping, min/max clamping, today vs selected vs focused, and range selection (start, end, in-range). Values are ISO calendar dates (`YYYY-MM-DD`), not `Date` objects and not a third-party date library. Locale is an explicit prop; `Intl` supplies labels and week-start. Calendar does not parse typed input, format field values, or own time-of-day.

- **`Collapsible`**  
  Coordinates a single disclosure trigger and content region, including `aria-expanded`, `aria-controls`, and controlled visibility.

- **`Accordion`**  
  Coordinates a collection of Collapsibles, including single/multiple expansion policies and optional keyboard traversal between headers.

- **`Splitter`**  
  Provides accessible, resizable panel partitions (`role="separator"`) in
  horizontal and vertical orientations. Handles pointer/touch drag
  calculations, minimum/maximum size clamping, per-step and interaction-end
  callbacks, keyboard-driven resizing (Arrow keys, Home/End, Enter to
  collapse), and selection prevention during resize. Each Handle controls the
  preceding logical Panel through a stable `aria-controls` relationship.

- **`Tooltip`**  
  Transient informative descriptions linked from its trigger using
  `aria-describedby`. Tooltip content is non-interactive. Handles hover intent
  delays, warm-up skip delays across neighbouring tooltips, keyboard focus
  display, disabled-trigger closure, and non-modal Escape dismissal per WCAG
  2.1 SC 1.4.13. Geometry is Overlay's Floating UI port (`placement` /
  `offset` on `Tooltip.Content`). Closed Content is removed immediately rather
  than exposing an animation lifecycle. Defaults are 700ms open, 300ms close,
  and a 300ms document skip window. Skip-delay is document-level configuration
  on `ReferenceLibrary`; interactive hover content is a `Popover` with
  `openOnHover`.

### Switch

A compact `role="switch"` button with variable specificity. Mount `Switch`
with StyleProps and it is a complete control — a default thumb is rendered.
Author `Switch.Thumb` only when the thumb needs its own StyleProps, refs, or
children. Labels and form serialization stay application HTML.

```tsx
<label htmlFor="airplane">Airplane mode</label>
<Switch
  id="airplane"
  checked={enabled}
  onChange={setEnabled}
  width="6r"
  padding="0.25r"
/>
```

```tsx
<Switch id="airplane" checked={enabled} onChange={setEnabled} width="6r">
  <Switch.Thumb width="2r" bg="bg" />
</Switch>
```

```ts
interface SwitchProps
  extends Omit<
    ReferencePartProps<"button">,
    "onChange" | "type" | "role" | "aria-checked" | "aria-pressed"
  > {
  checked: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
}

interface SwitchThumbProps
  extends ReferencePartProps<"span"> {}
```

`Switch` renders `button[type=button][role=switch]`. Authored `Switch.Thumb`
replaces the default thumb `span`. StyleProps on `Switch` do not leak onto
the thumb. `checked` is required and controlled. `onChange` requests the
opposite boolean. There is no mixed state, hidden form control, or geometry
custom property. A wrapping `<label>` is valid at either specificity.

### NumberField

```tsx
<NumberField
  value={quantity}
  onChange={setQuantity}
  locale="en-GB"
  min={0}
  max={100}
  step={1}
  name="quantity"
>
  <Label htmlFor="quantity">Quantity</Label>
  <NumberField.Group>
    <NumberField.Decrement aria-label="Decrease quantity">
      −
    </NumberField.Decrement>
    <NumberField.Input id="quantity" />
    <NumberField.Increment aria-label="Increase quantity">
      +
    </NumberField.Increment>
  </NumberField.Group>
</NumberField>
```

`NumberField` and Group render fixed `div` hosts. Input is the sole visible
`input[type=text]`; the two optional steppers are
`button[type=button][tabindex=-1]` and each requires an authored accessible
name. A supplied root `name` adds one generated hidden input carrying the
canonical controlled number. Input may hold a localized partial/dirty string,
but `onChange(number | null)` remains the only durable state request.

`commitBehavior="snap"` uses one `step` lattice and preserves finite non-grid
bounds; `"validate"` keeps finite underflow, overflow, and step mismatch while
publishing managed invalid state. Arrow and stepper actions use `step`; Shift
uses `10 * step`. Wheel stepping, alternate step scales, parser overrides,
translated fallback labels, uncontrolled values, and a public raw-text state
are deliberately absent. Exact managed native/ARIA omissions are specified in
[NumberField.md](./NumberField/NumberField.md).

```ts
interface NumberFieldProps
  extends Omit<ReferencePartProps<"div">, "onChange" | "defaultValue"> {
  value: number | null
  onChange?: (value: number | null) => void
  locale: string
  formatOptions?: Intl.NumberFormatOptions
  min?: number
  max?: number
  step?: number
  commitBehavior?: "snap" | "validate"
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  invalid?: boolean
  name?: string
  form?: string
}
```

### Calendar

Anatomy stays visible. Calendar owns grid math, keyboard, and selection; the application owns chrome around it.

`Calendar.Grid` renders `table[role=grid]`. `Calendar.Previous` and
`Calendar.Next` render `button[type=button]` with locale-derived accessible
names. `Calendar.Weekdays` renders `thead` with generated `th` headers;
`Calendar.Days` renders `tbody` with each date as
`td[role=gridcell] > Calendar.Day`. With no renderer, Day contains the
locale-formatted number. A Days render function can return
`Calendar.Day` with custom contents, native props, StyleProps, and refs while
Calendar retains managed date semantics and interaction. `Calendar.Heading`
renders the controlled `month`
(`YYYY-MM`) and announces it when the month changes. `Calendar` does not invent
a date library: values are ISO calendar dates (`YYYY-MM-DD`). An explicit
`today` makes SSR deterministic; when omitted, the client-local marker is
added only after hydration. Locale supplies week start by default; an explicit
`firstDayOfWeek` override and narrow/short/long weekday labels remain within
the same Gregorian grid owner.

```tsx
<Calendar
  month={month}
  onMonthChange={setMonth}
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
type ISOMonth = `${number}-${number}`
type CalendarWeekday =
  | "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat"

type CalendarValue =
  | ISODate
  | { start: ISODate; end: ISODate | null }

interface CalendarProps
  extends Omit<ReferencePartProps<"div">, "onChange"> {
  month: ISOMonth
  onMonthChange?: (month: ISOMonth) => void
  selection?: "single" | "range"
  value?: CalendarValue | null
  onChange?: (value: CalendarValue | null) => void
  locale: string
  firstDayOfWeek?: CalendarWeekday
  today?: ISODate
  min?: ISODate
  max?: ISODate
  isDateUnavailable?: (date: ISODate) => boolean
}

interface CalendarDayRenderState {
  date: ISODate
  formattedDay: string
  outsideMonth: boolean
  today: boolean
  selected: boolean
  disabled: boolean
  rangeStart: boolean
  rangeEnd: boolean
  inRange: boolean
  preview: boolean
}

interface CalendarWeekdaysProps
  extends ReferencePartProps<"thead"> {
  weekdayStyle?: "narrow" | "short" | "long"
}

interface CalendarDaysProps
  extends Omit<ReferencePartProps<"tbody">, "children"> {
  children?: (day: CalendarDayRenderState) => React.ReactElement
}

interface CalendarDayProps
  extends ReferencePartProps<"button"> {
  date: ISODate
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
  Manages entry and exit animation lifecycles, keeping unmounting elements in
  the DOM until CSS animations, transitions, and registered nested Presence
  exits complete. Overlay and Popover use Presence internally for the
  `data-state` exit contract.
- **`RovingFocus`**  
  The composite-widget keyboard kernel: roving `tabindex`, arrow movement, Home/End, disabled skipping, optional looping, optional typeahead, and optional two-dimensional movement. Listbox, Menu, Tabs, and Tree use it internally. Accordion deliberately does not because all accordion headers remain native Tab stops. Toolbar, ToggleGroup, tag lists, and picker grids are documented patterns on top of it — they are not reasons to rebuild the same machinery.
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
interface RovingFocusProps extends ReferenceSlotPartProps {
  orientation?: "horizontal" | "vertical" | "both"
  loop?: boolean
  typeahead?: boolean
}

interface RovingFocusItemProps extends ReferenceSlotPartProps {
  disabled?: boolean
  textValue?: string
}
```

`orientation="both"` is the picker-grid case: arrows move in two dimensions.
Omitted behavior is horizontal, non-looping, and typeahead-off; Listbox and
Menu turn typeahead on. Tabs leave it off.

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
- **`Drawer` / `Sheet`** $\rightarrow$ unanchored `Overlay` at a screen edge; slide-out is CSS against Overlay's `data-state` / Presence contract. Do not put `placement` on Overlay for this — there is no `anchor`.
- **`Lightbox`** $\rightarrow$ `Overlay` with media preview presentation
- **`Select`** $\rightarrow$ select-only `Combobox` (`Combobox.Trigger` +
  `Combobox.Popover`) with a `Listbox` popup
- **`Autocomplete`** $\rightarrow$ editable `Combobox` (`Combobox.Input` +
  `Combobox.Popover`) with a `Listbox` popup
- **`MenuButton`** $\rightarrow$ `Popover.Trigger` + `Popover.Content` + `Menu`
- **`ContextMenu`** $\rightarrow$ `Popover` with a virtual pointer `anchor` + `Menu` (no trigger button)
- **`HoverCard`** $\rightarrow$ `Popover` with `openOnHover`
- **`DatePicker`** $\rightarrow$ text input + `Popover` + `Calendar` (parsing and display formatting stay in application code)
- **`DateRangePicker`** $\rightarrow$ text input(s) + `Popover` + `Calendar` with `{ start, end }`
- **Quantity / currency / percent / unit input** $\rightarrow$ `NumberField`
  with application-authored label, error content, and optional steppers
- **`CommandPalette`** $\rightarrow$ `Overlay` + `Combobox`
- **`Menubar`** $\rightarrow$ `RovingFocus` (`orientation="horizontal"`) over always-visible `Menu` / `Popover` triggers; submenus are nested `Menu` + `Menu.Content` (Overlay geometry)
- **`Toolbar` / `ToggleGroup`** $\rightarrow$ `RovingFocus` over application-authored buttons
- **`Disclosure` / expandable details** $\rightarrow$ `Collapsible`
- **`FAQ` / grouped disclosures** $\rightarrow$ `Accordion`
- **`SplitView` / resizable workspace** $\rightarrow$ `Splitter`
- **`SegmentedControl` / view switcher** $\rightarrow$ `Tabs` when content
  panels exist, otherwise `RovingFocus` over `aria-pressed` buttons
- **Searchable token picker** $\rightarrow$ scalar `Combobox` commits appended
  values into application state; rendered tokens use `RovingFocus`
- **Picker popup** (emoji, icon, command grid) $\rightarrow$ `Popover` or
  `Overlay` + Combobox's custom-grid virtual-focus adapter
- **Settings toggle / airplane mode** $\rightarrow$ `Switch` plus an
  application `label` (`htmlFor` or wrapping). `Switch.Thumb` only when the
  thumb needs its own StyleProps.

---

## Deliberate omissions

These are decisions, not unfinished list items. 

- **`Checkbox` / `RadioGroup`** — native checkbox and radio inputs already
  own state, grouping, keyboard, disabled, form, reset, and event behavior.
  Switch is the exception because a sliding thumb cannot live inside a void
  `<input>`; see `Switch`.
- **A separate `SpinButton`** — NumberField deliberately keeps textbox
  semantics because recasting localized text input as a spinbutton creates
  VoiceOver focus failures. Its named stepper buttons and Arrow behavior expose
  numeric adjustment without a second component.
- **`Progress` / `Meter`** — native elements. Do not wrap them.
- **Native `<dialog>`** — Overlay is the stacking, nesting, Presence, and
  geometry contract. Do not swap in HTML dialog as a second modal runtime.
- **A `modal` flag on Overlay** — Overlay is always isolating. Non-modal
  floating content is `Popover`.
- **`Carousel`** — CSS scroll-snap plus optional `RovingFocus`. Not a primitive.
- **Form-field wiring** (`Field`, `Form`, implicit label association) — explicit IDs are the agent-friendly answer; a public Field/Form provider is not a freeze primitive.
- **`ScrollArea`** — modern CSS (`overflow`, overlay scrollbars, `scrollbar-gutter`) covers it.
- **`DataGrid`** — an ecosystem problem (virtualization, editing, column models, selection), not a primitive this library can freeze honestly.
- **Virtualized or multi-select `Tree`** — the freeze Tree is APG keyboard + collapse + single selection only. Windowed rows and multi-select stay application-owned.
- **`NavigationMenu` / mega-menu** — Popover + Menu + hover intent. A documented pattern later if needed; not a freeze primitive.
- **Drawer snap points / iOS scale-behind** — Overlay at a screen edge plus CSS. iOS `position: fixed` belongs in Overlay scroll-lock, not a Vaul-shaped primitive.

Time-of-day widgets are outside Calendar. Calendar is calendar dates.

---

## Internal state

Zustand is the standard substrate for shared state and capabilities that
would otherwise require React Context. It is a direct third-party
dependency — not vendored, ported, or reimplemented. Adapter hooks in
`src/core/hooks` integrate it.

Stores stay internal. Consumers see Reference-owned domain hooks and actions
where a spec names them, plus the usual props and parts. Prefer this
provider-free model for cross-tree coordination, selectors, and imperative
access. Use native React Context only for genuine subtree scoping or
dependency injection (a part finding its owner). That context is not a
public Provider.

Implementation specs document store shape, actions, selectors, hooks,
lifecycle, isolation, and multi-root/MFE behaviour
([hooks.md](../core/hooks/hooks.md)).

---

## Manufacturing gate criteria

Before any primitive's API enters implementation as a release candidate, it
must satisfy this checklist. Failure changes the design; the checklist does
not bless the current design by definition.

1. **Exact DOM output is documented:** Element hierarchy and tag names are fixed.
2. **Every native element is fixed:** Every rendered part corresponds to a definite native HTML tag without an `as` prop.
3. **Controlled-state contract is settled:** Props for controlled state, open/close, and dismissal handlers are consistent across the library.
4. **Event ordering and cancellation are settled:** Event propagation, bubbling order, and `defaultPrevented` behavior are fully defined.
5. **Styling hooks and state attributes are settled:** Data attributes (e.g. `data-state="open"`, `data-orientation="vertical"`) and style props are finalized.
6. **Triple composition verification:** At least three substantially different compositions work seamlessly without escape-hatch props. For `Listbox` and `Combobox`, one of those compositions must be virtualized: windowed options that preserve `aria-setsize` / `aria-posinset` and support scroll-to-index. For `Calendar`, one composition must use a locale whose week does not start on Sunday, and one must be a range picker. For `Tree`, one composition must be nested at least two levels, and one must prove collapsed descendants are absent from the roving set.
   For `NumberField`, compositions must include non-Latin digits, an
   affixed percent/currency/unit format, canonical form submission, and a
   ShadowRoot boundary. For `Switch`, compositions must include a sibling
   `htmlFor` label, a wrapping label inside a form that does not serialize
   the button, and independent low- and high-specificity switches inside a
   nested overlay. For `Overlay`, one composition must be unanchored
   (dialog/drawer CSS) and one must be anchored (`anchor` + Floating UI
   geometry) without a second positioning runtime.
7. **Cross-cutting environment safety:** Nested usage, RTL directionality, SSR hydration, and multi-root/Shadow DOM usage require no API adjustments.
8. **AI agent verification:** An AI model or agent can implement custom, non-standard user requirements without bypassing or fighting the primitive.
9. **Descriptive proof contract:** Every case says what the component should do
   under named circumstances, then gives enough setup, action, public
   observables, and rationale to implement it without guessing.
10. **Coverage closure:** Every surveyed vendor test is ported, merged into
    named case IDs, assigned to another owner, or deliberately left with a
    reason; no unclassified test knowledge is hidden in implementation notes.
11. **Store and hook spec:** Internal Zustand shape, actions, selectors,
    hooks, lifecycle, isolation, and multi-root/MFE behaviour are documented
    for that owner ([hooks.md](../core/hooks/hooks.md)). A missing expression is an
    API blocker, not an implementation detail.



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

The current top-level runtime candidate is **24 components**:

- **Foundation:** `ReferenceLibrary`, `Portal`, `Overlay`, `Popover`, `Toast`
- **ARIA widgets:** `Listbox`, `Combobox`, `Menu`, `Tabs`, `Slider`, `Switch`,
  `Tree`, `NumberField`, `DateField`, `Calendar`, `Collapsible`, `Accordion`,
  `Splitter`, `Tooltip`
- **Visual chrome:** `Field`
- **Authoring machinery:** `Slot`, `Presence`, `RovingFocus`, `FocusLock`

Current evidence says this set is complete for the intended layer; that is a
review conclusion, not an axiom. It does not mean every named UI pattern
becomes a component. It means ordinary HTML/CSS plus these behavior owners can
express the product patterns listed below without an application or agent
having to rebuild focus containment, layering, positioning, collection
navigation, disclosure, range math, localized numeric editing, or date-field,
date-range, and date-grid logic. A counterexample that cannot do so reopens this inventory.

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
independent application use proves a stable public contract. Overlay's
public geometry is `placement` / `anchor` / `edge` /
`--reference-overlay-*`; `computePosition` internals are not.

The completeness argument is behavioral rather than pattern-count based:

- `Slot` covers named-region registration so compound components can
  expose declarative part APIs. `Portal` and `Presence` cover relocation
  and visual lifetime. Wrapper-free prop merge onto a single child is the
  `ReferenceSlotPartProps` contract, not Slot.
- `Field` covers the input bezel: descendant controls surrender standalone
  chrome, and the wrapper reacts through CSS `:has()` instead of becoming a
  second validity owner. `NumberField.Group` consumes that same recipe on
  `div[role="group"]`.
- `FocusLock` and `RovingFocus` cover contained and composite focus movement.
- `Overlay` and `Popover` cover document layers, dismissal, isolation, and
  geometry. Overlay is the kernel (Floating UI port, viewport edge, Trigger,
  isolation policy). Popover is hover/impatient-click policy on that kernel.
- `ReferenceLibrary` and `Toast` cover document-scoped global lifetime,
  announcement, and queued work.
- `Listbox`, `Menu`, `Tree`, `Combobox`, and `Tabs` cover flat, hierarchical,
  popup-coordinated, and activated collections.
- `Slider`, `Switch`, `NumberField`, `DateField`, `Collapsible`, `Accordion`,
  `Splitter`, `Tooltip`, and `Calendar` own the remaining difficult value,
  on/off thumb anatomy, localized numeric editing, locale-aware date editing,
  disclosure, description, resize session, and date-grid state machines.

The final vendor pass changed membership without treating the count as
sacred. NumberField passed all four admission criteria: quantities, localized
currency/percent fields, and scientific/unit inputs otherwise recreate the
same partial-edit, parsing, precision, stepping, and form invariants.
Switch passed on anatomy, not on a second boolean state machine: a sliding
thumb has to be a real child, and a native checkbox cannot host one.
Checkbox and radio stay native. DateField passed the same four criteria as
NumberField for dates: `input[type=date]` is not locale-deterministic and
cannot share an ISO value with Calendar, while Calendar does not parse
typed input. Aria/Zag segmented spinbuttons are a second APG we deliberately
do not take. Field passed on visual agreement, not form wiring: wrapping
inputs in a box is unavoidable, and generated Input chrome must surrender
inside that box without Field copying `aria-invalid`. `NumberField.Group`
consumes that recipe rather than nesting Field or forking a second bezel.

Adding a pattern name without introducing a new invariant would make the API
larger without making an agent more capable. Conversely, a vendor regression
that cannot be expressed by these owners is evidence for an API correction
inside the relevant owner before it is evidence for component 25.

Generated typed HTML primitives are a separate platform-mirroring surface.
Existing `Reference`/`ReferenceView` browser documentation UI is also outside
this behavioral-primitive freeze; neither changes the 24-component inventory
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
primitives. An `Overlay.Content` is still a style-bearing `Div`, an
`Overlay.Trigger` is still a style-bearing `Button`, and a `Tabs.Tab` is
still a style-bearing `Button`; behavior augments rather than replaces the
platform/style surface.

Generated `Input`, `Textarea`, and `Select` keep standalone chrome unless they
are descendants of `Field`. The ancestor selector, not a React flag, is what
turns that chrome off.

## Foundation components

Reference UI only provides a runtime component when it centralizes behaviour that should not be repeatedly rebuilt by developers or AI agents.

Working design lives in sibling folders: `Overlay/Overlay.md` (API + problems), `Overlay/TESTS.md` (contracts to prove, including how vendor e2e suites combine). Implementation substrate is [hooks.md](../core/hooks/hooks.md): Zustand plus adapters in `src/core/hooks`. This document remains the freeze-gate overview. Names under Documented compositions do not get folders — they are not runtime components. The `vendor/` clones are **port sources**, not runtime dependencies: Overlay synthesizes Floating UI core/DOM, Vaul's edge/handle kernel, and Sonner's nested-stack CSS language; `@floating-ui/react` stays leave. See `vendor/VENDOR.md`. How to run Playwright is `packages/reference-lib/TESTING.md`.

Foundation components solve application-wide mechanics:

- `ReferenceLibrary`
- `Portal`
- `Overlay`
- `Popover`
- `Toast`

`Dialog`, `Modal`, `AlertDialog`, `Drawer`, `Sheet`, and `Lightbox` are not separate foundational components. They are semantic and visual compositions of `Overlay`. A dialog is isolating Overlay plus role. A drawer is isolating Overlay plus `edge` and optional Handle. A popover-without-hover is Overlay with `isolation={false}` plus Trigger. Hover still belongs to `Popover`.

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

Overlay answers three independent questions: where Content is bound
(unbound, Trigger/`anchor`, or `edge`), how isolated the rest of the page
is (`isolation`), and how the layer opens and closes (controlled `open`,
optional `Overlay.Trigger`, dismiss handlers, optional Handle drag).

`vendor/floating-ui` core + DOM is the anchored geometry port — not a
runtime import, and not `@floating-ui/react`. `vendor/vaul` is the
viewport-edge kernel (Handle drag, iOS `position: fixed`, nested
displacement). `vendor/sonner` contributes nested-stack CSS variables and
swipe-progress language; the toast queue stays Toast.

Semantic role, copy, and appearance stay in application markup. Popover
and Tooltip remain named policy (hover, skip-delay). They consume this
kernel; they do not run a second overlay runtime.

```tsx
<Overlay open={open} onOpen={() => setOpen(true)} onDismiss={close}>
  <Overlay.Trigger>Delete project</Overlay.Trigger>
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

Trigger is optional. Omitted Trigger is a dialog opened from application
state. Isolation defaults on.

```tsx
<Overlay
  open={open}
  onOpen={() => setOpen(true)}
  onDismiss={close}
  edge="bottom"
>
  <Overlay.Trigger>Filters</Overlay.Trigger>
  <Overlay.Backdrop />
  <Overlay.Content role="dialog" aria-modal="true">
    <Overlay.Handle />
    {children}
  </Overlay.Content>
</Overlay>
```

```tsx
<Overlay
  open={open}
  onOpen={() => setOpen(true)}
  onDismiss={close}
  isolation={false}
>
  <Overlay.Trigger>Open filters</Overlay.Trigger>
  <Overlay.Content placement="bottom-start" offset={8}>
    <Overlay.Arrow />
    {children}
  </Overlay.Content>
</Overlay>
```

That last shape is a popover without hover. `Popover` adds hover grace.

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

Focus restoration, isolating teardown, and scroll unlock run after Presence reports the exit complete. Applications style against `data-state`; they do not set it, wrap Overlay in Presence, or delay `open={false}` in order to animate.

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

type OverlayEdge = "top" | "right" | "bottom" | "left"

type OverlayIsolation =
  | boolean
  | {
      focus?: boolean
      inert?: boolean
      scroll?: boolean
    }

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
  onOpen?: () => void
  anchor?: VirtualAnchor
  edge?: OverlayEdge
  isolation?: OverlayIsolation
  closeOnScroll?: boolean
}

interface OverlayTriggerProps
  extends ReferencePartProps<"button"> {}

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

interface OverlayHandleProps
  extends ReferencePartProps<"div"> {}
```

`Overlay` renders no node. `Overlay.Trigger` renders `button`.
`Overlay.Backdrop`, `Overlay.Content`, `Overlay.Arrow`, and
`Overlay.Handle` render `div`. `Overlay.Portal` renders nothing.

Omitted `isolation` is `true`. An object patches that bundle.
`isolation={false}` is popover-shaped Overlay without hover. Trigger
never portals. Handle is valid only with `edge`. `edge` and `anchor`
are exclusive.

Unbound Overlay writes no `position` / `top` / `left`. Placement,
offset, collision, strategy, flip, shift, and Arrow are inert. Anchored
Content is the floating element. Defaults are
`placement="bottom-start"`, `offset=8`, `collisionPadding=8`, absolute
strategy, and flip/shift enabled. Positioning owns `position` / `top` /
`left` but never consumer `transform`. Content publishes
`--reference-overlay-available-width`,
`--reference-overlay-available-height`,
`--reference-overlay-anchor-width`,
`--reference-overlay-anchor-height`, and
`--reference-overlay-transform-origin`, plus `data-anchor-hidden` and
`data-escaped`. Edge Overlay binds to a viewport side and publishes
`--reference-overlay-index` / `--reference-overlay-count`. Arrow
`edgePadding` defaults to 4px. While open, anchored Overlay runs the
ported `autoUpdate`.

Popover, Tooltip, `Combobox.Popover`, and `Menu.Content` consume this
API. They do not own a second `computePosition` runtime.

---

### Popover

Controlled, anchored, non-isolating floating content with hover policy.

Overlay already owns Trigger, `onOpen`, isolation, the Tab-order bridge,
`closeOnScroll`, geometry, and the layer stack. Popover is Overlay with
`isolation={false}` plus hover grace (`openOnHover`), impatient click, and
delay defaults. `Popover.Trigger` is `Overlay.Trigger`.
`Popover.Content` / `Arrow` wrap Overlay parts.

Virtual anchors remain Overlay positioning math. When both a trigger and
an `anchor` are present, the trigger remains the interaction and
accessibility source; `anchor` wins for geometry.

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

`Popover.Trigger` is `Overlay.Trigger` (`button`). `Popover.Content` is wrapped
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

Popover uses Presence / `data-state`, but unlike isolating Overlay its logically
closed exiting Content is inert and leaves the active dismissal stack
immediately. Positioning and any parent FocusLock branch remain until the exit
and focus restoration complete.

Unprevented Trigger activation is Overlay's (`onOpen` / `onDismiss`).
`Popover.Trigger` is `Overlay.Trigger`. The Tab-order bridge is Overlay's
whenever isolation focus is off. `closeOnScroll` is Overlay's, default false
on Popover.

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

interface PopoverProps
  extends Omit<OverlayProps, "isolation" | "edge"> {
  openOnHover?: boolean
  openDelay?: number
  closeDelay?: number
}

interface PopoverTriggerProps extends OverlayTriggerProps {}

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

- **`DateField`**
  Owns localized date-only text editing where native `input[type=date]` is
  not deterministic enough: locale-ordered numeric grammar, partial
  segments, caret-aware day/month/year stepping, and one controlled ISO
  calendar date. DateField is a fold/unfold recipe: childless `<DateField />`
  collapses directly to one atomic textbox (`input[type=text]`); `<DateField><DateField.Picker /></DateField>`
  represents the standard date picker (upgrading the input to an APG combobox
  and synthesizing the popup layer and day Calendar); `<DateField.Range><DateField.Picker /></DateField.Range>`
  represents the range picker. Unfolded parts (`DateField.Input`, `DateField.Trigger`,
  `DateField.Picker`, `DateField.Calendar`, `DateField.Start`, `DateField.End`)
  follow the Reference UI part-resolution law. Segment spinbuttons and packaged
  visual Date products stay leave.

- **`Calendar`**  
  The date-grid engine. This is genuinely hard: locale-aware week start and weekday headings, construction of padded month grids, 2D keyboard movement, disabled/unavailable skipping, min/max clamping, today vs selected vs focused, range selection, and heading-driven navigation. One discriminated `mode` describes day, range, month, or year products and their exact ISO value shape; private view is not another application axis. Extra children are explicit application chrome. Typed dates are `DateField`.

- **`Collapsible`**  
  Coordinates a single disclosure trigger and content region, including `aria-expanded`, `aria-controls`, and controlled visibility.

- **`Accordion`**  
  Coordinates a collection of Collapsibles, including single/multiple expansion policies and optional keyboard traversal between headers.

- **`Splitter`**  
  A 1D flex partition with a window-splitter Handle. Owns Root
  `display: flex`, percentage flex-basis via CSS variables, the pointer
  loop (direct DOM writes, no React commit per move), min/max, keyboard,
  collapse/restore, and ARIA. Nested Splitters provide a second axis. CSS
  Grid is page chrome or content inside a Panel, not a Splitter mode.

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
<Label htmlFor="quantity">Quantity</Label>
<NumberField
  value={quantity}
  onChange={setQuantity}
  locale="en-GB"
  min={0}
  max={100}
  step={1}
  name="quantity"
>
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
and focusable `input[type=text]`; the two optional steppers are
`button[type=button][tabindex=-1]` and each requires an authored accessible
name. Group is `role="group"` and a Field-surface host: it sets
`data-reference-field` on that same node and consumes Field's bezel recipe.
Do not wrap Group in Field. `status="warning"` on Group is Field's visual
exception. A supplied root `name` adds one
generated hidden input carrying the
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

### DateField

Locale-aware date-only text editing. DateField is a typed input: the dirty
localized string, one canonical ISO calendar date or `null`.
`input[type=date]` is not the host. Calendar is composed by sharing that
ISO value — Field for chrome, Popover for the layer. There is no `range`
toggle: DateRange is two DateFields plus Calendar `mode="range"`.

```tsx
<Label htmlFor="birthday">Birthday</Label>
<DateField
  id="birthday"
  value={date}
  onChange={setDate}
  locale="en-GB"
  name="birthday"
/>
```

DateField is a fold/unfold recipe. Childless `<DateField />` collapses directly
to `DateField.Input` rendering one visible `input[type=text]` directly with
standard textbox semantics (dual-host contract). When `<DateField.Picker />`
is present, bound inputs upgrade to the W3C APG Date Picker Combobox contract
(`role="combobox" aria-haspopup="dialog" aria-expanded aria-controls aria-autocomplete="none"`),
opening via deliberate activation (pointer click or `Alt + ArrowDown`). Authoring
`<DateField.Trigger>` provides an auxiliary opener button (`tabIndex={-1}`).
Two dates are `<DateField.Range>`, which coordinates two combobox inputs
(`DateField.Start` and `DateField.End`), trigger, embedded range Calendar, and
internal draft/Apply/Cancel transactions. Slotted `<Calendar>` (or `<DateField.Calendar>`)
unfolds and replaces the synthesized default Calendar with managed invariants.
Calendar omits `month` so opening remounts the grid on the selected day.
`locale` `formatToParts` is the visible grammar. Partial segments stay visible
without publishing. Blur and Enter commit; impossible dates revert.
ArrowUp/Down step the caret's day, month, or year using Calendar's
Gregorian constrain. A supplied `name` serializes canonical `YYYY-MM-DD`
through hidden inputs. Segment spinbuttons, two-digit year windows,
`Date` objects, and packaged visual Date products are absent. Exact contract:
[DateField.md](./DateField/DateField.md).

```ts
type ISODate = `${number}-${number}-${number}`
type ISOMonth = `${number}-${number}`

type DateRangeValue = {
  start: ISODate
  end: ISODate
} | null

type DateRangeDraft = {
  start: ISODate | null
  end: ISODate | null
}

type DateFieldManagedProp =
  | "type"
  | "role"
  | "value"
  | "defaultValue"
  | "onChange"
  | "inputMode"
  | "aria-invalid"
  | "aria-disabled"
  | "aria-readonly"
  | "aria-required"
  | "aria-valuemin"
  | "aria-valuemax"
  | "aria-valuenow"
  | "aria-valuetext"

interface DateFieldProps
  extends Omit<
    ReferencePartProps<"div">,
    DateFieldManagedProp | "children"
  > {
  children?: React.ReactNode
  value: ISODate | null
  onChange?: (value: ISODate | null) => void
  locale: string
  min?: ISODate
  max?: ISODate
  isDateUnavailable?: (date: ISODate) => boolean
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  invalid?: boolean
  name?: string
  form?: string
  placeholder?: string
}

interface DateFieldInputProps
  extends Omit<
    ReferencePartProps<"input">,
    DateFieldManagedProp
  > {}

interface DateFieldTriggerProps
  extends ReferencePartProps<"button"> {}

interface DateFieldPickerProps
  extends PopoverContentProps {
  children?: React.ReactNode
}

interface DateFieldCalendarProps
  extends Omit<
    CalendarProps,
    | "value"
    | "onChange"
    | "locale"
    | "mode"
    | "min"
    | "max"
    | "isDateUnavailable"
  > {
  min?: ISODate
  max?: ISODate
  isDateUnavailable?: (date: ISODate) => boolean
}

interface DateFieldRangeProps
  extends Omit<
    ReferencePartProps<"div">,
    DateFieldManagedProp | "children"
  > {
  children?: React.ReactNode
  value: DateRangeValue
  onChange?: (value: DateRangeValue) => void
  locale: string
  min?: ISODate
  max?: ISODate
  isDateUnavailable?: (date: ISODate) => boolean
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  invalid?: boolean
  name?: string | { start?: string; end?: string }
  form?: string
}

interface DateFieldStartProps
  extends Omit<
    ReferencePartProps<"input">,
    DateFieldManagedProp
  > {}

interface DateFieldEndProps
  extends Omit<
    ReferencePartProps<"input">,
    DateFieldManagedProp
  > {}
```

### Calendar

Anatomy stays visible when you unfold it. Calendar owns grid math, keyboard,
selection, heading-driven navigation, one discriminated product `mode`, and
which collection is on screen. Omitted named parts are a complete control.
Extra children are ordinary application chrome with explicit callbacks —
recents and “last year” are not a Presets part or an imperative context.
View is private. `month` is internal unless supplied and seeds from `value`
when omitted. DateField and DateField.Range compose Calendar
externally; they do not become Calendar context or state.

```tsx
<Calendar value={value} onChange={setValue} locale="en-GB" min={min} max={max} />
```

```tsx
<Calendar mode="range" value={range} onChange={setRange} locale="en-GB" />
```

```tsx
<Calendar mode="month" value={billingMonth} onChange={setBillingMonth} locale="en-GB" />
```

Range hover preview is not application state. DateInput, DateRange, month
picker, and year picker are folds of this control plus Popover /
DateField. DateRange uses the `DateField.Range` draft state machine
specified by DateField. Exact contract: [Calendar.md](./Calendar/Calendar.md).

Approximate API:

```ts
type ISODate = `${number}-${number}-${number}`
type ISOMonth = `${number}-${number}`
type ISOYear = `${number}`
type CalendarWeekday =
  | "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat"

type CalendarDateRange = { start: ISODate; end: ISODate | null }

interface CalendarSharedProps
  extends Omit<ReferencePartProps<"div">, "defaultValue" | "onChange"> {
  month?: ISOMonth
  onMonthChange?: (month: ISOMonth) => void
  locale: string
  firstDayOfWeek?: CalendarWeekday
  today?: ISODate
  min?: ISODate
  max?: ISODate
  isDateUnavailable?: (date: ISODate) => boolean
}

type CalendarProps =
  CalendarSharedProps &
    (
      | {
          mode?: "day"
          value: ISODate | null
          onChange?: (value: ISODate | null) => void
        }
      | {
          mode: "range"
          value: CalendarDateRange | null
          onChange?: (value: CalendarDateRange | null) => void
        }
      | {
          mode: "month"
          value: ISOMonth | null
          onChange?: (value: ISOMonth | null) => void
        }
      | {
          mode: "year"
          value: ISOYear | null
          onChange?: (value: ISOYear | null) => void
        }
    )

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

Cells rendered by `Calendar.Days` expose `data-today`, `data-selected`, `data-disabled`, `data-outside-month`, and for ranges `data-range-start`, `data-range-end`, `data-in-range`. Month and year cells expose `data-current` plus the same selected/disabled/range markers against the controlled value's month or year. Keyboard movement and selection do not require those attributes to be set by the application. Exact view contract: [Calendar.md](./Calendar/Calendar.md).

---

## Visual chrome

Field is a wrapping `div` because wrapping inputs in a box is an unavoidable
layout tradition. It is not authoring machinery: Slot exists to avoid wrapper
nodes; Field exists because this wrapper is the bezel. Exact selectors:
[Field.md](./Field/Field.md).

### Field

Visual bezel around a form control. Field owns chrome. The enclosed input
owns semantics. Label sits above Field, never inside it. No role, no
validity ARIA, no label wiring. Generated
`Input` / `Textarea` / `Select` (and `*.Input` parts) surrender standalone
border, background, shadow, and focus ring when they are descendants of
Field. The bezel follows `:has()` against the real control.

```tsx
<Label htmlFor="amount">Amount</Label>

<Field>
  <span aria-hidden="true">£</span>
  <Input
    id="amount"
    aria-invalid={invalid}
    aria-describedby={invalid ? "amount-error" : undefined}
  />
  <Button type="button" aria-label="Clear amount">
    ×
  </Button>
</Field>
```

A Combobox token picker is the same bezel: Field wraps `Combobox.Input`, an
opener `Button`, and chip `Button`s; `Combobox.Popover` stays outside Field.
The chevron is not `Combobox.Trigger`. Exact tree: [Field.md](./Field/Field.md).
`NumberField.Group` consumes the same recipe on `div[role="group"]`.

`status="warning"` is the only Field-owned visual state. Error, disabled,
read-only, and focus never become Field props. `role="group"` stays on
`NumberField.Group`, not Field.

```ts
interface FieldProps
  extends Omit<
    ReferencePartProps<"div">,
    | "role"
    | "aria-invalid"
    | "aria-disabled"
    | "aria-readonly"
    | "aria-required"
    | "aria-errormessage"
  > {
  status?: "warning"
}
```

---

## Authoring primitives

Authoring primitives are the underlying composition and lifecycle machinery used to construct design-system components from Reference UI primitives without adding wrapper DOM nodes.

Proposed APIs: `Slot/Slot.md`, `Presence/Presence.md`, `RovingFocus/RovingFocus.md`, `FocusLock/FocusLock.md`.

> [!NOTE]
> `Slot` is the named-region registry for declarative component APIs.
> Transparent parts that merge onto one child use `ReferenceSlotPartProps`;
> that merge does not make Reference UI primitives polymorphic or alter
> their documented native elements.

- **`Slot`**  
  A part registers an element into a slot id; the host reads the root and
  renders that element in the matching region. Live content is a getter,
  not a registration dependency. Not Radix `asChild` merge and not Portal.
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

### Transparent part merge rules

`ReferenceSlotPartProps` parts (FocusLock, RovingFocus, Tooltip.Trigger, and
other single-child hosts) merge onto one child. This is **not** the Slot
registration primitive in `Slot/Slot.md`.

The merge API is defined by its strict precedence:

- **Native props:** Child props take precedence over part props, except for styles, classes, and handlers.
- **Event handlers:** Composed in sequence: child handler executes first; part handler executes second.
  ```ts
  childHandler(event)
  if (!event.defaultPrevented) {
    partHandler(event)
  }
  ```
- **Event cancellation:** If a child handler calls `event.preventDefault()`, the part handler will not run (`!event.defaultPrevented`).
- **className:** Combined into a single merged class string.
- **style:** Merged shallowly; child style properties override part style properties.
- **Refs:** Composed into a merged ref callback that updates both part and child refs.
- **IDs & ARIA attributes:** Merged deterministically; composite attributes like `aria-describedby` concatenate valid ID tokens.
- **Missing / duplicate children:** Enforces a single-child invariant when active; passes through cleanly when transparent.
- **Nested transparent parts:** Merges props recursively through nested single-child hosts.

---

## Documented compositions

Complex interface patterns are documented compositions of foundational and ARIA primitives rather than rigid standalone components:

- **`Dialog`** $\rightarrow$ isolating `Overlay` + `Overlay.Backdrop` + `Overlay.Content` (`role="dialog"`), optional `Overlay.Trigger`
- **`AlertDialog`** $\rightarrow$ same, `role="alertdialog"`, prevent `onEscape`
- **`Drawer` / `Sheet`** $\rightarrow$ isolating `Overlay` with `edge`, optional `Overlay.Handle` and Trigger. Slide-out is CSS against `data-state` / Presence; `edge` is Overlay geometry, not flip/`anchor`.
- **`Lightbox`** $\rightarrow$ isolating `Overlay` with media preview presentation
- **`Select`** $\rightarrow$ select-only `Combobox` (`Combobox.Trigger` +
  `Combobox.Popover`) with a `Listbox` popup
- **`Autocomplete`** $\rightarrow$ editable `Combobox` (`Combobox.Input` +
  `Combobox.Popover`) with a `Listbox` popup
- **`MenuButton`** $\rightarrow$ `Popover.Trigger` + `Popover.Content` + `Menu`
- **`ContextMenu`** $\rightarrow$ `Popover` with a virtual pointer `anchor` + `Menu` (no trigger button)
- **`DateInput`** $\rightarrow$ standard date picker: `<DateField><DateField.Picker /></DateField>`. Upgrades input to APG combobox, synthesizes trigger, popover layer, day Calendar, and dismissal on day selection; unfolds into `DateField.Input`, `DateField.Trigger`, `DateField.Picker`, `DateField.Calendar`.
- **`DateRange`** $\rightarrow$ standard range picker: `<DateField.Range><DateField.Picker /></DateField.Range>`. Coordinates two combobox inputs (`DateField.Start`, `DateField.End`), trigger, range Calendar, and draft transaction; unfolds into individual parts.
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
- **Searchable token picker** $\rightarrow$ `Field` around `Combobox.Input`
  plus opener/chip `Button`s; scalar `Combobox` commits into application
  token state; `Combobox.Popover` stays outside Field. The chevron is not
  `Combobox.Trigger`. Chip-row `RovingFocus` is optional.
- **Picker popup** (emoji, icon, command grid) $\rightarrow$ `Popover` or
  `Overlay` + Combobox's custom-grid virtual-focus adapter
- **Prefixed / suffixed text field** $\rightarrow$ `Field` around `Input` (or
  atomic `DateField`) plus authored prefix, suffix, or action buttons. Label
  sits above Field and stays `htmlFor` on the control. `NumberField.Group`
  consumes that recipe on `div[role="group"]`; do not wrap Group in Field.

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
- **Native `<dialog>`** — Overlay is the stacking, nesting, Presence, isolation, and
  geometry contract. Do not swap in HTML dialog as a second modal runtime.
- **A `modal` boolean on Overlay** — isolation is three systems (`focus`,
  `inert`, `scroll`). Use `isolation`, not a flag that smuggles light-dismiss
  and trap together. Default remains isolating.
- **Drawer snap points / iOS scale-behind** — product chrome. Overlay owns
  `edge`, Handle-only drag, nested stack CSS, and iOS `position: fixed`.
  Do not lift Vaul `use-snap-points` or `use-scale-background`.
- **`Carousel`** — CSS scroll-snap plus optional `RovingFocus`. Not a primitive.
- **Form-field wiring** (`Form`, implicit label association, `Field.Label` /
  `Field.Error`) — explicit IDs are the agent-friendly answer; a public
  Form/Field provider is not a freeze primitive. Visual `Field` is the bezel
  only; see `Field`.
- **`ScrollArea`** — modern CSS (`overflow`, overlay scrollbars, `scrollbar-gutter`) covers it.
- **`DataGrid`** — an ecosystem problem (virtualization, editing, column models, selection), not a primitive this library can freeze honestly.
- **Virtualized or multi-select `Tree`** — the freeze Tree is APG keyboard + collapse + single selection only. Windowed rows and multi-select stay application-owned.
- **`NavigationMenu` / mega-menu** — Popover + Menu + hover intent. A documented pattern later if needed; not a freeze primitive.
- **Aria/Zag `DateSegment` spinbuttons** — DateField is one textbox, like
  NumberField. Segment APG, placeholder parts, and packaged visual Date
  products stay leave. The fold/unfold recipe (`<DateField><DateField.Picker /></DateField>`,
  `<DateField.Range><DateField.Picker /></DateField.Range>`) provides direct
  progressive disclosure without segment spinbutton machines.

Time-of-day widgets are outside Calendar and DateField. Both are calendar dates.

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
6. **Triple composition verification:** At least three substantially different compositions work seamlessly without escape-hatch props. For `Listbox` and `Combobox`, one of those compositions must be virtualized: windowed options that preserve `aria-setsize` / `aria-posinset` and support scroll-to-index. For `Calendar`, one composition must use a locale whose week does not start on Sunday, one must be a DateRange picker, one must be a folded month picker, and one must be recents chrome with an explicit application callback. For `Tree`, one composition must be nested at least two levels, and one must prove collapsed descendants are absent from the roving set.
   For `NumberField`, compositions must include non-Latin digits, an
   affixed percent/currency/unit format, canonical form submission, and a
   ShadowRoot boundary. For `Switch`, compositions must include a sibling
   `htmlFor` label, a wrapping label inside a form that does not serialize
   the button, and independent low- and high-specificity switches inside a
   nested overlay. For `Overlay`, compositions must include an isolating
   dialog (optional Trigger), an `edge` drawer with Handle, and
   `isolation={false}` Trigger+Content without a second positioning
   runtime or a hover policy. For `DateField`, compositions must include
   childless DateField (atomic textbox), standard folded picker
   (`<DateField><DateField.Picker /></DateField>`), unfolded picker
   (`<DateField.Input>` + `<DateField.Trigger>` + `<DateField.Picker>`),
   folded range (`<DateField.Range><DateField.Picker /></DateField.Range>`),
   unfolded range (`<DateField.Start>` + `<DateField.End>` + `<DateField.Trigger>` + `<DateField.Picker>`),
   canonical ISO form submission, a locale with numeric literals (for
   example `ja-JP`), and a ShadowRoot boundary. For `Field`,
   compositions must include a labelled prefix/suffix Input, atomic DateField
   with a calendar trigger, the People token picker (`Combobox.Input` +
   opener/chip Buttons, Popover outside), and NumberField.Group consuming
   the Field recipe on `div[role="group"]` without a nested Field, with
   identical default/focus/invalid/warning/disabled/read-only chrome
   (`FI-SURF-01`). For `Splitter`, compositions must include a collapsible
   flex sidebar in LTR and RTL, a vertical editor/console, a nested
   two-axis workspace, and an inner CSS grid that reflows when its Panel
   resizes — without a Splitter grid mode. The pointer gesture stays
   inside the frame budget (no React commit or layout read per
   pointermove).
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



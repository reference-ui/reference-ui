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

## Initial component set

Reference UI only provides a runtime component when it centralizes behaviour that should not be repeatedly rebuilt by developers or AI agents.

The initial set is intentionally small:

- `ReferenceLibrary`
- `Portal`
- `Overlay`
- `Popover`
- `Toast`

`Dialog`, `Modal`, `AlertDialog`, `Drawer`, `Sheet`, and `Lightbox` are not separate foundational components. They are semantic and visual compositions of `Overlay`.

---

### ReferenceLibrary

Mounts Reference UI's application-level runtime systems.

`ReferenceLibrary` is not a React context provider. It does not inject values into its descendants or require components to remain beneath a particular context boundary. It provides a stable React-level mount for systems that operate across the application, including Toast.

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

Overlay handles the shared mechanics: portal rendering, nesting, dismissal ordering, focus containment, background inerting, scroll locking, and focus restoration.

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

Because Overlay is controlled, dismissal requests do not change application state themselves. Applications can handle high-level dismissal with `onDismiss` or target specific interactions with granular handlers (`onEscape`, `onOutsidePress`):

```tsx
<Overlay
  open={open}
  onEscape={close}
  onOutsidePress={close}
>
  {children}
</Overlay>
```

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
  extends React.HTMLAttributes<HTMLDivElement> {}
```

---

### Popover

Controlled, anchored floating content associated with a trigger.

Popover owns the relationship between its trigger and content, including positioning, collision handling, keyboard and pointer interaction, accessible state, outside dismissal, and focus restoration.

Unlike Overlay, a trigger is fundamental to Popover: it is both the interaction source and the positioning anchor.

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

An optional arrow participates in the same positioning calculation:

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

interface PopoverProps extends OverlayDismissHandlers {
  children?: React.ReactNode
  open: boolean
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
  announce: ({ project }) => `${project.name} was saved`,

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
toast.show(ProjectSavedToast, { project })
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
  announce: ({ file }) => `Uploading ${file.name}`,

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
  announce: ({ file }) => `${file.name} was uploaded`,

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

toast.show(UploadingToast, { file }, { id })
toast.update(id, UploadCompleteToast, { file })
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

  announce?: string | ((props: Props) => string)
  duration?: number | false
  position?: ToastPosition
}

interface ToastOptions {
  id?: ToastId
  duration?: number | false
  position?: ToastPosition
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
```

Calling `toast.dismiss()` without an ID dismisses every active toast.

A toast definition is ordinary, visible application code. AI agents can create exactly the notification requested without reverse-engineering proprietary variants, fixed layouts, or hidden component state.

---

## ARIA primitives

Beyond foundational layer management (`Overlay`, `Popover`, `Portal`, `Toast`), certain interface patterns require strict adherence to the **WAI-ARIA Authoring Practices Guide (APG)**. These patterns involve complex state machines, roving tabindex, active-descendant tracking, typeahead searching, and keyboard traversal contracts that should not be repeatedly rebuilt on the fly.

Following the same primitive-first philosophy, these components remain decoupled, unstyled, and highly composable:

- **`Listbox`**  
  The core selection and option-management engine. Handles single/multi selection, disabled item skipping, typeahead matching, and keyboard navigation.  
  - Composed with `<button>` + `Popover` $\rightarrow$ **`Select`**
  - Composed with `<input>` + `Popover` $\rightarrow$ **`Combobox` / Autocomplete / Search**

- **`Menu`**  
  Owns `role="menu"` keyboard navigation, item activation, typeahead, and nested submenu orchestration. Composes with `Popover` for dropdown and context menus.

- **`Tabs`**  
  Coordinates directional keyboard cycling (horizontal/vertical), automatic vs. manual activation, and `aria-controls` / `aria-labelledby` linking between tabs and panels.

- **`Slider`**  
  Encapsulates pointer drag math, multi-thumb collision constraints, keyboard stepping (arrows, PageUp/PageDown, Home/End), and ARIA value ranges (`aria-valuenow`, `aria-valuemin`, `aria-valuemax`).

- **`Accordion` / `Collapsible`**  
  Coordinates multi-item disclosure state, optional single-expanded constraints, and keyboard header traversal.

- **`Splitter`**  
  Provides accessible, resizable panel partitions (`role="separator"`) in horizontal and vertical orientations. Handles pointer/touch drag calculations, minimum/maximum size clamping, keyboard-driven resizing (Arrow keys, Home/End, Enter to collapse), and selection prevention during resize.

- **`Tooltip`**  
  Transient informative descriptions associated with a focusable or hoverable trigger (`role="tooltip"` linked via `aria-describedby` or `aria-labelledby`). Handles hover intent delays, warm-up skip delays across neighbouring tooltips, keyboard focus display, and non-modal Escape dismissal per WCAG 2.1 guidelines.


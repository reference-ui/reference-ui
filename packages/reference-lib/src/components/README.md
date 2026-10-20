# Components

Composable behavior owners: each component centralizes one difficult,
invariant behavior — focus containment, layering, positioning,
collection navigation, disclosure, range math, localized editing —
while product semantics, application state, markup, and visual design
stay in application code. Anatomy is visible in JSX, state is
controlled through props, and every part renders a defined native
element with no `as` prop.

## API principles

- **Explicit composition:** anatomy is visible JSX, not configuration
  objects. A named interface pattern may be a documented composition of
  lower-level primitives rather than another runtime.
- **Controlled application state:** application state arrives through
  props. Components do not invent parallel state models, and rejected
  controlled props stay authoritative.
- **Zustand, not a context contract:** shared state that would
  otherwise need React Context uses Zustand as a direct dependency.
  Stores stay internal; consumers get props, parts, and any
  Reference-owned domain hooks or actions named in the component spec.
  Native Context is allowed only for genuine subtree scoping (a part
  finding its owner). Applications never wrap trees in a Provider.
- **Stable DOM semantics:** parts render defined native elements and
  keep the attributes and events of the element they render.
- **Shared part types:** fixed parts use one shared props contract
  (`ReferencePartProps`, with ref); transparent parts merge onto one
  element child (`ReferenceSlotPartProps`) and never claim a native tag.
- **Style props everywhere:** every fixed, style-bearing part accepts
  the same token-aware StyleProps, `css`, responsive rhythm, color
  mode, and ref surface as its matching generated HTML primitive.

## Inventory criteria

The set is complete for the intended layer when ordinary HTML and CSS
plus these behavior owners can express product patterns without
rebuilding focus containment, layering, positioning, collection
navigation, disclosure, range math, localized numeric editing, or date
logic. Vendor coverage may require a new part, callback, option,
helper, or documented composition — never by itself a new top-level
component. A new one is admitted only when the web platform does not
already own the behavior, no current primitive can own it without
mixing unrelated state machines, composition would force applications
to recreate a difficult invariant, and at least three materially
different products need the same public contract. Internal kernels
(layer registry, scroll lock, inert manager, announcer, tabbable
solver, typeahead matcher) stay implementation details unless
independent application use proves a stable public contract.

## Omission rationale

Omissions are decisions. Checkbox and radio stay native — they already
own state, grouping, keyboard, and form behavior (Switch exists only
because a sliding thumb cannot live inside a void input). Native
`<dialog>`, a separate `SpinButton`, `Progress`/`Meter`,
`ScrollArea`, form-field wiring, and `DataGrid` stay out for the same
reason: the platform, CSS, or application code already owns them.
Dialog, Drawer, Sheet, Select, Autocomplete, MenuButton, ContextMenu,
Toolbar, and DateInput/DateRange are documented compositions of the
primitives above, not runtimes. Isolation is three systems (focus,
inert, scroll), never a `modal` boolean; product chrome such as drawer
snap points stays in application code.

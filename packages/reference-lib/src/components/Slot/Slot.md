# Slot

Proof: [TESTS.md](./TESTS.md).

Named-region registration for declarative component APIs. A part registers
an element into a slot id; the host reads the shared registry and renders
that element in the matching region. Authors compose parts in any order.
The host does not collect them through layout props.

Every Reference UI compound with a declarative part API sits on this
kernel. Slot is not Radix `asChild` merge, not Portal, and not a page
shell.

```tsx
const {
  Provider: MyComponentSlots,
  useSlotRegistration,
  useScanById,
} = createSlotRootContext()

function MyComponent({ children }: { children: React.ReactNode }) {
  return (
    <MyComponentSlots>
      {children}
      <MyComponentLayout />
    </MyComponentSlots>
  )
}

function MyComponentTitle({ children }: { children: React.ReactNode }) {
  useSlotRegistration({
    slotId: "title",
    element: <H1>{children}</H1>,
  })
  return null
}

function MyComponentActions({ children }: { children: React.ReactNode }) {
  useSlotRegistration({
    slotId: "actions",
    element: <Div>{children}</Div>,
    meta: { align: "end" },
  })
  return null
}

function MyComponentLayout() {
  const title = useScanById("title")
  const actions = useScanById("actions")
  return (
    <Div>
      <header>{title?.element}</header>
      <footer>{actions?.element}</footer>
    </Div>
  )
}

<MyComponent>
  <MyComponentActions>
    <Button type="button">OK</Button>
  </MyComponentActions>
  <MyComponentTitle>Confirm</MyComponentTitle>
</MyComponent>
```

Authored order does not matter. The host layout is a sibling that renders
after the filling children and reads live getters, not a snapshot from
mount.

A new region is a stable `slotId` plus a host that scans it. Optional
`meta` is typed on the root (`createSlotRootContext<MyMeta>()`). Host part
hooks may wrap `useSlotRegistration`; those wrappers are not Slot.

## Proposed API

```ts
interface SlotVisibility {
  visible?: boolean
  hidden?: boolean
}

type ResolvedSlotVisibility = "visible" | "hidden" | "unmounted"

function resolveSlotVisibility(
  visibility?: SlotVisibility,
): ResolvedSlotVisibility

interface SlotRegistration<TMeta = unknown> {
  element: React.ReactElement
  slotId: string
  meta?: TMeta
  visibility?: SlotVisibility
}

class SlotRoot<TMeta = unknown> {
  register(
    registrationId: string,
    slot: SlotRegistration<TMeta>,
  ): void
  unregister(registrationId: string): void
  getVersion(): number
  scanById(slotId: string): SlotRegistration<TMeta> | undefined
  scanAll(
    predicate: (slot: SlotRegistration<TMeta>) => boolean,
  ): SlotRegistration<TMeta>[]
  getAll(): SlotRegistration<TMeta>[]
  subscribe(listener: () => void): () => void
}

function createSlotCacheKey(slots: SlotRegistration[]): string

function transformSlotElements<TProps extends Record<string, unknown>>(
  slots: SlotRegistration[],
  createProps: (slot: SlotRegistration) => TProps,
): Array<React.ReactElement<TProps>>

interface UseSlotRegistrationOptions<TMeta = unknown> {
  slotId: string
  element: React.ReactElement
  meta?: TMeta
  visibility?: SlotVisibility
}

function createSlotRootContext<TMeta = unknown>(): {
  Provider: React.ComponentType<{
    children?: React.ReactNode
    root?: SlotRoot<TMeta>
  }>
  useRoot(): SlotRoot<TMeta>
  useSlotRegistration(
    options: UseSlotRegistrationOptions<TMeta>,
    deps?: React.DependencyList,
  ): void
  useScanById(slotId: string): SlotRegistration<TMeta> | undefined
  useGetAll(): SlotRegistration<TMeta>[]
}
```

Slot renders no node. There is no `<Slot>` host and no default singleton
root. Call `createSlotRootContext` once per compound component at module
scope.

`SlotRoot` keys entries by registration id, not slot id. The same slot id
may have several registrations. Re-registering an existing registration id
replaces that entry. `scanById` returns the **first** exact match, or
`undefined`. `scanAll` returns every predicate match in registration
order. `getAll` returns every entry; array identity is stable while the
set is unchanged.

`resolveSlotVisibility`: omitted `visible` is true, omitted `hidden` is
false. `hidden: true` → `"hidden"` (`display: none`, state kept) and wins
when both flags would hide. `visible: false` → `"unmounted"`. Otherwise
`"visible"`. The host decides; hidden does not unregister.

`createSlotCacheKey` and `transformSlotElements` are host helpers.
Scan/get do not clone on read.

Omitted `useSlotRegistration` `deps` is `[]`. `useRoot` /
`useSlotRegistration` / `useScanById` / `useGetAll` throw outside the
provider.

---

## Problems we own

**Vendor.** `vendor/design-system/page-layout/slots` — lift the **API**
(`SlotRoot`, `createSlotRootContext`, `resolveSlotVisibility`,
`createSlotCacheKey`, `transformSlotElements`) and the live-content
registration contract. **Leave** PageLayout, sidebars,
`getRegisteredSlots`, product part wrappers, and the hand-rolled listener
set. The store is Zustand ([hooks.md](../../core/hooks/hooks.md)).
Consumers never import it. `element` is not store state.

### Registration is not asChild merge

Radix Slot merges props onto one child. That is
`ReferenceSlotPartProps` in [components.md](../components.md)
(FocusLock, RovingFocus, Tooltip.Trigger).

**Leave** Radix Slot, `asChild`, a public `Slottable`, and passing
`{ title, actions }` into the host by hand.

### Live content, structural version

A new React element is created every render. Re-registering on `element`
is pointless (the getter is already live) and recreates a
register → re-render → register loop.

`useSlotRegistration` keeps one registration object per instance whose
`element` / `meta` / `visibility` / `slotId` are live getters. Content is
not a registration dependency. The same `MyComponentTitle` staying
mounted while its children change updates the host without a `key`
remount.

Version bumps only for the **set**: presence, `slotId`, and `deps`.
Visibility flags belong in `deps` — a fresh `visibility` object each
render is not a signal.

**Vendor.** `slots/core/react.tsx` snapshots the closure, so content goes
stale. Live getters live only in the PageLayout wrapper hook. **Lift**
that contract into the kernel. **Leave** a second, weaker core hook.

### In-place re-register, not unregister → register

A `slotId` / `deps` change overwrites the same registration id.
Unregister runs only when the filler unmounts. A visibility toggle must
not transiently remove the entry, so a `hidden` subtree can stay mounted.

**Vendor.** PageLayout splits register and unregister effects.
Region-visibility tests spy the pair on toggle. **Lift** the split.
**Leave** PageLayout region chrome.

### Sibling consume, not Portal

The filling part does not mount the slotted element. The host does. The
element's React parent is the host, so call-site context does not flow
in unless provided above the host or wrapped inside the registered
element.

**Leave** Portal-into-a-named-host as this primitive. Portal still owns
DOM relocation that keeps the React tree with the filler.

### Provider is the root boundary

Context is allowed here as genuine subtree scoping: which compound tree
owns which registrations. `createSlotRootContext` is a factory so two
`MyComponent` trees do not share a registry. Nested providers shadow.
A custom `root` is captured once.

**Leave** a document-global default root.

### Visibility vs unregister

`visible: false` omits the region; the filler stays registered. Unmount
of the filler unregisters. `hidden: true` keeps the region mounted and
visually hidden so internal state survives.

### Foundational robustness

Every declarative part API depends on this. Own edges the vendor tests
skip: missing `unregister` is a silent no-op; one throwing subscriber
does not skip the rest; `getAll` / `scanById` identity is stable across
live content writes; StrictMode replay does not leak; owned adapters run
on React 17.

---

## Convergence

Primary: `slots/core` **API** plus the PageLayout hook's **live-getter /
in-place register** contract, on Zustand.

| Piece | Own | Leave |
| --- | --- | --- |
| Registry | `SlotRoot` over a per-instance Zustand store | Listener `Set`; store keyed on `element` |
| Fill | Kernel `useSlotRegistration` (live getters, `deps`) | PageLayout wrapper as the only live path |
| Read | `scanById` (first match) / `scanAll` / `getAll` | `getRegisteredSlots`, sidebar pipelines |
| Content | Ref getters, no version bump | Re-register on element identity |
| Visibility | In-place `register`; unregister only on unmount | Unregister → register churn |
| Merge onto a child | `ReferenceSlotPartProps` | Radix Slot as this component |
| DOM relocate | `Portal` | Slot as a named portal target |

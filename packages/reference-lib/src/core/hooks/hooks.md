# Hooks

Zustand is the standard substrate for shared state and capabilities that
would otherwise require React Context.

It is a **direct third-party dependency** of `@reference-ui/lib`. Do not
vendor, port, or reimplement it. Adapter hooks live in this directory and
integrate Zustand deeply: store creation, selector subscriptions, lifecycle,
and isolation. See
[components.md](../../components/components.md).

Signals-plus-React is not this layer's runtime. React is not built for that
model.

## What is public

Stores stay internal. Consumers never import `zustand`, a store factory, or a
generic `useStore`.

Reference-owned, domain-specific hooks and actions are the public seam when
a component needs them (`toast.show`, `announce`, and any hook named in that
component's spec). Compound anatomy stays visible JSX plus props. Do not add
a hook that only exists to leak the store.

## Provider-free by default

Prefer Zustand for:

- cross-tree coordination (Overlay layer stack, Toast queue, Tooltip skip-delay)
- selectors over shared owner state
- imperative access that must work before a React subtree mounts
  (`toast.show` before `ReferenceLibrary`)

Applications are not required to wrap trees in `*.Provider`.
`ReferenceLibrary` remains a document-scoped mount, not a context boundary.
Overlay, Popover, and Menu work as siblings of it.

## When React Context is allowed

Use native React Context **only** where genuine subtree scoping or
dependency injection requires it: a `Listbox.Option` finding *this* Listbox,
a `Menu.Item` finding *this* Menu. That context, if present, is an internal
implementation detail. It is not a public Provider API and not the store.

Do not use Context for document-level runtimes, toast, announce, or layer
ordering. Those are Zustand stores keyed by `Document` (with an explicit
`document` option when more than one is eligible).

## Implementation spec (every owner)

When planning a component's implementation, its spec documents:

1. **Store shape** — what the internal Zustand store holds, and what remains
   controlled props.
2. **Actions** — named mutations and the public callbacks they request.
3. **Selectors** — what parts subscribe to, so updates stay narrow.
4. **Hooks** — adapters in this directory and any public domain hook.
5. **Lifecycle** — create, subscribe, teardown, StrictMode replay, Presence
   overlap.
6. **Isolation** — two instances on one page do not share owner state.
7. **Multi-root / MFE** — two React roots, two library copies, and two
   `Document`s: which store is per-instance, which is per-document, and how
   failover works (`ReferenceLibrary` earliest-live host).

Rejected controlled props stay authoritative. A store must not smuggle
uncontrolled public state.

## Kit

Version-independent adapters around Zustand and the DOM, not a second state
library. Keep them unexported except where a component spec names a public
domain hook.

- store create / dispose for a component instance
- selector subscribe that survives StrictMode replay
- document-scoped store lookup (Toast, layer stack, skip-delay)
- id, SSR-safe layout, composed ref

Do not take Zustand's React bindings as a public contract. Do not depend on
React 18-only hooks (`useId`, `useSyncExternalStore`, `useInsertionEffect`)
without an owned adapter that also runs on React 17.

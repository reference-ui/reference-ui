# Slot features (needs design)

Deferred Slot items that change or add API surface. Each entry: what it
does, a concrete API sketch, and a one-line maintainer take. Source
decisions stay in [DECISIONS.md](./DECISIONS.md).

No open items. The one deferred item shipped with the reactive API
redesign (see below).

## Shipped: reactive `useSlots(filter)` hook (was §1 `useScanAll`)

**What it does:** Gives compound hosts a reactive prefix/kind selection over
registered parts. The CT host previously hand-rolled an imperative
`root.select(...)` inside render and only stayed fresh because sibling
`useSlots`/`useSlot` subscriptions re-rendered the host; `SL-COMP-03` now
pins the reactive hook behind prefix-region selection.

**API:**

```tsx
// On the Slot context object, alongside useSlot / useSlots:
useSlots(filter?: (slot: SlotRegistration<TMeta>) => boolean): SlotRegistration<TMeta>[]
```

`useSyncExternalStore`-backed like its siblings, with a stable result
array while the match set is unchanged. The three design calls resolved:
filter identity (inline closures supported via a latest-filter ref — no
`useCallback`, no resubscribe cost since the subscription is
version-based), snapshot selector shape (one external store; the no-filter
path snapshots `root.getAll()`, the filtered path selects inside
`getSnapshot`), and result identity (element-wise match-set comparison —
the `SL-READ-07` analog, pinned by `SL-READ-11`, with `SL-READ-08`–`10`
and `SL-READ-12` covering order, emptiness, updates, and inline filters).

**Maintainer take:** Shipped as the `useSlots(filter)` overload instead of a
third hook — one selection hook, optional filter, per the HQ no-`scan`
redesign.

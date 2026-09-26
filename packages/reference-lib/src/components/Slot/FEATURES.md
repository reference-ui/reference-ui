# Slot features (needs design)

Deferred Slot items that change or add API surface. Each entry: what it
does, a concrete API sketch, and a one-line maintainer take. Source
decisions stay in [DECISIONS.md](./DECISIONS.md).

## 1. Reactive `useScanAll(predicate)` hook (from DECISIONS gap #1)

**What it does:** Gives compound hosts a reactive prefix/kind scan over
registered parts. Today the CT host hand-rolls an imperative
`root.scanAll(...)` inside render (`Slot.story.tsx:193`) and only stays
fresh because sibling `useGetAll`/`useScanById` subscriptions re-render
the host; `SL-COMP-03` pins prefix-region scanning with no reactive hook
behind it.

**API:**

```tsx
// On the Slot context object, alongside useScanById / useGetAll:
useScanAll(predicate: (slot: SlotRegistration) => boolean): SlotRegistration[]
```

`useSyncExternalStore`-backed like its siblings, with a stable result
array while the match set is unchanged. Open design calls: predicate
identity semantics (inline closure vs `useCallback` resubscribe cost),
snapshot selector shape under `useSyncExternalStore`, and whether the
result array must hold identity across unrelated registrations (an
`SL-READ-07` analog).

**Maintainer take:** Good to add once a second compound host needs
reactive prefix/kind scans — until then the imperative call plus sibling
subscriptions suffice.

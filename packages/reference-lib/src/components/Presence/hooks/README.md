# hooks

The React half of Presence: three hooks returning data, handlers, and refs,
never JSX. `usePresence` is the exit-lifecycle kernel — the state machine,
the exit-start verdict, and the completion wiring — delegating every
decidable piece to the `exit/`, `nesting/`, and `coordination/` domains.
`usePresenceCoordinator` wraps the sibling-part ledger for Overlay, and
`useStableComposedRefs` fans the observer ref and the consumer ref out to
the child through one never-changing callback.

# registry

The store half of the Slot kernel. This module owns the entry map, the
structural version, the cached list, and subscriber delivery — everything
`SlotRoot` promises about identity and ordering.

Keying by registration id instead of slot id is what makes duplicate
regions possible: several fillers may claim the same slot id, and the
first exact match wins a `getById` read. The version counts structural
set changes only, so version-based `useSyncExternalStore` subscriptions
in `hooks/` stay quiet while live content flows through getters. Reads
never clone; the one cached array is rebuilt only on a dirty write,
which is the identity contract the snapshot tests pin.

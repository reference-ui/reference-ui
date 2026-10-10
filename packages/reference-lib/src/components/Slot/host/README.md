# host

Helpers for the compound component that reads the registry back. Hosts
own layout — which regions render, in what order, with what decoration —
and this module carries the two pure operations hosts need for that:
reducing a slot set to an order-free cache key for memoization, and
cloning registered elements with host-supplied props layered over the
originals.

Both helpers are deliberately ignorant of React context and the store.
They take plain slot arrays, so a host can call them inside render,
inside `useMemo`, or in tests without mounting anything.

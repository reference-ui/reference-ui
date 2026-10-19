# Tabs

Optional-value tabset: `value` omitted means self-managed from the
first enabled tab, `value` given means controlled, and `onChange` fires
on user-driven selection changes in both modes. Selection, focus, and
the RovingFocus tab stop move together in automatic mode; manual mode
lets arrows rove while only explicit activation selects.

Contract: [Tabs.md](./Tabs.md). Features: [FEATURES.md](./FEATURES.md).
Cases: [TESTS.md](./TESTS.md).

The root is composition only: hooks own the identity registry, tab
ordering, value state, structural diagnostics, and the two focus trails
(rescue, handoff), while the JSX is a context provider over children.
Beneath it the tabset splits by job. Parts render the tablist, tab, and
panel plus the null-rendering selection sync the kernel cannot infer.
Recipes hold the prepackaged line/pill system styles. The registry
kernel answers nearest-enabled and document order as pure functions.
Focus holds the shadow-aware active-element lookup and the editable
guards. Shared holds the isomorphic layout effect and the dev
diagnostic. Examples carries the userland system-variant demo. Pure
decisions carry colocated unit tests; mounted behavior proves out in
colocated Vitest and CT.

Up: [Components](../components.md).

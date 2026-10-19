# Field

A status-carrying host for form controls: one `Div` with `data-reference-field`
and an optional warning `data-status`, while the role and validity ARIA stay
off the host no matter who sends them. The root is composition only — strip
the prohibited surface, spread the rest, pin the data attributes after so
they cannot be overridden.

Contract: the Field contract. Cases: the Field test catalog.

The prohibited surface lives in two places that must agree: `types`
omits the six keys from the public props, and `shared/` strips them at
runtime for the JS callers the type cannot stop. The strip is a pure,
unit-tested function; browser behavior proves out in CT.

There is no `context` — with no compound parts, there is no subtree to
scope — and no `parts/` or `hooks/`: the single transparent rendering is
owned by the root. External consumers (Combobox, Tree, Icon) import the
index only.

Up: components.

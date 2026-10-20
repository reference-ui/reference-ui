# Switch

A labeled on/off track that always renders exactly one thumb: the caller's
when one is authored, the default knob otherwise. The root is composition
only — checked state and thumb presence come from the hooks, the host node
fans into the internal handle plus the forwarded ref, and one `Button`
carries the managed switch role, `aria-checked`, and state markers that
consumer props can never override.

Contract: the Switch contract. Cases: the Switch test catalog.

Beneath the root, each problem owns a folder. `hooks/` resolves the
controlled/uncontrolled split and tracks thumb presence; `thumb/` answers
whether a thumb was authored, seeded statically and repaired structurally;
`parts/` paints the knob both shapes share; `context` wires the resolved
state to every thumb without prop drilling; `shared/` holds the nameless
ref and effect plumbing all of them ask. Pure decisions carry colocated
unit tests; browser behavior proves out in CT.

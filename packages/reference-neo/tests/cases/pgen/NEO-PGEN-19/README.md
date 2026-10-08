# NEO-PGEN-19 — per-tag host types resolve, and the bare generic plus cross-host refs fail.

Per-tag host types resolve against the vendored E4 including the caption and
menu overrides, and the PrimitiveProps generic takes its tag argument. The
bare generic fails with TS2314 per the TYPE-07 precedent, and a div host ref
assigned to an input ref position fails with TS2322. Related: NEO-PGEN-20
(the forbidden-surface twin), NEO-TYPE-07 (the arity precedent).

The ref probe direction is load-bearing and pinned by a comment in the spec:
lib.dom types HTMLInputElement as a structural subtype of HTMLDivElement, so
only the div-into-input assignment fails. If a future lib.dom revision flips
that subtyping, this negative goes green-on-its-own and the case fails — the
right alarm, pointing at the probe pair to re-pick.

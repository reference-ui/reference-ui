# CORE-LAYERS — visual-only upstream systems

Proves the `layers` contract: a `layers` entry is a real published base
system, and only its `streams` join the cascade — no fragments, no
roster, no types. Every case syncs its upstreams for real because a
stand-in has no `streams`; computed style and the served sheet are the
oracle, with sheet text pinned beside the paint and never alone.

Authors write `layers: [system]` beside `extends`. The merge runs in
bucket order, extends then layers, with the own entry last, and each
upstream block is reprinted portable, resetless and rootless, so its
tokens sit under `[data-layer="<name>"]`. Upstream names feed the
compile request as qualifiers, extends then layers. Validation checks
each field in full: synced data on every entry, streams on every layers
entry, no entry reaching the config's own name, no repeat within one
field — and once both fields pass, no system named in both. A layer-only
token is a warning, not a failure: a consumer `css()` naming a token
only a layers upstream defines warns `ATM-W-UNKNOWN-COLOR` at the call
and emits the raw declaration, which the browser drops
(CORE-LAYERS-02). A diamond's shared upstream prints its block once, at
its first position in the expansion (CORE-LAYERS-11). `extendSystem` is
the intentional theming path for a layered system, tokens only in v1:
recipes and `globalCss` are not overridden (CORE-LAYERS-17,
CORE-LAYERS-18).

E9 (a system in both `extends` and `layers` is rejected) is pending its
case, being added to CORE-LAYERS-03 or CORE-LAYERS-14. The load-time
named rejection is pinned by CORE-LAYERS-14 through a real `ref sync`.
BAS-LAYER-01..04 are
not proven here: their rule needs passing `base_system` unit tests, and
that module has no layers input yet. Matrix `chain-t2` and `chain-t8`
remain secondary proof for bundler and runtime spread; these cases are
the primary layers proof.

`shared/` holds the sync-and-wire helper the real-upstream cases share.
The contract lives here; the cases below are the ledger.

> Search terms: layers, visual-only upstreams, streams, bucket order, portable reprint, data-layer qualifiers, layer-only token warning, extendSystem

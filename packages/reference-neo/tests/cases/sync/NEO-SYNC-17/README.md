# NEO-SYNC-17 — extends strips upstream _private at merge; own _private still paints

Evidence: `src/fragments/api/tokens.ts` header contract (`_private` "stripped
from any downstream consumer that pulls in the package via `extends`"),
RS BAS-EXTEND-03/05 (engine-side strip at the multi-spec boundary),
sibling NEO-SYNC-10 (extends adoption baseline — its pins must not move)
and NEO-TOKEN-09 (owner `_private` passthrough guardrail).

The runner syncs this two-system world fresh: the named upstream defines a
public token plus `colors._private.upstreamSecret` and a top-level
`_private.vault` category, while the downstream defines its own
`colors._private.ownSecret`. The spec asserts the boundary five ways: (a)
`evaluated-system.json` tokens carry no upstream `_private` at any depth;
(b) provenance advertises no upstream private path; (c) the upstream public
token paints; (d) the downstream's own `_private` is kept and paints; (e)
the generated `.d.ts` lacks the upstream private path but keeps the own
one. Neo evaluates upstream bundles in the same script as local ones, so
the strip happens TS-side at merge time in `fragments/base` — the Rust
multi-spec boundary never sees two specs on this path.

> Search terms: extends, private, encapsulation, upstream strip, _private, package-private, hidden, merge boundary, NEO-SYNC-10, NEO-TOKEN-09

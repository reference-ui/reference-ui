# CORE-CHAIN — multi-package extends topologies

Proves the extends side in the fast loop: transitive adoption, diamonds,
parallel chains, parallel direct upstreams with declared-order
arbitration, and depth-three flattening. Every case is a small
multi-system world whose app holds no local tokens, so each painted probe
proves adoption through the `extends` entries alone. Computed style is
the oracle everywhere; sheet text and merged artifacts pin alongside,
never alone.

Authors write `extends: [systems]`, each entry the published
`baseSystem` shape (`name`, bundled `fragment` string, named `fragments`
list, `jsxElements`). Upstream fragment nodes evaluate in linearized
order, each name at its first occurrence, then local bundles. A later
token leaf replaces an earlier one whole; upstream `_private` subtrees
strip at the boundary. Transitive middles republish flattened: the outer
fragment carries the inner base first and outer-local leaves second.
CORE-CHAIN-06, -08, -09, -10, and -14 to -17 sync a genuine upstream
package mid-run instead of standing one in, so the publish/consume shape
agreement is proven — stand-ins once let the publisher drift silently.
Where a case styles a package's components, the package is installed for
the run the way a workspace install leaves it and removed in the spec's
`finally`; the app's sync decides which system renders a tag from the
directory its import lands in, so a package reachable only through a
browser importmap lowers nothing.

Decisions: republish-via-fragment-string is the port's core move — matrix
tiers consume built fixture packages while these cases inline the
equivalent published fragment text. The behaviors ported are adoption,
resolution, and order, not the install graph, which stays matrix's job in
the kept chain gate. Declared extends order ports as its merge
consequence (later entry wins the shared leaf) because Core emits no
per-upstream `@layer` prelude; the T9 prelude-order extends half is that
consequence, nothing more.

Homes elsewhere: the `layers` legs live with the layers group
(CORE-LAYERS-01 and -03 for paint and order, CORE-LAYERS-02 for the
visual-only boundary); T8's same-library-both-buckets policy is not this
group's (T8 stays kept); hybrid both-buckets coexistence is homed at
CORE-LAYERS-01; the single-hop adopt stays homed at CORE-SYNC-10, which
this group builds on.

`shared/` holds the sync-and-wire helper the genuine-upstream cases
share. The contract lives here; the cases below are the ledger.

> Search terms: extends, transitive adoption, diamonds, parallel chains, declared-order arbitration, fragment string, republish, private boundary, genuine upstream, importmap

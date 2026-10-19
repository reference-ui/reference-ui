# CHAIN — multi-package extends topologies

This group proves the extends side of the chain contract in Core's fast loop:
transitive adoption, diamonds, parallel chains, parallel direct upstreams
with declared-order arbitration, and depth-three flattening. Every case is a
small multi-system world whose app holds no local tokens, so each painted
probe proves adoption through the `extends` entries alone. Computed style is
the oracle everywhere; sheet text and merged artifacts pin alongside, never
alone.

## Dialect

Authors write `extends: [systems]` in `ui.config.ts`, where each entry is a
`BaseSystem` — the shape a published package's `baseSystem.mjs` carries
(`name`, the bundled `fragment` string, the named `fragments` list, `jsxElements`).
Upstream fragment nodes evaluate in linearized order, each name at its first
occurrence, then local bundles. A later token leaf replaces an earlier one whole,
and later groups merge (`src/collect/lib/merge.ts`); upstream `_private` subtrees
strip at the boundary. Worlds stand in for installed packages with
import-free `theme/*.ts` objects in exactly that shape — the config data,
not fragments to scan. Transitive middles republish: the outer fragment
carries the inner base first and outer-local leaves second, the flattened
bundle order a real publish produces. The exceptions are CORE-CHAIN-06,
CORE-CHAIN-08, CORE-CHAIN-09, CORE-CHAIN-10 and CORE-CHAIN-14 to CORE-CHAIN-17:
each syncs a genuine upstream package mid-run and composes the artifact on disk, so the publish/consume
shape agreement is proven, not assumed — stand-ins alone once let the
publisher drift silently.

Where a case styles a package's components (CORE-CHAIN-08, CORE-CHAIN-15 to
CORE-CHAIN-17), the package is installed for the run: linked into
`world/node_modules` the way a workspace install leaves it (copied, for a
registry install), and removed in the spec's `finally`. The app's sync decides
which system renders a tag from the directory its import lands in, so a
package reachable only through a browser importmap is invisible to it and
lowers nothing. The page loads the package through the same install; an
importmap scope resolves a package's own `@reference-ui/react` to its own
bound runtime, the shape a published dist ships. Worlds keep an ambient
`.d.ts` for each installed package, since the typecheck runs before the spec
installs it.

## Decisions

Republish-via-fragment-string is the port's core move: matrix tiers consume
built fixture packages over `workspace:*`, while Core cases inline the
equivalent published fragment text. The behaviors ported are adoption,
resolution, and order — not the install graph, which stays matrix's job in
the kept chain gate. Declared extends order ports as its merge consequence
(later entry wins the shared leaf) because Core emits no per-upstream
`@layer` prelude; the build wraps in the single app package layer. The T9
prelude-order extends half is that consequence, nothing more.

## Out of scope

`layers:` is wired (D17: validated, merged after `extends`), and Core now proves
its legs in `tests/cases/layers`: CORE-LAYERS-01 and -03 for the T2/T8 paint and
order legs, CORE-LAYERS-02 for the visual-only boundary, and CORE-LAYERS-03 for
several layers in config order (T5). Matrix `chain-t2`/`chain-t8` stay KEPT as
secondary proof for bundler and runtime spread on real packages, no longer the
only proof (H3). The T5 parallel-layers suggestion made alongside depth-three
is refused here for the same scope reason. T8's
same-library-both-buckets policy is not this group's (H4; T8 stays KEEP).
CORE-LAYERS-03 pins the both-buckets duplicate behaviour (statement once, block
twice) as current behaviour, not endorsed. Hybrid both-buckets-at-once
coexistence is homed in `tests/cases/layers` (CORE-LAYERS-01), so it is no
longer an open follow-up here. The single-hop adopt stays homed at CORE-SYNC-10,
which this group builds on.

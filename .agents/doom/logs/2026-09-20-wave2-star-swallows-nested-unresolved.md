---
date: 2026-09-20
cycle: wave2
module: module-graph/walk/star
theories_spent: 1
verdict: break-found
---

# Star lookup swallows a nested unresolvable hop

## Hypothesis

Gap: `BindingWalk::poll_star` (`src/walk/star.rs`) skips every
`MissingExport` and `Unresolved` from any depth, but the pin it cites
("missing targets simply do not declare the name") covers only star
targets that fail to resolve or load — those already return `None`
from `star_candidate`. A broken re-export hop *inside* a resolvable
star target is neither a missing target nor a miss: ESM fails the
whole link naming that hop, and the walk itself reports `Unresolved`
for the identical edge on the direct path. Red test
(`star_lookup_surfaces_the_nested_unresolvable_hop`): world `app →
barrel → *lib`, `lib = export { x } from './typo'` (unresolvable);
barreled lookup of `x` owes `Unresolved{lib, ./typo}`. It returns
`MissingExport{barrel, x}` instead. Controls (both green): the direct
`app2 → lib` import of the same edge is `Unresolved{lib, ./typo}`,
and `exported_names(barrel)` lists `x` with zero refused — lookup
refuses as missing a name enumeration promises. Doom log was thin at
consult (one module-graph entry: the 09-19 cross-walk memo poison —
a different root cause; this hunt spent nothing on memo ground).
Unspent, seen in research: tsconfig-`paths` / exports-`*` precedence
follows serde `Map` iteration order (alphabetical isolated, authored
under workspace `preserve_order` unification); within-one-walk memo
replay of guard-short-circuited star branches.

## Verdict

`break-found`. Repro: `/tmp/doom-wave2-modulegraph-t1` — run
`cargo test --offline` there (1 red, 2 green controls; path-dep on
the tree, same-machine blind). Violated contract: Forge R-B3
(`docs/missions/completed/operation-forge.md`) — the walk returns
`Refused` for the unresolvable specifier, never a stale answer —
plus the walk's own coherence: `walk_refused.rs` ("silence is not an
outcome"), `enumeration_reports_unresolvable_stars_as_data`
(enumeration surfaces what lookup swallows), and the direct path
pinning `Unresolved` for this exact edge
(`unresolvable_specifiers_refuse_as_unresolved`). Severity:
user-facing misdiagnosis — atomic words the two refusals
differently (`values.rs::edge_reason`: "unresolvable import
'./typo'" vs "no export 'x' from './barrel'"), so the barreled author
hunts the barrel instead of the broken hop.

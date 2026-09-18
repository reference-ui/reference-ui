# NEO-SITE-27 — A param shadows the cross-file `const` it names

The world keeps `export const color = 'cherry'` in `src/styles.ts` while
the entry styles one node through `function Card({ color })` and a twin
through the unshadowed `accent` binding. The spec asserts the shadowed
node paints nothing (no utility, one located warning via the frozen
recompile) while the twin paints ocean — so an identifier resolves
through its binding, never through a project-wide name bag.

Evidence: `[atm]` ATM-SITE-53 (scope-aware identifier resolution);
`[overmatch]` SPEC-V2-75; `[panda-v2]`
`vendor/panda/crates/pandacss_extractor/tests/scope.rs:1349`, `:1369`
(inner scope shadows outer).

> Search terms: shadowing, param shadows const, scope chain, binding, cross-file collision, site/scope, NEO-SITE-06, NEO-SITE-07

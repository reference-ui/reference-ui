# CORE-SITE-27 — A param shadows the cross-file `const` it names

The world keeps `export const color = 'cherry'` in a styles fixture while
the entry styles one node through `function Card({ color })` and a twin
through the unshadowed `accent` binding. The spec asserts the shadowed
node paints nothing (no utility, one located warning via the frozen
recompile) while the twin paints ocean — so an identifier resolves
through its binding, never through a project-wide name bag.

Evidence: ATM-SITE-53 (scope-aware identifier resolution); Panda v2 scope tests
(inner scope shadows outer).

> Search terms: shadowing, param shadows const, scope chain, binding, cross-file collision, site/scope, CORE-SITE-06, CORE-SITE-07

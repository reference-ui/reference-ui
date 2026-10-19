# CORE-SYNC-10 — extends adopts upstream tokens, recipes resolve, jsxElements merge, later fragment wins

Evidence: Panda v1 config merge tests (contrast: Panda merges preset/config `theme.extend` trees; Core evaluates upstream fragment bundles first and local bundles after, later-wins), the Core merge coverage, RS-4 BAS-EXTEND-01..05 (engine-side adoption semantics, 12/12 green).

The runner syncs this two-system world fresh, then the spec asserts the
merge paints: an upstream-only token colors one probe, a locally overridden
leaf paints the local value on another (upstream bundles evaluate first, so
the local fragment wins), and a locally authored `recipe()` over the
upstream token paints a third. Node-side, the evaluated-system snapshot pins the
merged tokens and the JSX-elements snapshot pins upstream-plus-local hosts. Two
scoping notes: "arrays replace" is proven at the unit level only
(the merge coverage), because the token grammar admits no arrays — an
array-valued leaf fails the engine with `invalid token leaf` before any
merge could be observed; and upstream-authored `recipe()` definitions are
not carried by extends fragments (no recipe collector — recipes are
source-authored per project and extracted locally), so the recipe leg proves
a local recipe resolving against adopted upstream tokens.

> Search terms: inheritance, override, layering, multi-system, local wins, child overrides parent, sync/extends, sync/fragment-merge, CORE-SYNC-08

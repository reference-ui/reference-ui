# NEO-SYNC-10 — extends adopts upstream tokens, recipes resolve, jsxElements merge, later fragment wins

Evidence: `[panda-v1]` `config/__tests__/merge-config.test.ts` (contrast: Panda merges preset/config `theme.extend` trees; Neo evaluates upstream fragment bundles first and local bundles after, later-wins), Neo `src/fragments/base/merge.test.ts`, RS-4 BAS-EXTEND-01..05 (engine-side adoption semantics, 12/12 green).

The runner syncs this two-system world fresh, then the spec asserts the
merge paints: an upstream-only token colors one probe, a locally overridden
leaf paints the local value on another (upstream bundles evaluate first, so
the local fragment wins), and a locally authored `recipe()` over the
upstream token paints a third. Node-side, `evaluated-system.json` pins the
merged tokens and `jsx-elements.json` pins upstream-plus-local hosts. Two
scoping notes: "arrays replace" is proven at the unit level only
(`merge.test.ts`), because the token grammar admits no arrays — an
array-valued leaf fails the engine with `invalid token leaf` before any
merge could be observed; and upstream-authored `recipe()` definitions are
not carried by extends fragments (no recipe collector — recipes are
source-authored per project and extracted locally), so the recipe leg proves
a local recipe resolving against adopted upstream tokens.

> Search terms: inheritance, override, layering, multi-system, local wins, child overrides parent, sync/extends, sync/fragment-merge, NEO-SYNC-08

# NEO-PGEN-22 — the bound per-system entry narrows: system tokens assign, foreign tokens fail TS2322.

This world's consumer imports the bound `react.d.mts` (TYPE-01 pattern: the
world tsconfig maps `@reference-ui/react` at the generated entry, never the
vendored E4), and proves the W4 bake narrowed rather than widened. System
literals assign at the `ColorToken` position and at the style-props color
position; `StylePropName` is the exact compiled union (a member assigns, and
it is neither `never` nor `string`); a narrowed `css` object assigns, and a
string variant assigns at the open per-tag position. Four negatives go red
in temp dirs: a foreign-system token (`accent`, a live color leaf of
NEO-COND-07's world, unknown here) fails TS2322 at the `ColorToken`
position, a bogus prop name fails TS2322 at the `StylePropName` position, a
bogus key inside `css` fails TS2353, and a variant selection object fails
TS2322 at the exported `PrimitiveVariantProp` alias, which this recipe-less
world bakes as `never`. Per-tag `variant` stays open (`unknown`) so
user-space spreads compile; precision lives at the alias. Related: NEO-TYPE-01
(the bound-entry consumer pattern), NEO-TYPE-02 (the ColorToken precedent),
NEO-PGEN-16 (the E4 token positions this bake narrows per system),
NEO-PGEN-15 and NEO-PGEN-17 (whose open css/variant probes flip onto this
narrowed surface in S5).

The bake shape under test: `StylePropName` is the compiled list verbatim
(the splitter's list), `PrimitiveCssProp` is `SystemStyleObject`, per-tag
`variant` stays open as `unknown`, the exported `PrimitiveVariantProp`
alias is the union of this system's typegen recipe aliases (`never` here),
and `PrimitiveProps<T>` reuses the E4 text verbatim. Nothing red
lives in the repo: every consumer is materialized into a temp dir at spec
time, since the harness pre-run typecheck resolves the react specifier to
the stable surface.

# NEO-TYPE-07 — styled subpaths and generic PrimitiveProps resolve

After `sync()`, the styled leg publishes the root entry plus the tokens and
classic types modules (`index.d.ts`, `tokens.d.ts`, `types/conditions.d.ts`,
`types/prop-type.d.ts`, `types/style-props.d.ts`), every one derived from the
central typegen index, and the react entry declares `PrimitiveProps<T>`
generic over the tag. The proof spec typechecks a temp-dir consumer shaped
exactly like the landing call sites: core's `Tokens['colors']`,
`keyof UtilityValues`, `keyof SystemProperties`, and `keyof Conditions`
usages plus `PrimitiveProps<'button'>` with `Omit` and native props. A
negative file pins the required type argument: bare `PrimitiveProps` is
TS2314, matching core's contract.

The world is the TYPE-01 token set; the spec also asserts the brand probe
paints. No engine rung beyond the publish leg (`writeStyledSubpathDecls` in
`sync/publish/types-bundle.ts` plus the generic in the react named graph);
no host change was needed.

Evidence: landing C1 chart A5 (type graph status).

> Search terms: package exports, polymorphic, submodules, type/styled-subpaths, type/negative-typecheck, NEO-TYPE-01, NEO-TYPE-06

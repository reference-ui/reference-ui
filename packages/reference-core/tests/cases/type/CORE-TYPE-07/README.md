# CORE-TYPE-07 — styled subpaths and generic PrimitiveProps resolve

After `sync()`, the styled leg publishes the root entry plus the tokens and
classic types modules (the index, tokens and conditions declarations,
the prop-type declarations, the style-props declarations), every one derived from the
central typegen index, and the react entry declares `PrimitiveProps<T>`
generic over the tag. The proof spec typechecks a temp-dir consumer shaped
exactly like the landing call sites: the retired reference-core's `Tokens['colors']`,
`keyof UtilityValues`, `keyof SystemProperties`, and `keyof Conditions`
usages plus `PrimitiveProps<'button'>` with `Omit` and native props. A
negative file pins the required type argument: bare `PrimitiveProps` is
TS2314, matching the retired reference-core's contract.

The world is the TYPE-01 token set; the spec also asserts the brand probe
paints. No engine rung beyond the publish leg (`writeStyledSubpathDecls` in
the types bundler plus the generic in the react named graph);
no host change was needed.

Evidence: landing C1 chart A5 (type graph status).

> Search terms: package exports, polymorphic, submodules, type/styled-subpaths, type/negative-typecheck, CORE-TYPE-01, CORE-TYPE-06

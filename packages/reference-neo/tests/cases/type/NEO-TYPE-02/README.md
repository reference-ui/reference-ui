# NEO-TYPE-02 — token unions are real at ColorToken positions

After `sync()`, a known literal assigns at a `ColorToken`-typed position and
`'nope'` there is TS2322, while default-open `StyleProps` still accept an
arbitrary color string through the `(string & {})` hatch. The world is the
TYPE-01 token set (brand/ink/paper, sm/lg, radii); the spec pins the committed
`paths` mapping, typechecks a positive and a negative temp consumer against
the generated declarations, and asserts the brand probe paints.

The consumers are materialized at spec time because they cannot live in the
repo: the harness pre-run typecheck resolves `@reference-ui/react` to the
stable surface, whose wide `StyleProps` would accept the negative. R1 verified
the engine (`emitDtsSync` over this world's spec) prints
`ColorToken = 'brand' | 'ink' | 'paper'` with the open hatch and no strict
wrappers; no host change was needed.

Evidence: `[panda-v1]` `generate-token-dts.test.ts`; typegen golden
`tokens.d.ts`; TYP-STRICT-04.

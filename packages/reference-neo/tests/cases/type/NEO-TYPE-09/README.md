# NEO-TYPE-09 — strict colours reject off-token values on JSX, css() and the css prop

With `strict: ['colors']` in ui.config, sync narrows every colour position of
the generated declarations to one surface: `ColorToken`, the toned
`ColorToken/ToneToken` pairs, and the keywords `white`, `black`, `inherit`,
`currentColor` and `transparent`. The world declares one blue leaf (`blue.500`)
and one tone (`medium`). After `sync()` the spec materializes one positive
consumer and six negatives into temp dirs and typechecks each against the
generated `react.d.mts` and styled types.

The positive file must exit 0: a token, a toned token, the keywords, a
`r={{ '@md': … }}` breakpoint map, and the css() and css-prop call sites all
assign. `width="37px"` rides along free, because only colours narrow. Each
negative carries one off-token colour and must fail at its own consumer line,
naming that value: `blue.500/50` (a raw opacity suffix, not a declared tone),
`not-a-token`, or `#fff`, at a JSX attribute, a css() argument, the css prop,
or a responsive map. The rejection is TS2322 on a JSX attribute, TS2345 on a
css() argument, or TS2820 for a near miss.

The consumers are materialized at spec time because they cannot live in the
repo: the harness pre-run typecheck resolves `@reference-ui/react` to the
stable surface, whose open `StyleProps` accept every one of those values. The
generated `styled/types/index.d.ts` must carry `StrictColorProps<BaseStyleProps>`,
the wrapper that narrows `StyleProps`, and `SystemStyleObject` builds on it, so
the css() and css-prop positions narrow with the JSX props.

Evidence: typegen TYP-STRICT-05 (wrappers compose) and TYP-STRICT-07 (StyleProps
and SystemStyleObject accept tokens, toned colors and keywords, and reject
off-token colors); D17 in `tests/cases/type/SPEC.md`; NEO-TYPE-02 for the open
`ColorToken` position this case narrows.

> Search terms: strict colours, strict colors, off-token, raw opacity, hex colour, css prop, css call, StrictColorProps, type/strict-narrowing, type/negative-typecheck, NEO-TYPE-02, NEO-TYPE-08, TYP-STRICT-07

# CORE-TYPE-04 — condition keys and null-hole arrays typecheck

After `sync()`, `_hover` and the bare breakpoint keys (`md`, `sm: { lg }`,
`mdDown`, `mdOnly`, `smToLg`) nest as `SystemStyleObject` conditions, a
`{ base, md }` object assigns to a property on a style object and on a
primitive's props, and `[null, '4r']` assigns to a spacing prop, while `'@sm'`
is not a known property. The world is the TYPE-01 token set; the spec pins the
committed `paths` mapping, typechecks a positive temp consumer (conditions,
breakpoint objects and ranges, a responsive array with a `null` hole, deep
pseudo/selector nesting) and a negative one (`'@sm'`), and asserts the brand
probe paints.

The consumers are materialized at spec time because they cannot live in the
repo: the harness pre-run typecheck resolves `@reference-ui/react` to the
stable surface, whose wide records would accept the negative. The engine
(`emitDtsSync` over this world's spec) prints `StyleConditionKey` with the
named conditions and `BreakpointKey` with `base`, the scale names and their
ranges, plus `StylePropValue<T> = T | null | false | undefined | Array<T | null>
| keyed map`; no host change is needed. Breakpoints are bare names because the
compiler lowers `md` to `@container (min-width: 768px)` and reads `@md` as a
selector (issue #14).

Evidence: typegen golden `styles.d.ts` (`StylePropValue`, `BreakpointKey`).

> Search terms: breakpoints, responsive, base, ranges, media query, at-rule, placeholder, type/conditions, type/responsive-arrays, CORE-TYPE-01, CORE-COND-01

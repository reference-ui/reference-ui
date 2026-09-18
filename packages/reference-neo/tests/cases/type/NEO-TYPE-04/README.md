# NEO-TYPE-04 — condition keys and null-hole arrays typecheck

After `sync()`, `_hover` and `@sm` nest as `SystemStyleObject` conditions and
`[null, '4r']` assigns to a spacing prop, while bare `sm` is not a known
property. The world is the TYPE-01 token set; the spec pins the committed
`paths` mapping, typechecks a positive temp consumer (conditions, a responsive
array with a `null` hole, deep pseudo/selector nesting) and a negative one
(bare `sm`), and asserts the brand probe paints.

The consumers are materialized at spec time because they cannot live in the
repo: the harness pre-run typecheck resolves `@reference-ui/react` to the
stable surface, whose wide records would accept the negative. R1 verified the
engine (`emitDtsSync` over this world's spec) prints `StyleConditionKey` with
`_hover` and `@sm` but no bare viewport keys, plus
`StylePropValue<T> = T | Array<T | null> | condition map`; no host change was
needed.

Evidence: typegen golden `styles.d.ts` (`StylePropValue`); `[decision D8,D10]`.

> Search terms: breakpoints, media query, at-rule, placeholder, type/conditions, type/responsive-arrays, NEO-TYPE-01, NEO-COND-01

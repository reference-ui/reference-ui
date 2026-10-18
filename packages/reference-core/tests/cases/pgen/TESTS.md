# PGEN ledger

Statuses: `live`, `weak` (positive live, negative needs the per-system bake), `blocked-on-per-system`,
`dropped` (namespace law). Ids are append-only; never renumber. SPEC.md carries
the full 22-case checklist with missing surfaces; this ledger tracks proof.

| id | claim | status | proof |
| --- | --- | --- | --- |
| CORE-PGEN-01 | Flow probes render own tagName, paint style plus css props, stamp markers | live | case green, 27 probes plus css leg, markers plus layer |
| CORE-PGEN-02 | Text probes incl single-letters render and resolve null-hole arrays | live | case green, 29 probes, holed array paints 1r then 4r |
| CORE-PGEN-03 | Form probes keep native behavior with style props, no key leakage | live | case green, fill plus toggle plus select legs, no leaks |
| CORE-PGEN-04 | Table probes render inside a real table, Caption paints | live | case green, nesting pins, col childless, Caption paints |
| CORE-PGEN-05 | Media probes carry native attrs, void elements render childless | live | case green, native attrs land, svg host plus native child |
| CORE-PGEN-06 | Interactive probes toggle natively, hover plus dark arms paint | live | case green, details toggles, hover plus dark arms paint |
| CORE-PGEN-07 | SVG shapes render camelCase tagNames with style props | dropped | namespace law, never |
| CORE-PGEN-08 | SVG text renders with the text-collision probe | dropped | namespace law, never |
| CORE-PGEN-09 | SVG gradients render with url refs resolving | dropped | namespace law, never |
| CORE-PGEN-10 | SVG containers render camelCase tagNames | dropped | namespace law, never |
| CORE-PGEN-11 | Obj Var Map render right, override refs land, pattern pack absent | live | case green, override refs land, 109-export census |
| CORE-PGEN-12 | Roster jsx equals E1 equals live canon at pinned 101 | live | case green, drift-injection trips by name |
| CORE-PGEN-13 | E1 equals napi props equals E4 union, aliases resolve, seam binds | live | case green, drift-injection trips by name |
| CORE-PGEN-14 | variant plus colorMode stamp, passthrough reaches host, no leaks | live | case green, stamps land, sweep empty |
| CORE-PGEN-15 | Every family probe assigns at the bound entry, bogus keys fail TS2353 | live | case green, both TS2353 pinned |
| CORE-PGEN-16 | Token literals assign, mistype fails TS2322, hatch documented | live | case green, TS2322 pinned |
| CORE-PGEN-17 | Alias assigns good, fails bad TS2322; recipe call fails nested TS2353 plus bad value TS2322 | live | case green, all three codes pinned |
| CORE-PGEN-18 | Arms plus null-hole arrays assign, bare sm fails TS2353 | live | case green, TS2353 pinned |
| CORE-PGEN-19 | Hosts resolve with overrides, arity fails TS2314, cross-host fails TS2322 | live | case green, both codes pinned |
| CORE-PGEN-20 | Forbidden imports fail TS2305, as fails TS2353, E4 panda-clean | live | case green, both codes pinned |
| CORE-PGEN-21 | SVG presentation props through style keys | dropped | namespace law, never |
| CORE-PGEN-22 | Bound entry narrows system tokens, foreign tokens fail | live | case green, TS2322 pinned on foreign token |

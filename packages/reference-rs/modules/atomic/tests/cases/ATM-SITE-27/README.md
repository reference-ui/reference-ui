# ATM-SITE-27 — object ternary arms, mid-array slots, ternary args

Object-valued
ternary arms route through the per-prop object machinery (`extract::recipes::walk` /
the responsive extractor test): `color: flag ? { base } : { base }` compiles both
arms. When one object arm is unfoldable the resolvable arm is kept and
the other diagnosed — v2 drops the whole conditional, so this case promotes that finding. Mid-array
ternary slots project both arms at the same breakpoint, elision (`[1, , 3]`)
keeps arity, and top-level `css(u ? a : b)` extracts both arms where v2 drops
the call (SUPERIOR).

Plans: duplicate arm wants dedupe to one plan per value; the elision
array emits one authored plan; the ternary-containing array emits zero
plans (no static key matches every evaluated array — the runtime miss is
a follow-up for the fold table, not this pin).

# ATM-SITE-27 — object ternary arms, mid-array slots, ternary args

Overmatch station-only (SPEC-V2-17 + SPEC-V2-27 + §3 S3). Object-valued
ternary arms route through the per-prop object machinery (`walk.rs:177` /
`responsive.rs:42`): `color: flag ? { base } : { base }` compiles both
arms. When one object arm is unfoldable the resolvable arm is kept and
the other diagnosed — v2 drops the whole conditional
(`literal-evaluator.md:75-76`), so this station promotes S3. Mid-array
ternary slots project both arms at the same breakpoint, elision (`[1, , 3]`)
keeps arity, and top-level `css(u ? a : b)` extracts both arms where v2 drops
the call (`calls.rs:556`, SUPERIOR S1).

Plans: duplicate arm wants dedupe to one plan per value; the elision
array emits one authored plan; the ternary-containing array emits zero
plans (no static key matches every evaluated array — the runtime miss is
a follow-up for the fold-table crew, not this pin).

Panda: `conditional_output.rs:631` (`ternary_with_object_branches`),
`:683` (`array_mid_slot_ternary_projects_conditional_at_index`),
elision `calls.rs:1946`.

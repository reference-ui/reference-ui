# ATM-SITE-37 — array spreads flatten or refuse without shifting arity

Overmatch array-spread station (SPEC-V2-28, Ph1 refuse + Ph3 flatten).

A literal or const-array spread flattens in place: inside a responsive
value array every spliced leaf lands at its own breakpoint index
(`['1px', ...['2px', '3px'], '4px']` → base/sm/md/lg) and plans once as
one array value; inside a `css([...])` merge list every spliced element
merges beside its siblings, with literal leaves and holes skipping
silently. A dynamic spread, a const array carrying objects in a value
array, or a reassigned array refuses with one located diagnostic — the
value array yields zero wants (never shifts a sibling a breakpoint
early) with zero plans, while merge-list siblings still merge. Reassigned
arrays name the write.

Inputs: `arrays.ts` (refused dynamic/object/stale spreads, literal and
const twins, clean control), `merge.ts` (refused dynamic/stale spreads,
literal, const, and leaf-skip twins).

Panda flattens literal spreads (`calls.rs:1265`) and drops unresolvable
spreads silently (`literal-evaluator.md:47-48`); our diagnostic is the
upgrade (S5).

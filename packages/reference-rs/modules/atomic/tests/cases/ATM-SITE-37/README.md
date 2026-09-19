# ATM-SITE-37 — array spreads refuse without shifting arity

Overmatch Ph1 array-spread refusal (SPEC-V2-28, Ph1 half).

A spread inside a responsive value array refuses the whole array with
one located diagnostic: the spread's length is unknown, so any later
sibling would land on the wrong breakpoint (`4` must never slide a slot
early), and the plan side yields nothing either — wants and plans
agree at zero. A spread inside a `css([...])` merge list refuses with
one located diagnostic while sibling elements still merge (merge lists
have no positional arity to corrupt). Literal spreads (`...[2, 3]`)
refuse in Ph1 like dynamic ones; flattening them in place rides Ph3
(SPEC-V2-63).

Inputs: `arrays.ts` (dynamic spread, literal twin, clean control),
`merge.ts` (dynamic merge-list spread, literal merge-list spread).

Panda flattens literal spreads (`calls.rs:1265`) and drops unresolvable
spreads silently (`literal-evaluator.md:47-48`); our diagnostic is the
upgrade (S5).

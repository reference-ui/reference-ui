# NEO-SITE-25 — binary fold bundle paints from folded wants

The world styles six nodes from the Overmatch Ph3 binary-fold slice: one
`css()` call mixing folded arithmetic (`2 + 3`, `n * 2`) and string concat
(`1 + 'px'`, `n + 'px'`); one call with all-literal short-circuit winners
(`truthyText && 'red'`, `emptyText || 'blue'`); one call with both `??`
shapes (a folded-ternary null taking `'teal'`, a present const keeping
`'red'`); one call with three folded ternary tests (strict-equal,
const-bound, arithmetic) whose dead arms mint nothing; one call with
one-, two-, and three-hop member reads; and a refused bitwise position
(`5 | 3`) beside a static sibling. The spec checks the sheet carries
exactly the fourteen utilities, every folded shape paints its declaration,
the dead arms stay out of the sheet, the refused node paints only its
sibling, and a fresh compile of the frozen request reports the `|`
warning located at the world's `app.ts` — sync itself succeeds.

Evidence: `[overmatch]` SPEC-V2-10 (concat), SPEC-V2-11 (arithmetic),
SPEC-V2-12 (comparison), SPEC-V2-19 (short-circuit), SPEC-V2-31
(member reads), SPEC-V2-66 (dead arms); `[panda-v2]` `calls.rs:1148`
(concat), `:1168` (arithmetic), `:1499` (logical literals), `:1535`–`:1614`
(equality and comparison), `conditional_output.rs:47` (dead arm);
`[atm]` ATM-SITE-33, ATM-SITE-29.

> Search terms: binary fold, arithmetic, concat, comparison, short-circuit, nullish, dead arm, member read, site/fold, NEO-SITE-23

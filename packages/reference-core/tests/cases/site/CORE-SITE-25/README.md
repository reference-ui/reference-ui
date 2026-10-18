# CORE-SITE-25 — binary fold bundle paints from folded wants

The world styles six nodes from the binary-fold slice: one
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

Evidence: concat, arithmetic, comparison, short-circuit, member reads, dead
arms; Panda v2 call tests (concat, arithmetic, logical literals, equality and
comparison) and conditional-output tests (dead arm); ATM-SITE-33, ATM-SITE-29.

> Search terms: binary fold, arithmetic, concat, comparison, short-circuit, nullish, dead arm, member read, site/fold, CORE-SITE-23

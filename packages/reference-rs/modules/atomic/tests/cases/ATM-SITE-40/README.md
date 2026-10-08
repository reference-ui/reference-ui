# ATM-SITE-40: Aliased Imports Resolve by Exported Name

Overmatch Ph4 crew-B station for SPEC-V2-52 (aliased value import), the
entry-54 remainder (missing export through an alias), and import cycles
(xf-C6) through the binding walk (SPEC-V2-76).

`import { brand as primary }` resolves `primary` to the `brand` export of
THAT file — never through the project name bag, which keys by declared
name and left every alias dynamic. Aliased scalars, object spreads,
member reads, and array indices all follow the binding. A missing export
and three cycle shapes (re-export loop, import-then-export loop in v2's
`cross_file.rs:545` shape, and a self re-export) each yield no origin
from the guard and warn once with siblings kept — fail-closed-plus
diagnostic where v2 drops the call silently. Cycle names are declared
nowhere on purpose, so the merge-bag fallback genuinely misses and the
guard stays observable at the station.

Inputs: `tokens.ts` (the aliased scalar, object, and array), `app.ts`
(the four alias wins), `missing.ts`, and the `cycle-*`, `v2cycle-*`,
and `self*` cycle pairs with their consumers.

Panda: `cross_file.rs:421` (alias), `:488` (missing export), `:545`
(cycle guard). Bare and default imports stay out for the rider slices;
`export *` stays unresolved (documented remainder).

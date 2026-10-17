# ATM-SITE-26 — `css()` call-arg unwraps

Call-arg unwraps.

A `css()` argument wrapped in parens, `as const`, `satisfies`, non-null
`!`, or the `.ts`-only `<any>` assertion extracts exactly like the bare
arg: the wrapper erases at compile time, so the walker unwraps to the
inner expression before matching. Conditional arms unwrap the same way,
and value-level `<any>` / `TSInstantiationExpression` unwrap through the
shared helper — one unwrap rule for args, arms, JSX style blocks, and
value positions, with authored plans mirroring every want.

Inputs: `calls.ts` (bare control + four mainstream wraps + mixed
multi-arg), `legacy.ts` (`.ts`-only `<any>` at arg and value level plus
the `w<string>` instantiation probe), `branches.ts` (wrapped ternary
arms over an unbound test).

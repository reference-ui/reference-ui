# ATM-SITE-28 — mutated `let` drops, unmutated `let`/`var` resolve

Overmatch Ph1 mutation tracking (SPEC-V2-35, SPEC-V2-02, SPEC-V2-53).

An `AssignmentExpression`, `UpdateExpression`, or for-in/of head marks the
written binding mutated. Mutated bindings are dynamic: every use yields zero
wants plus one `Dynamic mutated binding '…' (reassigned at file:line:col)`
warning naming the write — never the stale init. Unmutated `let`/`var`
(controls) and unmutated `export let` (cross-file arm) resolve exactly like
`const` with zero diagnostics.

Inputs: `mutated.ts` (plain, compound, update, member-root, for-of, and
spread writes), `controls.ts` (unmutated `let`/`var`/`const`), `tokens.ts`
(unmutated + mutated `export let`), `app.ts` (cross-file uses).

Ph3 arms (`objects.ts`, SPEC-V2-34 object half): const objects record
identifier values and static spreads — pure reads only, every source an
unmutated const. Baked entries strip when their source is written (dep
provenance in `extract/scope/`); station-level mutation interplay stays
with the open Ph1 verdict.

Panda: `scope.rs:224` (`let_mutated_drops_resolution`), `:203`/`:241`
(unmutated `let`/`var`), `cross_file.rs:502`
(`export_let_currently_folds_too`).

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

Panda: `scope.rs:224` (`let_mutated_drops_resolution`), `:203`/`:241`
(unmutated `let`/`var`), `cross_file.rs:502`
(`export_let_currently_folds_too`).

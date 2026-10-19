# ATM-SITE-28 — mutated `let` drops, unmutated `let`/`var` resolve

Mutation tracking.

An `AssignmentExpression`, `UpdateExpression`, or for-in/of head marks the
written binding mutated. Mutated bindings are dynamic: every use yields zero
wants plus one `Dynamic mutated binding '…' (reassigned at file:line:col)`
warning naming the write — never the stale init. Unmutated `let`/`var`
(controls) and unmutated `export let` (cross-file arm) resolve exactly like
`const` with zero diagnostics.

Inputs: `mutated` (plain, compound, update, member-root, for-of, and
spread writes), `controls` (unmutated `let`/`var`/`const`), `tokens`
(unmutated + mutated `export let`), `app` (cross-file uses).

Object half (`objects`): const objects record
identifier values and static spreads — pure reads only, every source an
unmutated const. Baked entries strip when their source is written (dep
provenance in `extract::scope`); case-level mutation interplay is still open.

Cross-file (`tokens` + `app`): a spread inside an
exported object resolves through the binding walk — whole-object and
spread uses both fold color and padding with zero diagnostics, exactly
like the same-file `cardButton`.

Delete arm (`delete`): `delete
obj.prop` poisons the root exactly like an assignment — member reads,
computed deletes, and spreads each drop with a `Dynamic mutated binding`
warning naming the delete (`deleted at file:line:col`), never the stale
init. Outside the 35/02/53 contract; those arms are byte-untouched.

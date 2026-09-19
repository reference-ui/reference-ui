# ATM-SITE-77 — branching leaves in const objects fan out on spread

Overmatch Ph3 fold-side of SPEC-V2-55 (imported conditional both arms).

Both collectors record branching leaves in const-object inits — ternary
and nullish props scoop their static leaves — and every use fans out:
spreads lower one want and one authored plan per leaf, member reads
resolve every leaf, and the imported instance (via the merge-era project
bag) behaves exactly like the same-file one. Same-file spreads of
branching objects were fully silent before this slice (zero entries,
zero diagnostics); now they paint.

Props with no static value diagnose instead of going silent: a
call-valued prop and a both-sides-dynamic nullish prop each yield one
located `property 'x' of 'y' has no static style value` diagnostic with
static siblings kept. Partially static props (one literal arm, one
dynamic arm) keep the static arm; the dropped arm stays silent until a
collect-time residue channel exists (Ph4 remainder, reported with the
slice and verified by the tail crew: the recorded entry is
bit-identical to a fully-static leaf, so no use-site reading of the
existing empty-marker machinery can recover the loss). Genuinely empty
objects stay silent.

Inputs: `tokens.ts` (the imported conditional and nullish const
objects), `app.ts` (imported and same-file spreads and member reads,
dynamic-prop, partial-prop, both-dynamic, and empty controls).

Panda: `cross_file.rs:1368`
(`imported_conditional_object_keeps_encode_branches`). Aliased imports
of the conditional object (SPEC-V2-52) and binding-carried re-exports
(SPEC-V2-76) ride Ph4; the plain imported instance pinned here keeps its
observable when the mechanism changes.

# ATM-SITE-77 — branching leaves in const objects fan out on spread

Fold side of the imported conditional (both arms).

Both collectors record branching leaves in const-object inits — ternary
and nullish props scoop their static leaves — and every use fans out:
spreads lower one want and one authored plan per leaf, member reads
resolve every leaf, and the imported instance (via the project
bag) behaves exactly like the same-file one.

Props with no static value diagnose instead of going silent: a
call-valued prop and a both-sides-dynamic nullish prop each yield one
located `property 'x' of 'y' has no static style value` diagnostic with
static siblings kept. Partially static props (one literal arm, one
dynamic arm) keep the static arm and diagnose the dropped arm at every
use: the collector flags the loss on the recorded entry at collect
time (residue channel — the silence pin, flipped), and
spreads, member reads (single and multi-hop), element reads, computed
keys, `?.` chains, and fenced calls over the entry each warn
`ATM-W-PARTIAL-OBJECT-PROP` with siblings kept. The imported nullish
twin's dropped `left` arm diagnoses too (same paint as v2's silent
right-operand rule, plus our diagnostic). Genuinely
empty objects stay silent.

Reads consumed mid-fold (binary/unary/template operands, call
arguments) and partially static scalar inits resolve and diagnose
nothing; they carry no leaf-level provenance.

Granularity, pinned: keys read single leaves, so a key over a clean
entry of a dirty object stays silent; helpers bake captures whole, so
a call whose descriptor closed over a dirty object warns even when
the body reads only clean members (descriptor-level taint).

Inputs: `tokens.ts` (the imported conditional, nullish, and partial
const objects), `app.ts` (imported and same-file spreads and member
reads, dynamic-prop, partial-prop, both-dynamic, and empty controls,
plus element, key, chain, fence, deep, imported-partial, and the two
union arms that prove residue threads through spread merging),
`alias.ts` (aliased imports of the conditional objects), `barrel.ts`
plus `via-barrel.ts` (re-exported conditional, nullish, and partial
objects), and the `cycle-*` pair plus `cycled.ts` (re-export cycle).

Aliased
imports of the conditional objects fan out exactly like the plain
instance, and barrel re-exports — including the aliased `fb` and
`partial` hops — resolve by binding with the residue flag riding the
walk to the origin. The re-export cycle guards to a spread warning
with its sibling kept. The plain imported instance keeps its
observable under the new mechanism, as pinned.

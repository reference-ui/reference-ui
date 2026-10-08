# ATM-DIAG-08

Exact plan present: diagnostics predicts a static runtime query, the same
key is in `stylePlans`, and userspace is silent. The prediction is
verifiable because the declaration is fully static — the expected lookup
and the final plan agree exactly.

`input/src/static.ts` holds one static `css({ color: 'red' })` declaration.
The spec pins the presence half (the exact `color:red` plan exists) and the
silence half (no userspace diagnostics), both green today. The RED HINGE is
the opt-in compiler channel recording the exact expected lookup: no
independent AST analysis and no channel plumbing exist yet, so the hinge
fails until Slice 2 lands them.

Mechanism: the diagnostics analysis derives the expected key from the
compiler's parsed program (independent of extraction), and final proof
compares it against the plan set. Related: `ATM-DIAG-07` (channel
isolation), `ATM-DIAG-09` (exact plan absent, sibling), `ATM-DIAG-10`
(incidental coverage), `ATM-HARVEST-01` (plan floor). Contract:
[SPEC.md](../../../SPEC.md). Operation Error Correct, Slice 0.

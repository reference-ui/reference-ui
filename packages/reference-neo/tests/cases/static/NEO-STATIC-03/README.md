# NEO-STATIC-03 — a runtime value outside the static set yields the MERGE-06 diagnostic, not a ghost, and an unsatisfiable `staticCss` request fails sync

The world declares `ember`/`gold` tokens but pre-generates only `ember`,
then paints a hit probe and a miss probe through runtime values: `ember`
finds its atom while `gold` — a real token with no atom — resolves to no
class plus exactly one dev diagnostic, on the page and node-side. The
`bad/` project beside it declares a `staticCss` value referencing a token
that does not exist; the spec syncs it node-side and checks the rejection
names the ref while leaving no half-written folder behind.

Pairs with NEO-MERGE-06 (the runtime-side proof of the same D11 rule):
MERGE-06 shows a bare runtime value with no atom goes classless loudly;
this case shows the same for a value the static set left out, plus the
sync-time failure for a request the engine cannot satisfy.

Evidence: `[atm]` ATM-STATIC-03 (conditions, non-color wildcards,
unsatisfiable-request diagnostic), ATM-GHOST-02 (runtime keys match the
sheet); `[atm]` P1 #14 (`docs/evidence/atomic-claims.md:315`); `[decision
D11]` with NEO-MERGE-06; `[decision D13]` for the located missing ref.

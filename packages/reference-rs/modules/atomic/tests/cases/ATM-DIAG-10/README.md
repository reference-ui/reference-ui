# ATM-DIAG-10

Incidental coverage: the diagnosed site contributes no plan, but another
source or harvest contributes the exact key, so runtime paints and
userspace is silent. A warning would be a false positive — the declaration
the author wrote at the refused site resolves against a plan that exists.

`input/src/coverage.ts` refuses a dynamic `color: themeVar` site while a
static `css({ color: 'red' })` source (backed by a `'red'` harvest pool)
contributes the exact `color:red` key. The spec pins the plan's existence,
then asserts userspace silence. RED: the dynamic warning still fires on
default today and no coverage proof suppresses it, so the silence
assertion fails.

Mechanism: final proof compares each expected key against the whole final
plan set regardless of which source contributed it; only a miss with an
exact expected lookup reaches userspace. Related: `ATM-DIAG-07` (channel
isolation), `ATM-DIAG-08` (exact plan present), `ATM-DIAG-09` (exact plan
absent, sibling), `ATM-HARVEST-01` (harvest floor, net-new mint).
Contract: [SPEC.md](../../../SPEC.md). Operation Error Correct, Slice 0.

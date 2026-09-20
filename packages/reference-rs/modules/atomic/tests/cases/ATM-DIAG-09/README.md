# ATM-DIAG-09

Exact plan absent: when diagnostics predicts a static runtime query
and the final plan omits it, the author gets one located non-fatal
warning naming that exact declaration — the proof that a runtime miss
is visible at compile time.

`input/src/absent.ts` (shape borrowed from `ATM-COND-12`) declares
`_hovr: { color: 'red.500' }` beside a static `color: 'blue.500'`
sibling. The want exists (predicted query) but resolve drops it
(`lower_conditions` warns `UnknownCondition` and returns `None`),
so no plan, class, or CSS mentions `hovr`. The spec asserts the
prediction, the omission, exactly one `ATM-W-UNKNOWN-CONDITION`
warning, its `absent.ts` line/column, and that its message names the
exact absent declaration (`color`, `red.500`).

Mechanism: `resolve/mod.rs::lower_conditions` drops the whole want
with the exact key (raw `when` + prop + authored value) in hand, but
pushes an unlocated warning naming only the condition. Prime witness
per architect ruling Q4 (`VOYAGE-LOG-2.md`); whether runtime actually
queries that key awaits the parallel Slice-0 witness-hunt verdict —
if the hunt finds no witness, this station's target release carries
zero new userspace warnings instead. Related: `ATM-DIAG-08` (exact
plan present), `ATM-DIAG-10` (incidental coverage), `ATM-DIAG-11`
(unknown values stay compiler-only), `ATM-COND-12` (drop shape).
Contract: `docs/missions/operation-error-correct.md` stations +
[atomic SPEC.md](../../../SPEC.md) (row pending sibling crew).
Operation Error Correct Slice 0; observed red hinge: the warning is
unlocated and names only `_hovr`, not the declaration.
Search: diagnostics exact absent plan proof UnknownCondition miss.

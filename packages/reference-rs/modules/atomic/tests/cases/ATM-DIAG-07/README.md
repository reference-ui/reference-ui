# ATM-DIAG-07

Channel isolation: the default compile contains no dynamic, spread,
harvest-sink, or dead-branch diagnostics. Those facts move to the opt-in
compiler channel — `logs: ['compiler']` returns them only in the separate
`compilerDiagnostics` list, never mixed into userspace `diagnostics`.

`input/src/channel.ts` mirrors the `ATM-DIAG-05` refusal battery (a dynamic
call argument, a dynamic member, two dynamic identifiers, an interpolated
template, a computed key, an unknown prop, a dynamic spread, a non-object
condition value, an unknown `r` breakpoint, and a mutated binding) plus a
folded ternary that names its dead arm. The spec asserts default-first that
no `ATM-W-DYNAMIC-*`, `ATM-W-UNFOLDABLE-SPREAD`, `ATM-I-HARVEST-SINK`, or
`ATM-I-DEAD-BRANCH` item appears on the default channel, then that the
opt-in compile populates `compilerDiagnostics` while `diagnostics` stays
clean. RED: both halves fail — the families warn on default today and no
channel plumbing exists.

Mechanism: additive-optional `logs?: LogChannel[]` on the request and
`compilerDiagnostics?` on the result, populated only when requested so
default bytes are identical (architect ruling Q2, oracle O1). Related:
`ATM-DIAG-02` (fail-closed warnings), `ATM-DIAG-05` (diagnostic precision),
`ATM-DIAG-11` (unknown values compiler-only), `ATM-HARVEST-01` (harvest
floor), `ATM-LEAF-01` (dead-branch fold). Contract: [SPEC.md](../../../SPEC.md).
Operation Error Correct, Slice 0.

# ATM-TOKEN-12 — Missing-reference

A `{path}` reference that names no token in the dump is a sync-failing
error diagnostic naming the ref with file:line, never Panda's silently
escaped literal (`colors\.nope`).
Contract: [SPEC.md](../../../SPEC.md).

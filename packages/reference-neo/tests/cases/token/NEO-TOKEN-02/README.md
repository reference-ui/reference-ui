# NEO-TOKEN-02 — a missing {colors.nope} ref fails sync with a located diagnostic (no escaped literal)

The world carries an embedded missing ref (`border: '2px solid
{colors.nope}'`) alongside a valid brand token, and opts out of the runner
sync hook (`"sync": false`) so the spec can drive `sync()` node-side. The
spec asserts the rejection names the ref and the authoring file with line,
never Panda's escaped literal (`colors\.nope`) or a `var(--colors-nope)`
ghost, and leaves no half-written folder behind.

Evidence: `[panda-v1]` `core/__tests__/serialize.test.ts` (contrast: Panda
escapes the literal); `[atm]` ATM-TOKEN-12; `[decision D13]`.

> Search terms: typo, unknown token, unresolved, file:line, token/refs, token/diagnostics, NEO-TOKEN-01

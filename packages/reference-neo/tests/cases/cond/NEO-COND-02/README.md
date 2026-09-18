# NEO-COND-02 — `_hover` × `sm` × `_dark` compose in one rule that paints only when all three hold

The world calls `css()` with a base `bg` plus a `_hover`/`sm`/`_dark`
triple arm on twin and live probes inside a container root. The spec
checks the sheet carries exactly three utilities with `@container`
outside the `[data-color-mode=dark]` wrap and one `:is()` hover list,
the twin paints only with a wide root plus dark mode, and the live
probe needs a real hover on top of the same two.

Evidence: `[atm]` ATM-COND-01, ATM-COND-02, ATM-COND-03 (R1 probe
`/tmp/cond-batch2-r1/probe.mjs` 02a emits the triple rule; value-position
`bg: { sm: … }` warns and emits nothing); `[panda-v1]`
`vendor/panda-v1/packages/core/__tests__/atomic-rule.test.ts:331`
"nested > property" (the contrast: Panda `@media` plus four-way dark
selectors, Reference `@container` plus single D1 wrap).

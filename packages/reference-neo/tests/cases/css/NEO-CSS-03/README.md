# NEO-CSS-03 — Shorthand alias `w` last-wins over a responsive `width` object

The world calls `css({ width: { base: '50px', md: '60px' }, w: '70px' })` and,
for the symmetric order, `css({ w: '70px', width: { base: '50px', md: '60px' }
})`. The spec checks the sheet carries all three atoms while the runtime
merge evicts per author order: the alias call resolves to the single `w_70px`
class and paints 70px in narrow and wide containers, and the reversed call
resolves to both responsive classes and paints 50px/60px per container.

Evidence: `[atm]` ATM-COND-17, ATM-MERGE-01, ATM-MERGE-02; `[panda-v1]`
`vendor/panda-v1/packages/core/__tests__/atomic-rule.test.ts:39` "should
resolve shorthand".

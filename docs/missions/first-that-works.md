# Mission: firstThatWorks() — out as a primitive

Status: `idea` (HQ, 2026-09-19). Split out of the Panda v2 parity
mission. **We do not implement `firstThatWorks`.** This file is a
parity pass: prove users can already get the outcome through language
we have, and add tests **only if the case index says we don't**.

## Verdict

Panda's `firstThatWorks('min(60rem, 100%)', '75%')` is a fake value
form. The compiler does not know what works on the user's engine. It
reverses a list and emits **one rule with two declarations**, betting
on CSS parse-error recovery in the browser.

That grain is not ours. We dedupe **atoms**, not rules. An atom is
`(prop, value, when, important)`. Two declarations of `width` in one
utility would be a second IR. Don't.

Users already have two honest doors. The work is to make sure those
doors are in the vocabulary (stations + neo paint) so nobody needs
Panda's helper.

## What users do instead

### 1. `@supports` — feature query, two atoms

```ts
css({
  width: '75%',
  '@supports (width: min(60rem, 100%))': {
    width: 'min(60rem, 100%)',
  },
})
```

Two atoms (different `when`), two utilities, runtime concatenates both.
Old engine skips the wrap. New engine applies `min()`. The **browser**
still decides. The author wrote the question.

### 2. Two style rules — same prop, two classes

A baseline want plus a conditioned want for the same property is two
rules in `@layer utilities`. Not one blob. `className` concatenation
is how the instance carries both. `globalCss` is the sheet-level
cousin if they want a named class.

React `style={{}}` cannot hold two `width` keys. Native `cssText` or a
real stylesheet can, if someone truly wants the cascade-quirk blob —
that path is `style` / `globalCss`, not the atomic compiler.

## What this is not

- Not a runtime export, not an extractor fold, not emit-side reverse,
  not a magic string `'firstThatWorks(a, b)'`.
- Not a substitute for a support policy (no browserslist in this repo;
  that question stays unasked).
- Not Overmatch language. Overmatch parked this as a value-form feature
  ([operation-overmatch.md](completed/operation-overmatch.md) §4).

Panda still exists as contrast: `vendor/panda` `first_that_works_calls.rs`
+ `first_that_works.rs`. Read if a crew needs to see why the primitive
is the wrong grain. Do not port it.

## The pass (tests only, and only if missing)

Simple tests. The outcome is: a user can do progressive enhancement
without `firstThatWorks`.

**First act: search the case index. Do not file a station that already
exists.**

```bash
pnpm agent:cases search "supports" --limit=15 --compact
pnpm agent:cases search "COND-19" --limit=10 --compact
pnpm agent:cases search "@supports" --limit=10 --compact
pnpm agent:cases search "firstThatWorks" --limit=5 --compact
```

Also try `feature quer`, `at-rule`, `SITE-09`. READMEs are the index —
a thin README will not come back for `supports`. If the index is quiet,
read `atomic/SPEC.md` COND rows and `neo/tests/cases/cond/SPEC.md`
before inventing an id.

Known starting points (re-verify; this list is not a tick):

| Likely hit | What it actually proves | Enough for this pass? |
|---|---|---|
| `ATM-COND-19` | `@supports` keys lower to at-rules, nest outside `@container`, no `:@supports` fragment | Routing / vocabulary. **Not** a same-prop fallback. |
| `ATM-COND-21` | Queryless `@supports` refuses | Fail-closed. Keep. |
| `NEO-COND-15` | Mixed `@supports` + container + hover **paints** | Browser twin of COND-19. Still `display: grid`, not `min()`. |
| `ATM-LAYER-12` | `globalCss` stacked at-rules brace | Global cousin. |
| `NEO-SITE-09` | `width: 50px` plus `@media { width: 60px }` — two rules, same prop, paints across resize | Closest "two style rules" pin. Media, not supports. |

`firstThatWorks` should stay **zero hits**. That is correct.

### Add only the holes

If after search the fallback shape is unpinned, file **small** stations
(claim / symbols / siblings / `> Search terms:`):

1. **`@supports` fallback on the same prop** — `css({ width: '75%', '@supports (width: min(60rem, 100%))': { width: 'min(60rem, 100%)' } })`. Assert two atoms, two classes, sheet has the unconditioned rule and a real `@supports` wrap, runtime concat includes both, no `firstThatWorks` string anywhere. Suggested homes: `ATM-COND-*` + a neo cond paint twin.
2. **Two style rules** — if SITE-09 is judged too media-specific, one atomic + one neo pin that two utilities for the same prop both land on the instance (not merge last-wins; that is `NEO-MERGE-01` and is the opposite).

Do not add a `firstThatWorks()` fold test. Do not add the magic string.
Do not expand emit to two declarations in one rule.

## Done when

- Case-index search is quoted in the evidence note (queries + hit list).
- `@supports` is confirmed as vocabulary (existing COND-19/21 + COND-15, or a new fallback station if those don't cover same-prop `min()`).
- Two-rule same-prop is confirmed (SITE-09 or a new pin).
- Zero `firstThatWorks` implementation.

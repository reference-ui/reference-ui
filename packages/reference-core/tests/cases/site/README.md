# CORE-SITE — extraction shapes through Core

Proves the extract boundary end to end: which call sites and JSX shapes become utilities in a synced world, and which fail closed with a diagnostic and no ghost class. The engine decides what is a site; Core proves the decision paints — or provably paints nothing — in a browser. Host surface is small: `src/sync/compile-files.ts` and `src/sync/jsx-elements.ts`. `SPEC.md` carries the site contract; `TESTS.md` is the case ledger.

> Search terms: call sites, extraction shapes, ghost class, fail closed, host elements, jsxElements, css identity, re-export identity, binding walk

## Cases

- CORE-SITE-01 — literal ternary: both arms compile, the runtime arm paints.
- CORE-SITE-02 — local const member `theme.primary` compiles through `css()`.
- CORE-SITE-03 — identifier spread `...rest` unpacks beside its sibling.
- CORE-SITE-04 — import alias `css as c` and namespace `ui.css` are sites.
- CORE-SITE-05 — a local function named `css` is not a site.
- CORE-SITE-06 — dynamic call value `color: pick()` mints no ghost and emits a located warning.
- CORE-SITE-07 — cross-file `const` from `styles.ts` resolves.
- CORE-SITE-08 — logical `...(ok && extra)` with const `ok` lands `extra`.
- CORE-SITE-09 — a string `@media` key is an at-rule, not a selector.
- CORE-SITE-10 — `css={{}}` on a primitive equals `css()`.
- CORE-SITE-11 — configured `jsxElements: ['Chart']` makes `<Chart p="1r">` a host.
- CORE-SITE-12 — unlisted `<Random>` and lowercase `<div color>` are not hosts.
- CORE-SITE-13 — boolean attr `<Div border />` compiles the boolean macro form.
- CORE-SITE-14 — with no hosts resolvable, the hostless tag yields nothing.
- CORE-SITE-15 — object ternary arms in a `_hover` prop: both compile, the hovered arm paints.
- CORE-SITE-16 — member tags (`<NS.Panel />`) extract under concatenated hosts.
- CORE-SITE-17 — const-bound ternary color arms extract and paint.
- CORE-SITE-18 — static key plus spread ternary paints the runtime winner.
- CORE-SITE-19 — call-form `css([...])` merges and paints last-wins.
- CORE-SITE-20 — wrapped `css()` args paint exactly like the bare arg.
- CORE-SITE-21 — impure helper leaves refuse while static siblings paint.
- CORE-SITE-22 — runtime-`ok` `...(ok && extra)` lands `extra`.
- CORE-SITE-23 — element access, folded keys, and flattened spreads paint.
- CORE-SITE-24 — whole-object args lower while refused positions diagnose.
- CORE-SITE-25 — binary fold bundle paints from folded wants.
- CORE-SITE-26 — interpolated templates fold in browser, dynamic parts diagnose.
- CORE-SITE-27 — a param shadows the cross-file `const` it names.
- CORE-SITE-28 — `css()` identity flows through a consumer re-export.
- CORE-SITE-29 — a nested import spread paints red.
- CORE-SITE-30 — partial-guard Tabs indicator paints both arms.

Parent: [tests/cases/](../README.md).

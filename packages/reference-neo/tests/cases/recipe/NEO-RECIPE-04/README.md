# NEO-RECIPE-04 — Compound variants emit after simple variants and require every predicate

The world defines one `banner` recipe whose accent+lg compound carries a base
background plus `_hover` and `_dark` arms. The spec checks the compound rule
prints after the simple rules, on/off predicate combinations paint only when
every predicate holds, and the hover and dark arms fire on the compound class.

Evidence: `[panda-v1]` `core/__tests__/static-css.test.ts:2102`; `[atm]`
ATM-RECIPE-05.

> Search terms: compoundVariants, cascade order, predicate conjunction, all-match, recipe/compounds, recipe/cascade, NEO-RECIPE-01

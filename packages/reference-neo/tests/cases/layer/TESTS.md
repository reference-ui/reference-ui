# LAYER ledger — `NEO-LAYER-*`

Statuses: `open`, `in-progress`, `done`, `blocked-on-rs`, `approved-absence`, `retired`. Ids are append-only; never renumber.

| id | claim | status | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| NEO-LAYER-01 | The order statement names all six layers `reset, global, base, tokens, recipes, utilities`; empty-layer bodies may be omitted yet a utility still beats a token-layer rule of higher specificity | done | ATM-LAYER-02..04 | — | computed cascade: utility wins over a more specific token rule | reference-lib L70; Panda v1 layers module |
| NEO-LAYER-02 | Two systems: package layers nest under `@layer <name>`; a downstream utility overrides an upstream recipe; portable tokens are scoped by `[data-layer]` | done | RS-4 (BAS-EXTEND) | — | two-system world; computed override; portable `[data-layer]` scoping in a consumer frame | contracts portable fixture |
| NEO-LAYER-03 | `@keyframes` and `@font-face` live in `@layer global`, once | done | ATM-LAYER-05/06 | — | sheet count is one each; animation runs on the element | reference-lib 31 keyframes / 3 faces; global-css research §6.4; cross-ref TOKEN-11 (registry) |
| NEO-LAYER-04 | `normalizeCss: true` (default) opens with the reset layer; `false` omits it | done | ATM-LAYER-08 | `sync/index.ts` + `sync/reset.ts` (case hosted under `sync/`) | `box-sizing` computed on a plain `div` (+ `h1` margin zeroed); `normalizeCss: false` twin keeps the preamble, drops the body | global-css research §6.3; ATM-LAYER-08 |
| NEO-LAYER-05 | Recipe rules precede utilities; a utility overrides a recipe base of equal specificity | done | ATM-RECIPE-03 | — | computed: utility wins on a recipe host | ATM-RECIPE-03 |
| NEO-LAYER-06 | Token-layer vars are visible to recipes and utilities (`var(--colors-…)` resolves) | done | ATM-LAYER-* | — | computed color on a recipe part and a utility, both from one token | reference-lib |

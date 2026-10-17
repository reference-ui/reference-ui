# ATM-COND-22 — css()-nested `&:where(:has())` substitutes inside the functional arg

the one lib line the engine never
proved (`packages/reference-lib/src/core/theme/primitives/forms/button.ts:24` verbatim). The authored-nested functional selector
substitutes `&` to the class while `>`, `:only-child`, and the comma
group inside `:has()` pass through scoped. Emitted `:where(`/`:has(` were
already HAVE (NEO-COND-11, NEO-GLOBAL-10, PARITY P3); this case pins
the css()-nested authoring. Browser paint arm: NEO-COND-16.

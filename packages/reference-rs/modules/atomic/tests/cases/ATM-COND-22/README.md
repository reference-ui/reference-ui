# ATM-COND-22 — css()-nested `&:where(:has())` substitutes inside the functional arg

Overmatch station-only (SPEC-V2-49): the one lib line the engine never
proved (`button.ts:29` verbatim). The authored-nested functional selector
substitutes `&` to the class while `>`, `:only-child`, and the comma
group inside `:has()` pass through scoped. Emitted `:where(`/`:has(` were
already HAVE (NEO-COND-11, NEO-GLOBAL-10, PARITY P3); this station pins
the css()-nested authoring. Browser paint arm: NEO-COND-16.

Panda: `nested_selector_parity.rs:389` (`nested_where`), arg twin `:224`.

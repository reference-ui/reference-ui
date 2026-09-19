# ATM-SITE-82

A const bound to `null` strips silently: same-file `const n = null` and an imported null both vanish like literal nulls while `padding` and `margin` siblings emit, with zero diagnostics.
Symbols: `literal_leaf` (`scope/init.rs`, `constants/collect.rs`), `AtomValue::Null`, `css_value_from_authored`.
Siblings: `ATM-SITE-28` (mutation wording), `ATM-LEAF-05` (ternary holes), `ATM-UNIT-02` (invalid values).
Contract: [SPEC.md](../../../SPEC.md).

> Search terms: null const, NullLiteral, silent strip, hole, dynamic identifier, invalid CSS value
